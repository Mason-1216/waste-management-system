import bcrypt from 'bcryptjs';
import { User, Role, Station, RolePermission, Permission } from '../../../models/index.js';
import { generateToken } from '../middlewares/auth.js';
import { createError } from '../../../middlewares/error.js';
import { ensureRolePermissions, getUserPermissionOverrides, mergePermissionCodes } from './permissionService.js';

const loadRolePermissions = async (roleId) => {
  const rolePermissions = await RolePermission.findAll({ where: { role_id: roleId } });
  if (!rolePermissions.length) {
    return { codes: [], menuCodes: [] };
  }
  const permissionIds = rolePermissions.map(item => item.permission_id);
  const permissions = await Permission.findAll({ where: { id: permissionIds } });
  const codes = permissions.map(item => item.permission_code);
  const menuCodes = codes.filter(code => code.startsWith('menu:/'));
  return { codes, menuCodes };
};

const loadUserPermissionCodes = async (userId, roleId) => {
  const { codes: roleCodes } = await loadRolePermissions(roleId);
  const { allow, deny } = await getUserPermissionOverrides(userId);
  const permissionCodes = mergePermissionCodes(roleCodes, allow, deny);
  const menuCodes = permissionCodes.filter(code => code.startsWith('menu:/'));
  return { permissionCodes, menuCodes, allowCodes: allow, denyCodes: deny };
};

/**
 * 用户登录
 * POST /api/auth/login
 */
export const login = async (ctx) => {
  const { username, password } = ctx.request.body;

  if (!username || !password) {
    throw createError(400, '用户名和密码不能为空');
  }

  // 查询用户
  const user = await User.findOne({
    where: { username },
    include: [
      { model: Role, as: 'role' },
      { model: Station, as: 'stations' }
    ]
  });

  if (!user) {
    throw createError(401, '用户名或密码错误');
  }

  if (user.status !== 1) {
    throw createError(401, '账号已被禁用');
  }

  // 验证密码
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw createError(401, '用户名或密码错误');
  }

  await ensureRolePermissions();
  const { permissionCodes, menuCodes } = await loadUserPermissionCodes(user.id, user.role_id);

  // 生成token
  const token = generateToken(user);

  // 返回用户信息
  ctx.body = {
    code: 200,
    message: '登录成功',
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        realName: user.real_name,
        phone: user.phone,
        departmentName: user.department_name,
        roleId: user.role_id,
        roleCode: user.role?.role_code,
        roleName: user.role?.role_name,
        baseRoleCode: user.role?.base_role_code || user.role?.role_code,
        isPriceAdmin: user.is_price_admin,
        permissionCodes,
        menuCodes,
        stations: user.stations?.map(s => ({
          id: s.id,
          stationName: s.station_name,
          stationType: s.station_type
        })) || [],
        lastStationId: user.last_station_id
      }
    }
  };
};

/**
 * 用户退出
 * POST /api/auth/logout
 */
export const logout = async (ctx) => {
  // JWT无状态，客户端清除token即可
  ctx.body = {
    code: 200,
    message: '退出成功',
    data: null
  };
};

/**
 * 修改密码
 * PUT /api/auth/change-password
 */
export const changePassword = async (ctx) => {
  const { oldPassword, newPassword } = ctx.request.body;
  const userId = ctx.state.user.id;

  if (!oldPassword || !newPassword) {
    throw createError(400, '旧密码和新密码不能为空');
  }

  if (newPassword.length < 6) {
    throw createError(400, '新密码长度不能少于6位');
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw createError(404, '用户不存在');
  }

  // 验证旧密码
  const isValidPassword = await bcrypt.compare(oldPassword, user.password);
  if (!isValidPassword) {
    throw createError(400, '旧密码错误');
  }

  // 更新密码
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await user.update({ password: hashedPassword });

  ctx.body = {
    code: 200,
    message: '密码修改成功',
    data: null
  };
};

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
export const getCurrentUser = async (ctx) => {
  const userId = ctx.state.user.id;

  const user = await User.findByPk(userId, {
    include: [
      { model: Role, as: 'role' },
      { model: Station, as: 'stations' }
    ]
  });

  if (!user) {
    throw createError(404, '用户不存在');
  }

  await ensureRolePermissions();
  const { permissionCodes, menuCodes } = await loadUserPermissionCodes(user.id, user.role_id);

  ctx.body = {
    code: 200,
    message: 'success',
    data: {
      id: user.id,
      username: user.username,
      realName: user.real_name,
      phone: user.phone,
      departmentName: user.department_name,
      roleId: user.role_id,
      roleCode: user.role?.role_code,
      roleName: user.role?.role_name,
      baseRoleCode: user.role?.base_role_code || user.role?.role_code,
      isPriceAdmin: user.is_price_admin,
      permissionCodes,
      menuCodes,
      stations: user.stations?.map(s => ({
        id: s.id,
        stationName: s.station_name,
        stationType: s.station_type
      })) || [],
      lastStationId: user.last_station_id
    }
  };
};

/**
 * 更新用户上下文（最后访问的场站）
 * PUT /api/auth/context
 */
export const updateContext = async (ctx) => {
  const { stationId } = ctx.request.body;
  const userId = ctx.state.user.id;

  const updateData = {};
  if (stationId !== undefined) {
    updateData.last_station_id = stationId;
  }

  await User.update(updateData, { where: { id: userId } });

  ctx.body = {
    code: 200,
    message: '上下文更新成功',
    data: null
  };
};

export default {
  login,
  logout,
  changePassword,
  getCurrentUser,
  updateContext
};
