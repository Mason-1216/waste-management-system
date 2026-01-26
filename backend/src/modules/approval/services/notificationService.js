import { Op } from 'sequelize';
import { Notification } from '../../../models/index.js';
import { getPagination, formatPaginationResponse } from '../../../utils/helpers.js';

/**
 * 查询我的通知列表
 * GET /api/notifications
 */
export const getNotifications = async (ctx) => {
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const { isRead, notifyType } = ctx.query;
  const userId = ctx.state.user.id;

  const where = { receiver_id: userId };

  if (isRead !== undefined) {
    where.is_read = isRead === 'true' || isRead === '1' ? 1 : 0;
  }

  if (notifyType) {
    where.notify_type = notifyType;
  }

  const result = await Notification.findAndCountAll({
    where,
    offset,
    limit,
    order: [['created_at', 'DESC']]
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: formatPaginationResponse(result, page, pageSize)
  };
};

/**
 * 获取未读通知数量
 * GET /api/notifications/unread-count
 */
export const getUnreadCount = async (ctx) => {
  const userId = ctx.state.user.id;

  const recent = await Notification.findAll({
    where: { receiver_id: userId },
    attributes: ['is_read'],
    order: [['created_at', 'DESC']],
    limit: 10
  });
  const count = recent.filter(item => item.is_read === 0).length;

  ctx.body = {
    code: 200,
    message: 'success',
    data: { count }
  };
};

/**
 * 标记为已读
 * PUT /api/notifications/:id/read
 */
export const markAsRead = async (ctx) => {
  const { id } = ctx.params;
  const userId = ctx.state.user.id;

  const notification = await Notification.findOne({
    where: { id, receiver_id: userId }
  });

  if (!notification) {
    ctx.body = { code: 404, message: '通知不存在', data: null };
    return;
  }

  await notification.update({ is_read: 1 });

  ctx.body = { code: 200, message: '标记成功', data: null };
};

/**
 * 全部标记为已读
 * PUT /api/notifications/read-all
 */
export const markAllAsRead = async (ctx) => {
  const userId = ctx.state.user.id;

  await Notification.update(
    { is_read: 1 },
    { where: { receiver_id: userId, is_read: 0 } }
  );

  ctx.body = { code: 200, message: '全部标记成功', data: null };
};

/**
 * 删除通知
 * DELETE /api/notifications/:id
 */
export const deleteNotification = async (ctx) => {
  const { id } = ctx.params;
  const userId = ctx.state.user.id;

  await Notification.destroy({
    where: { id, receiver_id: userId }
  });

  ctx.body = { code: 200, message: '删除成功', data: null };
};

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
