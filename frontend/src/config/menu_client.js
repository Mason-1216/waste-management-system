export const clientMenus = [
  { path: '/home', name: '首页', icon: 'House' },
  { path: '/plc-records', name: 'PLC数据', icon: 'DataBoard' },
  { path: '/reports', name: '维保数据报表', icon: 'DataAnalysis' },
  {
    path: '/points-summary',
    name: '积分统计',
    icon: 'DataAnalysis',
    children: [
      { path: '/points-summary/summary', name: '积分汇总' },
      { path: '/points-summary/applied-hourly', name: '应用小时积分' },
      { path: '/points-summary/quarterly-award', name: '季度积分奖' }
    ]
  },
  { path: '/change-password', name: '修改密码', icon: 'Lock' }
];
