<template>
  <div class="points-cycle-analysis-tab">
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
              v-model="filters.startDate"
              type="date"
              placeholder="全部"
              value-format="YYYY-MM-DD"
              style="width: 160px"
              @change="handleRangeChange"
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
              @change="handleRangeChange"
            />
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

      <div class="pagination-wrapper">
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

    <!-- 日累计积分 -->
    <el-card class="panel">
      <template #header>
        <div class="panel-header">
          <div class="header-left">
            <div class="title">日累计积分</div>
            <span class="subtitle">选定范围内按日统计</span>
          </div>
          <el-radio-group v-model="dailyMode" size="small" @change="renderDailyChart">
            <el-radio-button value="taskCategory">任务类别统计</el-radio-button>
            <el-radio-button value="category">得分大类统计</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <div ref="dailyChartRef" class="chart" />
    </el-card>

    <!-- 月累计积分 -->
    <el-card class="panel">
      <template #header>
        <div class="panel-header">
          <div class="header-left">
            <div class="title">月累计积分</div>
            <span class="subtitle">选定范围内按月统计</span>
          </div>
          <el-radio-group v-model="monthlyMode" size="small" @change="renderMonthlyChart">
            <el-radio-button value="taskCategory">任务类别统计</el-radio-button>
            <el-radio-button value="category">得分大类统计</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <div ref="monthlyChartRef" class="chart" />
    </el-card>

    <!-- 年累计积分 -->
    <el-card class="panel">
      <template #header>
        <div class="panel-header">
          <div class="header-left">
            <div class="title">年累计积分</div>
            <span class="subtitle">选定范围内按年统计</span>
          </div>
          <el-radio-group v-model="yearlyMode" size="small" @change="renderYearlyChart">
            <el-radio-button value="taskCategory">任务类别统计</el-radio-button>
            <el-radio-button value="category">得分大类统计</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <div ref="yearlyChartRef" class="chart" />
    </el-card>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import dayjs from 'dayjs';
import * as echarts from 'echarts';

import FilterBar from '@/components/common/FilterBar.vue';
import FilterAutocomplete from '@/components/common/FilterAutocomplete.vue';
import SimpleFilterBar from '@/components/common/SimpleFilterBar.vue';
import { useSimpleMode } from '@/composables/useSimpleMode';
import request from '@/api/request';

const resolveText = (value) => (typeof value === 'string' ? value.trim() : '');

const buildDefaultRange = () => {
  const now = dayjs();
  const start = now.startOf('month');
  const end = now.endOf('month');
  return { startDate: start.format('YYYY-MM-DD'), endDate: end.format('YYYY-MM-DD') };
};

const normalizeRange = ({ startDate, endDate }) => {
  const startText = resolveText(startDate);
  const endText = resolveText(endDate);

  if (!startText && !endText) {
    return buildDefaultRange();
  }
  if (!startText && endText) {
    return { startDate: endText, endDate: endText };
  }
  if (startText && !endText) {
    return { startDate: startText, endDate: startText };
  }
  if (startText && endText && startText > endText) {
    return { startDate: endText, endDate: startText };
  }
  return { startDate: startText, endDate: endText };
};

const filters = reactive({
  startDate: '',
  endDate: ''
});
const { isSimpleMode, simpleFilterExpanded } = useSimpleMode();
const simpleFilterSummary = computed(() => `当前筛选：开始=${filters.startDate || '全部'} | 结束=${filters.endDate || '全部'}`);

const initDateRange = () => {
  const range = buildDefaultRange();
  filters.startDate = range.startDate;
  filters.endDate = range.endDate;
};

initDateRange();

const allRows = ref([]);
const searchName = ref('');
const selectedUserKeys = ref(new Set());
const userPage = ref(1);
const userPageSize = ref(15);

// 切换模式
const dailyMode = ref('taskCategory');
const monthlyMode = ref('taskCategory');
const yearlyMode = ref('taskCategory');

// 分类配置
const TASK_CATEGORIES = ['Ⅰ类', 'Ⅱ类', 'Ⅲ类', 'Ⅳ类'];
const TASK_CATEGORY_COLORS = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C'];

