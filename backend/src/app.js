import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import { createServer } from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import sequelize, { testConnection } from './config/database.js';
import { errorHandler, requestLogger } from './middlewares/error.js';
import router from './routes/index.js';
import { startCronJobs } from './modules/jobs/services/cronJobs.js';
import { startPlcWatcher } from './modules/plc/services/plcIngestion.js';
import logger from './config/logger.js';
import { defineAssociations } from './models/index.js';
import { ensureDevTestAccount } from './modules/core/services/devTestGuard.js';
import { createSocketServer } from './modules/core/app/socket.js';
import { registerGracefulShutdown } from './modules/core/app/gracefulShutdown.js';
import { ensureDir } from './modules/core/app/runtimeDirs.js';
import { registerUploadsStatic } from './modules/file_storage/app/uploadsStatic.js';

// 加载环境变量
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 运行时目录
const uploadDir = path.join(__dirname, '..', 'uploads');
const logDir = path.join(__dirname, '..', 'logs');

ensureDir(uploadDir);
ensureDir(logDir);

const app = new Koa();
const httpServer = createServer(app.callback());

// Socket.IO
const io = createSocketServer(httpServer, {
  corsOrigin: process.env.CORS_ORIGIN || '*',
  logger
});

// 将io实例挂载到app.context，便于全局访问
app.context.io = io;

// 全局中间件
app.use(errorHandler);
app.use(requestLogger);

// CORS 配置
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// 请求体解析
app.use(bodyParser({
  jsonLimit: '10mb',
  formLimit: '10mb'
}));

// 静态文件服务（上传的文件）
registerUploadsStatic(app, { uploadDir });

// API 路由
app.use(router.routes());
app.use(router.allowedMethods());

// 启动服务器
const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // 测试数据库连接
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.error('数据库连接失败，服务器启动中止');
      process.exit(1);
    }

    // 定义模型关联
    defineAssociations();

    try {
      await ensureDevTestAccount();
    } catch (error) {
      logger.error('开发测试账号守护失败', error);
    }

    // 同步数据库模型（开发环境）
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      logger.info('✅ 数据库模型同步完成');
    }

    // 启动定时任务
    startCronJobs(io);

    const plcDir = startPlcWatcher();
    logger.info(`PLC uploads dir: ${plcDir}`);

    // 启动 HTTP 服务器
    httpServer.listen(PORT, () => {
      logger.info(`🚀 服务器运行在 http://localhost:${PORT}`);
      logger.info(`📚 API 文档: http://localhost:${PORT}/api`);
      logger.info('🔌 WebSocket 已启用');
    });
  } catch (error) {
    logger.error('服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
registerGracefulShutdown({ httpServer, sequelize, logger });

// 启动应用
start();

export { app, io };
