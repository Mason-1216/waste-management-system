<template>
  <div class="notification-management-page">
    <div class="page-header">
      <h2>{{ pageTitle }}</h2>
      <div class="header-actions">
        <el-button
          type="primary"
          :disabled="totalUnreadCount <= 0"
          @click="handleClearAllUnread"
        >
          全部清除未读
        </el-button>
      </div>
    </div>

    <el-row :gutter="16">
      <el-col
        v-for="group in groups"
        :key="group.key"
        :xs="24"
        :sm="12"
        :lg="8"
      >
        <el-card class="notification-card" shadow="hover" v-loading="group.loading">
          <template #header>
            <div class="card-header">
              <div class="card-header-left">
                <span>{{ group.title }}</span>
                <el-tag size="small" :type="group.unreadCount > 0 ? 'danger' : 'info'">
                  {{ unreadText }} {{ group.unreadCount }}
                </el-tag>
              </div>
              <el-button
                link
                type="primary"
                size="small"
                :disabled="group.unreadCount <= 0"
                @click.stop="handleClearGroupUnread(group)"
              >
                清除未读
              </el-button>
            </div>
          </template>
          <div v-if="group.items.length === 0" class="empty-text">{{ emptyText }}</div>
          <div v-else class="card-list">
            <div
              v-for="item in group.items"
              :key="item.id"
              class="card-item"
              @click="handleNotificationClick(group, item)"
            >
              <div class="item-title">
                <span v-if="!item.is_read" class="dot"></span>
                <span>{{ item.title }}</span>
              </div>
              <div class="item-content">{{ item.content }}</div>
              <div class="item-time">{{ formatTime(item.created_at) }}</div>
            </div>
          </div>

          <div v-if="group.total > group.pageSize" class="card-pagination">
            <el-pagination
              small
              background
              layout="prev, pager, next"
              :current-page="group.page"
              :page-size="group.pageSize"
              :total="group.total"
              @current-change="(p) => handleGroupPageChange(group, p)"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import dayjs from 'dayjs';
import { ElMessageBox } from 'element-plus';
import {
  getNotifications,
  markAsRead as markRead,
  markAllAsRead,
  markByFilterAsRead
} from '@/api/notification';

const router = useRouter();

const pageTitle = '消息通知';
const unreadText = '未读';
const emptyText = '暂无消息';
const PAGE_SIZE = 2;

const categories = [
  { key: 'hazard', title: '安全隐患', relatedTypes: ['hazard_inspection', 'safety_rectification'] },
  { key: 'safetyOther', title: '安全他检', relatedTypes: ['safety_other_inspection'] },
  { key: 'hygieneOther', title: '卫生他检', relatedTypes: ['hygiene_other_inspection'] },
  { key: 'tempTask', title: '临时任务', relatedTypes: ['temporary_task'] },
  { key: 'deviceFault', title: '设备故障', relatedTypes: ['repair_record', 'fault_report'] },
  // inspection_overdue: 自检表超时提醒；task_pending: 每日待办提醒
  { key: 'systemReminder', title: '系统提醒', notifyTypes: ['inspection_overdue', 'task_pending'] }
];

const groups = ref(
  categories.map((category) => ({
    ...category,
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    unreadCount: 0,
    items: [],
    loading: false
  }))
);

const totalUnreadCount = computed(() => groups.value.reduce((sum, group) => sum + Number(group.unreadCount || 0), 0));

const formatTime = (time) => (time ? dayjs(time).format('MM-DD HH:mm') : '-');

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

const buildGroupQueryParams = (group, base) => {
  const params = { ...(base || {}) };
  if (Array.isArray(group.relatedTypes) && group.relatedTypes.length > 0) {
    params.relatedTypes = group.relatedTypes.join(',');
  }
  if (Array.isArray(group.notifyTypes) && group.notifyTypes.length > 0) {
    params.notifyTypes = group.notifyTypes.join(',');
  }
  return params;
};

