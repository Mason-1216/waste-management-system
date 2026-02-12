<template>
  <div class="repair-task-library">
    <div class="page-header">
      <h2>维修任务汇总表</h2>
      <div class="header-actions">
        <el-button v-if="isSimpleMode" @click="simpleShowTable = !simpleShowTable">
          {{ simpleShowTable ? '切换卡片' : '切换表格' }}
        </el-button>
        <el-button type="primary" :loading="exporting" @click="handleExport">
          <el-icon><Upload /></el-icon>
          批量导出
        </el-button>
        <template v-if="canManage">
          <el-button type="primary" @click="openDialog()">
            <el-icon><Plus /></el-icon>
            新增任务
          </el-button>
          <el-button type="success" :loading="importPreviewLoading" @click="triggerImport">
            <el-icon><Download /></el-icon>
            批量导入
          </el-button>
          <el-button type="info" @click="downloadTemplate">
            <el-icon><Download /></el-icon>
            下载模板
          </el-button>
          <el-button
            v-if="selectedRows.length > 0"
            type="danger"
            @click="batchDeleteTasks"
          >
            <el-icon><Delete /></el-icon>
            批量删除 ({{ selectedRows.length }})
          </el-button>
        </template>
      </div>
    </div>

    <input
      ref="importFileInputRef"
      type="file"
      accept=".xlsx,.xls"
      style="display: none"
      @change="handleImportFileSelected"
    />

    <ImportPreviewDialog
      v-model="importPreviewVisible"
      title="维修任务汇总表 - 导入预览"
      :rows="importPreviewRows"
      :summary="importPreviewSummary"
      :truncated="importPreviewTruncated"
      :max-rows="importPreviewMaxRows"
      :confirm-loading="importSubmitting"
      :columns="importPreviewColumns"
      @confirm="confirmImport"
    />

    <SimpleFilterBar
      :enabled="isSimpleMode"
      v-model:expanded="simpleFilterExpanded"
      :summary-text="simpleFilterSummary"
    >
      <el-card class="filter-card">
        <FilterBar>
          <div class="filter-item">
            <span class="filter-label">任务名称</span>
            <FilterAutocomplete
              v-model="filters.taskName"
              :fetch-suggestions="fetchTaskNameSuggestions"
              trigger-on-focus
              placeholder="全部"
              clearable
              style="width: 180px"
              @select="handleSearch"
              @input="handleSearch"
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            />
          </div>
          <div class="filter-item">
            <span class="filter-label">任务类别</span>
            <FilterSelect
              v-model="filters.taskCategory"
              placeholder="全部"
              clearable
              style="width: 160px"
              @change="handleSearch"
              @clear="handleSearch"
            >
              <el-option v-for="option in taskCategoryOptions" :key="option.value" :label="option.label" :value="option.value" />
            </FilterSelect>
          </div>
          <div class="filter-item">
            <span class="filter-label">给分方式</span>
            <FilterSelect
              v-model="filters.scoreMethod"
              placeholder="全部"
              clearable
              filterable
              style="width: 160px"
              @change="handleSearch"
              @clear="handleSearch"
            >
              <el-option label="全部" value="all" />
              <el-option v-for="option in scoreMethodOptions" :key="option" :label="option" :value="option" />
            </FilterSelect>
          </div>
          <div class="filter-item">
            <span class="filter-label">积分可修改</span>
            <FilterSelect
              v-model="filters.pointsEditable"
              placeholder="全部"
              clearable
              filterable
              style="width: 160px"
              @change="handleSearch"
              @clear="handleSearch"
            >
              <el-option label="全部" value="all" />
              <el-option label="是" :value="1" />
              <el-option label="否" :value="0" />
            </FilterSelect>
          </div>
          <div class="filter-item">
            <span class="filter-label">数量可修改</span>
            <FilterSelect
              v-model="filters.quantityEditable"
              placeholder="全部"
              clearable
              filterable
              style="width: 160px"
              @change="handleSearch"
              @clear="handleSearch"
            >
              <el-option label="全部" value="all" />
              <el-option label="是" :value="1" />
              <el-option label="否" :value="0" />
            </FilterSelect>
          </div>
        </FilterBar>
      </el-card>
    </SimpleFilterBar>

    <el-table
      v-if="!isSimpleMode || simpleShowTable"
      ref="tableRef"
      v-loading="loading"
      :data="tasks"
      border
      stripe
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column v-if="canManage" type="selection" width="55" />
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
      <el-table-column prop="points_rule" label="积分规则" min-width="180">
        <template #default="{ row }">
          <span class="cell-ellipsis" :title="row.points_rule ?? ''">
            {{ row.points_rule ?? '-' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="quantity_editable" label="填报时数量是否可修改" width="160">
        <template #default="{ row }">
          <el-tag :type="Number(row.quantity_editable) === 1 ? 'success' : 'info'">
            {{ Number(row.quantity_editable) === 1 ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="points_editable" label="填报时积分是否可修改" width="160">
        <template #default="{ row }">
          <el-tag :type="Number(row.points_editable) === 1 ? 'success' : 'info'">
            {{ Number(row.points_editable) === 1 ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column v-if="canManage" label="操作" width="140">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-button link type="danger" @click="deleteTask(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div v-else class="simple-card-list" v-loading="loading">
      <el-empty v-if="tasks.length === 0" description="暂无任务数据" />
      <el-card v-for="row in tasks" :key="row.id" class="simple-task-card">
        <div class="card-header">
          <div class="header-left">
            <el-checkbox
              v-if="canManage"
              :model-value="isSimpleSelected(row.id)"
              @change="(checked) => handleSimpleSelectionChange(row, checked)"
            />
            <div class="title-group">
              <div class="title">{{ row.task_name || '-' }}</div>
              <div class="subtitle">单位积分：{{ row.points ?? '-' }} | 数量：{{ row.quantity ?? 1 }}</div>
            </div>
          </div>
          <el-button link @click="toggleSimpleExpanded(row.id)">
            <el-icon :class="{ 'is-expanded': simpleExpandedRows[row.id] }"><ArrowDown /></el-icon>
          </el-button>
        </div>
        <div v-if="simpleExpandedRows[row.id]" class="card-body">
          <div class="meta-line">任务类别：{{ row.task_category || '-' }}</div>
          <div class="meta-line">给分方式：{{ row.score_method || '-' }}</div>
          <div class="meta-line">积分规则：{{ row.points_rule || '-' }}</div>
          <div class="meta-line">数量可修改：{{ Number(row.quantity_editable) === 1 ? "是" : "否" }}</div>
          <div class="meta-line">积分可修改：{{ Number(row.points_editable) === 1 ? "是" : "否" }}</div>
          <div class="card-actions" v-if="canManage">
            <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
            <el-button link type="danger" @click="deleteTask(row)">删除</el-button>
          </div>
        </div>
      </el-card>
    </div>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[5, 10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @current-change="loadTasks"
        @size-change="handlePageSizeChange"
      />
    </div>

    <FormDialog
      v-model="dialogVisible"
      :title="form.id ? '编辑任务' : '新增任务'"
      width="560px"
      :show-confirm="false"
      :show-cancel="false"
    >
      <el-form :model="form" label-width="120px">
        <el-form-item label="任务名称" required>
          <el-input v-model="form.taskName" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="任务类别">
          <el-select v-model="form.taskCategory" placeholder="请选择任务类别" style="width: 100%;">
            <el-option v-for="option in taskCategoryOptionsNoAll" :key="option.value" :label="option.label" :value="option.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="给分方式">
          <el-select v-model="form.scoreMethod" placeholder="请选择给分方式">
            <el-option v-for="option in scoreMethodOptions" :key="option" :label="option" :value="option" />
          </el-select>
        </el-form-item>
        <el-form-item label="单位积分" required>
          <el-input-number v-model="form.points" :step="1" />
        </el-form-item>
        <el-form-item label="数量" required>
          <el-input-number v-model="form.quantity" :min="1" :step="1" />
        </el-form-item>
        <el-form-item label="积分规则">
          <el-input v-model="form.pointsRule" type="textarea" :rows="3" maxlength="200" />
        </el-form-item>
        <el-form-item label="填报时数量是否可修改">
          <el-switch v-model="form.quantityEditable" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="填报时积分是否可修改">
          <el-switch v-model="form.pointsEditable" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveTask">保存</el-button>
      </template>
    </FormDialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Download, Upload, ArrowDown } from '@element-plus/icons-vue';
import { useRoute } from 'vue-router';

import FilterBar from '@/components/common/FilterBar.vue';
import ImportPreviewDialog from '@/components/common/ImportPreviewDialog.vue';
import SimpleFilterBar from '@/components/common/SimpleFilterBar.vue';
import FormDialog from '@/components/system/FormDialog.vue';
import { useUserStore } from '@/store/modules/user';
import { useUiModeStore } from '@/store/modules/uiMode';
import { createListSuggestionFetcher } from '@/utils/filterAutocomplete';
import {
  getRepairTaskLibrary,
  createRepairTask,
  updateRepairTask,
  deleteRepairTask,
  batchDeleteRepairTasks,
  downloadTemplate as downloadRepairTaskTemplate,
  importTasks,
  previewImportTasks
} from '@/api/repairTaskLibrary';
import { buildExportFileName, exportRowsToXlsx, fetchAllPaged } from '@/utils/tableExport';

const userStore = useUserStore();
const uiModeStore = useUiModeStore();
const route = useRoute();
const managerRoles = ['admin', 'department_manager', 'deputy_manager', 'senior_management'];
const canManage = computed(() => userStore.hasRole(managerRoles));

const tasks = ref([]);
const taskSuggestionList = ref([]);
const loading = ref(false);
const exporting = ref(false);
const tableRef = ref(null);
const selectedRows = ref([]);
const canUseSimpleMode = computed(() => userStore.roleCode === 'dev_test' || userStore.baseRoleCode === 'dev_test');
const isSimpleMode = computed(() => canUseSimpleMode.value && uiModeStore.isSimpleMode);
const simpleShowTable = ref(false);
const simpleFilterExpanded = ref(false);
const simpleExpandedRows = ref({});

const fetchTaskNameSuggestions = createListSuggestionFetcher(
  () => taskSuggestionList.value,
  (row) => row.task_name
);

const pagination = reactive({
  page: 1,
  pageSize: 5,
  total: 0
});
const filters = reactive({
  taskName: '',
  taskCategory: '',
  scoreMethod: 'all',
  pointsEditable: 'all',
  quantityEditable: 'all'
});

const simpleFilterSummary = computed(() => {
  const parts = [];
  if (filters.taskName) parts.push(`任务=${filters.taskName}`);
  if (filters.taskCategory) parts.push(`类别=${filters.taskCategory}`);
  if (filters.scoreMethod && filters.scoreMethod !== 'all') parts.push(`给分方式=${filters.scoreMethod}`);
  if (filters.pointsEditable !== 'all') parts.push(`积分可修改=${Number(filters.pointsEditable) === 1 ? '是' : '否'}`);
  if (filters.quantityEditable !== 'all') parts.push(`数量可修改=${Number(filters.quantityEditable) === 1 ? '是' : '否'}`);
  return parts.length > 0 ? parts.join(' | ') : '当前筛选：全部';
});

const scoreMethodOptions = ['奖扣结合式', '扣分项', '奖分项'];

const TASK_CATEGORY_OPTIONS = ['Ⅰ类', 'Ⅱ类', 'Ⅲ类', 'Ⅳ类'];
const normalizeTaskCategory = (value) => {
  const text = typeof value === 'string' ? value.trim() : '';
  return TASK_CATEGORY_OPTIONS.includes(text) ? text : 'Ⅰ类';
};
const taskCategoryOptions = TASK_CATEGORY_OPTIONS.map(v => ({ label: v, value: v }));
const taskCategoryOptionsNoAll = taskCategoryOptions;

const dialogVisible = ref(false);
const saving = ref(false);
const form = reactive({
  id: null,
  taskName: '',
  taskCategory: 'Ⅰ类',
  scoreMethod: '',
  points: null,
  quantity: 1,
  pointsRule: '',
  pointsEditable: 0,
  quantityEditable: 0
});

const importFileInputRef = ref(null);
const importPreviewLoading = ref(false);
const importSubmitting = ref(false);
const importFile = ref(null);
const importPreviewVisible = ref(false);
const importPreviewSummary = ref({});
const importPreviewRows = ref([]);
const importPreviewTruncated = ref(false);
const importPreviewMaxRows = ref(0);

const importPreviewColumns = computed(() => ([
  { prop: 'taskName', label: '任务名称', minWidth: 180 },
  { prop: 'taskCategory', label: '任务类别', width: 120 },
  { prop: 'scoreMethod', label: '给分方式', width: 120, diffKey: 'score_method' },
  { prop: 'points', label: '单位积分', width: 100, diffKey: 'points' },
  { prop: 'quantity', label: '数量', width: 90, diffKey: 'quantity' },
  { prop: 'pointsRule', label: '积分规则', minWidth: 160, diffKey: 'points_rule' },
  {
    prop: 'quantityEditable',
    label: '数量可修改',
    width: 110,
    diffKey: 'quantity_editable',
    formatter: (row) => (Number(row?.quantityEditable) === 1 ? '是' : '否')
  },
  {
    prop: 'pointsEditable',
    label: '积分可修改',
    width: 110,
    diffKey: 'points_editable',
    formatter: (row) => (Number(row?.pointsEditable) === 1 ? '是' : '否')
  }
]));

const resolveText = (value) => (typeof value === 'string' ? value.trim() : '');
const hasFilterValue = (value) => value !== undefined && value !== null && value !== '' && value !== 'all';
const resolveErrorMessage = (error, fallback = '操作失败') => {
  const responseMessage = typeof error?.response?.data?.message === 'string' ? error.response.data.message.trim() : '';
  if (responseMessage) return responseMessage;
  const message = typeof error?.message === 'string' ? error.message.trim() : '';
  return message || fallback;
};

const buildQuery = () => ({
  page: pagination.page,
  pageSize: pagination.pageSize,
  taskName: resolveText(filters.taskName) ? resolveText(filters.taskName) : undefined,
  taskCategory: resolveText(filters.taskCategory) ? resolveText(filters.taskCategory) : undefined,
  scoreMethod: filters.scoreMethod === 'all' ? undefined : (resolveText(filters.scoreMethod) || undefined),
  pointsEditable: hasFilterValue(filters.pointsEditable) ? filters.pointsEditable : undefined,
  quantityEditable: hasFilterValue(filters.quantityEditable) ? filters.quantityEditable : undefined
});

const buildQueryForPage = ({ page, pageSize }) => {
  const params = buildQuery();
  params.page = page;
  params.pageSize = pageSize;
  return params;
};

const resolvePageTitle = () => {
  if (typeof route?.meta?.title === 'string' && route.meta.title.trim()) {
    return route.meta.title.trim();
  }
  return '维修任务汇总表';
};

const resolveExportColumns = () => ([
  { label: '任务名称', prop: 'task_name' },
  { label: '任务类别', value: (row) => row?.task_category ?? '-' },
  { label: '给分方式', value: (row) => row?.score_method ?? '-' },
  { label: '单位积分', prop: 'points' },
  { label: '数量', prop: 'quantity' },
  { label: '积分规则', value: (row) => row?.points_rule ?? '-' },
  { label: '积分可修改', value: (row) => (Number(row?.points_editable) === 1 ? '是' : '否') },
  { label: '数量可修改', value: (row) => (Number(row?.quantity_editable) === 1 ? '是' : '否') }
]);

const clearSelection = () => {
  selectedRows.value = [];
  if (tableRef.value) {
    tableRef.value.clearSelection();
  }
};

const loadTasks = async () => {
  loading.value = true;
  try {
    const result = await getRepairTaskLibrary(buildQuery());
    tasks.value = result?.list ?? [];
    pagination.total = result?.total ?? 0;
    clearSelection();
    loadTaskSuggestions();
  } catch (error) {
    ElMessage.error('加载任务汇总表失败');
  } finally {
    loading.value = false;
  }
};

const loadTaskSuggestions = async () => {
  try {
    const result = await getRepairTaskLibrary({
      ...buildQuery(),
      page: 1,
      pageSize: 5000
    });
    taskSuggestionList.value = result?.list ?? [];
  } catch (error) {
    taskSuggestionList.value = [];
  }
};

const handleExport = async () => {
  if (exporting.value) return;
  exporting.value = true;
  try {
    const title = resolvePageTitle();
    const fileName = buildExportFileName({ title });

    const { rows } = await fetchAllPaged({
      fetchPage: ({ page, pageSize }) => getRepairTaskLibrary(buildQueryForPage({ page, pageSize })),
      pageSize: 5000
    });

    const list = Array.isArray(rows) ? rows : [];
    if (list.length === 0) {
      ElMessage.warning('没有可导出的数据');
      return;
    }

    await exportRowsToXlsx({
      title,
      fileName,
      sheetName: '维修任务汇总',
      columns: resolveExportColumns(),
      rows: list
    });
    ElMessage.success('导出成功');
  } catch (error) {
    const msg = typeof error?.message === 'string' && error.message.trim() ? error.message.trim() : '导出失败';
    ElMessage.error(msg);
  } finally {
    exporting.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  loadTasks();
};

const resetFilters = () => {
  filters.taskName = '';
  filters.taskCategory = '';
  filters.scoreMethod = 'all';
  filters.pointsEditable = 'all';
  filters.quantityEditable = 'all';
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
  selectedRows.value = Array.isArray(rows) ? rows : [];
};

const isSimpleSelected = (id) => selectedRows.value.some(row => row.id === id);

const handleSimpleSelectionChange = (task, checked) => {
  const list = Array.isArray(selectedRows.value) ? [...selectedRows.value] : [];
  const index = list.findIndex(item => item?.id === task?.id);
  if (checked && index === -1) {
    list.push(task);
  }
  if (!checked && index >= 0) {
    list.splice(index, 1);
  }
  selectedRows.value = list;
};

const toggleSimpleExpanded = (id) => {
  simpleExpandedRows.value = {
    ...simpleExpandedRows.value,
    [id]: !simpleExpandedRows.value[id]
  };
};

const openDialog = (row = null) => {
  if (row) {
    form.id = row.id;
    form.taskName = row.task_name ?? '';
    form.taskCategory = normalizeTaskCategory(row.task_category);
    form.scoreMethod = row.score_method ?? '';
    form.points = row.points ?? null;
    form.quantity = row.quantity ?? 1;
    form.pointsRule = row.points_rule ?? '';
    form.pointsEditable = row.points_editable ?? 0;
    form.quantityEditable = row.quantity_editable ?? 0;
  } else {
    form.id = null;
    form.taskName = '';
    form.taskCategory = 'Ⅰ类';
    form.scoreMethod = '';
    form.points = null;
    form.quantity = 1;
    form.pointsRule = '';
    form.pointsEditable = 0;
    form.quantityEditable = 0;
  }
  dialogVisible.value = true;
};

const batchDeleteTasks = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要删除的任务');
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${selectedRows.value.length} 条任务吗？`,
      '批量删除',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消'
      }
    );
  } catch {
    return;
  }

  const ids = selectedRows.value
    .map(row => row?.id)
    .filter(id => id !== undefined && id !== null);

  if (ids.length === 0) {
    return;
  }

  try {
    const result = await batchDeleteRepairTasks(ids);
    ElMessage.success(result?.message ?? `成功删除${ids.length}条任务`);
    await loadTasks();
  } catch (error) {
    ElMessage.error(error.message ?? '批量删除失败');
  }
};

const saveTask = async () => {
  const taskNameValue = resolveText(form.taskName);
  if (!taskNameValue) {
    ElMessage.warning('请输入任务名称');
    return;
  }
  if (form.points === null || form.points === undefined || form.points === '') {
    ElMessage.warning('请输入单位积分');
    return;
  }
  const quantityValue = Number.parseInt(form.quantity, 10);
  if (!Number.isInteger(quantityValue) || quantityValue < 1 || quantityValue > 1000) {
    ElMessage.warning('数量必须是 1-1000 的整数');
    return;
  }

  saving.value = true;
  try {
    const payload = {
      taskName: taskNameValue,
      taskCategory: resolveText(form.taskCategory),
      scoreMethod: form.scoreMethod,
      points: form.points,
      quantity: quantityValue,
      pointsRule: form.pointsRule,
      pointsEditable: form.pointsEditable,
      quantityEditable: form.quantityEditable
    };
    if (form.id) {
      await updateRepairTask(form.id, payload);
    } else {
      await createRepairTask(payload);
    }
    ElMessage.success('保存成功');
    dialogVisible.value = false;
    await loadTasks();
  } catch (error) {
    ElMessage.error(error.message ?? '保存失败');
  } finally {
    saving.value = false;
  }
};

const deleteTask = async (row) => {
  try {
    await ElMessageBox.confirm('确认删除该任务？删除后无法恢复', '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    });
  } catch {
    return;
  }

  try {
    await deleteRepairTask(row.id);
    ElMessage.success('删除成功');
    await loadTasks();
  } catch (error) {
    ElMessage.error(error.message ?? '删除失败');
  }
};

const triggerImport = () => {
  if (importPreviewLoading.value) return;
  if (!importFileInputRef.value) return;
  importFileInputRef.value.click();
};

const isExcelFile = (file) => {
  const mime = file?.type;
  return mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    || mime === 'application/vnd.ms-excel';
};

const handleImportFileSelected = async (event) => {
  const file = event?.target?.files?.[0];
  if (event?.target) event.target.value = '';
  if (!file) return;

  if (!isExcelFile(file)) {
    ElMessage.error('只能上传 Excel 文件');
    return;
  }
  if (file.size / 1024 / 1024 >= 5) {
    ElMessage.error('文件大小不能超过 5MB');
    return;
  }

  importFile.value = file;
  importPreviewLoading.value = true;
  try {
    const res = await previewImportTasks(file);
    importPreviewSummary.value = res?.summary ?? {};
    importPreviewRows.value = Array.isArray(res?.rows) ? res.rows : [];
    importPreviewTruncated.value = !!res?.truncated;
    importPreviewMaxRows.value = typeof res?.maxRows === 'number' ? res.maxRows : 0;
    importPreviewVisible.value = true;
  } finally {
    importPreviewLoading.value = false;
  }
};

const confirmImport = async () => {
  if (!importFile.value) {
    ElMessage.warning('请选择文件');
    return;
  }

  importSubmitting.value = true;
  try {
    const results = await importTasks(importFile.value);
    const list = Array.isArray(results) ? results : [];
    const created = list.filter((row) => row?.status === 'success').length;
    const updated = list.filter((row) => row?.status === 'updated').length;
    const skipped = list.filter((row) => row?.status === 'skip').length;
    const failed = list.filter((row) => row?.status === 'error').length;

    if (failed > 0) {
      ElMessage.warning(`导入完成：新增${created}条，更新${updated}条，跳过${skipped}条，失败${failed}条`);
    } else {
      ElMessage.success(`导入完成：新增${created}条，更新${updated}条，跳过${skipped}条`);
    }

    importPreviewVisible.value = false;
    importFile.value = null;
    await loadTasks();
  } catch (error) {
    ElMessage.error(resolveErrorMessage(error, '导入失败'));
  } finally {
    importSubmitting.value = false;
  }
};

const downloadTemplateFile = async () => {
  try {
    const response = await downloadRepairTaskTemplate();
    const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '维修任务模板.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    ElMessage.error('下载模板失败');
  }
};

const downloadTemplate = () => downloadTemplateFile();

watch(isSimpleMode, (enabled) => {
  if (enabled) return;
  simpleShowTable.value = false;
  simpleFilterExpanded.value = false;
  simpleExpandedRows.value = {};
});

onMounted(() => {
  loadTasks();
});
</script>

<style lang="scss" scoped>
.repair-task-library {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      margin: 0;
      font-size: 20px;
    }

    .header-actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }
  }

  .filter-card {
    margin-bottom: 20px;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }

  .simple-card-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .simple-task-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .title {
      font-size: 15px;
      font-weight: 600;
      color: #303133;
      word-break: break-all;
    }

    .subtitle {
      margin-top: 2px;
      color: #909399;
      font-size: 13px;
      word-break: break-all;
    }

    .card-body {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px dashed #ebeef5;
    }

    .meta-line {
      margin-top: 6px;
      color: #606266;
      font-size: 13px;
      line-height: 1.5;
      word-break: break-all;
    }

    .card-actions {
      margin-top: 8px;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
  }

  .is-expanded {
    transform: rotate(180deg);
  }

  .cell-ellipsis {
    display: inline-block;
    max-width: 160px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    vertical-align: middle;
  }
}
</style>

