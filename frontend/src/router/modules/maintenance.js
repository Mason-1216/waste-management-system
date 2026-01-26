export const maintenanceRoutes = [
  {
    path: '/device-faults',
    name: 'DeviceFaults',
    component: () => import('@/views/maintenance/DeviceFaults.vue'),
    meta: { title: '设备故障' }
  },
  {
    path: '/fault-report',
    name: 'FaultReport',
    component: () => import('@/views/maintenance/FaultReport.vue'),
    meta: { title: '故障上报' }
  },
  {
    path: '/fault-list',
    name: 'FaultList',
    component: () => import('@/views/maintenance/FaultList.vue'),
    meta: { title: '故障列表' }
  },
  {
    path: '/maintenance-dispatch',
    name: 'MaintenanceDispatch',
    component: () => import('@/views/maintenance/MaintenanceDispatch.vue'),
    meta: { title: '维修派发单' }
  },
  {
    path: '/repair-work',
    name: 'RepairWork',
    component: () => import('@/views/maintenance/RepairWork.vue'),
    meta: { title: '维修工作' }
  },
  {
    path: '/repair-records',
    name: 'RepairRecordList',
    component: () => import('@/views/maintenance/RepairRecordList.vue'),
    meta: { title: '设备维修记录' }
  },
  {
    path: '/repair-record/new',
    name: 'RepairRecordNew',
    component: () => import('@/views/maintenance/RepairRecordForm.vue'),
    meta: { title: '新建维修记录' }
  },
  {
    path: '/repair-record/:id',
    name: 'RepairRecordDetail',
    component: () => import('@/views/maintenance/RepairRecordForm.vue'),
    meta: { title: '维修记录详情' }
  },
  {
    path: '/maintenance-plan',
    name: 'MaintenancePlan',
    component: () => import('@/views/maintenance/MaintenancePlan.vue'),
    meta: { title: '保养计划', roles: ['admin', 'station_manager', 'department_manager', 'deputy_manager'] }
  },
  {
    path: '/maintenance-record',
    name: 'MaintenanceRecord',
    component: () => import('@/views/maintenance/MaintenanceRecord.vue'),
    meta: { title: '保养记录' }
  },
  {
    path: '/maintenance-task',
    name: 'MaintenanceTask',
    redirect: '/maintenance-task/work',
    meta: { title: '保养任务' }
  },
  {
    path: '/maintenance-task/work',
    name: 'MaintenanceTaskWork',
    component: () => import('@/views/maintenance/MaintenanceTask.vue'),
    props: { defaultTab: 'work', hideTabs: true },
    meta: { title: '保养工作' }
  },
  {
    path: '/maintenance-task/records',
    name: 'MaintenanceTaskRecords',
    component: () => import('@/views/maintenance/MaintenanceTask.vue'),
    props: { defaultTab: 'records', hideTabs: true },
    meta: { title: '保养工作记录' }
  },
  {
    path: '/maintenance-task/plan',
    name: 'MaintenanceTaskPlan',
    component: () => import('@/views/maintenance/MaintenanceTask.vue'),
    props: { defaultTab: 'plan', hideTabs: true },
    meta: { title: '保养计划' }
  },
  {
    path: '/maintenance-task/position',
    name: 'MaintenanceTaskPosition',
    component: () => import('@/views/maintenance/MaintenanceTask.vue'),
    props: { defaultTab: 'position', hideTabs: true },
    meta: { title: '保养计划岗位分配' }
  }
];
