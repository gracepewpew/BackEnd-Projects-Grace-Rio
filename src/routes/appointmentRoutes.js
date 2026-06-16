const express = require('express');
const { Op } = require('sequelize');
const { Appointment, AppointmentCancellation, Department, Doctor, Patient, User } = require('../models');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const authorize = require('../middleware/authorize');
const { validate, validateEmail, validatePhone } = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { emitRole, emitUser } = require('../socket');

const router = express.Router();

const includeAppointment = [
  { model: Doctor, include: [{ model: Department }], required: false },
  { model: Department, required: false },
  { model: Patient, include: [{ model: User, attributes: ['id', 'name', 'email', 'phone', 'profilePhoto'] }], required: false },
  { model: User, as: 'AssignedByCs', attributes: ['id', 'name', 'email', 'role'], required: false }
];

function getTodayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function isValidFutureDate(dateString) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateString || ''))) return false;
  const [year, month, day] = String(dateString).split('-').map(Number);
  const candidate = new Date(year, month - 1, day);
  if (candidate.getFullYear() !== year || candidate.getMonth() !== month - 1 || candidate.getDate() !== day) return false;
  return dateString >= getTodayString();
}

function isValidTime(timeString) {
  return /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(String(timeString || ''));
}

async function getPatientFromRequest(req) {
  if (!req.user || req.user.role !== 'pasien') return null;
  return Patient.findOne({ where: { userId: req.user.id } });
}

async function findAppointment(id) {
  return Appointment.findByPk(id, { include: includeAppointment });
}

function notifyAppointment(appointment, eventName = 'appointment:updated') {
  emitRole('customer_service', eventName, { data: appointment });
  emitRole('admin', eventName, { data: appointment });
  if (appointment?.Patient?.userId) {
    emitUser(appointment.Patient.userId, eventName, { data: appointment });
  }
  if (appointment?.Doctor?.userId) {
    emitUser(appointment.Doctor.userId, eventName, { data: appointment });
  }
}

// Pasien login cukup mengirim nama/no RM otomatis dan keluhan. Status awal: PENDING.
router.post('/', optionalAuth, asyncHandler(async (req, res) => {
  const { patientName, email, phone, departmentId, doctorId, appointmentDate, appointmentTime, symptoms, patientNumber } = req.body;

  if (req.user && req.user.role === 'pasien') {
    const patient = await getPatientFromRequest(req);
    if (!patient) return res.status(404).json({ message: 'Data pasien belum ditemukan.' });
    if (!symptoms || String(symptoms).trim() === '') return res.status(400).json({ message: 'Keluhan pasien wajib diisi.' });

    const appointment = await Appointment.create({
      patientId: patient.id,
      patientName: req.user.name,
      patientNumber: patient.medicalRecordNumber,
      email: req.user.email,
      phone: req.user.phone || '-',
      symptoms,
      status: 'pending'
    });
    const fullAppointment = await findAppointment(appointment.id);
    notifyAppointment(fullAppointment, 'appointment:created');
    return res.status(201).json({ message: 'Keluhan berhasil dikirim. Status awal appointment adalah PENDING dan akan diproses Customer Service.', data: fullAppointment });
  }

  // Form publik tetap bisa membuat appointment langsung dari halaman template publik.
  const required = { patientName, email, phone, departmentId, doctorId, appointmentDate, appointmentTime };
  const missingFields = Object.entries(required).filter(([, value]) => value === undefined || value === null || String(value).trim() === '').map(([key]) => key);
  if (missingFields.length) return res.status(400).json({ message: 'Data appointment belum lengkap.', missingFields });

  if (!validateEmail(email)) return res.status(400).json({ message: 'Format email tidak valid.' });
  if (!validatePhone(phone)) return res.status(400).json({ message: 'Nomor telepon tidak valid. Gunakan angka, +, -, atau spasi.' });
  if (!isValidFutureDate(appointmentDate)) return res.status(400).json({ message: 'Tanggal appointment tidak valid atau sudah lewat.' });
  if (!isValidTime(appointmentTime)) return res.status(400).json({ message: 'Jam appointment tidak valid.' });

  const doctor = await Doctor.findByPk(doctorId);
  if (!doctor || !doctor.isActive) return res.status(404).json({ message: 'Dokter tidak ditemukan atau tidak aktif.' });

  const department = await Department.findByPk(departmentId);
  if (!department || !department.isActive) return res.status(404).json({ message: 'Poli tidak ditemukan atau tidak aktif.' });
  if (Number(doctor.departmentId) !== Number(departmentId)) {
    return res.status(400).json({ message: 'Dokter yang dipilih tidak sesuai dengan poli.' });
  }

  const appointment = await Appointment.create({
    doctorId,
    departmentId,
    patientName,
    email,
    phone,
    appointmentDate,
    appointmentTime,
    symptoms,
    patientNumber: patientNumber || null,
    status: 'scheduled'
  });
  const fullAppointment = await findAppointment(appointment.id);
  notifyAppointment(fullAppointment, 'appointment:created');
  return res.status(201).json({ message: 'Appointment berhasil dibuat.', data: fullAppointment });
}));

