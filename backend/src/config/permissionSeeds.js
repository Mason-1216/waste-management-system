// 菜单权限 - 控制侧边栏显示
export const menuPermissions = [
  { code: 'menu:/home', name: '首页' },
  { code: 'menu:/plc-records', name: 'PLC记录' },
  { code: 'menu:/plc-data-report', name: 'PLC数据报表' },
  { code: 'menu:/plc-visual-report', name: 'PLC可视化报表' },
  { code: 'menu:/notifications', name: '消息通知' },
  { code: 'menu:/user-management', name: '用户管理' },
  { code: 'menu:/organization-management', name: '组织架构' },
  { code: 'menu:/schedule', name: '排班表' },
  {
    code: 'menu:/safety',
    name: '安全检查',
    children: [
      { code: 'menu:/safety-self-inspection', name: '安全自检' },
      { code: 'menu:/safety-other-inspection', name: '员工检查记录' },
      { code: 'menu:/safety-check-management', name: '检查项目管理' }
    ]
  },
  { code: 'menu:/safety-rectification', name: '安全隐患' },
  {
    code: 'menu:/hygiene',
    name: '卫生检查',
    children: [
      { code: 'menu:/hygiene-self-inspection', name: '卫生自检' },
      { code: 'menu:/hygiene-other-inspection', name: '员工检查记录' },
      { code: 'menu:/hygiene-work-arrangement', name: '卫生工作安排' }
    ]
  },
  {
    code: 'menu:/position-work',
    name: '岗位工作',
    children: [
      { code: 'menu:/position-work/field', name: '固定任务' },
      { code: 'menu:/position-work/management', name: '岗位工作任务库' },
      { code: 'menu:/position-work/records', name: '岗位工作完成情况记录' }
    ]
  },
  { code: 'menu:/temporary-tasks', name: '临时工作' },
  { code: 'menu:/maintenance-task', name: '保养任务' },
  { code: 'menu:/device-faults', name: '设备故障' },
  { code: 'menu:/reports', name: '维保数据报表' },
  { code: 'menu:/price-management', name: '单价管理' },
  { code: 'menu:/change-password', name: '修改密码' },
  { code: 'menu:/help-feedback', name: '帮助与反馈' }
];

