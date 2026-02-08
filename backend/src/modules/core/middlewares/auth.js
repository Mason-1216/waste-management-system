import jwt from 'jsonwebtoken';
import jwtConfig from '../config/jwt.js';
import { User, Role, Station } from '../../../models/index.js';

/**
 * JWT认证中间件
 */
export const authMiddleware = async (ctx, next) => {
  const authHeader = ctx.headers.authorization;

  if (!authHeader) {
    ctx.status = 401;
    ctx.body = { code: 401, message: '未提供认证令牌' };
    return;
  }

  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    ctx.status = 401;
    ctx.body = { code: 401, message: '认证令牌格式错误' };
    return;
  }

  let decoded;
  try {
    decoded = jwt.verify(token, jwtConfig.secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      ctx.status = 401;
      ctx.body = { code: 401, message: '认证令牌已过期' };
    } else if (error.name === 'JsonWebTokenError') {
      ctx.status = 401;
      ctx.body = { code: 401, message: '认证令牌无效' };
    } else {
      ctx.status = 500;
      ctx.body = { code: 500, message: '认证失败' };
    }
    return;
  }

  // 查询用户完整信息
  const user = await User.findByPk(decoded.userId, {
    include: [
      { model: Role, as: 'role' },
      { model: Station, as: 'stations' }
    ]
  });

  if (!user) {
    ctx.status = 401;
    ctx.body = { code: 401, message: '用户不存在' };
    return;
  }

  if (user.status !== 1) {
    ctx.status = 401;
    ctx.body = { code: 401, message: '用户已被禁用' };
    return;
  }

  // 将用户信息挂载到ctx.state
  ctx.state.user = {
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
    stations: user.stations || [],
    lastStationId: user.last_station_id,
    lastProjectId: user.last_project_id
  };

  await next();
};

/**
 * 可选认证中间件（不强制要求登录）
 */
export const optionalAuth = async (ctx, next) => {
  const authHeader = ctx.headers.authorization;

  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    try {
      const decoded = jwt.verify(token, jwtConfig.secret);
      const user = await User.findByPk(decoded.userId, {
        include: [{ model: Role, as: 'role' }]
      });

      if (user && user.status === 1) {
        ctx.state.user = {
          id: user.id,
          username: user.username,
          realName: user.real_name,
          roleCode: user.role?.role_code,
          baseRoleCode: user.role?.base_role_code || user.role?.role_code
        };
      }
    } catch (error) {
      // 忽略token验证错误
    }
  }

  await next();
};

/**
 * 生成JWT令牌
 */
export const generateToken = (user) => {
  const payload = {
    userId: user.id,
    username: user.username,
    roleId: user.role_id
  };

  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
    algorithm: jwtConfig.algorithm
  });
};

export default { authMiddleware, optionalAuth, generateToken };

