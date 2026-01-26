export const reportRoutes = [
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('@/views/reports/Index.vue'),
    meta: { title: '维保数据报表' }
  }
];
