import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const RepairTaskLibrary = sequelize.define('RepairTaskLibrary', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  task_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '维修任务名称'
  },
  task_category: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '任务类别'
  },
  score_method: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '给分方式'
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '单位积分'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '数量'
  },
  points_rule: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '积分规则'
  },
  quantity_editable: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '数量是否可修改'
  },
  points_editable: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '积分是否可修改'
  },
  is_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '是否启用'
  }
}, {
  tableName: 'repair_task_library',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default RepairTaskLibrary;
