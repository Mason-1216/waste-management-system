import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { User, Role, Station, UserStation, Schedule } from '../models/index.js';
import { createError } from '../middlewares/error.js';
import { getPagination, formatPaginationResponse, getOrderBy, generateRandomPassword } from '../utils/helpers.js';
import sequelize from '../config/database.js';

const resolveRoleId = async ({ roleId, roleCode }) => {
  if (roleId) return roleId;
  if (!roleCode) return null;

  const role = await Role.findOne({ where: { role_code: roleCode } });
  if (!role) {
    throw createError(400, 'Invalid role');
  }
  return role.id;
};

/**
 * 验证批量导入数据
 */
const validateImportData = async (users) => {
  if (!Array.isArray(users) || users.length === 0) {
    throw createError(400, 'Import data cannot be empty');
  }
  if (users.length > 100) {
    throw createError(400, 'Import up to 100 records at a time');
  }

  const usernames = users.map(u => (u.username || '').trim()).filter(Boolean);
  const uniqueUsernames = new Set(usernames);
  if (uniqueUsernames.size !== usernames.length) {
    throw createError(400, 'Duplicate usernames in import data');
  }

  const existing = await User.findAll({
    where: { username: { [Op.in]: usernames } },
    attributes: ['username']
  });
  if (existing.length > 0) {
    const names = existing.map(u => u.username).join(', ');
    throw createError(400, `Username already exists: ${names}`);
  }

  return usernames;
};

/**
 * 准备批量导入所需的映射数据
 */
const prepareImportMaps = async (users) => {
  const roleCodes = [...new Set(users.map(u => u.roleCode).filter(Boolean))];
  const roles = await Role.findAll({ where: { role_code: { [Op.in]: roleCodes } } });
  const roleMap = new Map(roles.map(r => [r.role_code, r.id]));

  const missingRole = roleCodes.find(code => !roleMap.has(code));
  if (missingRole) {
    throw createError(400, `Invalid role: ${missingRole}`);
  }

  const stationNames = [...new Set(users.map(u => u.stationName).filter(Boolean))];

  const stations = stationNames.length
    ? await Station.findAll({ where: { station_name: { [Op.in]: stationNames } } })
    : [];

  const stationMap = new Map(stations.map(s => [s.station_name, s.id]));

  const missingStation = stationNames.find(name => !stationMap.has(name));
  if (missingStation) {
    throw createError(400, `Station not found: ${missingStation}`);
  }

  return { roleMap, stationMap };
};

/**
 * 验证单个用户数据
 */
const validateSingleUser = (item) => {
  const username = (item.username || '').trim();
  const realName = (item.realName || '').trim();
  const roleCode = item.roleCode;

  if (!username || !realName || !roleCode) {
    throw createError(400, 'Name, username, and role are required');
  }
  if (item.phone && !/^1[3-9]\d{9}$/.test(item.phone)) {
    throw createError(400, `Invalid phone format: ${username}`);
  }

  return { username, realName, roleCode };
};

/**
 * 查询用户列表
 * GET /api/users
 */
