import { Op } from 'sequelize';
import { Notification } from '../../../models/index.js';
import { getPagination, formatPaginationResponse } from '../../../utils/helpers.js';

const parseCsvList = (value) => String(value)
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);

/**
 * 查询我的通知列表
 * GET /api/notifications
 */
export const getNotifications = async (ctx) => {
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const { isRead, notifyType, notifyTypes, relatedType, relatedTypes } = ctx.query;
  const userId = ctx.state.user.id;

  const where = { receiver_id: userId };

  if (isRead !== undefined) {
    where.is_read = isRead === 'true' || isRead === '1' ? 1 : 0;
  }

  // Support filtering by multiple notify types: ?notifyTypes=a,b,c
  if (notifyTypes) {
    const list = String(notifyTypes)
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    if (list.length > 0) {
      where.notify_type = { [Op.in]: list };
    }
  } else if (notifyType) {
    where.notify_type = notifyType;
  }

  // Support filtering by related type(s): ?relatedType=x or ?relatedTypes=a,b,c
  if (relatedTypes) {
    const list = String(relatedTypes)
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    if (list.length > 0) {
      where.related_type = { [Op.in]: list };
    }
  } else if (relatedType) {
    where.related_type = relatedType;
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
 * 按条件批量标记为已读（不删除）
 * PUT /api/notifications/read-by-filter
 * Query: relatedType / relatedTypes=csv, notifyType / notifyTypes=csv
 */
export const markByFilterAsRead = async (ctx) => {
  const { notifyType, notifyTypes, relatedType, relatedTypes } = ctx.query;
  const userId = ctx.state.user.id;

  const where = { receiver_id: userId, is_read: 0 };

  let hasAnyFilter = false;

  if (notifyTypes) {
    const list = parseCsvList(notifyTypes);
    if (list.length > 0) {
      where.notify_type = { [Op.in]: list };
      hasAnyFilter = true;
    }
  } else if (notifyType) {
    where.notify_type = notifyType;
    hasAnyFilter = true;
  }

  if (relatedTypes) {
    const list = parseCsvList(relatedTypes);
    if (list.length > 0) {
      where.related_type = { [Op.in]: list };
      hasAnyFilter = true;
    }
  } else if (relatedType) {
    where.related_type = relatedType;
    hasAnyFilter = true;
  }

  if (!hasAnyFilter) {
    ctx.body = { code: 400, message: '缺少过滤条件', data: null };
    return;
  }

  await Notification.update({ is_read: 1 }, { where });

  ctx.body = { code: 200, message: '标记成功', data: null };
};

/**
 * 获取未读通知数量
 * GET /api/notifications/unread-count
 */
export const getUnreadCount = async (ctx) => {
  const userId = ctx.state.user.id;
  const count = await Notification.count({
    where: { receiver_id: userId, is_read: 0 }
  });

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
  markByFilterAsRead,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
};

