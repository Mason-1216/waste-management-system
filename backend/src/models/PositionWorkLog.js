import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PositionWorkLog = sequelize.define('PositionWorkLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
  station_id: {
    type: DataTypes.INTEGER,
    comment: '场站ID'
  },
  station_name: {
    type: DataTypes.STRING(100),
    comment: '场站名称'
  },
  position_name: {
    type: DataTypes.STRING(50),
    comment: '岗位名称'
  },
  position_job_id: {
    type: DataTypes.INTEGER,
    comment: '关联岗位工作项目ID'
  },
  work_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: '工作日期'
  },
  work_name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '工作项目名称'
  },
  standard_hours: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: '标准工时(小时)'
  },
  actual_hours: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: '实际工时(小时)'
  },
  is_completed: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否完成：0未完成 1已完成'
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '完成进度 0-100'
  },
  remark: {
    type: DataTypes.TEXT,
    comment: '备注'
  },
  is_overtime: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否超时'
  },
  appeal_status: {
    type: DataTypes.STRING(20),
    comment: '申诉状态：pending待审批, approved已通过, rejected已驳回'
  },
  appeal_reason: {
    type: DataTypes.TEXT,
    comment: '申诉原因'
  },
  appeal_time: {
    type: DataTypes.DATE,
    comment: '申诉时间'
  },
  approver_id: {
    type: DataTypes.INTEGER,
    comment: '审批人ID'
  },
  approver_name: {
    type: DataTypes.STRING(50),
    comment: '审批人姓名'
  },
  approve_time: {
    type: DataTypes.DATE,
    comment: '审批时间'
  },
  approve_remark: {
    type: DataTypes.TEXT,
    comment: '审批备注'
  }
}, {
  tableName: 'position_work_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['user_id', 'work_date'] },
    { fields: ['station_id'] },
    { fields: ['appeal_status'] }
  ]
});

export default PositionWorkLog;
