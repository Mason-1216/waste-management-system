import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const FaultReport = sequelize.define('FaultReport', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  report_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  equipment_code: {
    type: DataTypes.STRING(50)
  },
  equipment_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  installation_location: {
    type: DataTypes.STRING(200)
  },
  fault_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  fault_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  reporter_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reporter_name: {
    type: DataTypes.STRING(50)
  },
  fault_description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  station_id: {
    type: DataTypes.INTEGER
  },
  status: {
    type: DataTypes.ENUM('pending', 'assigned', 'processing', 'completed', 'closed'),
    defaultValue: 'pending'
  },
  assigned_to: {
    type: DataTypes.INTEGER,
    comment: '派发给维修岗ID'
  },
  assigned_by: {
    type: DataTypes.INTEGER,
    comment: '站长ID'
  },
  assigned_at: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'fault_reports',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['status'] },
    { fields: ['reporter_id'] }
  ]
});

export default FaultReport;
