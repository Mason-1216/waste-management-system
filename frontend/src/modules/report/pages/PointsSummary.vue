<template>
  <div class="points-module-page">
    <div class="page-header">
      <h2>{{ pageTitle }}</h2>
    </div>

    <router-view />
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const pageTitle = computed(() => {
  // 积分汇总子Tab页面统一显示"积分汇总"
  if (route.path?.startsWith('/points-summary/summary/')) {
    return '积分汇总';
  }
  // 应用小时积分子Tab页面统一显示"应用小时积分"（不随Tab切换）
  if (route.path?.startsWith('/points-summary/applied-hourly')) {
    return '应用小时积分';
  }
  // Prefer the deepest matched route meta title (child pages).
  for (let i = (route.matched?.length ?? 0) - 1; i >= 0; i -= 1) {
    const title = route.matched[i]?.meta?.title;
    if (typeof title === 'string' && title.trim()) return title.trim();
  }
  return '积分统计';
});

// Backward compatibility for previously shared/bookmarked URLs like:
// /points-summary?tab=summary|hourly|quarter
const redirectFromLegacyTab = () => {
  const tab = typeof route.query?.tab === 'string' ? route.query.tab.trim() : '';
  const mapping = {
    summary: '/points-summary/summary',
    hourly: '/points-summary/applied-hourly',
    quarter: '/points-summary/quarterly-award'
  };
  const targetPath = mapping[tab];
  if (!targetPath) return;
  if (route.path === targetPath) return;

  const nextQuery = { ...(route.query || {}) };
  delete nextQuery.tab;
  router.replace({ path: targetPath, query: nextQuery });
};

onMounted(() => redirectFromLegacyTab());
watch(() => route.query?.tab, () => redirectFromLegacyTab());
</script>

<style lang="scss" scoped>
.points-module-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

    h2 {
      margin: 0;
      font-size: 20px;
    }
  }
}
</style>
