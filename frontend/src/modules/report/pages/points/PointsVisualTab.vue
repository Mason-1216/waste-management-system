<template>
  <div class="points-visual-tab">
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

    <!-- 第一行：分布分析 + 构成分析 -->
    <div class="layout">
      <el-card class="panel">
        <template #header>
          <div class="panel-header">
            <div class="title">积分分布对比</div>
          </div>
        </template>
        <div ref="trendChartRef" class="chart" />
      </el-card>

      <el-card class="panel">
        <template #header>
          <div class="panel-header">
            <div class="title">积分构成占比</div>
          </div>
        </template>
        <div ref="pieChartRef" class="chart" />
      </el-card>
    </div>

    <!-- 第二行：排行榜 + 雷达图 -->
    <div class="layout">
      <el-card class="panel">
        <template #header>
          <div class="panel-header">
            <div class="title">积分排行榜 Top10</div>
          </div>
        </template>
        <div ref="rankChartRef" class="chart" />
      </el-card>

      <el-card class="panel">
        <template #header>
          <div class="panel-header">
            <div class="title">能力雷达图</div>
            <span class="subtitle">（{{ radarDisplayName }}）</span>
          </div>
        </template>
        <div ref="radarChartRef" class="chart" />
      </el-card>
    </div>

    <!-- 可改进分析 -->
    <el-card class="panel improvement-panel">
      <template #header>
        <div class="panel-header">
          <div class="title">可改进分析</div>
          <span v-if="selectedRow" class="subtitle">（{{ selectedRow.userName }}）</span>
        </div>
      </template>
      <div class="improvement-analysis">
        <div v-if="deductionDetails.length === 0" class="no-data">暂无扣分记录</div>
        <div v-else class="deduction-list">
          <div class="deduction-header">
            <span class="col-name">任务名称</span>
            <span class="col-reason">扣分原因</span>
            <span class="col-points">扣分</span>
          </div>
          <div v-for="(item, index) in deductionDetails" :key="index" class="deduction-item">
            <span class="col-name">{{ item.taskName }}</span>
            <span class="col-reason">{{ item.reason }}</span>
            <span class="col-points deduction-value">{{ item.points }}</span>
          </div>
          <div class="deduction-total">
            <span class="col-name">合计</span>
            <span class="col-reason"></span>
            <span class="col-points deduction-value">{{ deductionTotal }}</span>
          </div>
        </div>
      </div>
    </el-card>

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

import FilterBar from '@/components/common/FilterBar.vue';
import request from '@/api/request';

const VIEW_MODE_SCORE = 'score';
const VIEW_MODE_TASK_CATEGORY = 'taskCategory';

// 任务类别固定为 Ⅰ/Ⅱ/Ⅲ/Ⅳ 类
const TASK_CATEGORY_DEFAULT_ORDER = ['Ⅰ类', 'Ⅱ类', 'Ⅲ类', 'Ⅳ类'];
const TASK_CATEGORY_LABELS = [
  { code: 'Ⅰ类', label: 'Ⅰ类' },
  { code: 'Ⅱ类', label: 'Ⅱ类' },
  { code: 'Ⅲ类', label: 'Ⅲ类' },
  { code: 'Ⅳ类', label: 'Ⅳ类' }
];

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
    if (!raw) return TASK_CATEGORY_DEFAULT_ORDER.slice();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return TASK_CATEGORY_DEFAULT_ORDER.slice();
    // 过滤出有效的类别，并补齐缺失的类别
    const filtered = parsed.filter(name => TASK_CATEGORY_DEFAULT_ORDER.includes(name));
    const missing = TASK_CATEGORY_DEFAULT_ORDER.filter(name => !filtered.includes(name));
    return [...filtered, ...missing];
  } catch {
    return TASK_CATEGORY_DEFAULT_ORDER.slice();
  }
};

const saveStoredTaskCategoryOrder = (value) => {
  try {
    localStorage.setItem(TASK_CATEGORY_ORDER_STORAGE_KEY, JSON.stringify(value));
  } catch {
  }
};

const filters = reactive({
  viewMode: VIEW_MODE_SCORE,
  cycle: 'day',
  startDate: '',
  endDate: ''
});

const initDateRange = () => {
  const range = buildDefaultRange(filters.cycle);
  filters.startDate = range.startDate;
  filters.endDate = range.endDate;
};

initDateRange();

const scoreCategoryOrder = ref(loadStoredScoreOrder());
const taskCategoryOrder = ref(loadStoredTaskCategoryOrder());

