<template>
  <div class="plc-records-page">
    <div class="page-header">
      <h2>PLC记录</h2>
      <el-button type="primary" @click="loadList">刷新</el-button>
    </div>

    <div class="filter-card">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="站点ID">
          <el-input v-model="filters.stationId" placeholder="站点ID" clearable style="width: 140px;" />
        </el-form-item>
        <el-form-item label="地磅ID">
          <el-input v-model="filters.scaleId" placeholder="地磅ID" clearable style="width: 140px;" />
        </el-form-item>
        <el-form-item label="车牌号">
          <el-input v-model="filters.vehicleNo" placeholder="车牌号" clearable style="width: 140px;" />
        </el-form-item>
        <el-form-item label="称重日期">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px;"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadList">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table :data="list" stripe border v-loading="loading">
      <el-table-column prop="record_code" label="记录编号" width="140" />
      <el-table-column prop="scale_id" label="地磅ID" width="120" />
      <el-table-column prop="station_id" label="站点ID" width="100" />
      <el-table-column label="称重时间" width="160">
        <template #default="{ row }">
          {{ formatDateTime(row.weight_time) }}
        </template>
      </el-table-column>
      <el-table-column prop="vehicle_no" label="车牌号" width="120" />
      <el-table-column prop="material" label="物料" min-width="120" show-overflow-tooltip />
      <el-table-column prop="weight_gross" label="毛重" width="100" />
      <el-table-column prop="weight_tare" label="皮重" width="100" />
      <el-table-column prop="weight_net" label="净重" width="100" />
      <el-table-column prop="operator_name" label="操作员" width="100" />
      <el-table-column prop="status" label="状态" width="100" />
      <el-table-column prop="source" label="来源" width="80" />
      <el-table-column prop="file_name" label="文件名" min-width="160" show-overflow-tooltip />
      <el-table-column label="原始数据" width="100" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openRawPayload(row)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next"
        @size-change="loadList"
        @current-change="loadList"
      />
    </div>

    <el-dialog v-model="rawDialogVisible" title="原始数据" width="640px">
      <pre class="raw-payload">{{ rawPayloadText }}</pre>
      <template #footer>
        <el-button @click="rawDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import request from '@/api/request';
import dayjs from 'dayjs';

const loading = ref(false);
const list = ref([]);
const rawDialogVisible = ref(false);
const rawPayloadText = ref('');

const filters = ref({
  stationId: '',
  scaleId: '',
  vehicleNo: '',
  dateRange: []
});

const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
});

const formatDateTime = (value) => {
  if (!value) return '-';
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm') : String(value);
};

const loadList = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize
    };
    if (filters.value.stationId) params.stationId = filters.value.stationId;
    if (filters.value.scaleId) params.scaleId = filters.value.scaleId;
    if (filters.value.vehicleNo) params.vehicleNo = filters.value.vehicleNo;
    if (filters.value.dateRange?.length === 2) {
      params.startDate = filters.value.dateRange[0];
      params.endDate = filters.value.dateRange[1];
    }

    const res = await request.get('/plc/records', { params });
    const data = res?.data || res;
    list.value = data?.list || data?.rows || [];
    pagination.value.total = data?.total || 0;
  } catch (e) {
    list.value = [];
    pagination.value.total = 0;
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  filters.value = {
    stationId: '',
    scaleId: '',
    vehicleNo: '',
    dateRange: []
  };
  pagination.value.page = 1;
  loadList();
};

const openRawPayload = (row) => {
  rawPayloadText.value = '';
  if (!row?.raw_payload) {
    rawPayloadText.value = '-';
  } else {
    try {
      const parsed = JSON.parse(row.raw_payload);
      rawPayloadText.value = JSON.stringify(parsed, null, 2);
    } catch {
      rawPayloadText.value = String(row.raw_payload);
    }
  }
  rawDialogVisible.value = true;
};

onMounted(() => {
  loadList();
});
</script>

<style lang="scss" scoped>
.plc-records-page {
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .filter-card {
    background: #fff;
    padding: 12px 16px;
    margin-bottom: 16px;
    border-radius: 6px;
  }

  .pagination-container {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }

  .raw-payload {
    max-height: 420px;
    overflow: auto;
    background: #f7f7f7;
    padding: 12px;
    border-radius: 6px;
    white-space: pre-wrap;
    word-break: break-all;
  }
}
</style>
