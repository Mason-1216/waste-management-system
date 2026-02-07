export const maintenanceMenus = [
  { path: '/home', name: '首页', icon: 'House' },
  { path: '/safety-self-inspection', name: '安全自检', icon: 'CircleCheck' },
  {
    path: '/device-faults',
    name: '设备故障',
    icon: 'Warning',
    children: [
      { path: '/device-faults/records', name: '故障上报' },
    ]
  },
  { path: '/points-summary', name: '积分统计', icon: 'DataAnalysis' },
  { path: '/change-password', name: '修改密码', icon: 'Lock' }
];
