<template>
  <div class="plc-data-report" data-scrollbar="ignore">
    <el-card class="filter-card">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="场站">
          <el-select v-model="filters.stationId" placeholder="请选择场站" clearable>
            <el-option
              v-for="station in stations"
              :key="station.id"
              :label="station.station_name"
              :value="station.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="filters.categoryId" placeholder="请选择分类" clearable>
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.category_name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="content-card">
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
                <el-button type="success" @click="handleExport('cumulative')">导出Excel</el-button>
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

          <el-pagination
            v-model:current-page="cumulativePagination.page"
            v-model:page-size="cumulativePagination.pageSize"
            :total="cumulativePagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleCumulativeSizeChange"
            @current-change="handleCumulativePageChange"
          />

          <div v-if="cumulativeData.topRankings?.list?.length" class="ranking-section">
            <h3>用量排名 Top 10</h3>
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
                <el-button type="success" @click="handleExport('fluctuating')">导出Excel</el-button>
              </div>
            </div>
          </div>

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

          <el-pagination
            v-model:current-page="fluctuatingPagination.page"
            v-model:page-size="fluctuatingPagination.pageSize"
            :total="fluctuatingPagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleFluctuatingSizeChange"
            @current-change="handleFluctuatingPageChange"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { getCumulativeReport, getFluctuatingReport, getCategories } from '@/api/plcMonitor'
import { getAllStations } from '@/api/station'
const activeTab = ref('cumulative')
const dateRange = ref([])
const timeGranularity = ref('day')
const stations = ref([])
const categories = ref([])

const filters = reactive({
  stationId: null,
  categoryId: null
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
  pageSize: 10,
  total: 0
})

const fluctuatingPagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const startDate = computed(() => dateRange.value?.[0] || '')
const endDate = computed(() => dateRange.value?.[1] || '')

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
    const params = {
      stationId: filters.stationId,
      categoryId: filters.categoryId,
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
      stationId: filters.stationId,
      categoryId: filters.categoryId,
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
  dateRange.value = []
  filters.stationId = null
  filters.categoryId = null
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

const handleExport = (type) => {
  ElMessage.info('导出功能开发中')
}
</script>

<style scoped lang="scss">
.plc-data-report {
  padding: 20px;

  .filter-card {
    margin-bottom: 20px;
  }

  .filter-form :deep(.el-button) {
    min-width: 96px;
  }

  .content-card {
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

    .el-pagination {
      margin-top: 20px;
      justify-content: flex-end;
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
