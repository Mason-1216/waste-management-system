import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  company_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: '公司名称'
  },
  company_code: {
    type: DataTypes.STRING(50),
    unique: true,
    comment: '公司编码'
  },
  description: {
    type: DataTypes.STRING(200),
    comment: '描述'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
    comment: '状态'
  }
}, {
  tableName: 'companies',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Company;
