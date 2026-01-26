import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PlcReading = sequelize.define('PlcReading', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '采集时间'
  },
  config_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '配置ID'
  },
  address: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '完整地址(DB.offset)'
  },
  value: {
    type: DataTypes.DECIMAL(20, 4),
    allowNull: true,
    comment: '读取值'
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '分类ID'
  },
  station_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '场站ID'
  },
  raw_value: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '原始值(字符串)'
  },
  quality: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '数据质量: 1=正常, 0=异常'
  }
}, {
  tableName: 'plc_readings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['timestamp'] },
    { fields: ['config_id'] },
    { fields: ['category_id'] },
    { fields: ['station_id'] },
    { fields: ['timestamp', 'category_id'] },
    { fields: ['timestamp', 'station_id'] }
  ]
});

PlcReading.associate = (models) => {
  PlcReading.belongsTo(models.PlcMonitorConfig, { foreignKey: 'config_id', as: 'config' });
  PlcReading.belongsTo(models.PlcCategory, { foreignKey: 'category_id', as: 'category' });
  PlcReading.belongsTo(models.Station, { foreignKey: 'station_id', as: 'station' });
};

export default PlcReading;
