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
  points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '积分'
  },
  station_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '场站ID（可选，共享任务库时为空）'
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
