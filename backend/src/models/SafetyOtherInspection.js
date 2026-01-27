import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SafetyOtherInspection = sequelize.define('SafetyOtherInspection', {
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
  inspection_type: {
    type: DataTypes.ENUM('safety', 'hygiene'),
    allowNull: false
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  station_id: {
    type: DataTypes.INTEGER
  },
  inspector_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '检查人ID（站长）'
  },
  inspector_name: {
    type: DataTypes.STRING(50)
  },
  inspection_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  inspected_user_id: {
    type: DataTypes.INTEGER,
    comment: '被检查人ID'
  },
  inspected_user_name: {
    type: DataTypes.STRING(50)
  },
  work_type_ids: {
    type: DataTypes.JSON,
    comment: '选中的工作性质ID数组'
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '奖励/扣除积分'
  },
  inspection_items: {
    type: DataTypes.JSON,
    comment: '检查项 [{workTypeId,workTypeName,itemId,itemName,itemStandard,result,remark}]'
  },
  violation_description: {
    type: DataTypes.TEXT,
    comment: '违规描述'
  },
  remark: {
    type: DataTypes.TEXT,
    comment: '备注'
  },
  is_qualified: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '是否合格'
  },
  unqualified_items: {
    type: DataTypes.TEXT,
    comment: '不合格项'
  },
  photo_urls: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'safety_other_inspections',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['inspector_id'] },
    { fields: ['inspection_date'] }
  ]
});

export default SafetyOtherInspection;
