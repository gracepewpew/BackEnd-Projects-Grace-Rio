const express = require('express');
const { Feedback } = require('../models');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { validate, validateEmail } = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/', validate(['name', 'email', 'subject', 'message']), asyncHandler(async (req, res) => {
  const { name, email, subject, message, category } = req.body;
  if (!validateEmail(email)) return res.status(400).json({ message: 'Format email tidak valid.' });

  const allowedCategories = ['pertanyaan', 'keluhan', 'saran', 'lainnya'];
  const safeCategory = allowedCategories.includes(category) ? category : 'pertanyaan';

  const feedback = await Feedback.create({ name, email, category: safeCategory, subject, message });
  res.status(201).json({ message: 'Pesan Anda berhasil dikirim dan akan ditinjau oleh admin.', data: feedback });
}));

router.get('/', auth, authorize('admin'), asyncHandler(async (req, res) => {
  const feedbacks = await Feedback.findAll({ order: [['createdAt', 'DESC']] });
  res.json({ data: feedbacks });
}));

router.patch('/:id/status', auth, authorize('admin'), validate(['status']), asyncHandler(async (req, res) => {
  const allowedStatus = ['new', 'read', 'replied'];
  if (!allowedStatus.includes(req.body.status)) return res.status(400).json({ message: 'Status feedback tidak valid.' });

  const feedback = await Feedback.findByPk(req.params.id);
  if (!feedback) return res.status(404).json({ message: 'Feedback tidak ditemukan.' });

  await feedback.update({ status: req.body.status });
  res.json({ message: 'Status feedback berhasil diperbarui.', data: feedback });
}));

router.delete('/:id', auth, authorize('admin'), asyncHandler(async (req, res) => {
  const feedback = await Feedback.findByPk(req.params.id);
  if (!feedback) return res.status(404).json({ message: 'Feedback tidak ditemukan.' });

  await feedback.destroy();
  res.json({ message: 'Feedback berhasil dihapus.' });
}));

module.exports = router;
