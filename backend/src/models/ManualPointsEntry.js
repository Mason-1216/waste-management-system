import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ManualPointsEntry = sequelize.define('ManualPointsEntry', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  entry_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: '录入日期'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID'
  },
  user_name: {
    type: DataTypes.STRING(50),
    comment: '用户姓名'
  },
  category_code: {
    type: DataTypes.STRING(30),
    allowNull: false,
    comment: '积分类别编码'
  },
  task_category: {
    type: DataTypes.STRING(50),
    comment: '任务类别（用于按任务类别统计/可视化）'
  },
  task_name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '任务名称'
  },
  unit_points: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '单位积分'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '数量'
  },
  remark: {
    type: DataTypes.TEXT,
    comment: '备注'
  },
  created_by_id: {
    type: DataTypes.INTEGER,
    comment: '创建人ID'
  },
  created_by_name: {
    type: DataTypes.STRING(50),
    comment: '创建人姓名'
  }
}, {
  tableName: 'manual_points_entries',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['entry_date'] },
    { fields: ['user_id', 'entry_date'] },
    { fields: ['category_code'] },
    { fields: ['task_category'] }
  ]
});

export default ManualPointsEntry;
