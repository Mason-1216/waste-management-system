<template>
  <div class="points-visual-page">
    <div class="page-header">
      <h2>积分可视化分析</h2>
      <div class="header-actions">
        <el-button @click="goBack">返回</el-button>
      </div>
    </div>

    <el-card class="filter-card">
      <FilterBar>
        <div class="filter-item">
          <span class="filter-label">可视化维度</span>
          <el-select v-model="filters.viewMode" style="width: 140px" @change="handleViewModeChange">
            <el-option label="得分大类" value="score" />
            <el-option label="任务类别" value="taskCategory" />
          </el-select>
        </div>

        <div class="filter-item">
          <span class="filter-label">统计维度</span>
          <el-select v-model="filters.cycle" style="width: 140px" @change="handleCycleChange">
            <el-option label="日" value="day" />
            <el-option label="周" value="week" />
            <el-option label="月" value="month" />
            <el-option label="年" value="year" />
          </el-select>
        </div> 
 
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
 
        <div class="filter-item"> 
          <span class="filter-label">姓名</span> 
          <el-select v-model="selectedUserId" filterable style="width: 180px" @change="renderCharts"> 
            <el-option v-for="u in userOptions" :key="u.userId ?? u.userName" :label="u.userName" :value="u.userId ?? u.userName" /> 
          </el-select> 
        </div>
      </FilterBar>
    </el-card>

    <div class="layout">
      <el-card class="panel">
        <template #header>
          <div class="panel-header">
            <div class="title">Top10 积分（分层堆叠）</div>
          </div>
        </template>
        <div ref="top10ChartRef" class="chart" />
      </el-card>

      <el-card class="panel">
        <template #header>
          <div class="panel-header">
            <div class="title">个人分类积分（分层堆叠）</div>
          </div>
        </template>
        <div ref="userChartRef" class="chart" />
      </el-card>
    </div>

    <el-card class="panel order-panel">
      <template #header>
        <div class="panel-header">
          <div class="title">{{ orderPanelTitle }}</div>
        </div>
      </template>

      <div class="order-list">
        <div v-for="(item, index) in orderedLayers" :key="item.code" class="order-item">
          <div class="name">{{ item.label }}</div>
          <div class="ops">
            <el-button :disabled="index === 0" @click="moveUp(index)">上移</el-button>
            <el-button :disabled="index === orderedLayers.length - 1" @click="moveDown(index)">下移</el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import dayjs from 'dayjs';
import * as echarts from 'echarts';
import { useRoute, useRouter } from 'vue-router';

import FilterBar from '@/components/common/FilterBar.vue';
import request from '@/api/request';

const route = useRoute(); 
const router = useRouter(); 
 
const VIEW_MODE_SCORE = 'score'; 
const VIEW_MODE_TASK_CATEGORY = 'taskCategory'; 
 
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

const SCORE_CATEGORY_DEFAULT_ORDER = ['safety', 'hygiene', 'repair', 'maintenance', 'fixed', 'dispatch', 'selfApply', 'deduction'];
const SCORE_CATEGORY_LABELS = [
  { code: 'safety', label: '安全' },
  { code: 'hygiene', label: '卫生' },
  { code: 'repair', label: '维修' },
  { code: 'maintenance', label: '保养' },
  { code: 'fixed', label: '固定工作' },
  { code: 'dispatch', label: '临时任务' },
  { code: 'selfApply', label: '自行申请' },
  { code: 'deduction', label: '扣分' }
];

const SCORE_ORDER_STORAGE_KEY = 'points-visual-category-order';
const TASK_CATEGORY_ORDER_STORAGE_KEY = 'points-visual-task-category-order';

const resolveViewMode = (value) => {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text === VIEW_MODE_SCORE || text === VIEW_MODE_TASK_CATEGORY) return text;
  return VIEW_MODE_SCORE;
};

