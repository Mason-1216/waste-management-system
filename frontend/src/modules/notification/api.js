import request from '@/api/request';

export const getNotifications = (params) => request.get('/notifications', { params });

export const getUnreadCount = () => request.get('/notifications/unread-count');

export const markAsRead = (id) => request.put(`/notifications/${id}/read`);

export const markByFilterAsRead = (params) => request.put('/notifications/read-by-filter', {}, { params });

export const markAllAsRead = () => request.put('/notifications/read-all');

export const deleteNotification = (id) => request.delete(`/notifications/${id}`);

