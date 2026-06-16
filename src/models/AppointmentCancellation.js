const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AppointmentCancellation = sequelize.define('AppointmentCancellation', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  appointmentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'appointment_id'
  },
  doctorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'doctor_id'
  },
  patientName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'patient_name'
  },
  patientNumber: {
    type: DataTypes.STRING(30),
    allowNull: true,
    field: 'patient_number'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'appointment_cancellations'
});

module.exports = AppointmentCancellation;
