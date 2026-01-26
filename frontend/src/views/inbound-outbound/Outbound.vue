<template>
  <div class="outbound-page">
    <div class="page-header">
      <h2>出料记录</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showAddDialog" v-if="canAdd">
          <el-icon><Plus /></el-icon>新增出料
        </el-button>
        <el-button @click="exportData">
          <el-icon><Upload /></el-icon>导出
        </el-button>
      </div>
    </div>

    <!-- 筛选 -->
    <FilterBar>
      <el-date-picker
        v-model="filters.dateRange"
        type="daterange"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        @change="loadList"
      />
      <el-select v-model="filters.productType" placeholder="产品类型" clearable @change="loadList">
        <el-option label="沼气" value="biogas" />
        <el-option label="沼渣" value="residue" />
        <el-option label="沼液" value="liquid" />
        <el-option label="可回收物" value="recyclable" />
        <el-option label="其他" value="other" />
      </el-select>
      <el-input
        v-model="filters.vehicleNo"
        placeholder="车牌号"
        clearable
        style="width: 150px"
        @keyup.enter="loadList"
      />
      <el-button type="primary" @click="loadList">搜索</el-button>
    </FilterBar>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stat-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-value">{{ stats.todayCount }}</div>
          <div class="stat-label">今日出料次数</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-value">{{ stats.todayWeight }} <small>吨</small></div>
          <div class="stat-label">今日出料量</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-value">{{ stats.monthWeight }} <small>吨</small></div>
          <div class="stat-label">本月出料量</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalWeight }} <small>吨</small></div>
          <div class="stat-label">累计出料量</div>
        </div>
      </el-col>
    </el-row>

    <!-- 列表 -->
    <el-table :data="recordList" stripe border>
      <el-table-column prop="recordNo" label="单号" width="150" />
      <el-table-column prop="outboundTime" label="出料时间" width="160">
        <template #default="{ row }">
          {{ formatDateTime(row.outboundTime) }}
        </template>
      </el-table-column>
      <el-table-column label="产品类型" width="100">
        <template #default="{ row }">
          <el-tag :type="getProductTypeTag(row.productType)">
            {{ getProductTypeLabel(row.productType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="weight" label="重量(kg)" width="100" />
      <el-table-column prop="vehicleNo" label="车牌号" width="100" />
      <el-table-column prop="destination" label="目的地" width="150" show-overflow-tooltip />
      <el-table-column prop="operator.realName" label="操作员" width="100" />
      <el-table-column prop="remark" label="备注" show-overflow-tooltip />
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button link type="primary" @click="viewDetail(row)">详情</el-button>
          <el-button link type="primary" @click="printRecord(row)">打印</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @current-change="loadList"
        @size-change="loadList"
      />
    </div>

    <!-- 新增对话框 -->
    <FormDialog
      v-model="addDialogVisible"
      title="新增出料记录"
      width="600px"
      :confirm-text="'保存'"
      :cancel-text="'取消'"
      :confirm-loading="saving"
      @confirm="saveRecord"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="产品类型" prop="productType">
          <el-select v-model="form.productType" placeholder="请选择产品类型">
            <el-option label="沼气" value="biogas" />
            <el-option label="沼渣" value="residue" />
            <el-option label="沼液" value="liquid" />
            <el-option label="可回收物" value="recyclable" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="重量" prop="weight">
          <el-input-number v-model="form.weight" :min="0" :precision="2" />
          <span style="margin-left: 8px">kg</span>
        </el-form-item>
        <el-form-item label="车牌号">
          <el-input v-model="form.vehicleNo" placeholder="运输车辆车牌号" />
        </el-form-item>
        <el-form-item label="目的地" prop="destination">
          <el-input v-model="form.destination" placeholder="请输入目的地" />
        </el-form-item>
        <el-form-item label="接收单位">
          <el-input v-model="form.receivingUnit" placeholder="接收单位名称" />
        </el-form-item>
        <el-form-item label="出料时间" prop="outboundTime">
          <el-date-picker
            v-model="form.outboundTime"
            type="datetime"
            placeholder="选择时间"
            value-format="YYYY-MM-DD HH:mm"
            format="YYYY-MM-DD HH:mm"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
    </FormDialog>

    <!-- 详情对话框 -->
    <FormDialog
      v-model="detailVisible"
      title="出料记录详情"
      width="600px"
      :show-confirm="false"
      :show-cancel="false"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="单号">{{ currentRecord?.recordNo }}</el-descriptions-item>
        <el-descriptions-item label="出料时间">{{ formatDateTime(currentRecord?.outboundTime) }}</el-descriptions-item>
        <el-descriptions-item label="产品类型">{{ getProductTypeLabel(currentRecord?.productType) }}</el-descriptions-item>
        <el-descriptions-item label="重量">{{ currentRecord?.weight }} kg</el-descriptions-item>
        <el-descriptions-item label="车牌号">{{ currentRecord?.vehicleNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="目的地">{{ currentRecord?.destination }}</el-descriptions-item>
        <el-descriptions-item label="接收单位">{{ currentRecord?.receivingUnit || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作员">{{ currentRecord?.operator?.realName }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentRecord?.remark || '无' }}</el-descriptions-item>
      </el-descriptions>
    </FormDialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '@/store/modules/user';
import { ElMessage } from 'element-plus';
import dayjs from 'dayjs';
import request from '@/api/request';
import FormDialog from '@/components/system/FormDialog.vue';

const userStore = useUserStore();
const formRef = ref(null);

const recordList = ref([]);
const currentRecord = ref(null);
const addDialogVisible = ref(false);
const detailVisible = ref(false);
const saving = ref(false);

const stats = ref({
  todayCount: 0,
  todayWeight: 0,
  monthWeight: 0,
  totalWeight: 0
});

const filters = ref({
  dateRange: [],
  productType: '',
  vehicleNo: ''
});

const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
});

const form = ref({
  productType: '',
  weight: 0,
  vehicleNo: '',
  destination: '',
  receivingUnit: '',
  outboundTime: dayjs().format('YYYY-MM-DD HH:mm'),
  remark: ''
});

const rules = {
  productType: [{ required: true, message: '请选择产品类型', trigger: 'change' }],
  weight: [{ required: true, message: '请输入重量', trigger: 'blur' }],
  destination: [{ required: true, message: '请输入目的地', trigger: 'blur' }],
  outboundTime: [{ required: true, message: '请选择出料时间', trigger: 'change' }]
};

const canAdd = computed(() => {
  return ['operator', 'station_manager', 'admin'].includes(userStore.roleCode);
});

const getProductTypeLabel = (type) => {
  const labels = {
    biogas: '沼气',
    residue: '沼渣',
    liquid: '沼液',
    recyclable: '可回收物',
    other: '其他'
  };
  return labels[type] || type;
};

const getProductTypeTag = (type) => {
  const tags = {
    biogas: 'success',
    residue: 'warning',
    liquid: 'primary',
    recyclable: 'info',
    other: 'info'
  };
  return tags[type] || 'info';
};

const formatDateTime = (date) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-';

const loadList = async () => {
  try {
    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      stationId: userStore.currentStationId,
      productType: filters.value.productType || undefined,
      vehicleNo: filters.value.vehicleNo || undefined,
      startDate: filters.value.dateRange?.[0],
      endDate: filters.value.dateRange?.[1]
    };
    const res = await request.get('/outbound-records', { params });
    recordList.value = res.list || [];
    pagination.value.total = res.total || 0;
  } catch (e) {
    
  }
};

const loadStats = async () => {
  try {
    const res = await request.get('/outbound-records/stats', {
      params: { stationId: userStore.currentStationId }
    });
    stats.value = res;
  } catch (e) {
    
  }
};

const showAddDialog = () => {
  form.value = {
    productType: 'residue',
    weight: 0,
    vehicleNo: '',
    destination: '',
    receivingUnit: '',
    outboundTime: dayjs().format('YYYY-MM-DD HH:mm'),
    remark: ''
  };
  addDialogVisible.value = true;
};

const saveRecord = async () => {
  await formRef.value.validate();
  saving.value = true;
  try {
    await request.post('/outbound-records', {
      ...form.value,
      stationId: userStore.currentStationId
    });
    ElMessage.success('保存成功');
    addDialogVisible.value = false;
    loadList();
    loadStats();
  } catch (e) {
    
  } finally {
    saving.value = false;
  }
};

const viewDetail = (row) => {
  currentRecord.value = row;
  detailVisible.value = true;
};

const printRecord = (row) => {
  ElMessage.info('打印功能开发中');
};

const exportData = async () => {
  try {
    const res = await request.get('/outbound-records/export', {
      params: {
        stationId: userStore.currentStationId,
        startDate: filters.value.dateRange?.[0],
        endDate: filters.value.dateRange?.[1]
      },
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([res]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `出料记录_${dayjs().format('YYYYMMDD')}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (e) {
    
  }
};

onMounted(() => {
  loadList();
  loadStats();
});
</script>

<style lang="scss" scoped>
.outbound-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      margin: 0;
      font-size: 20px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }
  }

  .filter-bar {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 20px;
    background: #fff;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }

  .stat-row {
    margin-bottom: 20px;

    .stat-card {
      background: #fff;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

      .stat-value {
        font-size: 28px;
        font-weight: bold;
        color: #67C23A;

        small {
          font-size: 14px;
          font-weight: normal;
        }
      }

      .stat-label {
        font-size: 14px;
        color: #909399;
        margin-top: 4px;
      }
    }
  }

  .el-table {
    border-radius: 8px;
    overflow: hidden;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
    background: #fff;
    padding: 16px;
    border-radius: 8px;
  }
}
</style>
