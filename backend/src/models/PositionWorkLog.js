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
    comment: '关联岗位任务ID'
  },
  task_source: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'fixed',
    comment: '任务来源'
  },
  task_category: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '任务类别'
  },
  score_method: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '给分方式'
  },
  unit_points: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '单位积分'
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '数量'
  },
  quantity_editable: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '数量是否可修改'
  },
  work_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: '工作日期'
  },
  work_name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '任务名称'
  },
  standard_hours: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: '标准工时(h/d)'
  },
  actual_hours: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: '实际工时(h/d)'
  },
  is_completed: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否完成'
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
  submit_time: {
    type: DataTypes.DATE,
    comment: '提交时间'
  },
  review_status: {
    type: DataTypes.STRING(20),
    comment: '审核状态'
  },
  deduction_reason: {
    type: DataTypes.TEXT,
    comment: '扣分原因'
  },
  deduction_points: {
    type: DataTypes.DECIMAL(10, 2),
    comment: '扣分值'
  },
  assigned_by_id: {
    type: DataTypes.INTEGER,
    comment: '派发人ID'
  },
  assigned_by_name: {
    type: DataTypes.STRING(50),
    comment: '派发人'
  },
  assigned_time: {
    type: DataTypes.DATE,
    comment: '派发时间'
  },
  appeal_status: {
    type: DataTypes.STRING(20),
    comment: '申诉状态'
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
    comment: '审核人ID'
  },
  approver_name: {
    type: DataTypes.STRING(50),
    comment: '审核人姓名'
  },
  approve_time: {
    type: DataTypes.DATE,
    comment: '审核时间'
  },
  approve_remark: {
    type: DataTypes.TEXT,
    comment: '审核备注'
  }
}, {
  tableName: 'position_work_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['user_id', 'work_date'] },
    { fields: ['station_id'] },
    { fields: ['appeal_status'] },
    { fields: ['task_source'] },
    { fields: ['review_status'] },
    { fields: ['submit_time'] }
  ]
});

export default PositionWorkLog;
