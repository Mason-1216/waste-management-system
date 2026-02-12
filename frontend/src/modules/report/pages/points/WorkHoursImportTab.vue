<template>
  <div class="work-hours-import-tab">
    <el-card class="filter-card">
      <SimpleFilterBar
        :enabled="isSimpleMode"
        v-model:expanded="simpleFilterExpanded"
        :summary-text="simpleFilterSummary"
      >
        <FilterBar>
          <div class="filter-item">
            <span class="filter-label">开始月份</span>
            <el-date-picker
              v-model="filters.startMonth"
              type="month"
              value-format="YYYY-MM"
              style="width: 160px"
              @change="handleSearch"
            />
          </div>
          <div class="filter-item">
            <span class="filter-label">结束月份</span>
            <el-date-picker
              v-model="filters.endMonth"
              type="month"
              value-format="YYYY-MM"
              style="width: 160px"
              @change="handleSearch"
            />
          </div>
          <div class="filter-item">
            <span class="filter-label">姓名</span>
            <FilterSelect
              v-model="filters.userName"
              placeholder="全部"
              filterable
              clearable
              style="width: 180px"
              @change="handleSearch"
              @clear="handleSearch"
            >
              <el-option label="全部" value="all" />
              <el-option
                v-for="name in userNameOptions"
                :key="name"
                :label="name"
                :value="name"
              />
            </FilterSelect>
          </div>
        </FilterBar>
      </SimpleFilterBar>
    </el-card>

    <div class="action-bar">
      <el-button v-if="isSimpleMode" @click="simpleShowTable = !simpleShowTable">
        {{ simpleShowTable ? '切换卡片' : '切换表格' }}
      </el-button>
      <el-button v-if="canImport" type="info" :icon="Download" @click="downloadTemplate">下载模板</el-button>
      <el-button v-if="canImport" type="success" :icon="Download" :loading="importPreviewLoading" @click="triggerImport">导入工时</el-button>
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
      title="工时导入 - 导入预览"
      :rows="importPreviewRows"
      :summary="importPreviewSummary"
      :truncated="importPreviewTruncated"
      :max-rows="importPreviewMaxRows"
      :confirm-loading="importSubmitting"
      :columns="importPreviewColumns"
      @confirm="confirmImport"
    />

    <TableWrapper v-if="!isSimpleMode || simpleShowTable">
      <el-table v-loading="loading" :data="rows" stripe border>
        <el-table-column prop="userName" label="姓名" min-width="100" />
        <el-table-column prop="workMonth" label="月份" min-width="120" align="center" />
        <el-table-column prop="workHours" label="工时(小时)" min-width="100" align="center" />
        <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
        <el-table-column prop="createdByName" label="创建人" min-width="100" />
        <el-table-column prop="createdAt" label="创建时间" min-width="160" align="center" />
        <el-table-column v-if="canImport" label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </TableWrapper>
    <div v-else class="simple-card-list" v-loading="loading">
      <el-empty v-if="rows.length === 0" description="暂无数据" />
      <div v-for="row in rows" :key="row.id" class="simple-card-item">
        <div class="card-title">{{ row.userName || '-' }}</div>
        <div class="card-meta">月份：{{ row.workMonth || '-' }}</div>
        <div class="card-meta">工时(小时)：{{ row.workHours ?? '-' }}</div>
        <div class="card-meta">备注：{{ row.remark || '-' }}</div>
        <div class="card-meta">创建人：{{ row.createdByName || '-' }}</div>
        <div class="card-meta">创建时间：{{ row.createdAt || '-' }}</div>
        <div class="card-actions" v-if="canImport">
          <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
        </div>
      </div>
    </div>

    <div class="pagination-wrapper" v-if="pagination.total > 0">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @current-change="load"
        @size-change="handlePageSizeChange"
      />
    </div>

    <el-dialog v-model="editDialogVisible" title="编辑工时" width="400px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="姓名">
          <el-input :model-value="editForm.userName" disabled />
        </el-form-item>
        <el-form-item label="月份">
          <el-date-picker
            v-model="editForm.workMonth"
            type="month"
            value-format="YYYY-MM"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="工时">
          <el-input-number
            v-model="editForm.workHours"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editLoading" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import dayjs from 'dayjs';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Download } from '@element-plus/icons-vue';

import FilterBar from '@/components/common/FilterBar.vue';
import FilterSelect from '@/components/common/FilterSelect.vue';
import SimpleFilterBar from '@/components/common/SimpleFilterBar.vue';
import TableWrapper from '@/components/common/TableWrapper.vue';
import request from '@/api/request';
import { useUserStore } from '@/store/modules/user';
import ImportPreviewDialog from '@/components/common/ImportPreviewDialog.vue';
import { useSimpleMode } from '@/composables/useSimpleMode';

const userStore = useUserStore();
const managerRoles = ['station_manager', 'department_manager', 'deputy_manager', 'senior_management'];
const canImport = computed(() => userStore.hasRole(managerRoles));

const loading = ref(false);
const rows = ref([]);
const pagination = reactive({ page: 1, pageSize: 20, total: 0 });
const currentYear = dayjs().year();
const userNameOptions = ref([]);

const filters = reactive({
  startMonth: `${currentYear}-01`,
  endMonth: `${currentYear}-12`,
  userName: 'all'
});
const { isSimpleMode, simpleShowTable, simpleFilterExpanded } = useSimpleMode();
const simpleFilterSummary = computed(() => {
  const userName = filters.userName === 'all' ? '全部' : filters.userName;
  return `当前筛选：开始=${filters.startMonth} | 结束=${filters.endMonth} | 姓名=${userName}`;
});

