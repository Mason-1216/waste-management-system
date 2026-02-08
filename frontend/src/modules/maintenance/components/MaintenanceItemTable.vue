<template>
  <div class="list-block">
    <div class="list-actions">
      <el-button size="small" type="primary" :disabled="!editable" @click="handleAdd">
        {{ addLabel }}
      </el-button>
    </div>
    <div class="table-scroll">
      <el-table
        :data="items"
        border
        size="small"
        class="inner-table"
        :row-class-name="resolveRowClass"
      >
        <el-table-column label="名称">
          <template #default="{ row: item }">
            <el-input v-model="item.name" :disabled="!editable || item._locked" />
          </template>
        </el-table-column>
        <el-table-column label="型号">
          <template #default="{ row: item }">
            <el-input v-model="item.model" :disabled="!editable || item._locked" />
          </template>
        </el-table-column>
        <el-table-column label="规格">
          <template #default="{ row: item }">
            <el-input v-model="item.spec" :disabled="!editable || item._locked" />
          </template>
        </el-table-column>
        <el-table-column label="数量">
          <template #default="{ row: item }">
            <el-input-number v-model="item.quantity" :disabled="!editable || item._locked" :min="0" />
          </template>
        </el-table-column>
        <el-table-column v-if="showReason" label="更换原因">
          <template #default="{ row: item }">
            <el-input v-model="item.reason" :disabled="!editable || item._locked" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140">
          <template #default="{ $index, row: item }">
            <el-button
              v-if="!items[$index]?._locked"
              link
              type="primary"
              :disabled="!editable"
              @click="handleLock($index, item)"
            >
              保存
            </el-button>
            <el-button
              v-else
              link
              type="warning"
              :disabled="!editable"
              @click="handleUnlock($index, item)"
            >
              编辑
            </el-button>
            <el-button
              link
              type="danger"
              :disabled="!editable || items[$index]?._locked"
              @click="handleRemove($index, item)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  editable: {
    type: Boolean,
    default: true
  },
  showReason: {
    type: Boolean,
    default: false
  },
  addLabel: {
    type: String,
    default: '新增'
  },
  rowClassName: {
    type: Function,
    default: null
  }
});

const emit = defineEmits(['add', 'remove', 'lock', 'unlock']);

const resolveRowClass = (ctx) => {
  if (props.rowClassName) {
    return props.rowClassName(ctx);
  }
  return ctx?.row?._locked ? 'row-locked' : '';
};

const handleAdd = () => emit('add');
const handleRemove = (index, item) => emit('remove', index, item);
const handleLock = (index, item) => emit('lock', index, item);
const handleUnlock = (index, item) => emit('unlock', index, item);
</script>
