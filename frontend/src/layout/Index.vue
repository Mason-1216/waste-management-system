<template>
  <el-container class="layout-container">
    <!-- 移动端遮罩层 -->
    <div
      v-if="isMobile && mobileMenuVisible"
      class="mobile-overlay"
      @click="closeMobileMenu"
    ></div>

    <el-aside
      :width="isMobile ? '220px' : (isCollapse ? '64px' : '220px')"
      :class="['sidebar', { 'mobile-sidebar': isMobile, 'mobile-visible': mobileMenuVisible }]"
    >
      <div class="logo">
        <div class="logo-title">
          <img src="/logo.svg" alt="logo" v-if="!isCollapse" />
          <span>运行项目管理系统</span>
        </div>
        <div v-if="!isCollapse" class="logo-date">{{ todayText }}</div>
        <div v-if="!isCollapse" class="logo-time">{{ timeText }}</div>
      </div>
      <el-menu
        ref="menuRef"
        :default-active="activeMenu"
        :collapse="isCollapse"
        :unique-opened="false"
        :default-openeds="defaultOpeneds"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        class="sidebar-menu"
        @select="handleMenuSelect"
      >
        <template v-for="menu in menus" :key="menu.path">
          <el-sub-menu v-if="menu.children" :index="menu.path">
            <template #title>
              <el-icon><component :is="menu.icon" /></el-icon>
              <span class="menu-title">
                <span class="menu-text">{{ menu.name }}</span>
                <span v-if="getMenuBadgeCount(menu) > 0" class="menu-badge">{{ getMenuBadgeCount(menu) }}</span>
              </span>
            </template>
            <el-menu-item
              v-for="child in menu.children"
              :key="child.path"
              :index="child.path"
            >
              <span class="menu-title">
                <span class="menu-text">{{ child.name }}</span>
                <span v-if="getMenuBadgeCount(child) > 0" class="menu-badge">{{ getMenuBadgeCount(child) }}</span>
              </span>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item v-else :index="menu.path">
            <el-icon><component :is="menu.icon" /></el-icon>
            <span class="menu-title">
              <span class="menu-text">{{ menu.name }}</span>
              <span v-if="getMenuBadgeCount(menu) > 0" class="menu-badge">{{ getMenuBadgeCount(menu) }}</span>
            </span>
          </el-menu-item>
        </template>
      </el-menu>
      <div class="bottom-menu">
        <el-menu
          :collapse="isCollapse"
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
        >
          <el-menu-item
            v-for="menu in bottomMenuItems"
            :key="menu.path"
            :index="menu.path"
            @click="handleBottomMenuClick(menu)"
          >
            <el-icon><component :is="menu.icon" /></el-icon>
            <span class="menu-title">
              <span class="menu-text">{{ menu.name }}</span>
              <span v-if="getMenuBadgeCount(menu) > 0" class="menu-badge">{{ getMenuBadgeCount(menu) }}</span>
            </span>
          </el-menu-item>
        </el-menu>
      </div>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <!-- 移动端汉堡菜单按钮 -->
          <el-icon v-if="isMobile" class="hamburger-btn" @click="toggleMobileMenu">
            <Fold v-if="mobileMenuVisible" />
            <Expand v-else />
          </el-icon>
          <!-- 桌面端折叠按钮 -->
          <el-icon v-else class="collapse-btn" @click="toggleCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>

          <div v-if="canUseSimpleMode" class="ui-mode-switch">
            <el-button
              size="small"
              :type="uiModeStore.mode === UI_MODES.STANDARD ? 'primary' : 'default'"
              @click="switchUiMode(UI_MODES.STANDARD)"
            >
              标准版
            </el-button>
            <el-button
              size="small"
              :type="uiModeStore.mode === UI_MODES.SIMPLE ? 'primary' : 'default'"
              @click="switchUiMode(UI_MODES.SIMPLE)"
            >
              简洁版
            </el-button>
          </div>


        </div>

        <div class="header-right">
          <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="notification-badge">
            <el-icon class="header-icon" @click="showNotifications">
              <Bell />
            </el-icon>
          </el-badge>
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" icon="User" />
              <span class="user-meta">
                <span class="user-name">{{ displayUserLabel }}</span>
              </span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>
                  <span>{{ displayName }}</span>
                </el-dropdown-item>
                <el-dropdown-item divided command="changePassword">
                  <el-icon><Lock /></el-icon>修改密码
                </el-dropdown-item>
                <el-dropdown-item command="logout">
                  <el-icon><SwitchButton /></el-icon>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view v-slot="{ Component, route: currentRoute }">
          <transition v-if="shouldUseTransition" name="fade" mode="out-in">
            <component
              :is="Component"
              v-if="Component"
              :key="`${currentRoute.fullPath}-${routeKey}`"
            />
          </transition>
          <component
            v-else
            :is="Component"
            v-if="Component"
            :key="`${currentRoute.fullPath}-${routeKey}`"
          />
        </router-view>
      </el-main>
    </el-container>
    <el-drawer v-model="notificationDrawer" title="通知" size="350px">
      <div v-if="notifications.length === 0" class="empty-notifications">
        暂无通知
      </div>
      <div v-else class="notification-list">
        <div
          v-for="n in notifications"
          :key="n.id"
          :class="['notification-item', { unread: !n.is_read }]"
          @click="handleNotificationClick(n)"
        >
          <div class="notification-title">{{ n.title }}</div>
          <div class="notification-content">{{ n.content }}</div>
          <div class="notification-time">{{ formatTime(n.created_at) }}</div>
        </div>
      </div>
    </el-drawer>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, onErrorCaptured, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/store/modules/user';
