import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const RepairRecord = sequelize.define('RepairRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  record_code: {
    type: DataTypes.STRING(50),
    unique: true,
    comment: '维修单号'
  },
  fault_report_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '关联故障上报单'
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  station_id: {
    type: DataTypes.INTEGER
  },
  // 设备信息
  equipment_code: {
    type: DataTypes.STRING(50),
    comment: '设备编号'
  },
  equipment_name: {
    type: DataTypes.STRING(100),
    comment: '设备名称'
  },
  equipment_location: {
    type: DataTypes.STRING(200),
    comment: '设备位置'
  },
  equipment_model: {
    type: DataTypes.STRING(100),
    comment: '设备型号'
  },
  // 故障信息
  fault_date: {
    type: DataTypes.DATEONLY,
    comment: '故障日期'
  },
  fault_time: {
    type: DataTypes.TIME,
    comment: '故障时间'
  },
  fault_description: {
    type: DataTypes.TEXT,
    comment: '故障描述'
  },
  preliminary_judgment: {
    type: DataTypes.TEXT,
    comment: '故障初步判断'
  },
  // 上报人信息
  reporter_id: {
    type: DataTypes.INTEGER
  },
  reporter_name: {
    type: DataTypes.STRING(50)
  },
  report_date: {
    type: DataTypes.DATEONLY
  },
  report_time: {
    type: DataTypes.TIME
  },
  urgency_level: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    comment: '紧急程度'
  },
  // 维修人员信息
  repair_person_id: {
    type: DataTypes.INTEGER
  },
  repair_person_name: {
    type: DataTypes.STRING(50)
  },
  repair_assistant_name: {
    type: DataTypes.STRING(50),
    comment: '维修配合人'
  },
  plan_repair_date: {
    type: DataTypes.DATEONLY,
    comment: '计划维修日期'
  },
  plan_repair_end_date: {
    type: DataTypes.DATEONLY,
    comment: '计划维修结束日期'
  },
  plan_repair_time: {
    type: DataTypes.TIME,
    comment: '计划维修时间'
  },
  plan_repair_end_time: {
    type: DataTypes.TIME,
    comment: '计划维修结束时间'
  },
  repair_start_date: {
    type: DataTypes.DATEONLY
  },
  repair_start_time: {
    type: DataTypes.TIME
  },
  repair_end_date: {
    type: DataTypes.DATEONLY
  },
  repair_end_time: {
    type: DataTypes.TIME
  },
  // 维修详情
  repair_content: {
    type: DataTypes.TEXT,
    comment: '维修内容描述'
  },
  repair_tools: {
    type: DataTypes.TEXT,
    comment: '维修工具'
  },
  work_contents: {
    type: DataTypes.JSON,
    comment: '维修工作内容'
  },
  repair_tasks: {
    type: DataTypes.JSON,
    comment: '维修任务汇总表选择'
  },
  // 耗材明细 JSON [{name, model, unit, quantity, unitPrice, amount}]
  consumables_list: {
    type: DataTypes.JSON,
    comment: '维修耗材明细'
  },
  consumables_total: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '耗材总金额'
  },
  // 配件明细 JSON [{name, model, unit, quantity, unitPrice, amount, reason}]
  parts_list: {
    type: DataTypes.JSON,
    comment: '更换配件明细'
  },
  parts_total: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '配件总金额'
  },
  // 维修结果
  repair_result: {
    type: DataTypes.ENUM('normal', 'observe', 'unsolved'),
    comment: '维修结果：正常运行/待观察/未解决'
  },
  observe_days: {
    type: DataTypes.INTEGER,
    comment: '待观察天数'
  },
  unsolved_reason: {
    type: DataTypes.TEXT,
    comment: '未解决原因'
  },
  // 验收信息
  verifier_id: {
    type: DataTypes.INTEGER,
    comment: '验收人ID（站长）'
  },
  verifier_name: {
    type: DataTypes.STRING(50)
  },
  verify_date: {
    type: DataTypes.DATEONLY
  },
  verify_time: {
    type: DataTypes.TIME
  },
  verify_result: {
    type: DataTypes.ENUM('pass', 'fail'),
    comment: '验收结果'
  },
  verify_attitude: {
    type: DataTypes.STRING(50),
    comment: '维修态度'
  },
  verify_quality: {
    type: DataTypes.STRING(50),
    comment: '维修质量'
  },
  verify_comment: {
    type: DataTypes.TEXT,
    comment: '验收意见'
  },
  rating: {
    type: DataTypes.INTEGER,
    comment: '评价星级1-5'
  },
  rating_comment: {
    type: DataTypes.TEXT,
    comment: '评价备注'
  },
  // 归档信息
  archivist: {
    type: DataTypes.STRING(50),
    comment: '存档人员'
  },
  archive_dept: {
    type: DataTypes.STRING(50),
    comment: '存档部门'
  },
  archive_date: {
    type: DataTypes.DATEONLY
  },
  // 状态流转
  status: {
    type: DataTypes.ENUM('draft_report', 'submitted_report', 'dispatched', 'repairing', 'repaired_submitted', 'accepted', 'archived'),
    defaultValue: 'draft_report',
    comment: '状态：草稿上报/已提交上报/已派发/维修中/维修完成待验收/已验收/已归档'
  },
  // 派发信息
  dispatch_by: {
    type: DataTypes.INTEGER,
    comment: '派发人ID（站长）'
  },
  dispatch_by_name: {
    type: DataTypes.STRING(50)
  },
  dispatch_date: {
    type: DataTypes.DATEONLY
  },
  dispatch_time: {
    type: DataTypes.TIME
  },
  dispatch_remark: {
    type: DataTypes.TEXT,
    comment: '派发备注'
  },
  // 工时
  work_hours: {
    type: DataTypes.DECIMAL(5, 1),
    comment: '维修工时'
  },
  created_by: {
    type: DataTypes.INTEGER
  }
}, {
  tableName: 'repair_records',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['fault_report_id'] },
    { fields: ['repair_person_id'] },
    { fields: ['status'] },
    { fields: ['project_id', 'station_id'] }
  ]
});

export default RepairRecord;

