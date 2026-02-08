/**
 * 角色权限检查中间件
 * @param {string|string[]} allowedRoles - 允许访问的角色编码
 */

import { Station } from '../../../models/index.js';
export const checkRole = (allowedRoles) => {
  if (!Array.isArray(allowedRoles)) {
    allowedRoles = [allowedRoles];
  }

  return async (ctx, next) => {
    const user = ctx.state.user;

    if (!user) {
      ctx.status = 401;
      ctx.body = { code: 401, message: '未登录' };
      return;
    }

    const userRole = user.baseRoleCode || user.roleCode;

    // 管理员拥有所有权限
    if (userRole === 'admin' || userRole === 'dev_test') {
      await next();
      return;
    }

    if (!allowedRoles.includes(userRole)) {
      ctx.status = 403;
      ctx.body = { code: 403, message: '无权限访问' };
      return;
    }

    await next();
  };
};

/**
 * 数据权限过滤中间件
 * 根据用户角色设置数据访问范围
 */
export const checkDataPermission = async (ctx, next) => {
  const user = ctx.state.user;

  if (!user) {
    ctx.status = 401;
    ctx.body = { code: 401, message: '未登录' };
    return;
  }

  const roleCode = user.baseRoleCode || user.roleCode;
  const { id: userId, stations, departmentName } = user;
  let dataFilter = {};

  switch (roleCode) {
    case 'operator':
      // 操作岗：只能看自己且本场站
      dataFilter = {
        userId,
        stationIds: stations?.map((station) => station.id) || []
      };
      break;

    case 'maintenance': {
      // 维修岗：不做场站限制（覆盖全部场站），仍按本人限制
      const allStations = await Station.findAll({ attributes: ['id'] });
      dataFilter = {
        userId,
        stationIds: allStations.map((station) => station.id)
      };
      break;
    }


    case 'station_manager':
      // 站长：本场站全部数据
      dataFilter = {
        stationIds: stations?.map((station) => station.id) || []
      };
      break;

    case 'deputy_manager':
    case 'department_manager':
    case 'senior_management':
      // 部门副经理/部门经理/高层：全部场站
      dataFilter = { all: true };
      break;

    case 'safety_inspector':
      // 安全员：全部数据
      dataFilter = { all: true };
      break;

    case 'client':
      // 甲方：只读
      dataFilter = {
        readonly: true,
        stationIds: stations?.map((station) => station.id) || []
      };
      break;

    case 'admin':
      // 管理员：全部数据
      dataFilter = { all: true };
      break;
    case 'dev_test':
      // 开发测试：全部数据
      dataFilter = { all: true };
      break;

    default:
      dataFilter = { none: true };
  }

  ctx.state.dataFilter = dataFilter;
  await next();
};

/**
 * 检查是否为单价管理员
 */
export const checkPriceAdmin = async (ctx, next) => {
  const user = ctx.state.user;

  if (!user) {
    ctx.status = 401;
    ctx.body = { code: 401, message: '未登录' };
    return;
  }

  // 系统管理员或单价专员可以管理单价
  if ((user.baseRoleCode || user.roleCode) === 'admin' || (user.baseRoleCode || user.roleCode) === 'dev_test' || user.isPriceAdmin) {
    await next();
    return;
  }

  ctx.status = 403;
  ctx.body = { code: 403, message: '无单价管理权限' };
};

/**
 * 检查只读权限
 */
export const checkReadonly = async (ctx, next) => {
  const dataFilter = ctx.state.dataFilter;

  if (dataFilter?.readonly && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(ctx.method)) {
    ctx.status = 403;
    ctx.body = { code: 403, message: '您只有只读权限' };
    return;
  }

  await next();
};

// 角色层级定义（数字越大权限越高）
const roleHierarchy = {
  client: 0, // 甲方人员 - 只读
  operator: 1, // 操作岗
  maintenance: 1, // 维修岗
  station_manager: 2, // 站长
  deputy_manager: 3, // 部门副经理
  department_manager: 4, // 部门经理
  safety_inspector: 4, // 安全员
  senior_management: 5, // 高层（常务副总、总工程师、总经理、董事长）
  admin: 10, // 系统管理员
  dev_test: 10 // 开发测试
};

/**
 * 检查角色层级
 * @param {number} minLevel - 最低要求的层级
 */
export const checkRoleLevel = (minLevel) => {
  return async (ctx, next) => {
    const user = ctx.state.user;
    const userLevel = roleHierarchy[user.baseRoleCode || user.roleCode] || 0;

    if (userLevel < minLevel) {
      ctx.status = 403;
      ctx.body = { code: 403, message: '权限不足' };
      return;
    }

    await next();
  };
};

export default {
  checkRole,
  checkDataPermission,
  checkPriceAdmin,
  checkReadonly,
  checkRoleLevel
};
