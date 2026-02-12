<template>
  <div class="applied-hourly-visual-tab">
    <el-card class="filter-card">
      <SimpleFilterBar
        :enabled="isSimpleMode"
        v-model:expanded="simpleFilterExpanded"
        :summary-text="simpleFilterSummary"
      >
        <FilterBar>
          <div class="filter-item">
            <span class="filter-label">年份</span>
            <FilterSelect v-model="filters.year" style="width: 140px" @change="load">
              <el-option v-for="year in yearOptions" :key="year" :label="`${year}年`" :value="year" />
            </FilterSelect>
          </div>
        </FilterBar>
      </SimpleFilterBar>
    </el-card>

    <el-card class="user-select-card">
      <template #header>
        <div class="user-select-header">
          <span class="title">选择人员</span>
          <div class="actions">
            <FilterAutocomplete
              v-model="searchName"
              :fetch-suggestions="fetchUserNameSuggestions"
              trigger-on-focus
              clearable
              placeholder="输入姓名筛选"
              style="width: 180px"
              @select="handleSearchName"
              @input="handleSearchName"
              @clear="handleSearchName"
            />
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
            <div class="header-left">
              <div class="title">实际应用小时积分</div>
              <span class="subtitle">按月最大值 / 最小值 / 平均值</span>
            </div>
          </div>
        </template>
        <div ref="actualChartRef" class="chart" />
      </el-card>

      <el-card class="chart-panel">
        <template #header>
          <div class="panel-header">
            <div class="header-left">
              <div class="title">修正应用小时积分</div>
              <span class="subtitle">按月最大值 / 最小值 / 平均值</span>
            </div>
          </div>
        </template>
        <div ref="adjustedChartRef" class="chart" />
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, reactive, watch } from 'vue';
import dayjs from 'dayjs';
import * as echarts from 'echarts';

import FilterAutocomplete from '@/components/common/FilterAutocomplete.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import FilterSelect from '@/components/common/FilterSelect.vue';
import SimpleFilterBar from '@/components/common/SimpleFilterBar.vue';
import { useSimpleMode } from '@/composables/useSimpleMode';
import request from '@/api/request';

const currentYear = dayjs().year();
const yearOptions = computed(() => {
  const years = [];
  for (let year = currentYear; year >= currentYear - 5; year -= 1) {
    years.push(year);
  }
  return years;
});

const filters = reactive({
  year: currentYear
});
const { isSimpleMode, simpleFilterExpanded } = useSimpleMode();
const simpleFilterSummary = computed(() => `当前筛选：年份=${filters.year}`);

const monthColumns = ref([]);
const allRows = ref([]);
const searchName = ref('');
const selectedUserKeys = ref(new Set());
const userPage = ref(1);
const userPageSize = ref(15);

const normalizeUserKey = (row) => {
  const uid = row?.userId;
  if (uid !== undefined && uid !== null && uid !== '') return String(uid);
  const name = row?.userName ?? '';
  return name ? `name::${name}` : 'unknown';
};

const buildEndMonth = () => {
  return `${filters.year}-12`;
};

const userOptions = computed(() => {
  const rows = Array.isArray(allRows.value) ? allRows.value.slice() : [];
  rows.sort((a, b) => (a.userName ?? '').localeCompare(b.userName ?? ''));
  return rows.map(row => ({ key: normalizeUserKey(row), userName: row.userName }));
});

const fetchUserNameSuggestions = (queryString, callback) => {
  const query = typeof queryString === 'string' ? queryString.trim().toLowerCase() : '';
  const list = Array.isArray(userOptions.value) ? userOptions.value : [];
  const matched = query
    ? list.filter(item => (item.userName ?? '').toLowerCase().includes(query))
    : list;
  callback(matched.slice(0, 50).map(item => ({ value: item.userName })));
};

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
  return allRows.value.filter(row => keys.has(normalizeUserKey(row)));
});

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

const formatMonthLabel = (month) => {
  const parts = String(month).split('-');
  if (parts.length !== 2) return month;
  return `${parseInt(parts[1], 10)}月`;
};

const toNumericOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return null;
  return numberValue;
};

const toFixed2 = (value) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 0;
  return Number(numberValue.toFixed(2));
};

const buildExtremeData = (valueKey) => {
  const periods = monthColumns.value.map(month => formatMonthLabel(month));
  const maxData = [];
  const minData = [];
  const avgData = [];

  monthColumns.value.forEach((month) => {
    const values = [];
    selectedRows.value.forEach((row) => {
      const source = row?.[valueKey] ?? {};
      const value = toNumericOrNull(source[month]);
      if (value !== null) {
        values.push(value);
      }
    });

    if (values.length === 0) {
      maxData.push(0);
      minData.push(0);
      avgData.push(0);
      return;
    }

    const sum = values.reduce((acc, value) => acc + value, 0);
    maxData.push(toFixed2(Math.max(...values)));
    minData.push(toFixed2(Math.min(...values)));
    avgData.push(toFixed2(sum / values.length));
  });

  return {
    periods,
    maxData,
    minData,
    avgData
  };
};

const actualChartRef = ref(null);
const adjustedChartRef = ref(null);
let actualChartInstance = null;
let adjustedChartInstance = null;

const ensureChart = (refEl, current) => {
  if (!refEl?.value) return null;
  if (current) return current;
  return echarts.init(refEl.value);
};

