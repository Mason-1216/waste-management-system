<template>
  <div class="notification-management-page">
    <div class="page-header">
      <h2>{{ pageTitle }}</h2>
      <el-button @click="loadNotifications" :loading="loading">{{ refreshText }}</el-button>
    </div>

    <el-row :gutter="16">
      <el-col
        v-for="group in groupedNotifications"
        :key="group.key"
        :xs="24"
        :sm="12"
        :lg="8"
      >
        <el-card class="notification-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>{{ group.title }}</span>
              <el-tag size="small" :type="group.unreadCount > 0 ? 'danger' : 'info'">
                {{ unreadText }} {{ group.unreadCount }}
              </el-tag>
            </div>
          </template>
          <div v-if="group.items.length === 0" class="empty-text">{{ emptyText }}</div>
          <div v-else class="card-list">
            <div
              v-for="item in group.items"
              :key="item.id"
              class="card-item"
              @click="handleNotificationClick(item)"
            >
              <div class="item-title">
                <span v-if="!item.is_read" class="dot"></span>
                <span>{{ item.title }}</span>
              </div>
              <div class="item-content">{{ item.content }}</div>
              <div class="item-time">{{ formatTime(item.created_at) }}</div>
            </div>
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
import { getNotifications, markAsRead as markRead } from '@/api/notification';

const router = useRouter();
const notifications = ref([]);
const loading = ref(false);

const pageTitle = '消息通知';
const refreshText = '刷新';
const unreadText = '未读';
const emptyText = '暂无消息';
const MAX_ITEMS = 10;

const categories = [
  { key: 'hazard', title: '安全隐患', types: ['hazard_inspection', 'safety_rectification'] },
  { key: 'safetyOther', title: '安全他检', types: ['safety_other_inspection'] },
  { key: 'hygieneOther', title: '卫生他检', types: ['hygiene_other_inspection'] },
  { key: 'tempTask', title: '临时任务', types: ['temporary_task'] },
  { key: 'deviceFault', title: '设备故障', types: ['repair_record', 'fault_report'] }
];

const groupedNotifications = computed(() => {
  return categories.map(category => {
    const items = notifications.value
      .filter(item => category.types.includes(item.related_type))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, MAX_ITEMS);
    const unreadCount = items.filter(item => item.is_read === 0).length;
    return { ...category, items, unreadCount };
  });
});

const formatTime = (time) => (time ? dayjs(time).format('MM-DD HH:mm') : '-');

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

const loadNotifications = async () => {
  loading.value = true;
  try {
    const data = await getNotifications({ page: 1, pageSize: 100 });
    notifications.value = data.list || [];
  } catch {
    notifications.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadNotifications();
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
