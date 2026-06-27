const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, Patient, Doctor } = require('../models');
const auth = require('../middleware/auth');
const { validate, validateEmail, validatePhone } = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'profiles');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    cb(null, `profile-${req.user.id}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) {
      return cb(new Error('File foto harus JPG, PNG, WEBP, atau GIF.'));
    }
    return cb(null, true);
  }
});

function createToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET || 'clinic-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
}

router.post('/register', validate(['name', 'email', 'password', 'confirmPassword', 'phone']), asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword, phone, birthDate, gender, bloodType, address, profilePhoto } = req.body;

  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'Format email tidak valid.' });
  }
  if (!validatePhone(phone)) {
    return res.status(400).json({ message: 'Nomor telepon hanya boleh berisi angka, +, -, atau spasi. Minimal 8 karakter.' });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ message: 'Password minimal 8 karakter.' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Password dan Re-enter Password tidak sama.' });
  }

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ message: 'Email sudah terdaftar.' });
  }

  const user = await User.create({ name, email, password, phone, profilePhoto: profilePhoto || null, role: 'pasien' });

  const lastPatient = await Patient.findOne({ order: [['id', 'DESC']] });
  let nextRmNum = 1;
  if (lastPatient?.medicalRecordNumber) {
    const match = lastPatient.medicalRecordNumber.match(/(\d+)$/);
    if (match) nextRmNum = parseInt(match[1], 10) + 1;
  }

  await Patient.create({
    userId: user.id,
    medicalRecordNumber: `RM-${String(nextRmNum).padStart(5, '0')}`,
    birthDate: birthDate || null,
    gender: gender || null,
    bloodType: bloodType || null,
    address: address || null
  });

  const token = createToken(user);
  return res.status(201).json({ message: 'Register berhasil.', token, user });
}));

router.post('/login', validate(['email', 'password']), asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Email atau password salah.' });
  }

  if (!user.isActive) {
    return res.status(403).json({ message: 'Akun tidak aktif.' });
  }

  const token = createToken(user);
  return res.json({ message: 'Login berhasil.', token, user });
}));

router.get('/me', auth, asyncHandler(async (req, res) => {
  return res.json({ user: req.user });
}));

router.get('/profile', auth, asyncHandler(async (req, res) => {
  const include = [];
  if (req.user.role === 'pasien') include.push({ model: Patient });
  if (req.user.role === 'dokter') include.push({ model: Doctor });
  const user = await User.findByPk(req.user.id, { include });
  return res.json({ data: user });
}));


router.post('/profile-photo', auth, upload.single('profilePhoto'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'File foto profile belum dipilih.' });
  const photoUrl = `/uploads/profiles/${req.file.filename}`;
  await req.user.update({ profilePhoto: photoUrl });
  return res.json({ message: 'Foto profile berhasil diupload.', profilePhoto: photoUrl, user: req.user });
}));

router.put('/profile', auth, asyncHandler(async (req, res) => {
  const { name, email, phone, profilePhoto, birthDate, gender, bloodType, address } = req.body;

  if (email && !validateEmail(email)) return res.status(400).json({ message: 'Format email tidak valid.' });
  if (phone && !validatePhone(phone)) return res.status(400).json({ message: 'Nomor telepon tidak valid.' });

  if (email && email !== req.user.email) {
    const existingEmail = await User.findOne({ where: { email, id: { [Op.ne]: req.user.id } } });
    if (existingEmail) return res.status(409).json({ message: 'Email sudah digunakan akun lain.' });
  }

  const userPayload = {};
  if (name !== undefined) userPayload.name = name;
  if (email !== undefined) userPayload.email = email;
  if (phone !== undefined) userPayload.phone = phone;
  if (profilePhoto !== undefined) userPayload.profilePhoto = profilePhoto || null;

  await req.user.update(userPayload);

  if (req.user.role === 'pasien') {
    const patient = await Patient.findOne({ where: { userId: req.user.id } });
    if (patient) {
      await patient.update({
        birthDate: birthDate || null,
        gender: gender || null,
        bloodType: bloodType || null,
        address: address || null
      });
    }
  }

  const include = req.user.role === 'pasien' ? [{ model: Patient }] : [];
  const updatedUser = await User.findByPk(req.user.id, { include });
  return res.json({ message: 'Profile berhasil diperbarui.', data: updatedUser, user: updatedUser });
}));

module.exports = router;
