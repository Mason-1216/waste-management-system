import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const RolePermission = sequelize.define('RolePermission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  permission_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'role_permissions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { unique: true, fields: ['role_id', 'permission_id'] }
  ]
});

export default RolePermission;
