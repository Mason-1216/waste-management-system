<template>
  <div class="reports-page">
    <div class="page-header">
      <div>
        <h2>维保数据报表</h2>
        <p class="sub">围绕保养记录与故障维修记录，快速查看核心指标与明细</p>
      </div>

      <div class="header-actions">
        <el-button type="primary" @click="exportCurrent">
          <el-icon><Upload /></el-icon>批量导出
        </el-button>
      </div>

    </div>

    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="设备保养统计" name="maintenance" />
      <el-tab-pane label="设备故障统计" name="faults" />
    </el-tabs>

    <el-card class="filter-card">
      <FilterBar>
        <div class="filter-item">
          <span class="filter-label">开始日期</span>
          <el-date-picker
            v-model="filters.startDate"
            type="date"
            placeholder="全部"
            value-format="YYYY-MM-DD"
            @change="refreshActive"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">结束日期</span>
          <el-date-picker
            v-model="filters.endDate"
            type="date"
            placeholder="全部"
            value-format="YYYY-MM-DD"
            @change="refreshActive"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">场站</span>
          <FilterSelect
            v-model="filters.stationId"
            placeholder="全部"
            :clearable="!isStationLocked"
            filterable
            :disabled="isStationLocked"
            style="width: 200px"
            @change="handleStationChange"
            @clear="handleStationChange"
          >
            <el-option label="全部" :value="null" />
            <el-option
              v-for="s in stationOptions"
              :key="s.id"
              :label="s.stationName"
              :value="s.id"
            />
          </FilterSelect>
        </div>
      </FilterBar>
    </el-card>

    <ReportSummaryCards :items="summaryCards" />

    <div class="chart-section">
      <ReportChartCard :title="activeTab === 'maintenance' ? '保养设备分布' : '故障设备分布'">
        <div ref="equipmentChartRef" class="chart-container"></div>
      </ReportChartCard>
      <template v-if="activeTab === 'maintenance'">
        <ReportChartCard title="本日保养完成率">
          <div ref="dailyChartRef" class="chart-container"></div>
        </ReportChartCard>
        <ReportChartCard title="本周保养完成率">
          <div ref="weeklyChartRef" class="chart-container"></div>
        </ReportChartCard>
        <ReportChartCard title="本月保养完成率">
          <div ref="monthlyChartRef" class="chart-container"></div>
        </ReportChartCard>
        <ReportChartCard title="本年保养完成率">
          <div ref="yearlyChartRef" class="chart-container"></div>
        </ReportChartCard>
      </template>
      <ReportChartCard v-else title="维修状态分布">
        <div ref="statusChartRef" class="chart-container"></div>
      </ReportChartCard>
    </div>

    <!-- 设备全年趋势图 -->
    <div class="trend-section">
      <h3>{{ activeTab === 'maintenance' ? '设备保养全年趋势' : '设备维修全年趋势' }}</h3>

      <div class="trend-filters">
        <div class="filter-item">
          <span class="filter-label">场站</span>
          <FilterSelect
            v-model="filters.stationId"
            placeholder="全部"
            :clearable="!isStationLocked"
            filterable
            :disabled="isStationLocked"
            style="width: 200px"
            @change="handleStationChange"
            @clear="handleStationChange"
          >
            <el-option label="全部" :value="null" />
            <el-option
              v-for="s in stationOptions"
              :key="s.id"
              :label="s.stationName"
              :value="s.id"
            />
          </FilterSelect>
        </div>

        <div class="filter-item">
          <span class="filter-label">设备</span>
          <FilterSelect v-model="selectedEquipment" placeholder="全部" clearable filterable style="width: 280px">
            <el-option
              v-for="eq in equipmentOptions"
              :key="eq.code"
              :label="`${eq.name} (${eq.code})`"
              :value="eq.code"
            />
          </FilterSelect>
        </div>

        <div class="filter-item">
          <span class="filter-label">年份</span>
          <FilterSelect v-model="selectedYear" placeholder="全部" style="width: 160px">
            <el-option
              v-for="year in yearOptions"
              :key="year"
              :label="`${year}年`"
              :value="year"
            />
          </FilterSelect>
        </div>

      </div>

      <div ref="trendChartRef" class="trend-chart"></div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import dayjs from 'dayjs';
