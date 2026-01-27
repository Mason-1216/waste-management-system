<template>
  <el-dialog
    v-model="dialogVisible"
    title="维修任务库"
    width="980px"
    append-to-body
    destroy-on-close
  >
    <div class="filter-bar">
      <el-input
        v-model="filters.taskCategory"
        placeholder="任务类别"
        clearable
        style="width: 160px"
        @keyup.enter="handleSearch"
      />
      <el-input
        v-model="filters.taskName"
        placeholder="任务名称"
        clearable
        style="width: 180px"
        @keyup.enter="handleSearch"
      />
      <el-button type="primary" @click="handleSearch">查询</el-button>
      <el-button @click="resetFilters">重置</el-button>
    </div>

    <el-table
      ref="tableRef"
      v-loading="loading"
      :data="tasks"
      border
      stripe
      row-key="id"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="task_name" label="任务名称" min-width="180" />
      <el-table-column prop="task_category" label="任务类别" width="140">
        <template #default="{ row }">
          {{ row.task_category ?? '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="score_method" label="给分方式" width="120">
        <template #default="{ row }">
          {{ row.score_method ?? '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="points" label="单位积分" width="110">
        <template #default="{ row }">
          {{ row.points ?? '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="quantity" label="数量" width="90">
        <template #default="{ row }">
          {{ row.quantity ?? 1 }}
        </template>
      </el-table-column>
      <el-table-column prop="points_rule" label="积分规则" min-width="160">
        <template #default="{ row }">
          <span class="cell-ellipsis" :title="row.points_rule ?? ''">
            {{ row.points_rule ?? '-' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="quantity_editable" label="数量是否可修改" width="140">
        <template #default="{ row }">
          <el-tag :type="Number(row.quantity_editable) === 1 ? 'success' : 'info'">
            {{ Number(row.quantity_editable) === 1 ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="points_editable" label="积分是否可修改" width="140">
        <template #default="{ row }">
          <el-tag :type="Number(row.points_editable) === 1 ? 'success' : 'info'">
            {{ Number(row.points_editable) === 1 ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @current-change="loadTasks"
        @size-change="handlePageSizeChange"
      />
    </div>

    <template #footer>
      <div class="dialog-footer">
        <span class="selected-count">已选 {{ selectedCount }} 项</span>
        <div class="footer-actions">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmSelection">添加所选</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import * as repairTaskLibraryApi from '@/api/repairTaskLibrary';

const props = defineProps({
  visible: { type: Boolean, default: false },
  selectedTasks: { type: Array, default: () => [] }
});

const emit = defineEmits(['update:visible', 'confirm']);

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
});

const tableRef = ref(null);
const tasks = ref([]);
const loading = ref(false);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
});
const filters = reactive({
  taskCategory: '',
  taskName: ''
});
const selectedMap = ref({});

const selectedCount = computed(() => Object.keys(selectedMap.value).length);

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

const buildQuery = () => {
  const query = {
    page: pagination.page,
    pageSize: pagination.pageSize
  };
  if (hasText(filters.taskCategory)) {
    query.taskCategory = filters.taskCategory.trim();
  }
  if (hasText(filters.taskName)) {
    query.taskName = filters.taskName.trim();
  }
  return query;
};

const applySelection = () => {
  if (!tableRef.value) return;
  const selectedIds = new Set(Object.keys(selectedMap.value).map((id) => Number(id)));
  tasks.value.forEach((row) => {
    if (selectedIds.has(Number(row.id))) {
      tableRef.value.toggleRowSelection(row, true);
    }
  });
};

const loadTasks = async () => {
  loading.value = true;
  try {
    const result = await repairTaskLibraryApi.getRepairTaskLibrary(buildQuery());
    tasks.value = result?.list ?? [];
    pagination.total = result?.total ?? 0;
    await nextTick();
    applySelection();
  } catch (error) {
    ElMessage.error('加载任务库失败');
  } finally {
    loading.value = false;
  }
};

const syncSelected = (list) => {
  const next = {};
  (list || []).forEach((item) => {
    const id = item?.task_id ?? item?.job_id ?? item?.id;
    if (id !== undefined && id !== null) {
      next[id] = item;
    }
  });
  selectedMap.value = next;
};

const handleSearch = () => {
  pagination.page = 1;
  loadTasks();
};

const resetFilters = () => {
  filters.taskCategory = '';
  filters.taskName = '';
  pagination.page = 1;
  loadTasks();
};

const handlePageSizeChange = (size) => {
  if (typeof size === 'number') {
    pagination.pageSize = size;
  }
  pagination.page = 1;
  loadTasks();
};

const handleSelectionChange = (rows) => {
  const currentIds = new Set(rows.map(row => row.id));
  tasks.value.forEach((row) => {
    const id = row?.id;
    if (id === undefined || id === null) return;
    if (selectedMap.value[id] && !currentIds.has(id)) {
      delete selectedMap.value[id];
    }
  });
  rows.forEach((row) => {
    if (row?.id !== undefined && row?.id !== null) {
      selectedMap.value[row.id] = row;
    }
  });
};

const resolvePointsEditable = (row) => {
  if (row?.points_editable !== undefined && row?.points_editable !== null) {
    return Number(row.points_editable) === 1;
  }
  return false;
};

const resolveQuantityEditable = (row) => {
  if (row?.quantity_editable !== undefined && row?.quantity_editable !== null) {
    return Number(row.quantity_editable) === 1;
  }
  return false;
};

const resolveQuantity = (row) => {
  if (row?.quantity !== undefined && row?.quantity !== null && row?.quantity !== '') {
    const parsed = Number.parseInt(row.quantity, 10);
    if (Number.isInteger(parsed)) return parsed;
  }
  return 1;
};

const buildRepairTask = (row) => ({
  task_id: row.id,
  task_name: row.task_name,
  task_category: row.task_category ?? '',
  score_method: row.score_method ?? '',
  points_rule: row.points_rule ?? '',
  points: row.points ?? 0,
  quantity: resolveQuantity(row),
  quantity_editable: resolveQuantityEditable(row) ? 1 : 0,
  points_editable: resolvePointsEditable(row) ? 1 : 0
});

const confirmSelection = () => {
  const items = Object.values(selectedMap.value)
    .filter(item => (item?.id !== undefined && item?.id !== null) || (item?.task_id !== undefined && item?.task_id !== null))
    .map(buildRepairTask);
  emit('confirm', items);
  dialogVisible.value = false;
};

watch(
  () => props.visible,
  (value) => {
    if (!value) return;
    pagination.page = 1;
    syncSelected(props.selectedTasks);
    loadTasks();
  }
);
</script>

<style lang="scss" scoped>
.filter-bar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.selected-count {
  color: #606266;
}

.footer-actions {
  display: flex;
  gap: 10px;
}

.cell-ellipsis {
  display: inline-block;
  max-width: 160px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  vertical-align: middle;
}
</style>
