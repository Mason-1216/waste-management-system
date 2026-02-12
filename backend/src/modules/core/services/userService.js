import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { User, Role, Station, UserStation, Schedule, UserPermission } from '../../../models/index.js';
import { createError } from '../../../middlewares/error.js';
import { getPagination, formatPaginationResponse, getOrderBy, generateRandomPassword } from '../../../utils/helpers.js';
import sequelize from '../../../config/database.js';
import { DEV_TEST_ROLE_CODE, DEV_TEST_USERNAME } from '../../../config/dev_test.js';

const normalizeText = (value) => (value === undefined || value === null ? '' : String(value));
const isDevTestUsername = (username) => normalizeText(username).trim() === DEV_TEST_USERNAME;

const getDevTestRoleId = async () => {
  const role = await Role.findOne({ where: { role_code: DEV_TEST_ROLE_CODE } });
  return role ? role.id : null;
};

const resolveRoleId = async ({ roleId, roleCode }) => {
  if (roleId) return roleId;
  if (!roleCode) return null;

  const role = await Role.findOne({ where: { role_code: roleCode } });
  if (!role) {
    throw createError(400, 'Invalid role');
  }
  return role.id;
};

const normalizeSuggestionQuery = (value) => (value === undefined || value === null ? '' : String(value).trim());
const resolveSuggestionLimit = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return 50;
  }
  return Math.min(parsed, 200);
};

const buildSuggestionWhere = ({ columnName, q }) => {
  const query = normalizeSuggestionQuery(q);

  const constraints = [
    { [columnName]: { [Op.ne]: null } },
    { [columnName]: { [Op.ne]: '' } }
  ];

  if (query) {
    constraints.push({ [columnName]: { [Op.like]: `%${query}%` } });
  }

  return {
    username: { [Op.ne]: DEV_TEST_USERNAME },
    [Op.and]: constraints
  };
};

const saveUserPermissions = async (userId, allowIds = [], denyIds = []) => {
  await UserPermission.destroy({ where: { user_id: userId } });

  const allowList = (allowIds || []).map(id => Number(id)).filter(Boolean);
  const denyList = (denyIds || []).map(id => Number(id)).filter(Boolean);

  const rows = [];
  allowList.forEach(id => rows.push({ user_id: userId, permission_id: id, effect: 'allow' }));
  denyList.forEach(id => rows.push({ user_id: userId, permission_id: id, effect: 'deny' }));

  if (rows.length > 0) {
    await UserPermission.bulkCreate(rows);
  }
};

const getUserPermissionIds = async (userId) => {
  const records = await UserPermission.findAll({ where: { user_id: userId } });
  const allowIds = [];
  const denyIds = [];
  records.forEach(record => {
    if (record.effect === 'deny') {
      denyIds.push(record.permission_id);
    } else {
      allowIds.push(record.permission_id);
    }
  });
  return { allowIds, denyIds };
};

/**
 * 验证批量导入数据
 */
