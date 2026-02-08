import { Op } from 'sequelize';
import { Role, User } from '../../../models/index.js';
import { ensureRolePermissions } from './permissionService.js';
import logger from '../../../config/logger.js';
import {
  DEV_TEST_ROLE_CODE,
  DEV_TEST_USERNAME,
  DEV_TEST_REAL_NAME,
  DEV_TEST_BASE_ROLE_CODE,
  DEV_TEST_DESCRIPTION,
  DEV_TEST_PASSWORD_HASH
} from '../../../config/dev_test.js';

const normalizeText = (value) => (value === undefined || value === null ? '' : String(value));

const isDevTestUsername = (username) => normalizeText(username).trim() === DEV_TEST_USERNAME;

const ensureDevTestRole = async () => {
  const role = await Role.findOne({ where: { role_code: DEV_TEST_ROLE_CODE } });
  if (!role) {
    return Role.create({
      role_name: DEV_TEST_REAL_NAME,
      role_code: DEV_TEST_ROLE_CODE,
      base_role_code: DEV_TEST_BASE_ROLE_CODE,
      description: DEV_TEST_DESCRIPTION
    });
  }

  const updates = {};
  if (role.role_name !== DEV_TEST_REAL_NAME) {
    updates.role_name = DEV_TEST_REAL_NAME;
  }
  if (role.base_role_code !== DEV_TEST_BASE_ROLE_CODE) {
    updates.base_role_code = DEV_TEST_BASE_ROLE_CODE;
  }
  if (role.description !== DEV_TEST_DESCRIPTION) {
    updates.description = DEV_TEST_DESCRIPTION;
  }

  if (Object.keys(updates).length > 0) {
    await role.update(updates);
  }

  return role;
};

const ensureDevTestUser = async (devTestRoleId) => {
  const user = await User.findOne({ where: { username: DEV_TEST_USERNAME } });
  if (!user) {
    await User.create({
      username: DEV_TEST_USERNAME,
      password: DEV_TEST_PASSWORD_HASH,
      real_name: DEV_TEST_REAL_NAME,
      role_id: devTestRoleId,
      is_price_admin: 0,
      status: 1
    });
    logger.warn('开发测试账号缺失，已自动重建');
    return;
  }

  const updates = {};
  if (user.role_id !== devTestRoleId) {
    updates.role_id = devTestRoleId;
  }
  if (user.real_name !== DEV_TEST_REAL_NAME) {
    updates.real_name = DEV_TEST_REAL_NAME;
  }
  if (user.status !== 1) {
    updates.status = 1;
  }
  if (user.is_price_admin !== 0) {
    updates.is_price_admin = 0;
  }

  if (Object.keys(updates).length > 0) {
    await user.update(updates);
  }
};

const enforceDevTestUniqueness = async (devTestRoleId) => {
  const extraUsers = await User.findAll({
    where: {
      role_id: devTestRoleId,
      username: { [Op.ne]: DEV_TEST_USERNAME }
    }
  });

  if (extraUsers.length === 0) {
    return;
  }

  const adminRole = await Role.findOne({ where: { role_code: DEV_TEST_BASE_ROLE_CODE } });
  const adminRoleId = adminRole ? adminRole.id : null;

  for (const user of extraUsers) {
    const updates = { status: 0 };
    if (adminRoleId) {
      updates.role_id = adminRoleId;
    }
    await user.update(updates);
  }

  logger.warn(`发现 ${extraUsers.length} 个非法开发测试账号，已强制禁用`);
};

export const ensureDevTestAccount = async () => {
  const role = await ensureDevTestRole();
  if (!role) {
    logger.error('开发测试角色创建失败');
    return;
  }

  await ensureRolePermissions();
  await ensureDevTestUser(role.id);
  await enforceDevTestUniqueness(role.id);
};

export default { ensureDevTestAccount };