import { UI_MODES, useUiModeStore } from '@/store/modules/uiMode';
import { menuConfig, bottomMenus, getMenuCatalogItemByPath } from '@/config/menuConfig';
import { usePermissionCatalogStore } from '@/store/modules/permissionCatalog';
import { buildAugmentedMenus, filterMenusByMenuCodes } from '@/utils/menuBuilder';
import { getNotifications, getUnreadCount, markAsRead as markRead } from '@/api/notification';
import { ElMessage } from 'element-plus';
import request from '@/api/request';
import dayjs from 'dayjs';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const uiModeStore = useUiModeStore();
const permissionCatalogStore = usePermissionCatalogStore();
const displayName = computed(() => userStore.realName || userStore.userInfo?.username || '');
const displayRole = computed(() => {
  return userStore.userInfo?.positionName
    || userStore.userInfo?.position_name
    || userStore.roleName
    || userStore.userInfo?.roleName
    || '';
});
const shouldUseTransition = computed(() => route.meta?.disableTransition !== true);
const displayUserLabel = computed(() => {
  const name = displayName.value;
  const role = displayRole.value;
  if (name && role) return `${name}_${role}`;
  return name || role || '';
});

const canUseSimpleMode = computed(() => userStore.roleCode === 'dev_test' || userStore.baseRoleCode === 'dev_test');

const switchUiMode = (mode) => {
  if (!canUseSimpleMode.value) return;
  uiModeStore.setMode(mode);
};

const isCollapse = ref(false);
const menuRef = ref(null);
const notificationDrawer = ref(false);
const notifications = ref([]);
const unreadCount = ref(0);
const routeKey = ref(0);
const menuNavigating = ref(false);
const defaultOpeneds = ref([]);
const badgeCounts = ref({});
const badgeLoading = ref(false);
const badgeTimer = ref(null);
const dateTimer = ref(null);
const sidebarScrollTop = ref(0);
const sidebarScrollEl = ref(null);
const todayText = ref(dayjs().format('YYYY年MM月DD日'));
const timeText = ref(dayjs().format('HH:mm'));

const updateDateTimeText = () => {
  todayText.value = dayjs().format('YYYY年MM月DD日');
  timeText.value = dayjs().format('HH:mm');
};

// 移动端响应式检测
const MOBILE_BREAKPOINT = 768;
const isMobile = ref(window.innerWidth <= MOBILE_BREAKPOINT);
const mobileMenuVisible = ref(false);

const checkMobile = () => {
  isMobile.value = window.innerWidth <= MOBILE_BREAKPOINT;
  // 切换到桌面端时自动关闭移动端菜单
  if (!isMobile.value) {
    mobileMenuVisible.value = false;
  }
};

const toggleMobileMenu = () => {
  mobileMenuVisible.value = !mobileMenuVisible.value;
};

const closeMobileMenu = () => {
  mobileMenuVisible.value = false;
};

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

