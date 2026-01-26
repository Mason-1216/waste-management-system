import notificationController from '../../controllers/notificationController.js';

export const registerNotificationRoutes = (router) => {
  router.get('/notifications', notificationController.getNotifications);
  router.get('/notifications/unread-count', notificationController.getUnreadCount);
  router.put('/notifications/:id/read', notificationController.markAsRead);
  router.put('/notifications/read-all', notificationController.markAllAsRead);
  router.delete('/notifications/:id', notificationController.deleteNotification);
};