import * as echarts from 'echarts';
import request from '@/api/request';
import * as XLSX from 'xlsx';
import ReportSummaryCards from '@/modules/report/components/ReportSummaryCards.vue';
import ReportChartCard from '@/modules/report/components/ReportChartCard.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import FilterSelect from '@/components/common/FilterSelect.vue';
import { getAllStations } from '@/api/station';
import { getEquipment } from '@/api/equipment';
import { useUserStore } from '@/store/modules/user';

const activeTab = ref('maintenance');
const userStore = useUserStore();
const effectiveRole = computed(() => userStore.baseRoleCode || userStore.roleCode || '');
const stations = ref([]);
const maintenanceRows = ref([]);
const maintenancePlans = ref([]);
const maintenanceCompletionRows = ref([]);
const faultRows = ref([]);
const equipmentChartRef = ref(null);
const statusChartRef = ref(null);
const dailyChartRef = ref(null);
const weeklyChartRef = ref(null);
const monthlyChartRef = ref(null);
const yearlyChartRef = ref(null);
const trendChartRef = ref(null);
let equipmentChart = null;
let statusChart = null;
let trendChart = null;
const cycleCharts = {
  daily: null,
  weekly: null,
  monthly: null,
  yearly: null
};

const filters = ref({
  startDate: dayjs().subtract(5, 'day').format('YYYY-MM-DD'),
  endDate: dayjs().format('YYYY-MM-DD'),
  stationId: null,
  keyword: '',
  maintenanceStatus: '',
  faultStatus: ''
});

// 趋势图筛选
const selectedEquipment = ref(null);
const selectedYear = ref(dayjs().year());
const equipmentList = ref([]);

const isStationLocked = computed(() => {
  if (Array.isArray(userStore.stations) && userStore.stations.length > 1) {
    return false;
  }
  // 这些角色通常只能看自己场站的数据
  if (['operator', 'maintenance', 'station_manager'].includes(effectiveRole.value)) {
    return Boolean(userStore.currentStationId);
  }
  return false;
});

const stationOptions = computed(() => {
  const list = Array.isArray(stations.value) ? stations.value : [];
  const permittedStations = Array.isArray(userStore.stations) ? userStore.stations : [];
  const permittedIds = permittedStations
    .map(item => item?.id)
    .filter(Boolean);

  if (permittedIds.length > 0) {
    const idSet = new Set(permittedIds);
    return list.filter(item => idSet.has(item.id));
  }

  if (isStationLocked.value && userStore.currentStationId) {
    return list.filter(item => item.id === userStore.currentStationId);
  }

  return list;
});

// 设备选项：不依赖维保/维修记录，避免被日期筛选影响
const equipmentOptions = computed(() => {
  const rows = equipmentList.value;
  const equipmentMap = new Map();

  rows.forEach(row => {
    const code = row.equipment_code || row.equipmentCode || row.code;
    const name = row.equipment_name || row.equipmentName || row.name;
    if (code && name && !equipmentMap.has(code)) {
      equipmentMap.set(code, { code, name });
    }
  });

  return Array.from(equipmentMap.values());
});

// 年份选项(当前年份及前4年)
const yearOptions = computed(() => {
  const currentYear = dayjs().year();
  return Array.from({ length: 5 }, (_, i) => currentYear - i);
});

const cycleLabels = {
  daily: '每日',
  weekly: '每周',
  monthly: '每月',
  yearly: '每年'
};

const maintenanceStatusLabels = {
  pending: '待完成',
  completed: '已完成',
  verified: '已验收'
};

