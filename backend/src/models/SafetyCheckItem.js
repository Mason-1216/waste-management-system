import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SafetyCheckItem = sequelize.define('SafetyCheckItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  work_type_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '关联工作性质'
  },
  item_name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '检查项目名称'
  },
  item_standard: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '检查标准'
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Parent check item id'
  },
  enable_children: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: 'Enable child items'
  },
  trigger_value: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: 'Trigger value for child items'
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
  tableName: 'safety_check_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default SafetyCheckItem;

SafetyCheckItem.associate = (models) => {
  SafetyCheckItem.belongsTo(models.SafetyWorkType, { foreignKey: 'work_type_id', as: 'workType' });
  SafetyCheckItem.belongsTo(models.SafetyCheckItem, { foreignKey: 'parent_id', as: 'parentItem' });
  SafetyCheckItem.hasMany(models.SafetyCheckItem, { foreignKey: 'parent_id', as: 'childItems' });
};
