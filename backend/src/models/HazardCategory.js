import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const HazardCategory = sequelize.define('HazardCategory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  category_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '类别名称'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序'
  },
  is_system: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否系统预置(1=是,0=否)'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态(1=启用,0=禁用)'
  }
}, {
  tableName: 'hazard_categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default HazardCategory;