const clearGroupItemsReadFlag = (group) => {
  group.items.forEach((item) => {
    item.is_read = 1;
  });
};

const loadGroupUnreadCount = async (group) => {
  try {
    const data = await getNotifications(buildGroupQueryParams(group, { page: 1, pageSize: 1, isRead: 0 }));
    group.unreadCount = data?.total ?? 0;
  } catch {
    group.unreadCount = 0;
  }
};

const loadGroupPage = async (group) => {
  group.loading = true;
  try {
    const data = await getNotifications(buildGroupQueryParams(group, { page: group.page, pageSize: group.pageSize }));
    group.items = data?.list ?? [];
    group.total = data?.total ?? 0;
  } catch {
    group.items = [];
    group.total = 0;
  } finally {
    group.loading = false;
  }
};

const handleGroupPageChange = async (group, page) => {
  if (typeof page === 'number') {
    group.page = page;
  }
  await loadGroupPage(group);
};

const handleClearAllUnread = async () => {
  if (totalUnreadCount.value <= 0) return;

  try {
    await ElMessageBox.confirm('确认清除全部未读？（仅标记已读，不会删除消息）', '提示', {
      type: 'warning',
      confirmButtonText: '确认',
      cancelButtonText: '取消'
    });
  } catch {
    return;
  }

  try {
    await markAllAsRead();
    groups.value.forEach((group) => {
      group.unreadCount = 0;
      clearGroupItemsReadFlag(group);
    });
  } finally {
    // Ensure data stays consistent (total/pagination might change in future).
    await loadAllGroups();
  }
};

const handleClearGroupUnread = async (group) => {
  if (!group || group.unreadCount <= 0) return;

  try {
    await ElMessageBox.confirm(`确认清除「${group.title}」模块未读？（仅标记已读，不会删除消息）`, '提示', {
      type: 'warning',
      confirmButtonText: '确认',
      cancelButtonText: '取消'
    });
  } catch {
    return;
  }

  group.loading = true;
  try {
    const params = buildGroupQueryParams(group, {});
    await markByFilterAsRead(params);
    group.unreadCount = 0;
    clearGroupItemsReadFlag(group);
  } finally {
    await Promise.all([loadGroupUnreadCount(group), loadGroupPage(group)]);
  }
};

const handleNotificationClick = async (group, notification) => {
  if (!notification.is_read) {
    try {
      await markRead(notification.id);
      notification.is_read = 1;
      group.unreadCount = Math.max((group.unreadCount || 0) - 1, 0);
    } catch {
      // ignore
    }
  }
  const target = getNotificationRoute(notification);
  if (target) {
    router.push(target).catch(() => {});
  }
};

const loadAllGroups = async () => {
  await Promise.all(groups.value.map(async (group) => {
    group.page = 1;
    await Promise.all([loadGroupUnreadCount(group), loadGroupPage(group)]);
  }));
};

onMounted(() => {
  loadAllGroups();
});
</script>

<style lang="scss" scoped>
.notification-management-page {
  padding: 20px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h2 {
      margin: 0;
      font-size: 20px;
      color: #303133;
    }
  }

  .notification-card {
    margin-bottom: 16px;

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: 600;
    }

    .card-header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .empty-text {
      text-align: center;
      color: #909399;
      padding: 16px 0;
    }

    .card-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .card-item {
      padding: 8px 0;
      border-bottom: 1px dashed #ebeef5;
      cursor: pointer;

      &:last-child {
        border-bottom: none;
      }
    }

    .card-pagination {
      display: flex;
      justify-content: flex-end;
      padding-top: 10px;
    }

    .item-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      color: #303133;
    }

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: #f56c6c;
      display: inline-block;
    }

    .item-content {
      margin: 6px 0;
      color: #606266;
      font-size: 13px;
      white-space: pre-line;
    }

    .item-time {
      font-size: 12px;
      color: #909399;
    }
  }
}
</style>
