import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const OutboundRecord = sequelize.define('OutboundRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  record_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  outbound_category: {
    type: DataTypes.ENUM('recyclable', 'other', 'old_worm', 'worm_sand', 'enzyme'),
    allowNull: false
  },
  inbound_warehouse_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '进料仓库ID'
  },
  inbound_warehouse_name: {
    type: DataTypes.STRING(100)
  },
  outbound_warehouse_id: {
    type: DataTypes.INTEGER,
    comment: '出料仓库ID'
  },
  outbound_warehouse_name: {
    type: DataTypes.STRING(100)
  },
  material_spec: {
    type: DataTypes.STRING(100)
  },
  weight: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  operator_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  operator_name: {
    type: DataTypes.STRING(50)
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  station_id: {
    type: DataTypes.INTEGER
  },
  photo_urls: {
    type: DataTypes.TEXT
  },
  remark: {
    type: DataTypes.STRING(500)
  }
}, {
  tableName: 'outbound_records',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['project_id'] },
    { fields: ['operator_id'] },
    { fields: ['created_at'] },
    { fields: ['outbound_category'] }
  ]
});

export default OutboundRecord;
