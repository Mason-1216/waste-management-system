<template>
  <div class="points-summary-tab-container">
    <el-tabs v-model="activeTab" type="card" @tab-click="handleTabClick">
      <el-tab-pane label="积分明细表" name="detail" />
      <el-tab-pane label="积分统计表" name="stats" />
      <el-tab-pane label="任务积分分析" name="visual" />
      <el-tab-pane label="周期性积分分析" name="cycle" />
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
  detail: '/points-summary/summary/detail',
  stats: '/points-summary/summary/stats',
  visual: '/points-summary/summary/visual',
  cycle: '/points-summary/summary/cycle'
};

const resolveTabFromPath = (path) => {
  if (path?.includes('/detail')) return 'detail';
  if (path?.includes('/stats')) return 'stats';
  if (path?.includes('/cycle')) return 'cycle';
  if (path?.includes('/visual')) return 'visual';
  return 'detail';
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
  if (path === '/points-summary/summary' || path === '/points-summary/summary/') {
    router.replace('/points-summary/summary/detail');
  }
};

onMounted(() => ensureChildRoute());
watch(() => route.path, () => ensureChildRoute());
</script>

<style lang="scss" scoped>
.points-summary-tab-container {
  :deep(.el-tabs__header) {
    margin-bottom: 20px;
  }

  :deep(.el-tabs__content) {
    padding: 0;
  }
}
</style>
