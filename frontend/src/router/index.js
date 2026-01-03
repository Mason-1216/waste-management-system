import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/store/user';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false, title: '登录' }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layout/Index.vue'),
    redirect: '/home',
    meta: { requiresAuth: true },
    children: [
      {
        path: '/home',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: { title: '首页' }
      },
      // 排班管理
      {
        path: '/schedule',
        name: 'Schedule',
        component: () => import('@/views/schedule/Index.vue'),
        meta: { title: '排班表' }
      },
      // 自检表
      {
        path: '/hygiene-self-inspection',
        name: 'HygieneSelfInspection',
        component: () => import('@/views/inspection/HygieneInspection.vue'),
        meta: { title: '卫生自检' }
      },
      // 岗位工作
      {
        path: '/position-work',
        name: 'PositionWork',
        component: () => import('@/views/task/PositionWork.vue'),
        meta: { title: '岗位工作' }
      },
      {
        path: '/temporary-tasks',
        name: 'TemporaryTasks',
        component: () => import('@/views/task/TemporaryTasks.vue'),
        meta: { title: '临时工作管理' }
      },
      // 故障与维修
      {
        path: '/device-faults',
        name: 'DeviceFaults',
        component: () => import('@/views/maintenance/DeviceFaults.vue'),
        meta: { title: '设备故障' }
      },
      {
        path: '/fault-report',
        name: 'FaultReport',
        component: () => import('@/views/maintenance/FaultReport.vue'),
        meta: { title: '故障上报' }
      },
      {
        path: '/fault-list',
        name: 'FaultList',
        component: () => import('@/views/maintenance/FaultList.vue'),
        meta: { title: '故障列表' }
      },
      {
        path: '/maintenance-dispatch',
        name: 'MaintenanceDispatch',
        component: () => import('@/views/maintenance/MaintenanceDispatch.vue'),
        meta: { title: '维修派发单' }
      },
      {
        path: '/repair-work',
        name: 'RepairWork',
        component: () => import('@/views/maintenance/RepairWork.vue'),
        meta: { title: '维修工作' }
      },
      // 设备维修记录单
      {
        path: '/repair-records',
        name: 'RepairRecordList',
        component: () => import('@/views/maintenance/RepairRecordList.vue'),
        meta: { title: '设备维修记录' }
      },
      {
        path: '/repair-record/new',
        name: 'RepairRecordNew',
        component: () => import('@/views/maintenance/RepairRecordForm.vue'),
        meta: { title: '新建维修记录' }
      },
      {
        path: '/repair-record/:id',
        name: 'RepairRecordDetail',
        component: () => import('@/views/maintenance/RepairRecordForm.vue'),
        meta: { title: '维修记录详情' }
      },
      // 设备保养
      {
        path: '/maintenance-plan',
        name: 'MaintenancePlan',
        component: () => import('@/views/maintenance/MaintenancePlan.vue'),
        meta: { title: '保养计划', roles: ['admin', 'station_manager', 'department_manager', 'deputy_manager'] }
      },
      {
        path: '/maintenance-record',
        name: 'MaintenanceRecord',
        component: () => import('@/views/maintenance/MaintenanceRecord.vue'),
        meta: { title: '保养记录' }
      },
      // 设备保养（新版）
      {
        path: '/equipment-maintenance',
        name: 'EquipmentMaintenance',
        component: () => import('@/views/maintenance/EquipmentMaintenance.vue'),
        meta: { title: '设备保养', roles: ['operator', 'station_manager', 'department_manager', 'deputy_manager'] }
      },
      // 员工保养任务
      {
        path: '/maintenance-task',
        name: 'MaintenanceTask',
        component: () => import('@/views/maintenance/MaintenanceTask.vue'),
        meta: { title: '保养任务' }
      },
      // 进出料管理
      {
        path: '/inbound',
        name: 'Inbound',
        component: () => import('@/views/inbound-outbound/Inbound.vue'),
        meta: { title: '进料管理' }
      },
      {
        path: '/outbound',
        name: 'Outbound',
        component: () => import('@/views/inbound-outbound/Outbound.vue'),
        meta: { title: '出料管理' }
      },
      {
        path: '/inventory',
        name: 'Inventory',
        component: () => import('@/views/inbound-outbound/Inventory.vue'),
        meta: { title: '库存查询' }
      },
      // 安全隐患
      {
        path: '/safety-rectification',
        name: 'SafetyRectification',
        component: () => import('@/views/inspection/SafetyRectification.vue'),
        meta: { title: '安全隐患' }
      },
      // PLC记录
      {
        path: '/plc-records',
        name: 'PlcRecords',
        component: () => import('@/views/plc/PlcRecords.vue'),
        meta: { title: 'PLC记录' }
      },
      // 消息管理
      {
        path: '/notifications',
        name: 'NotificationManagement',
        component: () => import('@/views/system/NotificationManagement.vue'),
        meta: { title: '\u6d88\u606f\u901a\u77e5' }
      },
      // 数据报表
      {
        path: '/reports',
        name: 'Reports',
        component: () => import('@/views/reports/Index.vue'),
        meta: { title: '数据报表' }
      },
      // 单价管理
      {
        path: '/price-management',
        name: 'PriceManagement',
        component: () => import('@/views/system/PriceManagement.vue'),
        meta: { title: '单价管理' }
      },
      // 用户管理
      {
        path: '/user-management',
        name: 'UserManagement',
        component: () => import('@/views/system/UserManagement.vue'),
        meta: { title: '用户管理', roles: ['admin'] }
      },
      // 组织架构管理
      {
        path: '/organization-management',
        name: 'OrganizationManagement',
        component: () => import('@/views/system/OrganizationManagement.vue'),
        meta: { title: '组织架构', roles: ['admin'] }
      },
      // 修改密码
      {
        path: '/change-password',
        name: 'ChangePassword',
        component: () => import('@/views/system/ChangePassword.vue'),
        meta: { title: '修改密码' }
      },
      // 帮助与反馈
      {
        path: '/help-feedback',
        name: 'HelpFeedback',
        component: () => import('@/views/system/HelpFeedback.vue'),
        meta: { title: '帮助与反馈' }
      },
      // 卫生他检
      {
        path: '/hygiene-other-inspection',
        name: 'HygieneOtherInspection',
        component: () => import('@/views/inspection/HygieneOtherInspection.vue'),
        meta: { title: '卫生他检' }
      },
      // 安全自检
      {
        path: '/safety-self-inspection',
        name: 'SafetySelfInspection',
        component: () => import('@/views/inspection/SelfInspection.vue'),
        meta: { title: '安全自检', roles: ['operator', 'maintenance', 'station_manager', 'deputy_manager', 'department_manager', 'safety_inspector', 'senior_management', 'admin'] }
      },
      // 安全他检
      {
        path: '/safety-other-inspection',
        name: 'SafetyOtherInspection',
        component: () => import('@/views/inspection/OtherInspection.vue'),
        meta: { title: '安全他检' }
      },
      // 安全检查项目管理
      {
        path: '/safety-check-management',
        name: 'SafetyCheckManagement',
        component: () => import('@/views/inspection/SafetyCheckManagement.vue'),
        meta: { title: '安全检查项目', roles: ['safety_inspector'] }
      }
    ]
  },
  // 404
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '页面不存在' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

