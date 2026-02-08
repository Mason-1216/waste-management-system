export const registerGracefulShutdown = ({ httpServer, sequelize, logger }) => {
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
};
