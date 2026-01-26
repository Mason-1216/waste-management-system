<template>
  <div class="home-page">
    <div class="welcome-section">
      <h2>欢迎回来，{{ userStore.realName }}</h2>
      <p>{{ currentDate }} {{ weekDay }}</p>
    </div>

    <!-- 待办事项统计 - 根据角色显示不同内容 -->
    <el-row v-if="visibleStats.length > 0" :gutter="20" class="stat-row">
      <el-col :xs="12" :sm="8" v-for="stat in visibleStats" :key="stat.key">
        <div class="stat-card" @click="goTo(stat.path)">
          <div class="stat-icon" :style="{ backgroundColor: stat.color }">
            <el-icon><component :is="stat.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats[stat.key] }}</div>
            <div class="stat-title">{{ stat.title }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

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
import { getNotifications, markAsRead as markRead } from '@/api/notification';
import { getPendingApprovals } from '@/api/approval';
import request from '@/api/request';
import { menuConfig } from '@/config/menuConfig';
import dayjs from 'dayjs';
import FormDialog from '@/components/system/FormDialog.vue';

const router = useRouter();
const userStore = useUserStore();

const stats = ref({
  inspectionCount: 0,
  safetyCheckCount: 0,
  hygieneCheckCount: 0,
  scheduleCount: 0,
  hazardCount: 0,
  approvalCount: 0,
  repairCount: 0,
  taskCount: 0,
  tempTaskCount: 0,
  dispatchCount: 0,
  verifyCount: 0,
  maintenanceCount: 0,
  reportCount: 0,
  userCount: 0,
  orgCount: 0
});

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
    temporary_task: '/temporary-tasks',
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

// 统计卡片配置 - 根据角色显示不同内容
const allStats = {
  inspection: { key: 'inspectionCount', title: '今日自检', icon: 'Brush', color: '#409EFF', path: '/hygiene-self-inspection' },
  safetyCheck: { key: 'safetyCheckCount', title: '安全检查', icon: 'Shield', color: '#409EFF', path: '/safety-self-inspection' },
  hygieneCheck: { key: 'hygieneCheckCount', title: '卫生检查', icon: 'Brush', color: '#67C23A', path: '/hygiene-self-inspection' },
  schedule: { key: 'scheduleCount', title: '排班表', icon: 'Calendar', color: '#909399', path: '/schedule' },
  task: { key: 'taskCount', title: '固定任务', icon: 'Briefcase', color: '#409EFF', path: '/position-work' },
  deviceFaults: { key: 'repairCount', title: '设备故障', icon: 'Warning', color: '#E6A23C', path: '/device-faults' },
  safetyRectification: { key: 'hazardCount', title: '安全隐患', icon: 'Warning', color: '#F56C6C', path: '/safety-rectification' },
  equipmentMaintenance: { key: 'maintenanceCount', title: '设备保养', icon: 'Tools', color: '#409EFF', path: '/maintenance-task/work' },
  reports: { key: 'reportCount', title: '数据报表', icon: 'DataAnalysis', color: '#67C23A', path: '/reports' },
  userManagement: { key: 'userCount', title: '用户管理', icon: 'User', color: '#409EFF', path: '/user-management' },
  organization: { key: 'orgCount', title: '组织架构', icon: 'OfficeBuilding', color: '#67C23A', path: '/organization-management' }
};

// 根据角色显示不同的统计卡片
const visibleStats = computed(() => {
  const role = userStore.roleCode;
  // 系统管理员：不显示统计卡片
  if (role === 'admin') {
    return [];
  }
  // 操作岗：今日自检、固定任务、排班表
  if (role === 'operator') {
    return [allStats.inspection, allStats.task, allStats.schedule];
  }
  // 维修岗：今日自检、设备故障
  if (role === 'maintenance') {
    return [allStats.inspection, allStats.deviceFaults];
  }
  // 站长：今日自检、岗位工作、设备故障
  if (role === 'station_manager') {
    return [allStats.inspection, allStats.task, allStats.deviceFaults];
  }
  // 部门经理/副经理：安全检查、卫生检查、排班表
  if (role === 'deputy_manager' || role === 'department_manager') {
    return [allStats.safetyCheck, allStats.hygieneCheck, allStats.schedule];
  }
  // 安全员：安全检查、卫生检查、安全隐患
  if (role === 'safety_inspector') {
    return [allStats.safetyCheck, allStats.hygieneCheck, allStats.safetyRectification];
  }
  // 高层：安全检查、卫生检查、排班表
  if (role === 'senior_management') {
    return [allStats.safetyCheck, allStats.hygieneCheck, allStats.schedule];
  }
  // 甲方：设备保养、数据报表
  if (role === 'client') {
    return [allStats.equipmentMaintenance, allStats.reports];
  }
  return [allStats.inspection];
});


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
  const roleMenus = menuConfig[roleCode] || menuConfig[baseRoleCode] || [];
  const allowedCodes = new Set(userStore.menuCodes || []);
  const filteredMenus = allowedCodes.size > 0
    ? filterMenusByPermissions(roleMenus, allowedCodes)
    : roleMenus;
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
    // 操作岗：排班表、安全自检、卫生自检、固定任务、设备故障
    operator: ['/schedule', '/safety-self-inspection', '/hygiene-self-inspection', '/position-work', '/device-faults'],
    // 维修岗：安全自检、设备故障
    maintenance: ['/safety-self-inspection', '/device-faults'],
    // 站长：排班表、安全自检、卫生自检、岗位工作、设备故障、安全隐患
    station_manager: ['/schedule', '/safety-self-inspection', '/hygiene-self-inspection', '/position-work', '/device-faults', '/safety-rectification'],
    // 部门经理/副经理：排班表、安全自检、卫生自检、岗位工作、设备故障、安全隐患
    deputy_manager: ['/schedule', '/safety-self-inspection', '/hygiene-self-inspection', '/position-work', '/device-faults', '/safety-rectification'],
    department_manager: ['/schedule', '/safety-self-inspection', '/hygiene-self-inspection', '/position-work', '/device-faults', '/safety-rectification'],
    // 安全员：安全自检、卫生自检、安全隐患
    safety_inspector: ['/safety-self-inspection', '/hygiene-self-inspection', '/safety-rectification'],
    // 系统管理员：用户管理、组织架构
    admin: ['/user-management', '/organization-management'],
    // 甲方：设备保养、数据报表
    client: ['/reports'],
    // 高层：排班表、安全自检、卫生自检、岗位工作、设备故障、安全隐患
    senior_management: ['/schedule', '/safety-self-inspection', '/hygiene-self-inspection', '/position-work', '/device-faults', '/safety-rectification']
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

const loadStats = async () => {
  try {
    const data = await getPendingApprovals();
    stats.value.approvalCount = data.total || 0;
    stats.value.repairCount = data.repairRecords || 0;
    stats.value.dispatchCount = data.pendingDispatch || 0;
    stats.value.verifyCount = data.pendingVerify || 0;
    stats.value.taskCount = data.taskCount || 0;
    stats.value.tempTaskCount = data.tempTaskCount || 0;

    const today = dayjs().format('YYYY-MM-DD');
    const stationId = userStore.currentStationId || userStore.stations?.[0]?.id || null;
    const paramsBase = {
      page: 1,
      pageSize: 10,
      fillerId: userStore.userId,
      startDate: today,
      endDate: today,
      stationId
    };

    const currentYear = dayjs().year();
    const currentMonth = dayjs().month() + 1;

    const results = await Promise.allSettled([
      request.get('/self-inspections', { params: { ...paramsBase, inspectionType: 'safety' } }),
      request.get('/self-inspections', { params: { ...paramsBase, inspectionType: 'hygiene' } }),
      request.get('/safety-work-types'),
      request.get('/schedules/my', { params: { year: currentYear, month: currentMonth } }),
      request.get('/safety-rectifications', { params: { page: 1, pageSize: 1 } })
    ]);

    const safetyRes = results[0].status === 'fulfilled' ? results[0].value : null;
    const hygieneRes = results[1].status === 'fulfilled' ? results[1].value : null;
    const workTypesRes = results[2].status === 'fulfilled' ? results[2].value : null;
    const scheduleRes = results[3].status === 'fulfilled' ? results[3].value : null;
    const hazardRes = results[4].status === 'fulfilled' ? results[4].value : null;

    const safetyList = safetyRes?.list || [];
    const hygieneList = hygieneRes?.list || [];
    const workTypes = workTypesRes || [];
    const defaultWorkTypeIds = workTypes
      .filter(wt => wt.is_default === 1 || wt.is_default === true)
      .map(wt => wt.id);

    const safetyCompleted = safetyList.some(item => {
      const workTypeIds = item.work_type_ids || item.workTypeIds || [];
      if (!Array.isArray(workTypeIds)) return false;
      if (defaultWorkTypeIds.length === 0) return true;
      return defaultWorkTypeIds.every(id => workTypeIds.includes(id));
    });

    const hygieneCompleted = hygieneList.length > 0;

    let remaining = 2;
    if (safetyCompleted) remaining -= 1;
    if (hygieneCompleted) remaining -= 1;
    stats.value.inspectionCount = Math.max(0, remaining);

    stats.value.safetyCheckCount = safetyCompleted ? 0 : 1;
    stats.value.hygieneCheckCount = hygieneCompleted ? 0 : 1;

    const scheduleMap = scheduleRes?.schedules ?? {};
    const todaySchedule = scheduleMap?.[today];
    const hasTodaySchedule = Array.isArray(todaySchedule)
      ? todaySchedule.length > 0
      : !!todaySchedule;
    stats.value.scheduleCount = hasTodaySchedule ? 1 : 0;

    stats.value.hazardCount = hazardRes?.total || 0;
  } catch {
    // 静默处理加载统计失败
  }
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
  loadStats();
  loadNotifications();
  loadQuickActions();
});

onActivated(() => {
  loadStats();
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

.stat-row {
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 24px;
  }

  .stat-info {
    .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: #303133;
    }

    .stat-title {
      font-size: 14px;
      color: #909399;
    }
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

@media screen and (max-width: 768px) {
  .stat-card {
    margin-bottom: 12px;
  }
}
</style>
