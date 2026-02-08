export const reportRoutes = [
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('@/modules/report/pages/Index.vue'),
    meta: { title: '维保数据报表' }
  },
  {
    path: '/points-summary',
    name: 'PointsSummary',
    component: () => import('@/modules/report/pages/PointsSummary.vue'),
    meta: { title: '积分统计', roles: ['dev_test', 'operator', 'maintenance', 'station_manager', 'deputy_manager', 'department_manager', 'senior_management', 'client'] }
  }
];