// 当前场站
// 当前激活的菜单
const normalizeMenuPath = (path) => {
  if (typeof path !== 'string') return '';
  const text = path.trim();
  if (!text) return '';
  if (text === '/') return '/';
  return text.endsWith('/') ? text.slice(0, -1) : text;
};

const collectAllMenuPaths = (items) => {
  const list = Array.isArray(items) ? items : [];
  const paths = [];
  list.forEach(item => {
    if (!item) return;
    const path = normalizeMenuPath(item.path);
    if (path) paths.push(path);
    if (Array.isArray(item.children) && item.children.length > 0) {
      paths.push(...collectAllMenuPaths(item.children));
    }
  });
  return paths;
};

const resolveActiveMenuPath = (path) => {
  const current = normalizeMenuPath(path);
  if (!current) return route.path;

  const candidates = collectAllMenuPaths(menus.value);
  let best = '';
  candidates.forEach((candidate) => {
    if (!candidate) return;
    if (current === candidate || current.startsWith(`${candidate}/`)) {
      if (candidate.length > best.length) best = candidate;
    }
  });

  return best || route.path;
};

const activeMenu = computed(() => resolveActiveMenuPath(route.path));

// 根据角色获取菜单
const menuCodeFromPath = (path) => (path ? `menu:${path}` : null);

const filterMenusByPermissions = (items, allowedCodes) => {
  return (items || []).reduce((acc, item) => {
    const menuCode = menuCodeFromPath(item.path);
    const isAllowed = menuCode ? allowedCodes.has(menuCode) : false;
    let children = null;
    if (item.children?.length) {
      children = isAllowed ? item.children : filterMenusByPermissions(item.children, allowedCodes);
    }
    if (isAllowed || (children && children.length > 0)) {
      acc.push({ ...item, children: children || item.children });
    }
    return acc;
  }, []);
};

const menus = computed(() => {
  const roleCode = userStore.roleCode;
  const baseRoleCode = userStore.baseRoleCode || roleCode;
  const roleMenus = menuConfig[roleCode] || menuConfig[baseRoleCode] || menuConfig['operator'] || [];

  const allowedMenuCodes = userStore.menuCodes || [];
  const allowedSet = new Set(allowedMenuCodes);

  // Before the permission catalog is loaded, keep the legacy behavior to avoid UI flicker.
  // The catalog is only needed to distinguish "real" menu-permission nodes vs virtual child routes.
  if (!permissionCatalogStore.loaded) {
    const filteredMenus = allowedSet.size > 0
      ? filterMenusByPermissions(roleMenus, allowedSet)
      : roleMenus;
    return filteredMenus.filter(menu => {
      if (menu.requiresPriceAdmin) {
        return userStore.userInfo?.isPriceAdmin === 1;
      }
      return true;
    });
  }

  const augmented = buildAugmentedMenus({
    baseMenus: roleMenus,
    allowedMenuCodes,
    getCatalogItemByPath: getMenuCatalogItemByPath
  });

  const filteredMenus = filterMenusByMenuCodes({
    menus: augmented,
    allowedMenuCodes,
    isKnownMenuCode: permissionCatalogStore.hasMenuCode
  });

  return filteredMenus.filter(menu => {
    if (menu.requiresPriceAdmin) {
      return userStore.userInfo?.isPriceAdmin === 1;
    }
    return true;
  });
});

const collectParentMenuPaths = (items, targetPath) => {
  const list = Array.isArray(items) ? items : [];
  const parents = [];
  list.forEach(item => {
    if (!item || !Array.isArray(item.children) || item.children.length === 0) return;
    if (item.children.some(child => child && child.path === targetPath)) {
      if (item.path) parents.push(item.path);
      return;
    }
    const childParents = collectParentMenuPaths(item.children, targetPath);
    if (childParents.length > 0) {
      if (item.path) parents.push(item.path);
      parents.push(...childParents);
    }
  });
  return parents;
};

const collectGroupKeys = (items) => {
  const list = Array.isArray(items) ? items : [];
  const keys = [];
  list.forEach(item => {
    if (!item || !Array.isArray(item.children) || item.children.length === 0) return;
    if (item.path) keys.push(item.path);
    keys.push(...collectGroupKeys(item.children));
  });
  return keys;
};

