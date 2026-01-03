import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PlcScaleRecord = sequelize.define('PlcScaleRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  record_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  scale_id: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  station_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  weight_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  vehicle_no: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  material: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  weight_gross: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  weight_tare: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  weight_net: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  operator_name: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  source: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'http'
  },
  file_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  raw_payload: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'plc_scale_records',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['scale_id'] },
    { fields: ['station_id'] },
    { fields: ['weight_time'] }
  ]
});

export default PlcScaleRecord;