// 模块权限定义 - 细粒度权限控制
// 每个模块包含 view（查看）和 edit（编辑）两种权限
export const modulePermissions = [
  // 组织架构管理 - 有子模块
  {
    code: 'module:organization',
    name: '组织架构管理',
    children: [
      { code: 'module:organization:station:view', name: '场站管理-查看' },
      { code: 'module:organization:station:edit', name: '场站管理-编辑' },
      { code: 'module:organization:department:view', name: '部门管理-查看' },
      { code: 'module:organization:department:edit', name: '部门管理-编辑' },
      { code: 'module:organization:company:view', name: '公司管理-查看' },
      { code: 'module:organization:company:edit', name: '公司管理-编辑' },
      { code: 'module:organization:role:view', name: '角色管理-查看' },
      { code: 'module:organization:role:edit', name: '角色管理-编辑' }
    ]
  },
  // 用户管理
  {
    code: 'module:user',
    name: '用户管理',
    children: [
      { code: 'module:user:view', name: '用户管理-查看' },
      { code: 'module:user:edit', name: '用户管理-编辑' }
    ]
  },
  // 排班表
  {
    code: 'module:schedule',
    name: '排班表',
    children: [
      { code: 'module:schedule:view', name: '排班表-查看' },
      { code: 'module:schedule:edit', name: '排班表-编辑' }
    ]
  },
  // 安全自检
  {
    code: 'module:safety-self-inspection',
    name: '安全自检',
    children: [
      { code: 'module:safety-self-inspection:view', name: '安全自检-查看' },
      { code: 'module:safety-self-inspection:edit', name: '安全自检-编辑' },
      { code: 'module:safety-self-inspection:my:view', name: '我的安全自检-查看' },
      { code: 'module:safety-self-inspection:my:edit', name: '我的安全自检-编辑' },
      { code: 'module:safety-self-inspection:staff:view', name: '人员安全自检-查看' },
      { code: 'module:safety-self-inspection:staff:edit', name: '人员安全自检-编辑' }
    ]
  },
  // 员工检查记录
  {
    code: 'module:safety-other-inspection',
    name: '员工检查记录',
    children: [
      { code: 'module:safety-other-inspection:view', name: '员工检查记录-查看' },
      { code: 'module:safety-other-inspection:edit', name: '员工检查记录-编辑' }
    ]
  },
  // 检查项目管理
  {
    code: 'module:safety-check-management',
    name: '检查项目管理',
    children: [
      { code: 'module:safety-check-management:view', name: '检查项目-查看' },
      { code: 'module:safety-check-management:edit', name: '检查项目-编辑' }
    ]
  },
  // 安全隐患
  {
    code: 'module:safety-rectification',
    name: '安全隐患',
    children: [
      { code: 'module:safety-rectification:view', name: '安全隐患-查看' },
      { code: 'module:safety-rectification:edit', name: '安全隐患-编辑' }
    ]
  },
  // 卫生自检
  {
    code: 'module:hygiene-self-inspection',
    name: '卫生自检',
    children: [
      { code: 'module:hygiene-self-inspection:view', name: '卫生自检-查看' },
      { code: 'module:hygiene-self-inspection:edit', name: '卫生自检-编辑' },
      { code: 'module:hygiene-self-inspection:my:view', name: '我的卫生自检-查看' },
      { code: 'module:hygiene-self-inspection:my:edit', name: '我的卫生自检-编辑' },
      { code: 'module:hygiene-self-inspection:staff:view', name: '人员卫生自检-查看' },
      { code: 'module:hygiene-self-inspection:staff:edit', name: '人员卫生自检-编辑' }
    ]
  },
  // 员工检查记录
  {
    code: 'module:hygiene-other-inspection',
    name: '员工检查记录',
    children: [
      { code: 'module:hygiene-other-inspection:view', name: '员工检查记录-查看' },
      { code: 'module:hygiene-other-inspection:edit', name: '员工检查记录-编辑' },
      { code: 'module:hygiene-other-inspection:inspection:view', name: '员工检查记录记录-查看' },
      { code: 'module:hygiene-other-inspection:inspection:edit', name: '员工检查记录记录-编辑' },
      { code: 'module:hygiene-other-inspection:management-areas:view', name: '卫生区域划分-查看' },
      { code: 'module:hygiene-other-inspection:management-areas:edit', name: '卫生区域划分-编辑' },
      { code: 'module:hygiene-other-inspection:management-assignments:view', name: '卫生任务分配-查看' },
      { code: 'module:hygiene-other-inspection:management-assignments:edit', name: '卫生任务分配-编辑' }
    ]
  },
  // 岗位工作
  {
    code: 'module:position-work',
    name: '岗位工作',
    children: [
      { code: 'module:position-work:view', name: '岗位工作-查看' },
      { code: 'module:position-work:edit', name: '岗位工作-编辑' },
      { code: 'module:position-work:my-work:view', name: '固定任务-查看' },
      { code: 'module:position-work:my-work:edit', name: '固定任务-编辑' },
      { code: 'module:position-work:management:view', name: '人员岗位管理-查看' },
      { code: 'module:position-work:management:edit', name: '人员岗位管理-编辑' }
    ]
  },
  // 临时工作
  {
    code: 'module:temporary-tasks',
    name: '临时工作',
    children: [
      { code: 'module:temporary-tasks:view', name: '临时工作-查看' },
      { code: 'module:temporary-tasks:edit', name: '临时工作-编辑' },
      { code: 'module:temporary-tasks:tasks:view', name: '临时工作列表-查看' },
      { code: 'module:temporary-tasks:tasks:edit', name: '临时工作列表-编辑' },
      { code: 'module:temporary-tasks:library:view', name: '临时工作任务库-查看' },
      { code: 'module:temporary-tasks:library:edit', name: '临时工作任务库-编辑' }
    ]
  },
  // 设备故障
  {
    code: 'module:device-faults',
    name: '设备故障',
    children: [
      { code: 'module:device-faults:view', name: '设备故障-查看' },
      { code: 'module:device-faults:edit', name: '设备故障-编辑' },
      { code: 'module:device-faults:faults:view', name: '故障列表-查看' },
      { code: 'module:device-faults:faults:edit', name: '故障列表-编辑' },
      { code: 'module:device-faults:equipment:view', name: '设备管理-查看' },
      { code: 'module:device-faults:equipment:edit', name: '设备管理-编辑' }
    ]
  },
  // 故障上报
  {
    code: 'module:fault-report',
    name: '故障上报',
    children: [
      { code: 'module:fault-report:report:view', name: '故障上报-查看' },
      { code: 'module:fault-report:report:edit', name: '故障上报-编辑' },
      { code: 'module:fault-report:equipment:view', name: '设备管理-查看' },
      { code: 'module:fault-report:equipment:edit', name: '设备管理-编辑' }
    ]
  },
  // 维修工单
  {
    code: 'module:repair-work',
    name: '维修工单',
    children: [
      { code: 'module:repair-work:pending:view', name: '待处理-查看' },
      { code: 'module:repair-work:pending:edit', name: '待处理-编辑' },
      { code: 'module:repair-work:in-progress:view', name: '进行中-查看' },
      { code: 'module:repair-work:in-progress:edit', name: '进行中-编辑' },
      { code: 'module:repair-work:completed:view', name: '已完成-查看' },
      { code: 'module:repair-work:completed:edit', name: '已完成-编辑' }
    ]
  },
  // 维修审批
  {
    code: 'module:maintenance-approval',
    name: '维修审批',
    children: [
      { code: 'module:maintenance-approval:pending:view', name: '待审核-查看' },
      { code: 'module:maintenance-approval:pending:edit', name: '待审核-编辑' },
      { code: 'module:maintenance-approval:approved:view', name: '已通过-查看' },
      { code: 'module:maintenance-approval:approved:edit', name: '已通过-编辑' },
      { code: 'module:maintenance-approval:rejected:view', name: '已驳回-查看' },
      { code: 'module:maintenance-approval:rejected:edit', name: '已驳回-编辑' }
    ]
  },
  // PLC记录
  {
    code: 'module:plc-records',
    name: 'PLC记录',
    children: [
      { code: 'module:plc-records:view', name: 'PLC记录-查看' },
      { code: 'module:plc-records:edit', name: 'PLC记录-编辑' }
    ]
  },
  // 维保数据报表
  {
    code: 'module:reports',
    name: '维保数据报表',
    children: [
      { code: 'module:reports:view', name: '维保数据报表-查看' },
      { code: 'module:reports:edit', name: '维保数据报表-编辑' },
      { code: 'module:reports:maintenance:view', name: '设备保养统计-查看' },
      { code: 'module:reports:maintenance:edit', name: '设备保养统计-编辑' },
      { code: 'module:reports:faults:view', name: '设备故障统计-查看' },
      { code: 'module:reports:faults:edit', name: '设备故障统计-编辑' }
    ]
  },
  // 单价管理
  {
    code: 'module:price-management',
    name: '单价管理',
    children: [
      { code: 'module:price-management:view', name: '单价管理-查看' },
      { code: 'module:price-management:edit', name: '单价管理-编辑' }
    ]
  },
  // 消息通知
  {
    code: 'module:notifications',
    name: '消息通知',
    children: [
      { code: 'module:notifications:view', name: '消息通知-查看' },
      { code: 'module:notifications:edit', name: '消息通知-编辑' }
    ]
  },
  // 帮助与反馈
  {
    code: 'module:help-feedback',
    name: '帮助与反馈',
    children: [
      { code: 'module:help-feedback:view', name: '帮助反馈-查看' },
      { code: 'module:help-feedback:edit', name: '帮助反馈-编辑' }
    ]
  }
];

