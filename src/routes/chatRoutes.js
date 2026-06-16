const express = require('express');
const { ChatConversation, ChatMessage, User } = require('../models');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const asyncHandler = require('../utils/asyncHandler');
const { emitRole, emitUser, emitConversation } = require('../socket');

const router = express.Router();

const conversationInclude = [
  { model: User, as: 'PatientUser', attributes: ['id', 'name', 'email', 'phone', 'profilePhoto'] },
  { model: User, as: 'AssignedCs', attributes: ['id', 'name', 'email', 'role'] },
  { model: User, as: 'ClosedBy', attributes: ['id', 'name', 'role'] },
  { model: ChatMessage, separate: true, limit: 1, order: [['createdAt', 'DESC']] }
];

async function getConversationForAccess(req, conversationId) {
  const conversation = await ChatConversation.findByPk(conversationId, {
    include: [
      { model: User, as: 'PatientUser', attributes: ['id', 'name', 'email', 'phone', 'profilePhoto'] },
      { model: User, as: 'AssignedCs', attributes: ['id', 'name', 'email', 'role'] }
    ]
  });
  if (!conversation) return null;

  if (req.user.role === 'pasien' && conversation.patientUserId !== req.user.id) return false;
  if (req.user.role === 'dokter') return false;
  return conversation;
}

router.post('/conversations', auth, authorize('pasien'), asyncHandler(async (req, res) => {
  let conversation = await ChatConversation.findOne({
    where: { patientUserId: req.user.id, status: 'open' },
    include: conversationInclude
  });

  if (!conversation) {
    conversation = await ChatConversation.create({
      patientUserId: req.user.id,
      status: 'open',
      subject: req.body.subject || 'Live Chat Pasien',
      lastMessageAt: new Date()
    });
    await ChatMessage.create({
      conversationId: conversation.id,
      senderUserId: req.user.id,
      senderRole: 'pasien',
      message: 'Halo Customer Service, saya butuh bantuan.',
      messageType: 'system',
      isRead: false
    });
    conversation = await ChatConversation.findByPk(conversation.id, { include: conversationInclude });
    emitRole('customer_service', 'chat:conversationCreated', { data: conversation });
    emitRole('admin', 'chat:conversationCreated', { data: conversation });
  }

  res.status(201).json({ message: 'Live chat siap digunakan.', data: conversation });
}));


router.post('/conversations/from-patient', auth, authorize('customer_service', 'admin'), asyncHandler(async (req, res) => {
  const { patientUserId, subject } = req.body;
  const patient = await User.findByPk(patientUserId);
  if (!patient || patient.role !== 'pasien') return res.status(404).json({ message: 'User pasien tidak ditemukan.' });

  let conversation = await ChatConversation.findOne({
    where: { patientUserId: patient.id, status: 'open' },
    include: conversationInclude
  });

  if (!conversation) {
    conversation = await ChatConversation.create({
      patientUserId: patient.id,
      assignedCsId: req.user.role === 'customer_service' ? req.user.id : null,
      status: 'open',
      subject: subject || 'Live Chat Appointment',
      lastMessageAt: new Date()
    });
    await ChatMessage.create({
      conversationId: conversation.id,
      senderUserId: req.user.id,
      senderRole: req.user.role,
      message: 'Customer Service membuka percakapan untuk membantu proses appointment.',
      messageType: 'system',
      isRead: false
    });
    conversation = await ChatConversation.findByPk(conversation.id, { include: conversationInclude });
    emitUser(patient.id, 'chat:conversationCreated', { data: conversation });
    emitRole('customer_service', 'chat:conversationCreated', { data: conversation });
    emitRole('admin', 'chat:conversationCreated', { data: conversation });
  }

  res.status(201).json({ message: 'Percakapan pasien siap dibuka.', data: conversation });
}));

router.get('/conversations', auth, asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.status) where.status = req.query.status;

  if (req.user.role === 'pasien') where.patientUserId = req.user.id;
  if (req.user.role === 'dokter') return res.status(403).json({ message: 'Dokter tidak memiliki akses live chat pasien.' });

  const conversations = await ChatConversation.findAll({
    where,
    include: conversationInclude,
    order: [['lastMessageAt', 'DESC'], ['createdAt', 'DESC']]
  });
  res.json({ data: conversations });
}));

