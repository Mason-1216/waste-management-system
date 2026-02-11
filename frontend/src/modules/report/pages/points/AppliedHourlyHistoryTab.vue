<template>
  <div class="applied-hourly-history-tab">
    <el-card class="filter-card">
      <FilterBar>
        <div class="filter-item">
          <span class="filter-label">姓名</span>
          <el-input
            v-model="filters.userName"
            placeholder="请输入姓名"
            clearable
            style="width: 160px"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="filter-item">
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </div>
      </FilterBar>
    </el-card>

    <TableWrapper>
      <el-table v-loading="loading" :data="rows" stripe border class="history-table">
        <el-table-column prop="userName" label="姓名" min-width="120" fixed="left" />
        <el-table-column
          v-for="month in monthColumns"
          :key="month"
          :prop="month"
          :label="formatMonthLabel(month)"
          min-width="100"
          align="center"
        >
          <template #default="{ row }">
            {{ row[month] ?? '-' }}
          </template>
        </el-table-column>
      </el-table>
    </TableWrapper>

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
import { onMounted, reactive, ref } from 'vue';
import FilterBar from '@/components/common/FilterBar.vue';
import TableWrapper from '@/components/common/TableWrapper.vue';
import request from '@/api/request';

const loading = ref(false);
const rows = ref([]);
const monthColumns = ref([]);
const pagination = reactive({ page: 1, pageSize: 20, total: 0 });

const filters = reactive({
  userName: ''
});

const formatMonthLabel = (month) => {
  // 2026-07 -> 7月
  const parts = month.split('-');
  return parts.length === 2 ? `${parseInt(parts[1], 10)}月` : month;
};

const buildParams = () => {
  const params = {
    page: pagination.page,
    pageSize: pagination.pageSize
  };
  if (filters.userName) params.userName = filters.userName;
  return params;
};

const applyResponse = (payload) => {
  const list = Array.isArray(payload?.list) ? payload.list : [];
  monthColumns.value = Array.isArray(payload?.months) ? payload.months : [];
  rows.value = list;
  const total = Number(payload?.total);
  pagination.total = Number.isFinite(total) ? total : list.length;
};

const load = async () => {
  loading.value = true;
  try {
    const data = await request.get('/reports/applied-hourly-points/history', { params: buildParams() });
    applyResponse(data);
  } catch {
    rows.value = [];
    monthColumns.value = [];
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

onMounted(() => {
  load();
});
</script>

<style lang="scss" scoped>
.applied-hourly-history-tab {
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
