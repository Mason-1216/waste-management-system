<template>
  <div class="quarterly-award-history-tab">
    <div class="table-toolbar" v-if="isSimpleMode">
      <el-button @click="simpleShowTable = !simpleShowTable">
        {{ simpleShowTable ? '切换卡片' : '切换表格' }}
      </el-button>
    </div>

    <el-card class="filter-card">
      <SimpleFilterBar
        :enabled="isSimpleMode"
        v-model:expanded="simpleFilterExpanded"
        :summary-text="simpleFilterSummaryText"
      >
        <FilterBar>
          <div class="filter-item">
            <span class="filter-label">年份</span>
            <FilterSelect v-model="filters.year" style="width: 120px" @change="handleYearQuarterChange">
              <el-option v-for="y in yearOptions" :key="y" :label="`${y}年`" :value="y" />
            </FilterSelect>
          </div>
          <div class="filter-item">
            <span class="filter-label">季度</span>
            <FilterSelect v-model="filters.quarter" style="width: 120px" @change="handleYearQuarterChange">
              <el-option v-for="q in 4" :key="q" :label="`Q${q}`" :value="q" />
            </FilterSelect>
          </div>
          <div class="filter-item">
            <span class="filter-label">分组名称</span>
            <FilterSelect
              v-model="filters.group_name"
              placeholder="全部"
              clearable
              filterable
              style="width: 180px"
              @change="handleSearch"
              @clear="handleSearch"
            >
              <el-option label="全部" value="all" />
              <el-option v-for="name in groupOptions" :key="name" :label="name" :value="name" />
            </FilterSelect>
          </div>
          <div class="filter-item">
            <span class="filter-label">姓名</span>
            <FilterSelect
              v-model="filters.user_name"
              placeholder="全部"
              clearable
              filterable
              style="width: 160px"
              @change="handleSearch"
              @clear="handleSearch"
            >
              <el-option label="全部" value="all" />
              <el-option v-for="name in userOptions" :key="name" :label="name" :value="name" />
            </FilterSelect>
          </div>
        </FilterBar>
      </SimpleFilterBar>
    </el-card>

    <TableWrapper v-if="!isSimpleMode || simpleShowTable">
      <el-table v-loading="loading" :data="rows" stripe border>
        <el-table-column prop="year" label="年份" width="80" align="center" />
        <el-table-column prop="quarter" label="季度" width="80" align="center">
          <template #default="{ row }">Q{{ row.quarter }}</template>
        </el-table-column>
        <el-table-column prop="group_name" label="分组" min-width="120" />
        <el-table-column prop="ranking" label="排名" width="80" align="center" />
        <el-table-column prop="user_name" label="姓名" min-width="100" />
        <el-table-column prop="total_points" label="季度积分" min-width="120" align="center">
          <template #default="{ row }">{{ formatNumber(row.total_points) }}</template>
        </el-table-column>
        <el-table-column prop="points_ratio" label="积分占比" min-width="100" align="center">
          <template #default="{ row }">{{ formatPercent(row.points_ratio) }}</template>
        </el-table-column>
        <el-table-column prop="award_coefficient" label="季度积分奖系数" min-width="130" align="center">
          <template #default="{ row }">{{ formatNumber(row.award_coefficient) }}</template>
        </el-table-column>
        <el-table-column prop="award_amount" label="个人季度积分奖" min-width="130" align="center">
          <template #default="{ row }">{{ formatNumber(row.award_amount) }}</template>
        </el-table-column>
      </el-table>
    </TableWrapper>
    <div v-else class="simple-card-list" v-loading="loading">
      <el-empty v-if="rows.length === 0" description="暂无数据" />
      <div v-for="row in rows" :key="row.id || `${row.user_name}-${row.year}-${row.quarter}`" class="simple-card-item">
        <div class="card-title">{{ row.user_name || '-' }}</div>
        <div class="card-meta">年份季度：{{ row.year }}年 Q{{ row.quarter }}</div>
        <div class="card-meta">分组：{{ row.group_name || '-' }}</div>
        <div class="card-meta">排名：{{ row.ranking ?? '-' }}</div>
        <div class="card-meta">季度积分：{{ formatNumber(row.total_points) }}</div>
        <div class="card-meta">积分占比：{{ formatPercent(row.points_ratio) }}</div>
        <div class="card-meta">季度积分奖系数：{{ formatNumber(row.award_coefficient) }}</div>
        <div class="card-meta">个人季度积分奖：{{ formatNumber(row.award_amount) }}</div>
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
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import dayjs from 'dayjs';

