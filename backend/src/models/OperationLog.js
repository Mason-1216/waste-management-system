import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const OperationLog = sequelize.define('OperationLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER
  },
  user_name: {
    type: DataTypes.STRING(50)
  },
  operation_type: {
    type: DataTypes.STRING(50),
    comment: '操作类型'
  },
  operation_module: {
    type: DataTypes.STRING(50),
    comment: '操作模块'
  },
  operation_detail: {
    type: DataTypes.TEXT,
    comment: '操作详情'
  },
  ip_address: {
    type: DataTypes.STRING(50)
  },
  user_agent: {
    type: DataTypes.STRING(500)
  }
}, {
  tableName: 'operation_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['operation_type'] },
    { fields: ['created_at'] }
  ]
});

export default OperationLog;
