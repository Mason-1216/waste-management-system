import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Permission = sequelize.define('Permission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  permission_code: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: '权限编码'
  },
  permission_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '权限名称'
  },
  resource_type: {
    type: DataTypes.ENUM('menu', 'button', 'api', 'module'),
    defaultValue: 'api',
    comment: '资源类型'
  },
  parent_id: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '父级权限ID'
  }
}, {
  tableName: 'permissions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

export default Permission;