const mergeOpenKeys = (existingKeys, nextKeys) => {
  const merged = Array.isArray(existingKeys) ? [...existingKeys] : [];
  nextKeys.forEach(key => {
    if (key && !merged.includes(key)) merged.push(key);
  });
  return merged;
};

const ensureActiveParentOpen = async (path) => {
  if (!path) return;
  const parentKeys = collectParentMenuPaths(menus.value, path);
  if (parentKeys.length === 0) return;
  const validKeys = new Set(collectGroupKeys(menus.value));
  const filteredParents = parentKeys.filter(key => validKeys.has(key));
  if (filteredParents.length === 0) return;
  const filteredExisting = (Array.isArray(defaultOpeneds.value) ? defaultOpeneds.value : []).filter(key => validKeys.has(key));
  defaultOpeneds.value = mergeOpenKeys(filteredExisting, filteredParents);
  await nextTick();
  filteredParents.forEach(key => {
    if (menuRef.value && typeof menuRef.value.open === 'function') {
      menuRef.value.open(key);
    }
  });
  bindSidebarScroll();
  restoreSidebarScroll();
};

const getSidebarMenuEl = () => {
  const refEl = menuRef.value;
  if (!refEl) return null;
  return refEl.$el || refEl.$?.el || null;
};

const handleSidebarScroll = (event) => {
  const target = event?.target;
  if (!target) return;
  sidebarScrollTop.value = target.scrollTop || 0;
};

const bindSidebarScroll = () => {
  const el = getSidebarMenuEl();
  if (!el) return;
  if (sidebarScrollEl.value === el) return;
  if (sidebarScrollEl.value) {
    sidebarScrollEl.value.removeEventListener('scroll', handleSidebarScroll);
  }
  sidebarScrollEl.value = el;
  el.addEventListener('scroll', handleSidebarScroll, { passive: true });
};

const restoreSidebarScroll = () => {
  const el = getSidebarMenuEl();
  if (!el) return;
  const target = sidebarScrollTop.value || 0;
  if (el.scrollTop !== target) {
    el.scrollTop = target;
  }
};

const normalizeBadgeValue = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return parsed;
};

const setBadgeCount = (path, value) => {
  if (!path) return;
  const next = {
    ...badgeCounts.value,
    [path]: normalizeBadgeValue(value)
  };
  badgeCounts.value = next;
};

const getPathBadgeCount = (path) => {
  const value = badgeCounts.value[path];
  return normalizeBadgeValue(value);
};

const getMenuBadgeCount = (menu) => {
  if (!menu) return 0;
  if (!Array.isArray(menu.children) || menu.children.length === 0) {
    return getPathBadgeCount(menu.path);
  }
  return menu.children.reduce((sum, child) => sum + getMenuBadgeCount(child), 0);
};

// 底部菜单
const bottomMenuItems = computed(() => bottomMenus);

// 处理菜单选择
const handleMenuSelect = async (path) => {
  const targetPath = normalizeMenuPath(path);
  if (!targetPath || !targetPath.startsWith('/')) return;

  // 移动端选择菜单后自动关闭侧边栏
  if (isMobile.value) {
    closeMobileMenu();
  }

  // 防止重复点击同一菜单导致页面空白（重复导航/过渡卸载窗口期）
  const currentMenuPath = normalizeMenuPath(activeMenu.value);
  const currentRoutePath = normalizeMenuPath(route.path);
  if (targetPath === currentMenuPath || targetPath === currentRoutePath || currentRoutePath.startsWith(`${targetPath}/`)) {
    pushRouteLog({ type: 'sidebar-select-skip', path: targetPath, reason: 'already-active' });
    return;
  }

  if (menuNavigating.value) {
    pushRouteLog({ type: 'sidebar-select-skip', path: targetPath, reason: 'navigating' });
    return;
  }

  menuNavigating.value = true;
  pushRouteLog({ type: 'sidebar-select', path: targetPath });

  try {
    await router.push(targetPath);
  } catch (err) {
    // 忽略重复导航错误
    if (err?.name !== 'NavigationDuplicated') {
      pushRouteLog({ type: 'sidebar-nav-error', message: String(err) });
    }
  } finally {
    menuNavigating.value = false;
  }
};