import FilterBar from '@/components/common/FilterBar.vue';
import FilterSelect from '@/components/common/FilterSelect.vue';
import SimpleFilterBar from '@/components/common/SimpleFilterBar.vue';
import TableWrapper from '@/components/common/TableWrapper.vue';
import { useSimpleMode } from '@/composables/useSimpleMode';
import request from '@/api/request';
import { getQuarterlyAwardGroups, getQuarterlyAwardHistory } from '../../api/quarterlyAward';

const { isSimpleMode, simpleShowTable, simpleFilterExpanded } = useSimpleMode();

const loading = ref(false);
const rows = ref([]);
const groupOptions = ref([]);
const userOptions = ref([]);
const pagination = reactive({ page: 1, pageSize: 20, total: 0 });

const currentYear = dayjs().year();
const currentQuarter = Math.ceil((dayjs().month() + 1) / 3);

const filters = reactive({
  year: currentYear,
  quarter: currentQuarter,
  group_name: 'all',
  user_name: 'all'
});

const yearOptions = computed(() => {
  const years = [];
  for (let y = currentYear; y >= currentYear - 5; y -= 1) {
    years.push(y);
  }
  return years;
});

const simpleFilterSummaryText = computed(() => {
  const groupText = filters.group_name === 'all' ? '全部' : (filters.group_name || '全部');
  const userText = filters.user_name === 'all' ? '全部' : (filters.user_name || '全部');
  return `年份：${filters.year}年；季度：Q${filters.quarter}；分组：${groupText}；姓名：${userText}`;
});

const formatNumber = (val) => {
  const num = Number(val);
  return Number.isFinite(num) ? num.toFixed(2) : '-';
};

const formatPercent = (val) => {
  const num = Number(val);
  return Number.isFinite(num) ? `${(num * 100).toFixed(2)}%` : '-';
};

const resolveUserName = (user) => {
  const byRealName = typeof user?.real_name === 'string' ? user.real_name.trim() : '';
  if (byRealName) return byRealName;
  const byCamel = typeof user?.realName === 'string' ? user.realName.trim() : '';
  if (byCamel) return byCamel;
  const byUsername = typeof user?.username === 'string' ? user.username.trim() : '';
  return byUsername;
};

const loadUserOptions = async () => {
  try {
    const data = await request.get('/users', { params: { status: 1, pageSize: 500 } });
    const list = Array.isArray(data?.list) ? data.list : [];
    const names = list
      .map(resolveUserName)
      .filter(name => typeof name === 'string' && name.trim())
      .map(name => name.trim());
    userOptions.value = Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  } catch {
    userOptions.value = [];
  }
};

const loadGroupOptions = async () => {
  try {
    const data = await getQuarterlyAwardGroups({
      year: filters.year,
      quarter: filters.quarter
    });
    const list = Array.isArray(data) ? data : [];
    const names = list
      .map(item => (typeof item?.group_name === 'string' ? item.group_name.trim() : ''))
      .filter(Boolean);
    groupOptions.value = Array.from(new Set(names));
  } catch {
    groupOptions.value = [];
  }
};

const buildParams = () => ({
  year: filters.year || undefined,
  quarter: filters.quarter || undefined,
  group_name: filters.group_name && filters.group_name !== 'all' ? filters.group_name : undefined,
  user_name: filters.user_name && filters.user_name !== 'all' ? filters.user_name : undefined,
  page: pagination.page,
  pageSize: pagination.pageSize
});

const load = async () => {
  loading.value = true;
  try {
    const data = await getQuarterlyAwardHistory(buildParams());
    rows.value = Array.isArray(data?.list) ? data.list : [];
    pagination.total = Number(data?.total) || 0;
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

const handleYearQuarterChange = async () => {
  pagination.page = 1;
  filters.group_name = 'all';
  await loadGroupOptions();
  load();
};

const handlePageSizeChange = () => {
  pagination.page = 1;
  load();
};

onMounted(async () => {
  await Promise.all([loadUserOptions(), loadGroupOptions()]);
  load();
});
</script>

<style lang="scss" scoped>
.quarterly-award-history-tab {
  .table-toolbar {
    margin-bottom: 12px;
    display: flex;
    justify-content: flex-end;
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
