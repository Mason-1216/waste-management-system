<template>
  <div class="points-detail-tab">
    <div class="tab-header">
      <el-button type="primary" :loading="exportLoading" @click="handleExport">批量导出</el-button>
      <el-button v-if="canImport" type="info" @click="downloadManualTemplate">下载模板</el-button>
      <BaseUpload
        v-if="canImport"
        :action="manualImportUrl"
        :headers="uploadHeaders"
        :on-success="handleImportSuccess"
        :on-error="handleImportError"
        :show-file-list="false"
        :before-upload="beforeUpload"
        accept=".xlsx,.xls"
      >
        <el-button type="success">人工导入</el-button>
      </BaseUpload>
    </div>

    <el-card class="filter-card">
      <FilterBar>
        <div class="filter-item">
          <span class="filter-label">维度</span>
          <el-select v-model="detailFilters.cycle" style="width: 140px" @change="handleDetailCycleChange">
            <el-option label="日" value="day" />
            <el-option label="周" value="week" />
            <el-option label="月" value="month" />
            <el-option label="年" value="year" />
          </el-select>
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
    </el-card>

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

    <div class="pagination-wrapper" v-if="detailPagination.total > 0">
      <el-pagination
        v-model:current-page="detailPagination.page"
        v-model:page-size="detailPagination.pageSize"
        :total="detailPagination.total"
        :page-sizes="[5, 10, 20, 50]"
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
import dayjs from 'dayjs';
import { useRoute } from 'vue-router';

import FilterBar from '@/components/common/FilterBar.vue';
import FilterAutocomplete from '@/components/common/FilterAutocomplete.vue';
import FilterSelect from '@/components/common/FilterSelect.vue';
import BaseUpload from '@/components/common/BaseUpload.vue';
import request from '@/api/request';
import { useUpload } from '@/composables/useUpload';
import { useUserStore } from '@/store/modules/user';
import { fetchAllPaged, exportRowsToXlsx, buildExportFileName } from '@/utils/tableExport';

const route = useRoute();
const userStore = useUserStore();

const managerRoles = ['station_manager', 'department_manager', 'deputy_manager', 'senior_management'];
const canImport = computed(() => userStore.hasRole(managerRoles));

const { uploadUrl: manualImportUrl, uploadHeaders } = useUpload('/reports/points-manual-import');

const detailLoading = ref(false);
const exportLoading = ref(false);
const detailRows = ref([]);
const detailPagination = reactive({ page: 1, pageSize: 10, total: 0 });
const summarySuggestionRows = ref([]);

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

const beforeUpload = (file) => {
  const type = file?.type ?? '';
  const isExcel = type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    || type === 'application/vnd.ms-excel';
  if (!isExcel) {
    ElMessage.error('只能上传Excel文件');
  }
  return isExcel;
};

const handleImportSuccess = () => {
  ElMessage.success('导入成功');
  detailPagination.page = 1;
  loadDetails();
};

const handleImportError = () => {
  ElMessage.error('导入失败');
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
  .tab-header {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: flex-start;
    margin-bottom: 20px;
    padding: 16px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }

  .filter-card {
    margin-bottom: 20px;
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
