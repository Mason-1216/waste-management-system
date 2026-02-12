<template>
  <div class="simple-filter-bar">
    <div v-if="enabled" class="simple-filter-summary">
      <span class="summary-text">{{ displaySummaryText }}</span>
      <el-button link type="primary" @click="toggleExpanded">
        {{ expandedState ? '收起筛选' : '筛选' }}
      </el-button>
    </div>
    <div v-show="!enabled || expandedState" class="simple-filter-content">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  enabled: {
    type: Boolean,
    default: false
  },
  expanded: {
    type: Boolean,
    default: false
  },
  summaryText: {
    type: String,
    default: '当前筛选：全部'
  }
});

const emit = defineEmits(['update:expanded']);

const expandedState = computed({
  get: () => (props.enabled ? props.expanded : true),
  set: (value) => {
    emit('update:expanded', value);
  }
});

const displaySummaryText = computed(() => {
  const text = typeof props.summaryText === 'string' ? props.summaryText.trim() : '';
  return text || '当前筛选：全部';
});

const toggleExpanded = () => {
  if (!props.enabled) return;
  expandedState.value = !expandedState.value;
};
</script>

<style lang="scss" scoped>
.simple-filter-summary {
  margin-bottom: 12px;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  .summary-text {
    color: #606266;
    font-size: 14px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
