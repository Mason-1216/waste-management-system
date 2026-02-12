import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AdjustedHourlyPoints = sequelize.define('AdjustedHourlyPoints', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID'
  },
  end_month: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: '记录月份（YYYY-MM）'
  },
  actual_points: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: true,
    comment: '实际应用小时积分'
  },
  adjusted_points: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '修正应用小时积分'
  },
  total_points: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    comment: '统计窗口累计积分'
  },
  total_hours: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    comment: '统计窗口累计工时'
  },
  range_start_month: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: '统计窗口起始月（YYYY-MM）'
  },
  range_end_month: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: '统计窗口结束月（YYYY-MM）'
  },
  created_by_id: {
    type: DataTypes.INTEGER,
    comment: '创建人ID'
  },
  created_by_name: {
    type: DataTypes.STRING(50),
    comment: '创建人姓名'
  }
}, {
  tableName: 'adjusted_hourly_points',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { unique: true, fields: ['user_id', 'end_month'] }
  ]
});

export default AdjustedHourlyPoints;
