import logger from '../config/logger.js';

/**
 * 全局错误处理中间件
 */
export const errorHandler = async (ctx, next) => {
  try {
    await next();

    // 处理404
    if (ctx.status === 404 && !ctx.body) {
      ctx.status = 404;
      ctx.body = {
        code: 404,
        message: '接口不存在',
        data: null
      };
    }
  } catch (error) {
    // 记录错误日志
    logger.error('服务器错误:', {
      error: error.message,
      stack: error.stack,
      url: ctx.url,
      method: ctx.method,
      body: ctx.request.body,
      user: ctx.state?.user?.id
    });

    // Joi验证错误
    if (error.isJoi) {
      ctx.status = 400;
      ctx.body = {
        code: 400,
        message: '参数验证失败',
        errors: error.details.map(d => d.message)
      };
      return;
    }

    // Sequelize验证错误
    if (error.name === 'SequelizeValidationError') {
      ctx.status = 400;
      ctx.body = {
        code: 400,
        message: '数据验证失败',
        errors: error.errors.map(e => e.message)
      };
      return;
    }

    // Sequelize唯一性约束错误
    if (error.name === 'SequelizeUniqueConstraintError') {
      ctx.status = 400;
      ctx.body = {
        code: 400,
        message: '数据已存在',
        errors: error.errors.map(e => e.message)
      };
      return;
    }

    // Sequelize外键约束错误
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      ctx.status = 400;
      ctx.body = {
        code: 400,
        message: '关联数据不存在或无法删除',
        data: null
      };
      return;
    }

    // 自定义业务错误
    if (error.status) {
      ctx.status = error.status;
      ctx.body = {
        code: error.status,
        message: error.message,
        data: null
      };
      return;
    }

    // 默认服务器错误
    ctx.status = 500;
    ctx.body = {
      code: 500,
      message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : error.message,
      data: null
    };
  }
};

/**
 * 请求日志中间件
 */
export const requestLogger = async (ctx, next) => {
  const start = Date.now();

  await next();

  const ms = Date.now() - start;
  const logData = {
    method: ctx.method,
    url: ctx.url,
    status: ctx.status,
    duration: `${ms}ms`,
    ip: ctx.ip,
    user: ctx.state?.user?.id
  };

  if (ctx.status >= 400) {
    logger.warn('请求异常:', logData);
  } else {
    logger.info('请求完成:', logData);
  }
};

/**
 * 创建业务错误
 */
export const createError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

export default { errorHandler, requestLogger, createError };