const loadStoredScoreOrder = () => {
  try {
    const raw = localStorage.getItem(SCORE_ORDER_STORAGE_KEY);
    if (!raw) return SCORE_CATEGORY_DEFAULT_ORDER.slice();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SCORE_CATEGORY_DEFAULT_ORDER.slice();
    const filtered = parsed.filter(code => SCORE_CATEGORY_DEFAULT_ORDER.includes(code));
    const missing = SCORE_CATEGORY_DEFAULT_ORDER.filter(code => !filtered.includes(code));
    return [...filtered, ...missing];
  } catch {
    return SCORE_CATEGORY_DEFAULT_ORDER.slice();
  }
};

const saveStoredScoreOrder = (value) => {
  try {
    localStorage.setItem(SCORE_ORDER_STORAGE_KEY, JSON.stringify(value));
  } catch {
  }
};

const loadStoredTaskCategoryOrder = () => {
  try {
    const raw = localStorage.getItem(TASK_CATEGORY_ORDER_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(item => (typeof item === 'string' ? item.trim() : '')).filter(Boolean);
  } catch {
    return [];
  }
};

const saveStoredTaskCategoryOrder = (value) => {
  try {
    localStorage.setItem(TASK_CATEGORY_ORDER_STORAGE_KEY, JSON.stringify(value));
  } catch {
  }
};

const filters = reactive({ 
  viewMode: resolveViewMode(route.query?.viewMode), 
  cycle: typeof route.query?.cycle === 'string' ? route.query.cycle : 'day', 
  startDate: '', 
  endDate: '' 
}); 
 
const initDateRange = () => { 
  const range = buildDefaultRange(filters.cycle); 
  const startFromQuery = typeof route.query?.startDate === 'string' ? route.query.startDate : ''; 
  const endFromQuery = typeof route.query?.endDate === 'string' ? route.query.endDate : ''; 
  const normalized = normalizeRange({ cycle: filters.cycle, startDate: startFromQuery ? startFromQuery : range.startDate, endDate: endFromQuery ? endFromQuery : range.endDate }); 
  filters.startDate = normalized.startDate; 
  filters.endDate = normalized.endDate; 
}; 
 
initDateRange(); 

const scoreCategoryOrder = ref(loadStoredScoreOrder());
const taskCategoryOrder = ref(loadStoredTaskCategoryOrder());

const allRows = ref([]);
const selectedUserId = ref(null);

const taskCategoryTotals = computed(() => {
  const rows = Array.isArray(allRows.value) ? allRows.value : [];
  const map = new Map();
  rows.forEach((row) => {
    const breakdown = row?.breakdown && typeof row.breakdown === 'object' ? row.breakdown : {};
    Object.entries(breakdown).forEach(([key, value]) => {
      const name = typeof key === 'string' ? key.trim() : '';
      if (!name) return;
      const points = Number(value);
      const next = Number.isFinite(points) ? points : 0;
      map.set(name, (map.get(name) || 0) + next);
    });
  });
  const list = Array.from(map.entries()).map(([name, total]) => ({ name, total }));
  list.sort((a, b) => Number(b.total) - Number(a.total) || a.name.localeCompare(b.name));
  return list;
});

const ensureTaskCategoryOrder = () => {
  const available = taskCategoryTotals.value.map(item => item.name);
  if (available.length === 0) return;
  const stored = Array.isArray(taskCategoryOrder.value) ? taskCategoryOrder.value : [];
  const filtered = stored.filter(name => available.includes(name));
  const missing = available.filter(name => !filtered.includes(name));
  const next = [...filtered, ...missing];
  taskCategoryOrder.value = next;
  saveStoredTaskCategoryOrder(next);
};

const orderedLayers = computed(() => {
  if (filters.viewMode === VIEW_MODE_TASK_CATEGORY) {
    const names = Array.isArray(taskCategoryOrder.value) ? taskCategoryOrder.value : [];
    return names.map(name => ({ code: name, label: name }));
  }
  const map = new Map(SCORE_CATEGORY_LABELS.map(item => [item.code, item]));
  return scoreCategoryOrder.value.map(code => map.get(code)).filter(Boolean);
});

const orderPanelTitle = computed(() => {
  return filters.viewMode === VIEW_MODE_TASK_CATEGORY ? '任务类别层顺序' : '得分大类层顺序';
});

const top10Rows = computed(() => {
  const rows = Array.isArray(allRows.value) ? allRows.value.slice() : [];
  rows.sort((a, b) => Number(b.total || 0) - Number(a.total || 0));
  return rows.slice(0, 10);
});

const userOptions = computed(() => {
  const rows = Array.isArray(allRows.value) ? allRows.value.slice() : [];
  rows.sort((a, b) => (a.userName ?? '').localeCompare(b.userName ?? ''));
  return rows;
});

const selectedRow = computed(() => {
  const id = selectedUserId.value;
  if (!id) return null;
  return (allRows.value ?? []).find(item => (item.userId ?? item.userName) === id) ?? null;
});

const buildParams = () => { 
  const { startDate, endDate } = normalizeRange({ cycle: filters.cycle, startDate: filters.startDate, endDate: filters.endDate }); 
  return { 
    startDate, 
    endDate, 
    cycle: filters.cycle 
  }; 
}; 

const top10ChartRef = ref(null);
const userChartRef = ref(null);
let top10ChartInstance = null;
let userChartInstance = null;

const ensureChart = (refEl, current) => {
  if (!refEl?.value) return null;
  if (current) return current;
  return echarts.init(refEl.value);
};

const formatSeriesValue = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const resolveRowLayerValue = (row, layerCode) => {
  if (filters.viewMode === VIEW_MODE_TASK_CATEGORY) {
    const breakdown = row?.breakdown && typeof row.breakdown === 'object' ? row.breakdown : {};
    return breakdown?.[layerCode];
  }
  return row?.[layerCode];
};

const buildStackedSeries = (rows) => {
  const layers = orderedLayers.value;
  return layers.map((layer) => ({
    name: layer.label,
    type: 'bar',
    stack: 'total',
    emphasis: { focus: 'series' },
    data: rows.map(row => formatSeriesValue(resolveRowLayerValue(row, layer.code)))
  }));
};

const renderTop10Chart = () => {
  top10ChartInstance = ensureChart(top10ChartRef, top10ChartInstance);
  if (!top10ChartInstance) return;
  const rows = top10Rows.value;
  const names = rows.map(r => r.userName ?? '');
  top10ChartInstance.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { top: 0, type: 'scroll' },
    grid: { left: 40, right: 20, top: 40, bottom: 40, containLabel: true },
    xAxis: { type: 'category', data: names, axisLabel: { rotate: 20 } },
    yAxis: { type: 'value' },
    series: buildStackedSeries(rows)
  }, true);
};

