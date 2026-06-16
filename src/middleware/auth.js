const jwt = require('jsonwebtoken');
const { User } = require('../models');

async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Token tidak ditemukan. Silakan login terlebih dahulu.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clinic-secret');
    const user = await User.findByPk(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Akun tidak valid atau tidak aktif.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token tidak valid atau sudah kedaluwarsa.' });
  }
}

module.exports = auth;