const validateImportData = async (users) => {
  if (!Array.isArray(users) || users.length === 0) {
    throw createError(400, '导入数据不能为空');
  }
  if (users.length > 100) {
    throw createError(400, '一次最多导入 100 条数据');
  }

  const usernames = users.map(u => (u.username || '').trim()).filter(Boolean);
  const uniqueUsernames = new Set(usernames);
  if (uniqueUsernames.size !== usernames.length) {
    throw createError(400, '导入数据中存在重复的用户名');
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

  const stationNames = [...new Set(
    users
      .filter(u => u.roleCode === 'client')
      .map(item => (item.stationName ? String(item.stationName).trim() : ''))
      .filter(Boolean)
  )];

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
    throw createError(400, '用户名、姓名、角色不能为空');
  }
  if (item.phone && !/^1[3-9]\d{9}$/.test(item.phone)) {
    throw createError(400, `手机号格式错误：${username}`);
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
    // User management "keyword" filter is now name-only (real_name).
    where.real_name = { [Op.like]: `%${keyword}%` };
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
    // Support comma-separated role codes, e.g. 'station_manager,operator'
    const roleCodes = roleCode.includes(',')
      ? roleCode.split(',').map(code => code.trim()).filter(Boolean)
      : [roleCode];
    roleInclude.where = {
      [Op.or]: [
        { role_code: { [Op.in]: roleCodes } },
        { base_role_code: { [Op.in]: roleCodes } }
      ]
    };
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
 * 用户姓名候选（用于筛选输入框下拉）
 * GET /api/users/real-name-suggestions
 */
export const getUserRealNameSuggestions = async (ctx) => {
  const { q, limit } = ctx.query;
  const resolvedLimit = resolveSuggestionLimit(limit);
  const where = buildSuggestionWhere({ columnName: 'real_name', q });

  const rows = await User.findAll({
    attributes: ['real_name'],
    where,
    group: ['real_name'],
    order: [['real_name', 'ASC']],
    limit: resolvedLimit,
    raw: true
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: rows.map((r) => r.real_name).filter(Boolean)
  };
};

/**
 * 用户公司候选（用于筛选输入框下拉）
 * GET /api/users/company-name-suggestions
 */
export const getUserCompanyNameSuggestions = async (ctx) => {
  const { q, limit } = ctx.query;
  const resolvedLimit = resolveSuggestionLimit(limit);
  const where = buildSuggestionWhere({ columnName: 'company_name', q });

  const rows = await User.findAll({
    attributes: ['company_name'],
    where,
    group: ['company_name'],
    order: [['company_name', 'ASC']],
    limit: resolvedLimit,
    raw: true
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: rows.map((r) => r.company_name).filter(Boolean)
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

  const { allowIds, denyIds } = await getUserPermissionIds(id);

  ctx.body = {
    code: 200,
    message: 'success',
    data: {
      ...user.toJSON(),
      allowPermissionIds: allowIds,
      denyPermissionIds: denyIds
    }
  };
};

/**
 * 新增用户
 * POST /api/users
 */
export const createUser = async (ctx) => {
  const {
    username,
    password,
    realName,
    phone,
    email,
    departmentName,
    companyName,
    roleId,
    roleCode,
    isPriceAdmin,
    stationIds,
    status,
    allowPermissionIds,
    denyPermissionIds
  } = ctx.request.body;

  const resolvedRoleId = await resolveRoleId({ roleId, roleCode });
  if (!username || !realName || !resolvedRoleId) {
    throw createError(400, 'Username, real name, and role are required');
  }

  const devTestRoleId = await getDevTestRoleId();
  const isDevUser = isDevTestUsername(username);
  if (isDevUser && !devTestRoleId) {
    throw createError(400, '开发测试角色不存在');
  }
  if (devTestRoleId && resolvedRoleId === devTestRoleId && !isDevUser) {
    throw createError(400, '开发测试角色仅限账号 sum');
  }
  if (isDevUser && devTestRoleId && resolvedRoleId !== devTestRoleId) {
    throw createError(400, '开发测试账号角色必须为开发测试');
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

  await saveUserPermissions(user.id, allowPermissionIds, denyPermissionIds);

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
  const {
    realName,
    phone,
    email,
    departmentName,
    companyName,
    roleId,
    roleCode,
    isPriceAdmin,
    status,
    stationIds,
    allowPermissionIds,
    denyPermissionIds
  } = ctx.request.body;

  const user = await User.findByPk(id);
  if (!user) {
    throw createError(404, 'User not found');
  }

  // 更新用户信息
  const resolvedRoleId = await resolveRoleId({ roleId, roleCode });
  const devTestRoleId = await getDevTestRoleId();
  const isDevUser = isDevTestUsername(user.username);
  let targetRoleId = resolvedRoleId;

  if (isDevUser) {
    if (!devTestRoleId) {
      throw createError(500, '开发测试角色不存在');
    }
    if (resolvedRoleId && resolvedRoleId !== devTestRoleId) {
      throw createError(400, '开发测试账号角色不可修改');
    }
    targetRoleId = devTestRoleId;
  } else if (resolvedRoleId && devTestRoleId && resolvedRoleId === devTestRoleId) {
    throw createError(400, '开发测试角色仅限账号 sum');
  }

  const updateData = {
    real_name: realName,
    department_name: departmentName,
    company_name: companyName,
    phone,
    email,
    is_price_admin: isPriceAdmin,
    status
  };
  if (targetRoleId) {
    updateData.role_id = targetRoleId;
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

  await saveUserPermissions(id, allowPermissionIds, denyPermissionIds);

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
  if (isDevTestUsername(user.username)) {
    throw createError(400, '开发测试账号不可删除');
  }

  // 删除关联关系
  await UserPermission.destroy({ where: { user_id: id } });
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

  const devTestRoleUsers = users.filter(item => normalizeText(item.roleCode).trim() === DEV_TEST_ROLE_CODE);
  const devTestUsers = users.filter(item => isDevTestUsername(item.username));

  if (devTestRoleUsers.some(item => !isDevTestUsername(item.username))) {
    throw createError(400, '开发测试角色仅限账号 sum');
  }
  if (devTestUsers.some(item => normalizeText(item.roleCode).trim() !== DEV_TEST_ROLE_CODE)) {
    throw createError(400, '开发测试账号角色必须为开发测试');
  }

  const transaction = await sequelize.transaction();
  try {
    const userStations = [];
    const stationBindingsToReplace = new Set();

    for (const item of users) {
      const { username, realName, roleCode } = validateSingleUser(item);

      const roleId = roleMap.get(roleCode);

      const existing = await User.findOne({ where: { username }, transaction });
      let user = existing;

      if (!existing) {
        const password = item.password ? String(item.password) : '123456';
        const hashedPassword = await bcrypt.hash(password, 10);

        user = await User.create({
          username,
          password: hashedPassword,
          real_name: realName,
          department_name: item.departmentName ? String(item.departmentName).trim() : null,
          company_name: item.companyName ? String(item.companyName).trim() : null,
          phone: item.phone ? String(item.phone).trim() : null,
          email: item.email ? String(item.email).trim() : null,
          role_id: roleId,
          is_price_admin: item.isPriceAdmin ? 1 : 0,
          status: 1
        }, { transaction });
      } else {
        const patch = {};
        if (realName && realName !== existing.real_name) {
          patch.real_name = realName;
        }
        if (item.departmentName && String(item.departmentName).trim() && String(item.departmentName).trim() !== (existing.department_name ?? '')) {
          patch.department_name = String(item.departmentName).trim();
        }
        if (item.companyName && String(item.companyName).trim() && String(item.companyName).trim() !== (existing.company_name ?? '')) {
          patch.company_name = String(item.companyName).trim();
        }
        if (item.phone && String(item.phone).trim() && String(item.phone).trim() !== (existing.phone ?? '')) {
          patch.phone = String(item.phone).trim();
        }
        if (item.email && String(item.email).trim() && String(item.email).trim() !== (existing.email ?? '')) {
          patch.email = String(item.email).trim();
        }
        if (roleId && roleId !== existing.role_id) {
          patch.role_id = roleId;
        }
        if (item.isPriceAdmin !== undefined && item.isPriceAdmin !== null) {
          const next = item.isPriceAdmin ? 1 : 0;
          if (next !== existing.is_price_admin) {
            patch.is_price_admin = next;
          }
        }
        if (Object.keys(patch).length > 0) {
          await existing.update(patch, { transaction });
          user = existing;
        }
      }

      const isClientRole = roleCode === 'client';
      const stationName = isClientRole && item.stationName
        ? String(item.stationName).trim()
        : '';
      const stationId = stationName ? stationMap.get(stationName) : null;
      if (isClientRole && !existing && !stationId) {
        throw createError(400, `客户端用户必须填写所属场站：${username}`);
      }

      if (stationId) {
        userStations.push({ user_id: user.id, station_id: stationId });
        stationBindingsToReplace.add(user.id);
      }
    }

    if (stationBindingsToReplace.size > 0) {
      await UserStation.destroy({
        where: { user_id: { [Op.in]: Array.from(stationBindingsToReplace) } },
        transaction
      });
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

export const previewBatchImportUsers = async (ctx) => {
  const { users } = ctx.request.body || {};
  await validateImportData(users);
  const { roleMap, stationMap } = await prepareImportMaps(users);

  const usernames = users.map(u => (u.username || '').trim()).filter(Boolean);
  const existingUsers = usernames.length > 0
    ? await User.findAll({
      where: { username: { [Op.in]: usernames } },
      attributes: ['id', 'username', 'real_name', 'department_name', 'company_name', 'phone', 'email', 'role_id', 'is_price_admin', 'status']
    })
    : [];

  const existingByUsername = new Map(existingUsers.map(u => [u.username, u]));

  const stationBindings = existingUsers.length > 0
    ? await UserStation.findAll({
      where: { user_id: { [Op.in]: existingUsers.map(u => u.id) } },
      attributes: ['user_id', 'station_id']
    })
    : [];
  const stationIdByUserId = new Map(stationBindings.map(r => [r.user_id, r.station_id]));

  const stations = await Station.findAll({ attributes: ['id', 'station_name'] });
  const stationNameById = new Map(stations.map(s => [s.id, s.station_name]));

  const summary = { total: users.length, create: 0, update: 0, skip: 0, error: 0 };
  const rows = [];

  users.forEach((item, idx) => {
    const rowNum = idx + 2;
    const username = (item.username || '').trim();
    const realName = (item.realName || '').trim();
    const roleCode = item.roleCode;

    const previewRow = {
      rowNum,
      action: 'error',
      message: '',
      diff: {},
      username,
      realName,
      companyName: item.companyName ? String(item.companyName).trim() : '',
      departmentName: item.departmentName ? String(item.departmentName).trim() : '',
      phone: item.phone ? String(item.phone).trim() : '',
      email: item.email ? String(item.email).trim() : '',
      roleCode: roleCode ? String(roleCode).trim() : '',
      stationName: item.stationName ? String(item.stationName).trim() : ''
    };

    try {
      validateSingleUser(item);
    } catch (e) {
      previewRow.message = e.message || '数据无效';
      summary.error += 1;
      rows.push(previewRow);
      return;
    }

    const roleId = roleMap.get(roleCode);
    if (!roleId) {
      previewRow.message = '角色无效';
      summary.error += 1;
      rows.push(previewRow);
      return;
    }

    const existing = existingByUsername.get(username) ?? null;
    const isClientRole = roleCode === 'client';
    const stationName = isClientRole && previewRow.stationName ? previewRow.stationName : '';
    const stationId = stationName ? stationMap.get(stationName) : null;

    if (!existing) {
      if (isClientRole && !stationId) {
        previewRow.message = '客户端用户必须填写所属场站';
        summary.error += 1;
        rows.push(previewRow);
        return;
      }
      previewRow.action = 'create';
      previewRow.message = '将新增（密码仅对新增生效）';
      summary.create += 1;
      rows.push(previewRow);
      return;
    }

    const diff = {};
    if (realName && realName !== existing.real_name) {
      diff.realName = { from: existing.real_name, to: realName };
    }
    if (previewRow.departmentName && previewRow.departmentName !== (existing.department_name ?? '')) {
      diff.departmentName = { from: existing.department_name ?? '', to: previewRow.departmentName };
    }
    if (previewRow.companyName && previewRow.companyName !== (existing.company_name ?? '')) {
      diff.companyName = { from: existing.company_name ?? '', to: previewRow.companyName };
    }
    if (previewRow.phone && previewRow.phone !== (existing.phone ?? '')) {
      diff.phone = { from: existing.phone ?? '', to: previewRow.phone };
    }
    if (previewRow.email && previewRow.email !== (existing.email ?? '')) {
      diff.email = { from: existing.email ?? '', to: previewRow.email };
    }
    if (roleId && roleId !== existing.role_id) {
      diff.roleCode = { from: existing.role_id, to: roleId };
    }

    if (isClientRole && stationId) {
      const currentStationId = stationIdByUserId.get(existing.id) ?? null;
      if (currentStationId !== stationId) {
        diff.stationName = {
          from: currentStationId ? (stationNameById.get(currentStationId) ?? '') : '',
          to: stationName
        };
      }
    }

    previewRow.diff = diff;
    if (Object.keys(diff).length === 0) {
      previewRow.action = 'skip';
      previewRow.message = '无变更，跳过（密码不覆盖）';
      summary.skip += 1;
    } else {
      previewRow.action = 'update';
      previewRow.message = '将更新（密码不覆盖）';
      summary.update += 1;
    }

    rows.push(previewRow);
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: { summary, rows }
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


