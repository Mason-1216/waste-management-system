import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SafetySelfInspection = sequelize.define('SafetySelfInspection', {
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
    allowNull: false,
    comment: '安全/卫生'
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  station_id: {
    type: DataTypes.INTEGER
  },
  filler_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  filler_name: {
    type: DataTypes.STRING(50)
  },
  inspection_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  work_type_ids: {
    type: DataTypes.JSON,
    comment: '选中的工作性质ID数组'
  },
  inspection_items: {
    type: DataTypes.JSON,
    comment: '检查项 [{workTypeId,workTypeName,itemId,itemName,itemStandard,checked,remark}]'
  },
  photo_urls: {
    type: DataTypes.TEXT,
    comment: 'JSON数组'
  },
  submit_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  is_overdue: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否超时'
  },
  overdue_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '超时分钟数'
  }
}, {
  tableName: 'safety_self_inspections',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['filler_id'] },
    { fields: ['inspection_date'] },
    { fields: ['inspection_type'] }
  ]
});

export default SafetySelfInspection;