const faultStatusLabels = {
  draft_report: '草稿',
  submitted_report: '已上报',
  dispatched: '已派单',
  repairing: '维修中',
  repaired_submitted: '待验收',
  accepted: '已验收',
  archived: '已归档'
};

const loadStations = async () => {
  try {
    const res = await getAllStations();
    const list = res?.data || res || [];
    stations.value = (Array.isArray(list) ? list : []).map(item => ({
      ...item,
      stationName: item.stationName || item.station_name || item.name || ''
    }));
  } catch {
    stations.value = [];
  }
};

const loadEquipmentList = async () => {
  try {
    // 后端返回格式在不同模块里有差异，这里做兼容
    const res = await getEquipment({
      stationId: filters.value.stationId || undefined
    });
    const list = res?.list || res?.data || res || [];
    equipmentList.value = Array.isArray(list) ? list : [];
  } catch {
    equipmentList.value = [];
  }
};

const handleStationChange = async () => {
  selectedEquipment.value = null;
  await loadEquipmentList();
  await refreshActive();
};

const getStationName = (stationId) => {
  const station = stations.value.find(item => item.id === stationId);
  return station ? station.stationName : '-';
};

const loadMaintenance = async () => {
  const startDate = filters.value.startDate;
  const endDate = filters.value.endDate;
  const params = {
    page: 1,
    pageSize: 2000,
    stationId: filters.value.stationId || undefined,
    status: filters.value.maintenanceStatus || undefined
  };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const res = await request.get('/maintenance-work-records', { params });
  const rows = res.list || res.rows || [];
  maintenanceRows.value = rows.map(row => ({
    ...row,
    stationName: row.station?.station_name || getStationName(row.station_id),
    equipment_name: row.equipment_name || row.plan?.equipment_name || '',
    equipment_code: row.equipment_code || row.plan?.equipment_code || '',
    executorName: row.executor?.real_name || row.executor_name || '',
    cycleLabel: cycleLabels[row.cycle_type] || row.cycle_type || '-',
    statusLabel: maintenanceStatusLabels[row.status] || row.status || '-',
    is_overdue: row.is_overdue ? '是' : '否'
  }));
};

const loadMaintenancePlans = async () => {
  const params = {
    page: 1,
    pageSize: 5000,
    stationId: filters.value.stationId || undefined
  };
  try {
    const res = await request.get('/maintenance-plan-library', { params });
    maintenancePlans.value = res.list || res.rows || [];
  } catch {
    maintenancePlans.value = [];
  }
};

const loadMaintenanceCompletionRows = async () => {
  const yearStart = dayjs().startOf('year').format('YYYY-MM-DD');
  const yearEnd = dayjs().endOf('year').format('YYYY-MM-DD');
  const params = {
    page: 1,
    pageSize: 10000,
    stationId: filters.value.stationId || undefined,
    startDate: yearStart,
    endDate: yearEnd
  };
  try {
    const res = await request.get('/maintenance-work-records', { params });
    maintenanceCompletionRows.value = res.list || res.rows || [];
  } catch {
    maintenanceCompletionRows.value = [];
  }
};

const loadFaults = async () => {
  const startDate = filters.value.startDate;
  const endDate = filters.value.endDate;
  const params = {
    page: 1,
    pageSize: 2000,
    stationId: filters.value.stationId || undefined,
    status: filters.value.faultStatus || undefined,
    equipmentName: filters.value.keyword || undefined
  };
  const res = await request.get('/repair-records', { params });
  const rows = res.list || res.rows || [];
  const start = startDate ? dayjs(startDate) : null;
  const end = endDate ? dayjs(endDate) : null;

  faultRows.value = rows
    .filter(row => {
      if (!start || !end) return true;
      const dateText = row.report_date || row.fault_date;
      if (!dateText) return true;
      const date = dayjs(dateText);
      return date.isSameOrAfter(start, 'day') && date.isSameOrBefore(end, 'day');
    })
    .map(row => ({
      ...row,
      stationName: row.station?.station_name || getStationName(row.station_id),
      fault_datetime: row.report_date && row.report_time
        ? `${row.report_date} ${row.report_time}`
        : (row.fault_date && row.fault_time ? `${row.fault_date} ${row.fault_time}` : row.report_date || row.fault_date || '-'),
      assigneeName: row.repair_person_name || row.repairPerson?.real_name || '',
      statusLabel: faultStatusLabels[row.status] || row.status || '-'
    }));
};

