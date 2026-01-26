import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PlcCategory = sequelize.define('PlcCategory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  category_key: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '分类标识'
  },
  category_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '分类名称'
  },
  data_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'REAL',
    comment: '数据类型: REAL/DINT/INT/BOOL'
  },
  value_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'cumulative',
    comment: '取值类型: cumulative(计量)/fluctuating(变化)/event'
  },
  schedule_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'interval',
    comment: '采集方式: interval/fixed/on_change'
  },
  interval_hours: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '采集间隔(小时)'
  },
  interval_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '采集间隔(分钟)'
  },
  fixed_time: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: '固定采集时间 HH:mm'
  },
  is_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否启用'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序'
  }
}, {
  tableName: 'plc_categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default PlcCategory;