router.get('/', auth, asyncHandler(async (req, res) => {
  const where = {};

  if (req.query.status) where.status = req.query.status;
  if (req.query.date) where.appointmentDate = req.query.date;

  if (req.user.role === 'pasien') {
    const patient = await Patient.findOne({ where: { userId: req.user.id } });
    where[Op.or] = [{ patientId: patient ? patient.id : 0 }, { email: req.user.email }];
  }

  if (req.user.role === 'dokter') {
    const doctor = await Doctor.findOne({ where: { userId: req.user.id } });
    where.doctorId = doctor ? doctor.id : 0;
  }

  const appointments = await Appointment.findAll({
    where,
    include: includeAppointment,
    order: [['createdAt', 'DESC'], ['appointmentDate', 'ASC'], ['appointmentTime', 'ASC']]
  });

  res.json({ data: appointments });
}));

router.get('/cancellations', auth, authorize('admin'), asyncHandler(async (req, res) => {
  const cancellations = await AppointmentCancellation.findAll({
    include: [
      { model: Appointment, include: includeAppointment, required: false },
      { model: Doctor, include: [{ model: Department }], required: false }
    ],
    order: [['createdAt', 'DESC']]
  });
  res.json({ data: cancellations });
}));

router.get('/:id', auth, asyncHandler(async (req, res) => {
  const appointment = await findAppointment(req.params.id);
  if (!appointment) return res.status(404).json({ message: 'Appointment tidak ditemukan.' });

  if (req.user.role === 'pasien') {
    const patient = await Patient.findOne({ where: { userId: req.user.id } });
    if (!patient || appointment.patientId !== patient.id) {
      return res.status(403).json({ message: 'Pasien hanya boleh melihat appointment sendiri.' });
    }
  }

  if (req.user.role === 'dokter') {
    const doctor = await Doctor.findOne({ where: { userId: req.user.id } });
    if (!doctor || appointment.doctorId !== doctor.id) {
      return res.status(403).json({ message: 'Dokter hanya boleh melihat appointment sendiri.' });
    }
  }

  res.json({ data: appointment });
}));

// CS hanya memilih poli dan dokter. Jadwal tanggal/jam ditentukan dokter.
router.patch('/:id/assign', auth, authorize('admin', 'customer_service'), validate(['doctorId', 'departmentId']), asyncHandler(async (req, res) => {
  const { doctorId, departmentId } = req.body;

  const appointment = await Appointment.findByPk(req.params.id);
  if (!appointment) return res.status(404).json({ message: 'Appointment tidak ditemukan.' });
  if (['completed', 'cancelled'].includes(appointment.status)) {
    return res.status(400).json({ message: 'Appointment yang sudah completed/cancelled tidak bisa dikirim ulang.' });
  }

  const department = await Department.findByPk(departmentId);
  if (!department || !department.isActive) return res.status(404).json({ message: 'Poli tidak ditemukan atau tidak aktif.' });

  const doctor = await Doctor.findByPk(doctorId);
  if (!doctor || !doctor.isActive) return res.status(404).json({ message: 'Dokter tidak ditemukan atau tidak aktif.' });
  if (Number(doctor.departmentId) !== Number(departmentId)) {
    return res.status(400).json({ message: 'Dokter yang dipilih tidak sesuai dengan poli. Pilih poli terlebih dahulu lalu pilih dokter sesuai poli.' });
  }

  await appointment.update({
    doctorId,
    departmentId,
    assignedByCsId: req.user.id,
    appointmentDate: null,
    appointmentTime: null,
    status: 'requested'
  });

  const fullAppointment = await findAppointment(appointment.id);
  notifyAppointment(fullAppointment, 'appointment:requested');
  res.json({ message: 'Appointment berhasil dikirim ke dokter. Status berubah menjadi REQUESTED.', data: fullAppointment });
}));

