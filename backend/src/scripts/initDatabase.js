import bcrypt from 'bcryptjs';
import sequelize from '../config/database.js';
import { User, Role } from '../models/index.js';
import { defineAssociations } from '../models/index.js';
import logger from '../config/logger.js';

async function initDatabase() {
  try {
    logger.info('开始初始化数据库...');

    // 定义模型关联
    defineAssociations();

    // 同步数据库
    await sequelize.sync({ alter: false });
    logger.info('数据库模型同步完成');

    // 检查是否已有角色
    const roleCount = await Role.count();
    if (roleCount === 0) {
      logger.info('创建默认角色...');
      await Role.bulkCreate([
        {
          role_code: 'admin',
          role_name: '系统管理员',
          base_role_code: 'admin',
          description: '系统管理员，拥有所有权限'
        },
        {
          role_code: 'manager',
          role_name: '管理人员',
          base_role_code: 'manager',
          description: '管理人员'
        },
        {
          role_code: 'operator',
          role_name: '操作员',
          base_role_code: 'operator',
          description: '普通操作员'
        }
      ]);
      logger.info('默认角色创建完成');
    }

    // 检查是否已有用户
    const userCount = await User.count();
    if (userCount === 0) {
      logger.info('创建默认管理员用户...');

      // 获取管理员角色
      const adminRole = await Role.findOne({ where: { role_code: 'admin' } });
      if (!adminRole) {
        throw new Error('管理员角色不存在');
      }

      // 创建默认管理员
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        username: 'admin',
        password: hashedPassword,
        real_name: '系统管理员',
        department_name: '系统部门',
        role_id: adminRole.id,
        status: 1
      });

      logger.info('默认管理员用户创建完成');
      logger.info('用户名: admin');
      logger.info('密码: admin123');
    }

    logger.info('数据库初始化完成！');
    process.exit(0);
  } catch (error) {
    logger.error('数据库初始化失败:', error);
    process.exit(1);
  }
}

initDatabase();
