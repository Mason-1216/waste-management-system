import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const DailyTask = sequelize.define('DailyTask', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  record_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '记录编号'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  user_name: {
    type: DataTypes.STRING(50)
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  station_id: {
    type: DataTypes.INTEGER
  },
  work_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  task_config_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  task_name: {
    type: DataTypes.STRING(100)
  },
  times: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '完成次数'
  },
  hours_per_time: {
    type: DataTypes.DECIMAL(4, 2)
  },
  total_hours: {
    type: DataTypes.DECIMAL(4, 2)
  },
  is_fixed_task: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '是否固定任务'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  reviewer_id: {
    type: DataTypes.INTEGER
  },
  reviewer_name: {
    type: DataTypes.STRING(50)
  },
  review_time: {
    type: DataTypes.DATE
  },
  reject_reason: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'daily_tasks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['user_id', 'work_date'] },
    { fields: ['status'] }
  ]
});

export default DailyTask;
