import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PlcMonitorConfig = sequelize.define('PlcMonitorConfig', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '监控点名称'
  },
  station_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '场站ID'
  },
  plc_ip: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'PLC IP地址'
  },
  db_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'DB块号'
  },
  offset_address: {
    type: DataTypes.DECIMAL(10, 1),
    allowNull: false,
    comment: '偏移地址'
  },
  data_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'REAL',
    comment: '数据类型: REAL/DINT/INT/BOOL'
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '分类ID'
  },
  unit: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '单位'
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '描述'
  },
  is_active: {
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
  tableName: 'plc_monitor_configs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['station_id'] },
    { fields: ['category_id'] },
    { fields: ['plc_ip'] }
  ]
});

PlcMonitorConfig.associate = (models) => {
  PlcMonitorConfig.belongsTo(models.Station, { foreignKey: 'station_id', as: 'station' });
  PlcMonitorConfig.belongsTo(models.PlcCategory, { foreignKey: 'category_id', as: 'category' });
};

export default PlcMonitorConfig;
