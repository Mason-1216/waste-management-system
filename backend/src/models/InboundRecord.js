import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const InboundRecord = sequelize.define('InboundRecord', {
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
  source_warehouse_id: {
    type: DataTypes.INTEGER,
    comment: '来源仓库ID'
  },
  source_warehouse_name: {
    type: DataTypes.STRING(100)
  },
  material_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '物料名称'
  },
  waste_category: {
    type: DataTypes.ENUM('waste_fruit', 'crushed_perishable', 'uncrushed_perishable'),
    allowNull: false,
    comment: '垃圾分类'
  },
  weight: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  target_gate: {
    type: DataTypes.INTEGER,
    comment: '目标料仓门号'
  },
  data_source: {
    type: DataTypes.ENUM('auto', 'manual'),
    defaultValue: 'auto'
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
  tableName: 'inbound_records',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['project_id'] },
    { fields: ['operator_id'] },
    { fields: ['created_at'] }
  ]
});

export default InboundRecord;
