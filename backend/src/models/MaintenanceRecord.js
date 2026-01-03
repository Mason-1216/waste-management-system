import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MaintenanceRecord = sequelize.define('MaintenanceRecord', {
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
  plan_id: {
    type: DataTypes.INTEGER,
    comment: '关联保养计划ID'
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
  maintenance_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  maintainer_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  maintainer_name: {
    type: DataTypes.STRING(50)
  },
  maintenance_content: {
    type: DataTypes.TEXT
  },
  result: {
    type: DataTypes.ENUM('normal', 'found_issue'),
    defaultValue: 'normal'
  },
  issue_description: {
    type: DataTypes.TEXT
  },
  handling_measures: {
    type: DataTypes.TEXT
  },
  photo_urls: {
    type: DataTypes.TEXT,
    comment: 'JSON数组'
  },
  work_hours: {
    type: DataTypes.DECIMAL(4, 2)
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  reviewer_id: {
    type: DataTypes.INTEGER
  },
  reviewer_name: {
    type: DataTypes.STRING(50)
  },
  review_time: {
    type: DataTypes.DATE
  },
  reject_reason: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'maintenance_records',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['plan_id'] },
    { fields: ['status'] }
  ]
});

export default MaintenanceRecord;
