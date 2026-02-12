<template>
  <div class="points-detail-tab">
    <div class="table-toolbar">
      <el-button v-if="isSimpleMode" @click="simpleShowTable = !simpleShowTable">
        {{ simpleShowTable ? '切换卡片' : '切换表格' }}
      </el-button>
      <el-button type="primary" :icon="Download" :loading="exportLoading" @click="handleExport">批量导出</el-button>
      <el-button v-if="canImport" type="info" :icon="Download" @click="downloadManualTemplate">下载模板</el-button>
      <el-button v-if="canImport" type="success" :icon="Upload" :loading="importPreviewLoading" @click="triggerImport">人工导入</el-button>
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
      title="人工积分导入 - 导入预览"
      :rows="importPreviewRows"
      :summary="importPreviewSummary"
      :truncated="importPreviewTruncated"
      :max-rows="importPreviewMaxRows"
      :confirm-loading="importSubmitting"
      :columns="importPreviewColumns"
      @confirm="confirmImport"
    />

    <el-card class="filter-card">
      <SimpleFilterBar
        :enabled="isSimpleMode"
        v-model:expanded="simpleFilterExpanded"
        :summary-text="simpleFilterSummary"
      >
        <FilterBar>
          <div class="filter-item">
            <span class="filter-label">维度</span>
            <FilterSelect v-model="detailFilters.cycle" style="width: 140px" @change="handleDetailCycleChange">
              <el-option label="日" value="day" />
              <el-option label="周" value="week" />
              <el-option label="月" value="month" />
              <el-option label="年" value="year" />
            </FilterSelect>
          </div>

          <div class="filter-item">
            <span class="filter-label">开始日期</span>
            <el-date-picker
              v-model="detailFilters.startDate"
              type="date"
              placeholder="全部"
              value-format="YYYY-MM-DD"
              style="width: 160px"
              @change="handleDetailRangeChange"
            />
          </div>

          <div class="filter-item">
            <span class="filter-label">结束日期</span>
            <el-date-picker
              v-model="detailFilters.endDate"
              type="date"
              placeholder="全部"
              value-format="YYYY-MM-DD"
              style="width: 160px"
              @change="handleDetailRangeChange"
            />
          </div>

          <div class="filter-item">
            <span class="filter-label">姓名</span>
            <FilterAutocomplete
              v-model="detailFilters.keyword"
              :fetch-suggestions="fetchUserNameSuggestions"
              trigger-on-focus
              clearable
              placeholder="全部"
              style="width: 160px"
              @select="handleDetailSelect"
              @input="handleDetailKeywordInput"
              @keyup.enter="handleDetailSearch"
              @clear="handleDetailClear"
            />
          </div>

          <div class="filter-item">
            <span class="filter-label">任务名称</span>
            <el-input
              v-model="detailFilters.taskName"
              clearable
              placeholder="全部"
              style="width: 180px"
              @input="handleDetailTaskNameInput"
              @keyup.enter="handleDetailSearch"
              @clear="handleDetailSearch"
            />
          </div>

          <div class="filter-item">
            <span class="filter-label">任务类别</span>
            <FilterSelect v-model="detailFilters.taskCategory" style="width: 160px" @change="handleDetailSearch">
              <el-option v-for="opt in taskCategoryOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </FilterSelect>
          </div>

          <div class="filter-item">
            <span class="filter-label">数据来源</span>
            <FilterSelect v-model="detailFilters.dataSource" style="width: 160px" @change="handleDetailSearch">
              <el-option v-for="opt in dataSourceOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </FilterSelect>
          </div>

        </FilterBar>
      </SimpleFilterBar>
    </el-card>

    <TableWrapper v-if="!isSimpleMode || simpleShowTable">
      <el-table v-loading="detailLoading" :data="detailRows" stripe border data-testid="points-details-table">
        <el-table-column prop="userName" label="姓名" min-width="120" />
        <el-table-column prop="date" label="日期" min-width="140" />
        <el-table-column prop="taskName" label="任务名称" min-width="220" show-overflow-tooltip />
        <el-table-column prop="scoreCategory" label="得分大类" min-width="120" align="center">
          <template #default="{ row }">
            {{ row.scoreCategory ? row.scoreCategory : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="taskCategory" label="任务类别" min-width="120" align="center">
          <template #default="{ row }">
            {{ row.taskCategory ? row.taskCategory : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="times" label="完成次数" min-width="100" align="center" />
        <el-table-column prop="max" label="最大值" min-width="100" align="center">
          <template #default="{ row }">{{ formatPoints(row.max) }}</template>
        </el-table-column>
        <el-table-column prop="avg" label="平均值" min-width="100" align="center">
          <template #default="{ row }">{{ formatPoints(row.avg) }}</template>
        </el-table-column>
        <el-table-column prop="min" label="最小值" min-width="100" align="center">
          <template #default="{ row }">{{ formatPoints(row.min) }}</template>
        </el-table-column>
        <el-table-column prop="total" label="总分" min-width="110" align="center">
          <template #default="{ row }">{{ formatPoints(row.total) }}</template>
        </el-table-column>
        <el-table-column prop="dataSource" label="数据来源" min-width="120" />
      </el-table>
    </TableWrapper>
    <div v-else class="simple-card-list" v-loading="detailLoading">
      <el-empty v-if="detailRows.length === 0" description="暂无数据" />
      <div v-for="row in detailRows" :key="row.id || `${row.userName}-${row.date}-${row.taskName}`" class="simple-card-item">
        <div class="card-title">{{ row.taskName || '-' }}</div>
        <div class="card-meta">姓名：{{ row.userName || '-' }}</div>
        <div class="card-meta">日期：{{ row.date || '-' }}</div>
        <div class="card-meta">得分大类：{{ row.scoreCategory || '-' }}</div>
        <div class="card-meta">任务类别：{{ row.taskCategory || '-' }}</div>
        <div class="card-meta">完成次数：{{ row.times ?? '-' }}</div>
        <div class="card-meta">最大值：{{ formatPoints(row.max) }}</div>
        <div class="card-meta">平均值：{{ formatPoints(row.avg) }}</div>
        <div class="card-meta">最小值：{{ formatPoints(row.min) }}</div>
        <div class="card-meta">总分：{{ formatPoints(row.total) }}</div>
        <div class="card-meta">数据来源：{{ row.dataSource || '-' }}</div>
      </div>
    </div>

    <div class="pagination-wrapper" v-if="detailPagination.total > 0">
      <el-pagination
        v-model:current-page="detailPagination.page"
        v-model:page-size="detailPagination.pageSize"
        :total="detailPagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @current-change="loadDetails"
        @size-change="handleDetailPageSizeChange"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Download, Upload } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import { useRoute } from 'vue-router';

import FilterBar from '@/components/common/FilterBar.vue';
import FilterAutocomplete from '@/components/common/FilterAutocomplete.vue';
import FilterSelect from '@/components/common/FilterSelect.vue';
import SimpleFilterBar from '@/components/common/SimpleFilterBar.vue';
import TableWrapper from '@/components/common/TableWrapper.vue';
import request from '@/api/request';
import { useUserStore } from '@/store/modules/user';
import ImportPreviewDialog from '@/components/common/ImportPreviewDialog.vue';
import { fetchAllPaged, exportRowsToXlsx, buildExportFileName } from '@/utils/tableExport';
import { useSimpleMode } from '@/composables/useSimpleMode';

const route = useRoute();
const userStore = useUserStore();

const managerRoles = ['station_manager', 'department_manager', 'deputy_manager', 'senior_management'];
const canImport = computed(() => userStore.hasRole(managerRoles));

const detailLoading = ref(false);
const exportLoading = ref(false);
const detailRows = ref([]);
const detailPagination = reactive({ page: 1, pageSize: 10, total: 0 });
const summarySuggestionRows = ref([]);
const { isSimpleMode, simpleShowTable, simpleFilterExpanded } = useSimpleMode();

const detailFilters = reactive({
  cycle: 'day',
  startDate: dayjs().format('YYYY-MM-DD'),
  endDate: dayjs().format('YYYY-MM-DD'),
  keyword: '',
  userId: null,
  taskName: '',
  taskCategory: 'all',
  dataSource: 'all'
});

const TASK_CATEGORY_OPTIONS = ['Ⅰ类', 'Ⅱ类', 'Ⅲ类', 'Ⅳ类'];
const taskCategoryOptions = [
  { label: '全部', value: 'all' },
  ...TASK_CATEGORY_OPTIONS.map(v => ({ label: v, value: v }))
];

const dataSourceOptions = [
  { label: '全部', value: 'all' },
  { label: '汇总表统计', value: 'summary' },
  { label: '人工录入', value: 'manual' }
];
const simpleFilterSummary = computed(() => {
  const taskCategory = detailFilters.taskCategory === 'all' ? '全部' : detailFilters.taskCategory;
  const dataSource = dataSourceOptions.find(item => item.value === detailFilters.dataSource)?.label || '全部';
  const userName = detailFilters.keyword ? detailFilters.keyword : '全部';
  const taskName = detailFilters.taskName ? detailFilters.taskName : '全部';
  return `当前筛选：维度=${detailFilters.cycle} | 日期=${detailFilters.startDate}~${detailFilters.endDate} | 姓名=${userName} | 任务=${taskName} | 类别=${taskCategory} | 来源=${dataSource}`;
});

// ==================== 人工导入（预览 -> 确认导入） ====================
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
  { prop: 'date', label: '日期', width: 120 },
  { prop: 'category', label: '得分大类', width: 120 },
  { prop: 'taskCategory', label: '任务类别', width: 100 },
  { prop: 'taskName', label: '任务名称', minWidth: 180 },
  { prop: 'unitPoints', label: '单位积分', width: 100, diffKey: 'unitPoints' },
  { prop: 'quantity', label: '完成次数', width: 100, diffKey: 'quantity' },
  { prop: 'remark', label: '备注', minWidth: 160, diffKey: 'remark' }
]));

