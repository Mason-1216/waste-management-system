import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MaintenancePlanLibrary = sequelize.define('MaintenancePlanLibrary', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  station_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '场站ID'
  },
  equipment_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '设备编号'
  },
  equipment_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '设备名称'
  },
  install_location: {
    type: DataTypes.STRING(200),
    comment: '安装位置'
  },
  cycle_type: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'yearly'),
    allowNull: false,
    defaultValue: 'monthly',
    comment: '保养周期'
  },
  // 多周期支持
  daily_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否启用日保养'
  },
  weekly_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否启用周保养'
  },
  monthly_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否启用月保养'
  },
  yearly_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否启用年保养'
  },
  weekly_day: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '周保养在周几完成(1-7，1=周一)'
  },
  monthly_day: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '月保养在每月几号完成(1-31)'
  },
  yearly_month: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '年保养在每年几月完成(1-12)'
  },
  yearly_day: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '年保养在每年几号完成(1-31)'
  },
  // 各周期的保养标准
  daily_standards: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: '日保养标准列表'
  },
  weekly_standards: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: '周保养标准列表'
  },
  monthly_standards: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: '月保养标准列表'
  },
  yearly_standards: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: '年保养标准列表'
  },
  maintenance_standards: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: '保养标准列表 [{name: 标准名称, specification: 保养规范}]'
  },
  is_deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '?????'
  },
  created_by: {
    type: DataTypes.INTEGER,
    comment: '创建人ID'
  },
  created_by_name: {
    type: DataTypes.STRING(50),
    comment: '创建人姓名'
  }
}, {
  tableName: 'maintenance_plan_library',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['station_id'] },
    { fields: ['equipment_code'] },
    { fields: ['cycle_type'] }
  ]
});

export default MaintenancePlanLibrary;
