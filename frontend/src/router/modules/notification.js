export const notificationRoutes = [
  {
    path: '/notifications',
    name: 'NotificationManagement',
    component: () => import('@/modules/notification/pages/NotificationManagement.vue'),
    meta: { title: '消息通知' }
  }
];
