import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  notify_type: {
    type: DataTypes.ENUM('inspection_overdue', 'task_pending', 'approval_request', 'system'),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT
  },
  receiver_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  receiver_name: {
    type: DataTypes.STRING(50)
  },
  is_read: {
    type: DataTypes.TINYINT,
    defaultValue: 0
  },
  related_id: {
    type: DataTypes.INTEGER,
    comment: '关联业务ID'
  },
  related_type: {
    type: DataTypes.STRING(50),
    comment: '关联业务类型'
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['receiver_id'] },
    { fields: ['is_read'] },
    { fields: ['notify_type'] }
  ]
});

export default Notification;
