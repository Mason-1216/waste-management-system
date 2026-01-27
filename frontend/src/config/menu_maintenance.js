export const maintenanceMenus = [
  { path: '/home', name: '首页', icon: 'House' },
  { path: '/safety-self-inspection', name: '安全自检', icon: 'Shield' },
  {
    path: '/device-faults',
    name: '设备故障',
    icon: 'Warning',
    children: [
      { path: '/device-faults/records', name: '设备维修记录' },
      { path: '/device-faults/task-library', name: '维修任务库' }
    ]
  },
  { path: '/change-password', name: '修改密码', icon: 'Lock' }
];
