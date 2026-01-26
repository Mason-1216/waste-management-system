import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/store/modules/user';
import { routes } from './modules';

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
const ROUTE_REFRESH_KEY = 'wms:route-refresh-on-enter';
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
    pushRouteLog({ type: 'beforeEach-error', message: String(error) });
    // 出错时也允许导航，避免阻塞
    next();
  }
});

// 路由加载后处理
router.afterEach((to, from, failure) => {
  // 如果路由导航失败，记录错误
  if (failure) {
    pushRouteLog({ type: 'afterEach-failure', to: to.fullPath, from: from.fullPath, message: String(failure) });
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

  if (import.meta.env.PROD && to.fullPath !== from.fullPath) {
    const refreshKey = `${ROUTE_REFRESH_KEY}:${to.fullPath}`;
    if (!sessionStorage.getItem(refreshKey)) {
      sessionStorage.setItem(refreshKey, '1');
      window.location.replace(to.fullPath);
      return;
    }
    sessionStorage.removeItem(refreshKey);
  }

  // 确保页面滚动到顶部
  if (to.path !== from.path) {
    window.scrollTo(0, 0);
  }
});

export default router;
