import { Server } from 'socket.io';

export const createSocketServer = (httpServer, { corsOrigin, logger }) => {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST']
    }
  });

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

  return io;
};
