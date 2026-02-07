export const operatorMenus = [
  { path: '/home', name: '首页', icon: 'House' },
  { path: '/schedule', name: '排班表', icon: 'Calendar' },
  { path: '/safety-self-inspection', name: '安全自检', icon: 'CircleCheck' },
  { path: '/hygiene-self-inspection', name: '卫生自检', icon: 'Brush' },
  {
    path: '/work',
    name: '岗位工作',
    icon: 'Briefcase',
    children: [
      { path: '/position-work', name: '固定任务填报' },
      { path: '/position-work/records', name: '岗位工作完成情况记录' }
    ]
  },
  {
    path: '/temporary-tasks',
    name: '临时任务',
    icon: 'Operation',
    children: [
      { path: '/temporary-tasks/fill', name: '临时任务填报' },
      { path: '/temporary-tasks/history', name: '临时任务完成情况记录' }
    ]
  },
  {
    path: '/maintenance-task',
    name: '设备保养',
    icon: 'Tools',
    children: [
      { path: '/maintenance-task/work', name: '保养工作' },
      { path: '/maintenance-task/records', name: '保养工作记录' }
    ]
  },
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
