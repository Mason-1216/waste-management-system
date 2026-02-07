<template>
  <div class="plc-visual-report">
    <el-card class="filter-card">
      <FilterBar>
        <div class="filter-item">
          <span class="filter-label">开始日期</span>
          <el-date-picker
            v-model="startDate"
            type="date"
            placeholder="全部"
            value-format="YYYY-MM-DD"
            @change="handleQuery"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">结束日期</span>
          <el-date-picker
            v-model="endDate"
            type="date"
            placeholder="全部"
            value-format="YYYY-MM-DD"
            @change="handleQuery"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">场站</span>
          <FilterSelect v-model="filters.stationId" placeholder="全部" filterable clearable @change="handleQuery" @clear="handleQuery">
            <el-option label="全部" value="all" />
            <el-option
              v-for="station in stations"
              :key="station.id"
              :label="station.station_name"
              :value="station.id"
            />
          </FilterSelect>
        </div>
        <div class="filter-item">
          <span class="filter-label">分类</span>
          <FilterSelect v-model="filters.categoryId" placeholder="全部" filterable clearable @change="handleQuery" @clear="handleQuery">
            <el-option label="全部" value="all" />
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.category_name"
              :value="category.id"
            />
          </FilterSelect>
        </div>
        <div class="filter-item">
          <span class="filter-label">周期</span>
          <FilterSelect v-model="timeGranularity" placeholder="全部" filterable style="width: 140px" @change="handleGranularityChange">
            <el-option label="全部" value="all" />
            <el-option label="日" value="day" />
            <el-option label="周" value="week" />
            <el-option label="月" value="month" />
            <el-option label="年" value="year" />
          </FilterSelect>
        </div>
      </FilterBar>
    </el-card>

    <el-card class="content-card">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="计量型图表" name="cumulative">
          <div class="chart-container">
            <h3>用量趋势图</h3>
            <div ref="cumulativeTrendChart" class="chart" />
          </div>

          <div class="chart-container">
            <h3>用量排名图 (Top 10)</h3>
            <div ref="cumulativeRankChart" class="chart" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="变化型图表" name="fluctuating">
          <div class="chart-container">
            <h3>极值组合图</h3>
            <div ref="fluctuatingExtremeChart" class="chart" />
          </div>

          <div class="chart-container">
            <h3>箱线图</h3>
            <div ref="fluctuatingBoxChart" class="chart" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { getCumulativeReport, getFluctuatingReport, getCategories } from '@/api/plcMonitor'
import { getAllStations } from '@/api/station'
const activeTab = ref('cumulative')
const startDate = ref(dayjs().subtract(5, 'day').format('YYYY-MM-DD'))
const endDate = ref(dayjs().format('YYYY-MM-DD'))
const timeGranularity = ref('day')
const stations = ref([])
const categories = ref([])

const filters = reactive({
  stationId: 'all',
  categoryId: 'all'
})

const cumulativeTrendChart = ref(null)
const cumulativeRankChart = ref(null)
const fluctuatingExtremeChart = ref(null)
const fluctuatingBoxChart = ref(null)

let cumulativeTrendChartInstance = null
let cumulativeRankChartInstance = null
let fluctuatingExtremeChartInstance = null
let fluctuatingBoxChartInstance = null

const isMobileScreen = () => window.innerWidth <= 768

const toChineseNumber = (value) => {
  const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']
  if (value <= 0 || Number.isNaN(value)) return ''
  if (value < 10) return digits[value]
  if (value === 10) return '十'
  if (value < 20) return `十${digits[value % 10]}`
  const tens = Math.floor(value / 10)
  const ones = value % 10
  return `${digits[tens]}十${ones ? digits[ones] : ''}`
}

const formatDateLabel = (dateKey, granularity) => {
  if (!dateKey) return ''
  if (granularity === 'week') {
    const [year, week] = dateKey.split('-').map(Number)
    if (!year || !week) return dateKey
    return `${year}年第${toChineseNumber(week)}周`
  }
  if (granularity === 'month') {
    const [, month] = dateKey.split('-').map(Number)
    return month ? `${month}月` : dateKey
  }
  if (granularity === 'year') {
    const year = Number(dateKey)
    return year ? `${year}年` : dateKey
  }
  return dateKey
}

const getDateKeyOrder = (dateKey, granularity) => {
  if (!dateKey) return 0
  if (granularity === 'week') {
    const [year, week] = dateKey.split('-').map(Number)
    return (year || 0) * 100 + (week || 0)
  }
  if (granularity === 'month') {
    const [year, month] = dateKey.split('-').map(Number)
    return (year || 0) * 100 + (month || 0)
  }
  if (granularity === 'year') {
    return Number(dateKey) || 0
  }
  return new Date(dateKey).getTime()
}

