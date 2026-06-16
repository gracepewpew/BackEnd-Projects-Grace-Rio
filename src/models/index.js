const sequelize = require('../config/database');
const User = require('./User');
const Department = require('./Department');
const Doctor = require('./Doctor');
const Patient = require('./Patient');
const Appointment = require('./Appointment');
const AppointmentCancellation = require('./AppointmentCancellation');
const Feedback = require('./Feedback');
const ChatConversation = require('./ChatConversation');
const ChatMessage = require('./ChatMessage');

User.hasOne(Patient, { foreignKey: 'userId', onDelete: 'CASCADE' });
Patient.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(Doctor, { foreignKey: 'userId', onDelete: 'SET NULL' });
Doctor.belongsTo(User, { foreignKey: 'userId' });

Department.hasMany(Doctor, { foreignKey: 'departmentId' });
Doctor.belongsTo(Department, { foreignKey: 'departmentId' });

Department.hasMany(Appointment, { foreignKey: 'departmentId' });
Appointment.belongsTo(Department, { foreignKey: 'departmentId' });

Doctor.hasMany(Appointment, { foreignKey: 'doctorId' });
Appointment.belongsTo(Doctor, { foreignKey: 'doctorId' });

Patient.hasMany(Appointment, { foreignKey: 'patientId' });
Appointment.belongsTo(Patient, { foreignKey: 'patientId' });

Appointment.hasMany(AppointmentCancellation, { foreignKey: 'appointmentId', onDelete: 'CASCADE' });
AppointmentCancellation.belongsTo(Appointment, { foreignKey: 'appointmentId' });

Doctor.hasMany(AppointmentCancellation, { foreignKey: 'doctorId', onDelete: 'SET NULL' });
AppointmentCancellation.belongsTo(Doctor, { foreignKey: 'doctorId' });

User.hasMany(Appointment, { foreignKey: 'assignedByCsId', as: 'CsAssignments' });
Appointment.belongsTo(User, { foreignKey: 'assignedByCsId', as: 'AssignedByCs' });

User.hasMany(ChatConversation, { foreignKey: 'patientUserId', as: 'PatientChats' });
ChatConversation.belongsTo(User, { foreignKey: 'patientUserId', as: 'PatientUser' });

User.hasMany(ChatConversation, { foreignKey: 'assignedCsId', as: 'CsChats' });
ChatConversation.belongsTo(User, { foreignKey: 'assignedCsId', as: 'AssignedCs' });

User.hasMany(ChatConversation, { foreignKey: 'closedById', as: 'ClosedChats' });
ChatConversation.belongsTo(User, { foreignKey: 'closedById', as: 'ClosedBy' });

ChatConversation.hasMany(ChatMessage, { foreignKey: 'conversationId', onDelete: 'CASCADE' });
ChatMessage.belongsTo(ChatConversation, { foreignKey: 'conversationId' });

User.hasMany(ChatMessage, { foreignKey: 'senderUserId' });
ChatMessage.belongsTo(User, { foreignKey: 'senderUserId', as: 'Sender' });

module.exports = {
  sequelize,
  User,
  Department,
  Doctor,
  Patient,
  Appointment,
  AppointmentCancellation,
  Feedback,
  ChatConversation,
  ChatMessage
};
