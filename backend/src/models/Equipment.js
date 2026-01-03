import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Equipment = sequelize.define('Equipment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '设备ID'
  },
  station_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '场站ID'
  },
  equipment_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '设备编号'
  },
  equipment_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '设备名称'
  },
  installation_location: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '安装地点'
  }
}, {
  tableName: 'equipment',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: '设备管理表'
});

// 定义关联关系
Equipment.associate = (models) => {
  Equipment.belongsTo(models.Station, {
    foreignKey: 'station_id',
    as: 'station'
  });
};

export default Equipment;
