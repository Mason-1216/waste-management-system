import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PositionJob = sequelize.define('PositionJob', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  position_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '岗位名称'
  },
  job_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '任务名称'
  },
  task_category: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '任务类别'
  },
  score_method: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '给分方式'
  },
  standard_hours: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    comment: '标准工时'
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '单位积分'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '数量'
  },
  points_rule: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '积分规则'
  },
  quantity_editable: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '数量是否可修改'
  },
  dispatch_review_required: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '派发任务是否强制审核'
  },
  station_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '场站ID（可选，用于指定场站的岗位工作）'
  },
  is_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '是否启用'
  }
}, {
  tableName: 'position_jobs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default PositionJob;

// 定义模型关联关系（导出后再定义，避免循环依赖）
PositionJob.associate = (models) => {
  PositionJob.belongsTo(models.Station, { foreignKey: 'station_id', as: 'station' });
};
