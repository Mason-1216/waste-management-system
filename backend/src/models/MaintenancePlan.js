import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MaintenancePlan = sequelize.define('MaintenancePlan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  plan_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  station_id: {
    type: DataTypes.INTEGER
  },
  equipment_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  equipment_code: {
    type: DataTypes.STRING(50)
  },
  cycle_type: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'),
    allowNull: false
  },
  cycle_value: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '周期值'
  },
  maintenance_content: {
    type: DataTypes.TEXT
  },
  assigned_user_id: {
    type: DataTypes.INTEGER
  },
  assigned_user_name: {
    type: DataTypes.STRING(50)
  },
  start_date: {
    type: DataTypes.DATEONLY
  },
  last_maintenance_date: {
    type: DataTypes.DATEONLY
  },
  next_maintenance_date: {
    type: DataTypes.DATEONLY
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  },
  created_by: {
    type: DataTypes.INTEGER
  }
}, {
  tableName: 'maintenance_plans',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['project_id'] },
    { fields: ['next_maintenance_date'] }
  ]
});

export default MaintenancePlan;