const getSortedDateKeys = (dateKeys, granularity) => {
  const unique = Array.from(new Set(dateKeys.filter(Boolean)))
  return unique.sort((a, b) => getDateKeyOrder(a, granularity) - getDateKeyOrder(b, granularity))
}

onMounted(async () => {
  await loadStations()
  await loadCategories()
  await loadData()
})

const loadStations = async () => {
  try {
    const res = await getAllStations()
    stations.value = res?.data || res || []
  } catch (error) {
    console.error('Failed to load stations:', error)
  }
}

const loadCategories = async () => {
  try {
    const res = await getCategories()
    categories.value = res?.data || res || []
  } catch (error) {
    console.error('Failed to load categories:', error)
  }
}

const loadData = async () => {
  if (activeTab.value === 'cumulative') {
    await loadCumulativeData()
  } else {
    await loadFluctuatingData()
  }
}

const loadCumulativeData = async () => {
  try {
    const rangeStart = startDate.value
    const rangeEnd = endDate.value
    const params = {
      stationId: filters.stationId,
      categoryId: filters.categoryId,
      startDate: rangeStart,
      endDate: rangeEnd,
      page: 1,
      pageSize: 1000,
      timeGranularity: timeGranularity.value
    }
    const res = await getCumulativeReport(params)
    const result = res || {}
    const normalize = (list = []) => list.map(item => ({
      ...item,
      usage: Number(item.usage)
    }))
    const list = normalize(result?.data || result?.list || [])
    await nextTick()
    renderCumulativeTrendChart(list)
    const rankings = normalize(result?.topRankings?.list || result?.topRankings?.daily || []).slice(0, 10)
    renderCumulativeRankChart(rankings)
  } catch (error) {
    ElMessage.error('加载计量型数据失败')
    console.error('Failed to load cumulative data:', error)
  }
}

const loadFluctuatingData = async () => {
  try {
    const rangeStart = startDate.value
    const rangeEnd = endDate.value
    const params = {
      stationId: filters.stationId,
      categoryId: filters.categoryId,
      startDate: rangeStart,
      endDate: rangeEnd,
      page: 1,
      pageSize: 1000,
      timeGranularity: timeGranularity.value
    }
    const res = await getFluctuatingReport(params)
    const result = res || {}
    const normalize = (list = []) => list.map(item => ({
      ...item,
      min_value: Number(item.min_value),
      avg_value: Number(item.avg_value),
      max_value: Number(item.max_value)
    }))
    const list = normalize(result?.data || result?.list || [])
    await nextTick()
    renderFluctuatingExtremeChart(list)
    renderFluctuatingBoxChart(list)
  } catch (error) {
    ElMessage.error('加载变化型数据失败')
    console.error('Failed to load fluctuating data:', error)
  }
}

const renderCumulativeTrendChart = (data) => {
  const isMobile = isMobileScreen()
  if (!cumulativeTrendChart.value) return

  if (cumulativeTrendChartInstance) {
    cumulativeTrendChartInstance.dispose()
  }

  cumulativeTrendChartInstance = echarts.init(cumulativeTrendChart.value)

  const groupedData = {}
  const dateKeys = []
  data.forEach(item => {
    const key = item.config_name || item.address
    if (!groupedData[key]) {
      groupedData[key] = {}
    }
    groupedData[key][item.date] = item.usage
    dateKeys.push(item.date)
  })

  const sortedKeys = getSortedDateKeys(dateKeys, timeGranularity.value)
  const labels = sortedKeys.map(key => formatDateLabel(key, timeGranularity.value))
  const series = Object.entries(groupedData).map(([name, values]) => ({
    name,
    type: 'line',
    data: sortedKeys.map(key => values[key] ?? null),
    smooth: true
  }))

  const option = {
    title: { text: '用量趋势' },
    tooltip: { trigger: 'axis' },
    legend: { data: Object.keys(groupedData), type: 'scroll', bottom: 0 },
    grid: { left: isMobile ? 60 : '3%', right: '4%', bottom: isMobile ? 70 : '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: labels,
      boundaryGap: false,
      axisLabel: { rotate: labels.length > 8 ? 30 : 0 }
    },
    yAxis: { type: 'value', name: '用量' },
    series
  }

  cumulativeTrendChartInstance.setOption(option)
}

const renderCumulativeRankChart = (data) => {
  const isMobile = isMobileScreen()
  if (!cumulativeRankChart.value) return

  if (cumulativeRankChartInstance) {
    cumulativeRankChartInstance.dispose()
  }

  cumulativeRankChartInstance = echarts.init(cumulativeRankChart.value)

  const option = {
    title: { text: '用量排名 Top 10' },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: isMobile ? 60 : '3%', right: '4%', bottom: isMobile ? 70 : '8%', containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map(item => item.config_name || item.address),
      axisLabel: { rotate: 30 }
    },
    yAxis: { type: 'value', name: '用量' },
    series: [{
      type: 'bar',
      data: data.map(item => item.usage),
      itemStyle: { color: '#409eff' }
    }]
  }

  cumulativeRankChartInstance.setOption(option)
}

