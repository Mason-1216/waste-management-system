/**
 * 文件上传控制器
 */

/**
 * 单文件上传
 * POST /api/upload
 */
export const uploadSingle = async (ctx) => {
  if (!ctx.file) {
    ctx.status = 400;
    ctx.body = { code: 400, message: '没有上传文件' };
    return;
  }

  ctx.body = {
    code: 200,
    message: '上传成功',
    data: {
      url: `/uploads/${ctx.file.filename}`,
      filename: ctx.file.originalname,
      size: ctx.file.size
    }
  };
};

/**
 * 多文件上传
 * POST /api/upload/multiple
 */
export const uploadMultiple = async (ctx) => {
  if (!ctx.files || ctx.files.length === 0) {
    ctx.status = 400;
    ctx.body = { code: 400, message: '没有上传文件' };
    return;
  }

  ctx.body = {
    code: 200,
    message: '上传成功',
    data: ctx.files.map(file => ({
      url: `/uploads/${file.filename}`,
      filename: file.originalname,
      size: file.size
    }))
  };
};

export default {
  uploadSingle,
  uploadMultiple
};