const allRows = ref([]);
const searchName = ref('');
const selectedUserKeys = ref(new Set());
const userPage = ref(1);
const userPageSize = ref(15);
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

// 选中人员的下拉选项（用于单人查看）
const selectedUserOptions = computed(() => {
  return selectedRows.value.map(row => ({
    key: normalizeUserKey(row),
    userName: row.userName,
    userId: row.userId
  }));
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

const ensureTaskCategoryOrder = () => {
  // 始终确保包含所有四个类别
  const stored = Array.isArray(taskCategoryOrder.value) ? taskCategoryOrder.value : [];
  const filtered = stored.filter(name => TASK_CATEGORY_DEFAULT_ORDER.includes(name));
  const missing = TASK_CATEGORY_DEFAULT_ORDER.filter(name => !filtered.includes(name));
  const next = [...filtered, ...missing];
  if (next.length !== taskCategoryOrder.value.length || !next.every((v, i) => v === taskCategoryOrder.value[i])) {
    taskCategoryOrder.value = next;
    saveStoredTaskCategoryOrder(next);
  }
};

const orderedLayers = computed(() => {
  if (filters.viewMode === VIEW_MODE_TASK_CATEGORY) {
    const names = Array.isArray(taskCategoryOrder.value) ? taskCategoryOrder.value : TASK_CATEGORY_DEFAULT_ORDER;
    const map = new Map(TASK_CATEGORY_LABELS.map(item => [item.code, item]));
    return names.map(name => map.get(name) ?? { code: name, label: name }).filter(Boolean);
  }
  const map = new Map(SCORE_CATEGORY_LABELS.map(item => [item.code, item]));
  return scoreCategoryOrder.value.map(code => map.get(code)).filter(Boolean);
});

const orderPanelTitle = computed(() => {
  return filters.viewMode === VIEW_MODE_TASK_CATEGORY ? '任务类别层顺序' : '得分大类层顺序';
});

const top10Rows = computed(() => {
  const rows = selectedRows.value.slice();
  rows.sort((a, b) => Number(b.total || 0) - Number(a.total || 0));
  return rows.slice(0, 10);
});

const selectedRow = computed(() => {
  const id = selectedUserId.value;
  if (!id) return null;
  return (allRows.value ?? []).find(item => (item.userId ?? item.userName) === id) ?? null;
});

// 扣分明细（从选中用户的数据中提取）
const deductionDetails = computed(() => {
  const row = selectedRow.value;
  if (!row) return [];
  const deductions = Array.isArray(row.deductions) ? row.deductions : [];
  return deductions.map(item => ({
    taskName: item.taskName ?? item.workName ?? '',
    reason: item.reason ?? item.deductionReason ?? '',
    points: Number(item.points ?? item.deductionPoints ?? 0)
  })).filter(item => item.points < 0);
});

// 扣分合计
const deductionTotal = computed(() => {
  return deductionDetails.value.reduce((sum, item) => sum + item.points, 0);
});

// 雷达图显示名称
const radarDisplayName = computed(() => {
  const count = selectedUserKeys.value.size;
  if (count === 0) return '未选择';
  if (count === 1) {
    const rows = selectedRows.value;
    return rows[0]?.userName ?? '未知';
  }
  return `已选${count}人累计`;
});

const buildParams = () => {
  const { startDate, endDate } = normalizeRange({ cycle: filters.cycle, startDate: filters.startDate, endDate: filters.endDate });
  return {
    startDate,
    endDate,
    cycle: filters.cycle
  };
};

const trendChartRef = ref(null);
const pieChartRef = ref(null);
const rankChartRef = ref(null);
const radarChartRef = ref(null);

let trendChartInstance = null;
let pieChartInstance = null;
let rankChartInstance = null;
let radarChartInstance = null;

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

// 分布柱状图：展示各类别积分汇总对比
const renderTrendChart = () => {
  trendChartInstance = ensureChart(trendChartRef, trendChartInstance);
  if (!trendChartInstance) return;
  const layers = orderedLayers.value;
  const rows = selectedRows.value;
  // 按类别汇总选中人员的积分
  const categoryTotals = {};
  layers.forEach(layer => { categoryTotals[layer.code] = 0; });
  rows.forEach(row => {
    layers.forEach(layer => {
      const val = Number(resolveRowLayerValue(row, layer.code));
      if (Number.isFinite(val)) categoryTotals[layer.code] += val;
    });
  });
  const xData = layers.map(layer => layer.label);
  const yData = layers.map(layer => formatSeriesValue(categoryTotals[layer.code]));
  trendChartInstance.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 40, right: 20, top: 20, bottom: 40, containLabel: true },
    xAxis: { type: 'category', data: xData, axisLabel: { rotate: 20 } },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      data: yData,
      itemStyle: { borderRadius: [4, 4, 0, 0] },
      label: { show: true, position: 'top', formatter: '{c}' }
    }]
  }, true);
};

