<template>
  <el-autocomplete
    v-model="innerValue"
    :fetch-suggestions="wrappedFetchSuggestions"
    v-bind="attrs"
    @select="handleSelect"
  >
    <template v-if="$slots.prefix" #prefix>
      <slot name="prefix" />
    </template>
    <template v-if="$slots.suffix" #suffix>
      <slot name="suffix" />
    </template>
    <template v-if="$slots.prepend" #prepend>
      <slot name="prepend" />
    </template>
    <template v-if="$slots.append" #append>
      <slot name="append" />
    </template>
    <template #default="{ item }">
      <div v-if="item?.__empty" class="filter-autocomplete-empty">
        暂无数据
      </div>
      <span v-else>{{ item?.value }}</span>
    </template>
  </el-autocomplete>
</template>

<script setup>
import { computed, nextTick, ref, useAttrs } from 'vue';

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  fetchSuggestions: {
    type: Function,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'select']);

const attrs = useAttrs();
const lastQueryString = ref('');

const innerValue = computed({
  get: () => props.modelValue ?? '',
  set: (value) => emit('update:modelValue', value)
});

const wrappedFetchSuggestions = (queryString, callback) => {
  lastQueryString.value = queryString ?? '';

  const safeCallback = (items) => {
    const normalized = Array.isArray(items) ? items : [];
    if (normalized.length === 0) {
      callback([{ value: '', __empty: true }]);
      return;
    }
    callback(normalized);
  };

  try {
    const result = props.fetchSuggestions(queryString, safeCallback);
    if (result && typeof result.then === 'function') {
      result.catch(() => safeCallback([]));
    }
  } catch {
    safeCallback([]);
  }
};

const handleSelect = async (item) => {
  if (item?.__empty) {
    // el-autocomplete 会将 input 变成选中的 value；这里把输入恢复成用户原本输入的内容。
    await nextTick();
    emit('update:modelValue', lastQueryString.value);
    return;
  }

  emit('select', item);
};
</script>

<style scoped>
.filter-autocomplete-empty {
  padding: 4px 12px;
  color: var(--el-text-color-secondary);
}
</style>
