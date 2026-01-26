import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const HygieneArea = sequelize.define('HygieneArea', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  station_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '场站ID'
  },
  area_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '责任区名称'
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '积分'
  }
}, {
  tableName: 'hygiene_areas',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default HygieneArea;

// 定义模型关联关系（导出后再定义，避免循环依赖）
HygieneArea.associate = (models) => {
  HygieneArea.belongsTo(models.Station, { foreignKey: 'station_id', as: 'station' });
  HygieneArea.hasMany(models.HygienePoint, { foreignKey: 'hygiene_area_id', as: 'hygienePoints' });
  HygieneArea.hasMany(models.HygienePositionArea, { foreignKey: 'hygiene_area_id', as: 'positionAssignments' });
};