const editDialogVisible = ref(false);
const editLoading = ref(false);
const editForm = reactive({
  id: null,
  userName: '',
  workMonth: '',
  workHours: 0,
  remark: ''
});

// ==================== 工时导入（预览 -> 确认导入） ====================
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
  { prop: 'userName', label: '人员姓名', width: 120 },
  { prop: 'month', label: '月份', width: 120 },
  { prop: 'workHours', label: '工时', width: 100, diffKey: 'workHours' },
  { prop: 'remark', label: '备注', minWidth: 160, diffKey: 'remark' }
]));

const triggerImport = () => {
  if (importPreviewLoading.value) return;
  if (!importFileInputRef.value) return;
  importFileInputRef.value.click();
};

const isExcelFile = (file) => {
  const mime = file?.type;
  return mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || mime === 'application/vnd.ms-excel';
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
    const formData = new FormData();
    formData.append('file', file);
    const res = await request.post('/reports/work-hours-manual-import-preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

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
    const formData = new FormData();
    formData.append('file', importFile.value);
    const res = await request.post('/reports/work-hours-manual-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    const created = typeof res?.created === 'number' ? res.created : 0;
    const updated = typeof res?.updated === 'number' ? res.updated : 0;
    const skipped = typeof res?.skipped === 'number' ? res.skipped : 0;
    const errors = Array.isArray(res?.errors) ? res.errors : [];

    if (errors.length > 0) {
      ElMessage.warning(`导入完成：新增${created}条，更新${updated}条，跳过${skipped}条（例如：${errors[0]}）`);
    } else {
      ElMessage.success(`导入完成：新增${created}条，更新${updated}条，跳过${skipped}条`);
    }

    importPreviewVisible.value = false;
    importFile.value = null;
    pagination.page = 1;
    load();
  } finally {
    importSubmitting.value = false;
  }
};

const downloadTemplate = async () => {
  try {
    const response = await request.get('/reports/work-hours-manual-template', { responseType: 'blob' });
    const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '工时导入模板.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch {
    ElMessage.error('下载模板失败');
  }
};

const resolveUserName = (user) => {
  const byRealName = typeof user?.real_name === 'string' ? user.real_name.trim() : '';
  if (byRealName) return byRealName;
  const byCamel = typeof user?.realName === 'string' ? user.realName.trim() : '';
  if (byCamel) return byCamel;
  const byUserName = typeof user?.username === 'string' ? user.username.trim() : '';
  return byUserName;
};

const loadUserNameOptions = async () => {
  try {
    const data = await request.get('/users', { params: { status: 1, pageSize: 500 } });
    const list = Array.isArray(data?.list) ? data.list : [];
    const names = list
      .map(resolveUserName)
      .filter(name => typeof name === 'string' && name.trim())
      .map(name => name.trim());
    userNameOptions.value = Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  } catch {
    userNameOptions.value = [];
  }
};

const buildParams = () => {
  const params = {
    page: pagination.page,
    pageSize: pagination.pageSize
  };
  if (filters.startMonth) params.startMonth = filters.startMonth;
  if (filters.endMonth) params.endMonth = filters.endMonth;
  if (filters.userName && filters.userName !== 'all') params.userName = filters.userName;
  return params;
};

const applyResponse = (payload) => {
  const list = Array.isArray(payload?.list) ? payload.list : [];
  rows.value = list;
  const total = Number(payload?.total);
  pagination.total = Number.isFinite(total) ? total : list.length;
};

const load = async () => {
  loading.value = true;
  try {
    const data = await request.get('/reports/work-hours-list', { params: buildParams() });
    applyResponse(data);
  } catch {
    rows.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  load();
};

const handlePageSizeChange = () => {
  pagination.page = 1;
  load();
};

const handleEdit = (row) => {
  editForm.id = row.id;
  editForm.userName = row.userName;
  editForm.workMonth = row.workMonth;
  editForm.workHours = row.workHours;
  editForm.remark = row.remark ?? '';
  editDialogVisible.value = true;
};

const submitEdit = async () => {
  if (!editForm.workMonth) {
    ElMessage.warning('请选择月份');
    return;
  }
  editLoading.value = true;
  try {
    await request.put(`/reports/work-hours/${editForm.id}`, {
      workMonth: editForm.workMonth,
      workHours: editForm.workHours,
      remark: editForm.remark
    });
    ElMessage.success('保存成功');
    editDialogVisible.value = false;
    load();
  } catch {
    ElMessage.error('保存失败');
  } finally {
    editLoading.value = false;
  }
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除 ${row.userName} 在 ${row.workMonth} 的工时记录吗？`, '提示', {
      type: 'warning'
    });
    await request.delete(`/reports/work-hours/${row.id}`);
    ElMessage.success('删除成功');
    load();
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

onMounted(() => {
  loadUserNameOptions();
  load();
});
</script>

<style lang="scss" scoped>
.work-hours-import-tab {
  .filter-card {
    margin-bottom: 20px;
  }

  .action-bar {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 20px;
    background: #fff;
    padding: 16px;
    border-radius: 8px;
  }

  .simple-card-list {
    display: grid;
    gap: 12px;
  }

  .simple-card-item {
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    padding: 12px;
  }

  .card-title {
    font-weight: 600;
    margin-bottom: 8px;
  }

  .card-meta {
    color: #606266;
    font-size: 14px;
    margin-bottom: 6px;
  }

  .card-actions {
    margin-top: 8px;
    display: flex;
    gap: 8px;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
    background: #fff;
    padding: 16px;
    border-radius: 8px;
  }
}
</style>
