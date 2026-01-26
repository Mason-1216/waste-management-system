export const plcRoutes = [
  {
    path: '/plc-records',
    name: 'PlcRecords',
    component: () => import('@/views/plc/PlcRecords.vue'),
    meta: { title: 'PLC数据', roles: ['admin', 'station_manager', 'deputy_manager', 'department_manager', 'safety_inspector', 'senior_management', 'client'] }
  },
  {
    path: '/plc-data-report',
    name: 'PlcDataReport',
    component: () => import('@/views/plc/PlcDataReport.vue'),
    meta: { title: 'PLC数据报表', roles: ['admin', 'station_manager', 'deputy_manager', 'department_manager', 'safety_inspector', 'senior_management'], disableTransition: true }
  },
  {
    path: '/plc-visual-report',
    name: 'PlcVisualReport',
    component: () => import('@/views/plc/PlcVisualReport.vue'),
    meta: { title: 'PLC可视化报表', roles: ['admin', 'station_manager', 'deputy_manager', 'department_manager', 'safety_inspector', 'senior_management'] }
  }
];
