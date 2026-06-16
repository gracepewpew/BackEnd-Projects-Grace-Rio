const jwt = require('jsonwebtoken');
const { User } = require('../models');

async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clinic-secret');
    const user = await User.findByPk(decoded.id);
    if (user && user.isActive) req.user = user;
    return next();
  } catch (error) {
    return next();
  }
}

module.exports = optionalAuth;
