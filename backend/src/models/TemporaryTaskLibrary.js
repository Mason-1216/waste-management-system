import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const TemporaryTaskLibrary = sequelize.define('TemporaryTaskLibrary', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  task_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '临时工作任务名称'
  },
  task_content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '具体工作内容'
  },
  standard_hours: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: false,
    comment: '标准工时(h/d)'
  },
  unit_points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '单位积分'
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
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '数量'
  },
  points_rule: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '积分规则'
  },
  quantity_editable: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '数量是否可修改'
  },
  unit_points_editable: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '?????????'
  },
  dispatch_review_required: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '派发任务是否强制审核'
  },
  station_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '场站ID（可选，共享任务汇总表时为空）'
  },
  created_by: {
    type: DataTypes.INTEGER,
    comment: '创建人ID'
  },
  created_by_name: {
    type: DataTypes.STRING(50),
    comment: '创建人姓名'
  }
}, {
  tableName: 'temporary_task_library',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['station_id'] },
    { fields: ['task_name'] }
  ]
});

TemporaryTaskLibrary.associate = (models) => {
  TemporaryTaskLibrary.belongsTo(models.Station, { foreignKey: 'station_id', as: 'station' });
  TemporaryTaskLibrary.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
};

export default TemporaryTaskLibrary;
