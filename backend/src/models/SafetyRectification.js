import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SafetyRectification = sequelize.define('SafetyRectification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  record_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  inspection_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '关联检查记录ID'
  },
  handler_id: {
    type: DataTypes.INTEGER,
    comment: '办理人ID（站长）'
  },
  handler_name: {
    type: DataTypes.STRING(50),
    comment: '办理人姓名'
  },
  root_cause: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '隐患产生的根本原因'
  },
  rectification_measures: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '具体整改措施'
  },
  responsible_person_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '?????ID'
  },
  responsible_person_name: {
    type: DataTypes.STRING(50),
    comment: '???????'
  },
  punished_person_id: {
    type: DataTypes.INTEGER,
    comment: '被处罚人ID'
  },
  punished_person_name: {
    type: DataTypes.STRING(50),
    comment: '被处罚人姓名'
  },
  punishment_result: {
    type: DataTypes.TEXT,
    comment: '处罚结果'
  },
  is_completed: {
    type: DataTypes.ENUM('是', '否'),
    allowNull: false,
    comment: '一次是否已完成整改'
  },
  completion_photos: {
    type: DataTypes.TEXT,
    comment: '隐患整改完成照片(JSON)'
  },
  completion_score: {
    type: DataTypes.INTEGER,
    comment: '整改完成评分'
  },
  root_cause_category: {
    type: DataTypes.ENUM('组织措施', '管理措施', '技术措施', '经济措施'),
    comment: '根因类别'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
    comment: '状态: pending=待复核, approved=已复核, rejected=已驳回'
  },
  approver_id: {
    type: DataTypes.INTEGER,
    comment: '复核人ID（安全员）'
  },
  approver_name: {
    type: DataTypes.STRING(50),
    comment: '复核人姓名'
  },
  approve_time: {
    type: DataTypes.DATE,
    comment: '复核时间'
  },
  approve_comment: {
    type: DataTypes.TEXT,
    comment: '复核备注'
  },
  reject_reason: {
    type: DataTypes.TEXT,
    comment: '驳回原因'
  }
}, {
  tableName: 'safety_rectifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['inspection_id'] },
    { fields: ['status'] }
  ]
});

export default SafetyRectification;
