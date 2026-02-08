import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false,
    timezone: '+08:00',
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    },
    hooks: {
      afterConnect: async (connection) => {
        await new Promise((resolve, reject) => {
          connection.query('SET NAMES utf8mb4', (err) => {
            if (err) {
              reject(err);
              return;
            }
            resolve();
          });
        });
      }
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// 测试连接
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    return true;
  } catch {
    return false;
  }
};

export default sequelize;
