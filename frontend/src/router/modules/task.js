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
    meta: { title: '\u56fa\u5b9a\u4efb\u52a1' },
    props: { defaultTab: 'fixed' }
  },
  {
    path: '/position-work/management',
    name: 'PositionWorkManagement',
    component: () => import('@/views/task/PositionWork.vue'),
    meta: { title: '\u5c97\u4f4d\u5de5\u4f5c\u4efb\u52a1\u6c47\u603b\u8868', roles: ['dev_test', 'station_manager', 'department_manager', 'deputy_manager', 'senior_management'] },
    props: { defaultTab: 'management' }
  },
  {
    path: '/position-work/records',
    name: 'PositionWorkRecords',
    component: () => import('@/views/task/PositionWorkRecords.vue'),
    meta: { title: '\u5c97\u4f4d\u5de5\u4f5c\u5b8c\u6210\u60c5\u51b5\u8bb0\u5f55', roles: ['operator', 'dev_test', 'station_manager', 'department_manager', 'deputy_manager', 'senior_management'] }
  },
  {
    path: '/temporary-tasks',
    name: 'TemporaryTasksRoot',
    redirect: '/temporary-tasks/fill'
  },
  {
    path: '/temporary-tasks/fill',
    name: 'TemporaryTaskFill',
    component: () => import('@/views/task/TemporaryTasks.vue'),
    meta: { title: '\u4e34\u65f6\u4efb\u52a1\u586b\u62a5' },
    props: { mode: 'fill' }
  },
  {
    path: '/temporary-tasks/history',
    name: 'TemporaryTaskHistory',
    component: () => import('@/views/task/TemporaryTasks.vue'),
    meta: { title: '\u4e34\u65f6\u4efb\u52a1\u5b8c\u6210\u60c5\u51b5\u8bb0\u5f55' },
    props: { mode: 'history' }
  },
  {
    path: '/temporary-tasks/library',
    name: 'TemporaryTaskLibrary',
    component: () => import('@/views/task/TempTaskLibrary.vue'),
    meta: { title: '\u4e34\u65f6\u5de5\u4f5c\u4efb\u52a1\u6c47\u603b\u8868', roles: ['dev_test', 'station_manager', 'department_manager', 'deputy_manager', 'senior_management'] }
  }
];
