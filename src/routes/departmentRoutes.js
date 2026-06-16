const express = require('express');
const { Department, Doctor } = require('../models');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const departments = await Department.findAll({
    include: [{ model: Doctor, attributes: ['id', 'name', 'specialization', 'schedule', 'isActive'] }],
    order: [['id', 'ASC']]
  });
  res.json({ data: departments });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const department = await Department.findByPk(req.params.id, { include: Doctor });
  if (!department) return res.status(404).json({ message: 'Poli tidak ditemukan.' });
  res.json({ data: department });
}));

router.post('/', auth, authorize('admin'), validate(['name', 'description', 'location']), asyncHandler(async (req, res) => {
  const department = await Department.create(req.body);
  res.status(201).json({ message: 'Poli berhasil ditambahkan.', data: department });
}));

router.put('/:id', auth, authorize('admin'), asyncHandler(async (req, res) => {
  const department = await Department.findByPk(req.params.id);
  if (!department) return res.status(404).json({ message: 'Poli tidak ditemukan.' });
  await department.update(req.body);
  res.json({ message: 'Poli berhasil diperbarui.', data: department });
}));

router.delete('/:id', auth, authorize('admin'), asyncHandler(async (req, res) => {
  const department = await Department.findByPk(req.params.id);
  if (!department) return res.status(404).json({ message: 'Poli tidak ditemukan.' });
  await department.destroy();
  res.json({ message: 'Poli berhasil dihapus.' });
}));

module.exports = router;
