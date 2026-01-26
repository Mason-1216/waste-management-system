<template>
  <div class="chart-card">
    <h3>{{ title }}</h3>
    <slot />
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: ''
  }
});
</script>

<style lang="scss" scoped>
.chart-card {
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

  h3 {
    margin: 0 0 12px;
    font-size: 15px;
    color: #303133;
  }

  :deep(.chart-container) {
    height: 300px;
  }
}
</style>