// 饼图：展示积分构成占比
const renderPieChart = () => {
  pieChartInstance = ensureChart(pieChartRef, pieChartInstance);
  if (!pieChartInstance) return;
  const layers = orderedLayers.value;
  const rows = selectedRows.value;
  const categoryTotals = {};
  layers.forEach(layer => { categoryTotals[layer.code] = 0; });
  rows.forEach(row => {
    layers.forEach(layer => {
      const val = Number(resolveRowLayerValue(row, layer.code));
      if (Number.isFinite(val)) categoryTotals[layer.code] += val;
    });
  });
  const pieData = layers.map(layer => ({
    name: layer.label,
    value: Math.max(0, categoryTotals[layer.code])
  })).filter(item => item.value > 0);
  pieChartInstance.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { top: 0, type: 'scroll' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '55%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}: {d}%' },
      data: pieData
    }]
  }, true);
};

// 排行榜：百分比堆叠柱状图（X轴为姓名）
const renderRankChart = () => {
  rankChartInstance = ensureChart(rankChartRef, rankChartInstance);
  if (!rankChartInstance) return;
  const rows = top10Rows.value;
  const names = rows.map(r => r.userName ?? '');
  const layers = orderedLayers.value;

  // 预先计算每个人每个类别的实际值
  const actualValues = rows.map(row => {
    const values = {};
    layers.forEach(layer => {
      values[layer.code] = formatSeriesValue(resolveRowLayerValue(row, layer.code));
    });
    return values;
  });

  // 计算每个人的总分（只计算正数）
  const totals = rows.map((row, idx) => {
    let sum = 0;
    layers.forEach(layer => {
      const val = actualValues[idx][layer.code];
      if (val > 0) sum += val;
    });
    return sum || 1; // 避免除以0
  });

  // 构建百分比堆叠系列
  const series = layers.map((layer, layerIdx) => ({
    name: layer.label,
    type: 'bar',
    stack: 'total',
    emphasis: { focus: 'series' },
    label: {
      show: true,
      position: 'inside',
      formatter: (params) => {
        const rowIndex = params.dataIndex;
        const actualValue = actualValues[rowIndex][layer.code];
        const total = totals[rowIndex];
        const percent = ((actualValue / total) * 100).toFixed(1);
        if (Number(percent) < 5) return ''; // 太小不显示
        return `${actualValue.toFixed(1)}分\n${percent}%`;
      },
      fontSize: 11,
      lineHeight: 14
    },
    data: rows.map((row, idx) => {
      const val = actualValues[idx][layer.code];
      const total = totals[idx];
      return (val / total) * 100; // 转换为百分比
    })
  }));

  rankChartInstance.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const rowIndex = params[0]?.dataIndex;
        const row = rows[rowIndex];
        const total = totals[rowIndex];
        let html = `<div style="font-weight:600">${row?.userName ?? ''}</div>`;
        params.forEach(p => {
          const layerItem = layers.find(l => l.label === p.seriesName);
          const actualValue = layerItem ? actualValues[rowIndex][layerItem.code] : 0;
          const percent = ((actualValue / total) * 100).toFixed(1);
          html += `<div>${p.marker} ${p.seriesName}: ${actualValue.toFixed(1)}分 (${percent}%)</div>`;
        });
        html += `<div style="margin-top:4px;font-weight:600">总计: ${total.toFixed(1)}分</div>`;
        return html;
      }
    },
    legend: { top: 0, type: 'scroll' },
    grid: { left: 40, right: 20, top: 40, bottom: 40, containLabel: true },
    xAxis: { type: 'category', data: names, axisLabel: { rotate: 20 } },
    yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
    series
  }, true);
};

