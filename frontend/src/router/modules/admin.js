export const adminRoutes = [
  {
    path: '/user-management',
    name: 'UserManagement',
    component: () => import('@/modules/admin/pages/UserManagement.vue'),
    meta: { title: '用户管理', roles: ['admin'] }
  },
  {
    path: '/organization-management',
    name: 'OrganizationManagement',
    component: () => import('@/modules/admin/pages/OrganizationManagement.vue'),
    meta: { title: '组织架构', roles: ['admin'] }
  }
];

