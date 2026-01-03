import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const UserStation = sequelize.define('UserStation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  station_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'user_stations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { unique: true, fields: ['user_id', 'station_id'] }
  ]
});

export default UserStation;
