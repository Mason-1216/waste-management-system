import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Login username'
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Password (bcrypt)'
  },
  real_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Real name'
  },
  department_name: {
    type: DataTypes.STRING(50),
    comment: 'Department name'
  },
  company_name: {
    type: DataTypes.STRING(100),
    comment: 'Company name'
  },
  phone: {
    type: DataTypes.STRING(20),
    comment: 'Phone'
  },
  email: {
    type: DataTypes.STRING(100),
    comment: 'Email'
  },
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Role ID'
  },
  is_price_admin: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: 'Price admin'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: 'Status 1 enabled 0 disabled'
  },
  last_project_id: {
    type: DataTypes.INTEGER,
    comment: 'Last project ID'
  },
  last_station_id: {
    type: DataTypes.INTEGER,
    comment: 'Last station ID'
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['role_id'] },
    { fields: ['status'] }
  ]
});

export default User;
