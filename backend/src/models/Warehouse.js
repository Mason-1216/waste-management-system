import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Warehouse = sequelize.define('Warehouse', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  warehouse_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  warehouse_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  station_id: {
    type: DataTypes.INTEGER
  },
  location: {
    type: DataTypes.STRING(200)
  },
  capacity: {
    type: DataTypes.DECIMAL(10, 2),
    comment: '容量(吨)'
  },
  gate_number: {
    type: DataTypes.INTEGER,
    comment: '仓门编号'
  },
  gate_type: {
    type: DataTypes.ENUM('auto', 'manual'),
    defaultValue: 'manual'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  }
}, {
  tableName: 'warehouses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['project_id'] }
  ]
});

export default Warehouse;
