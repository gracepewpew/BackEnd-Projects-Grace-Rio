const express = require('express');
const { Op } = require('sequelize');
const { User, Patient, Doctor, Department, Appointment, Feedback, ChatConversation } = require('../models');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/stats', auth, asyncHandler(async (req, res) => {
  const stats = {};

  if (req.user.role === 'admin') {
    stats.users = await User.count();
    stats.patients = await Patient.count();
    stats.doctors = await Doctor.count();
    stats.customerServices = await User.count({ where: { role: 'customer_service' } });
    stats.departments = await Department.count();
    stats.appointments = await Appointment.count();
    stats.requestedAppointments = await Appointment.count({ where: { status: { [Op.in]: ['pending', 'requested'] } } });
    stats.scheduledAppointments = await Appointment.count({ where: { status: 'scheduled' } });
    stats.feedbacks = await Feedback.count();
    stats.openChats = await ChatConversation.count({ where: { status: 'open' } });
    stats.chatHistory = await ChatConversation.count();
  }

  if (req.user.role === 'pasien') {
    const patient = await Patient.findOne({ where: { userId: req.user.id } });
    const patientWhere = {
      [Op.or]: [
        { patientId: patient ? patient.id : 0 },
        { email: req.user.email }
      ]
    };
    stats.myAppointments = await Appointment.count({ where: patientWhere });
    stats.requestedAppointments = await Appointment.count({ where: { ...patientWhere, status: { [Op.in]: ['pending', 'requested'] } } });
    stats.scheduledAppointments = await Appointment.count({ where: { ...patientWhere, status: 'scheduled' } });
    stats.completedAppointments = await Appointment.count({ where: { ...patientWhere, status: 'completed' } });
    stats.openChats = await ChatConversation.count({ where: { patientUserId: req.user.id, status: 'open' } });
  }

  if (req.user.role === 'dokter') {
    const doctor = await Doctor.findOne({ where: { userId: req.user.id } });
    stats.myAppointments = await Appointment.count({ where: { doctorId: doctor ? doctor.id : 0 } });
    stats.scheduledAppointments = await Appointment.count({ where: { doctorId: doctor ? doctor.id : 0, status: 'scheduled' } });
    stats.requestedAppointments = await Appointment.count({ where: { doctorId: doctor ? doctor.id : 0, status: 'requested' } });
    stats.completedAppointments = await Appointment.count({ where: { doctorId: doctor ? doctor.id : 0, status: 'completed' } });
  }

  if (req.user.role === 'customer_service') {
    stats.requestedAppointments = await Appointment.count({ where: { status: { [Op.in]: ['pending', 'requested'] } } });
    stats.scheduledAppointments = await Appointment.count({ where: { status: 'scheduled' } });
    stats.todayAppointments = await Appointment.count({ where: { appointmentDate: new Date().toISOString().slice(0, 10) } });
    stats.openChats = await ChatConversation.count({ where: { status: 'open' } });
    stats.myHandledChats = await ChatConversation.count({ where: { assignedCsId: req.user.id } });
  }

  res.json({ data: stats });
}));

module.exports = router;
