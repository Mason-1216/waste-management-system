import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SafetyHazardInspection = sequelize.define('SafetyHazardInspection', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  record_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '表单编号'
  },
  inspection_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: '发起日期'
  },
  submit_time: {
    type: DataTypes.TIME,
    comment: '发起时间'
  },
  station_id: {
    type: DataTypes.INTEGER,
    comment: '场站ID'
  },
  station_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '场站名称'
  },
  hazard_category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '隐患类别'
  },
  hazard_description: {
    type: DataTypes.TEXT,
    comment: '隐患描述'
  },
  photo_urls: {
    type: DataTypes.TEXT,
    comment: '隐患处照片(JSON)'
  },
  location: {
    type: DataTypes.STRING(200),
    comment: '位置'
  },
  inspector_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '发起人ID'
  },
  inspector_name: {
    type: DataTypes.STRING(50),
    comment: '发起人姓名'
  },
  status: {
    type: DataTypes.ENUM('pending', 'rectified', 'reviewed'),
    defaultValue: 'pending',
    comment: '状态: pending=待整改, rectified=已整改, reviewed=已复核'
  }
}, {
  tableName: 'safety_hazard_inspections',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['station_name'] },
    { fields: ['inspection_date'] },
    { fields: ['inspector_id'] }
  ]
});

export default SafetyHazardInspection;
