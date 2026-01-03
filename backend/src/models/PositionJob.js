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
    comment: '工作项目名称'
  },
  standard_hours: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    comment: '标准工时'
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '积分'
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