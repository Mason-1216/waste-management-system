import { Role, User, Notification } from '../../../models/index.js';
import { createError } from '../../../middlewares/error.js';

/**
 * 提交帮助与反馈
 * POST /api/feedback
 */
/**
 * 获取反馈列表（管理员）
 * GET /api/feedback
 */
export const getFeedbacks = async (ctx) => {
  const feedbacks = await Notification.findAll({
    where: { related_type: 'feedback' },
    order: [['created_at', 'DESC']],
    attributes: ['id', 'title', 'content', 'receiver_name', 'created_at', 'is_read']
  });

  // 解析内容提取反馈详情
  const list = feedbacks.map(fb => {
    const lines = (fb.content || '').split('\n');
    const parsed = {};
    lines.forEach(line => {
      if (line.startsWith('来自：')) parsed.userName = line.replace('来自：', '');
      if (line.startsWith('类型：')) parsed.type = line.replace('类型：', '');
      if (line.startsWith('内容：')) parsed.content = line.replace('内容：', '');
      if (line.startsWith('联系方式：')) parsed.contact = line.replace('联系方式：', '');
    });
    return {
      id: fb.id,
      userName: parsed.userName || '-',
      type: parsed.type || 'other',
      content: parsed.content || fb.content,
      contact: parsed.contact || '-',
      createdAt: fb.created_at
    };
  });

  ctx.body = { code: 200, message: 'success', data: list };
};

export const submitFeedback = async (ctx) => {
  const { type, content, contact, images } = ctx.request.body || {};
  const sender = ctx.state.user;

  if (!type || !content) {
    throw createError(400, 'Feedback type and content are required');
  }

  const adminRole = await Role.findOne({ where: { role_code: 'admin' } });
  if (!adminRole) {
    ctx.body = { code: 200, message: 'success', data: null };
    return;
  }

  const admins = await User.findAll({
    where: { role_id: adminRole.id, status: 1 },
    attributes: ['id', 'real_name', 'username']
  });

  if (admins.length > 0) {
    const senderName = sender.realName || sender.username;
    const imageList = Array.isArray(images) ? images.filter(Boolean) : [];
    const feedbackContent = [
      `来自：${senderName}`,
      `类型：${type}`,
      `内容：${content}`,
      `联系方式：${contact || '无'}`,
      imageList.length > 0 ? `图片：${imageList.join(', ')}` : '图片：无'
    ].join('\n');

    await Notification.bulkCreate(
      admins.map(admin => ({
        notify_type: 'system',
        title: '帮助与反馈',
        content: feedbackContent,
        receiver_id: admin.id,
        receiver_name: admin.real_name || admin.username,
        related_type: 'feedback'
      }))
    );
  }

  ctx.body = { code: 200, message: 'success', data: null };
};

export default {
  getFeedbacks,
  submitFeedback
};
