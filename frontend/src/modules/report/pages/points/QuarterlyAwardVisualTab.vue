<template>
  <div class="quarterly-award-visual-tab">
    <el-card class="filter-card">
      <SimpleFilterBar
        :enabled="isSimpleMode"
        v-model:expanded="simpleFilterExpanded"
        :summary-text="simpleFilterSummaryText"
      >
        <FilterBar>
          <div class="filter-item">
            <span class="filter-label">年份</span>
            <FilterSelect v-model="filters.year" style="width: 120px" @change="handlePeriodChange">
              <el-option v-for="y in yearOptions" :key="y" :label="`${y}年`" :value="y" />
            </FilterSelect>
          </div>
          <div class="filter-item">
            <span class="filter-label">季度</span>
            <FilterSelect v-model="filters.quarter" style="width: 120px" @change="handlePeriodChange">
              <el-option v-for="q in 4" :key="q" :label="`Q${q}`" :value="q" />
            </FilterSelect>
          </div>
          <div class="filter-item">
            <span class="filter-label">分组</span>
            <FilterSelect
              v-model="filters.group_id"
              placeholder="全部"
              clearable
              filterable
              style="width: 180px"
              @change="load"
              @clear="load"
            >
              <el-option label="全部" value="all" />
              <el-option v-for="g in groupOptions" :key="g.id" :label="g.group_name" :value="g.id" />
            </FilterSelect>
          </div>
        </FilterBar>
      </SimpleFilterBar>
    </el-card>

    <el-card class="chart-panel">
      <template #header>
        <span class="panel-title">季度积分奖排名分析（柱状图 + 折线图）</span>
      </template>
      <div ref="rankingChartRef" class="chart" />
    </el-card>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import dayjs from 'dayjs';
import * as echarts from 'echarts';

import FilterBar from '@/components/common/FilterBar.vue';
import FilterSelect from '@/components/common/FilterSelect.vue';
import SimpleFilterBar from '@/components/common/SimpleFilterBar.vue';
import { useSimpleMode } from '@/composables/useSimpleMode';
import { getQuarterlyAwardGroups, getQuarterlyAwardVisual } from '../../api/quarterlyAward';

const { isSimpleMode, simpleFilterExpanded } = useSimpleMode();

const currentYear = dayjs().year();
const currentQuarter = Math.ceil((dayjs().month() + 1) / 3);

const filters = reactive({
  year: currentYear,
  quarter: currentQuarter,
  group_id: 'all'
});

const groupOptions = ref([]);
const visualData = ref({ ranking: [] });

const yearOptions = computed(() => {
  const years = [];
  for (let y = currentYear; y >= currentYear - 5; y -= 1) {
    years.push(y);
  }
  return years;
});

const simpleFilterSummaryText = computed(() => {
  const selected = groupOptions.value.find(item => String(item.id) === String(filters.group_id));
  const groupText = filters.group_id === 'all' ? '全部' : (selected?.group_name || '全部');
  return `年份：${filters.year}年；季度：Q${filters.quarter}；分组：${groupText}`;
});

const rankingChartRef = ref(null);
let rankingChart = null;

const ensureChart = (refEl, current) => {
  if (!refEl?.value) return null;
  if (current) return current;
  return echarts.init(refEl.value);
};

const renderRankingChart = () => {
  rankingChart = ensureChart(rankingChartRef, rankingChart);
  if (!rankingChart) return;
  const data = visualData.value.ranking || [];
  const labels = data.map((item, index) => `${index + 1}. ${item.name || '-'}`);
  const sliderEnd = labels.length > 12 ? Math.max(20, Math.round((12 / labels.length) * 100)) : 100;

  rankingChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['季度积分', '季度积分奖'], top: 0 },
    grid: { left: 60, right: 60, top: 50, bottom: 90, containLabel: true },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: { rotate: 35, interval: 0 }
    },
    yAxis: [
      { type: 'value', name: '积分', position: 'left' },
      { type: 'value', name: '奖金(元)', position: 'right' }
    ],
    dataZoom: [
      { type: 'inside', start: 0, end: sliderEnd },
      { type: 'slider', start: 0, end: sliderEnd, height: 18, bottom: 20 }
    ],
    series: [
      {
        name: '季度积分',
        type: 'bar',
        data: data.map(item => item.points),
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '季度积分奖',
        type: 'line',
        yAxisIndex: 1,
        data: data.map(item => item.award),
        smooth: true,
        symbolSize: 8,
        itemStyle: { color: '#67C23A' },
        lineStyle: { width: 2 }
      }
    ]
  }, true);
};

const renderCharts = async () => {
  await nextTick();
  renderRankingChart();
};

const loadGroups = async () => {
  try {
    const data = await getQuarterlyAwardGroups({ year: filters.year, quarter: filters.quarter });
    groupOptions.value = Array.isArray(data) ? data : [];
    const exists = groupOptions.value.some(item => item.id === filters.group_id);
    if (filters.group_id !== 'all' && !exists) {
      filters.group_id = 'all';
    }
  } catch {
    groupOptions.value = [];
    filters.group_id = 'all';
  }
};

const load = async () => {
  try {
    const data = await getQuarterlyAwardVisual({
      year: filters.year,
      quarter: filters.quarter,
      group_id: filters.group_id === 'all' ? undefined : filters.group_id
    });
    visualData.value = { ranking: Array.isArray(data?.ranking) ? data.ranking : [] };
    await renderCharts();
  } catch {
    visualData.value = { ranking: [] };
    await renderCharts();
  }
};

const handlePeriodChange = async () => {
  filters.group_id = 'all';
  await loadGroups();
  await load();
};

const handleResize = () => {
  rankingChart?.resize();
};

onMounted(async () => {
  await loadGroups();
  await load();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  rankingChart?.dispose();
  rankingChart = null;
});
</script>

<style lang="scss" scoped>
.quarterly-award-visual-tab {
  .filter-card {
    margin-bottom: 20px;
  }

  .chart-panel {
    .panel-title {
      font-weight: 600;
    }

    .chart {
      height: 420px;
      width: 100%;
    }
  }
}
</style>
