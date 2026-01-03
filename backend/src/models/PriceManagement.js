import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PriceManagement = sequelize.define('PriceManagement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  item_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '项目名称'
  },
  item_category: {
    type: DataTypes.STRING(50),
    comment: '类别'
  },
  specification: {
    type: DataTypes.STRING(100)
  },
  unit: {
    type: DataTypes.STRING(20)
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  effective_date: {
    type: DataTypes.DATEONLY
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  },
  created_by: {
    type: DataTypes.INTEGER
  }
}, {
  tableName: 'price_management',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['item_category'] },
    { fields: ['status'] }
  ]
});

export default PriceManagement;
