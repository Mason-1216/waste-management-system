import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const UserPermission = sequelize.define('UserPermission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  permission_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  effect: {
    type: DataTypes.ENUM('allow', 'deny'),
    allowNull: false,
    defaultValue: 'allow'
  }
}, {
  tableName: 'user_permissions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['permission_id'] }
  ]
});

export default UserPermission;