export const getUsers = async (ctx) => {
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const order = getOrderBy(ctx.query);
  const { keyword, roleId, roleCode, status, stationId, departmentName, companyName } = ctx.query;

  const where = {};

  if (keyword) {
    where[Op.or] = [
      { username: { [Op.like]: `%${keyword}%` } },
      { real_name: { [Op.like]: `%${keyword}%` } },
      { phone: { [Op.like]: `%${keyword}%` } }
    ];
  }

  if (roleId) {
    where.role_id = roleId;
  }

  if (departmentName) {
    where.department_name = { [Op.like]: `%${departmentName}%` };
  }

  if (companyName) {
    where.company_name = { [Op.like]: `%${companyName}%` };
  }

  if (status !== undefined && status !== '') {
    where.status = status;
  }

  const roleInclude = { model: Role, as: 'role', attributes: ['id', 'role_name', 'role_code'] };
  if (roleCode) {
    // 支持逗号分隔的多个角色代码，例如：'station_manager,operator'
    const roleCodes = roleCode.includes(',')
      ? roleCode.split(',').map(code => code.trim())
      : [roleCode];
    roleInclude.where = { role_code: { [Op.in]: roleCodes } };
    roleInclude.required = true;
  }

  const include = [roleInclude];

  if (stationId) {
    include.push({
      model: Station,
      as: 'stations',
      where: { id: stationId },
      required: true
    });
  } else {
    include.push({
      model: Station,
      as: 'stations',
      attributes: ['id', 'station_name', 'station_type'],
      through: { attributes: [] }
    });
  }

  const result = await User.findAndCountAll({
    where,
    include,
    offset,
    limit,
    order,
    attributes: { exclude: ['password'] },
    distinct: true
  });

  const plainRows = result.rows.map(row => row.get({ plain: true }));
  const userIds = plainRows.map(row => row.id).filter(Boolean);
  const scheduleStationsByUser = new Map();

  if (userIds.length > 0) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    const schedules = await Schedule.findAll({
      where: {
        user_id: { [Op.in]: userIds },
        year: currentYear,
        month: currentMonth
      },
      include: [
        { model: Station, as: 'station', attributes: ['id', 'station_name'] }
      ],
      attributes: ['user_id', 'station_id']
    });

    schedules.forEach(schedule => {
      const userId = schedule.user_id;
      const stationIdValue = schedule.station_id;
      if (!userId || !stationIdValue) return;

      if (!scheduleStationsByUser.has(userId)) {
        scheduleStationsByUser.set(userId, new Map());
      }
      const stationMap = scheduleStationsByUser.get(userId);
      stationMap.set(stationIdValue, schedule.station?.station_name || '');
    });
  }

  const rowsWithScheduleStations = plainRows.map(row => {
    const stationMap = scheduleStationsByUser.get(row.id);
    const scheduleStations = stationMap
      ? Array.from(stationMap.entries()).map(([id, stationName]) => ({ id, stationName }))
      : [];
    return { ...row, scheduleStations };
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: formatPaginationResponse(
      { rows: rowsWithScheduleStations, count: result.count },
      page,
      pageSize
    )
  };
};

/**
 * 获取用户详情
 * GET /api/users/:id
 */
export const getUserById = async (ctx) => {
  const { id } = ctx.params;

  const user = await User.findByPk(id, {
    include: [
      { model: Role, as: 'role' },
      { model: Station, as: 'stations' }
    ],
    attributes: { exclude: ['password'] }
  });

  if (!user) {
    throw createError(404, 'User not found');
  }

  ctx.body = {
    code: 200,
    message: 'success',
    data: user
  };
};

/**
 * 新增用户
 * POST /api/users
 */
export const createUser = async (ctx) => {
  const { username, password, realName, phone, email, departmentName, companyName, roleId, roleCode, isPriceAdmin, stationIds, status } = ctx.request.body;

  const resolvedRoleId = await resolveRoleId({ roleId, roleCode });
  if (!username || !realName || !resolvedRoleId) {
    throw createError(400, 'Username, real name, and role are required');
  }

  // 检查用户名是否已存在
  const existUser = await User.findOne({ where: { username } });
  if (existUser) {
    throw createError(400, 'Username already exists');
  }

  // 如果没有提供密码，生成随机密码
  const userPassword = password || generateRandomPassword();
  const hashedPassword = await bcrypt.hash(userPassword, 10);

  const user = await User.create({
    username,
    password: hashedPassword,
    real_name: realName,
    department_name: departmentName,
    company_name: companyName,
    phone,
    email,
    role_id: resolvedRoleId,
    is_price_admin: isPriceAdmin || 0,
    status: status !== undefined ? status : 1
  });

  // 关联场站
  if (stationIds && stationIds.length > 0) {
    await UserStation.bulkCreate(
      stationIds.map(stationId => ({ user_id: user.id, station_id: stationId }))
    );
  }

  ctx.body = {
    code: 200,
    message: '用户创建成功',
    data: {
      id: user.id,
      username: user.username,
      initialPassword: password ? undefined : userPassword
    }
  };
};

/**
 * 编辑用户
 * PUT /api/users/:id
 */
