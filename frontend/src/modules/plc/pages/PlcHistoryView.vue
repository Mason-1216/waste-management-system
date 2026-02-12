<template>
  <div class="history-legacy">
    <div class="page-header">
      <h2>历史数据</h2>
      <div class="header-actions">
        <el-button v-if="isSimpleMode" @click="simpleShowTable = !simpleShowTable">
          {{ simpleShowTable ? '切换卡片' : '切换表格' }}
        </el-button>
        <el-button type="primary" :loading="exporting" @click="handleExport">
          <el-icon><Upload /></el-icon>批量导出
        </el-button>
        <el-button type="info" @click="handleDownloadTemplate">
          <el-icon><Download /></el-icon>下载模板
        </el-button>
        <el-button type="success" :loading="importPreviewLoading" @click="triggerImport">
          <el-icon><Download /></el-icon>批量导入
        </el-button>
      </div>
    </div>
    <section class="section">
      <div class="stats">
        <div class="stat-card" v-for="card in statCards" :key="card.key">
          <div class="value">{{ card.value }}</div>
          <div class="label">{{ card.label }}</div>
        </div>
      </div>
    </section>

    <el-card class="filter-card">
      <SimpleFilterBar
        :enabled="isSimpleMode"
        v-model:expanded="simpleFilterExpanded"
        :summary-text="simpleFilterSummary"
      >
        <FilterBar>
          <div class="filter-item">
            <span class="filter-label">开始日期</span>
            <el-date-picker
              v-model="filterForm.startDate"
              type="date"
              placeholder="全部"
              value-format="YYYY-MM-DD"
              style="width: 140px"
              @change="applyFilters"
            />
          </div>
          <div class="filter-item">
            <span class="filter-label">结束日期</span>
            <el-date-picker
              v-model="filterForm.endDate"
              type="date"
              placeholder="全部"
              value-format="YYYY-MM-DD"
              style="width: 140px"
              @change="applyFilters"
            />
          </div>
          <div class="filter-item">
            <span class="filter-label">场站</span>
            <FilterSelect v-model="filterForm.stationId" placeholder="全部" filterable clearable style="width: 180px" @change="applyFilters" @clear="applyFilters">
              <el-option label="全部" value="all" />
              <el-option
                v-for="station in stations"
                :key="station.id"
                :label="station.station_name"
                :value="station.id"
              />
            </FilterSelect>
          </div>
          <div class="filter-item">
            <span class="filter-label">分类</span>
            <FilterSelect v-model="filterForm.categoryId" placeholder="全部" filterable clearable style="width: 180px" @change="applyFilters" @clear="applyFilters">
              <el-option label="全部" value="all" />
              <el-option
                v-for="cat in categories"
                :key="cat.id"
                :label="cat.category_name"
                :value="cat.id"
              />
            </FilterSelect>
          </div>
          <div class="filter-item">
            <span class="filter-label">汇总粒度</span>
            <FilterSelect v-model="summaryGroup" placeholder="全部" filterable style="width: 180px" @change="applyFilters">
              <el-option label="全部" value="all" />
              <el-option label="按日" value="day" />
              <el-option label="按月" value="month" />
              <el-option label="按年" value="year" />
            </FilterSelect>
          </div>
        </FilterBar>
      </SimpleFilterBar>
    </el-card>

    <input
      ref="importFileInputRef"
      type="file"
      accept=".xlsx,.xls"
      style="display: none"
      @change="handleImportFileSelected"
    />

    <ImportPreviewDialog
      v-model="importPreviewVisible"
      title="历史数据 - 导入预览"
      :rows="importPreviewRows"
      :summary="importPreviewSummary"
      :truncated="importPreviewTruncated"
      :max-rows="importPreviewMaxRows"
      :confirm-loading="importSubmitting"
      :columns="importPreviewColumns"
      @confirm="confirmImport"
    />

    <section class="section-block">
      <div class="section-title">场站分类汇总</div>
      <TableWrapper v-if="!isSimpleMode || simpleShowTable">
        <el-table :data="summaryData" stripe border style="width: 100%">
          <el-table-column prop="stationName" label="场站" min-width="120" />
          <el-table-column prop="categoryName" label="分类" min-width="100" />
          <el-table-column prop="valueType" label="类型" min-width="100">
            <template #default="{ row }">
              {{ valueTypeLabel(row.valueType) }}
            </template>
          </el-table-column>
          <el-table-column prop="time" label="时间" min-width="120" />
          <el-table-column label="净增值" min-width="120" align="right">
            <template #default="{ row }">
              {{ row.valueType === 'cumulative' ? formatNumber(row.netIncrease) : '-' }}
            </template>
          </el-table-column>
          <el-table-column label="平均值" min-width="120" align="right">
            <template #default="{ row }">
              {{ row.valueType === 'fluctuating' || row.valueType === 'event' ? formatNumber(row.avgValue) : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="sampleCount" label="样本数" min-width="100" align="center" />
        </el-table>
      </TableWrapper>
      <div v-else class="simple-card-list">
        <el-empty v-if="summaryData.length === 0" description="暂无数据" />
        <div v-for="row in summaryData" :key="`${row.stationName}-${row.categoryName}-${row.time}-${row.valueType}`" class="simple-card-item">
          <div class="card-title">{{ row.stationName || '-' }} / {{ row.categoryName || '-' }}</div>
          <div class="card-meta">类型：{{ valueTypeLabel(row.valueType) }}</div>
          <div class="card-meta">时间：{{ row.time || '-' }}</div>
          <div class="card-meta" v-if="row.valueType === 'cumulative'">净增值：{{ formatNumber(row.netIncrease) }}</div>
          <div class="card-meta" v-else>平均值：{{ formatNumber(row.avgValue) }}</div>
          <div class="card-meta">样本数：{{ row.sampleCount ?? 0 }}</div>
        </div>
      </div>
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="summaryPagination.page"
          v-model:page-size="summaryPagination.pageSize"
          :total="summaryPagination.total"
          :page-sizes="[5, 10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSummarySizeChange"
          @current-change="handleSummaryPageChange"
        />
      </div>
    </section>

    <section class="section-block">
      <div class="section-title">
        历史数据
        <span class="sub-info">共 {{ pagination.total }} 条</span>
      </div>
      <TableWrapper v-if="!isSimpleMode || simpleShowTable">
        <el-table :data="historyTable" stripe border style="width: 100%">
          <el-table-column prop="config.name" label="监控点名称" min-width="150">
            <template #default="{ row }">
              {{ row.config?.name || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="station.station_name" label="场站" min-width="120">
            <template #default="{ row }">
              {{ row.station?.station_name || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="category.category_name" label="分类" min-width="100">
            <template #default="{ row }">
              {{ row.category?.category_name || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="address" label="地址" min-width="120" />
          <el-table-column prop="value" label="数值" min-width="120" align="right">
            <template #default="{ row }">
              {{ formatNumber(row.value) }}
            </template>
          </el-table-column>
          <el-table-column prop="timestamp" label="时间" min-width="160">
            <template #default="{ row }">
              {{ formatDateTime(row.timestamp) }}
            </template>
          </el-table-column>
        </el-table>
      </TableWrapper>
      <div v-else class="simple-card-list">
        <el-empty v-if="historyTable.length === 0" description="暂无数据" />
        <div v-for="row in historyTable" :key="row.id || `${row.config?.name}-${row.timestamp}`" class="simple-card-item">
          <div class="card-title">{{ row.config?.name || '-' }}</div>
          <div class="card-meta">场站：{{ row.station?.station_name || '-' }}</div>
          <div class="card-meta">分类：{{ row.category?.category_name || '-' }}</div>
          <div class="card-meta">地址：{{ row.address || '-' }}</div>
          <div class="card-meta">数值：{{ formatNumber(row.value) }}</div>
          <div class="card-meta">时间：{{ formatDateTime(row.timestamp) }}</div>
        </div>
      </div>
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[5, 10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { UploadFilled, Upload } from '@element-plus/icons-vue';
import { useRoute } from 'vue-router';
import dayjs from 'dayjs';
import SimpleFilterBar from '@/components/common/SimpleFilterBar.vue';
import { useSimpleMode } from '@/composables/useSimpleMode';
import { getHistoryData, getCategories, getHistorySummary, downloadHistoryTemplate, importHistoryData, previewImportHistoryData } from '@/api/plcMonitor';
import request from '@/utils/request';
import { buildExportFileName, exportSheetsToXlsx, fetchAllPaged } from '@/utils/tableExport';
import ImportPreviewDialog from '@/components/common/ImportPreviewDialog.vue';

const loading = ref(false);
const exporting = ref(false);
const historyTable = ref([]);
const summaryData = ref([]);
const stations = ref([]);
const categories = ref([]);
const summaryGroup = ref('all');
const { isSimpleMode, simpleShowTable, simpleFilterExpanded } = useSimpleMode();

// ==================== 批量导入（预览 -> 确认导入） ====================
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
  { prop: 'stationName', label: '场站', width: 140 },
  { prop: 'categoryName', label: '分类', width: 120 },
  { prop: 'configName', label: '监控点', minWidth: 160 },
  { prop: 'address', label: '地址', width: 140 },
  { prop: 'value', label: '数值', width: 120 },
  { prop: 'timestamp', label: '时间', minWidth: 180 },
  { prop: 'quality', label: '质量', width: 90 }
]));
const stats = reactive({
  totalRecords: 0,
  category: {}
});
const summaryPagination = reactive({
  page: 1,
  pageSize: 5,
  total: 0
});

const pagination = reactive({
  page: 1,
  pageSize: 5,
  total: 0
});

const today = dayjs().format('YYYY-MM-DD');
const filterForm = reactive({
  stationId: 'all',
  categoryId: 'all',
  startDate: dayjs().subtract(5, 'day').format('YYYY-MM-DD'),
  endDate: today
});
const resolveStationLabel = (id) => {
  if (id === 'all') return '全部';
  const matched = stations.value.find(item => item.id === id);
  return matched?.station_name || String(id);
};
const resolveCategoryLabel = (id) => {
  if (id === 'all') return '全部';
  const matched = categories.value.find(item => item.id === id);
  return matched?.category_name || String(id);
};
const summaryGroupLabel = computed(() => {
  if (summaryGroup.value === 'day') return '按日';
  if (summaryGroup.value === 'month') return '按月';
  if (summaryGroup.value === 'year') return '按年';
  return '全部';
});
const simpleFilterSummary = computed(() => {
  return `当前筛选：开始=${filterForm.startDate} | 结束=${filterForm.endDate} | 场站=${resolveStationLabel(filterForm.stationId)} | 分类=${resolveCategoryLabel(filterForm.categoryId)} | 汇总=${summaryGroupLabel.value}`;
});

const route = useRoute();

const valueTypeLabel = (val) => {
  if (val === 'fluctuating') return '变化型';
  if (val === 'event') return '事件型';
  return '计量型';
};

const formatDateTime = (val) => {
  if (!val) return '-';
  return dayjs(val).format('YYYY-MM-DD HH:mm:ss');
};

const formatNumber = (val) => {
  if (val === null || val === undefined) return '-';
  const num = Number(val);
  if (Number.isNaN(num)) return '-';
  return num.toFixed(4);
};

const statCards = computed(() => {
  const cards = [
    { key: 'total', label: '总记录数', value: stats.totalRecords || 0 }
  ];
  Object.entries(stats.category || {}).forEach(([key, item]) => {
    const label = `${item.categoryName || key}(${valueTypeLabel(item.valueType)})`;
    const value = item.valueType === 'fluctuating'
      ? formatNumber(item.avgValue)
      : formatNumber(item.netIncrease);
    cards.push({ key, label, value });
  });
  return cards;
});

const summaryValueLabel = (row) => (row.valueType === 'fluctuating' ? '平均值' : '净增值');
const summaryValue = (row) => {
  if (row.valueType === 'fluctuating') return formatNumber(row.avgValue);
  return formatNumber(row.netIncrease);
};

const fetchStations = async () => {
  try {
    const res = await request.get('/stations/all');
    stations.value = res || [];
  } catch (error) {
    console.error('获取场站列表失败:', error);
  }
};

const fetchCategories = async () => {
  try {
    const res = await getCategories({ isEnabled: 'true' });
    categories.value = res || [];
  } catch (error) {
    console.error('获取分类列表失败:', error);
  }
};

const buildParams = () => {
  const params = {
    page: pagination.page,
    pageSize: pagination.pageSize
  };
  if (filterForm.stationId && filterForm.stationId !== 'all') params.stationId = filterForm.stationId;
  if (filterForm.categoryId && filterForm.categoryId !== 'all') params.categoryId = filterForm.categoryId;
  if (filterForm.startDate) params.startDate = filterForm.startDate;
  if (filterForm.endDate) params.endDate = filterForm.endDate;
  return params;
};

const resolvePageTitle = () => {
  if (typeof route?.meta?.title === 'string' && route.meta.title.trim()) {
    return route.meta.title.trim();
  }
  return '历史数据';
};

const buildHistoryParamsForPage = ({ page, pageSize }) => {
  const params = buildParams();
  params.page = page;
  params.pageSize = pageSize;
  return params;
};

const buildSummaryParamsForPage = ({ page, pageSize }) => ({
  stationId: filterForm.stationId === 'all' ? undefined : filterForm.stationId,
  categoryId: filterForm.categoryId === 'all' ? undefined : filterForm.categoryId,
  startDate: filterForm.startDate,
  endDate: filterForm.endDate,
  timeType: summaryGroup.value === 'all' ? undefined : summaryGroup.value,
  page,
  pageSize
});

const resolveSummaryExportColumns = () => ([
  { label: '场站', prop: 'stationName' },
  { label: '分类', prop: 'categoryName' },
  { label: '类型', value: (row) => valueTypeLabel(row?.valueType) },
  { label: '时间', prop: 'time' },
  { label: '净增值', value: (row) => (row?.valueType === 'cumulative' ? formatNumber(row?.netIncrease) : '-') },
  { label: '平均值', value: (row) => ((row?.valueType === 'fluctuating' || row?.valueType === 'event') ? formatNumber(row?.avgValue) : '-') },
  { label: '样本数', prop: 'sampleCount' }
]);

const resolveHistoryExportColumns = () => ([
  { label: '监控点名称', value: (row) => row?.config?.name ?? '-' },
  { label: '场站', value: (row) => row?.station?.station_name ?? '-' },
  { label: '分类', value: (row) => row?.category?.category_name ?? '-' },
  { label: '地址', prop: 'address' },
  { label: '数值', value: (row) => formatNumber(row?.value) },
  { label: '时间', value: (row) => formatDateTime(row?.timestamp) }
]);

const handleExport = async () => {
  if (exporting.value) return;
  exporting.value = true;
  try {
    const title = resolvePageTitle();
    const fileName = buildExportFileName({ title });

    const [summaryRes, historyRes] = await Promise.all([
      fetchAllPaged({
        fetchPage: async ({ page, pageSize }) => {
          const res = await getHistorySummary(buildSummaryParamsForPage({ page, pageSize }));
          const payload = res?.data || res || {};
          const list = Array.isArray(payload.summary) ? payload.summary : [];
          const total = Number.isFinite(Number(payload.total)) ? Number(payload.total) : list.length;
          return { list, total };
        },
        pageSize: 5000
      }),
      fetchAllPaged({
        fetchPage: async ({ page, pageSize }) => {
          const res = await getHistoryData(buildHistoryParamsForPage({ page, pageSize }));
          const payload = res?.data || res || {};
          const list = Array.isArray(payload.list) ? payload.list : [];
          const total = Number.isFinite(Number(payload.total)) ? Number(payload.total) : list.length;
          return { list, total };
        },
        pageSize: 5000
      })
    ]);

    const summaryRows = Array.isArray(summaryRes?.rows) ? summaryRes.rows : [];
    const historyRows = Array.isArray(historyRes?.rows) ? historyRes.rows : [];

    if (summaryRows.length === 0 && historyRows.length === 0) {
      ElMessage.warning('没有可导出的数据');
      return;
    }

    const sheets = [];
    if (summaryRows.length > 0) {
      sheets.push({ name: '场站分类汇总', columns: resolveSummaryExportColumns(), rows: summaryRows });
    }
    if (historyRows.length > 0) {
      sheets.push({ name: '历史数据', columns: resolveHistoryExportColumns(), rows: historyRows });
    }

    await exportSheetsToXlsx({ title, fileName, sheets });
    ElMessage.success('导出成功');
  } catch (error) {
    const msg = typeof error?.message === 'string' && error.message.trim() ? error.message.trim() : '导出失败';
    ElMessage.error(msg);
  } finally {
    exporting.value = false;
  }
};

const fetchSummary = async () => {
  const params = {
    stationId: filterForm.stationId === 'all' ? undefined : filterForm.stationId,
    categoryId: filterForm.categoryId === 'all' ? undefined : filterForm.categoryId,
    startDate: filterForm.startDate,
    endDate: filterForm.endDate,
    timeType: summaryGroup.value === 'all' ? undefined : summaryGroup.value,
    page: summaryPagination.page,
    pageSize: summaryPagination.pageSize
  };
  const res = await getHistorySummary(params);
  const payload = res?.data || res || {};
  summaryData.value = payload.summary || [];
  summaryPagination.total = payload.total || 0;
  const s = payload.stats || {};
  stats.totalRecords = s.totalRecords || 0;
  stats.category = s.category || {};
};

const fetchHistory = async () => {
  const params = buildParams();
  const res = await getHistoryData(params);
  const payload = res?.data || res || {};
  historyTable.value = payload.list || [];
  pagination.total = payload.total || 0;
};

const applyFilters = () => {
  pagination.page = 1;
  summaryPagination.page = 1;
  handleQuery();
};

const handleQuery = async () => {
  loading.value = true;
  try {
    await Promise.all([fetchSummary(), fetchHistory()]);
  } catch (error) {
    console.error('加载历史数据失败:', error);
    ElMessage.error('加载历史数据失败');
  } finally {
    loading.value = false;
  }
};

const resetFilter = () => {
  filterForm.stationId = 'all';
  filterForm.categoryId = 'all';
  filterForm.startDate = dayjs().subtract(5, 'day').format('YYYY-MM-DD');
  filterForm.endDate = today;
  summaryGroup.value = 'all';
  pagination.page = 1;
  summaryPagination.page = 1;
  handleQuery();
};

const handleSizeChange = (val) => {
  pagination.pageSize = val;
  pagination.page = 1;
  handleQuery();
};

const handleCurrentChange = (val) => {
  pagination.page = val;
  handleQuery();
};

const handleSummaryPageChange = (val) => {
  summaryPagination.page = val;
  fetchSummary();
};

const handleSummarySizeChange = (val) => {
  summaryPagination.pageSize = val;
  summaryPagination.page = 1;
  fetchSummary();
};

const handleDownloadTemplate = async () => {
  try {
    const res = await downloadHistoryTemplate();
    const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plc_history_import_template.xlsx';
    link.click();
    window.URL.revokeObjectURL(url);
    ElMessage.success('模板下载成功');
  } catch (error) {
    console.error('下载模板失败:', error);
    ElMessage.error('下载模板失败');
  }
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
    const res = await previewImportHistoryData(formData);
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
    const res = await importHistoryData(formData);

    const total = typeof res?.total === 'number' ? res.total : 0;
    const success = typeof res?.success === 'number' ? res.success : 0;
    const skipped = typeof res?.skipped === 'number' ? res.skipped : 0;
    const extra = skipped > 0 ? `，跳过${skipped}条重复` : '';
    ElMessage.success(`导入成功：插入${success}条，总计${total}条${extra}`);

    importPreviewVisible.value = false;
    importFile.value = null;
    handleQuery();
  } finally {
    importSubmitting.value = false;
  }
};

onMounted(() => {
  fetchStations();
  fetchCategories();
  handleQuery();
});
</script>

<style scoped lang="scss">
.history-legacy {
  .section {
    background: white;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  }

  .section-block {
    margin-bottom: 20px;
  }

  .section-title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 15px;
    color: #333;
    border-left: 4px solid #667eea;
    padding-left: 10px;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 12px;
  }

  .stat-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 14px;
    border-radius: 8px;
    text-align: center;
  }
  .stat-card .value {
    font-size: 22px;
    font-weight: bold;
  }
  .stat-card .label {
    font-size: 12px;
    opacity: 0.9;
    margin-top: 4px;
  }

  .filter-card {
    margin-bottom: 20px;
  }

  .filter-bar {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
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

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
    background: #fff;
    padding: 16px;
    border-radius: 8px;
  }

  .sub-info {
    font-size: 14px;
    font-weight: normal;
    color: #666;
    margin-left: 8px;
  }
}
</style>