const resolveText = (value) => (typeof value === 'string' ? value.trim() : '');

const buildDefaultRange = (cycle) => {
  const now = dayjs();
  const cycleText = resolveText(cycle);
  if (cycleText === 'week') {
    const weekday = now.day();
    const diffToMonday = (weekday + 6) % 7;
    const start = now.subtract(diffToMonday, 'day');
    const end = start.add(6, 'day');
    return { startDate: start.format('YYYY-MM-DD'), endDate: end.format('YYYY-MM-DD') };
  }
  if (cycleText === 'month') {
    const start = now.startOf('month');
    const end = now.endOf('month');
    return { startDate: start.format('YYYY-MM-DD'), endDate: end.format('YYYY-MM-DD') };
  }
  if (cycleText === 'year') {
    const start = now.startOf('year');
    const end = now.endOf('year');
    return { startDate: start.format('YYYY-MM-DD'), endDate: end.format('YYYY-MM-DD') };
  }
  const today = now.format('YYYY-MM-DD');
  return { startDate: today, endDate: today };
};

const normalizeRange = ({ cycle, startDate, endDate }) => {
  const cycleText = resolveText(cycle);
  const startText = resolveText(startDate);
  const endText = resolveText(endDate);

  if (!startText && !endText) {
    return buildDefaultRange(cycleText);
  }
  if (!startText && endText) {
    return { startDate: endText, endDate: endText };
  }
  if (startText && !endText) {
    if (cycleText === 'week') {
      const end = dayjs(startText).add(6, 'day').format('YYYY-MM-DD');
      return { startDate: startText, endDate: end };
    }
    if (cycleText === 'month') {
      const end = dayjs(startText).endOf('month').format('YYYY-MM-DD');
      return { startDate: startText, endDate: end };
    }
    if (cycleText === 'year') {
      const end = dayjs(startText).endOf('year').format('YYYY-MM-DD');
      return { startDate: startText, endDate: end };
    }
    return { startDate: startText, endDate: startText };
  }

  if (startText && endText && startText > endText) {
    return { startDate: endText, endDate: startText };
  }
  return { startDate: startText, endDate: endText };
};

