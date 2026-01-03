import request from './request';

// 获取通知列表
export const getNotifications = (params) => {
  return request.get('/notifications', { params });
};

// 获取未读数量
export const getUnreadCount = () => {
  return request.get('/notifications/unread-count');
};

// 标记为已读
export const markAsRead = (id) => {
  return request.put(`/notifications/${id}/read`);
};

// 全部标记为已读
export const markAllAsRead = () => {
  return request.put('/notifications/read-all');
};

// 删除通知
export const deleteNotification = (id) => {
  return request.delete(`/notifications/${id}`);
};
