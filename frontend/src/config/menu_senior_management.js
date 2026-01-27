export const seniorManagementMenus = [
  { path: '/home', name: '首页', icon: 'House' },
  { path: '/schedule/my', name: '排班表', icon: 'Calendar' },
  {
    path: '/safety',
    name: '安全检查',
    icon: 'Shield',
    children: [
      { path: '/safety-self-inspection', name: '安全自检' },
      { path: '/safety-other-inspection', name: '员工检查记录' }
    ]
  },
  { path: '/safety-rectification', name: '安全隐患', icon: 'Warning' },
  {
    path: '/hygiene',
    name: '卫生检查',
    icon: 'Brush',
    children: [
      { path: '/hygiene-self-inspection', name: '卫生自检' },
      { path: '/hygiene-other-inspection', name: '员工检查记录' },
      { path: '/hygiene-work-arrangement', name: '卫生工作安排' }
    ]
  },
  {
    path: '/position-work',
    name: '岗位工作',
    icon: 'Monitor',
    children: [
      { path: '/position-work/field', name: '固定任务' },
      { path: '/position-work/management', name: '岗位工作任务库' },
      { path: '/position-work/records', name: '岗位工作完成情况记录' }
    ]
  },
  { path: '/temporary-tasks', name: '临时任务', icon: 'Operation' },
  {
    path: '/device-faults',
    name: '设备故障',
    icon: 'List',
    children: [
      { path: '/device-faults/records', name: '设备维修记录' },
      { path: '/device-faults/task-library', name: '维修任务库' }
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
  { path: '/reports', name: '维保数据报表', icon: 'DataAnalysis' },
  { path: '/change-password', name: '修改密码', icon: 'Lock' }
];