const renderFluctuatingExtremeChart = (data) => {
  const isMobile = isMobileScreen()
  if (!fluctuatingExtremeChart.value) return

  if (fluctuatingExtremeChartInstance) {
    fluctuatingExtremeChartInstance.dispose()
  }

  fluctuatingExtremeChartInstance = echarts.init(fluctuatingExtremeChart.value)

  const groupedData = {}
  const dateKeys = []
  data.forEach(item => {
    const key = item.config_name || item.address
    if (!groupedData[key]) {
      groupedData[key] = {}
    }
    groupedData[key][item.date] = {
      min: item.min_value,
      avg: item.avg_value,
      max: item.max_value
    }
    dateKeys.push(item.date)
  })

  const firstKey = Object.keys(groupedData)[0]
  if (!firstKey) return

  const sortedKeys = getSortedDateKeys(dateKeys, timeGranularity.value)
  const labels = sortedKeys.map(key => formatDateLabel(key, timeGranularity.value))
  const seriesData = sortedKeys.map(key => groupedData[firstKey][key] || { min: null, avg: null, max: null })

  const option = {
    title: { text: '极值组合图' },
    tooltip: { trigger: 'axis' },
    legend: { data: ['最小值', '平均值', '最大值'] },
    grid: { left: isMobile ? 60 : '3%', right: '4%', bottom: isMobile ? 70 : '8%', containLabel: true },
    xAxis: { type: 'category', data: labels, axisLabel: { rotate: labels.length > 8 ? 30 : 0 } },
    yAxis: { type: 'value', name: '数值' },
    series: [
      {
        name: '最小值',
        type: 'bar',
        data: seriesData.map(item => item.min),
        itemStyle: { color: '#4b90e2' },
        label: { show: true, position: 'top' },
        barGap: '400%'
      },
      {
        name: '平均值',
        type: 'line',
        data: seriesData.map(item => item.avg),
        itemStyle: { color: '#fac858' },
        lineStyle: { width: 3 },
        label: { show: true, position: 'top', fontWeight: 'bold' }
      },
      {
        name: '最大值',
        type: 'bar',
        data: seriesData.map(item => item.max),
        itemStyle: { color: '#999999' },
        label: { show: true, position: 'top' }
      }
    ]
  }

  fluctuatingExtremeChartInstance.setOption(option)
}

const renderFluctuatingBoxChart = (data) => {
  const isMobile = isMobileScreen()
  if (!fluctuatingBoxChart.value) return

  if (fluctuatingBoxChartInstance) {
    fluctuatingBoxChartInstance.dispose()
  }

  fluctuatingBoxChartInstance = echarts.init(fluctuatingBoxChart.value)

  const groupedData = {}
  data.forEach(item => {
    const key = item.config_name || item.address
    if (!groupedData[key]) {
      groupedData[key] = []
    }
    groupedData[key].push([item.min_value, item.avg_value - (item.avg_value - item.min_value) / 2, item.avg_value, item.avg_value + (item.max_value - item.avg_value) / 2, item.max_value])
  })

  const boxData = Object.entries(groupedData).map(([name, values]) => {
    const allValues = values.flat()
    return [Math.min(...allValues), ...values[0].slice(1, 4), Math.max(...allValues)]
  })

  const option = {
    title: { text: '箱线图' },
    tooltip: { trigger: 'item' },
    grid: { left: isMobile ? 60 : '10%', right: '10%', bottom: isMobile ? 80 : '15%' },
    xAxis: {
      type: 'category',
      data: Object.keys(groupedData),
      axisLabel: { rotate: 45 }
    },
    yAxis: { type: 'value', name: '数值' },
    series: [{
      type: 'boxplot',
      data: boxData
    }]
  }

  fluctuatingBoxChartInstance.setOption(option)
}

const handleGranularityChange = () => {
  loadData()
}

const handleQuery = () => {
  loadData()
}

const handleReset = () => {
  startDate.value = dayjs().subtract(5, 'day').format('YYYY-MM-DD')
  endDate.value = dayjs().format('YYYY-MM-DD')
  filters.stationId = 'all'
  filters.categoryId = 'all'
  handleQuery()
}

const handleTabChange = () => {
  loadData()
}
</script>

<style scoped lang="scss">
.plc-visual-report {
  padding: 20px;

  .filter-card {
    margin-bottom: 20px;
  }

  .content-card {
    .chart-container {
      margin-bottom: 40px;

      h3 {
        margin-bottom: 16px;
        font-size: 16px;
        font-weight: 600;
      }

      .chart {
        width: 100%;
        height: 400px;
      }
    }
  }

  @media screen and (max-width: 768px) {
    .content-card {
      .chart-container {
        .chart {
          height: 480px;
        }
      }
    }
  }
}
</style>