const refreshActive = async () => {
  if (activeTab.value === 'maintenance') {
    await loadMaintenance();
    await loadMaintenancePlans();
    await loadMaintenanceCompletionRows();
  } else {
    await loadFaults();
  }
  await nextTick();
  renderCharts();
};

// 加载趋势图
const loadTrendChart = async () => {
  try {
    const endpoint = activeTab.value === 'maintenance'
      ? '/reports/maintenance-by-month'
      : '/reports/repair-by-month';

    const res = await request.get(endpoint, {
      params: {
        stationId: filters.value.stationId || undefined,
        equipmentCode: selectedEquipment.value || undefined,
        year: selectedYear.value
      }
    });

    if (!trendChart && trendChartRef.value) {
      trendChart = echarts.init(trendChartRef.value);
    }

    if (!trendChart) return;

    const list = Array.isArray(res) ? res : (res?.list || res?.data || []);
    const normalized = list.length > 0
      ? list
      : Array.from({ length: 12 }, (_, i) => ({ month: i + 1, count: 0 }));

    const months = normalized.map(item => `${item.month}月`);
    const counts = normalized.map(item => item.count);

    const equipmentLabel = selectedEquipment.value
      ? (equipmentOptions.value.find(item => item.code === selectedEquipment.value)?.name || selectedEquipment.value)
      : '全部设备';

    trendChart.setOption({
      title: {
        text: `${selectedYear.value}年 ${equipmentLabel} ${activeTab.value === 'maintenance' ? '保养' : '维修'}次数统计`,
        left: 'center'
      },
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: months,
        name: '月份'
      },
      yAxis: {
        type: 'value',
        name: '次数',
        minInterval: 1
      },
      series: [{
        name: activeTab.value === 'maintenance' ? '保养次数' : '维修次数',
        type: 'line',
        data: counts,
        smooth: true,
        itemStyle: { color: '#409EFF' }
      }]
    });

  } catch {
    ElMessage.error('趋势图加载失败');
  }
};

const handleTabChange = async () => {
  await refreshActive();
};

watch([selectedEquipment, selectedYear, activeTab], async () => {
  await nextTick();
  await loadTrendChart();
});

const filteredMaintenanceRows = computed(() => {
  const keyword = filters.value.keyword?.trim();
  if (!keyword) return maintenanceRows.value;
  return maintenanceRows.value.filter(row =>
    row.equipment_name?.includes(keyword)
    || row.equipment_code?.includes(keyword)
  );
});

const filteredFaultRows = computed(() => {
  const keyword = filters.value.keyword?.trim();
  if (!keyword) return faultRows.value;
  return faultRows.value.filter(row =>
    row.equipment_name?.includes(keyword)
    || row.equipment_code?.includes(keyword)
  );
});

const tableRows = computed(() => (
  activeTab.value === 'maintenance' ? filteredMaintenanceRows.value : filteredFaultRows.value
));

