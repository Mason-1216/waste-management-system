import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * 员工保养工作记录模型
 * 记录员工完成的保养工作
 */
const MaintenanceWorkRecord = sequelize.define('MaintenanceWorkRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  record_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '记录编号'
  },
  station_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '场站ID'
  },
  plan_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '保养计划库ID'
  },
  position_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '岗位名称'
  },
  equipment_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '设备编号'
  },
  equipment_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '设备名称'
  },
  install_location: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '安装位置'
  },
  cycle_type: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'yearly'),
    allowNull: false,
    comment: '保养周期'
  },
  work_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: '工作日期'
  },
  executor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '执行人ID'
  },
  executor_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '执行人姓名'
  },
  maintenance_items: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '保养标准确认项[{name, specification, confirmed}]'
  },
  maintenance_tools: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '保养工具'
  },
  work_hours: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: '保养时长(小时)'
  },
  consumables_list: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '耗材清单[{name, quantity, unit}]'
  },
  parts_list: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '配件清单[{name, quantity, unit}]'
  },
  remark: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '保养备注'
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'verified'),
    defaultValue: 'pending',
    comment: '状态: pending-待完成, completed-已完成, verified-已验收'
  },
  submit_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '提交时间'
  },
  verifier_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '验收人ID'
  },
  verifier_name: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '验收人姓名'
  },
  verify_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '验收时间'
  },
  verify_result: {
    type: DataTypes.ENUM('pass', 'fail'),
    allowNull: true,
    comment: '验收结果'
  },
  verify_remark: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '验收备注'
  }
}, {
  tableName: 'maintenance_work_records',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      name: 'uk_mwr_plan_exec_date_cycle',
      fields: ['plan_id', 'executor_id', 'work_date', 'cycle_type']
    }
  ]
});

export default MaintenanceWorkRecord;
