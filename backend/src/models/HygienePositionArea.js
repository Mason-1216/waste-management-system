import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const HygienePositionArea = sequelize.define('HygienePositionArea', {
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
  position_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '岗位名称'
  },
  hygiene_area_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '责任区ID'
  }
}, {
  tableName: 'hygiene_position_areas',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default HygienePositionArea;

// 定义模型关联关系（导出后再定义，避免循环依赖）
HygienePositionArea.associate = (models) => {
  HygienePositionArea.belongsTo(models.HygieneArea, { foreignKey: 'hygiene_area_id', as: 'area' });
  HygienePositionArea.belongsTo(models.Station, { foreignKey: 'station_id', as: 'station' });
};
