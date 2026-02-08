import koaStatic from 'koa-static';

import { ensureDir } from '../../core/app/runtimeDirs.js';

export const registerUploadsStatic = (app, { uploadDir }) => {
  ensureDir(uploadDir);

  const uploadStatic = koaStatic(uploadDir);

  // 静态文件服务（上传的文件）
  app.use(async (ctx, next) => {
    if (!ctx.path.startsWith('/uploads/')) {
      await next();
      return;
    }

    const originalPath = ctx.path;
    const originalUrl = ctx.url;

    ctx.path = ctx.path.replace(/^\/uploads/, '');
    ctx.url = ctx.url.replace(/^\/uploads/, '');

    await uploadStatic(ctx, next);

    ctx.path = originalPath;
    ctx.url = originalUrl;
  });

  app.use(uploadStatic);
};