// 处理底部菜单点击
const handleBottomMenuClick = (menu) => {
  if (menu.isAction && menu.path === 'logout') {
    userStore.logout();
  } else if (menu.path && menu.path.startsWith('/')) {
    router.push(menu.path).catch(err => {
      // 忽略重复导航错误
      if (err.name !== 'NavigationDuplicated') {
        pushRouteLog({ type: 'bottom-menu-nav-error', message: String(err) });
      }
    });
  }
};

// 切换侧边栏折叠
const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value;
};

// 处理场站切换
// 显示通知
const showNotifications = async () => {
  notificationDrawer.value = true;
  await loadNotifications();
};

// 加载通知
const loadNotifications = async () => {
  try {
    const data = await getNotifications({ page: 1, pageSize: 10 });
    notifications.value = data.list || [];
  } catch {
    // 静默处理加载通知失败
  }
};

const parseScheduleData = (value) => {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
};

const resolveScheduleValue = (scheduleData, dateKey, dayKey) => {
  if (!scheduleData) return null;
  if (Object.prototype.hasOwnProperty.call(scheduleData, dateKey)) {
    return scheduleData[dateKey];
  }
  if (Object.prototype.hasOwnProperty.call(scheduleData, dayKey)) {
    return scheduleData[dayKey];
  }
  return null;
};

const hasScheduleForDate = (scheduleData, dateKey, dayKey) => {
  const value = resolveScheduleValue(scheduleData, dateKey, dayKey);
  if (!value) return false;
  return value !== '休';
};

const resolveTodaySchedules = async () => {
  const today = dayjs();
  const params = {
    year: today.year(),
    month: today.month() + 1,
    userId: userStore.userId
  };
  const res = await request.get('/schedules', { params });
  let list = [];
  if (Array.isArray(res?.schedules)) {
    list = res.schedules;
  } else if (Array.isArray(res?.list)) {
    list = res.list;
  } else if (Array.isArray(res)) {
    list = res;
  }
  const dateKey = today.format('YYYY-MM-DD');
  const dayKey = String(today.date());
  return list.filter(item => {
    const scheduleData = parseScheduleData(item?.schedules);
    return hasScheduleForDate(scheduleData, dateKey, dayKey);
  });
};

const resolveTotalCount = (value) => {
  if (value && Number.isFinite(value.total)) return value.total;
  if (value && Number.isFinite(value.count)) return value.count;
  if (value && Array.isArray(value.list)) return value.list.length;
  if (Array.isArray(value)) return value.length;
  return 0;
};

