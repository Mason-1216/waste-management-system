import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Schedule = sequelize.define('Schedule', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  station_id: {
    type: DataTypes.INTEGER
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  user_name: {
    type: DataTypes.STRING(50)
  },
  position_name: {
    type: DataTypes.STRING(50),
    comment: '岗位名称'
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  month: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  schedules: {
    type: DataTypes.JSON,
    comment: '排班数据 {"2025-12-01":"09:00-18:00","2025-12-02":"休"}'
  },
  created_by: {
    type: DataTypes.INTEGER
  }
}, {
  tableName: 'schedules',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { unique: true, fields: ['user_id', 'station_id', 'position_name', 'year', 'month'] },
    { fields: ['project_id'] },
    { fields: ['year', 'month'] }
  ]
});

export default Schedule;
