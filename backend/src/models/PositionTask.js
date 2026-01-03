import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PositionTask = sequelize.define('PositionTask', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  position_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '岗位名称'
  },
  task_config_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  is_required: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '是否必做'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'position_tasks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['project_id', 'position_name'] }
  ]
});

export default PositionTask;
