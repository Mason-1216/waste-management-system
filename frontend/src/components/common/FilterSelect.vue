<template>
  <el-select v-bind="mergedAttrs">
    <slot />
  </el-select>
</template>

<script setup>
import { computed, useAttrs } from 'vue';

const attrs = useAttrs();

const mergedAttrs = computed(() => ({
  noDataText: '暂无数据',
  noMatchText: '暂无数据',
  ...attrs
}));
</script>

