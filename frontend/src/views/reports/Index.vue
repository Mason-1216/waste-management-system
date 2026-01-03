<template>
  <div class="reports-page">
    <div class="page-header">
      <h2>数据报表</h2>
    </div>

    <!-- 报表类型选择 -->
    <el-tabs v-model="activeTab" @tab-change="loadReport">
      <el-tab-pane label="进出料统计" name="inoutbound" />
      <el-tab-pane label="设备维修统计" name="maintenance" />
      <el-tab-pane label="安全检查统计" name="safety" />
    </el-tabs>

    <!-- 筛选条件 -->
    <div class="filter-bar">
      <el-date-picker
        v-model="filters.dateRange"
        type="daterange"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        @change="loadReport"
      />
      <el-select v-model="filters.stationId" placeholder="选择场站" clearable @change="loadReport">
        <el-option label="全部场站" :value="null" />
        <el-option
          v-for="s in stations"
          :key="s.id"
          :label="s.stationName"
          :value="s.id"
        />
      </el-select>
      <el-button type="primary" @click="loadReport">查询</el-button>
      <el-button @click="exportReport">
        <el-icon><Upload /></el-icon>导出Excel
      </el-button>
    </div>

    <!-- 图表区域 -->
    <div class="chart-section">
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="chart-card">
            <h3>{{ chartTitle }}</h3>
            <div ref="mainChartRef" class="chart-container"></div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="chart-card">
            <h3>{{ pieTitle }}</h3>
            <div ref="pieChartRef" class="chart-container"></div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <h3>详细数据</h3>
      <el-table :data="tableData" stripe border show-summary :summary-method="getSummary">
        <template v-if="activeTab === 'inoutbound'">
          <el-table-column prop="date" label="日期" width="120" />
          <el-table-column prop="inboundWeight" label="进料量(吨)" width="120" />
          <el-table-column prop="outboundWeight" label="出料量(吨)" width="120" />
          <el-table-column prop="inboundCount" label="进料次数" width="100" />
          <el-table-column prop="outboundCount" label="出料次数" width="100" />
          <el-table-column prop="netChange" label="净变化(吨)" width="120" />
        </template>
        <template v-else-if="activeTab === 'maintenance'">
          <el-table-column prop="equipmentName" label="设备" width="150" />
          <el-table-column prop="faultCount" label="故障次数" width="100" />
          <el-table-column prop="repairCount" label="维修次数" width="100" />
          <el-table-column prop="maintenanceCount" label="保养次数" width="100" />
          <el-table-column prop="totalCost" label="维修成本" width="120" />
          <el-table-column prop="avgRepairTime" label="平均修复时间" width="120" />
        </template>
        <template v-else-if="activeTab === 'safety'">
          <el-table-column prop="date" label="日期" width="120" />
          <el-table-column prop="selfInspectionCount" label="自检完成" width="100" />
          <el-table-column prop="otherInspectionCount" label="他检完成" width="100" />
          <el-table-column prop="hazardCount" label="发现隐患" width="100" />
          <el-table-column prop="rectifiedCount" label="已整改" width="100" />
          <el-table-column prop="pendingCount" label="待整改" width="100" />
        </template>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useUserStore } from '@/store/user';
import { ElMessage } from 'element-plus';
import dayjs from 'dayjs';
import request from '@/api/request';
import * as echarts from 'echarts';

const userStore = useUserStore();

const activeTab = ref('inoutbound');
const tableData = ref([]);
const stations = ref([]);
const mainChartRef = ref(null);
const pieChartRef = ref(null);
let mainChart = null;
let pieChart = null;

const filters = ref({
  dateRange: [
    dayjs().startOf('month').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD')
  ],
  stationId: null
});

const chartTitle = computed(() => {
  const titles = {
    inoutbound: '进出料趋势',
    maintenance: '维修统计',
    safety: '安全检查趋势'
  };
  return titles[activeTab.value];
});

const pieTitle = computed(() => {
  const titles = {
    inoutbound: '垃圾类型分布',
    maintenance: '故障类型分布',
    safety: '检查完成率'
  };
  return titles[activeTab.value];
});

const loadStations = async () => {
  try {
    const res = await request.get('/stations', { params: { pageSize: 100 } });
    stations.value = res.list || [];
  } catch (e) {
    
  }
};

const loadReport = async () => {
  try {
    const params = {
      type: activeTab.value,
      stationId: filters.value.stationId || userStore.currentStationId,
      startDate: filters.value.dateRange?.[0],
      endDate: filters.value.dateRange?.[1]
    };
    const res = await request.get('/reports', { params });
    tableData.value = res.tableData || [];

    await nextTick();
    renderMainChart(res.chartData);
    renderPieChart(res.pieData);
  } catch (e) {
    
  }
};

const renderMainChart = (data) => {
  if (!mainChartRef.value) return;

  if (!mainChart) {
    mainChart = echarts.init(mainChartRef.value);
  }

  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: data?.legend || [] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: data?.xAxis || []
    },
    yAxis: { type: 'value' },
    series: data?.series || []
  };

  mainChart.setOption(option);
};

const renderPieChart = (data) => {
  if (!pieChartRef.value) return;

  if (!pieChart) {
    pieChart = echarts.init(pieChartRef.value);
  }

  const option = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        type: 'pie',
        radius: '50%',
        data: data || [],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };

  pieChart.setOption(option);
};

const getSummary = ({ columns, data }) => {
  const sums = [];
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '合计';
      return;
    }
    const values = data.map(item => Number(item[column.property]));
    if (!values.every(value => isNaN(value))) {
      sums[index] = values.reduce((prev, curr) => {
        const value = Number(curr);
        if (!isNaN(value)) {
          return prev + curr;
        } else {
          return prev;
        }
      }, 0);
      sums[index] = sums[index].toFixed(2);
    } else {
      sums[index] = '-';
    }
  });
  return sums;
};

const exportReport = async () => {
  try {
    const params = {
      type: activeTab.value,
      stationId: filters.value.stationId || userStore.currentStationId,
      startDate: filters.value.dateRange?.[0],
      endDate: filters.value.dateRange?.[1]
    };
    const res = await request.get('/reports/export', {
      params,
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([res]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${chartTitle.value}_${dayjs().format('YYYYMMDD')}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (e) {
    
  }
};

const handleResize = () => {
  mainChart?.resize();
  pieChart?.resize();
};

onMounted(() => {
  loadStations();
  loadReport();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  mainChart?.dispose();
  pieChart?.dispose();
});
</script>

<style lang="scss" scoped>
.reports-page {
  .page-header {
    margin-bottom: 20px;

    h2 {
      margin: 0;
      font-size: 20px;
    }
  }

  .filter-bar {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    background: #fff;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }

  .chart-section {
    margin-bottom: 20px;

    .chart-card {
      background: #fff;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

      h3 {
        margin: 0 0 16px;
        font-size: 16px;
        color: #303133;
      }

      .chart-container {
        height: 300px;
      }
    }
  }

  .table-section {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

    h3 {
      margin: 0 0 16px;
      font-size: 16px;
      color: #303133;
    }
  }
}
</style>
