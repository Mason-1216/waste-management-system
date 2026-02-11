import bcrypt from 'bcryptjs';
import { User, Role, Station, RolePermission, Permission } from '../../../models/index.js';
import { generateToken } from '../middlewares/auth.js';
import { createError } from '../../../middlewares/error.js';
import { ensureRolePermissions, getUserPermissionOverrides, mergePermissionCodes } from './permissionService.js';
import { flattenMenuPermissions } from '../../../config/permissionSeeds.js';

const ALWAYS_VISIBLE_MENU_CODES = ['menu:/home', 'menu:/change-password'];

const buildMenuPathList = () => {
  const codes = flattenMenuPermissions()
    .map(item => item?.code)
    .filter(code => typeof code === 'string' && code.startsWith('menu:/'));

  const paths = codes
    .map(code => code.slice(5))
    .filter(Boolean);

  paths.sort((a, b) => b.length - a.length);
  return paths;
};

const KNOWN_MENU_PATHS = buildMenuPathList();

const resolveMenuCodeForPath = (path) => {
  if (!path || typeof path !== 'string') return null;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  for (const menuPath of KNOWN_MENU_PATHS) {
    if (normalized === menuPath || normalized.startsWith(`${menuPath}/`)) {
      return `menu:${menuPath}`;
    }
  }
  return null;
};

const MODULE_TO_ROUTE_PATH_ALIASES = new Map([
  // Admin modules (module codes are not 1:1 with route paths)
  ['module:user', ['/user-management']],
  ['module:organization', ['/organization-management']],

  // Task module: historical naming does not match menu paths 1:1
  // Base "岗位工作" view/edit should allow entering the record list menu node.
  ['module:position-work', ['/position-work', '/position-work/records']],
  ['module:position-work:my-work', ['/position-work/field']],
  // "tasks" covers both fill + history pages in the menu.
  ['module:temporary-tasks:tasks', ['/temporary-tasks/fill', '/temporary-tasks/history']]
]);

const routePathsFromModuleCode = (moduleCode) => {
  if (!moduleCode || typeof moduleCode !== 'string') return [];
  if (!moduleCode.startsWith('module:')) return [];
  const suffixes = [':view', ':edit'];
  const suffix = suffixes.find(s => moduleCode.endsWith(s));
  const base = suffix ? moduleCode.slice(0, -suffix.length) : moduleCode;

  const alias = MODULE_TO_ROUTE_PATH_ALIASES.get(base);
  if (Array.isArray(alias) && alias.length > 0) return alias;

  // Organization permissions are fine-grained (station/department/company/role) but share the same menu entry.
  if (base.startsWith('module:organization:')) {
    return ['/organization-management'];
  }

  const normalized = base.slice(7).replace(/:/g, '/');
  if (!normalized) return [];
  return [`/${normalized}`];
};

const deriveMenuCodesFromPermissionCodes = (permissionCodes = []) => {
  const menuSet = new Set(ALWAYS_VISIBLE_MENU_CODES);
  const moduleCodes = (permissionCodes || []).filter(code =>
    typeof code === 'string'
    && code.startsWith('module:')
    // 菜单仅由模块“动作权限”驱动（view/edit）。基础 module:* code 仅用于分组/展示，不参与派生菜单。
    && (code.endsWith(':view') || code.endsWith(':edit'))
  );

  moduleCodes.forEach((moduleCode) => {
    const paths = routePathsFromModuleCode(moduleCode);
    paths.forEach((path) => {
      const resolved = resolveMenuCodeForPath(path);
      if (resolved) menuSet.add(resolved);
    });
  });

  return Array.from(menuSet);
};

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
  const menuCodes = deriveMenuCodesFromPermissionCodes(permissionCodes);
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
