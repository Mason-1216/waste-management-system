import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const TaskConfig = sequelize.define('TaskConfig', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  task_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '任务名称'
  },
  standard_hours: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: false,
    comment: '标准工时'
  },
  project_id: {
    type: DataTypes.INTEGER,
    comment: '项目ID（null表示全局任务）'
  },
  is_system_default: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否系统预设'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  },
  created_by: {
    type: DataTypes.INTEGER
  }
}, {
  tableName: 'task_configs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['project_id'] }
  ]
});

export default TaskConfig;
