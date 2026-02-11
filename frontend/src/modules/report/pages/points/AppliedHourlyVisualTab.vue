<template>
  <div class="applied-hourly-visual-tab">
    <el-card class="filter-card">
      <FilterBar>
        <div class="filter-item">
          <span class="filter-label">统计截止月</span>
          <el-date-picker
            v-model="filters.endMonth"
            type="month"
            value-format="YYYY-MM"
            style="width: 160px"
            @change="load"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">搜索人名</span>
          <el-input
            v-model="searchName"
            placeholder="输入姓名筛选"
            clearable
            style="width: 180px"
            @input="handleSearchName"
          />
        </div>
      </FilterBar>
    </el-card>

    <el-card class="user-select-card">
      <template #header>
        <div class="user-select-header">
          <span class="title">选择人员</span>
          <div class="actions">
            <el-button type="primary" size="small" @click="selectAll">全选</el-button>
            <el-button size="small" @click="clearAll">清除</el-button>
            <span class="selected-count">已选 {{ selectedUserKeys.size }} 人</span>
          </div>
        </div>
      </template>

      <div class="user-buttons">
        <el-button
          v-for="user in pagedUsers"
          :key="user.key"
          :type="selectedUserKeys.has(user.key) ? 'primary' : 'default'"
          :plain="!selectedUserKeys.has(user.key)"
          size="small"
          @click="toggleUser(user.key)"
        >
          {{ user.userName }}
        </el-button>
      </div>

      <div class="user-pagination">
        <el-pagination
          v-model:current-page="userPage"
          v-model:page-size="userPageSize"
          :total="filteredUsers.length"
          :page-sizes="[15, 30, 50, 100]"
          layout="total, sizes, prev, pager, next"
          small
        />
      </div>
    </el-card>

    <div class="charts-layout">
      <el-card class="chart-panel">
        <template #header>
          <div class="panel-header">
            <span class="title">TOP10 应用小时积分</span>
          </div>
        </template>
        <div ref="top10ChartRef" class="chart" />
      </el-card>

      <el-card class="chart-panel">
        <template #header>
          <div class="panel-header">
            <span class="title">全量排名（最多显示100人）</span>
          </div>
        </template>
        <div ref="fullChartRef" class="chart chart-full" />
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import dayjs from 'dayjs';
import * as echarts from 'echarts';

import FilterBar from '@/components/common/FilterBar.vue';
import request from '@/api/request';

const filters = reactive({
  endMonth: dayjs().format('YYYY-MM')
});

const searchName = ref('');
const allRows = ref([]);
const selectedUserKeys = ref(new Set());
const userPage = ref(1);
const userPageSize = ref(15);

const userOptions = computed(() => {
  const rows = Array.isArray(allRows.value) ? allRows.value.slice() : [];
  rows.sort((a, b) => (a.userName ?? '').localeCompare(b.userName ?? ''));
  return rows.map(row => ({ key: row.key, userName: row.userName }));
});

const filteredUsers = computed(() => {
  const keyword = (searchName.value ?? '').trim().toLowerCase();
  if (!keyword) return userOptions.value;
  return userOptions.value.filter(u => (u.userName ?? '').toLowerCase().includes(keyword));
});

const pagedUsers = computed(() => {
  const start = (userPage.value - 1) * userPageSize.value;
  return filteredUsers.value.slice(start, start + userPageSize.value);
});

const selectedRows = computed(() => {
  const keys = selectedUserKeys.value;
  if (keys.size === 0) return [];
  return allRows.value.filter(row => keys.has(row.key));
});

const sortedSelectedRows = computed(() => {
  const rows = selectedRows.value.slice();
  rows.sort((a, b) => {
    const left = Number(a.appliedHourlyPoints);
    const right = Number(b.appliedHourlyPoints);
    const leftOk = Number.isFinite(left);
    const rightOk = Number.isFinite(right);
    if (leftOk && rightOk) return right - left;
    if (rightOk && !leftOk) return 1;
    if (leftOk && !rightOk) return -1;
    return Number(b.totalPoints || 0) - Number(a.totalPoints || 0);
  });
  return rows;
});

const top10Rows = computed(() => sortedSelectedRows.value.slice(0, 10));
const fullRows = computed(() => sortedSelectedRows.value.slice(0, 100));

const handleSearchName = () => {
  userPage.value = 1;
};

const toggleUser = (key) => {
  const keys = new Set(selectedUserKeys.value);
  if (keys.has(key)) {
    keys.delete(key);
  } else {
    keys.add(key);
  }
  selectedUserKeys.value = keys;
};