// 角色默认菜单权限
export const roleMenuDefaults = {
  admin: [
    'menu:/home',
    'menu:/plc-records',
    'menu:/plc-data-report',
    'menu:/plc-visual-report',
    'menu:/notifications',
    'menu:/user-management',
    'menu:/organization-management',
    'menu:/change-password'
  ],
  operator: [
    'menu:/home',
    'menu:/notifications',
    'menu:/schedule',
    'menu:/safety-self-inspection',
    'menu:/hygiene-self-inspection',
    'menu:/position-work',
    'menu:/position-work/field',
    'menu:/position-work/management',
    'menu:/position-work/records',
    'menu:/temporary-tasks',
    'menu:/maintenance-task',
    'menu:/device-faults',
    'menu:/change-password'
  ],
  maintenance: [
    'menu:/home',
    'menu:/notifications',
    'menu:/safety-self-inspection',
    'menu:/device-faults',
    'menu:/change-password'
  ],
  station_manager: [
    'menu:/home',
    'menu:/plc-records',
    'menu:/plc-data-report',
    'menu:/plc-visual-report',
    'menu:/notifications',
    'menu:/schedule',
    'menu:/safety',
    'menu:/safety-self-inspection',
    'menu:/safety-other-inspection',
    'menu:/safety-rectification',
    'menu:/hygiene',
    'menu:/hygiene-self-inspection',
    'menu:/hygiene-other-inspection',
    'menu:/position-work',
    'menu:/position-work/field',
    'menu:/position-work/management',
    'menu:/position-work/records',
    'menu:/temporary-tasks',
    'menu:/maintenance-task',
    'menu:/device-faults',
    'menu:/reports',
    'menu:/change-password'
  ],
  deputy_manager: [
    'menu:/home',
    'menu:/plc-records',
    'menu:/plc-data-report',
    'menu:/plc-visual-report',
    'menu:/notifications',
    'menu:/schedule',
    'menu:/safety',
    'menu:/safety-self-inspection',
    'menu:/safety-other-inspection',
    'menu:/safety-rectification',
    'menu:/hygiene',
    'menu:/hygiene-self-inspection',
    'menu:/hygiene-other-inspection',
    'menu:/position-work',
    'menu:/position-work/field',
    'menu:/position-work/management',
    'menu:/position-work/records',
    'menu:/temporary-tasks',
    'menu:/maintenance-task',
    'menu:/device-faults',
    'menu:/reports',
    'menu:/change-password'
  ],
  department_manager: [
    'menu:/home',
    'menu:/plc-records',
    'menu:/plc-data-report',
    'menu:/plc-visual-report',
    'menu:/notifications',
    'menu:/schedule',
    'menu:/safety',
    'menu:/safety-self-inspection',
    'menu:/safety-other-inspection',
    'menu:/safety-rectification',
    'menu:/hygiene',
    'menu:/hygiene-self-inspection',
    'menu:/hygiene-other-inspection',
    'menu:/position-work',
    'menu:/position-work/field',
    'menu:/position-work/management',
    'menu:/position-work/records',
    'menu:/temporary-tasks',
    'menu:/maintenance-task',
    'menu:/device-faults',
    'menu:/reports',
    'menu:/change-password'
  ],
  safety_inspector: [
    'menu:/home',
    'menu:/plc-records',
    'menu:/plc-data-report',
    'menu:/plc-visual-report',
    'menu:/notifications',
    'menu:/safety',
    'menu:/safety-check-management',
    'menu:/safety-self-inspection',
    'menu:/safety-other-inspection',
    'menu:/safety-rectification',
    'menu:/hygiene',
    'menu:/hygiene-self-inspection',
    'menu:/hygiene-other-inspection',
    'menu:/change-password'
  ],
  senior_management: [
    'menu:/home',
    'menu:/plc-records',
    'menu:/plc-data-report',
    'menu:/plc-visual-report',
    'menu:/notifications',
    'menu:/schedule',
    'menu:/safety',
    'menu:/safety-self-inspection',
    'menu:/safety-other-inspection',
    'menu:/safety-rectification',
    'menu:/hygiene',
    'menu:/hygiene-self-inspection',
    'menu:/hygiene-other-inspection',
    'menu:/position-work',
    'menu:/position-work/field',
    'menu:/position-work/management',
    'menu:/position-work/records',
    'menu:/temporary-tasks',
    'menu:/maintenance-task',
    'menu:/device-faults',
    'menu:/reports',
    'menu:/change-password'
  ],
  client: [
    'menu:/home',
    'menu:/notifications',
    'menu:/reports',
    'menu:/change-password'
  ]
};

