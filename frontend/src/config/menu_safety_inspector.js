export const safetyInspectorMenus = [
  { path: '/home', name: '首页', icon: 'House' },
  {
    path: '/safety',
    name: '安全检查',
    icon: 'Shield',
    children: [
      { path: '/safety-check-management', name: '检查项目管理' },
      { path: '/safety-self-inspection', name: '安全自检' },
      { path: '/safety-other-inspection', name: '安全他检' }
    ]
  },
  { path: '/safety-rectification', name: '安全隐患', icon: 'Warning' },
  {
    path: '/hygiene',
    name: '卫生检查',
    icon: 'Brush',
    children: [
      { path: '/hygiene-self-inspection', name: '卫生自检' },
      { path: '/hygiene-other-inspection', name: '卫生他检' },
      { path: '/hygiene-work-arrangement', name: '卫生工作安排' }
    ]
  },
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
