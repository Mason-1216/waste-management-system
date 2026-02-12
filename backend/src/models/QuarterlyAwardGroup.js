import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const QuarterlyAwardGroup = sequelize.define('QuarterlyAwardGroup', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  group_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '分组名称'
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '年份'
  },
  quarter: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '季度(1-4)'
  },
  per_capita_budget: {
    type: DataTypes.DECIMAL(12, 2),
    comment: '人均季度奖金预算'
  },
  total_budget: {
    type: DataTypes.DECIMAL(12, 2),
    comment: '总季度奖金预算'
  },
  performance_score: {
    type: DataTypes.DECIMAL(5, 2),
    comment: '分组绩效分值'
  },
  award_coefficient: {
    type: DataTypes.DECIMAL(5, 2),
    comment: '季度积分奖系数'
  },
  total_points: {
    type: DataTypes.DECIMAL(12, 2),
    comment: '分组积分总和'
  },
  linked_group_id: {
    type: DataTypes.INTEGER,
    comment: '关联的往期分组ID'
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
  tableName: 'quarterly_award_groups',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default QuarterlyAwardGroup;
