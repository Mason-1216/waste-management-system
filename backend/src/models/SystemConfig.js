import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SystemConfig = sequelize.define('SystemConfig', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  config_key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  config_value: {
    type: DataTypes.TEXT
  },
  config_type: {
    type: DataTypes.ENUM('system', 'business', 'device'),
    defaultValue: 'system'
  },
  description: {
    type: DataTypes.STRING(200)
  }
}, {
  tableName: 'system_configs',
  timestamps: true,
  createdAt: false,
  updatedAt: 'updated_at'
});

export default SystemConfig;