const SCORE_CATEGORIES = [
  { key: 'safety', label: '安全', color: '#409EFF' },
  { key: 'hygiene', label: '卫生', color: '#67C23A' },
  { key: 'repair', label: '维修', color: '#E6A23C' },
  { key: 'maintenance', label: '保养', color: '#909399' },
  { key: 'fixed', label: '固定工作', color: '#9B59B6' },
  { key: 'dispatch', label: '临时任务', color: '#E91E63' },
  { key: 'selfApply', label: '自行申请', color: '#1ABC9C' }
];

// 人员选择相关
const normalizeUserKey = (row) => {
  const uid = row?.userId;
  if (uid !== undefined && uid !== null && uid !== '') return String(uid);
  const name = row?.userName ?? '';
  return name ? `name::${name}` : 'unknown';
};

const userOptions = computed(() => {
  const rows = Array.isArray(allRows.value) ? allRows.value.slice() : [];
  rows.sort((a, b) => (a.userName ?? '').localeCompare(b.userName ?? ''));
  return rows.map(row => ({ key: normalizeUserKey(row), userName: row.userName, userId: row.userId }));
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

const buildParams = () => {
  const { startDate, endDate } = normalizeRange({ startDate: filters.startDate, endDate: filters.endDate });
  return { startDate, endDate };
};

const dailyChartRef = ref(null);
const monthlyChartRef = ref(null);
const yearlyChartRef = ref(null);

let dailyChartInstance = null;
let monthlyChartInstance = null;
let yearlyChartInstance = null;

const ensureChart = (refEl, current) => {
  if (!refEl?.value) return null;
  if (current) return current;
  return echarts.init(refEl.value);
};

// 提取日期的 dayData（兼容新旧数据结构）
const extractDayData = (dayValue) => {
  if (typeof dayValue === 'number') {
    // 旧数据结构：直接是数字
    return { total: dayValue, byCategory: {}, byTaskCategory: {} };
  }
  if (typeof dayValue === 'object' && dayValue !== null) {
    return {
      total: dayValue.total ?? 0,
      byCategory: dayValue.byCategory ?? {},
      byTaskCategory: dayValue.byTaskCategory ?? {}
    };
  }
  return { total: 0, byCategory: {}, byTaskCategory: {} };
};

// 按日统计：找出每天的最大值/最小值人员及其分类明细，计算平均值
const computeDailyStackedData = (mode) => {
  const rows = selectedRows.value;
  if (rows.length === 0) return { periods: [], maxSeries: [], minSeries: [], avgData: [] };

  const { startDate, endDate } = normalizeRange({ startDate: filters.startDate, endDate: filters.endDate });
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const dayCount = end.diff(start, 'day') + 1;

  // 生成日期列表
  const periods = [];
  for (let i = 0; i < dayCount; i++) {
    periods.push(start.add(i, 'day').format('YYYY-MM-DD'));
  }

  // 每个日期找出最大值/最小值人员的分类明细
  const maxDetails = []; // 每个日期最大值人员的分类明细
  const minDetails = []; // 每个日期最小值人员的分类明细
  const avgData = []; // 每个日期的平均值

  periods.forEach(date => {
    let maxTotal = -Infinity;
    let minTotal = Infinity;
    let maxDayData = null;
    let minDayData = null;
    let sum = 0;
    let count = 0;

    rows.forEach(row => {
      const dailyPoints = row.dailyPoints ?? {};
      if (dailyPoints[date] !== undefined) {
        const dayData = extractDayData(dailyPoints[date]);
        const total = dayData.total;
        sum += total;
        count++;

        if (total > maxTotal) {
          maxTotal = total;
          maxDayData = dayData;
        }
        if (total < minTotal) {
          minTotal = total;
          minDayData = dayData;
        }
      }
    });

    maxDetails.push(maxDayData ?? { total: 0, byCategory: {}, byTaskCategory: {} });
    minDetails.push(minDayData ?? { total: 0, byCategory: {}, byTaskCategory: {} });
    avgData.push(count > 0 ? Math.round((sum / count) * 100) / 100 : 0);
  });

  return buildStackedSeriesWithExtreme(periods, maxDetails, minDetails, avgData, mode);
};

// 按月统计
const computeMonthlyStackedData = (mode) => {
  const rows = selectedRows.value;
  if (rows.length === 0) return { periods: [], maxSeries: [], minSeries: [], avgData: [] };

  const { startDate, endDate } = normalizeRange({ startDate: filters.startDate, endDate: filters.endDate });
  const start = dayjs(startDate).startOf('month');
  const end = dayjs(endDate).endOf('month');

  // 生成月份列表
  const periods = [];
  let current = start;
  while (current.isBefore(end) || current.isSame(end, 'month')) {
    periods.push(current.format('YYYY-MM'));
    current = current.add(1, 'month');
  }

  // 先按用户按月汇总
  const userMonthlyData = new Map(); // userId -> { month -> dayData }
  rows.forEach(row => {
    const key = row.userId ?? row.userName;
    const dailyPoints = row.dailyPoints ?? {};
    const monthMap = new Map();

    Object.entries(dailyPoints).forEach(([date, dayValue]) => {
      const month = dayjs(date).format('YYYY-MM');
      const dayData = extractDayData(dayValue);
      if (!monthMap.has(month)) {
        monthMap.set(month, { total: 0, byCategory: {}, byTaskCategory: {} });
      }
      const target = monthMap.get(month);
      target.total += dayData.total;
      Object.entries(dayData.byCategory).forEach(([k, v]) => {
        target.byCategory[k] = (target.byCategory[k] ?? 0) + v;
      });
      Object.entries(dayData.byTaskCategory).forEach(([k, v]) => {
        target.byTaskCategory[k] = (target.byTaskCategory[k] ?? 0) + v;
      });
    });

    userMonthlyData.set(key, monthMap);
  });

  // 每个月份找出最大值/最小值
  const maxDetails = [];
  const minDetails = [];
  const avgData = [];

  periods.forEach(month => {
    let maxTotal = -Infinity;
    let minTotal = Infinity;
    let maxDayData = null;
    let minDayData = null;
    let sum = 0;
    let count = 0;

    userMonthlyData.forEach(monthMap => {
      if (monthMap.has(month)) {
        const data = monthMap.get(month);
        const total = data.total;
        sum += total;
        count++;

        if (total > maxTotal) {
          maxTotal = total;
          maxDayData = data;
        }
        if (total < minTotal) {
          minTotal = total;
          minDayData = data;
        }
      }
    });

    maxDetails.push(maxDayData ?? { total: 0, byCategory: {}, byTaskCategory: {} });
    minDetails.push(minDayData ?? { total: 0, byCategory: {}, byTaskCategory: {} });
    avgData.push(count > 0 ? Math.round((sum / count) * 100) / 100 : 0);
  });

  return buildStackedSeriesWithExtreme(periods, maxDetails, minDetails, avgData, mode);
};

// 按年统计
const computeYearlyStackedData = (mode) => {
  const rows = selectedRows.value;
  if (rows.length === 0) return { periods: [], maxSeries: [], minSeries: [], avgData: [] };

  const { startDate, endDate } = normalizeRange({ startDate: filters.startDate, endDate: filters.endDate });
  const startYear = dayjs(startDate).year();
  const endYear = dayjs(endDate).year();

  // 生成年份列表
  const periods = [];
  for (let y = startYear; y <= endYear; y++) {
    periods.push(String(y));
  }

  // 先按用户按年汇总
  const userYearlyData = new Map();
  rows.forEach(row => {
    const key = row.userId ?? row.userName;
    const dailyPoints = row.dailyPoints ?? {};
    const yearMap = new Map();

    Object.entries(dailyPoints).forEach(([date, dayValue]) => {
      const year = String(dayjs(date).year());
      const dayData = extractDayData(dayValue);
      if (!yearMap.has(year)) {
        yearMap.set(year, { total: 0, byCategory: {}, byTaskCategory: {} });
      }
      const target = yearMap.get(year);
      target.total += dayData.total;
      Object.entries(dayData.byCategory).forEach(([k, v]) => {
        target.byCategory[k] = (target.byCategory[k] ?? 0) + v;
      });
      Object.entries(dayData.byTaskCategory).forEach(([k, v]) => {
        target.byTaskCategory[k] = (target.byTaskCategory[k] ?? 0) + v;
      });
    });

    userYearlyData.set(key, yearMap);
  });

  // 每个年份找出最大值/最小值
  const maxDetails = [];
  const minDetails = [];
  const avgData = [];

  periods.forEach(year => {
    let maxTotal = -Infinity;
    let minTotal = Infinity;
    let maxDayData = null;
    let minDayData = null;
    let sum = 0;
    let count = 0;

    userYearlyData.forEach(yearMap => {
      if (yearMap.has(year)) {
        const data = yearMap.get(year);
        const total = data.total;
        sum += total;
        count++;

        if (total > maxTotal) {
          maxTotal = total;
          maxDayData = data;
        }
        if (total < minTotal) {
          minTotal = total;
          minDayData = data;
        }
      }
    });

    maxDetails.push(maxDayData ?? { total: 0, byCategory: {}, byTaskCategory: {} });
    minDetails.push(minDayData ?? { total: 0, byCategory: {}, byTaskCategory: {} });
    avgData.push(count > 0 ? Math.round((sum / count) * 100) / 100 : 0);
  });

  return buildStackedSeriesWithExtreme(periods, maxDetails, minDetails, avgData, mode);
};

// 构建带极值的堆积柱状图 series
const buildStackedSeriesWithExtreme = (periods, maxDetails, minDetails, avgData, mode) => {
  const categories = mode === 'taskCategory' ? TASK_CATEGORIES : SCORE_CATEGORIES.map(c => c.key);
  const colors = mode === 'taskCategory' ? TASK_CATEGORY_COLORS : SCORE_CATEGORIES.map(c => c.color);
  const labels = mode === 'taskCategory' ? TASK_CATEGORIES : SCORE_CATEGORIES.map(c => c.label);
  const sourceKey = mode === 'taskCategory' ? 'byTaskCategory' : 'byCategory';

  // 最大值堆积柱（实色 + 灰色边框）
  const maxSeries = categories.map((cat, idx) => ({
    name: labels[idx],
    type: 'bar',
    stack: 'max',
    data: maxDetails.map(d => d[sourceKey][cat] ?? 0),
    itemStyle: {
      color: colors[idx],
      borderColor: '#909399',
      borderWidth: 2
    },
    barGap: '30%',
    barCategoryGap: '40%'
  }));

  // 最小值堆积柱（半透明 + 橙红边框）
  const minSeries = categories.map((cat, idx) => ({
    name: '_min_' + labels[idx],
    type: 'bar',
    stack: 'min',
    data: minDetails.map(d => d[sourceKey][cat] ?? 0),
    itemStyle: {
      color: colors[idx],
      opacity: 0.5,
      borderColor: '#E74C3C',
      borderWidth: 2
    },
    barGap: '30%',
    barCategoryGap: '40%'
  }));

  // 平均值折线
  const avgSeries = {
    name: '平均值',
    type: 'line',
    data: avgData,
    smooth: true,
    lineStyle: { color: '#303133', width: 2, type: 'dashed' },
    itemStyle: { color: '#303133' },
    symbol: 'circle',
    symbolSize: 6
  };

  return {
    periods,
    series: [...maxSeries, ...minSeries, avgSeries],
    legendData: [...labels, '平均值'],
    labels,
    sourceKey
  };
};

// 渲染堆积柱状图
const renderStackedChart = (chartInstance, data) => {
  if (!chartInstance) return;

  const { periods, series, legendData, labels, sourceKey } = data;

  chartInstance.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const period = params[0]?.axisValue ?? '';
        let html = `<div style="font-weight:600;margin-bottom:8px">${period}</div>`;

        // 分组：最大值、最小值、平均值
        const maxItems = params.filter(p => !p.seriesName.startsWith('_min_') && p.seriesName !== '平均值');
        const minItems = params.filter(p => p.seriesName.startsWith('_min_'));
        const avgItem = params.find(p => p.seriesName === '平均值');

        // 最大值
        let maxTotal = 0;
        html += '<div style="margin-bottom:4px"><b>最大值</b></div>';
        maxItems.forEach(p => {
          if (p.value !== 0) {
            html += `<div style="padding-left:8px">${p.marker} ${p.seriesName}: ${p.value}</div>`;
            maxTotal += p.value;
          }
        });
        html += `<div style="padding-left:8px;font-weight:600">合计: ${maxTotal}</div>`;

        // 最小值
        let minTotal = 0;
        html += '<div style="margin-top:8px;margin-bottom:4px"><b>最小值</b></div>';
        minItems.forEach(p => {
          const label = p.seriesName.replace('_min_', '');
          if (p.value !== 0) {
            html += `<div style="padding-left:8px">${p.marker} ${label}: ${p.value}</div>`;
            minTotal += p.value;
          }
        });
        html += `<div style="padding-left:8px;font-weight:600">合计: ${minTotal}</div>`;

        // 平均值
        if (avgItem) {
          html += `<div style="margin-top:8px">${avgItem.marker} 平均值: ${avgItem.value}</div>`;
        }

        return html;
      }
    },
    legend: {
      top: 0,
      left: 'center',
      data: legendData,
      formatter: (name) => {
        if (name.startsWith('_min_')) return '';
        return name;
      }
    },
    // 示意图例：带坐标轴的两个空心柱子
    graphic: [
      // Y轴（纵轴）
      {
        type: 'line',
        right: 64,
        top: -6,
        shape: { x1: 0, y1: 0, x2: 0, y2: 36 },
        style: { stroke: '#909399', lineWidth: 1 }
      },
      // X轴（横轴）
      {
        type: 'line',
        right: 2,
        top: 30,
        shape: { x1: 0, y1: 0, x2: 62, y2: 0 },
        style: { stroke: '#909399', lineWidth: 1 }
      },
      // 最大值柱子（空心，灰色边框）
      {
        type: 'rect',
        right: 38,
        top: 0,
        shape: { width: 16, height: 30 },
        style: { fill: 'transparent', stroke: '#909399', lineWidth: 2 }
      },
      // 最小值柱子（空心，橙红边框）
      {
        type: 'rect',
        right: 14,
        top: 10,
        shape: { width: 16, height: 20 },
        style: { fill: 'transparent', stroke: '#E74C3C', lineWidth: 2 }
      },
      // 最大值文字
      {
        type: 'text',
        right: 34,
        top: 34,
        style: { text: '最大', fill: '#606266', fontSize: 10 }
      },
      // 最小值文字
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
      data: periods,
      axisLabel: { rotate: periods.length > 15 ? 45 : 0 }
    },
    yAxis: { type: 'value', name: '积分' },
    series
  }, true);
};

