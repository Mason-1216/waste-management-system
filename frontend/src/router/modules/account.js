export const accountRoutes = [
  {
    path: '/change-password',
    name: 'ChangePassword',
    component: () => import('@/modules/account/pages/ChangePassword.vue'),
    meta: { title: '修改密码' }
  }
];

