const express = require('express');
const { Doctor, Department, User } = require('../models');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { validate, validateEmail, validatePhone } = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.departmentId) where.departmentId = req.query.departmentId;
  if (req.query.active === 'true') where.isActive = true;

  const doctors = await Doctor.findAll({
    where,
    include: [{ model: Department, attributes: ['id', 'name', 'location'] }],
    order: [['id', 'ASC']]
  });
  res.json({ data: doctors });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const doctor = await Doctor.findByPk(req.params.id, { include: Department });
  if (!doctor) return res.status(404).json({ message: 'Dokter tidak ditemukan.' });
  res.json({ data: doctor });
}));

router.post('/', auth, authorize('admin'), validate(['name', 'email', 'phone', 'departmentId', 'specialization', 'schedule']), asyncHandler(async (req, res) => {
  const { name, email, phone, departmentId, specialization, schedule, image, createLogin } = req.body;

  if (!validateEmail(email)) return res.status(400).json({ message: 'Format email tidak valid.' });
  if (!validatePhone(phone)) return res.status(400).json({ message: 'Nomor telepon tidak valid.' });

  let userId = null;
  if (createLogin === true || createLogin === 'true') {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(409).json({ message: 'Email dokter sudah dipakai akun lain.' });
    const user = await User.create({ name, email, phone, password: 'doctor12345', role: 'dokter' });
    userId = user.id;
  }

  const doctor = await Doctor.create({ userId, name, email, phone, departmentId, specialization, schedule, image });
  res.status(201).json({ message: 'Dokter berhasil ditambahkan.', data: doctor });
}));

router.put('/:id', auth, authorize('admin'), asyncHandler(async (req, res) => {
  const doctor = await Doctor.findByPk(req.params.id);
  if (!doctor) return res.status(404).json({ message: 'Dokter tidak ditemukan.' });
  await doctor.update(req.body);
  res.json({ message: 'Data dokter berhasil diperbarui.', data: doctor });
}));

router.delete('/:id', auth, authorize('admin'), asyncHandler(async (req, res) => {
  const doctor = await Doctor.findByPk(req.params.id);
  if (!doctor) return res.status(404).json({ message: 'Dokter tidak ditemukan.' });
  await doctor.destroy();
  res.json({ message: 'Dokter berhasil dihapus.' });
}));

module.exports = router;
