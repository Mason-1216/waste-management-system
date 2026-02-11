<template>
  <div class="plc-data-report">
    <div class="page-header">
      <h2>PLC 数据报表</h2>
      <div class="header-actions">
        <el-button type="primary" :loading="exporting" @click="handleExport">
          <el-icon><Upload /></el-icon>批量导出
        </el-button>
      </div>
    </div>
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
      </FilterBar>
    </el-card>

    <div class="content-section">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="计量型报表" name="cumulative">
          <div class="table-header">
            <div class="title-row">
              <h3>数据报表</h3>
              <div class="header-actions">
                <el-select v-model="timeGranularity" style="width: 140px" @change="handleGranularityChange">
                  <el-option label="日" value="day" />
                  <el-option label="周" value="week" />
                  <el-option label="月" value="month" />
                  <el-option label="年" value="year" />
                </el-select>
              </div>
            </div>
          </div>

          <div v-if="cumulativeData.summary" class="summary-cards">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-statistic title="总用量" :value="cumulativeData.summary.totalUsage" :precision="2" />
              </el-col>
              <el-col :span="8">
                <el-statistic title="平均日用量" :value="cumulativeData.summary.avgDailyUsage" :precision="2" />
              </el-col>
              <el-col :span="8">
                <el-statistic title="最高日用量" :value="cumulativeData.summary.maxDailyUsage" :precision="2" />
              </el-col>
            </el-row>
          </div>

          <TableWrapper>
            <el-table :data="cumulativeData.data" border stripe>
              <el-table-column prop="date" label="日期" width="120" />
              <el-table-column prop="station_name" label="场站" width="150" />
              <el-table-column prop="config_name" label="监控点" min-width="180" />
              <el-table-column prop="address" label="地址" width="120" />
              <el-table-column prop="start_value" label="起始值" width="100" align="right">
                <template #default="{ row }">
                  {{ formatNumber(row.start_value) }}
                </template>
              </el-table-column>
              <el-table-column prop="end_value" label="结束值" width="100" align="right">
                <template #default="{ row }">
                  {{ formatNumber(row.end_value) }}
                </template>
              </el-table-column>
              <el-table-column prop="usage" label="用量" width="100" align="right">
                <template #default="{ row }">
                  <span style="font-weight: bold; color: #409eff">{{ formatNumber(row.usage) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="unit" label="单位" width="80" />
            </el-table>
          </TableWrapper>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="cumulativePagination.page"
              v-model:page-size="cumulativePagination.pageSize"
              :total="cumulativePagination.total"
              :page-sizes="[5, 10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleCumulativeSizeChange"
              @current-change="handleCumulativePageChange"
            />
          </div>

          <div v-if="cumulativeData.topRankings?.list?.length" class="ranking-section">
            <h3>用量排名 Top 10</h3>
            <TableWrapper>
              <el-table :data="cumulativeData.topRankings.list" border>
                <el-table-column type="index" label="排名" width="80" />
                <el-table-column prop="date" label="日期" width="120" />
                <el-table-column prop="config_name" label="监控点" min-width="180" />
                <el-table-column prop="usage" label="用量" width="120" align="right">
                  <template #default="{ row }">
                    <span style="font-weight: bold; color: #f56c6c">{{ formatNumber(row.usage) }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="unit" label="单位" width="80" />
              </el-table>
            </TableWrapper>
          </div>
        </el-tab-pane>

        <el-tab-pane label="变化型报表" name="fluctuating">
          <div class="table-header">
            <div class="title-row">
              <h3>数据报表</h3>
              <div class="header-actions">
                <el-select v-model="timeGranularity" style="width: 140px" @change="handleGranularityChange">
                  <el-option label="日" value="day" />
                  <el-option label="周" value="week" />
                  <el-option label="月" value="month" />
                  <el-option label="年" value="year" />
                </el-select>
              </div>
            </div>
          </div>

          <TableWrapper>
            <el-table :data="fluctuatingData.data" border stripe>
              <el-table-column prop="date" label="日期" width="120" />
              <el-table-column prop="station_name" label="场站" width="150" />
              <el-table-column prop="config_name" label="监控点" min-width="180" />
              <el-table-column prop="address" label="地址" width="120" />
              <el-table-column prop="min_value" label="最小值" width="100" align="right">
                <template #default="{ row }">
                  {{ row.min_value?.toFixed(2) }}
                </template>
              </el-table-column>
              <el-table-column prop="avg_value" label="平均值" width="100" align="right">
                <template #default="{ row }">
                  <span style="font-weight: bold">{{ row.avg_value?.toFixed(2) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="max_value" label="最大值" width="100" align="right">
                <template #default="{ row }">
                  {{ row.max_value?.toFixed(2) }}
                </template>
              </el-table-column>
              <el-table-column prop="sample_count" label="样本数" width="100" align="right" />
              <el-table-column prop="unit" label="单位" width="80" />
            </el-table>
          </TableWrapper>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="fluctuatingPagination.page"
              v-model:page-size="fluctuatingPagination.pageSize"
              :total="fluctuatingPagination.total"
              :page-sizes="[5, 10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleFluctuatingSizeChange"
              @current-change="handleFluctuatingPageChange"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { useRoute } from 'vue-router'
import { getCumulativeReport, getFluctuatingReport, getCategories } from '@/api/plcMonitor'
import { getAllStations } from '@/api/station'
import { buildExportFileName, exportSheetsToXlsx, fetchAllPaged } from '@/utils/tableExport'
const activeTab = ref('cumulative')
const startDate = ref(dayjs().subtract(5, 'day').format('YYYY-MM-DD'))
const endDate = ref(dayjs().format('YYYY-MM-DD'))
const timeGranularity = ref('day')
const stations = ref([])
const categories = ref([])
const exporting = ref(false)
const route = useRoute()

const filters = reactive({
  stationId: 'all',
  categoryId: 'all'
})

const cumulativeData = reactive({
  summary: null,
  data: [],
  topRankings: null
})

const fluctuatingData = reactive({
  data: []
})

const cumulativePagination = reactive({
  page: 1,
  pageSize: 5,
  total: 0
})

const fluctuatingPagination = reactive({
  page: 1,
  pageSize: 5,
  total: 0
})


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

const resolvePageTitle = () => {
  if (typeof route?.meta?.title === 'string' && route.meta.title.trim()) {
    return route.meta.title.trim()
  }
  return 'PLC 数据报表'
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
    const params = {
      stationId: filters.stationId === 'all' ? undefined : filters.stationId,
      categoryId: filters.categoryId === 'all' ? undefined : filters.categoryId,
      startDate: startDate.value,
      endDate: endDate.value,
      page: cumulativePagination.page,
      pageSize: cumulativePagination.pageSize,
      timeGranularity: timeGranularity.value
    }
    const res = await getCumulativeReport(params)
    const result = res || {}
    const normalize = (list = []) => list.map(item => ({
      ...item,
      start_value: Number(item.start_value),
      end_value: Number(item.end_value),
      usage: Number(item.usage)
    }))

    cumulativeData.summary = result?.summary || null
    cumulativeData.data = normalize(result?.data || [])
    cumulativeData.topRankings = result?.topRankings
      ? { list: normalize(result.topRankings.list || result.topRankings.daily || []) }
      : null
    cumulativePagination.total = result?.total || 0
  } catch (error) {
    ElMessage.error('加载计量型数据失败')
    console.error('Failed to load cumulative data:', error)
  }
}

const loadFluctuatingData = async () => {
  try {
    const params = {
      stationId: filters.stationId === 'all' ? undefined : filters.stationId,
      categoryId: filters.categoryId === 'all' ? undefined : filters.categoryId,
      startDate: startDate.value,
      endDate: endDate.value,
      page: fluctuatingPagination.page,
      pageSize: fluctuatingPagination.pageSize,
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
    fluctuatingData.data = normalize(result?.data || [])
    fluctuatingPagination.total = result?.total || 0
  } catch (error) {
    ElMessage.error('加载变化型数据失败')
    console.error('Failed to load fluctuating data:', error)
  }
}

const formatNumber = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '-'
  }
  return Number(value).toFixed(2)
}

const handleQuery = () => {
  cumulativePagination.page = 1
  fluctuatingPagination.page = 1
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

const handleGranularityChange = () => {
  handleQuery()
}

const handleCumulativePageChange = () => {
  loadCumulativeData()
}

const handleCumulativeSizeChange = () => {
  cumulativePagination.page = 1
  loadCumulativeData()
}

const handleFluctuatingPageChange = () => {
  loadFluctuatingData()
}

const handleFluctuatingSizeChange = () => {
  fluctuatingPagination.page = 1
  loadFluctuatingData()
}

const buildBaseParams = ({ page, pageSize }) => ({
  stationId: filters.stationId === 'all' ? undefined : filters.stationId,
  categoryId: filters.categoryId === 'all' ? undefined : filters.categoryId,
  startDate: startDate.value,
  endDate: endDate.value,
  page,
  pageSize,
  timeGranularity: timeGranularity.value
})

const normalizeCumulativeRows = (list = []) => list.map(item => ({
  ...item,
  start_value: Number(item.start_value),
  end_value: Number(item.end_value),
  usage: Number(item.usage)
}))

const normalizeFluctuatingRows = (list = []) => list.map(item => ({
  ...item,
  min_value: Number(item.min_value),
  avg_value: Number(item.avg_value),
  max_value: Number(item.max_value)
}))

const resolveCumulativeColumns = () => ([
  { label: '日期', prop: 'date' },
  { label: '场站', prop: 'station_name' },
  { label: '监控点', prop: 'config_name' },
  { label: '地址', prop: 'address' },
  { label: '起始值', value: (row) => formatNumber(row?.start_value) },
  { label: '结束值', value: (row) => formatNumber(row?.end_value) },
  { label: '用量', value: (row) => formatNumber(row?.usage) },
  { label: '单位', prop: 'unit' }
])

const resolveCumulativeTopColumns = () => ([
  { label: '排名', prop: 'rank' },
  { label: '日期', prop: 'date' },
  { label: '监控点', prop: 'config_name' },
  { label: '用量', value: (row) => formatNumber(row?.usage) },
  { label: '单位', prop: 'unit' }
])

const resolveFluctuatingColumns = () => ([
  { label: '日期', prop: 'date' },
  { label: '场站', prop: 'station_name' },
  { label: '监控点', prop: 'config_name' },
  { label: '地址', prop: 'address' },
  { label: '最小值', value: (row) => formatNumber(row?.min_value) },
  { label: '平均值', value: (row) => formatNumber(row?.avg_value) },
  { label: '最大值', value: (row) => formatNumber(row?.max_value) },
  { label: '样本数', prop: 'sample_count' },
  { label: '单位', prop: 'unit' }
])

const handleExport = async () => {
  if (exporting.value) return
  exporting.value = true
  try {
    const title = resolvePageTitle()
    const fileName = buildExportFileName({ title })

    if (activeTab.value === 'cumulative') {
      const { rows } = await fetchAllPaged({
        fetchPage: async ({ page, pageSize }) => {
          const res = await getCumulativeReport(buildBaseParams({ page, pageSize }))
          const result = res || {}
          return { list: normalizeCumulativeRows(result.data || []), total: result.total }
        },
        pageSize: 5000
      })

      const mainRows = Array.isArray(rows) ? rows : []
      const topRes = await getCumulativeReport(buildBaseParams({ page: 1, pageSize: 5 }))
      const topRankings = topRes?.topRankings?.list ? normalizeCumulativeRows(topRes.topRankings.list) : []

      if (mainRows.length === 0 && topRankings.length === 0) {
        ElMessage.warning('没有可导出的数据')
        return
      }

      const sheets = []
      if (mainRows.length > 0) {
        sheets.push({ name: '计量型报表', columns: resolveCumulativeColumns(), rows: mainRows })
      }
      if (Array.isArray(topRankings) && topRankings.length > 0) {
        sheets.push({ name: '用量排名Top10', columns: resolveCumulativeTopColumns(), rows: topRankings })
      }

      await exportSheetsToXlsx({ title, fileName, sheets })
      ElMessage.success('导出成功')
      return
    }

    const { rows } = await fetchAllPaged({
      fetchPage: async ({ page, pageSize }) => {
        const res = await getFluctuatingReport(buildBaseParams({ page, pageSize }))
        const result = res || {}
        return { list: normalizeFluctuatingRows(result.data || []), total: result.total }
      },
      pageSize: 5000
    })

    const mainRows = Array.isArray(rows) ? rows : []
    if (mainRows.length === 0) {
      ElMessage.warning('没有可导出的数据')
      return
    }

    await exportSheetsToXlsx({
      title,
      fileName,
      sheets: [{ name: '变化型报表', columns: resolveFluctuatingColumns(), rows: mainRows }]
    })
    ElMessage.success('导出成功')
  } catch (error) {
    const msg = typeof error?.message === 'string' && error.message.trim() ? error.message.trim() : '导出失败'
    ElMessage.error(msg)
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped lang="scss">
.plc-data-report {
  padding: 20px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      margin: 0;
      font-size: 20px;
      color: #303133;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }
  }

  .filter-card {
    margin-bottom: 20px;
  }

  .content-section {
    .summary-cards {
      margin-bottom: 20px;
      padding: 20px;
      background: #f5f7fa;
      border-radius: 4px;
    }

    .table-header {
      display: flex;
      flex-direction: column;
      margin-bottom: 16px;

      .title-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;

        h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }

        .header-actions {
          display: flex;
          gap: 12px;

          .el-button {
            min-width: 96px;
          }
        }
      }
    }

    .ranking-section {
      margin-top: 30px;

      h3 {
        margin-bottom: 16px;
        font-size: 16px;
        font-weight: 600;
      }
    }
  }
}
</style>