const renderDailyChart = () => {
  dailyChartInstance = ensureChart(dailyChartRef, dailyChartInstance);
  const data = computeDailyStackedData(dailyMode.value);
  renderStackedChart(dailyChartInstance, data);
};

const renderMonthlyChart = () => {
  monthlyChartInstance = ensureChart(monthlyChartRef, monthlyChartInstance);
  const data = computeMonthlyStackedData(monthlyMode.value);
  renderStackedChart(monthlyChartInstance, data);
};

const renderYearlyChart = () => {
  yearlyChartInstance = ensureChart(yearlyChartRef, yearlyChartInstance);
  const data = computeYearlyStackedData(yearlyMode.value);
  renderStackedChart(yearlyChartInstance, data);
};

const renderCharts = async () => {
  await nextTick();
  renderDailyChart();
  renderMonthlyChart();
  renderYearlyChart();
};

const load = async () => {
  try {
    const data = await request.get('/reports/points-cycle-analysis', { params: buildParams() });
    const payload = data?.data ?? data;
    const list = Array.isArray(payload?.list) ? payload.list : (Array.isArray(payload) ? payload : []);
    allRows.value = list;
    // 默认全选所有人员
    selectedUserKeys.value = new Set(list.map(row => normalizeUserKey(row)));
    renderCharts();
  } catch {
    allRows.value = [];
    selectedUserKeys.value = new Set();
    renderCharts();
  }
};

