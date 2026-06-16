const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChatConversation = sequelize.define('ChatConversation', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  patientUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'patient_user_id'
  },
  assignedCsId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'assigned_cs_id'
  },
  status: {
    type: DataTypes.ENUM('open', 'closed'),
    defaultValue: 'open'
  },
  subject: {
    type: DataTypes.STRING(150),
    allowNull: true,
    defaultValue: 'Live Chat Pasien'
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_message_at'
  },
  closedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'closed_at'
  },
  closedById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'closed_by_id'
  }
}, {
  tableName: 'chat_conversations'
});

module.exports = ChatConversation;
