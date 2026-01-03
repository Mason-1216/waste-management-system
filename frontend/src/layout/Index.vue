<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="sidebar">
      <div class="logo">
        <img src="/logo.svg" alt="logo" v-if="!isCollapse" />
        <span>运行管理系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :unique-opened="true"
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
              <span>{{ menu.name }}</span>
            </template>
            <el-menu-item
              v-for="child in menu.children"
              :key="child.path"
              :index="child.path"
            >
              {{ child.name }}
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item v-else :index="menu.path">
            <el-icon><component :is="menu.icon" /></el-icon>
            <span>{{ menu.name }}</span>
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
            <span>{{ menu.name }}</span>
          </el-menu-item>
        </el-menu>
      </div>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="toggleCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>

          
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
              <span class="username">{{ displayName }}</span>
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
          <transition name="fade" mode="out-in">
            <component 
              :is="Component" 
              v-if="Component"
              :key="`${currentRoute.fullPath}-${routeKey}`"
            />
          </transition>
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
import { ref, computed, onMounted, onErrorCaptured, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/store/user';
import { menuConfig, bottomMenus } from '@/config/menuConfig';
import { getNotifications, getUnreadCount, markAsRead as markRead } from '@/api/notification';
import { ElMessage } from 'element-plus';
import dayjs from 'dayjs';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const displayName = computed(() => userStore.realName || userStore.userInfo?.username || '');

const isCollapse = ref(false);
const notificationDrawer = ref(false);
const notifications = ref([]);
const unreadCount = ref(0);
const routeKey = ref(0);
const SIDEBAR_RELOAD_KEY = 'wms:sidebar-reload-target';
const SIDEBAR_RELOAD_DONE = 'wms:sidebar-reload-done';
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
const activeMenu = computed(() => route.path);

// 根据角色获取菜单
const menuCodeFromPath = (path) => (path ? `menu:${path}` : null);

const filterMenusByPermissions = (items, allowedCodes) => {
  return (items || []).reduce((acc, item) => {
    const menuCode = menuCodeFromPath(item.path);
    let children = null;
    if (item.children?.length) {
      children = filterMenusByPermissions(item.children, allowedCodes);
    }
    const isAllowed = menuCode ? allowedCodes.has(menuCode) : false;
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
  const allowedCodes = new Set(userStore.menuCodes || []);
  const filteredMenus = allowedCodes.size > 0
    ? filterMenusByPermissions(roleMenus, allowedCodes)
    : roleMenus;
  return filteredMenus.filter(menu => {
    if (menu.requiresPriceAdmin) {
      return userStore.userInfo?.isPriceAdmin === 1;
    }
    return true;
  });
});

// 底部菜单
const bottomMenuItems = computed(() => bottomMenus);

// 处理菜单选择
const handleMenuSelect = async (path) => {
  if (path && path.startsWith('/')) {
    // 强制刷新路由 key，确保组件重新渲染
    routeKey.value++;
    sessionStorage.setItem(SIDEBAR_RELOAD_KEY, path);
    sessionStorage.removeItem(SIDEBAR_RELOAD_DONE);
    await nextTick();
    pushRouteLog({ type: 'sidebar-select', path });
    router.push(path).catch(err => {
      // 忽略重复导航错误
      if (err.name !== 'NavigationDuplicated') {
        console.error('路由导航错误:', err);
      }
    });
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
        console.error('路由导航错误:', err);
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

// 加载未读数量
const loadUnreadCount = async () => {
  try {
    const data = await getUnreadCount();
    unreadCount.value = data.count || 0;
  } catch {
    // 静默处理加载未读数失败
  }
};

const getNotificationRoute = (notification) => {
  const type = notification.related_type || '';
  const routeMap = {
    hazard_inspection: '/safety-rectification',
    safety_rectification: '/safety-rectification',
    safety_other_inspection: '/safety-other-inspection',
    hygiene_other_inspection: '/hygiene-other-inspection',
    temporary_task: '/temporary-tasks',
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

// 监听路由变化，强制刷新组件
watch(() => route.path, async (newPath, oldPath) => {
  if (newPath !== oldPath) {
    // 路由变化时，强制刷新组件
    routeKey.value++;
    await nextTick();
    pushRouteLog({ type: 'route-change', to: newPath, from: oldPath });
  }
}, { immediate: false });

// 错误捕获
onErrorCaptured((err, instance, info) => {
  console.error('组件错误:', err, info);
  pushRouteLog({ type: 'component-error', message: err?.message || String(err), info });
  ElMessage.error('页面加载失败，请刷新重试');
  return false; // 阻止错误继续传播
});

onMounted(() => {
  loadUnreadCount();
  setInterval(loadUnreadCount, 60000);
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
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 16px;
    font-weight: bold;
    white-space: nowrap;
    flex-shrink: 0;

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
  }

  .el-menu {
    border-right: none;
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

      .username {
        color: #606266;
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

}
</style>
