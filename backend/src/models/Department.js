import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Department = sequelize.define('Department', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  dept_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '部门名称'
  },
  dept_code: {
    type: DataTypes.STRING(50),
    unique: true,
    comment: '部门编码'
  },
  description: {
    type: DataTypes.STRING(200)
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  }
}, {
  tableName: 'departments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

export default Department;
