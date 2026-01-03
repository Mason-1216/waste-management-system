import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * 岗位-保养计划关联模型
 * 将岗位与保养计划库关联，实现按岗位分配保养任务
 */
const MaintenancePositionPlan = sequelize.define('MaintenancePositionPlan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  station_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '场站ID'
  },
  position_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '岗位名称'
  },
  plan_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '保养计划库ID'
  }
}, {
  tableName: 'maintenance_position_plans',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['station_id', 'position_name', 'plan_id']
    }
  ]
});

export default MaintenancePositionPlan;
