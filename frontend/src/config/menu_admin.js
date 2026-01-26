export const adminMenus = [
  { path: '/home', name: '首页', icon: 'House' },
  { path: '/user-management', name: '用户管理', icon: 'User' },
  { path: '/organization-management', name: '组织架构', icon: 'OfficeBuilding' },
  {
    path: '/plc',
    name: 'PLC监控',
    icon: 'DataBoard',
    children: [
      { path: '/plc-records', name: 'PLC数据' },
      { path: '/plc-data-report', name: '数据报表' },
      { path: '/plc-visual-report', name: '可视化报表' }
    ]
  },
  { path: '/change-password', name: '修改密码', icon: 'Lock' }
];