const renderExtremeChart = (chartInstance, data) => {
  if (!chartInstance) return;

  chartInstance.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const period = params[0]?.axisValue ?? '';
        const maxItem = params.find(item => item.seriesName === '最大值');
        const minItem = params.find(item => item.seriesName === '最小值');
        const avgItem = params.find(item => item.seriesName === '平均值');

        let html = `<div style="font-weight:600;margin-bottom:8px">${period}</div>`;
        if (maxItem) {
          html += `<div>${maxItem.marker} 最大值: ${maxItem.value}</div>`;
        }
        if (minItem) {
          html += `<div>${minItem.marker} 最小值: ${minItem.value}</div>`;
        }
        if (avgItem) {
          html += `<div>${avgItem.marker} 平均值: ${avgItem.value}</div>`;
        }
        return html;
      }
    },
    legend: {
      top: 0,
      left: 'center',
      data: ['最大值', '最小值', '平均值']
    },
    graphic: [
      {
        type: 'line',
        right: 64,
        top: -6,
        shape: { x1: 0, y1: 0, x2: 0, y2: 36 },
        style: { stroke: '#909399', lineWidth: 1 }
      },
      {
        type: 'line',
        right: 2,
        top: 30,
        shape: { x1: 0, y1: 0, x2: 62, y2: 0 },
        style: { stroke: '#909399', lineWidth: 1 }
      },
      {
        type: 'rect',
        right: 38,
        top: 0,
        shape: { width: 16, height: 30 },
        style: { fill: 'transparent', stroke: '#909399', lineWidth: 2 }
      },
      {
        type: 'rect',
        right: 14,
        top: 10,
        shape: { width: 16, height: 20 },
        style: { fill: 'transparent', stroke: '#E74C3C', lineWidth: 2 }
      },
      {
        type: 'text',
        right: 34,
        top: 34,
        style: { text: '最大', fill: '#606266', fontSize: 10 }
      },
      {
        type: 'text',
        right: 10,
        top: 34,
        style: { text: '最小', fill: '#606266', fontSize: 10 }
      }
    ],
    grid: { left: 50, right: 30, top: 60, bottom: 40, containLabel: true },
    xAxis: {
      type: 'category',
      data: data.periods,
      axisLabel: { rotate: data.periods.length > 8 ? 30 : 0 }
    },
    yAxis: { type: 'value', name: '积分' },
    series: [
      {
        name: '最大值',
        type: 'bar',
        data: data.maxData,
        barWidth: 22,
        itemStyle: {
          color: '#409EFF',
          borderColor: '#909399',
          borderWidth: 2
        }
      },
      {
        name: '最小值',
        type: 'bar',
        data: data.minData,
        barWidth: 22,
        itemStyle: {
          color: 'rgba(245, 108, 108, 0.5)',
          borderColor: '#E74C3C',
          borderWidth: 2
        }
      },
      {
        name: '平均值',
        type: 'line',
        data: data.avgData,
        smooth: true,
        lineStyle: { color: '#303133', width: 2, type: 'dashed' },
        itemStyle: { color: '#303133' },
        symbol: 'circle',
        symbolSize: 6
      }
    ]
  }, true);
};

const renderCharts = async () => {
  await nextTick();

  actualChartInstance = ensureChart(actualChartRef, actualChartInstance);
  adjustedChartInstance = ensureChart(adjustedChartRef, adjustedChartInstance);

  renderExtremeChart(actualChartInstance, buildExtremeData('actualPoints'));
  renderExtremeChart(adjustedChartInstance, buildExtremeData('adjustedPoints'));
};

const fetchPage = async ({ page, pageSize }) => {
  return request.get('/reports/applied-hourly-points/history', {
    params: {
      endMonth: buildEndMonth(),
      page,
      pageSize
    }
  });
};

const loadAllRows = async () => {
  const pageSize = 500;
  let page = 1;
  let total = 0;
  let loaded = 0;
  let months = [];
  const merged = [];

  while (page <= 200) {
    const payload = await fetchPage({ page, pageSize });
    const list = Array.isArray(payload?.list) ? payload.list : [];
    const payloadMonths = Array.isArray(payload?.months) ? payload.months : [];

    if (page === 1) {
      months = payloadMonths;
      const numericTotal = Number(payload?.total);
      total = Number.isFinite(numericTotal) ? numericTotal : list.length;
    }

    merged.push(...list);
    loaded += list.length;

    if (list.length === 0) break;
    if (loaded >= total) break;

    page += 1;
  }

  return { list: merged, months };
};

const load = async () => {
  try {
    const payload = await loadAllRows();
    allRows.value = payload.list;
    monthColumns.value = payload.months;
    selectedUserKeys.value = new Set(payload.list.map(row => normalizeUserKey(row)));
    await renderCharts();
  } catch {
    allRows.value = [];
    monthColumns.value = [];
    selectedUserKeys.value = new Set();
    await renderCharts();
  }
};

watch(selectedUserKeys, () => {
  renderCharts();
}, { deep: true });

const handleResize = () => {
  actualChartInstance?.resize();
  adjustedChartInstance?.resize();
};

onMounted(async () => {
  await load();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  actualChartInstance?.dispose();
  adjustedChartInstance?.dispose();
  actualChartInstance = null;
  adjustedChartInstance = null;
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
        flex-wrap: wrap;

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
      .header-left {
        display: flex;
        align-items: center;
        gap: 10px;

        .title {
          font-weight: 600;
        }

        .subtitle {
          color: #909399;
          font-size: 13px;
        }
      }
    }

    .chart {
      height: 360px;
      width: 100%;
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

    .chart-panel {
      .panel-header {
        .header-left {
          flex-direction: column;
          align-items: flex-start;
        }
      }

      .chart {
        height: 300px;
      }
    }
  }
}
</style>