const summaryCards = computed(() => {
  if (activeTab.value === 'maintenance') {
    const rows = filteredMaintenanceRows.value;
    const total = rows.length;
    const completedRows = rows.filter(row => row.status === 'completed' || row.status === 'verified');
    const pendingRows = rows.filter(row => row.status === 'pending');
    const overdueRows = rows.filter(row => row.is_overdue === '是');
    const workHours = rows.reduce((sum, row) => sum + Number(row.work_hours || 0), 0);

    const cycleOrder = ['daily', 'weekly', 'monthly', 'yearly'];
    const cycleLabel = { daily: '日', weekly: '周', monthly: '月', yearly: '年' };
    const buildCycleCounts = (list) => list.reduce((acc, row) => {
      const cycle = row.cycle_type;
      if (cycleOrder.includes(cycle)) {
        acc[cycle] = (acc[cycle] || 0) + 1;
      }
      return acc;
    }, {});
    const formatCycleCounts = (counts) => cycleOrder
      .map(cycle => `${cycleLabel[cycle]}${counts[cycle] || 0}`)
      .join(' / ');

    return [
      { label: '记录总数', value: total },
      { label: '已完成', value: completedRows.length, hint: formatCycleCounts(buildCycleCounts(completedRows)) },
      { label: '待完成', value: pendingRows.length, hint: formatCycleCounts(buildCycleCounts(pendingRows)) },
      { label: '逾期记录', value: overdueRows.length, hint: formatCycleCounts(buildCycleCounts(overdueRows)) },
      { label: '累计工时', value: workHours.toFixed(1), hint: '小时' }
    ];
  }

  const rows = filteredFaultRows.value;
  const total = rows.length;
  const closed = rows.filter(row => ['accepted', 'archived'].includes(row.status)).length;
  const processing = rows.filter(row => ['dispatched', 'repairing', 'repaired_submitted'].includes(row.status)).length;
  const pending = rows.filter(row => ['draft_report', 'submitted_report'].includes(row.status)).length;
  const equipmentCount = new Set(rows.map(row => row.equipment_name).filter(Boolean)).size;

  return [
    { label: '故障总数', value: total },
    { label: '待处理', value: pending },
    { label: '处理中', value: processing },
    { label: '已结案', value: closed, hint: total ? `结案率${(closed / total * 100).toFixed(1)}%` : '' },
    { label: '涉及设备', value: equipmentCount }
  ];
});

const buildTopEquipment = (rows) => {
  const map = new Map();
  rows.forEach(row => {
    const code = row.equipment_code || '';
    const name = row.equipment_name || '';
    const label = [code, name].filter(Boolean).join('\n') || '未命名设备';
    map.set(label, (map.get(label) || 0) + 1);
  });

  const list = Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return {
    names: list.map(item => item[0]),
    values: list.map(item => item[1])
  };
};

const buildStatusData = (rows, labels) => {
  const map = new Map();
  rows.forEach(row => {
    const key = row.status || 'unknown';
    map.set(key, (map.get(key) || 0) + 1);
  });
  return Array.from(map.entries()).map(([status, count]) => ({
    name: labels[status] || status,
    value: count
  }));
};

const getPlanKey = (plan) => plan.id || `${plan.station_id || ''}-${plan.equipment_code || ''}-${plan.equipment_name || ''}`;

const isPlanCycleEnabled = (plan, cycleType) => {
  const hasMultiCycle = plan.daily_enabled !== undefined && plan.daily_enabled !== null;
  if (hasMultiCycle) {
    if (cycleType === 'daily') return !!plan.daily_enabled;
    if (cycleType === 'weekly') return !!plan.weekly_enabled && !!plan.weekly_day;
    if (cycleType === 'monthly') return !!plan.monthly_enabled && !!plan.monthly_day;
    if (cycleType === 'yearly') return !!plan.yearly_enabled && !!plan.yearly_month && !!plan.yearly_day;
    return false;
  }
  return plan.cycle_type === cycleType;
};

const getPeriodRange = (cycleType) => {
  const today = dayjs();
  if (cycleType === 'daily') {
    return { start: today, end: today };
  }
  if (cycleType === 'weekly') {
    const dayOfWeek = today.day();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const start = today.subtract(daysFromMonday, 'day');
    return { start, end: start.add(6, 'day') };
  }
  if (cycleType === 'monthly') {
    return { start: today.startOf('month'), end: today.endOf('month') };
  }
  return { start: today.startOf('year'), end: today.endOf('year') };
};

