<template>
  <div class="points-statistics-tab">
    <div class="table-toolbar">
      <el-button v-if="isSimpleMode" @click="simpleShowTable = !simpleShowTable">
        {{ simpleShowTable ? '切换卡片' : '切换表格' }}
      </el-button>
      <el-button type="primary" :icon="Download" :loading="exportLoading" @click="handleExport">批量导出</el-button>
    </div>

    <el-card class="filter-card">
      <SimpleFilterBar
        :enabled="isSimpleMode"
        v-model:expanded="simpleFilterExpanded"
        :summary-text="simpleFilterSummary"
      >
        <FilterBar>
          <div class="filter-item">
            <span class="filter-label">统计维度</span>
            <FilterSelect v-model="filters.cycle" style="width: 140px" @change="handleCycleChange">
              <el-option label="日" value="day" />
              <el-option label="周" value="week" />
              <el-option label="月" value="month" />
              <el-option label="年" value="year" />
            </FilterSelect>
          </div>

          <div class="filter-item">
            <span class="filter-label">开始日期</span>
            <el-date-picker
              v-model="filters.startDate"
              type="date"
              placeholder="全部"
              value-format="YYYY-MM-DD"
              style="width: 160px"
              @change="handleSummaryRangeChange"
            />
          </div>

          <div class="filter-item">
            <span class="filter-label">结束日期</span>
            <el-date-picker
              v-model="filters.endDate"
              type="date"
              placeholder="全部"
              value-format="YYYY-MM-DD"
              style="width: 160px"
              @change="handleSummaryRangeChange"
            />
          </div>

          <div class="filter-item">
            <span class="filter-label">姓名</span>
            <FilterAutocomplete
              v-model="filters.keyword"
              :fetch-suggestions="fetchUserNameSuggestions"
              trigger-on-focus
              clearable
              placeholder="全部"
              style="width: 160px"
              @select="handleSummarySearch"
              @input="handleSummarySearch"
              @keyup.enter="handleSummarySearch"
              @clear="handleSummarySearch"
            />
          </div>
        </FilterBar>
      </SimpleFilterBar>
    </el-card>

    <TableWrapper v-if="!isSimpleMode || simpleShowTable">
      <el-table
        ref="summaryTableRef"
        v-loading="summaryLoading"
        :data="summaryRows"
        stripe
        border
        :row-key="summaryRowKey"
        :expand-row-keys="expandedRowKeys"
        data-testid="points-summary-table"
      >
        <el-table-column type="expand" width="1" class-name="summary-expand-column">
          <template #default>
            <div class="summary-expand-wrapper" data-testid="points-summary-row-drilldown">
              <div class="summary-expand-header">
                <div class="summary-expand-title">
                  {{ drilldown.userName }} - {{ drilldown.categoryLabel }}
                </div>
              </div>

              <TableWrapper>
                <el-table v-loading="drilldown.loading" :data="drilldown.rows" stripe border>
                  <el-table-column prop="itemName" label="项目" min-width="260" show-overflow-tooltip />
                  <el-table-column prop="unitPoints" label="单位积分" min-width="120" align="center">
                    <template #default="{ row }">{{ formatPoints(row.unitPoints) }}</template>
                  </el-table-column>
                  <el-table-column prop="times" label="次数" min-width="80" align="center" />
                  <el-table-column prop="quantity" label="数量" min-width="80" align="center" />
                  <el-table-column prop="totalPoints" label="得分" min-width="110" align="center">
                    <template #default="{ row }">{{ formatPoints(row.totalPoints) }}</template>
                  </el-table-column>
                  <el-table-column prop="dataSource" label="来源" min-width="120" />
                </el-table>
              </TableWrapper>

              <div class="pagination-wrapper" v-if="drilldown.pagination.total > 0">
                <el-pagination
                  v-model:current-page="drilldown.pagination.page"
                  v-model:page-size="drilldown.pagination.pageSize"
                  :total="drilldown.pagination.total"
                  :page-sizes="[10, 20, 50, 100]"
                  layout="total, sizes, prev, pager, next"
                  @current-change="loadDrilldown"
                  @size-change="handleDrilldownPageSizeChange"
                />
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="date" label="日期" min-width="140" />
        <el-table-column prop="userName" label="姓名" min-width="120" />

        <el-table-column label="安全" min-width="90" align="center">
          <template #default="{ row }">
            <span
              :class="resolvePointsLinkClass(row.safety)"
              @click="handleSummaryPointsClick(row, 'safety')"
              data-testid="safety-points-toggle"
            >{{ formatPoints(row.safety) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="卫生" min-width="90" align="center">
          <template #default="{ row }">
            <span
              :class="resolvePointsLinkClass(row.hygiene)"
              @click="handleSummaryPointsClick(row, 'hygiene')"
              data-testid="hygiene-points-toggle"
            >{{ formatPoints(row.hygiene) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="维修" min-width="90" align="center">
          <template #default="{ row }">
            <span
              :class="resolvePointsLinkClass(row.repair)"
              @click="handleSummaryPointsClick(row, 'repair')"
              data-testid="repair-points-toggle"
            >{{ formatPoints(row.repair) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="保养" min-width="90" align="center">
          <template #default="{ row }">
            <span
              :class="resolvePointsLinkClass(row.maintenance)"
              @click="handleSummaryPointsClick(row, 'maintenance')"
              data-testid="maintenance-points-toggle"
            >{{ formatPoints(row.maintenance) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="固定工作" min-width="110" align="center">
          <template #default="{ row }">
            <span
              :class="resolvePointsLinkClass(row.fixed)"
              @click="handleSummaryPointsClick(row, 'fixed')"
              data-testid="fixed-points-toggle"
            >{{ formatPoints(row.fixed) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="临时任务" min-width="110" align="center">
          <template #default="{ row }">
            <span
              :class="resolvePointsLinkClass(row.dispatch)"
              @click="handleSummaryPointsClick(row, 'dispatch')"
              data-testid="dispatch-points-toggle"
            >{{ formatPoints(row.dispatch) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="自行申请" min-width="110" align="center">
          <template #default="{ row }">
            <span
              :class="resolvePointsLinkClass(row.selfApply)"
              @click="handleSummaryPointsClick(row, 'selfApply')"
              data-testid="self-apply-points-toggle"
            >{{ formatPoints(row.selfApply) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="扣分" min-width="90" align="center">
          <template #default="{ row }">
            <span
              :class="resolvePointsLinkClass(row.deduction)"
              @click="handleSummaryPointsClick(row, 'deduction')"
              data-testid="deduction-points-toggle"
            >{{ formatPoints(row.deduction) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="总计" min-width="110" align="center">
          <template #default="{ row }">
            {{ formatPoints(row.total) }}
          </template>
        </el-table-column>
      </el-table>
    </TableWrapper>
    <div v-else class="simple-card-list" v-loading="summaryLoading">
      <el-empty v-if="summaryRows.length === 0" description="暂无数据" />
      <div v-for="row in summaryRows" :key="summaryRowKey(row)" class="simple-card-item">
        <div class="card-title">{{ row.userName || '-' }}</div>
        <div class="card-meta">日期：{{ row.date || '-' }}</div>
        <div class="card-points-grid">
          <div class="point-item">
            <span class="point-label">安全</span>
            <span :class="resolvePointsLinkClass(row.safety)" @click="handleSummaryPointsClick(row, 'safety')">{{ formatPoints(row.safety) }}</span>
          </div>
          <div class="point-item">
            <span class="point-label">卫生</span>
            <span :class="resolvePointsLinkClass(row.hygiene)" @click="handleSummaryPointsClick(row, 'hygiene')">{{ formatPoints(row.hygiene) }}</span>
          </div>
          <div class="point-item">
            <span class="point-label">维修</span>
            <span :class="resolvePointsLinkClass(row.repair)" @click="handleSummaryPointsClick(row, 'repair')">{{ formatPoints(row.repair) }}</span>
          </div>
          <div class="point-item">
            <span class="point-label">保养</span>
            <span :class="resolvePointsLinkClass(row.maintenance)" @click="handleSummaryPointsClick(row, 'maintenance')">{{ formatPoints(row.maintenance) }}</span>
          </div>
          <div class="point-item">
            <span class="point-label">固定工作</span>
            <span :class="resolvePointsLinkClass(row.fixed)" @click="handleSummaryPointsClick(row, 'fixed')">{{ formatPoints(row.fixed) }}</span>
          </div>
          <div class="point-item">
            <span class="point-label">临时任务</span>
            <span :class="resolvePointsLinkClass(row.dispatch)" @click="handleSummaryPointsClick(row, 'dispatch')">{{ formatPoints(row.dispatch) }}</span>
          </div>
          <div class="point-item">
            <span class="point-label">自行申请</span>
            <span :class="resolvePointsLinkClass(row.selfApply)" @click="handleSummaryPointsClick(row, 'selfApply')">{{ formatPoints(row.selfApply) }}</span>
          </div>
          <div class="point-item">
            <span class="point-label">扣分</span>
            <span :class="resolvePointsLinkClass(row.deduction)" @click="handleSummaryPointsClick(row, 'deduction')">{{ formatPoints(row.deduction) }}</span>
          </div>
        </div>
        <div class="card-meta total">总计：{{ formatPoints(row.total) }}</div>
      </div>
    </div>

    <el-card
      v-if="isSimpleMode && !simpleShowTable && drilldown.userId && drilldown.category"
      class="simple-drilldown-card"
      shadow="never"
    >
      <template #header>
        <div class="summary-expand-title">{{ drilldown.userName }} - {{ drilldown.categoryLabel }}</div>
      </template>
      <TableWrapper>
        <el-table v-loading="drilldown.loading" :data="drilldown.rows" stripe border>
          <el-table-column prop="itemName" label="项目" min-width="220" show-overflow-tooltip />
          <el-table-column prop="unitPoints" label="单位积分" min-width="100" align="center">
            <template #default="{ row }">{{ formatPoints(row.unitPoints) }}</template>
          </el-table-column>
          <el-table-column prop="times" label="次数" min-width="80" align="center" />
          <el-table-column prop="quantity" label="数量" min-width="80" align="center" />
          <el-table-column prop="totalPoints" label="得分" min-width="100" align="center">
            <template #default="{ row }">{{ formatPoints(row.totalPoints) }}</template>
          </el-table-column>
          <el-table-column prop="dataSource" label="来源" min-width="120" />
        </el-table>
      </TableWrapper>
      <div class="pagination-wrapper" v-if="drilldown.pagination.total > 0">
        <el-pagination
          v-model:current-page="drilldown.pagination.page"
          v-model:page-size="drilldown.pagination.pageSize"
          :total="drilldown.pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @current-change="loadDrilldown"
          @size-change="handleDrilldownPageSizeChange"
        />
      </div>
    </el-card>

    <div class="pagination-wrapper" v-if="summaryPagination.total > 0">
      <el-pagination
        v-model:current-page="summaryPagination.page"
        v-model:page-size="summaryPagination.pageSize"
        :total="summaryPagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @current-change="handleSummaryPageChange"
        @size-change="handleSummaryPageSizeChange"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Download } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import { useRoute } from 'vue-router';

import FilterBar from '@/components/common/FilterBar.vue';
import FilterAutocomplete from '@/components/common/FilterAutocomplete.vue';
import FilterSelect from '@/components/common/FilterSelect.vue';
import SimpleFilterBar from '@/components/common/SimpleFilterBar.vue';
import TableWrapper from '@/components/common/TableWrapper.vue';
import request from '@/api/request';
import { fetchAllPaged, exportRowsToXlsx, buildExportFileName } from '@/utils/tableExport';
import { useSimpleMode } from '@/composables/useSimpleMode';

const route = useRoute();
const summaryLoading = ref(false);
const exportLoading = ref(false);
const summaryRows = ref([]);
const summarySuggestionRows = ref([]);
const summaryPagination = reactive({ page: 1, pageSize: 10, total: 0 });
const summaryTableRef = ref(null);
const { isSimpleMode, simpleShowTable, simpleFilterExpanded } = useSimpleMode();

const filters = reactive({
  cycle: 'day',
  startDate: dayjs().format('YYYY-MM-DD'),
  endDate: dayjs().format('YYYY-MM-DD'),
  keyword: ''
});

const categoryOptions = [
  { label: '全部', value: 'all' },
  { label: '安全', value: 'safety' },
  { label: '卫生', value: 'hygiene' },
  { label: '维修', value: 'repair' },
  { label: '保养', value: 'maintenance' },
  { label: '固定工作', value: 'fixed' },
  { label: '临时任务', value: 'dispatch' },
  { label: '自行申请', value: 'selfApply' },
  { label: '扣分', value: 'deduction' }
];
const simpleFilterSummary = computed(() => {
  const userName = filters.keyword ? filters.keyword : '全部';
  return `当前筛选：维度=${filters.cycle} | 日期=${filters.startDate}~${filters.endDate} | 姓名=${userName}`;
});

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

const canClickPoints = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return false;
  return numeric !== 0;
};

const resolvePointsLinkClass = (value) => ([
  'points-link',
  { disabled: !canClickPoints(value) }
]);

const resolveCategoryLabel = (code) => {
  const match = categoryOptions.find(opt => opt.value === code);
  return match ? match.label : '';
};

const summaryRowKey = (row) => {
  const uid = row?.userId;
  if (uid !== undefined && uid !== null && uid !== '') return String(uid);
  const name = typeof row?.userName === 'string' ? row.userName.trim() : '';
  return name ? `name::${name}` : 'unknown';
};

const expandedRowKeys = ref([]);
const drilldown = reactive({
  rowKey: null,
  userId: null,
  userName: '',
  category: '',
  categoryLabel: '',
  loading: false,
  rows: [],
  pagination: { page: 1, pageSize: 20, total: 0 }
});

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

const buildDrilldownParams = () => {
  const { startDate, endDate } = normalizeRange({ cycle: filters.cycle, startDate: filters.startDate, endDate: filters.endDate });
  return {
    startDate,
    endDate,
    userId: drilldown.userId,
    category: drilldown.category,
    page: drilldown.pagination.page,
    pageSize: drilldown.pagination.pageSize
  };
};

const loadDrilldown = async () => {
  if (!drilldown.userId || !drilldown.category) return;
  drilldown.loading = true;
  try {
    const data = await request.get('/reports/points-summary-drilldown', { params: buildDrilldownParams() });
    const payload = data?.data ?? data;
    const list = Array.isArray(payload?.list) ? payload.list : [];
    drilldown.rows = list;
    const total = Number(payload?.total);
    drilldown.pagination.total = Number.isFinite(total) ? total : list.length;
    const page = Number.parseInt(payload?.page, 10);
    if (Number.isInteger(page) && page > 0) drilldown.pagination.page = page;
    const pageSize = Number.parseInt(payload?.pageSize, 10);
    if (Number.isInteger(pageSize) && pageSize > 0) drilldown.pagination.pageSize = pageSize;
  } catch {
    drilldown.rows = [];
    drilldown.pagination.total = 0;
  } finally {
    drilldown.loading = false;
  }
};

const handleDrilldownPageSizeChange = () => {
  drilldown.pagination.page = 1;
  loadDrilldown();
};

const closeDrilldown = () => {
  expandedRowKeys.value = [];
  drilldown.rowKey = null;
  drilldown.userId = null;
  drilldown.userName = '';
  drilldown.category = '';
  drilldown.categoryLabel = '';
  drilldown.rows = [];
  drilldown.pagination.page = 1;
  drilldown.pagination.total = 0;
};

const buildSummaryParams = () => {
  const { startDate, endDate } = normalizeRange({ cycle: filters.cycle, startDate: filters.startDate, endDate: filters.endDate });
  const keyword = typeof filters.keyword === 'string' ? filters.keyword.trim() : '';
  const params = {
    startDate,
    endDate,
    cycle: filters.cycle,
    page: summaryPagination.page,
    pageSize: summaryPagination.pageSize
  };
  if (keyword) params.keyword = keyword;
  return params;
};

const buildSummarySuggestionParams = () => {
  const params = buildSummaryParams();
  params.page = 1;
  params.pageSize = 5000;
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
    const data = await request.get('/reports/points-summary-period', { params: buildSummarySuggestionParams() });
    const payload = data?.data ?? data;
    summarySuggestionRows.value = Array.isArray(payload?.list) ? payload.list : (Array.isArray(payload) ? payload : []);
  } catch {
    summarySuggestionRows.value = [];
  }
};

const loadSummary = async () => {
  summaryLoading.value = true;
  try {
    const data = await request.get('/reports/points-summary-period', { params: buildSummaryParams() });
    applyPagedResponse(data, summaryRows, summaryPagination);
    loadSummarySuggestions();
  } catch {
    summaryRows.value = [];
    summaryPagination.total = 0;
  } finally {
    summaryLoading.value = false;
  }
};

const handleSummarySearch = () => {
  summaryPagination.page = 1;
  closeDrilldown();
  loadSummary();
};

const handleSummaryPageChange = () => {
  closeDrilldown();
  loadSummary();
};

const handleSummaryPageSizeChange = () => {
  summaryPagination.page = 1;
  closeDrilldown();
  loadSummary();
};

const handleCycleChange = () => {
  const range = buildDefaultRange(filters.cycle);
  filters.startDate = range.startDate;
  filters.endDate = range.endDate;
  summaryPagination.page = 1;
  closeDrilldown();
  loadSummary();
};

const handleSummaryRangeChange = () => {
  const range = normalizeRange({ cycle: filters.cycle, startDate: filters.startDate, endDate: filters.endDate });
  filters.startDate = range.startDate;
  filters.endDate = range.endDate;
  summaryPagination.page = 1;
  closeDrilldown();
  loadSummary();
};

const handleSummaryPointsClick = (row, categoryCode) => {
  const value = row?.[categoryCode];
  if (!canClickPoints(value)) return;

  const rowKey = summaryRowKey(row);
  const userId = row?.userId ?? null;
  if (!userId) return;

  const isSameRow = drilldown.rowKey === rowKey;
  const isSameCategory = drilldown.category === categoryCode;

  if (isSameRow && isSameCategory && expandedRowKeys.value.length > 0) {
    closeDrilldown();
    return;
  }

  drilldown.rowKey = rowKey;
  drilldown.userId = userId;
  drilldown.userName = row?.userName ?? '';
  drilldown.category = categoryCode;
  drilldown.categoryLabel = resolveCategoryLabel(categoryCode);
  drilldown.pagination.page = 1;
  drilldown.rows = [];
  drilldown.pagination.total = 0;

  expandedRowKeys.value = [rowKey];
  loadDrilldown();
};

const EXPORT_COLUMNS = [
  { label: '日期', prop: 'date' },
  { label: '姓名', prop: 'userName' },
  { label: '安全', prop: 'safety' },
  { label: '卫生', prop: 'hygiene' },
  { label: '维修', prop: 'repair' },
  { label: '保养', prop: 'maintenance' },
  { label: '固定工作', prop: 'fixed' },
  { label: '临时任务', prop: 'dispatch' },
  { label: '自行申请', prop: 'selfApply' },
  { label: '扣分', prop: 'deduction' },
  { label: '总分', prop: 'total' }
];

const handleExport = async () => {
  exportLoading.value = true;
  try {
    const baseParams = buildSummaryParams();
    const { rows } = await fetchAllPaged({
      fetchPage: async ({ page, pageSize }) => {
        const params = { ...baseParams, page, pageSize };
        const data = await request.get('/reports/points-summary-period', { params });
        return data?.data ?? data;
      },
      pageSize: 5000
    });

    const pageTitle = typeof route?.meta?.title === 'string' && route.meta.title.trim()
      ? route.meta.title.trim()
      : '积分统计表';
    const fileName = buildExportFileName({ title: pageTitle });

    await exportRowsToXlsx({
      title: '积分统计表',
      fileName,
      sheetName: '积分统计',
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
  loadSummary();
});
</script>

<style lang="scss" scoped>
.points-statistics-tab {
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
    margin-bottom: 8px;
  }

  .card-meta.total {
    font-weight: 600;
    color: #303133;
  }

  .card-points-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 8px;
    margin-bottom: 8px;
  }

  .point-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: 6px;
    background: #f8f9fb;
  }

  .point-label {
    color: #909399;
    font-size: 13px;
  }

  .points-link {
    color: #409eff;
    cursor: pointer;
  }

  .points-link.disabled {
    color: #909399;
    cursor: default;
  }

  .summary-expand-column {
    padding: 0;
  }

  :deep(.summary-expand-column .cell) {
    padding: 0 !important;
    width: 0 !important;
    overflow: hidden;
  }

  :deep(.summary-expand-column .el-table__expand-icon) {
    display: none !important;
  }

  .summary-expand-wrapper {
    padding: 12px 0 0;
  }

  .summary-expand-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin: 0 0 12px;
  }

  .summary-expand-title {
    font-weight: 600;
  }

  .simple-drilldown-card {
    margin-top: 16px;
  }
}
</style>
