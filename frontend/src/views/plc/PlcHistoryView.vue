<template>
  <div class="history-legacy">
    <section class="section">
      <div class="stats">
        <div class="stat-card" v-for="card in statCards" :key="card.key">
          <div class="value">{{ card.value }}</div>
          <div class="label">{{ card.label }}</div>
        </div>
      </div>
    </section>

    <FilterBar>
      <el-date-picker
        v-model="filterForm.dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        style="width: 280px"
      />
      <el-select v-model="filterForm.stationId" placeholder="全部场站" clearable style="width: 180px">
        <el-option
          v-for="station in stations"
          :key="station.id"
          :label="station.station_name"
          :value="station.id"
        />
      </el-select>
      <el-select v-model="filterForm.categoryId" placeholder="全部分类" clearable style="width: 180px">
        <el-option
          v-for="cat in categories"
          :key="cat.id"
          :label="cat.category_name"
          :value="cat.id"
        />
      </el-select>
      <el-select v-model="summaryGroup" placeholder="汇总粒度" style="width: 180px">
        <el-option label="按日" value="day" />
        <el-option label="按月" value="month" />
        <el-option label="按年" value="year" />
      </el-select>
      <el-button type="primary" @click="handleQuery">查询</el-button>
      <el-button @click="resetFilter">重置</el-button>
      <el-button type="success" @click="handleDownloadTemplate">下载模板</el-button>
      <el-button type="warning" @click="importDialogVisible = true">导入数据</el-button>
    </FilterBar>

    <el-dialog v-model="importDialogVisible" title="导入历史数据" width="500px">
      <BaseUpload
        ref="uploadRef"
        :auto-upload="false"
        :limit="1"
        :on-change="handleFileChange"
        :on-exceed="handleExceed"
        accept=".xlsx,.xls"
        drag
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">拖拽文件到此处或<em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">只支持 .xlsx 或 .xls 格式文件</div>
        </template>
      </BaseUpload>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="importing" @click="handleImport">确定导入</el-button>
      </template>
    </el-dialog>

    <section class="section">
      <div class="section-title">场站分类汇总</div>
      <TableWrapper>
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

    <section class="section">
      <div class="section-title">
        历史数据
        <span class="sub-info">共 {{ pagination.total }} 条</span>
      </div>
      <TableWrapper>
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
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
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
import { UploadFilled } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import { getHistoryData, getCategories, getHistorySummary, downloadHistoryTemplate, importHistoryData } from '@/api/plcMonitor';
import request from '@/utils/request';

const loading = ref(false);
const historyTable = ref([]);
const summaryData = ref([]);
const stations = ref([]);
const categories = ref([]);
const summaryGroup = ref('day');
const importDialogVisible = ref(false);
const importing = ref(false);
const uploadRef = ref(null);
const uploadFile = ref(null);
const stats = reactive({
  totalRecords: 0,
  category: {}
});
const summaryPagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
});

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
});

const filterForm = reactive({
  stationId: '',
  categoryId: '',
  dateRange: []
});

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
  if (filterForm.stationId) params.stationId = filterForm.stationId;
  if (filterForm.categoryId) params.categoryId = filterForm.categoryId;
  if (filterForm.dateRange && filterForm.dateRange.length === 2) {
    params.startDate = filterForm.dateRange[0];
    params.endDate = filterForm.dateRange[1];
  }
  return params;
};

const fetchSummary = async () => {
  const params = {
    stationId: filterForm.stationId || undefined,
    categoryId: filterForm.categoryId || undefined,
    startDate: filterForm.dateRange?.[0],
    endDate: filterForm.dateRange?.[1],
    timeType: summaryGroup.value,
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
  filterForm.stationId = '';
  filterForm.categoryId = '';
  filterForm.dateRange = [];
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

const handleFileChange = (file) => {
  uploadFile.value = file.raw;
};

const handleExceed = () => {
  ElMessage.warning('只能上传一个文件');
};

const handleImport = async () => {
  if (!uploadFile.value) {
    ElMessage.warning('请选择要上传的文件');
    return;
  }

  importing.value = true;
  try {
    const formData = new FormData();
    formData.append('file', uploadFile.value);

    const res = await importHistoryData(formData);
    const payload = res || {};
    const total = payload.total || 0;
    const success = payload.success || 0;
    const skipped = payload.skipped || 0;
    const extra = skipped ? `, 跳过 ${skipped} 条重复` : '';
    ElMessage.success(`导入成功，插入 ${success} 条，总计 ${total} 条${extra}`);
    if (payload.errors) {
      console.warn('导入警告:', payload.errors);
    }
    importDialogVisible.value = false;
    uploadFile.value = null;
    uploadRef.value?.clearFiles();
    handleQuery();
  } catch (error) {
    console.error('导入失败:', error);
    ElMessage.error(error.response?.data?.message || '导入失败');
  } finally {
    importing.value = false;
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

  .filter-bar {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    background: #fff;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    flex-wrap: wrap;
  }

  .table-wrapper {
    overflow-x: auto;
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