// 雷达图：能力画像（多人累计或单人）
const renderRadarChart = () => {
  radarChartInstance = ensureChart(radarChartRef, radarChartInstance);
  if (!radarChartInstance) return;
  const layers = orderedLayers.value;
  const rows = selectedRows.value;
  const allData = allRows.value;

  // 计算选中人员的累计值
  const sumValues = {};
  layers.forEach(layer => { sumValues[layer.code] = 0; });
  rows.forEach(r => {
    layers.forEach(layer => {
      const val = Number(resolveRowLayerValue(r, layer.code));
      if (Number.isFinite(val)) {
        // 扣分是负数，取绝对值累加
        sumValues[layer.code] += layer.code === 'deduction' ? Math.abs(val) : val;
      }
    });
  });

  // 计算所有人员中每个维度的最大值（用于雷达图的 max）
  const maxValues = {};
  layers.forEach(layer => { maxValues[layer.code] = 0; });
  allData.forEach(r => {
    layers.forEach(layer => {
      let val = Number(resolveRowLayerValue(r, layer.code));
      if (layer.code === 'deduction') val = Math.abs(val); // 扣分取绝对值
      if (Number.isFinite(val) && val > maxValues[layer.code]) {
        maxValues[layer.code] = val;
      }
    });
  });
  // 如果选了多人，max 应该是累计可能的最大值
  if (rows.length > 1) {
    layers.forEach(layer => {
      // 多人时，max 设为所有人该维度之和
      let total = 0;
      allData.forEach(r => {
        let val = Number(resolveRowLayerValue(r, layer.code));
        if (layer.code === 'deduction') val = Math.abs(val); // 扣分取绝对值
        if (Number.isFinite(val) && val > 0) total += val;
      });
      maxValues[layer.code] = Math.max(total, 1);
    });
  }

  // 扣分项使用红色
  const indicator = layers.map(layer => {
    const isDeduction = layer.code === 'deduction';
    return {
      name: layer.label,
      max: Math.max(maxValues[layer.code], 1),
      color: isDeduction ? '#f56c6c' : undefined
    };
  });

  const radarData = layers.map(layer => {
    const val = sumValues[layer.code];
    return Number.isFinite(val) ? Math.max(0, val) : 0;
  });

  radarChartInstance.setOption({
    tooltip: { trigger: 'item' },
    radar: { indicator, center: ['50%', '55%'], radius: '65%' },
    series: [{
      type: 'radar',
      smooth: true,
      data: [{
        value: radarData,
        name: radarDisplayName.value,
        areaStyle: { opacity: 0.3 }
      }]
    }]
  }, true);
};

const renderCharts = async () => {
  await nextTick();
  renderTrendChart();
  renderPieChart();
  renderRankChart();
  renderRadarChart();
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
    // 默认全选所有人员
    selectedUserKeys.value = new Set(list.map(row => normalizeUserKey(row)));
    // 设置单人查看的默认选中
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
    selectedUserKeys.value = new Set();
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
  if (filters.viewMode !== VIEW_MODE_SCORE) {
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

const handleResize = () => {
  trendChartInstance?.resize();
  pieChartInstance?.resize();
  rankChartInstance?.resize();
  radarChartInstance?.resize();
};

watch(scoreCategoryOrder, () => renderCharts());
watch(taskCategoryOrder, () => renderCharts());
watch(selectedUserKeys, () => renderCharts(), { deep: true });

onMounted(() => {
  window.addEventListener('resize', handleResize);
  load();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  trendChartInstance?.dispose?.();
  pieChartInstance?.dispose?.();
  rankChartInstance?.dispose?.();
  radarChartInstance?.dispose?.();
  trendChartInstance = null;
  pieChartInstance = null;
  rankChartInstance = null;
  radarChartInstance = null;
});
</script>

<style lang="scss" scoped>
.points-visual-tab {
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

  .improvement-panel {
    margin-bottom: 12px;
  }

  .improvement-analysis {
    .no-data {
      text-align: center;
      color: #909399;
      padding: 20px;
    }

    .deduction-list {
      .deduction-header,
      .deduction-item,
      .deduction-total {
        display: flex;
        padding: 10px 0;
        border-bottom: 1px solid var(--el-border-color-lighter);
      }

      .deduction-header {
        font-weight: 600;
        background: #f5f7fa;
        padding: 10px 12px;
        border-radius: 4px 4px 0 0;
      }

      .deduction-item {
        padding: 10px 12px;
      }

      .deduction-total {
        font-weight: 600;
        background: #fef0f0;
        padding: 10px 12px;
        border-radius: 0 0 4px 4px;
        border-bottom: none;
      }

      .col-name {
        flex: 2;
      }

      .col-reason {
        flex: 3;
      }

      .col-points {
        flex: 1;
        text-align: right;
      }

      .deduction-value {
        color: #f56c6c;
        font-weight: 600;
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