// 角色默认模块权限
export const roleModuleDefaults = {
  admin: [
    // 组织架构 - 全部权限
    'module:organization:station:view', 'module:organization:station:edit',
    'module:organization:department:view', 'module:organization:department:edit',
    'module:organization:company:view', 'module:organization:company:edit',
    'module:organization:role:view', 'module:organization:role:edit',
    // 用户管理 - 全部权限
    'module:user:view', 'module:user:edit',
    // PLC记录
    'module:plc-records:view', 'module:plc-records:edit',
    // 消息通知
    'module:notifications:view', 'module:notifications:edit',
    // 帮助反馈
    'module:help-feedback:view', 'module:help-feedback:edit'
  ],
  operator: [
    'module:schedule:view',
    'module:safety-self-inspection:view', 'module:safety-self-inspection:edit',
    'module:safety-self-inspection:my:view', 'module:safety-self-inspection:my:edit',
    'module:safety-self-inspection:staff:view', 'module:safety-self-inspection:staff:edit',
    'module:hygiene-self-inspection:view', 'module:hygiene-self-inspection:edit',
    'module:hygiene-self-inspection:my:view', 'module:hygiene-self-inspection:my:edit',
    'module:hygiene-self-inspection:staff:view', 'module:hygiene-self-inspection:staff:edit',
    'module:position-work:view', 'module:position-work:edit',
    'module:position-work:my-work:view', 'module:position-work:my-work:edit',
    'module:position-work:management:view', 'module:position-work:management:edit',
    'module:temporary-tasks:view', 'module:temporary-tasks:edit',
    'module:temporary-tasks:tasks:view', 'module:temporary-tasks:tasks:edit',
    'module:temporary-tasks:library:view', 'module:temporary-tasks:library:edit',
    'module:device-faults:view', 'module:device-faults:edit',
    'module:device-faults:faults:view', 'module:device-faults:faults:edit',
    'module:device-faults:equipment:view', 'module:device-faults:equipment:edit',
    'module:notifications:view',
    'module:help-feedback:view', 'module:help-feedback:edit'
  ],
  maintenance: [
    'module:safety-self-inspection:view', 'module:safety-self-inspection:edit',
    'module:safety-self-inspection:my:view', 'module:safety-self-inspection:my:edit',
    'module:safety-self-inspection:staff:view', 'module:safety-self-inspection:staff:edit',
    'module:device-faults:view', 'module:device-faults:edit',
    'module:device-faults:faults:view', 'module:device-faults:faults:edit',
    'module:device-faults:equipment:view', 'module:device-faults:equipment:edit',
    'module:repair-work:pending:view', 'module:repair-work:pending:edit',
    'module:repair-work:in-progress:view', 'module:repair-work:in-progress:edit',
    'module:repair-work:completed:view', 'module:repair-work:completed:edit',
    'module:notifications:view',
    'module:help-feedback:view', 'module:help-feedback:edit'
  ],
  station_manager: [
    'module:schedule:view', 'module:schedule:edit',
    'module:safety-self-inspection:view', 'module:safety-self-inspection:edit',
    'module:safety-self-inspection:my:view', 'module:safety-self-inspection:my:edit',
    'module:safety-self-inspection:staff:view', 'module:safety-self-inspection:staff:edit',
    'module:safety-other-inspection:view', 'module:safety-other-inspection:edit',
    'module:safety-rectification:view', 'module:safety-rectification:edit',
    'module:hygiene-self-inspection:view', 'module:hygiene-self-inspection:edit',
    'module:hygiene-self-inspection:my:view', 'module:hygiene-self-inspection:my:edit',
    'module:hygiene-self-inspection:staff:view', 'module:hygiene-self-inspection:staff:edit',
    'module:hygiene-other-inspection:view', 'module:hygiene-other-inspection:edit',
    'module:hygiene-other-inspection:inspection:view', 'module:hygiene-other-inspection:inspection:edit',
    'module:hygiene-other-inspection:management-areas:view', 'module:hygiene-other-inspection:management-areas:edit',
    'module:hygiene-other-inspection:management-assignments:view', 'module:hygiene-other-inspection:management-assignments:edit',
    'module:position-work:view', 'module:position-work:edit',
    'module:position-work:my-work:view', 'module:position-work:my-work:edit',
    'module:position-work:management:view', 'module:position-work:management:edit',
    'module:temporary-tasks:view', 'module:temporary-tasks:edit',
    'module:temporary-tasks:tasks:view', 'module:temporary-tasks:tasks:edit',
    'module:temporary-tasks:library:view', 'module:temporary-tasks:library:edit',
    'module:device-faults:view', 'module:device-faults:edit',
    'module:device-faults:faults:view', 'module:device-faults:faults:edit',
    'module:device-faults:equipment:view', 'module:device-faults:equipment:edit',
    'module:fault-report:report:view', 'module:fault-report:report:edit',
    'module:fault-report:equipment:view', 'module:fault-report:equipment:edit',
    'module:repair-work:pending:view', 'module:repair-work:pending:edit',
    'module:repair-work:in-progress:view', 'module:repair-work:in-progress:edit',
    'module:repair-work:completed:view', 'module:repair-work:completed:edit',
    'module:maintenance-approval:pending:view', 'module:maintenance-approval:pending:edit',
    'module:maintenance-approval:approved:view', 'module:maintenance-approval:approved:edit',
    'module:maintenance-approval:rejected:view', 'module:maintenance-approval:rejected:edit',
    'module:plc-records:view',
    'module:reports:view',
    'module:reports:maintenance:view', 'module:reports:maintenance:edit',
    'module:reports:faults:view', 'module:reports:faults:edit',
    'module:notifications:view', 'module:notifications:edit',
    'module:help-feedback:view', 'module:help-feedback:edit'
  ],
  deputy_manager: [
    'module:schedule:view', 'module:schedule:edit',
    'module:safety-self-inspection:view', 'module:safety-self-inspection:edit',
    'module:safety-self-inspection:my:view', 'module:safety-self-inspection:my:edit',
    'module:safety-self-inspection:staff:view', 'module:safety-self-inspection:staff:edit',
    'module:safety-other-inspection:view', 'module:safety-other-inspection:edit',
    'module:safety-rectification:view', 'module:safety-rectification:edit',
    'module:hygiene-self-inspection:view', 'module:hygiene-self-inspection:edit',
    'module:hygiene-self-inspection:my:view', 'module:hygiene-self-inspection:my:edit',
    'module:hygiene-self-inspection:staff:view', 'module:hygiene-self-inspection:staff:edit',
    'module:hygiene-other-inspection:view', 'module:hygiene-other-inspection:edit',
    'module:hygiene-other-inspection:inspection:view', 'module:hygiene-other-inspection:inspection:edit',
    'module:hygiene-other-inspection:management-areas:view', 'module:hygiene-other-inspection:management-areas:edit',
    'module:hygiene-other-inspection:management-assignments:view', 'module:hygiene-other-inspection:management-assignments:edit',
    'module:position-work:view', 'module:position-work:edit',
    'module:position-work:my-work:view', 'module:position-work:my-work:edit',
    'module:position-work:management:view', 'module:position-work:management:edit',
    'module:temporary-tasks:view', 'module:temporary-tasks:edit',
    'module:temporary-tasks:tasks:view', 'module:temporary-tasks:tasks:edit',
    'module:temporary-tasks:library:view', 'module:temporary-tasks:library:edit',
    'module:device-faults:view', 'module:device-faults:edit',
    'module:device-faults:faults:view', 'module:device-faults:faults:edit',
    'module:device-faults:equipment:view', 'module:device-faults:equipment:edit',
    'module:fault-report:report:view', 'module:fault-report:report:edit',
    'module:fault-report:equipment:view', 'module:fault-report:equipment:edit',
    'module:repair-work:pending:view', 'module:repair-work:pending:edit',
    'module:repair-work:in-progress:view', 'module:repair-work:in-progress:edit',
    'module:repair-work:completed:view', 'module:repair-work:completed:edit',
    'module:maintenance-approval:pending:view', 'module:maintenance-approval:pending:edit',
    'module:maintenance-approval:approved:view', 'module:maintenance-approval:approved:edit',
    'module:maintenance-approval:rejected:view', 'module:maintenance-approval:rejected:edit',
    'module:plc-records:view',
    'module:reports:view',
    'module:reports:maintenance:view', 'module:reports:maintenance:edit',
    'module:reports:faults:view', 'module:reports:faults:edit',
    'module:notifications:view', 'module:notifications:edit',
    'module:help-feedback:view', 'module:help-feedback:edit'
  ],
  department_manager: [
    'module:schedule:view', 'module:schedule:edit',
    'module:safety-self-inspection:view', 'module:safety-self-inspection:edit',
    'module:safety-self-inspection:my:view', 'module:safety-self-inspection:my:edit',
    'module:safety-self-inspection:staff:view', 'module:safety-self-inspection:staff:edit',
    'module:safety-other-inspection:view', 'module:safety-other-inspection:edit',
    'module:safety-rectification:view', 'module:safety-rectification:edit',
    'module:hygiene-self-inspection:view', 'module:hygiene-self-inspection:edit',
    'module:hygiene-self-inspection:my:view', 'module:hygiene-self-inspection:my:edit',
    'module:hygiene-self-inspection:staff:view', 'module:hygiene-self-inspection:staff:edit',
    'module:hygiene-other-inspection:view', 'module:hygiene-other-inspection:edit',
    'module:hygiene-other-inspection:inspection:view', 'module:hygiene-other-inspection:inspection:edit',
    'module:hygiene-other-inspection:management-areas:view', 'module:hygiene-other-inspection:management-areas:edit',
    'module:hygiene-other-inspection:management-assignments:view', 'module:hygiene-other-inspection:management-assignments:edit',
    'module:position-work:view', 'module:position-work:edit',
    'module:position-work:my-work:view', 'module:position-work:my-work:edit',
    'module:position-work:management:view', 'module:position-work:management:edit',
    'module:temporary-tasks:view', 'module:temporary-tasks:edit',
    'module:temporary-tasks:tasks:view', 'module:temporary-tasks:tasks:edit',
    'module:temporary-tasks:library:view', 'module:temporary-tasks:library:edit',
    'module:device-faults:view', 'module:device-faults:edit',
    'module:device-faults:faults:view', 'module:device-faults:faults:edit',
    'module:device-faults:equipment:view', 'module:device-faults:equipment:edit',
    'module:fault-report:report:view', 'module:fault-report:report:edit',
    'module:fault-report:equipment:view', 'module:fault-report:equipment:edit',
    'module:repair-work:pending:view', 'module:repair-work:pending:edit',
    'module:repair-work:in-progress:view', 'module:repair-work:in-progress:edit',
    'module:repair-work:completed:view', 'module:repair-work:completed:edit',
    'module:maintenance-approval:pending:view', 'module:maintenance-approval:pending:edit',
    'module:maintenance-approval:approved:view', 'module:maintenance-approval:approved:edit',
    'module:maintenance-approval:rejected:view', 'module:maintenance-approval:rejected:edit',
    'module:plc-records:view',
    'module:reports:view',
    'module:reports:maintenance:view', 'module:reports:maintenance:edit',
    'module:reports:faults:view', 'module:reports:faults:edit',
    'module:notifications:view', 'module:notifications:edit',
    'module:help-feedback:view', 'module:help-feedback:edit'
  ],
  safety_inspector: [
    'module:safety-check-management:view', 'module:safety-check-management:edit',
    'module:safety-self-inspection:view', 'module:safety-self-inspection:edit',
    'module:safety-self-inspection:my:view', 'module:safety-self-inspection:my:edit',
    'module:safety-self-inspection:staff:view', 'module:safety-self-inspection:staff:edit',
    'module:safety-other-inspection:view', 'module:safety-other-inspection:edit',
    'module:safety-rectification:view', 'module:safety-rectification:edit',
    'module:hygiene-self-inspection:view',
    'module:hygiene-self-inspection:my:view', 'module:hygiene-self-inspection:my:edit',
    'module:hygiene-self-inspection:staff:view', 'module:hygiene-self-inspection:staff:edit',
    'module:hygiene-other-inspection:view',
    'module:hygiene-other-inspection:inspection:view', 'module:hygiene-other-inspection:inspection:edit',
    'module:hygiene-other-inspection:management-areas:view', 'module:hygiene-other-inspection:management-areas:edit',
    'module:hygiene-other-inspection:management-assignments:view', 'module:hygiene-other-inspection:management-assignments:edit',
    'module:plc-records:view',
    'module:notifications:view',
    'module:help-feedback:view', 'module:help-feedback:edit'
  ],
  senior_management: [
    'module:schedule:view',
    'module:safety-self-inspection:view',
    'module:safety-self-inspection:my:view', 'module:safety-self-inspection:my:edit',
    'module:safety-self-inspection:staff:view', 'module:safety-self-inspection:staff:edit',
    'module:safety-other-inspection:view',
    'module:safety-rectification:view',
    'module:hygiene-self-inspection:view',
    'module:hygiene-self-inspection:my:view', 'module:hygiene-self-inspection:my:edit',
    'module:hygiene-self-inspection:staff:view', 'module:hygiene-self-inspection:staff:edit',
    'module:hygiene-other-inspection:view',
    'module:hygiene-other-inspection:inspection:view', 'module:hygiene-other-inspection:inspection:edit',
    'module:hygiene-other-inspection:management-areas:view', 'module:hygiene-other-inspection:management-areas:edit',
    'module:hygiene-other-inspection:management-assignments:view', 'module:hygiene-other-inspection:management-assignments:edit',
    'module:position-work:view',
    'module:position-work:my-work:view', 'module:position-work:my-work:edit',
    'module:position-work:management:view', 'module:position-work:management:edit',
    'module:temporary-tasks:view',
    'module:temporary-tasks:tasks:view', 'module:temporary-tasks:tasks:edit',
    'module:temporary-tasks:library:view', 'module:temporary-tasks:library:edit',
    'module:device-faults:view',
    'module:device-faults:faults:view', 'module:device-faults:faults:edit',
    'module:device-faults:equipment:view', 'module:device-faults:equipment:edit',
    'module:fault-report:report:view', 'module:fault-report:report:edit',
    'module:fault-report:equipment:view', 'module:fault-report:equipment:edit',
    'module:repair-work:pending:view', 'module:repair-work:pending:edit',
    'module:repair-work:in-progress:view', 'module:repair-work:in-progress:edit',
    'module:repair-work:completed:view', 'module:repair-work:completed:edit',
    'module:plc-records:view',
    'module:reports:view',
    'module:reports:maintenance:view', 'module:reports:maintenance:edit',
    'module:reports:faults:view', 'module:reports:faults:edit',
    'module:notifications:view',
    'module:help-feedback:view', 'module:help-feedback:edit'
  ],
  client: [
    'module:reports:view',
    'module:reports:maintenance:view', 'module:reports:maintenance:edit',
    'module:reports:faults:view', 'module:reports:faults:edit',
    'module:notifications:view',
    'module:help-feedback:view', 'module:help-feedback:edit'
  ]
};