const formatPoints = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '-';
  if (Number.isInteger(numeric)) return `${numeric}`;
  return numeric.toFixed(2);
};

const fetchUserNameSuggestions = (queryString, callback) => {
  const query = typeof queryString === 'string' ? queryString.trim().toLowerCase() : '';
  const list = Array.isArray(summarySuggestionRows.value) ? summarySuggestionRows.value : [];
  const seen = new Set();
  const suggestions = [];

  for (const row of list) {
    const name = typeof row?.userName === 'string' ? row.userName.trim() : '';
    if (!name) continue;
    if (query && !name.toLowerCase().includes(query)) continue;
    if (seen.has(name)) continue;
    seen.add(name);
    suggestions.push({ value: name, userId: row?.userId ?? null });
    if (suggestions.length >= 50) break;
  }

  callback(suggestions);
};

const buildDetailParams = () => {
  const { startDate, endDate } = normalizeRange({ cycle: detailFilters.cycle, startDate: detailFilters.startDate, endDate: detailFilters.endDate });
  const keyword = typeof detailFilters.keyword === 'string' ? detailFilters.keyword.trim() : '';
  const taskName = typeof detailFilters.taskName === 'string' ? detailFilters.taskName.trim() : '';
  const params = {
    startDate,
    endDate,
    cycle: detailFilters.cycle,
    taskCategory: detailFilters.taskCategory,
    dataSource: detailFilters.dataSource,
    page: detailPagination.page,
    pageSize: detailPagination.pageSize
  };
  if (keyword) params.keyword = keyword;
  if (detailFilters.userId) params.userId = detailFilters.userId;
  if (taskName) params.taskName = taskName;
  return params;
};