const loadSidebarBadges = async () => {
  if (!userStore.userId || badgeLoading.value) return;
  badgeLoading.value = true;
  const today = dayjs().format('YYYY-MM-DD');
  try {
    const roleCode = userStore.roleCode;

    let hazardCount = 0;
    try {
      const pendingRes = await request.get('/hazard-inspections', {
        params: { status: 'pending', page: 1, pageSize: 1 }
      });
      const rectifiedRes = await request.get('/hazard-inspections', {
        params: { status: 'rectified', page: 1, pageSize: 1 }
      });
      hazardCount = resolveTotalCount(pendingRes) + resolveTotalCount(rectifiedRes);
    } catch {
      hazardCount = 0;
    }
    setBadgeCount('/safety-rectification', hazardCount);

    const todaySchedules = await resolveTodaySchedules();
    const hasTodaySchedule = todaySchedules.length > 0;

    let safetyCount = 0;
    if (hasTodaySchedule) {
      const safetyRes = await request.get('/self-inspections/my', {
        params: { inspectionType: 'safety', startDate: today, endDate: today }
      });
      safetyCount = Array.isArray(safetyRes) && safetyRes.length > 0 ? 0 : 1;
    }
    setBadgeCount('/safety-self-inspection', safetyCount);

    let needsHygiene = false;
    if (hasTodaySchedule) {
      const keySet = new Set();
      todaySchedules.forEach(item => {
        let stationId = null;
        if (item && item.station_id !== undefined && item.station_id !== null) {
          stationId = item.station_id;
        } else if (item && item.stationId !== undefined && item.stationId !== null) {
          stationId = item.stationId;
        }
        let positionName = '';
        if (item && item.position_name !== undefined && item.position_name !== null) {
          positionName = item.position_name;
        } else if (item && item.positionName !== undefined && item.positionName !== null) {
          positionName = item.positionName;
        }
        if (!stationId || !positionName) return;
        keySet.add(`${stationId}::${positionName}`);
      });
      const queries = Array.from(keySet).map((key) => {
        const [stationIdText, positionName] = key.split('::');
        return request.get('/hygiene-position-areas/by-position', {
          params: { stationId: Number(stationIdText), positionName }
        });
      });
      if (queries.length > 0) {
        const results = await Promise.allSettled(queries);
        needsHygiene = results.some(result => {
          if (result.status !== 'fulfilled') return false;
          const data = result.value;
          return Array.isArray(data) && data.length > 0;
        });
      }
    }

    let hygieneCount = 0;
    if (needsHygiene) {
      const hygieneRes = await request.get('/self-inspections/my', {
        params: { inspectionType: 'hygiene', startDate: today, endDate: today }
      });
      hygieneCount = Array.isArray(hygieneRes) && hygieneRes.length > 0 ? 0 : 1;
    }
    setBadgeCount('/hygiene-self-inspection', hygieneCount);

    const workRes = await request.get('/position-work-logs/today-tasks', {
      params: { workDate: today }
    });
    let workList = [];
    if (Array.isArray(workRes?.list)) {
      workList = workRes.list;
    } else if (Array.isArray(workRes)) {
      workList = workRes;
    }
    const pendingWork = workList.filter(item => Number(item?.isCompleted) !== 1).length;
    setBadgeCount('/position-work', pendingWork);
    setBadgeCount('/position-work/field', pendingWork);

    const pendingTempRes = await request.get('/temporary-tasks', {
      params: { status: 'pending', executorId: userStore.userId, page: 1, pageSize: 1 }
    });
    const processingTempRes = await request.get('/temporary-tasks', {
      params: { status: 'in_progress', executorId: userStore.userId, page: 1, pageSize: 1 }
    });
    const tempCount = resolveTotalCount(pendingTempRes) + resolveTotalCount(processingTempRes);
      setBadgeCount('/temporary-tasks/fill', tempCount);

    const maintenanceRes = await request.get('/maintenance-work-records/today-tasks', {
      params: { workDate: today }
    });
    let maintenanceList = [];
    if (Array.isArray(maintenanceRes?.list)) {
      maintenanceList = maintenanceRes.list;
    } else if (Array.isArray(maintenanceRes)) {
      maintenanceList = maintenanceRes;
    }
    const pendingMaintenance = maintenanceList.filter(task => {
      let status = '';
      if (task?.existingRecord && task.existingRecord.status !== undefined && task.existingRecord.status !== null) {
        status = task.existingRecord.status;
      } else if (task && task.status !== undefined && task.status !== null) {
        status = task.status;
      }
      return !['completed', 'verified'].includes(status);
    }).length;
    setBadgeCount('/maintenance-task/work', pendingMaintenance);

    const managerRoles = new Set(['station_manager', 'department_manager', 'deputy_manager', 'senior_management', 'dev_test']);
    const maintenanceRoles = new Set(['maintenance']);
    const reporterRoles = new Set(['operator']);
    let faultStatus = '';
    if (managerRoles.has(roleCode)) {
      faultStatus = 'submitted_report,repaired_submitted';
    } else if (maintenanceRoles.has(roleCode)) {
      faultStatus = 'dispatched,repairing';
    } else if (reporterRoles.has(roleCode)) {
      faultStatus = 'submitted_report,dispatched,repairing';
    }
    let faultCount = 0;
    if (faultStatus) {
      const faultRes = await request.get('/repair-records', {
        params: { status: faultStatus, page: 1, pageSize: 1 }
      });
      faultCount = resolveTotalCount(faultRes);
    }
    setBadgeCount('/device-faults/records', faultCount);

    const notificationRes = await getUnreadCount();
    const notificationCount = resolveTotalCount(notificationRes);
    unreadCount.value = notificationCount;
    if (!userStore.hasRole('admin')) {
      setBadgeCount('/notifications', notificationCount);
    } else {
      setBadgeCount('/notifications', 0);
    }

    if (userStore.hasRole('admin')) {
      const feedbackRes = await request.get('/feedback/unread-count');
      const feedbackCount = resolveTotalCount(feedbackRes);
      setBadgeCount('/help-feedback', feedbackCount);
    } else {
      setBadgeCount('/help-feedback', 0);
    }
  } catch {
    // 静默处理统计失败
  } finally {
    badgeLoading.value = false;
  }
};

