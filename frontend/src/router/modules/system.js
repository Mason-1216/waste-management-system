export const systemRoutes = [
  {
    path: '/notifications',
    name: 'NotificationManagement',
    component: () => import('@/views/system/NotificationManagement.vue'),
    meta: { title: '消息通知' }
  },
  {
    path: '/price-management',
    name: 'PriceManagement',
    component: () => import('@/views/system/PriceManagement.vue'),
    meta: { title: '单价管理' }
  },
  {
    path: '/user-management',
    name: 'UserManagement',
    component: () => import('@/views/system/UserManagement.vue'),
    meta: { title: '用户管理', roles: ['admin'] }
  },
  {
    path: '/organization-management',
    name: 'OrganizationManagement',
    component: () => import('@/views/system/OrganizationManagement.vue'),
    meta: { title: '组织架构', roles: ['admin'] }
  },
  {
    path: '/change-password',
    name: 'ChangePassword',
    component: () => import('@/views/system/ChangePassword.vue'),
    meta: { title: '修改密码' }
  },
  {
    path: '/help-feedback',
    name: 'HelpFeedback',
    component: () => import('@/views/system/HelpFeedback.vue'),
    meta: { title: '帮助与反馈' }
  }
];