export const updateUser = async (ctx) => {
  const { id } = ctx.params;
  const { realName, phone, email, departmentName, companyName, roleId, roleCode, isPriceAdmin, status, stationIds } = ctx.request.body;

  const user = await User.findByPk(id);
  if (!user) {
    throw createError(404, 'User not found');
  }

  // 更新用户信息
  const resolvedRoleId = await resolveRoleId({ roleId, roleCode });
  const updateData = {
    real_name: realName,
    department_name: departmentName,
    company_name: companyName,
    phone,
    email,
    is_price_admin: isPriceAdmin,
    status
  };
  if (resolvedRoleId) {
    updateData.role_id = resolvedRoleId;
  }

  await user.update(updateData);

  // 更新场站关联
  if (stationIds !== undefined) {
    await UserStation.destroy({ where: { user_id: id } });
    if (stationIds.length > 0) {
      await UserStation.bulkCreate(
        stationIds.map(stationId => ({ user_id: id, station_id: stationId }))
      );
    }
  }

  ctx.body = {
    code: 200,
    message: '用户更新成功',
    data: null
  };
};

/**
 * 删除用户
 * DELETE /api/users/:id
 */
export const deleteUser = async (ctx) => {
  const { id } = ctx.params;

  const user = await User.findByPk(id);
  if (!user) {
    throw createError(404, 'User not found');
  }

  // 不允许删除管理员
  if (user.username === 'admin') {
    throw createError(400, 'Cannot delete admin user');
  }

  // 删除关联关系
  await UserStation.destroy({ where: { user_id: id } });

  // 删除用户
  await user.destroy();

  ctx.body = {
    code: 200,
    message: '用户删除成功',
    data: null
  };
};

/**
 * 批量导入用户
 * POST /api/users/batch-import
 */
export const batchImportUsers = async (ctx) => {
  const { users } = ctx.request.body || {};

  await validateImportData(users);
  const { roleMap, stationMap } = await prepareImportMaps(users);

  const transaction = await sequelize.transaction();
  try {
    const userStations = [];

    for (const item of users) {
      const { username, realName, roleCode } = validateSingleUser(item);

      const roleId = roleMap.get(roleCode);
      const password = item.password || '123456';
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        username,
        password: hashedPassword,
        real_name: realName,
        department_name: item.departmentName || null,
        company_name: item.companyName || null,
        phone: item.phone || null,
        email: item.email || null,
        role_id: roleId,
        is_price_admin: item.isPriceAdmin ? 1 : 0,
        status: 1
      }, { transaction });

      const stationId = item.stationName ? stationMap.get(item.stationName) : null;
      if (stationId) {
        userStations.push({ user_id: user.id, station_id: stationId });
      }
    }

    if (userStations.length > 0) {
      await UserStation.bulkCreate(userStations, { transaction });
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  ctx.body = {
    code: 200,
    message: '导入成功',
    data: { count: users.length }
  };
};

/**
 * 重置密码
 * PUT /api/users/:id/reset-password
 */
export const resetPassword = async (ctx) => {
  const { id } = ctx.params;

  const user = await User.findByPk(id);
  if (!user) {
    throw createError(404, 'User not found');
  }

  const password = '123456';
  const hashedPassword = await bcrypt.hash(password, 10);

  await user.update({ password: hashedPassword });

  ctx.body = {
    code: 200,
    message: '密码重置成功',
    data: {
      newPassword: password
    }
  };
};

/**
 * 绑定用户到场站
 * POST /api/users/:id/stations
 */
export const bindUserStations = async (ctx) => {
  const { id } = ctx.params;
  const { stationIds } = ctx.request.body;

  const user = await User.findByPk(id);
  if (!user) {
    throw createError(404, 'User not found');
  }

  await UserStation.destroy({ where: { user_id: id } });

  if (stationIds && stationIds.length > 0) {
    await UserStation.bulkCreate(
      stationIds.map(stationId => ({ user_id: id, station_id: stationId }))
    );
  }

  ctx.body = {
    code: 200,
    message: '场站绑定成功',
    data: null
  };
};

export default {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  batchImportUsers,
  resetPassword,
  bindUserStations
};


