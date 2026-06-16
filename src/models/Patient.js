const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Patient = sequelize.define('Patient', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  medicalRecordNumber: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
    field: 'medical_record_number'
  },
  birthDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'birth_date'
  },
  gender: {
    type: DataTypes.ENUM('Laki-laki', 'Perempuan'),
    allowNull: true
  },
  bloodType: {
    type: DataTypes.STRING(3),
    allowNull: true,
    field: 'blood_type'
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'patients'
});

module.exports = Patient;
