<template>
  <div class="applied-hourly-container">
    <el-tabs v-model="activeTab" type="card" @tab-click="handleTabClick">
      <el-tab-pane label="应用小时积分计算" name="calc" />
      <el-tab-pane label="应用小时积分历史记录" name="history" />
      <el-tab-pane label="工时导入" name="import" />
      <el-tab-pane label="可视化分析" name="visual" />
    </el-tabs>

    <router-view />
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const TAB_ROUTES = {
  calc: '/points-summary/applied-hourly/calc',
  history: '/points-summary/applied-hourly/history',
  import: '/points-summary/applied-hourly/import',
  visual: '/points-summary/applied-hourly/visual'
};

const resolveTabFromPath = (path) => {
  if (path?.includes('/calc')) return 'calc';
  if (path?.includes('/history')) return 'history';
  if (path?.includes('/import')) return 'import';
  if (path?.includes('/visual')) return 'visual';
  return 'calc';
};

const activeTab = computed({
  get: () => resolveTabFromPath(route.path),
  set: () => {}
});

const handleTabClick = (tab) => {
  const name = tab?.paneName ?? tab?.props?.name;
  const targetPath = TAB_ROUTES[name];
  if (targetPath && route.path !== targetPath) {
    router.push(targetPath);
  }
};

const ensureChildRoute = () => {
  const path = route.path;
  if (path === '/points-summary/applied-hourly' || path === '/points-summary/applied-hourly/') {
    router.replace('/points-summary/applied-hourly/calc');
  }
};

onMounted(() => ensureChildRoute());
watch(() => route.path, () => ensureChildRoute());
</script>

<style lang="scss" scoped>
.applied-hourly-container {
  :deep(.el-tabs__header) {
    margin-bottom: 20px;
  }

  :deep(.el-tabs__content) {
    padding: 0;
  }
}
</style>
