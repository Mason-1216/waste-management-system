<template>
  <div class="home-page">
    <div class="welcome-section">
      <h2>欢迎回来，{{ userStore.realName }}</h2>
      <p>{{ currentDate }} {{ weekDay }}</p>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-actions">
      <div class="section-header">
        <h3>快捷操作</h3>
        <el-button link type="primary" @click="openQuickActionDialog">管理</el-button>
      </div>
      <el-row :gutter="16">
        <el-col :xs="8" :sm="4" v-for="action in quickActions" :key="action.path">
          <div class="action-item" @click="goTo(action.path)">
            <el-icon :size="28"><component :is="action.icon" /></el-icon>
            <span>{{ action.name }}</span>
          </div>
        </el-col>
      </el-row>
      <el-empty v-if="quickActions.length === 0" description="暂无快捷操作" />
    </div>

    <div class="recent-notifications">
      <div class="section-header">
        <h3>最近通知</h3>
        <el-button link type="primary" @click="goTo('/notifications')">查看全部</el-button>
      </div>
      <el-empty v-if="notifications.length === 0" description="暂无通知" />
      <div v-else class="notification-list">
        <div
          v-for="n in notifications"
          :key="n.id"
          class="notification-item"
          @click="handleNotificationClick(n)"
        >
          <el-icon class="notification-icon"><Bell /></el-icon>
          <div class="notification-content">
            <div class="notification-title">{{ n.title }}</div>
            <div class="notification-time">{{ formatTime(n.created_at) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
    <FormDialog
      v-model="quickActionDialogVisible"
      title="快捷操作管理"
      width="640px"
      :show-confirm="false"
      :show-cancel="false"
    >
      <div class="quick-action-dialog">
        <el-checkbox-group v-model="selectedQuickActionPaths">
          <el-row :gutter="12">
            <el-col :xs="12" :sm="8" v-for="action in allowedActions" :key="action.path">
              <el-checkbox :label="action.path">
                <el-icon><component :is="action.icon" /></el-icon>
                <span>{{ action.name }}</span>
              </el-checkbox>
            </el-col>
          </el-row>
        </el-checkbox-group>
      </div>
      <template #footer>
        <el-button @click="resetQuickActions">恢复默认</el-button>
        <el-button @click="quickActionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveQuickActions">保存</el-button>
      </template>
    </FormDialog>

</template>

<script setup>
import { ref, computed, onMounted, onActivated, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/modules/user';
import { usePermissionCatalogStore } from '@/store/modules/permissionCatalog';
import { getNotifications, markAsRead as markRead } from '@/api/notification';
import { menuConfig, getMenuCatalogItemByPath } from '@/config/menuConfig';
import { buildAugmentedMenus, filterMenusByMenuCodes } from '@/utils/menuBuilder';
import dayjs from 'dayjs';
import FormDialog from '@/components/system/FormDialog.vue';

const router = useRouter();
const userStore = useUserStore();
const permissionCatalogStore = usePermissionCatalogStore();

const notifications = ref([]);

const currentDate = computed(() => dayjs().format('YYYY年M月D日'));
const weekDay = computed(() => {
  const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  return days[dayjs().day()];
});

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
  if (!notification.is_read) {
    try {
      await markRead(notification.id);
      notification.is_read = 1;
    } catch {
      // ignore
    }
  }
  const target = getNotificationRoute(notification);
  if (target) {
    router.push(target).catch(() => {});
  }
};

// 快捷操作
const quickActionDialogVisible = ref(false);
const selectedQuickActionPaths = ref([]);

const buildAllowedActions = (items, parentIcon = 'Menu') => {
  const result = [];
  (items || []).forEach(item => {
    if (item.requiresPriceAdmin && !userStore.isPriceAdmin) {
      return;
    }
    if (item.children && item.children.length > 0) {
      result.push(...buildAllowedActions(item.children, item.icon || parentIcon));
      return;
    }
    if (!item.path || item.path === '/home' || item.isAction) {
      return;
    }
    result.push({
      path: item.path,
      name: item.name,
      icon: item.icon || parentIcon || 'Menu'
    });
  });
  return result;
};

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

const allowedActions = computed(() => {
  const roleCode = userStore.roleCode;
  const baseRoleCode = userStore.baseRoleCode || roleCode;
  const roleMenus = menuConfig[roleCode] || menuConfig[baseRoleCode] || menuConfig['operator'] || [];
  const allowedMenuCodes = userStore.menuCodes || [];
  const allowedSet = new Set(allowedMenuCodes);

  // Keep legacy logic until the global permission catalog is loaded.
  const filteredMenus = permissionCatalogStore.loaded
    ? filterMenusByMenuCodes({
      menus: buildAugmentedMenus({
        baseMenus: roleMenus,
        allowedMenuCodes,
        getCatalogItemByPath: getMenuCatalogItemByPath
      }),
      allowedMenuCodes,
      isKnownMenuCode: permissionCatalogStore.hasMenuCode
    })
    : (allowedSet.size > 0 ? filterMenusByPermissions(roleMenus, allowedSet) : roleMenus);

  const list = buildAllowedActions(filteredMenus);
  const actionMap = new Map();
  list.forEach(action => {
    if (!actionMap.has(action.path)) {
      actionMap.set(action.path, action);
    }
  });
  return Array.from(actionMap.values());
});

const allowedActionMap = computed(() => {
  const map = new Map();
  allowedActions.value.forEach(action => {
    map.set(action.path, action);
  });
  return map;
});

const defaultQuickActionPaths = computed(() => {
  const roleDefaults = {
    // 操作岗：排班表、安全自检、卫生自检、固定任务填报、设备故障
    operator: ['/schedule/my', '/safety-self-inspection', '/hygiene-self-inspection', '/position-work', '/device-faults'],
    // 维修岗：安全自检、设备故障
    maintenance: ['/safety-self-inspection', '/device-faults'],
    // 站长：排班表、安全自检、卫生自检、岗位工作、设备故障、安全隐患
    station_manager: ['/schedule/my', '/safety-self-inspection', '/hygiene-self-inspection', '/position-work', '/device-faults', '/safety-rectification'],
    // 部门经理/副经理：排班表、安全自检、卫生自检、岗位工作、设备故障、安全隐患
    deputy_manager: ['/schedule/my', '/safety-self-inspection', '/hygiene-self-inspection', '/position-work', '/device-faults', '/safety-rectification'],
    department_manager: ['/schedule/my', '/safety-self-inspection', '/hygiene-self-inspection', '/position-work', '/device-faults', '/safety-rectification'],
    // 安全员：安全自检、卫生自检、安全隐患
    safety_inspector: ['/safety-self-inspection', '/hygiene-self-inspection', '/safety-rectification'],
    // 系统管理员：用户管理、组织架构
    admin: ['/user-management', '/organization-management'],
    // 甲方：设备保养、数据报表
    client: ['/reports'],
    // 高层：排班表、安全自检、卫生自检、岗位工作、设备故障、安全隐患
    senior_management: ['/schedule/my', '/safety-self-inspection', '/hygiene-self-inspection', '/position-work', '/device-faults', '/safety-rectification']
  };
  const roleKey = roleDefaults[userStore.roleCode]
    ? userStore.roleCode
    : (userStore.baseRoleCode || userStore.roleCode);
  const defaults = roleDefaults[roleKey] || ['/safety-self-inspection', '/hygiene-self-inspection'];
  const allowedSet = new Set(allowedActions.value.map(action => action.path));
  const filteredDefaults = defaults.filter(path => allowedSet.has(path));
  if (filteredDefaults.length > 0) {
    return filteredDefaults;
  }
  return allowedActions.value.slice(0, 6).map(action => action.path);
});

const getQuickActionStorageKey = () => {
  const userKey = userStore.userId || userStore.roleCode || 'guest';
  return `quick-actions-${userKey}`;
};

const loadQuickActions = () => {
  const key = getQuickActionStorageKey();
  const raw = localStorage.getItem(key);
  if (!raw) {
    selectedQuickActionPaths.value = [];
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    const allowedSet = new Set(allowedActions.value.map(action => action.path));
    selectedQuickActionPaths.value = Array.isArray(parsed)
      ? parsed.filter(path => allowedSet.has(path))
      : [];
  } catch {
    selectedQuickActionPaths.value = [];
  }
};

const quickActions = computed(() => {
  const selected = selectedQuickActionPaths.value.length > 0
    ? selectedQuickActionPaths.value
    : defaultQuickActionPaths.value;
  return selected.map(path => allowedActionMap.value.get(path)).filter(Boolean);
});

const openQuickActionDialog = () => {
  if (selectedQuickActionPaths.value.length === 0) {
    selectedQuickActionPaths.value = [...defaultQuickActionPaths.value];
  }
  quickActionDialogVisible.value = true;
};

const saveQuickActions = () => {
  const allowedSet = new Set(allowedActions.value.map(action => action.path));
  const sanitized = selectedQuickActionPaths.value.filter(path => allowedSet.has(path));
  localStorage.setItem(getQuickActionStorageKey(), JSON.stringify(sanitized));
  selectedQuickActionPaths.value = sanitized;
  quickActionDialogVisible.value = false;
};

const resetQuickActions = () => {
  selectedQuickActionPaths.value = [...defaultQuickActionPaths.value];
};

const goTo = (path) => {
  router.push(path);
};

const formatTime = (time) => {
  return dayjs(time).format('MM-DD HH:mm');
};

const loadNotifications = async () => {
  try {
    const data = await getNotifications({ page: 1, pageSize: 5 });
    notifications.value = data.list || [];
  } catch {
    // 静默处理加载通知失败
  }
};

onMounted(() => {
  if (userStore.isLoggedIn) {
    permissionCatalogStore.ensureLoaded();
  }
  loadNotifications();
  loadQuickActions();
});

onActivated(() => {
  loadNotifications();
  loadQuickActions();
});

watch(
  () => [userStore.userId, userStore.roleCode],
  () => {
    loadQuickActions();
  }
);
</script>

<style lang="scss" scoped>
.home-page {
  padding: 20px;
}

.welcome-section {
  margin-bottom: 24px;

  h2 {
    margin: 0 0 8px;
    font-size: 24px;
    color: #303133;
  }

  p {
    margin: 0;
    color: #909399;
  }
}


.quick-actions {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h3 {
      margin: 0;
      font-size: 16px;
      color: #303133;
    }
  }

  .action-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px 8px;
    cursor: pointer;
    border-radius: 8px;
    transition: background-color 0.2s;

    &:hover {
      background-color: #f5f7fa;
    }

    .el-icon {
      color: #409EFF;
      margin-bottom: 8px;
    }

    span {
      font-size: 12px;
      color: #606266;
      text-align: center;
    }
  }
}

.quick-action-dialog {
  max-height: 360px;
  overflow: auto;
}

.recent-notifications {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h3 {
      margin: 0;
      font-size: 16px;
      color: #303133;
    }
  }

  .notification-list {
    .notification-item {
      display: flex;
      align-items: flex-start;
      padding: 12px 0;
      border-bottom: 1px solid #eee;

      &:last-child {
        border-bottom: none;
      }

      .notification-icon {
        color: #409EFF;
        margin-right: 12px;
        margin-top: 2px;
      }

      .notification-content {
        flex: 1;

        .notification-title {
          font-size: 14px;
          color: #303133;
          margin-bottom: 4px;
        }

        .notification-time {
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }
}

</style>