const applyPagedResponse = (payload, rowsRef, paginationRef) => {
  if (Array.isArray(payload)) {
    rowsRef.value = payload;
    paginationRef.total = payload.length;
    return;
  }
  const list = Array.isArray(payload?.list) ? payload.list : [];
  rowsRef.value = list;
  const total = Number(payload?.total);
  paginationRef.total = Number.isFinite(total) ? total : list.length;
  const page = Number.parseInt(payload?.page, 10);
  if (Number.isInteger(page) && page > 0) paginationRef.page = page;
  const pageSize = Number.parseInt(payload?.pageSize, 10);
  if (Number.isInteger(pageSize) && pageSize > 0) paginationRef.pageSize = pageSize;
};

const loadSummarySuggestions = async () => {
  try {
    const { startDate, endDate } = normalizeRange({ cycle: detailFilters.cycle, startDate: detailFilters.startDate, endDate: detailFilters.endDate });
    const data = await request.get('/reports/points-summary-period', { params: { startDate, endDate, cycle: detailFilters.cycle, page: 1, pageSize: 5000 } });
    const payload = data?.data ?? data;
    summarySuggestionRows.value = Array.isArray(payload?.list) ? payload.list : (Array.isArray(payload) ? payload : []);
  } catch {
    summarySuggestionRows.value = [];
  }
};

const loadDetails = async () => {
  detailLoading.value = true;
  try {
    const data = await request.get('/reports/points-details', { params: buildDetailParams() });
    applyPagedResponse(data, detailRows, detailPagination);
  } catch {
    detailRows.value = [];
    detailPagination.total = 0;
  } finally {
    detailLoading.value = false;
  }
};

const handleDetailSearch = () => {
  detailPagination.page = 1;
  loadDetails();
};

const handleDetailPageSizeChange = () => {
  detailPagination.page = 1;
  loadDetails();
};

