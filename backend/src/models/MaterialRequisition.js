import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MaterialRequisition = sequelize.define('MaterialRequisition', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  requisition_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  repair_record_id: {
    type: DataTypes.INTEGER,
    comment: '关联维修记录ID'
  },
  applicant_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  applicant_name: {
    type: DataTypes.STRING(50)
  },
  material_list: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: '物料清单 [{name,spec,quantity,unit_price}]'
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2)
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  approver_id: {
    type: DataTypes.INTEGER
  },
  approver_name: {
    type: DataTypes.STRING(50)
  },
  approve_time: {
    type: DataTypes.DATE
  },
  reject_reason: {
    type: DataTypes.TEXT
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  station_id: {
    type: DataTypes.INTEGER
  }
}, {
  tableName: 'material_requisitions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['status'] },
    { fields: ['applicant_id'] }
  ]
});

export default MaterialRequisition;
