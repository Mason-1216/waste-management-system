export const maintenanceRoutes = [
  {
    path: '/device-faults',
    name: 'DeviceFaults',
    redirect: '/device-faults/records',
    meta: { title: '设备故障' }
  },
  {
    path: '/device-faults/records',
    name: 'DeviceFaultRecords',
    component: () => import('@/modules/maintenance/pages/DeviceFaults.vue'),
    meta: { title: '故障上报' }
  },
  {
    path: '/device-faults/equipment',
    name: 'DeviceFaultEquipment',
    component: () => import('@/modules/maintenance/pages/EquipmentManagement.vue'),
    meta: { title: '设备管理', roles: ['dev_test', 'station_manager', 'department_manager', 'deputy_manager'] }
  },
  {
    path: '/device-faults/task-library',
    name: 'DeviceFaultTaskLibrary',
    component: () => import('@/modules/maintenance/pages/RepairTaskLibrary.vue'),
    meta: { title: '维修任务汇总表', roles: ['dev_test', 'department_manager', 'deputy_manager', 'senior_management'] }
  },
  {
    path: '/fault-report',
    name: 'FaultReport',
    component: () => import('@/modules/maintenance/pages/FaultReport.vue'),
    meta: { title: '故障上报' }
  },
  {
    path: '/fault-list',
    name: 'FaultList',
    component: () => import('@/modules/maintenance/pages/FaultList.vue'),
    meta: { title: '故障列表' }
  },
  {
    path: '/maintenance-dispatch',
    name: 'MaintenanceDispatch',
    component: () => import('@/modules/maintenance/pages/MaintenanceDispatch.vue'),
    meta: { title: '维修派发单' }
  },
  {
    path: '/repair-work',
    name: 'RepairWork',
    component: () => import('@/modules/maintenance/pages/RepairWork.vue'),
    meta: { title: '维修工作' }
  },
  {
    path: '/repair-records',
    name: 'RepairRecordList',
    component: () => import('@/modules/maintenance/pages/RepairRecordList.vue'),
    meta: { title: '设备维修记录' }
  },
  {
    path: '/repair-record/new',
    name: 'RepairRecordNew',
    component: () => import('@/modules/maintenance/pages/RepairRecordForm.vue'),
    meta: { title: '新建维修记录' }
  },
  {
    path: '/repair-record/:id',
    name: 'RepairRecordDetail',
    component: () => import('@/modules/maintenance/pages/RepairRecordForm.vue'),
    meta: { title: '维修记录详情' }
  },
  {
    path: '/maintenance-plan',
    name: 'MaintenancePlan',
    component: () => import('@/modules/maintenance/pages/MaintenancePlan.vue'),
    meta: { title: '保养计划', roles: ['admin', 'station_manager', 'department_manager', 'deputy_manager'] }
  },
  {
    path: '/maintenance-record',
    name: 'MaintenanceRecord',
    component: () => import('@/modules/maintenance/pages/MaintenanceRecord.vue'),
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
    component: () => import('@/modules/maintenance/pages/MaintenanceTask.vue'),
    props: { defaultTab: 'work', hideTabs: true },
    meta: { title: '保养工作' }
  },
  {
    path: '/maintenance-task/records',
    name: 'MaintenanceTaskRecords',
    component: () => import('@/modules/maintenance/pages/MaintenanceTask.vue'),
    props: { defaultTab: 'records', hideTabs: true },
    meta: { title: '保养工作记录' }
  },
  {
    path: '/maintenance-task/plan',
    name: 'MaintenanceTaskPlan',
    component: () => import('@/modules/maintenance/pages/MaintenanceTask.vue'),
    props: { defaultTab: 'plan', hideTabs: true },
    meta: { title: '保养计划' }
  },
  {
    path: '/maintenance-task/position',
    name: 'MaintenanceTaskPosition',
    component: () => import('@/modules/maintenance/pages/MaintenanceTask.vue'),
    props: { defaultTab: 'position', hideTabs: true },
    meta: { title: '保养计划岗位分配' }
  }
];
