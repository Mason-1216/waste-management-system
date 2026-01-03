export const menuPermissions = [
  { code: 'menu:/home', name: '首页' },
  { code: 'menu:/plc-records', name: '\u0050\u004c\u0043\u8bb0\u5f55' },
  { code: 'menu:/notifications', name: '\u6d88\u606f\u901a\u77e5' },
  { code: 'menu:/user-management', name: '用户管理' },
  { code: 'menu:/organization-management', name: '组织架构' },
  { code: 'menu:/schedule', name: '排班表' },
  {
    code: 'menu:/safety',
    name: '安全检查',
    children: [
      { code: 'menu:/safety-self-inspection', name: '安全自检' },
      { code: 'menu:/safety-other-inspection', name: '安全他检' },
      { code: 'menu:/safety-check-management', name: '检查项目管理' }
    ]
  },
  { code: 'menu:/safety-rectification', name: '安全隐患' },
  {
    code: 'menu:/hygiene',
    name: '卫生检查',
    children: [
      { code: 'menu:/hygiene-self-inspection', name: '卫生自检' },
      { code: 'menu:/hygiene-other-inspection', name: '卫生他检' }
    ]
  },
  { code: 'menu:/position-work', name: '岗位工作' },
  { code: 'menu:/temporary-tasks', name: '临时工作' },
  { code: 'menu:/equipment-maintenance', name: '设备保养' },
  { code: 'menu:/device-faults', name: '设备故障' },
  { code: 'menu:/reports', name: '数据报表' },
  { code: 'menu:/price-management', name: '单价管理' },
  { code: 'menu:/change-password', name: '修改密码' },
  { code: 'menu:/help-feedback', name: '帮助与反馈' }
];

export const roleMenuDefaults = {
  admin: [
    'menu:/home',
    'menu:/plc-records',
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
    'menu:/temporary-tasks',
    'menu:/equipment-maintenance',
    'menu:/device-faults',
    'menu:/change-password'
  ],
  maintenance: [
    'menu:/home',
    'menu:/notifications',
    'menu:/safety-self-inspection',
    'menu:/equipment-maintenance',
    'menu:/device-faults',
    'menu:/change-password'
  ],
  station_manager: [
    'menu:/home',
    'menu:/plc-records',
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
    'menu:/temporary-tasks',
    'menu:/equipment-maintenance',
    'menu:/device-faults',
    'menu:/reports',
    'menu:/change-password'
  ],
  deputy_manager: [
    'menu:/home',
    'menu:/plc-records',
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
    'menu:/temporary-tasks',
    'menu:/equipment-maintenance',
    'menu:/device-faults',
    'menu:/reports',
    'menu:/change-password'
  ],
  department_manager: [
    'menu:/home',
    'menu:/plc-records',
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
    'menu:/temporary-tasks',
    'menu:/equipment-maintenance',
    'menu:/device-faults',
    'menu:/reports',
    'menu:/change-password'
  ],
  safety_inspector: [
    'menu:/home',
    'menu:/plc-records',
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
    'menu:/temporary-tasks',
    'menu:/equipment-maintenance',
    'menu:/device-faults',
    'menu:/reports',
    'menu:/change-password'
  ],
  client: [
    'menu:/home',
    'menu:/notifications',
    'menu:/equipment-maintenance',
    'menu:/reports',
    'menu:/change-password'
  ]
};

export const systemRoleCodes = Object.keys(roleMenuDefaults);

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

export const menuCodeToModuleCode = (menuCode) => {
  if (!menuCode?.startsWith('menu:/')) {
    return null;
  }
  return `module:${menuCode.slice(6)}`;
};

export const buildModulePermissions = () => {
  const flatMenus = flattenMenuPermissions();
  const leafMenus = flatMenus.filter(menu => {
    const hasChildren = menuPermissions.some(item => item.code === menu.code && item.children?.length);
    return !hasChildren;
  });

  const map = new Map();
  leafMenus.forEach(menu => {
    const moduleCode = menuCodeToModuleCode(menu.code);
    if (!moduleCode) return;
    if (!map.has(moduleCode)) {
      map.set(moduleCode, { code: moduleCode, name: menu.name });
    }
  });
  return Array.from(map.values());
};