const renderUserChart = () => {
  userChartInstance = ensureChart(userChartRef, userChartInstance);
  if (!userChartInstance) return;
  const row = selectedRow.value;
  const name = row?.userName ? row.userName : '';
  userChartInstance.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { top: 0, type: 'scroll' },
    grid: { left: 40, right: 20, top: 40, bottom: 40, containLabel: true },
    xAxis: { type: 'category', data: [name] },
    yAxis: { type: 'value' },
    series: buildStackedSeries(row ? [row] : [{ }])
  }, true);
};

const renderCharts = async () => {
  await nextTick();
  renderTop10Chart();
  renderUserChart();
};

const load = async () => {
  try {
    const endpoint = filters.viewMode === VIEW_MODE_TASK_CATEGORY
      ? '/reports/points-summary-task-category'
      : '/reports/points-summary-period';
    const data = await request.get(endpoint, { params: buildParams() });
    const payload = data?.data ?? data;
    const list = Array.isArray(payload?.list) ? payload.list : (Array.isArray(payload) ? payload : []);
    allRows.value = list;
    if (filters.viewMode === VIEW_MODE_TASK_CATEGORY) {
      ensureTaskCategoryOrder();
    }
    if (!selectedUserId.value) {
      const first = list[0];
      selectedUserId.value = first ? (first.userId ?? first.userName) : null;
    } else {
      const exists = list.some(item => (item.userId ?? item.userName) === selectedUserId.value);
      if (!exists) {
        const first = list[0];
        selectedUserId.value = first ? (first.userId ?? first.userName) : null;
      }
    }
    renderCharts();
  } catch {
    allRows.value = [];
    selectedUserId.value = null;
    renderCharts();
  }
};

