<template>
  <div class="plc-records-page">
    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="实时监控" name="realtime">
        <PlcRealtimeMonitor />
      </el-tab-pane>
      <el-tab-pane label="配置管理" name="config">
        <PlcMonitorConfigView />
      </el-tab-pane>
      <el-tab-pane label="历史记录" name="history">
        <PlcHistoryView />
      </el-tab-pane>
      <el-tab-pane label="数据分类管理" name="category">
        <PlcCategoryManagement />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import PlcRealtimeMonitor from './PlcRealtimeMonitor.vue';
import PlcHistoryView from './PlcHistoryView.vue';
import PlcCategoryManagement from './PlcCategoryManagement.vue';
import PlcMonitorConfigView from './PlcMonitorConfigView.vue';

const activeTab = ref('realtime');
</script>

<style scoped lang="scss">
.plc-records-page {
  :deep(.el-tabs__content) {
    padding: 20px;
  }
}
</style>

