export const taskRoutes = [
  {
    path: '/position-work',
    name: 'PositionWorkRoot',
    redirect: '/position-work/field'
  },
  {
    path: '/position-work/field',
    name: 'PositionWork',
    component: () => import('@/views/task/PositionWork.vue'),
    meta: { title: '固定任务' },
    props: { defaultTab: 'fixed' }
  },
  {
    path: '/position-work/management',
    name: 'PositionWorkManagement',
    component: () => import('@/views/task/PositionWork.vue'),
    meta: { title: '岗位工作任务库', roles: ['dev_test', 'operator', 'station_manager', 'department_manager', 'deputy_manager', 'senior_management'] },
    props: { defaultTab: 'management' }
  },
  {
    path: '/position-work/records',
    name: 'PositionWorkRecords',
    component: () => import('@/views/task/PositionWorkRecords.vue'),
    meta: { title: '岗位工作完成情况记录', roles: ['dev_test', 'operator', 'station_manager', 'department_manager', 'deputy_manager', 'senior_management'] }
  },
  {
    path: '/temporary-tasks',
    name: 'TemporaryTasks',
    component: () => import('@/views/task/TemporaryTasks.vue'),
    meta: { title: '临时工作管理' }
  }
];
