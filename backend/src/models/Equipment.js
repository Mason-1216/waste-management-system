import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Equipment = sequelize.define(
  'Equipment',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '??ID'
    },
    station_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '??ID'
    },
    equipment_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '????'
    },
    equipment_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '????'
    },
    installation_location: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '????'
    },
    specification: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '??'
    },
    model: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '??'
    },
    material: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '??'
    }
  },
  {
    tableName: 'equipment',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    comment: '?????'
  }
);

Equipment.associate = (models) => {
  Equipment.belongsTo(models.Station, {
    foreignKey: 'station_id',
    as: 'station'
  });
};

export default Equipment;
