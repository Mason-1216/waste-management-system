import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SafetyWorkType = sequelize.define('SafetyWorkType', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  work_type_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '工作性质名称'
  },
  is_default: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否默认必选（基本工作）'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
    comment: '状态'
  }
}, {
  tableName: 'safety_work_types',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default SafetyWorkType;

SafetyWorkType.associate = (models) => {
  SafetyWorkType.hasMany(models.SafetyCheckItem, { foreignKey: 'work_type_id', as: 'checkItems' });
};
