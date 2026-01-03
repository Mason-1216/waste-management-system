import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  role_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '角色名称'
  },
  role_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '角色编码'
  },
  base_role_code: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '基准角色编码'
  },
  description: {
    type: DataTypes.STRING(200),
    comment: '描述'
  }
}, {
  tableName: 'roles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

export default Role;
