export const scheduleRoutes = [
  {
    path: '/schedule',
    name: 'Schedule',
    component: () => import('@/views/schedule/Index.vue'),
    meta: { title: '排班表' }
  }
];
