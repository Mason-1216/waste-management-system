<template>
  <div class="points-summary-page">
    <div class="page-header">
      <h2>积分统计</h2>
      <div class="header-actions">
        <el-button :disabled="!hasExpanded" @click="collapseAll">取消展开</el-button>
      </div>
    </div>

    <el-card class="filter-card">
      <FilterBar>
        <div class="filter-item">
          <span class="filter-label">开始日期</span>
          <el-date-picker
            v-model="filters.startDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="全部"
            @change="handleSearch"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">结束日期</span>
          <el-date-picker
            v-model="filters.endDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="全部"
            @change="handleSearch"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">人员姓名</span>
          <FilterAutocomplete
            v-model="filters.keyword"
            :fetch-suggestions="fetchUserNameSuggestions"
            trigger-on-focus
            placeholder="全部"
            clearable
            style="width: 160px"
            @select="handleSearch"
            @input="handleSearch"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
        </div>
      </FilterBar>
    </el-card>

    <div class="table-wrapper" data-testid="points-summary-table">
      <el-table
        ref="summaryTableRef"
        v-loading="loading"
        :data="summaryRows"
        stripe
        border
        :row-key="rowKey"
        :expand-row-keys="expandedRowKeys"
        class="points-summary-table"
      >
        <el-table-column type="expand" width="1" class-name="expand-column">
          <template #default="{ row }">
            <div class="expand-content">
              <div class="expand-title">{{ getDetailTitle(row) }}</div>
              <div
                v-if="hasActiveDetails(row)"
                class="detail-table-wrapper"
                data-testid="fixed-details-table"
              >
                <el-table
                  :data="getActiveDetails(row)"
                  border
                  size="small"
                  class="detail-table"
                >
                  <el-table-column prop="itemName" label="项目" min-width="180" />
                  <el-table-column prop="category" label="类别" min-width="120" />
                  <el-table-column prop="method" label="方式" min-width="120" />
                  <el-table-column prop="source" label="来源" min-width="120" />
                  <el-table-column prop="unitPoints" label="单位积分" min-width="100" align="center">
                    <template #default="{ row: detail }">
                      {{ formatPoints(detail.unitPoints) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="quantity" label="数量" min-width="80" align="center" />
                  <el-table-column prop="points" label="积分" min-width="100" align="center">
                    <template #default="{ row: detail }">
                      {{ formatPoints(detail.points) }}
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <el-empty v-else description="暂无明细" />
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="date" label="日期" min-width="110" />
        <el-table-column prop="userName" label="人员" min-width="120" />
        <el-table-column label="安全" min-width="90" align="center">
          <template #default="{ row }">
            <span
              :class="['points-link', { disabled: !hasDetails(row, 'safety') }]"
              @click="toggleDetails(row, 'safety')"
              data-testid="safety-points-toggle"
            >
              {{ formatPoints(row.safety) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="卫生" min-width="90" align="center">
          <template #default="{ row }">
            <span
              :class="['points-link', { disabled: !hasDetails(row, 'hygiene') }]"
              @click="toggleDetails(row, 'hygiene')"
              data-testid="hygiene-points-toggle"
            >
              {{ formatPoints(row.hygiene) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="维修" min-width="90" align="center">
          <template #default="{ row }">
            <span
              :class="['points-link', { disabled: !hasDetails(row, 'repair') }]"
              @click="toggleDetails(row, 'repair')"
              data-testid="repair-points-toggle"
            >
              {{ formatPoints(row.repair) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="保养" min-width="90" align="center">
          <template #default="{ row }">
            <span
              :class="['points-link', { disabled: !hasDetails(row, 'maintenance') }]"
              @click="toggleDetails(row, 'maintenance')"
              data-testid="maintenance-points-toggle"
            >
              {{ formatPoints(row.maintenance) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="固定工作" min-width="110" align="center">
          <template #default="{ row }">
            <span
              :class="['points-link', { disabled: !hasDetails(row, 'fixed') }]"
              @click="toggleDetails(row, 'fixed')"
              data-testid="fixed-points-toggle"
            >
              {{ formatPoints(row.fixed) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="派发任务" min-width="110" align="center">
          <template #default="{ row }">
            <span
              :class="['points-link', { disabled: !hasDetails(row, 'dispatch') }]"
              @click="toggleDetails(row, 'dispatch')"
              data-testid="dispatch-points-toggle"
            >
              {{ formatPoints(row.dispatch) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="自行申请" min-width="110" align="center">
          <template #default="{ row }">
            <span
              :class="['points-link', { disabled: !hasDetails(row, 'selfApply') }]"
              @click="toggleDetails(row, 'selfApply')"
              data-testid="self-apply-points-toggle"
            >
              {{ formatPoints(row.selfApply) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="扣分" min-width="90" align="center">
          <template #default="{ row }">
            <span
              :class="['points-link', { disabled: !hasDetails(row, 'deduction') }]"
              @click="toggleDetails(row, 'deduction')"
              data-testid="deduction-points-toggle"
            >
              {{ formatPoints(row.deduction) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="总计" min-width="110" align="center">
          <template #default="{ row }">
            {{ formatPoints(row.total) }}
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination-wrapper" v-if="pagination.total > 0">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[5, 10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @current-change="loadSummary"
        @size-change="handlePageSizeChange"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import dayjs from 'dayjs';

import FilterBar from '@/components/common/FilterBar.vue';
import request from '@/api/request';
import { createListSuggestionFetcher } from '@/utils/filterAutocomplete';

const loading = ref(false);
const summaryRows = ref([]);
const summarySuggestionRows = ref([]);
const summaryTableRef = ref(null);
const expandedRowKeys = ref([]);
const expandedDetailType = ref({});

const fetchUserNameSuggestions = createListSuggestionFetcher(
  () => summarySuggestionRows.value,
  (row) => row.userName
);
const pagination = reactive({
  page: 1,
  pageSize: 5,
  total: 0
});

const buildDefaultFilters = () => ({
  startDate: dayjs().subtract(5, 'day').format('YYYY-MM-DD'),
  endDate: dayjs().format('YYYY-MM-DD'),
  keyword: ''
});

const filters = reactive(buildDefaultFilters());

const formatPoints = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '-';
  if (Number.isInteger(numeric)) return `${numeric}`;
  return numeric.toFixed(2);
};

const buildParams = () => {
  const startDate = filters.startDate;
  const endDate = filters.endDate;
  const keywordText = typeof filters.keyword === 'string' ? filters.keyword.trim() : '';
  const params = {};

  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  if (keywordText) params.keyword = keywordText;
  params.page = pagination.page;
  params.pageSize = pagination.pageSize;

  return params;
};

const buildSuggestionParams = () => {
  const params = buildParams();
  params.page = 1;
  params.pageSize = 5000;
  return params;
};

const rowKey = (row) => `${row.date}-${row.userId ?? row.userName ?? ''}`;

const detailTypeConfig = {
  safety: { label: '安全积分明细', field: 'safetyDetails' },
  hygiene: { label: '卫生积分明细', field: 'hygieneDetails' },
  repair: { label: '维修积分明细', field: 'repairDetails' },
  maintenance: { label: '保养积分明细', field: 'maintenanceDetails' },
  fixed: { label: '固定工作积分明细', field: 'fixedDetails' },
  dispatch: { label: '派发任务积分明细', field: 'dispatchDetails' },
  selfApply: { label: '自行申请积分明细', field: 'selfApplyDetails' },
  deduction: { label: '扣分明细', field: 'deductionDetails' }
};

const getDetailConfig = (type) => detailTypeConfig[type];

const getDetailList = (row, type) => {
  const config = getDetailConfig(type);
  if (!config) return [];
  const list = row?.[config.field];
  return Array.isArray(list) ? list : [];
};

const hasDetails = (row, type) => getDetailList(row, type).length > 0;

const getActiveDetailType = (row) => expandedDetailType.value[rowKey(row)] ?? '';

const getActiveDetails = (row) => {
  const type = getActiveDetailType(row);
  return getDetailList(row, type);
};

const hasActiveDetails = (row) => getActiveDetails(row).length > 0;

const getDetailTitle = (row) => {
  const type = getActiveDetailType(row);
  return detailTypeConfig[type]?.label ?? '积分明细';
};

const hasExpanded = computed(() => expandedRowKeys.value.length > 0);

const collapseAll = () => {
  expandedRowKeys.value = [];
  expandedDetailType.value = {};
};

const toggleDetails = (row, type) => {
  if (!hasDetails(row, type)) return;
  const key = rowKey(row);
  const nextKeys = new Set(expandedRowKeys.value);
  const currentType = expandedDetailType.value[key];
  const shouldCollapse = nextKeys.has(key) && currentType === type;
  if (shouldCollapse) {
    nextKeys.delete(key);
    const nextTypeMap = { ...expandedDetailType.value };
    delete nextTypeMap[key];
    expandedDetailType.value = nextTypeMap;
    summaryTableRef.value?.toggleRowExpansion?.(row, false);
  } else {
    nextKeys.add(key);
    expandedDetailType.value = { ...expandedDetailType.value, [key]: type };
    summaryTableRef.value?.toggleRowExpansion?.(row, true);
  }
  expandedRowKeys.value = Array.from(nextKeys);
};

const applySummaryResponse = (payload) => {
  if (Array.isArray(payload)) {
    summaryRows.value = payload;
    pagination.total = payload.length;
    return;
  }

  const list = Array.isArray(payload?.list) ? payload.list : [];
  summaryRows.value = list;
  const nextTotal = Number(payload?.total);
  pagination.total = Number.isFinite(nextTotal) ? nextTotal : list.length;
  const nextPage = Number.parseInt(payload?.page, 10);
  if (Number.isInteger(nextPage) && nextPage > 0) {
    pagination.page = nextPage;
  }
  const nextSize = Number.parseInt(payload?.pageSize, 10);
  if (Number.isInteger(nextSize) && nextSize > 0) {
    pagination.pageSize = nextSize;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  loadSummary();
};

const resetFilters = () => {
  const defaults = buildDefaultFilters();
  filters.startDate = defaults.startDate;
  filters.endDate = defaults.endDate;
  filters.keyword = defaults.keyword;
  handleSearch();
};

const handlePageSizeChange = () => {
  pagination.page = 1;
  loadSummary();
};

const loadSummary = async () => {
  loading.value = true;
  try {
    const params = buildParams();
    const data = await request.get('/reports/points-summary', { params });
    applySummaryResponse(data);
    collapseAll();
    loadSummarySuggestions();
  } catch (error) {
    summaryRows.value = [];
    pagination.total = 0;
    expandedRowKeys.value = [];
    expandedDetailType.value = {};
  } finally {
    loading.value = false;
  }
};

const loadSummarySuggestions = async () => {
  try {
    const params = buildSuggestionParams();
    const data = await request.get('/reports/points-summary', { params });
    const payload = data?.data ?? data;
    if (Array.isArray(payload)) {
      summarySuggestionRows.value = payload;
      return;
    }
    summarySuggestionRows.value = Array.isArray(payload?.list) ? payload.list : [];
  } catch (error) {
    summarySuggestionRows.value = [];
  }
};

onMounted(() => {
  loadSummary();
});
</script>

<style lang="scss" scoped>
.points-summary-page {
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
    }
  }

  .filter-card {
    margin-bottom: 16px;
  }

  .table-wrapper {
    width: 100%;
  }

  .points-summary-table {
    width: 100%;
  }

  .points-link {
    color: #409eff;
    cursor: pointer;
  }

  .points-link.disabled {
    color: #909399;
    cursor: default;
  }

  .expand-content {
    padding: 10px 20px;
  }

  .expand-title {
    font-weight: 600;
    margin-bottom: 10px;
  }

  .detail-table {
    width: 100%;
  }

  :deep(.expand-column .el-table__expand-icon) {
    display: none;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
    background: #fff;
    padding: 16px;
    border-radius: 8px;
  }
}
</style>