const getNotificationRoute = (notification) => {
  const type = notification.related_type || '';
  const routeMap = {
    hazard_inspection: '/safety-rectification',
    safety_rectification: '/safety-rectification',
    safety_other_inspection: '/safety-other-inspection',
    hygiene_other_inspection: '/hygiene-other-inspection',
    temporary_task: '/temporary-tasks/fill',
    repair_record: '/device-faults',
    fault_report: '/device-faults'
  };
  return routeMap[type] || '';
};

const handleNotificationClick = async (notification) => {
  await markAsRead(notification);
  const target = getNotificationRoute(notification);
  if (target) {
    notificationDrawer.value = false;
    router.push(target).catch(() => {});
  }
};

// 标记为已读
const markAsRead = async (notification) => {
  if (notification.is_read) return;
  try {
    await markRead(notification.id);
    notification.is_read = 1;
    unreadCount.value = Math.max(0, unreadCount.value - 1);
    if (!userStore.hasRole('admin')) {
      setBadgeCount('/notifications', unreadCount.value);
    }
    if (notification.related_type === 'feedback') {
      const current = getPathBadgeCount('/help-feedback');
      setBadgeCount('/help-feedback', Math.max(0, current - 1));
    }
  } catch {
    // 静默处理标记已读失败
  }
};

// 格式化时间
const formatTime = (time) => {
  return dayjs(time).format('MM-DD HH:mm');
};

// 处理下拉菜单命令
const handleCommand = (command) => {
  if (command === 'logout') {
    userStore.logout();
  } else if (command === 'changePassword') {
    router.push('/change-password');
  }
};

watch(canUseSimpleMode, (allowed) => {
  uiModeStore.ensureAllowed(allowed);
}, { immediate: true });

watch(() => uiModeStore.mode, (mode) => {
  document.documentElement.setAttribute('data-ui-mode', mode);
}, { immediate: true });

// Keep parent menus expanded on route change
watch([menus, () => route.path], () => {
  ensureActiveParentOpen(activeMenu.value);
}, { immediate: true });

// 监听路由变化，强制刷新组件
watch(() => route.path, async (newPath, oldPath) => {
  if (newPath !== oldPath) {
    // 路由变化时，强制刷新组件
    routeKey.value++;
    await nextTick();
    pushRouteLog({ type: 'route-change', to: newPath, from: oldPath });
    loadSidebarBadges();
    bindSidebarScroll();
    restoreSidebarScroll();
  }
}, { immediate: false });

// 错误捕获
onErrorCaptured((err, instance, info) => {
  pushRouteLog({ type: 'component-error', message: err?.message || String(err), info });
  console.error('component-error', err, info);
  ElMessage.error('页面加载失败，请刷新重试');
  return false; // 阻止错误继续传播
});

onMounted(() => {
  if (userStore.isLoggedIn) {
    permissionCatalogStore.ensureLoaded();
  }
  loadSidebarBadges();
  badgeTimer.value = setInterval(loadSidebarBadges, 60000);
  updateDateTimeText();
  dateTimer.value = setInterval(updateDateTimeText, 60000);
  // 添加窗口尺寸监听
  window.addEventListener('resize', checkMobile);
  window.addEventListener('sidebar-badge-refresh', loadSidebarBadges);
  nextTick(() => {
    bindSidebarScroll();
    restoreSidebarScroll();
  });
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile);
  window.removeEventListener('sidebar-badge-refresh', loadSidebarBadges);
  if (badgeTimer.value) {
    clearInterval(badgeTimer.value);
    badgeTimer.value = null;
  }
  if (dateTimer.value) {
    clearInterval(dateTimer.value);
    dateTimer.value = null;
  }
  if (sidebarScrollEl.value) {
    sidebarScrollEl.value.removeEventListener('scroll', handleSidebarScroll);
    sidebarScrollEl.value = null;
  }
});
</script>

