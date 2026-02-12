import { menuHome, menuAdmin, menuAccount, modulePermissions as coreModulePermissions } from '../permissions.js';
import { menuPermissions as plcMenuPermissions, modulePermissions as plcModulePermissions } from '../../plc/permissions.js';
import { menuPermissions as notificationMenuPermissions, modulePermissions as notificationModulePermissions } from '../../notification/permissions.js';
import { menuPermissions as scheduleMenuPermissions, modulePermissions as scheduleModulePermissions } from '../../schedule/permissions.js';
import { menuPointsSummary, menuReports, modulePermissions as reportModulePermissions } from '../../report/permissions.js';
import { menuSafety, menuSafetyRectification, menuHygiene, modulePermissions as inspectionModulePermissions } from '../../inspection/permissions.js';
import { menuPositionWork, menuTemporaryTasks, modulePermissions as taskModulePermissions } from '../../task/permissions.js';
import { menuPermissions as maintenanceMenuPermissions, modulePermissions as maintenanceModulePermissions } from '../../maintenance/permissions.js';
import { menuPermissions as supportMenuPermissions, modulePermissions as supportModulePermissions } from '../../support/permissions.js';

// ???? - ???????
export const menuPermissions = [
  ...menuHome,
  ...plcMenuPermissions,
  ...notificationMenuPermissions,
  ...menuAdmin,
  ...scheduleMenuPermissions,
  ...menuPointsSummary,
  ...menuSafety,
  ...menuSafetyRectification,
  ...menuHygiene,
  ...menuPositionWork,
  ...menuTemporaryTasks,
  ...maintenanceMenuPermissions,
  ...menuReports,
  ...menuAccount,
  ...supportMenuPermissions
];

