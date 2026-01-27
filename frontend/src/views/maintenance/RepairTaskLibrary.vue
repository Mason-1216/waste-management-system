<template>
  <div class="repair-task-library">
    <div class="page-header">
      <h2>维修任务库</h2>
      <div class="header-actions" v-if="canManage">
        <el-button type="primary" @click="openDialog()">
          <el-icon><Plus /></el-icon>
          新增任务
        </el-button>
        <el-upload
          :action="`${apiBaseUrl}/repair-task-library/import`"
          :headers="uploadHeaders"
          :on-success="handleImportSuccess"
          :on-error="handleImportError"
          :show-file-list="false"
          accept=".xlsx,.xls"
          :before-upload="beforeUpload"
        >
          <el-button type="primary" plain>
            <el-icon><Download /></el-icon>
            批量导入
          </el-button>
        </el-upload>
        <el-button @click="downloadTemplate" plain>
          <el-icon><Download /></el-icon>
          下载模板
        </el-button>
      </div>
    </div>

    <div class="filter-bar">
      <el-input
        v-model="filters.taskName"
        placeholder="任务名称"
        clearable
        style="width: 180px"
        @keyup.enter="handleSearch"
      />
      <el-input
        v-model="filters.taskCategory"
        placeholder="任务类别"
        clearable
        style="width: 160px"
        @keyup.enter="handleSearch"
      />
      <el-select
        v-model="filters.scoreMethod"
        placeholder="给分方式"
        clearable
        style="width: 160px"
      >
        <el-option v-for="option in scoreMethodOptions" :key="option" :label="option" :value="option" />
      </el-select>
      <el-select
        v-model="filters.pointsEditable"
        placeholder="积分是否可修改"
        clearable
        style="width: 160px"
      >
        <el-option label="是" :value="1" />
        <el-option label="否" :value="0" />
      </el-select>
      <el-select
        v-model="filters.quantityEditable"
        placeholder="数量是否可修改"
        clearable
        style="width: 160px"
      >
        <el-option label="是" :value="1" />
        <el-option label="否" :value="0" />
      </el-select>
      <el-button type="primary" @click="handleSearch">查询</el-button>
      <el-button @click="resetFilters">重置</el-button>
      <el-button
        v-if="canManage"
        type="danger"
        :disabled="selectedRows.length === 0"
        @click="batchDeleteTasks"
      >
        批量删除 ({{ selectedRows.length }})
      </el-button>
    </div>

    <el-table
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
      <el-table-column v-if="canManage" label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-button link type="danger" @click="deleteTask(row)">删除</el-button>
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
          <el-input v-model="form.taskCategory" placeholder="自由文本，用于筛选" />
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
        <el-form-item label="数量是否可修改">
          <el-switch v-model="form.quantityEditable" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="积分是否可修改">
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
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Download } from '@element-plus/icons-vue';
import { useUserStore } from '@/store/modules/user';
import FormDialog from '@/components/system/FormDialog.vue';
import {
  getRepairTaskLibrary,
  createRepairTask,
  updateRepairTask,
  deleteRepairTask,
  batchDeleteRepairTasks,
  downloadTemplate as downloadRepairTaskTemplate
} from '@/api/repairTaskLibrary';

const userStore = useUserStore();
const managerRoles = ['admin', 'station_manager', 'department_manager', 'deputy_manager'];
const canManage = computed(() => userStore.hasRole(managerRoles));

const tasks = ref([]);
const loading = ref(false);
const tableRef = ref(null);
const selectedRows = ref([]);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
});
const filters = reactive({
  taskName: '',
  taskCategory: '',
  scoreMethod: '',
  pointsEditable: null,
  quantityEditable: null
});

const scoreMethodOptions = ['奖扣结合式', '扣分项', '奖分项'];

const dialogVisible = ref(false);
const saving = ref(false);
const form = reactive({
  id: null,
  taskName: '',
  taskCategory: '',
  scoreMethod: '',
  points: null,
  quantity: 1,
  pointsRule: '',
  pointsEditable: 0,
  quantityEditable: 0
});

const apiBaseUrl = computed(() => import.meta.env.VITE_API_BASE_URL ?? '/api');
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${userStore.token}`
}));

const resolveText = (value) => (typeof value === 'string' ? value.trim() : '');
const hasFilterValue = (value) => value !== undefined && value !== null && value !== '';

const buildQuery = () => ({
  page: pagination.page,
  pageSize: pagination.pageSize,
  taskName: resolveText(filters.taskName) ? resolveText(filters.taskName) : undefined,
  taskCategory: resolveText(filters.taskCategory) ? resolveText(filters.taskCategory) : undefined,
  scoreMethod: resolveText(filters.scoreMethod) ? resolveText(filters.scoreMethod) : undefined,
  pointsEditable: hasFilterValue(filters.pointsEditable) ? filters.pointsEditable : undefined,
  quantityEditable: hasFilterValue(filters.quantityEditable) ? filters.quantityEditable : undefined
});

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
  } catch (error) {
    ElMessage.error('加载任务库失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  loadTasks();
};

const resetFilters = () => {
  filters.taskName = '';
  filters.taskCategory = '';
  filters.scoreMethod = '';
  filters.pointsEditable = null;
  filters.quantityEditable = null;
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

const openDialog = (row = null) => {
  if (row) {
    form.id = row.id;
    form.taskName = row.task_name ?? '';
    form.taskCategory = row.task_category ?? '';
    form.scoreMethod = row.score_method ?? '';
    form.points = row.points ?? null;
    form.quantity = row.quantity ?? 1;
    form.pointsRule = row.points_rule ?? '';
    form.pointsEditable = row.points_editable ?? 0;
    form.quantityEditable = row.quantity_editable ?? 0;
  } else {
    form.id = null;
    form.taskName = '';
    form.taskCategory = '';
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

const beforeUpload = (file) => {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    || file.type === 'application/vnd.ms-excel';
  if (!isExcel) {
    ElMessage.error('只能上传Excel文件');
  }
  return isExcel;
};

const handleImportSuccess = (response) => {
  if (response.code === 200) {
    ElMessage.success(response.message ?? '导入成功');
    loadTasks();
  } else {
    ElMessage.error(response.message ?? '导入失败');
  }
};

const handleImportError = () => {
  ElMessage.error('导入失败');
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

  .filter-bar {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
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