router.get('/conversations/:id/messages', auth, asyncHandler(async (req, res) => {
  const conversation = await getConversationForAccess(req, req.params.id);
  if (conversation === false) return res.status(403).json({ message: 'Tidak boleh melihat chat ini.' });
  if (!conversation) return res.status(404).json({ message: 'Percakapan tidak ditemukan.' });

  const messages = await ChatMessage.findAll({
    where: { conversationId: conversation.id },
    include: [{ model: User, as: 'Sender', attributes: ['id', 'name', 'role', 'profilePhoto'] }],
    order: [['createdAt', 'ASC']]
  });
  res.json({ data: messages, conversation });
}));

router.post('/conversations/:id/messages', auth, asyncHandler(async (req, res) => {
  const conversation = await getConversationForAccess(req, req.params.id);
  if (conversation === false) return res.status(403).json({ message: 'Tidak boleh mengirim chat ini.' });
  if (!conversation) return res.status(404).json({ message: 'Percakapan tidak ditemukan.' });
  if (conversation.status === 'closed') return res.status(400).json({ message: 'Percakapan sudah diakhiri.' });

  const { message } = req.body;
  if (!message || String(message).trim() === '') return res.status(400).json({ message: 'Pesan tidak boleh kosong.' });

  const updatePayload = { lastMessageAt: new Date() };
  if (req.user.role === 'customer_service' && !conversation.assignedCsId) {
    updatePayload.assignedCsId = req.user.id;
  }
  await conversation.update(updatePayload);

  const chatMessage = await ChatMessage.create({
    conversationId: conversation.id,
    senderUserId: req.user.id,
    senderRole: req.user.role,
    message,
    messageType: 'text',
    isRead: false
  });

  const fullMessage = await ChatMessage.findByPk(chatMessage.id, {
    include: [{ model: User, as: 'Sender', attributes: ['id', 'name', 'role', 'profilePhoto'] }]
  });

  emitConversation(conversation.id, 'chat:message', { conversationId: conversation.id, data: fullMessage });
  emitUser(conversation.patientUserId, 'chat:message', { conversationId: conversation.id, data: fullMessage });
  emitRole('customer_service', 'chat:message', { conversationId: conversation.id, data: fullMessage });
  emitRole('admin', 'chat:message', { conversationId: conversation.id, data: fullMessage });

  res.status(201).json({ message: 'Pesan berhasil dikirim.', data: fullMessage });
}));

router.patch('/conversations/:id/close', auth, authorize('customer_service', 'admin'), asyncHandler(async (req, res) => {
  const conversation = await ChatConversation.findByPk(req.params.id);
  if (!conversation) return res.status(404).json({ message: 'Percakapan tidak ditemukan.' });
  if (conversation.status === 'closed') return res.status(400).json({ message: 'Percakapan sudah ditutup.' });

  await conversation.update({
    status: 'closed',
    closedAt: new Date(),
    closedById: req.user.id,
    lastMessageAt: new Date()
  });

  const systemMessage = await ChatMessage.create({
    conversationId: conversation.id,
    senderUserId: req.user.id,
    senderRole: req.user.role,
    message: `Percakapan diakhiri oleh ${req.user.name}.`,
    messageType: 'system',
    isRead: false
  });

  const fullMessage = await ChatMessage.findByPk(systemMessage.id, {
    include: [{ model: User, as: 'Sender', attributes: ['id', 'name', 'role', 'profilePhoto'] }]
  });

  emitConversation(conversation.id, 'chat:closed', { conversationId: conversation.id, data: conversation, message: fullMessage });
  emitUser(conversation.patientUserId, 'chat:closed', { conversationId: conversation.id, data: conversation, message: fullMessage });
  emitRole('customer_service', 'chat:closed', { conversationId: conversation.id, data: conversation, message: fullMessage });
  emitRole('admin', 'chat:closed', { conversationId: conversation.id, data: conversation, message: fullMessage });

  res.json({ message: 'Live chat berhasil diakhiri dan tersimpan di history admin.', data: conversation });
}));

module.exports = router;
