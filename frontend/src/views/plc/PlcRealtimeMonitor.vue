<template>
  <div class="realtime-monitor">
    <el-card class="filter-card">
      <FilterBar>
      <div class="filter-item">
        <span class="filter-label">场站</span>
        <FilterSelect v-model="filterForm.stationId" placeholder="全部" filterable clearable style="width: 180px" @change="handleSearch" @clear="handleSearch">
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
        <FilterSelect v-model="filterForm.categoryId" placeholder="全部" filterable clearable style="width: 180px" @change="handleSearch" @clear="handleSearch">
          <el-option label="全部" value="all" />
          <el-option
            v-for="cat in categories"
            :key="cat.id"
            :label="cat.category_name"
            :value="cat.id"
          />
        </FilterSelect>
      </div>
      <el-switch
        v-model="autoRefresh"
        active-text="自动刷新"
      />
      </FilterBar>
    </el-card>

    <el-card class="status-card">
      <template #header>
        <div class="card-header">
          <span>PLC 服务状态（按 IP 判断）</span>
        </div>
      </template>
      <div class="status-info">
        <span>最后更新 {{ lastUpdate }}</span>
      </div>
      <div class="ip-status-list" v-if="ipStatusList.length">
        <div class="ip-status-row header">
          <span class="col ip">PLC IP</span>
          <span class="col station">场站</span>
          <span class="col status">状态</span>
        </div>
        <div class="ip-status-row" v-for="item in ipStatusList" :key="item.ip">
          <span class="col ip">{{ item.ip }}</span>
          <span class="col station">{{ item.stationName || '-' }}</span>
          <span class="col status">
            <el-tag :type="item.connected ? 'success' : 'danger'" size="small">
              {{ item.connected ? '在线' : '离线' }}
            </el-tag>
          </span>
        </div>
      </div>
    </el-card>

    <div class="data-section">
      <div class="section-title">实时监控数据</div>

      <TableWrapper>
        <el-table
          v-loading="loading"
          :data="pagedData"
          stripe
          border
          style="width: 100%"
        >
          <el-table-column prop="name" label="监控点名称" min-width="150" />
          <el-table-column prop="station.station_name" label="场站" width="120">
            <template #default="{ row }">
              {{ row.station?.station_name || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="category.category_name" label="分类" width="100">
            <template #default="{ row }">
              {{ row.category?.category_name || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="address" label="地址" width="140" />
          <el-table-column prop="dataType" label="数据类型" width="100" />
          <el-table-column prop="value" label="当前值" width="120" align="right">
            <template #default="{ row }">
              <span :class="{ 'value-error': !row.success }">
                {{ formatValue(row.value, row.dataType) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="unit" label="单位" width="80" align="center">
            <template #default="{ row }">
              {{ row.unit || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="连接" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="ipStatusMap[row.plcIp] ? 'success' : 'danger'" size="small">
                {{ ipStatusMap[row.plcIp] ? '在线' : '离线' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="success" label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.success ? 'success' : 'danger'" size="small">
                {{ row.success ? '正常' : '异常' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </TableWrapper>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[5, 10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, watch, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { getRealtimeData, getCategories, checkServiceStatus } from '@/api/plcMonitor';
import request from '@/utils/request';

const loading = ref(false);
const autoRefresh = ref(false);
const serviceStatus = ref('offline');
const ipStatusMap = reactive({});
const lastUpdate = ref('-');
const tableData = ref([]);
const stations = ref([]);
const categories = ref([]);
let refreshTimer = null;

const filterForm = reactive({
  stationId: 'all',
  categoryId: 'all'
});

const pagination = reactive({
  page: 1,
  pageSize: 5,
  total: 0
});

const formatValue = (value, dataType) => {
  if (value === null || value === undefined) return '-';
  if (dataType === 'BOOL') return value ? '是' : '否';
  if (dataType === 'REAL') return Number(value).toFixed(2);
  return value;
};

const fetchStations = async () => {
  try {
    const res = await request.get('/stations/all');
    stations.value = res || [];
  } catch (error) {
    console.error('获取场站列表失败:', error);
  }
};

const fetchCategories = async () => {
  try {
    const res = await getCategories({ isEnabled: 'true' });
    categories.value = res || [];
  } catch (error) {
    console.error('获取分类列表失败:', error);
  }
};

const fetchServiceStatus = async (ipList = []) => {
  if (!ipList.length) {
    try {
      const res = await checkServiceStatus();
      serviceStatus.value = res?.status || 'offline';
    } catch (error) {
      serviceStatus.value = 'offline';
    }
    return;
  }
  const uniqueIps = Array.from(new Set(ipList));
  await Promise.all(uniqueIps.map(async (ip) => {
    try {
      const res = await checkServiceStatus({ ip });
      ipStatusMap[ip] = res?.connected === true;
    } catch (e) {
      ipStatusMap[ip] = false;
    }
  }));
  const allOk = uniqueIps.every(ip => ipStatusMap[ip] === true);
  serviceStatus.value = allOk ? 'running' : 'offline';
};

const ipStatusList = computed(() => {
  const stationMap = {};
  (tableData.value || []).forEach(item => {
    if (!item?.plcIp) return;
    const name = item.station?.station_name;
    if (!stationMap[item.plcIp]) stationMap[item.plcIp] = new Set();
    if (name) stationMap[item.plcIp].add(name);
  });
  return Object.keys(ipStatusMap).map(ip => ({
    ip,
    connected: ipStatusMap[ip] === true,
    stationName: stationMap[ip] ? Array.from(stationMap[ip]).join('、') : ''
  }));
});

const pagedData = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  return (tableData.value || []).slice(start, end);
});

const fetchData = async () => {
  loading.value = true;
  try {
    const params = {};
    if (filterForm.stationId && filterForm.stationId !== 'all') params.stationId = filterForm.stationId;
    if (filterForm.categoryId && filterForm.categoryId !== 'all') params.categoryId = filterForm.categoryId;

    const res = await getRealtimeData(params);
    tableData.value = res || [];
    pagination.total = tableData.value.length;
    if (pagination.page > Math.ceil(pagination.total / pagination.pageSize)) {
      pagination.page = 1;
    }
    const ips = (tableData.value || []).map(i => i.plcIp).filter(Boolean);
    await fetchServiceStatus(ips);
    lastUpdate.value = new Date().toLocaleString('zh-CN');

  } catch (error) {
    console.error('获取实时数据失败:', error);
    ElMessage.error('获取实时数据失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  fetchData();
};

const resetFilters = () => {
  filterForm.stationId = 'all';
  filterForm.categoryId = 'all';
  handleSearch();
};

const handleSizeChange = (val) => {
  pagination.pageSize = val;
  pagination.page = 1;
};

const handleCurrentChange = (val) => {
  pagination.page = val;
};


const startAutoRefresh = () => {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(() => {
    fetchData();
  }, 5000);
};

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
};

watch(autoRefresh, (val) => {
  if (val) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
});

onMounted(() => {
  fetchStations();
  fetchCategories();
  fetchServiceStatus();
  fetchData();
});

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<style scoped lang="scss">
.realtime-monitor {
  .filter-card {
    margin-bottom: 20px;
  }

  .filter-bar {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
  }

  .status-card {
    margin-bottom: 16px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .status-info {
      color: #909399;
      font-size: 14px;
    }
  }

  .ip-status-list {
    margin-top: 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .ip-status-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 6px 12px;
    background: #f5f7fa;
    border-radius: 6px;
    font-size: 12px;
  }

  .ip-status-row.header {
    background: #eef2f6;
    font-weight: 600;
  }

  .col {
    display: inline-flex;
    align-items: center;
  }

  .col.ip {
    width: 140px;
    color: #303133;
  }

  .col.station {
    flex: 1;
    color: #606266;
  }

  .col.status {
    width: 80px;
    justify-content: flex-end;
  }

  .ip-text {
    color: #606266;
    font-size: 12px;
  }

  .data-section {
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 12px;
    }

    .value-error {
      color: #f56c6c;
    }
  }


  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>
