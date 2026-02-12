<template>
  <div class="quarterly-award-container">
    <el-tabs v-model="activeTab" type="card" @tab-click="handleTabClick">
      <el-tab-pane label="季度积分奖计算" name="calc" />
      <el-tab-pane label="历史数据" name="history" />
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
  calc: '/points-summary/quarterly-award/calc',
  history: '/points-summary/quarterly-award/history',
  visual: '/points-summary/quarterly-award/visual'
};

const resolveTabFromPath = (path) => {
  if (path?.includes('/calc')) return 'calc';
  if (path?.includes('/history')) return 'history';
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
  if (path === '/points-summary/quarterly-award' || path === '/points-summary/quarterly-award/') {
    router.replace('/points-summary/quarterly-award/calc');
  }
};

onMounted(() => ensureChildRoute());
watch(() => route.path, () => ensureChildRoute());
</script>

<style lang="scss" scoped>
.quarterly-award-container {
  :deep(.el-tabs__header) {
    margin-bottom: 20px;
  }

  :deep(.el-tabs__content) {
    padding: 0;
  }
}
</style>
