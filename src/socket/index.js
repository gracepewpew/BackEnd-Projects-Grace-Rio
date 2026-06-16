const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const { User } = require('../models');

let io;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'] }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Token socket tidak ditemukan.'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clinic-secret');
      const user = await User.findByPk(decoded.id);
      if (!user || !user.isActive) return next(new Error('User socket tidak valid.'));
      socket.user = user;
      return next();
    } catch (error) {
      return next(new Error('Token socket tidak valid.'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    socket.join(`user:${user.id}`);
    socket.join(`role:${user.role}`);

    socket.on('joinConversation', (conversationId) => {
      if (conversationId) socket.join(`conversation:${conversationId}`);
    });

    socket.on('leaveConversation', (conversationId) => {
      if (conversationId) socket.leave(`conversation:${conversationId}`);
    });
  });

  return io;
}

function getIO() {
  return io;
}

function emitRole(role, event, payload) {
  if (io) io.to(`role:${role}`).emit(event, payload);
}

function emitUser(userId, event, payload) {
  if (io && userId) io.to(`user:${userId}`).emit(event, payload);
}

function emitConversation(conversationId, event, payload) {
  if (io && conversationId) io.to(`conversation:${conversationId}`).emit(event, payload);
}

module.exports = {
  initSocket,
  getIO,
  emitRole,
  emitUser,
  emitConversation
};