const selectAll = () => {
  const keys = new Set(filteredUsers.value.map(u => u.key));
  selectedUserKeys.value = keys;
};

const clearAll = () => {
  selectedUserKeys.value = new Set();
};

const buildParams = () => ({
  endMonth: filters.endMonth,
  page: 1,
  pageSize: 5000
});

const normalizeUserKey = (row) => {
  const uid = row?.userId;
  if (uid !== undefined && uid !== null && uid !== '') return String(uid);
  const name = row?.userName ?? '';
  return name ? `name::${name}` : 'unknown';
};

const applyRows = (list) => {
  const rows = (list ?? []).map(row => ({
    key: normalizeUserKey(row),
    userId: row.userId,
    userName: row.userName,
    totalPoints: row.totalPoints,
    totalHours: row.totalHours,
    appliedHourlyPoints: row.appliedHourlyPoints
  }));
  allRows.value = rows;
  // 默认全选
  selectedUserKeys.value = new Set(rows.map(r => r.key));
};

const top10ChartRef = ref(null);
const fullChartRef = ref(null);
let top10ChartInstance = null;
let fullChartInstance = null;

const ensureChart = (refEl, current) => {
  if (!refEl?.value) return null;
  if (current) return current;
  return echarts.init(refEl.value);
};

const renderTop10Chart = () => {
  top10ChartInstance = ensureChart(top10ChartRef, top10ChartInstance);
  if (!top10ChartInstance) return;
  const rows = top10Rows.value;
  const names = rows.map(r => r.userName ?? '');
  top10ChartInstance.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 40, right: 20, top: 20, bottom: 40, containLabel: true },
    xAxis: { type: 'category', data: names, axisLabel: { rotate: 20 } },
    yAxis: { type: 'value' },
    series: [
      {
        name: '应用小时积分',
        type: 'bar',
        data: rows.map(r => {
          const n = Number(r.appliedHourlyPoints);
          return Number.isFinite(n) ? Number(n.toFixed(4)) : 0;
        }),
        itemStyle: { color: '#409EFF' }
      }
    ]
  }, true);
};

const renderFullChart = () => {
  fullChartInstance = ensureChart(fullChartRef, fullChartInstance);
  if (!fullChartInstance) return;
  const rows = fullRows.value;
  const names = rows.map(r => r.userName ?? '');
  fullChartInstance.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 40, right: 20, top: 20, bottom: 60, containLabel: true },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: { rotate: 45, interval: 0, fontSize: 10 }
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '应用小时积分',
        type: 'bar',
        data: rows.map(r => {
          const n = Number(r.appliedHourlyPoints);
          return Number.isFinite(n) ? Number(n.toFixed(4)) : 0;
        }),
        itemStyle: { color: '#67C23A' }
      }
    ]
  }, true);
};

const renderCharts = async () => {
  await nextTick();
  renderTop10Chart();
  renderFullChart();
};

const load = async () => {
  try {
    const resp = await request.get('/reports/applied-hourly-points', { params: buildParams() });
    const list = Array.isArray(resp?.list) ? resp.list : (Array.isArray(resp?.data?.list) ? resp.data.list : []);
    applyRows(list);
    await renderCharts();
  } catch {
    allRows.value = [];
    selectedUserKeys.value = new Set();
  }
};

watch(selectedUserKeys, () => {
  renderCharts();
}, { deep: true });

const handleResize = () => {
  top10ChartInstance?.resize();
  fullChartInstance?.resize();
};

onMounted(async () => {
  await load();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  top10ChartInstance?.dispose();
  fullChartInstance?.dispose();
  top10ChartInstance = null;
  fullChartInstance = null;
});
</script>

<style scoped lang="scss">
.applied-hourly-visual-tab {
  .filter-card {
    margin-bottom: 20px;
  }

  .user-select-card {
    margin-bottom: 20px;

    .user-select-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .title {
        font-weight: 600;
      }

      .actions {
        display: flex;
        align-items: center;
        gap: 10px;

        .selected-count {
          color: #909399;
          font-size: 13px;
        }
      }
    }

    .user-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      min-height: 40px;
    }

    .user-pagination {
      margin-top: 16px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .charts-layout {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .chart-panel {
    .panel-header {
      .title {
        font-weight: 600;
      }
    }

    .chart {
      height: 320px;
      width: 100%;
    }

    .chart-full {
      height: 400px;
    }
  }
}

@media (max-width: 768px) {
  .applied-hourly-visual-tab {
    .user-select-card {
      .user-select-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }
    }
  }
}
</style>
