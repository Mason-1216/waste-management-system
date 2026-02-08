import * as notificationService from '../services/notificationService.js';

export const getNotifications = notificationService.getNotifications;
export const getUnreadCount = notificationService.getUnreadCount;
export const markAsRead = notificationService.markAsRead;
export const markAllAsRead = notificationService.markAllAsRead;
export const markByFilterAsRead = notificationService.markByFilterAsRead;
export const deleteNotification = notificationService.deleteNotification;

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  markByFilterAsRead,
  deleteNotification
};