// ?????? - ???????
// ?????? view????? edit????????
export const modulePermissions = [
  ...coreModulePermissions,
  ...scheduleModulePermissions,
  ...inspectionModulePermissions,
  ...taskModulePermissions,
  ...maintenanceModulePermissions,
  ...plcModulePermissions,
  ...reportModulePermissions,
  ...notificationModulePermissions,
  ...supportModulePermissions
];

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
    'menu:/position-work/records',
    'menu:/temporary-tasks',
    'menu:/temporary-tasks/fill',
    'menu:/temporary-tasks/history',
    'menu:/maintenance-task',
    'menu:/device-faults',
    'menu:/points-summary',
    'menu:/change-password'
  ],
  maintenance: [
    'menu:/home',
    'menu:/notifications',
    'menu:/safety-self-inspection',
    'menu:/device-faults',
    'menu:/points-summary',
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
    'menu:/temporary-tasks/fill',
    'menu:/temporary-tasks/history',
    'menu:/temporary-tasks/library',
    'menu:/maintenance-task',
    'menu:/device-faults',
    'menu:/reports',
    'menu:/points-summary',
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
    'menu:/temporary-tasks/fill',
    'menu:/temporary-tasks/history',
    'menu:/temporary-tasks/library',
    'menu:/maintenance-task',
    'menu:/device-faults',
    'menu:/reports',
    'menu:/points-summary',
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
    'menu:/temporary-tasks/fill',
    'menu:/temporary-tasks/history',
    'menu:/temporary-tasks/library',
    'menu:/maintenance-task',
    'menu:/device-faults',
    'menu:/reports',
    'menu:/points-summary',
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
    'menu:/temporary-tasks/fill',
    'menu:/temporary-tasks/history',
    'menu:/temporary-tasks/library',
    'menu:/maintenance-task',
    'menu:/device-faults',
    'menu:/reports',
    'menu:/points-summary',
    'menu:/change-password'
  ],
  client: [
    'menu:/home',
    'menu:/notifications',
    'menu:/reports',
    'menu:/points-summary',
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
    'module:plc-data-report:view', 'module:plc-data-report:edit',
    'module:plc-visual-report:view', 'module:plc-visual-report:edit',
    // 消息通知
    'module:notifications:view', 'module:notifications:edit',
    // 帮助反馈
    'module:help-feedback:view', 'module:help-feedback:edit'
  ],
  operator: [
    'module:schedule:view',
    'module:safety-self-inspection:view', 'module:safety-self-inspection:edit',
    'module:hygiene-self-inspection:view', 'module:hygiene-self-inspection:edit',
    'module:position-work:view', 'module:position-work:edit',
    'module:position-work:my-work:view', 'module:position-work:my-work:edit',
    'module:temporary-tasks:view', 'module:temporary-tasks:edit',
    'module:temporary-tasks:tasks:view', 'module:temporary-tasks:tasks:edit',
    'module:temporary-tasks:library:view', 'module:temporary-tasks:library:edit',
    'module:device-faults:view', 'module:device-faults:edit',
    'module:device-faults:faults:view', 'module:device-faults:faults:edit',
    'module:device-faults:equipment:view', 'module:device-faults:equipment:edit',
    'module:maintenance-task:view', 'module:maintenance-task:edit',
    'module:points-summary:view',
    'module:notifications:view',
    'module:help-feedback:view', 'module:help-feedback:edit'
  ],
  maintenance: [
    'module:safety-self-inspection:view', 'module:safety-self-inspection:edit',
    'module:device-faults:view', 'module:device-faults:edit',
    'module:device-faults:faults:view', 'module:device-faults:faults:edit',
    'module:device-faults:equipment:view', 'module:device-faults:equipment:edit',
    'module:repair-work:pending:view', 'module:repair-work:pending:edit',
    'module:repair-work:in-progress:view', 'module:repair-work:in-progress:edit',
    'module:repair-work:completed:view', 'module:repair-work:completed:edit',
    'module:points-summary:view',
    'module:notifications:view',
    'module:help-feedback:view', 'module:help-feedback:edit'
  ],
  station_manager: [
    'module:schedule:view', 'module:schedule:edit',
    'module:safety-self-inspection:view', 'module:safety-self-inspection:edit',
    'module:safety-other-inspection:view', 'module:safety-other-inspection:edit',
    'module:safety-check-management:view', 'module:safety-check-management:edit',
    'module:safety-rectification:view', 'module:safety-rectification:edit',
    'module:hygiene-self-inspection:view', 'module:hygiene-self-inspection:edit',
    'module:hygiene-other-inspection:view', 'module:hygiene-other-inspection:edit',
    'module:hygiene-work-arrangement:view', 'module:hygiene-work-arrangement:edit',
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
    'module:plc-data-report:view',
    'module:plc-visual-report:view',
    'module:reports:view',
    'module:reports:maintenance:view', 'module:reports:maintenance:edit',
    'module:reports:faults:view', 'module:reports:faults:edit',
    'module:maintenance-task:view', 'module:maintenance-task:edit',
    'module:points-summary:view',
    'module:quarterly-award:view', 'module:quarterly-award:edit',
    'module:notifications:view', 'module:notifications:edit',
    'module:help-feedback:view', 'module:help-feedback:edit'
  ],
  deputy_manager: [
    'module:schedule:view', 'module:schedule:edit',
    'module:safety-self-inspection:view', 'module:safety-self-inspection:edit',
    'module:safety-other-inspection:view', 'module:safety-other-inspection:edit',
    'module:safety-check-management:view', 'module:safety-check-management:edit',
    'module:safety-rectification:view', 'module:safety-rectification:edit',
    'module:hygiene-self-inspection:view', 'module:hygiene-self-inspection:edit',
    'module:hygiene-other-inspection:view', 'module:hygiene-other-inspection:edit',
    'module:hygiene-work-arrangement:view', 'module:hygiene-work-arrangement:edit',
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
    'module:plc-data-report:view',
    'module:plc-visual-report:view',
    'module:reports:view',
    'module:reports:maintenance:view', 'module:reports:maintenance:edit',
    'module:reports:faults:view', 'module:reports:faults:edit',
    'module:maintenance-task:view', 'module:maintenance-task:edit',
    'module:points-summary:view',
    'module:quarterly-award:view', 'module:quarterly-award:edit',
    'module:notifications:view', 'module:notifications:edit',
    'module:help-feedback:view', 'module:help-feedback:edit'
  ],
  department_manager: [
    'module:schedule:view', 'module:schedule:edit',
    'module:safety-self-inspection:view', 'module:safety-self-inspection:edit',
    'module:safety-other-inspection:view', 'module:safety-other-inspection:edit',
    'module:safety-check-management:view', 'module:safety-check-management:edit',
    'module:safety-rectification:view', 'module:safety-rectification:edit',
    'module:hygiene-self-inspection:view', 'module:hygiene-self-inspection:edit',
    'module:hygiene-other-inspection:view', 'module:hygiene-other-inspection:edit',
    'module:hygiene-work-arrangement:view', 'module:hygiene-work-arrangement:edit',
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
    'module:plc-data-report:view',
    'module:plc-visual-report:view',
    'module:reports:view',
    'module:reports:maintenance:view', 'module:reports:maintenance:edit',
    'module:reports:faults:view', 'module:reports:faults:edit',
    'module:maintenance-task:view', 'module:maintenance-task:edit',
    'module:points-summary:view',
    'module:quarterly-award:view', 'module:quarterly-award:edit',
    'module:notifications:view', 'module:notifications:edit',
    'module:help-feedback:view', 'module:help-feedback:edit'
  ],
  safety_inspector: [
    'module:safety-check-management:view', 'module:safety-check-management:edit',
    'module:safety-self-inspection:view', 'module:safety-self-inspection:edit',
    'module:safety-other-inspection:view', 'module:safety-other-inspection:edit',
    'module:safety-rectification:view', 'module:safety-rectification:edit',
    'module:hygiene-self-inspection:view',
    'module:hygiene-other-inspection:view',
    'module:hygiene-work-arrangement:view', 'module:hygiene-work-arrangement:edit',
    'module:plc-records:view',
    'module:plc-data-report:view',
    'module:plc-visual-report:view',
    'module:notifications:view',
    'module:help-feedback:view', 'module:help-feedback:edit'
  ],
  senior_management: [
    'module:schedule:view', 'module:schedule:edit',
    'module:safety-self-inspection:view',
    'module:safety-other-inspection:view',
    'module:safety-rectification:view',
    'module:hygiene-self-inspection:view',
    'module:hygiene-other-inspection:view',
    'module:hygiene-work-arrangement:view', 'module:hygiene-work-arrangement:edit',
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
    'module:plc-data-report:view',
    'module:plc-visual-report:view',
    'module:reports:view',
    'module:reports:maintenance:view', 'module:reports:maintenance:edit',
    'module:reports:faults:view', 'module:reports:faults:edit',
    'module:maintenance-task:view', 'module:maintenance-task:edit',
    'module:points-summary:view',
    'module:quarterly-award:view', 'module:quarterly-award:edit',
    'module:notifications:view',
    'module:help-feedback:view', 'module:help-feedback:edit'
  ],
  client: [
    'module:reports:view',
    'module:reports:maintenance:view', 'module:reports:maintenance:edit',
    'module:reports:faults:view', 'module:reports:faults:edit',
    'module:points-summary:view',
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
