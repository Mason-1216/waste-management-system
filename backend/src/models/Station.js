import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Station = sequelize.define('Station', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  station_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '场站名称'
  },
  station_type: {
    type: DataTypes.ENUM('有机资源再生中心', '机械化分选站', '黑水虻场站', '办公区', '绿植堆肥站', '绿植粉碎站'),
    comment: '场站类别'
  },
  check_in_time: {
    type: DataTypes.TIME,
    defaultValue: '08:10:00',
    comment: '自检截止时间'
  },
  location: {
    type: DataTypes.STRING(200),
    comment: '地址'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  }
}, {
  tableName: 'stations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Station;
