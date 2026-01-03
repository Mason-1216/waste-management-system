import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MaintenanceAssignment = sequelize.define('MaintenanceAssignment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  assignment_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'assignment code'
  },
  station_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'station id'
  },
  plan_id: {
    type: DataTypes.INTEGER,
    comment: 'plan id'
  },
  cycle_type: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'yearly'),
    comment: 'maintenance cycle type'
  },
  equipment_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'equipment code'
  },
  equipment_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'equipment name'
  },
  install_location: {
    type: DataTypes.STRING(200),
    comment: 'install location'
  },
  executor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'executor id'
  },
  executor_name: {
    type: DataTypes.STRING(50),
    comment: 'executor name'
  },
  assigner_id: {
    type: DataTypes.INTEGER,
    comment: 'assigner id'
  },
  assigner_name: {
    type: DataTypes.STRING(50),
    comment: 'assigner name'
  },
  plan_start_date: {
    type: DataTypes.DATEONLY,
    comment: 'plan start date'
  },
  plan_start_time: {
    type: DataTypes.TIME,
    comment: 'plan start time'
  },
  plan_end_date: {
    type: DataTypes.DATEONLY,
    comment: 'plan end date'
  },
  plan_end_time: {
    type: DataTypes.TIME,
    comment: 'plan end time'
  },
  actual_start_date: {
    type: DataTypes.DATEONLY,
    comment: 'actual start date'
  },
  actual_start_time: {
    type: DataTypes.TIME,
    comment: 'actual start time'
  },
  actual_end_date: {
    type: DataTypes.DATEONLY,
    comment: 'actual end date'
  },
  actual_end_time: {
    type: DataTypes.TIME,
    comment: 'actual end time'
  },
  maintenance_content: {
    type: DataTypes.TEXT,
    comment: 'maintenance content'
  },
  maintenance_tools: {
    type: DataTypes.STRING(200),
    comment: 'maintenance tools'
  },
  maintenance_result: {
    type: DataTypes.STRING(20),
    comment: 'maintenance result'
  },
  observe_days: {
    type: DataTypes.INTEGER,
    comment: 'observe days'
  },
  unsolved_reason: {
    type: DataTypes.STRING(200),
    comment: 'unsolved reason'
  },
  maintenance_items: {
    type: DataTypes.JSON,
    comment: 'maintenance items'
  },
  consumables_list: {
    type: DataTypes.JSON,
    comment: 'maintenance consumables list'
  },
  parts_list: {
    type: DataTypes.JSON,
    comment: 'maintenance parts list'
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'pending_verify', 'accepted', 'completed'),
    defaultValue: 'pending',
    comment: 'status'
  },
  completion_note: {
    type: DataTypes.TEXT,
    comment: 'completion note'
  },
  work_hours: {
    type: DataTypes.DECIMAL(4, 2),
    comment: 'work hours'
  },
  verify_by_id: {
    type: DataTypes.INTEGER,
    comment: 'verify user id'
  },
  verify_by_name: {
    type: DataTypes.STRING(50),
    comment: 'verify user name'
  },
  verify_date: {
    type: DataTypes.DATEONLY,
    comment: 'verify date'
  },
  verify_time: {
    type: DataTypes.TIME,
    comment: 'verify time'
  },
  verify_comment: {
    type: DataTypes.TEXT,
    comment: 'verify comment'
  },
  verify_safety: {
    type: DataTypes.INTEGER,
    comment: 'verify safety rating'
  },
  verify_quality: {
    type: DataTypes.INTEGER,
    comment: 'verify quality rating'
  },
  verify_progress: {
    type: DataTypes.INTEGER,
    comment: 'verify progress rating'
  },
  verify_hygiene: {
    type: DataTypes.INTEGER,
    comment: 'verify hygiene rating'
  }
}, {
  tableName: 'maintenance_assignments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['station_id'] },
    { fields: ['executor_id'] },
    { fields: ['status'] },
    { fields: ['plan_start_date'] }
  ]
});

export default MaintenanceAssignment;