const getCompletedPlanKeys = (cycleType, range) => {
  const completedStatuses = new Set(['completed', 'verified']);
  const start = range?.start;
  const end = range?.end;
  const keys = new Set();
  maintenanceCompletionRows.value.forEach(row => {
    if (row.cycle_type !== cycleType) return;
    if (!completedStatuses.has(row.status)) return;
    if (start && end && row.work_date) {
      const date = dayjs(row.work_date);
      if (date.isBefore(start, 'day') || date.isAfter(end, 'day')) return;
    }
    const key = row.plan_id || row.plan?.id || row.equipment_code || row.equipment_name;
    if (key) keys.add(key);
  });
  return keys;
};

const buildCycleCompletionData = (cycleType) => {
  const range = getPeriodRange(cycleType);
  const duePlans = maintenancePlans.value.filter(plan => isPlanCycleEnabled(plan, cycleType));
  const dueKeys = new Set(duePlans.map(plan => getPlanKey(plan)));
  const completedKeys = getCompletedPlanKeys(cycleType, range);
  const completed = Array.from(completedKeys).filter(key => dueKeys.has(key)).length;
  const pending = Math.max(dueKeys.size - completed, 0);
  return [
    { name: '完成', value: completed },
    { name: '待完成', value: pending }
  ];
};

const ensureEquipmentChart = () => {
  if (!equipmentChartRef.value) return null;
  if (!equipmentChart) {
    equipmentChart = echarts.init(equipmentChartRef.value);
  }
  return equipmentChart;
};

const ensureStatusChart = () => {
  if (!statusChartRef.value) return null;
  if (!statusChart) {
    statusChart = echarts.init(statusChartRef.value);
  }
  return statusChart;
};

const ensureCycleChart = (cycleType, refEl) => {
  if (!refEl) return null;
  if (!cycleCharts[cycleType]) {
    cycleCharts[cycleType] = echarts.init(refEl);
  }
  return cycleCharts[cycleType];
};

const renderEquipmentChart = (top) => {
  const chart = ensureEquipmentChart();
  if (!chart) return;

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (items) => {
        const item = Array.isArray(items) ? items[0] : items;
        const value = Number.isFinite(item?.value) ? Math.round(item.value) : item?.value;
        return `${item?.axisValue || ''}<br/>次数: ${value ?? 0}`;
      }
    },
    grid: { left: '3%', right: '6%', bottom: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: top.names,
      axisLabel: { width: 140, overflow: 'truncate', interval: 0 },
      name: '设备',
      nameLocation: 'center',
      nameGap: 30,
      nameTextStyle: {
        fontSize: 14,
        fontWeight: 'bold'
      }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: {
        formatter: (value) => Math.round(value)
      },
      name: '月累计次数',
      nameTextStyle: {
        fontSize: 14,
        fontWeight: 'bold'
      },
      nameGap: 35
    },
    series: [
      {
        type: 'bar',
        data: top.values.map(value => Math.round(value)),
        itemStyle: { color: '#4C6EF5' }
      }
    ]
  });
};

const renderCycleCharts = () => {
  const cycleRefs = {
    daily: dailyChartRef.value,
    weekly: weeklyChartRef.value,
    monthly: monthlyChartRef.value,
    yearly: yearlyChartRef.value
  };
  Object.entries(cycleRefs).forEach(([cycleType, refEl]) => {
    const chart = ensureCycleChart(cycleType, refEl);
    if (!chart) return;
    const cycleData = buildCycleCompletionData(cycleType);
    chart.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [
        {
          type: 'pie',
          radius: ['35%', '65%'],
          data: cycleData,
          label: { formatter: '{b}: {c}' }
        }
      ]
    });
  });
};

const renderStatusChart = (statusData) => {
  const chart = ensureStatusChart();
  if (!chart) return;
  chart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['35%', '65%'],
        data: statusData,
        label: { formatter: '{b}: {c}' }
      }
    ]
  });
};

