<template>
  <FormDialog
    v-model="visible"
    :title="title"
    :width="width"
    :close-on-click-modal="false"
    :confirm-loading="confirmLoading"
    :confirm-text="confirmText"
    cancel-text="取消"
    @confirm="$emit('confirm')"
  >
    <div class="import-preview__summary">
      <el-tag type="info" size="small">总数：{{ summary.total ?? rows.length }}</el-tag>
      <el-tag type="success" size="small">新增：{{ summary.create ?? 0 }}</el-tag>
      <el-tag type="success" size="small">更新：{{ summary.update ?? 0 }}</el-tag>
      <el-tag type="info" size="small">跳过：{{ summary.skip ?? 0 }}</el-tag>
      <el-tag type="danger" size="small">错误：{{ summary.error ?? 0 }}</el-tag>
      <span v-if="truncated" class="import-preview__truncated">
        预览仅展示前 {{ maxRows }} 行（剩余行仍会按预览规则导入）
      </span>
    </div>

    <el-table :data="rows" border max-height="420">
      <el-table-column prop="rowNum" label="行号" width="70" />
      <el-table-column label="动作" width="90">
        <template #default="{ row }">
          <el-tag v-if="row.action === 'create'" type="success" size="small">新增</el-tag>
          <el-tag v-else-if="row.action === 'update'" type="success" size="small">更新</el-tag>
          <el-tag v-else-if="row.action === 'skip'" type="info" size="small">跳过</el-tag>
          <el-tag v-else type="danger" size="small">错误</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="message" label="原因/说明" min-width="160" />

      <el-table-column
        v-for="col in columns"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :width="col.width"
        :min-width="col.minWidth"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <el-tooltip
            v-if="hasDiff(row, col)"
            placement="top"
            :content="formatDiff(row.diff[resolveDiffKey(col)])"
          >
            <span :class="getCellClass(row, col)">{{ formatCell(row, col) }}</span>
          </el-tooltip>
          <span v-else :class="getCellClass(row, col)">{{ formatCell(row, col) }}</span>
        </template>
      </el-table-column>
    </el-table>
  </FormDialog>
</template>

<script setup>
import { computed } from 'vue';
import FormDialog from '@/components/common/FormDialog.vue';

defineOptions({ inheritAttrs: false });

const emit = defineEmits(['update:modelValue', 'confirm']);

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '导入预览' },
  width: { type: [String, Number], default: '980px' },
  confirmText: { type: String, default: '确认导入' },
  confirmLoading: { type: Boolean, default: false },
  summary: { type: Object, default: () => ({}) },
  rows: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  truncated: { type: Boolean, default: false },
  maxRows: { type: Number, default: 0 }
});

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const resolveDiffKey = (col) => (typeof col?.diffKey === 'string' && col.diffKey ? col.diffKey : col.prop);

const hasDiff = (row, col) => {
  const key = resolveDiffKey(col);
  return !!(row?.diff && key && row.diff[key]);
};

const formatDiff = (diff) => {
  if (!diff) return '';
  const from = diff.from ?? '';
  const to = diff.to ?? '';
  const fromText = typeof from === 'string' ? from : JSON.stringify(from);
  const toText = typeof to === 'string' ? to : JSON.stringify(to);
  return `原值：${fromText} → 新值：${toText}`;
};

const formatCell = (row, col) => {
  if (typeof col.formatter === 'function') return col.formatter(row);
  const value = row?.[col.prop];
  if (value === null || value === undefined) return '';
  return String(value);
};

const getCellClass = (row, col) => {
  if (!row) return '';
  const key = resolveDiffKey(col);
  if (row.action === 'create' && key) return 'import-preview__cell--green';
  if (hasDiff(row, col)) return 'import-preview__cell--green';
  return '';
};
</script>

<style scoped>
.import-preview__summary {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.import-preview__truncated {
  color: #909399;
  font-size: 12px;
}

.import-preview__cell--green {
  color: #18a058;
  font-weight: 600;
}
</style>