const pushRouteLog = (entry) => {
  try {
    const key = 'wms:route-log';
    const raw = sessionStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    list.push({ ts: new Date().toISOString(), ...entry });
    if (list.length > 200) list.splice(0, list.length - 200);
    sessionStorage.setItem(key, JSON.stringify(list));
  } catch {
    // ignore
  }
};

// 自动修复动态模块加载失败导致的空白页
const RELOAD_KEY = 'wms:reload-on-error';
router.onError((error) => {
  const message = error?.message || '';
  pushRouteLog({ type: 'router-error', message });
  const isChunkLoadError = message.includes('Failed to fetch dynamically imported module')
    || message.includes('Importing a module script failed')
    || message.includes('ChunkLoadError');
  if (!isChunkLoadError) return;
  if (sessionStorage.getItem(RELOAD_KEY)) {
    sessionStorage.removeItem(RELOAD_KEY);
    return;
  }
  sessionStorage.setItem(RELOAD_KEY, '1');
  window.location.reload();
});

// 路由守卫
router.beforeEach((to, from, next) => {
  pushRouteLog({ type: 'beforeEach', to: to.fullPath, from: from.fullPath });
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 运行项目管理系统` : '运行项目管理系统';

  try {
    const userStore = useUserStore();
    const requiresAuth = to.meta.requiresAuth !== false;

    // 如果用户未登录且需要认证，跳转到登录页
    if (requiresAuth && !userStore.isLoggedIn) {
      next({ path: '/login', query: { redirect: to.fullPath } });
      return;
    }

    // 如果已登录但访问登录页，跳转到首页
    if (to.path === '/login' && userStore.isLoggedIn) {
      next('/home');
      return;
    }

    // 检查角色权限
    if (to.meta.roles && !userStore.hasRole(to.meta.roles)) {
      next('/home');
      return;
    }

    // 允许导航
    next();
  } catch (error) {
    console.error('路由守卫错误:', error);
    // 出错时也允许导航，避免阻塞
    next();
  }
});

// 路由加载后处理
router.afterEach((to, from, failure) => {
  // 如果路由导航失败，记录错误
  if (failure) {
    pushRouteLog({ type: 'afterEach-failure', to: to.fullPath, from: from.fullPath, message: String(failure) });
    console.error('路由导航失败:', failure);
    return;
  }

  pushRouteLog({ type: 'afterEach', to: to.fullPath, from: from.fullPath });

  const sidebarReloadTarget = sessionStorage.getItem('wms:sidebar-reload-target');
  const sidebarReloadDone = sessionStorage.getItem('wms:sidebar-reload-done');
  if (sidebarReloadTarget && sidebarReloadTarget === to.path && !sidebarReloadDone) {
    sessionStorage.setItem('wms:sidebar-reload-done', '1');
    window.location.reload();
    return;
  }
  if (sidebarReloadDone) {
    sessionStorage.removeItem('wms:sidebar-reload-target');
    sessionStorage.removeItem('wms:sidebar-reload-done');
  }
  
  // 确保页面滚动到顶部
  if (to.path !== from.path) {
    window.scrollTo(0, 0);
  }
  
  // 强制触发组件重新渲染
  if (to.matched.length > 0) {
    // 确保路由已匹配
    const matched = to.matched[to.matched.length - 1];
    if (matched && matched.components) {
      // 路由已正确匹配，组件应该会加载
    }
  }
});

export default router;
