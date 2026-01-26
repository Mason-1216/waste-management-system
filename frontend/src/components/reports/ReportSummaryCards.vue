<template>
  <div class="stats-grid">
    <div class="stat-card" v-for="item in items" :key="item.label">
      <div class="label">{{ item.label }}</div>
      <div class="value">{{ item.value }}</div>
      <div class="hint" v-if="item.hint">{{ item.hint }}</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  items: {
    type: Array,
    default: () => []
  }
});
</script>

<style lang="scss" scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 20px;

  .stat-card {
    background: #fff;
    padding: 16px;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);

    .label {
      color: #909399;
      font-size: 13px;
    }

    .value {
      font-size: 22px;
      font-weight: 600;
      margin-top: 6px;
      color: #303133;
    }

    .hint {
      margin-top: 4px;
      font-size: 12px;
      color: #67c23a;
    }
  }
}
</style>