const handleCycleChange = () => { 
  const range = buildDefaultRange(filters.cycle); 
  filters.startDate = range.startDate; 
  filters.endDate = range.endDate; 
  load(); 
}; 
 
const handleRangeChange = () => { 
  const range = normalizeRange({ cycle: filters.cycle, startDate: filters.startDate, endDate: filters.endDate }); 
  filters.startDate = range.startDate; 
  filters.endDate = range.endDate; 
  load(); 
}; 

const handleViewModeChange = () => {
  allRows.value = [];
  selectedUserId.value = null;
  if (filters.viewMode === VIEW_MODE_SCORE) {
    // keep existing score order
  } else {
    // refresh taskCategory order after data loaded
    taskCategoryOrder.value = loadStoredTaskCategoryOrder();
  }
  load();
};

const moveUp = (index) => {
  if (index <= 0) return;
  const target = filters.viewMode === VIEW_MODE_TASK_CATEGORY ? taskCategoryOrder : scoreCategoryOrder;
  const next = target.value.slice();
  const current = next[index];
  next[index] = next[index - 1];
  next[index - 1] = current;
  target.value = next;
  if (filters.viewMode === VIEW_MODE_TASK_CATEGORY) {
    saveStoredTaskCategoryOrder(next);
  } else {
    saveStoredScoreOrder(next);
  }
  renderCharts();
};

const moveDown = (index) => {
  const target = filters.viewMode === VIEW_MODE_TASK_CATEGORY ? taskCategoryOrder : scoreCategoryOrder;
  const next = target.value.slice();
  if (index < 0 || index >= next.length - 1) return;
  const current = next[index];
  next[index] = next[index + 1];
  next[index + 1] = current;
  target.value = next;
  if (filters.viewMode === VIEW_MODE_TASK_CATEGORY) {
    saveStoredTaskCategoryOrder(next);
  } else {
    saveStoredScoreOrder(next);
  }
  renderCharts();
};

const goBack = () => router.back();

const handleResize = () => {
  top10ChartInstance?.resize();
  userChartInstance?.resize();
};

watch(scoreCategoryOrder, () => renderCharts());
watch(taskCategoryOrder, () => renderCharts());

onMounted(() => {
  window.addEventListener('resize', handleResize);
  load();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  top10ChartInstance?.dispose?.();
  userChartInstance?.dispose?.();
  top10ChartInstance = null;
  userChartInstance = null;
});
</script>

<style lang="scss" scoped>
.points-visual-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

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
    margin-bottom: 12px;
  }

  .layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 12px;
  }

  .panel {
    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      width: 100%;
      .title {
        font-weight: 600;
      }
    }
  }

  .chart {
    height: 360px;
    width: 100%;
  }

  .order-panel {
    .order-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .order-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      border: 1px solid var(--el-border-color);
      border-radius: 8px;
      background: #fff;
      .name {
        font-weight: 500;
      }
      .ops {
        display: flex;
        gap: 8px;
      }
    }
  }

  @media (max-width: 960px) {
    .layout {
      grid-template-columns: 1fr;
    }
    .order-panel .order-list {
      grid-template-columns: 1fr;
    }
  }
}
</style>
