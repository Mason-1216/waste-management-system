export const scheduleRoutes = [
  {
    path: '/schedule',
    name: 'ScheduleRoot',
    redirect: '/schedule/my'
  },
  {
    path: '/schedule/my',
    name: 'MySchedule',
    component: () => import('@/modules/schedule/pages/Index.vue'),
    meta: { title: '我的排班', scheduleView: 'my' }
  },
  {
    path: '/schedule/manage',
    name: 'ScheduleManagement',
    component: () => import('@/modules/schedule/pages/Index.vue'),
    meta: { title: '排班管理', scheduleView: 'manage', roles: ['admin', 'station_manager', 'department_manager', 'deputy_manager', 'senior_management', 'dev_test'] }
  }
];
