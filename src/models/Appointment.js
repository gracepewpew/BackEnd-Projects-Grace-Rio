const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  patientId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'patient_id'
  },
  doctorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'doctor_id'
  },
  departmentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'department_id'
  },
  assignedByCsId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'assigned_by_cs_id'
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
  email: {
    type: DataTypes.STRING(120),
    allowNull: false,
    validate: { isEmail: true }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  appointmentDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'appointment_date'
  },
  appointmentTime: {
    type: DataTypes.TIME,
    allowNull: true,
    field: 'appointment_time'
  },
  symptoms: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'requested', 'scheduled', 'completed', 'cancelled'),
    defaultValue: 'pending'
  }
}, {
  tableName: 'appointments'
});

module.exports = Appointment;