// Dokter menentukan jadwal tanggal dan jam. Setelah disimpan, status menjadi SCHEDULED.
router.patch('/:id/schedule', auth, authorize('dokter'), validate(['appointmentDate', 'appointmentTime']), asyncHandler(async (req, res) => {
  const { appointmentDate, appointmentTime } = req.body;
  const appointment = await Appointment.findByPk(req.params.id);
  if (!appointment) return res.status(404).json({ message: 'Appointment tidak ditemukan.' });

  const doctor = await Doctor.findOne({ where: { userId: req.user.id } });
  if (!doctor || appointment.doctorId !== doctor.id) {
    return res.status(403).json({ message: 'Dokter hanya boleh menjadwalkan appointment sendiri.' });
  }
  if (['completed', 'cancelled'].includes(appointment.status)) {
    return res.status(400).json({ message: 'Appointment completed/cancelled tidak dapat diubah lagi.' });
  }
  if (!['requested', 'scheduled'].includes(appointment.status)) {
    return res.status(400).json({ message: 'Appointment belum dikirim oleh Customer Service ke dokter.' });
  }
  if (!isValidFutureDate(appointmentDate)) return res.status(400).json({ message: 'Tanggal tidak valid, tanggal sudah lewat, atau tanggal tidak sesuai bulan.' });
  if (!isValidTime(appointmentTime)) return res.status(400).json({ message: 'Jam appointment tidak valid.' });

  await appointment.update({ appointmentDate, appointmentTime, status: 'scheduled' });
  const fullAppointment = await findAppointment(appointment.id);
  notifyAppointment(fullAppointment, 'appointment:scheduled');
  res.json({ message: 'Jadwal berhasil ditentukan dokter. Status berubah menjadi SCHEDULED.', data: fullAppointment });
}));

router.patch('/:id/status', auth, authorize('admin', 'dokter'), validate(['status']), asyncHandler(async (req, res) => {
  const allowedStatus = ['completed', 'cancelled'];
  const { status, cancelReason } = req.body;
  if (!allowedStatus.includes(status)) return res.status(400).json({ message: 'Status hanya bisa diubah menjadi completed atau cancelled.' });

  const appointment = await Appointment.findByPk(req.params.id);
  if (!appointment) return res.status(404).json({ message: 'Appointment tidak ditemukan.' });
  if (['completed', 'cancelled'].includes(appointment.status)) {
    return res.status(400).json({ message: 'Status sudah final dan tidak bisa diubah lagi.' });
  }

  if (req.user.role === 'dokter') {
    const doctor = await Doctor.findOne({ where: { userId: req.user.id } });
    if (!doctor || appointment.doctorId !== doctor.id) {
      return res.status(403).json({ message: 'Dokter hanya boleh mengubah appointment sendiri.' });
    }
  }

  if (status === 'completed' && appointment.status !== 'scheduled') {
    return res.status(400).json({ message: 'Appointment hanya bisa COMPLETE setelah status SCHEDULED.' });
  }

  if (status === 'cancelled') {
    if (!cancelReason || String(cancelReason).trim().length < 5) {
      return res.status(400).json({ message: 'Alasan cancel wajib diisi minimal 5 karakter.' });
    }
    await AppointmentCancellation.create({
      appointmentId: appointment.id,
      doctorId: appointment.doctorId,
      patientName: appointment.patientName,
      patientNumber: appointment.patientNumber,
      reason: String(cancelReason).trim()
    });
  }

  await appointment.update({ status });
  const fullAppointment = await findAppointment(appointment.id);
  notifyAppointment(fullAppointment, status === 'cancelled' ? 'appointment:cancelled' : 'appointment:completed');
  res.json({ message: 'Status appointment berhasil diubah.', data: fullAppointment });
}));

router.delete('/:id', auth, authorize('admin'), asyncHandler(async (req, res) => {
  const appointment = await Appointment.findByPk(req.params.id);
  if (!appointment) return res.status(404).json({ message: 'Appointment tidak ditemukan.' });
  await appointment.destroy();
  notifyAppointment(appointment, 'appointment:deleted');
  res.json({ message: 'Appointment berhasil dihapus.' });
}));

module.exports = router;
