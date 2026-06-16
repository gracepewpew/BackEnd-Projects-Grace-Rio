const express = require('express');
const { Patient, User, Appointment } = require('../models');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', auth, authorize('admin', 'customer_service'), asyncHandler(async (req, res) => {
  const patients = await Patient.findAll({
    include: [
      { model: User, attributes: ['id', 'name', 'email', 'phone', 'isActive'] },
      { model: Appointment }
    ],
    order: [['id', 'ASC']]
  });
  res.json({ data: patients });
}));

router.get('/me', auth, authorize('pasien'), asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({
    where: { userId: req.user.id },
    include: [{ model: User, attributes: ['id', 'name', 'email', 'phone'] }, { model: Appointment }]
  });
  if (!patient) return res.status(404).json({ message: 'Data pasien belum ditemukan.' });
  res.json({ data: patient });
}));

router.get('/:id', auth, authorize('admin', 'customer_service'), asyncHandler(async (req, res) => {
  const patient = await Patient.findByPk(req.params.id, {
    include: [{ model: User, attributes: ['id', 'name', 'email', 'phone', 'isActive'] }, { model: Appointment }]
  });
  if (!patient) return res.status(404).json({ message: 'Pasien tidak ditemukan.' });
  res.json({ data: patient });
}));

router.put('/:id', auth, authorize('admin', 'pasien'), asyncHandler(async (req, res) => {
  const patient = await Patient.findByPk(req.params.id);
  if (!patient) return res.status(404).json({ message: 'Pasien tidak ditemukan.' });

  if (req.user.role === 'pasien' && patient.userId !== req.user.id) {
    return res.status(403).json({ message: 'Pasien hanya boleh mengubah datanya sendiri.' });
  }

  await patient.update(req.body);
  res.json({ message: 'Data pasien berhasil diperbarui.', data: patient });
}));

module.exports = router;