const renderCharts = () => {
  const isMaintenance = activeTab.value === 'maintenance';
  const rows = isMaintenance ? filteredMaintenanceRows.value : filteredFaultRows.value;
  const top = buildTopEquipment(rows);
  const statusData = isMaintenance ? [] : buildStatusData(rows, faultStatusLabels);

  renderEquipmentChart(top);
  if (isMaintenance) {
    renderCycleCharts();
  } else {
    renderStatusChart(statusData);
  }
};

const exportCurrent = () => {
  const rows = tableRows.value;
  if (!rows.length) return;

  let headers = [];
  let data = [];

  if (activeTab.value === 'maintenance') {
    headers = [
      '日期',
      '场站',
      '设备名称',
      '设备编号',
      '执行人',
      '周期',
      '工时',
      '状态',
      '是否逾期'
    ];
    data = rows.map(row => [
      row.work_date,
      row.stationName,
      row.equipment_name,
      row.equipment_code,
      row.executorName,
      row.cycleLabel,
      row.work_hours,
      row.statusLabel,
      row.is_overdue
    ]);
  } else {
    headers = [
      '报修时间',
      '场站',
      '设备名称',
      '设备编号',
      '上报人',
      '维修人',
      '状态',
      '故障描述'
    ];
    data = rows.map(row => [
      row.fault_datetime,
      row.stationName,
      row.equipment_name,
      row.equipment_code,
      row.reporter_name,
      row.assigneeName,
      row.statusLabel,
      row.fault_description
    ]);
  }

  const sheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const wb = XLSX.utils.book_new();
  const sheetName = activeTab.value === 'maintenance' ? '保养统计' : '故障统计';
  XLSX.utils.book_append_sheet(wb, sheet, sheetName);
  const fileName = activeTab.value === 'maintenance' ? '设备保养统计' : '设备故障统计';
  XLSX.writeFile(wb, `${fileName}_${dayjs().format('YYYYMMDD')}.xlsx`);
};

const handleResize = () => {
  equipmentChart?.resize();
  statusChart?.resize();
  trendChart?.resize();
  Object.values(cycleCharts).forEach(chart => chart?.resize());
};

onMounted(async () => {
  if (isStationLocked.value && userStore.currentStationId) {
    filters.value.stationId = userStore.currentStationId;
  }
  await loadStations();
  await loadEquipmentList();
  await refreshActive();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  equipmentChart?.dispose();
  statusChart?.dispose();
  trendChart?.dispose();
  Object.keys(cycleCharts).forEach(key => {
    cycleCharts[key]?.dispose();
    cycleCharts[key] = null;
  });
});
</script>

<style lang="scss" scoped>
.reports-page {
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    h2 {
      margin: 0;
      font-size: 20px;
    }

    .sub {
      margin: 6px 0 0;
      color: #909399;
      font-size: 13px;
    }
  }

  .filter-card {
    margin-bottom: 20px;
  }

  .filter-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
    margin-bottom: 20px;

    .stat-card {
      background: #fff;
      padding: 16px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);

      .label {
        color: #909399;
        font-size: 13px;
      }

      .value {
        font-size: 22px;
        font-weight: 600;
        margin-top: 6px;
        color: #303133;
      }

      .hint {
        margin-top: 4px;
        font-size: 12px;
        color: #67c23a;
      }
    }
  }

  .chart-section {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 16px;
    margin-bottom: 20px;

    .chart-card {
      background: #fff;
      border-radius: 10px;
      padding: 16px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

      h3 {
        margin: 0 0 12px;
        font-size: 15px;
        color: #303133;
      }

      .chart-container {
        height: 300px;
      }
    }
  }

  .trend-section {
    background: #fff;
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    margin-top: 20px;

    h3 {
      margin: 0 0 20px;
      font-size: 16px;
      color: #303133;
      font-weight: 600;
    }

    .trend-filters {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
    }

    .trend-chart {
      height: 400px;
      width: 100%;
    }
  }

}
</style>



