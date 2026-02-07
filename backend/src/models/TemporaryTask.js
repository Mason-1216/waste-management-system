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
  unit_points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '\u5355\u4f4d\u79ef\u5206'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '\u6570\u91cf'
  },
  unit_points_editable: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '?????????'
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '积分'
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'rejected'),
    defaultValue: 'pending'
  },
  is_completed: {
    type: DataTypes.TINYINT,
    defaultValue: 0
  },
  submit_time: {
    type: DataTypes.DATE
  },
  approver_id: {
    type: DataTypes.INTEGER
  },
  approver_name: {
    type: DataTypes.STRING(50)
  },
  approve_time: {
    type: DataTypes.DATE
  },
  deduction_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '????'
  },
  deduction_points: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '???'
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