const handleRangeChange = () => {
  const range = normalizeRange({ startDate: filters.startDate, endDate: filters.endDate });
  filters.startDate = range.startDate;
  filters.endDate = range.endDate;
  load();
};

const handleResize = () => {
  dailyChartInstance?.resize();
  monthlyChartInstance?.resize();
  yearlyChartInstance?.resize();
};

watch(selectedUserKeys, () => renderCharts(), { deep: true });

onMounted(() => {
  window.addEventListener('resize', handleResize);
  load();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  dailyChartInstance?.dispose?.();
  monthlyChartInstance?.dispose?.();
  yearlyChartInstance?.dispose?.();
  dailyChartInstance = null;
  monthlyChartInstance = null;
  yearlyChartInstance = null;
});
</script>

<style lang="scss" scoped>
.points-cycle-analysis-tab {
  .filter-card {
    margin-bottom: 12px;
  }

  .user-select-card {
    margin-bottom: 12px;

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

    .pagination-wrapper {
      margin-top: 16px;
    }
  }

  .panel {
    margin-bottom: 12px;

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;

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
  }

  .chart {
    height: 360px;
    width: 100%;
  }

  @media (max-width: 768px) {
    .chart {
      height: 280px;
    }

    .panel-header {
      flex-direction: column;
      align-items: flex-start !important;
    }
  }
}
</style>
