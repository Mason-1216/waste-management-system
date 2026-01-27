<template>
  <div class="points-summary-page">
    <div class="page-header">
      <h2>积分统计</h2>
      <div class="header-actions">
        <el-button @click="loadSummary">刷新</el-button>
      </div>
    </div>

    <div class="filter-bar">
      <el-date-picker
        v-model="filters.dateRange"
        type="daterange"
        value-format="YYYY-MM-DD"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        style="width: 240px"
        @change="loadSummary"
      />
      <el-input
        v-model="filters.keyword"
        placeholder="人员姓名"
        clearable
        style="width: 160px"
        @keyup.enter="loadSummary"
        @clear="loadSummary"
      />
      <el-button type="primary" @click="loadSummary">查询</el-button>
    </div>

    <el-table v-loading="loading" :data="summaryRows" stripe border>
      <el-table-column prop="date" label="日期" width="110" />
      <el-table-column prop="userName" label="人员" width="120" />
      <el-table-column label="安全" width="90" align="center">
        <template #default="{ row }">
          {{ formatPoints(row.safety) }}
        </template>
      </el-table-column>
      <el-table-column label="卫生" width="90" align="center">
        <template #default="{ row }">
          {{ formatPoints(row.hygiene) }}
        </template>
      </el-table-column>
      <el-table-column label="维修" width="90" align="center">
        <template #default="{ row }">
          {{ formatPoints(row.repair) }}
        </template>
      </el-table-column>
      <el-table-column label="保养" width="90" align="center">
        <template #default="{ row }">
          {{ formatPoints(row.maintenance) }}
        </template>
      </el-table-column>
      <el-table-column label="固定" width="90" align="center">
        <template #default="{ row }">
          {{ formatPoints(row.fixed) }}
        </template>
      </el-table-column>
      <el-table-column label="派发" width="90" align="center">
        <template #default="{ row }">
          {{ formatPoints(row.dispatch) }}
        </template>
      </el-table-column>
      <el-table-column label="自行申请" width="110" align="center">
        <template #default="{ row }">
          {{ formatPoints(row.selfApply) }}
        </template>
      </el-table-column>
      <el-table-column label="扣分" width="90" align="center">
        <template #default="{ row }">
          {{ formatPoints(row.deduction) }}
        </template>
      </el-table-column>
      <el-table-column label="总计" width="110" align="center">
        <template #default="{ row }">
          {{ formatPoints(row.total) }}
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import dayjs from 'dayjs';
import request from '@/api/request';

const loading = ref(false);
const summaryRows = ref([]);

const filters = reactive({
  dateRange: [
    dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD')
  ],
  keyword: ''
});

const formatPoints = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '-';
  if (Number.isInteger(numeric)) return `${numeric}`;
  return numeric.toFixed(2);
};

const buildParams = () => {
  const range = Array.isArray(filters.dateRange) ? filters.dateRange : [];
  const startDate = range[0];
  const endDate = range[1];
  const keywordText = typeof filters.keyword === 'string' ? filters.keyword.trim() : '';
  const params = {};

  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  if (keywordText) params.keyword = keywordText;

  return params;
};

const loadSummary = async () => {
  loading.value = true;
  try {
    const params = buildParams();
    const data = await request.get('/reports/points-summary', { params });
    summaryRows.value = Array.isArray(data) ? data : [];
  } catch (error) {
    summaryRows.value = [];
  } finally {
    loading.value = false;
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

  .filter-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 20px;
  }
}
</style>
