import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const QuarterlyAwardDetail = sequelize.define('QuarterlyAwardDetail', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  group_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '分组ID'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID'
  },
  user_name: {
    type: DataTypes.STRING(50),
    comment: '用户姓名'
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '年份'
  },
  quarter: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '季度'
  },
  total_points: {
    type: DataTypes.DECIMAL(12, 2),
    comment: '个人季度积分总和'
  },
  points_ratio: {
    type: DataTypes.DECIMAL(8, 4),
    comment: '个人积分占比'
  },
  award_amount: {
    type: DataTypes.DECIMAL(12, 2),
    comment: '个人季度积分奖'
  },
  ranking: {
    type: DataTypes.INTEGER,
    comment: '排名'
  }
}, {
  tableName: 'quarterly_award_details',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default QuarterlyAwardDetail;
