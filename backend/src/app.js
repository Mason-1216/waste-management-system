import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import koaStatic from 'koa-static';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import sequelize, { testConnection } from './config/database.js';
import { errorHandler, requestLogger } from './middlewares/error.js';
import router from './routes/index.js';
import { startCronJobs } from './services/cronJobs.js';
import { startPlcWatcher } from './services/plcIngestion.js';
import logger from './config/logger.js';
import { defineAssociations } from './models/index.js';

// 加载环境变量
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建上传目录
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 创建日志目录
const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const app = new Koa();
const httpServer = createServer(app.callback());

// Socket.IO 配置
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});

// WebSocket 连接处理
io.on('connection', (socket) => {
  logger.info(`客户端已连接: ${socket.id}`);

  // 用户加入自己的房间（用于点对点通知）
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    logger.info(`用户 ${userId} 加入房间`);
  });

  socket.on('disconnect', () => {
    logger.info(`客户端已断开: ${socket.id}`);
  });
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
app.use(koaStatic(path.join(__dirname, '..', 'uploads')));

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
      logger.info(`🔌 WebSocket 已启用`);
    });
  } catch (error) {
    logger.error('服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
const gracefulShutdown = (signal) => {
  logger.info(`收到 ${signal} 信号，正在关闭服务器...`);
  httpServer.close(() => {
    logger.info('HTTP 服务器已关闭');
    sequelize.close().then(() => {
      logger.info('数据库连接已关闭');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 启动应用
start();

export { app, io };
