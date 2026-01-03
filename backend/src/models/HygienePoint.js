import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const HygienePoint = sequelize.define('HygienePoint', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  hygiene_area_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '所属责任区ID'
  },
  station_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '场站ID'
  },
  point_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '卫生点名称'
  },
  work_requirements: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '工作要求及标准'
  }
}, {
  tableName: 'hygiene_points',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default HygienePoint;

// 定义模型关联关系（导出后再定义，避免循环依赖）
HygienePoint.associate = (models) => {
  HygienePoint.belongsTo(models.HygieneArea, { foreignKey: 'hygiene_area_id', as: 'area' });
  HygienePoint.belongsTo(models.Station, { foreignKey: 'station_id', as: 'station' });
};
