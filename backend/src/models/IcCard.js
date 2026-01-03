import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const IcCard = sequelize.define('IcCard', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  card_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'IC卡物理ID'
  },
  card_type: {
    type: DataTypes.ENUM('warehouse', 'employee'),
    allowNull: false
  },
  warehouse_id: {
    type: DataTypes.INTEGER,
    comment: '关联仓库ID'
  },
  user_id: {
    type: DataTypes.INTEGER,
    comment: '关联用户ID'
  },
  warehouse_name: {
    type: DataTypes.STRING(100)
  },
  material_type: {
    type: DataTypes.STRING(50),
    comment: '默认物料类型'
  },
  status: {
    type: DataTypes.ENUM('active', 'disabled', 'lost'),
    defaultValue: 'active'
  },
  last_used_at: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'ic_cards',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['card_id'] },
    { fields: ['warehouse_id'] },
    { fields: ['status'] }
  ]
});

export default IcCard;