export const flattenMenuPermissions = () => {
  const result = [];
  const walk = (items, parentCode = null) => {
    items.forEach(item => {
      result.push({
        code: item.code,
        name: item.name,
        parentCode
      });
      if (item.children?.length) {
        walk(item.children, item.code);
      }
    });
  };
  walk(menuPermissions);
  return result;
};

export const flattenModulePermissions = () => {
  const result = [];
  const walk = (items, parentCode = null) => {
    items.forEach(item => {
      result.push({
        code: item.code,
        name: item.name,
        parentCode
      });
      if (item.children?.length) {
        walk(item.children, item.code);
      }
    });
  };
  walk(modulePermissions);
  return result;
};

// 兼容旧代码
export const menuCodeToModuleCode = (menuCode) => {
  if (!menuCode?.startsWith('menu:/')) {
    return null;
  }
  return `module:${menuCode.slice(6)}`;
};

// 兼容旧代码 - 从菜单生成模块权限
export const buildModulePermissions = () => {
  return flattenModulePermissions().filter(p => p.code.includes(':view') || p.code.includes(':edit'));
};

const allMenuCodes = flattenMenuPermissions().map(item => item.code);
const allModuleCodes = buildModulePermissions().map(item => item.code);

roleMenuDefaults.dev_test = allMenuCodes;
roleModuleDefaults.dev_test = allModuleCodes;

export const systemRoleCodes = Object.keys(roleMenuDefaults);
