import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ManualWorkHour = sequelize.define('ManualWorkHour', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  work_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: '工时日期'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID'
  },
  user_name: {
    type: DataTypes.STRING(50),
    comment: '用户姓名'
  },
  work_hours: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '工时(小时)'
  },
  remark: {
    type: DataTypes.TEXT,
    comment: '备注'
  },
  created_by_id: {
    type: DataTypes.INTEGER,
    comment: '创建人ID'
  },
  created_by_name: {
    type: DataTypes.STRING(50),
    comment: '创建人姓名'
  }
}, {
  tableName: 'manual_work_hours',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['work_date'] },
    { fields: ['user_id', 'work_date'] }
  ]
});

export default ManualWorkHour;

