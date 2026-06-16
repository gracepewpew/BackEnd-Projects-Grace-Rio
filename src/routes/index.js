const express = require('express');
const authRoutes = require('./authRoutes');
const departmentRoutes = require('./departmentRoutes');
const doctorRoutes = require('./doctorRoutes');
const patientRoutes = require('./patientRoutes');
const appointmentRoutes = require('./appointmentRoutes');
const feedbackRoutes = require('./feedbackRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const chatRoutes = require('./chatRoutes');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ message: 'Clinic UAS API berjalan.', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/departments', departmentRoutes);
router.use('/doctors', doctorRoutes);
router.use('/patients', patientRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/feedbacks', feedbackRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/chat', chatRoutes);

module.exports = router;
