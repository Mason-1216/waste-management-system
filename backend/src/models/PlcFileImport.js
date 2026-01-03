import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PlcFileImport = sequelize.define('PlcFileImport', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  file_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  file_key: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'processed'
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'plc_file_imports',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default PlcFileImport;