<style lang="scss" scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
  transition: width 0.3s;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .logo {
    height: 84px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 18px;
    font-weight: bold;
    white-space: nowrap;
    flex-shrink: 0;

    .logo-title {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .logo-date {
      margin-top: 2px;
      font-size: 16px;
      font-weight: 400;
      color: #d6dbe5;
    }

    .logo-time {
      margin-top: 2px;
      font-size: 16px;
      font-weight: 400;
      color: #c7cdd9;
    }

    img {
      width: 32px;
      height: 32px;
      margin-right: 8px;
    }
  }

  .sidebar-menu {
    flex: 1;
    overflow-y: auto;
    border-right: none;

    // Top-level menu items (parents) should be slightly larger and bold.
    :deep(> .el-menu-item),
    :deep(> .el-sub-menu > .el-sub-menu__title) {
      font-size: 15px;
      font-weight: 600;
    }

    :deep(.el-menu--inline) {
      background-color: #263445;
    }

    :deep(.el-menu--inline .el-menu-item) {
      background-color: transparent;
      border-left: 2px solid transparent;
      // Increase indentation for sub menu items by about 50% of the default.
      padding-left: 60px !important;
      // Sub menu items keep the base font size (parents are +1px above).
      font-size: 14px;
      font-weight: 400;
    }

    :deep(.el-menu--inline .el-menu-item:hover) {
      background-color: #2f4157;
      border-left-color: #409EFF;
    }

    :deep(.el-menu--inline .el-menu-item.is-active) {
      background-color: #223247;
      border-left-color: #409EFF;
    }
  }

  .el-menu {
    border-right: none;
  }

  .menu-title {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .menu-text {
    display: inline-block;
  }

  .menu-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 6px;
    border-radius: 999px;
    background-color: #F56C6C;
    color: #fff;
    font-size: 12px;
    line-height: 18px;
  }

  .bottom-menu {
    flex-shrink: 0;
    border-top: 1px solid #3d4a5a;

    .el-menu {
      border-right: none;
    }

    .el-menu-item {
      &:hover {
        background-color: #263445 !important;
      }
    }
  }
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  padding: 0 20px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .collapse-btn {
      font-size: 20px;
      cursor: pointer;
      color: #606266;

      &:hover {
        color: #409EFF;
      }
    }

    .ui-mode-switch {
      display: flex;
      align-items: center;
      gap: 8px;

      :deep(.el-button + .el-button) {
        margin-left: 0;
      }
    }

  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 20px;

    .notification-badge {
      cursor: pointer;
    }

    .header-icon {
      font-size: 20px;
      color: #606266;
      cursor: pointer;

      &:hover {
        color: #409EFF;
      }
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;

      .user-meta {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .user-name {
        color: #606266;
        font-size: 14px;
      }
    }
  }
}

.main-content {
  background-color: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
}

.notification-list {
  .notification-item {
    padding: 12px;
    border-bottom: 1px solid #eee;
    cursor: pointer;

    &.unread {
      background-color: #f0f9ff;
    }

    &:hover {
      background-color: #f5f5f5;
    }

    .notification-title {
      font-weight: bold;
      margin-bottom: 4px;
    }

    .notification-content {
      font-size: 13px;
      color: #666;
      margin-bottom: 4px;
    }

    .notification-time {
      font-size: 12px;
      color: #999;
    }
  }
}

.empty-notifications {
  text-align: center;
  color: #999;
  padding: 40px;
}

// 过渡动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// 过渡动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}


// 移动端适配
@media screen and (max-width: 768px) {
  .sidebar {
    position: fixed;
    z-index: 1000;
    height: 100%;
  }

  // 移动端侧边栏样式
  .mobile-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    z-index: 1001;
    transform: translateX(-100%);
    transition: transform 0.3s ease;

    &.mobile-visible {
      transform: translateX(0);
    }
  }

  // 主内容区移动端适配
  .main-content {
    padding: 12px;
  }

  // 隐藏桌面用户名
  .header-right .user-info .user-meta {
    display: none;
  }

  // 头部间距调整
  .header {
    padding: 0 12px;

    .header-right {
      gap: 12px;
    }
  }
}

// 移动端遮罩层
.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

// 汉堡菜单按钮
.hamburger-btn {
  font-size: 24px;
  cursor: pointer;
  color: #606266;
  padding: 10px;
  margin: -10px;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #409EFF;
  }
}
</style>
