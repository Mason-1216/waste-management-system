import * as notificationService from '../modules/approval/services/notificationService.js';

export const getNotifications = notificationService.getNotifications;
export const getUnreadCount = notificationService.getUnreadCount;
export const markAsRead = notificationService.markAsRead;
export const markAllAsRead = notificationService.markAllAsRead;
export const deleteNotification = notificationService.deleteNotification;

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