let detailTaskNameSearchTimer = null;
const handleDetailTaskNameInput = () => {
  if (detailTaskNameSearchTimer) clearTimeout(detailTaskNameSearchTimer);
  detailTaskNameSearchTimer = setTimeout(() => {
    handleDetailSearch();
  }, 300);
};

const handleDetailKeywordInput = () => {
  detailFilters.userId = null;
  handleDetailSearch();
};

const handleDetailSelect = (item) => {
  if (item?.userId) {
    detailFilters.userId = item.userId;
  } else {
    detailFilters.userId = null;
  }
  handleDetailSearch();
};

const handleDetailClear = () => {
  detailFilters.userId = null;
  handleDetailSearch();
};

const handleDetailCycleChange = () => {
  const range = buildDefaultRange(detailFilters.cycle);
  detailFilters.startDate = range.startDate;
  detailFilters.endDate = range.endDate;
  detailPagination.page = 1;
  loadDetails();
};

const handleDetailRangeChange = () => {
  const range = normalizeRange({ cycle: detailFilters.cycle, startDate: detailFilters.startDate, endDate: detailFilters.endDate });
  detailFilters.startDate = range.startDate;
  detailFilters.endDate = range.endDate;
  detailPagination.page = 1;
  loadDetails();
};

const clearDetailFilters = () => {
  detailFilters.cycle = 'day';
  detailFilters.startDate = dayjs().format('YYYY-MM-DD');
  detailFilters.endDate = dayjs().format('YYYY-MM-DD');
  detailFilters.keyword = '';
  detailFilters.userId = null;
  detailFilters.taskName = '';
  detailFilters.taskCategory = 'all';
  detailFilters.dataSource = 'all';
  detailPagination.page = 1;
  loadDetails();
};

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
    const res = await request.post('/reports/points-manual-import-preview', formData, {
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
    const res = await request.post('/reports/points-manual-import', formData, {
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
    detailPagination.page = 1;
    loadDetails();
  } finally {
    importSubmitting.value = false;
  }
};

const downloadManualTemplate = async () => {
  try {
    const response = await request.get('/reports/points-manual-template', { responseType: 'blob' });
    const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '人工积分导入模板.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch {
    ElMessage.error('下载模板失败');
  }
};

const EXPORT_COLUMNS = [
  { label: '姓名', prop: 'userName' },
  { label: '日期', prop: 'date' },
  { label: '任务名称', prop: 'taskName' },
  { label: '得分大类', prop: 'scoreCategory' },
  { label: '任务类别', prop: 'taskCategory' },
  { label: '完成次数', prop: 'times' },
  { label: '最大值', prop: 'max' },
  { label: '平均值', prop: 'avg' },
  { label: '最小值', prop: 'min' },
  { label: '总分', prop: 'total' },
  { label: '数据来源', prop: 'dataSource' }
];

const handleExport = async () => {
  exportLoading.value = true;
  try {
    const baseParams = buildDetailParams();
    const { rows } = await fetchAllPaged({
      fetchPage: async ({ page, pageSize }) => {
        const params = { ...baseParams, page, pageSize };
        const data = await request.get('/reports/points-details', { params });
        return data?.data ?? data;
      },
      pageSize: 5000
    });

    const pageTitle = typeof route?.meta?.title === 'string' && route.meta.title.trim()
      ? route.meta.title.trim()
      : '积分明细表';
    const fileName = buildExportFileName({ title: pageTitle });

    await exportRowsToXlsx({
      title: '积分明细表',
      fileName,
      sheetName: '积分明细',
      columns: EXPORT_COLUMNS,
      rows
    });
  } catch {
    ElMessage.error('导出失败');
  } finally {
    exportLoading.value = false;
  }
};

onMounted(() => {
  loadDetails();
  loadSummarySuggestions();
});
</script>

<style lang="scss" scoped>
.points-detail-tab {
  .table-toolbar {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 20px;
  }

  .filter-card {
    margin-bottom: 20px;
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
}
</style>
