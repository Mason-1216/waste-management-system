import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const TemporaryTask = sequelize.define('TemporaryTask', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  task_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  task_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  task_description: {
    type: DataTypes.TEXT
  },
  task_type: {
    type: DataTypes.ENUM('temporary', 'overtime'),
    comment: '临时任务/加班'
  },
  assigner_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  assigner_name: {
    type: DataTypes.STRING(50)
  },
  executor_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  executor_name: {
    type: DataTypes.STRING(50)
  },
  department_id: {
    type: DataTypes.INTEGER
  },
  project_id: {
    type: DataTypes.INTEGER
  },
  station_id: {
    type: DataTypes.INTEGER
  },
  plan_start_time: {
    type: DataTypes.DATE
  },
  plan_end_time: {
    type: DataTypes.DATE
  },
  actual_hours: {
    type: DataTypes.DECIMAL(4, 2)
  },
  standard_hours: {
    type: DataTypes.DECIMAL(4, 2),
    comment: '标准工时(h/d)'
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '积分'
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed'),
    defaultValue: 'pending'
  },
  completion_note: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'temporary_tasks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['executor_id'] },
    { fields: ['status'] }
  ]
});

export default TemporaryTask;
