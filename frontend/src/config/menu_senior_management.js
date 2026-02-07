export const seniorManagementMenus = [
  { path: '/home', name: '首页', icon: 'House' },
  {
    path: '/schedule',
    name: '\u6392\u73ed\u8868',
    icon: 'Calendar',
    children: [
      { path: '/schedule/my', name: '\u6211\u7684\u6392\u73ed' },
      { path: '/schedule/manage', name: '\u6392\u73ed\u7ba1\u7406' }
    ]
  },
  {
    path: '/safety',
    name: '安全检查',
    icon: 'CircleCheck',
    children: [
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
      { path: '/hygiene-work-arrangement', name: '卫生工作管理' }
    ]
  },
  {
    path: '/position-work',
    name: '岗位工作',
    icon: 'Monitor',
    children: [
      { path: '/position-work/field', name: '固定任务填报' },
      { path: '/position-work/records', name: '岗位工作完成情况记录' },
      { path: '/position-work/management', name: '岗位工作任务汇总表' }
    ]
  },
  {
    path: '/temporary-tasks',
    name: '临时任务',
    icon: 'Operation',
    children: [
      { path: '/temporary-tasks/fill', name: '临时任务填报' },
      { path: '/temporary-tasks/history', name: '临时任务完成情况记录' },
      { path: '/temporary-tasks/library', name: '临时工作任务汇总表' }
    ]
  },
  {
    path: '/device-faults',
    name: '设备故障',
    icon: 'List',
    children: [
      { path: '/device-faults/records', name: '故障上报' },
      { path: '/device-faults/task-library', name: '维修任务汇总表' }
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
  { path: '/points-summary', name: '积分统计', icon: 'DataAnalysis' },
  { path: '/change-password', name: '修改密码', icon: 'Lock' }
];
