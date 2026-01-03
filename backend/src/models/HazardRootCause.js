import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const HazardRootCause = sequelize.define('HazardRootCause', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cause_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: '原因名称'
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
  tableName: 'hazard_root_causes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default HazardRootCause;
