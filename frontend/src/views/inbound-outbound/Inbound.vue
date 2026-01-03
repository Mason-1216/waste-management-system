<template>
  <div class="inbound-page">
    <div class="page-header">
      <h2>进料记录</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showAddDialog" v-if="canAdd">
          <el-icon><Plus /></el-icon>新增进料
        </el-button>
        <el-button @click="exportData">
          <el-icon><Upload /></el-icon>导出
        </el-button>
      </div>
    </div>

    <!-- 筛选 -->
    <div class="filter-bar">
      <el-date-picker
        v-model="filters.dateRange"
        type="daterange"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        @change="loadList"
      />
      <el-select v-model="filters.wasteType" placeholder="垃圾类型" clearable @change="loadList">
        <el-option label="厨余垃圾" value="kitchen" />
        <el-option label="可回收物" value="recyclable" />
        <el-option label="有害垃圾" value="hazardous" />
        <el-option label="其他垃圾" value="other" />
      </el-select>
      <el-input
        v-model="filters.vehicleNo"
        placeholder="车牌号"
        clearable
        style="width: 150px"
        @keyup.enter="loadList"
      />
      <el-button type="primary" @click="loadList">搜索</el-button>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stat-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-value">{{ stats.todayCount }}</div>
          <div class="stat-label">今日进料次数</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-value">{{ stats.todayWeight }} <small>吨</small></div>
          <div class="stat-label">今日进料量</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-value">{{ stats.monthWeight }} <small>吨</small></div>
          <div class="stat-label">本月进料量</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalWeight }} <small>吨</small></div>
          <div class="stat-label">累计进料量</div>
        </div>
      </el-col>
    </el-row>

    <!-- 列表 -->
    <el-table :data="recordList" stripe border>
      <el-table-column prop="recordNo" label="单号" width="150" />
      <el-table-column prop="inboundTime" label="进料时间" width="160">
        <template #default="{ row }">
          {{ formatDateTime(row.inboundTime) }}
        </template>
      </el-table-column>
      <el-table-column label="垃圾类型" width="100">
        <template #default="{ row }">
          <el-tag :type="getWasteTypeTag(row.wasteType)">
            {{ getWasteTypeLabel(row.wasteType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="grossWeight" label="毛重(kg)" width="100" />
      <el-table-column prop="tareWeight" label="皮重(kg)" width="100" />
      <el-table-column prop="netWeight" label="净重(kg)" width="100" />
      <el-table-column prop="vehicleNo" label="车牌号" width="100" />
      <el-table-column prop="icCard.cardNo" label="IC卡号" width="120" />
      <el-table-column prop="operator.realName" label="操作员" width="100" />
      <el-table-column prop="remark" label="备注" show-overflow-tooltip />
      <el-table-column label="操作" width="120" fixed="right">
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
    <el-dialog v-model="addDialogVisible" title="新增进料记录" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="IC卡" prop="icCardId">
          <el-select
            v-model="form.icCardId"
            placeholder="请选择或刷卡"
            filterable
            @change="onIcCardChange"
          >
            <el-option
              v-for="card in icCardList"
              :key="card.id"
              :label="`${card.cardNo} - ${card.vehicleNo}`"
              :value="card.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="车牌号" prop="vehicleNo">
          <el-input v-model="form.vehicleNo" placeholder="车牌号" />
        </el-form-item>
        <el-form-item label="垃圾类型" prop="wasteType">
          <el-select v-model="form.wasteType" placeholder="请选择垃圾类型">
            <el-option label="厨余垃圾" value="kitchen" />
            <el-option label="可回收物" value="recyclable" />
            <el-option label="有害垃圾" value="hazardous" />
            <el-option label="其他垃圾" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="毛重" prop="grossWeight">
          <el-input-number v-model="form.grossWeight" :min="0" :precision="2" />
          <span style="margin-left: 8px">kg</span>
        </el-form-item>
        <el-form-item label="皮重" prop="tareWeight">
          <el-input-number v-model="form.tareWeight" :min="0" :precision="2" />
          <span style="margin-left: 8px">kg</span>
        </el-form-item>
        <el-form-item label="净重">
          <el-input :value="netWeight" disabled />
          <span style="margin-left: 8px">kg</span>
        </el-form-item>
        <el-form-item label="进料时间" prop="inboundTime">
          <el-date-picker
            v-model="form.inboundTime"
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
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRecord" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="进料记录详情" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="单号">{{ currentRecord?.recordNo }}</el-descriptions-item>
        <el-descriptions-item label="进料时间">{{ formatDateTime(currentRecord?.inboundTime) }}</el-descriptions-item>
        <el-descriptions-item label="垃圾类型">{{ getWasteTypeLabel(currentRecord?.wasteType) }}</el-descriptions-item>
        <el-descriptions-item label="车牌号">{{ currentRecord?.vehicleNo }}</el-descriptions-item>
        <el-descriptions-item label="IC卡号">{{ currentRecord?.icCard?.cardNo }}</el-descriptions-item>
        <el-descriptions-item label="来源单位">{{ currentRecord?.sourceUnit }}</el-descriptions-item>
        <el-descriptions-item label="毛重">{{ currentRecord?.grossWeight }} kg</el-descriptions-item>
        <el-descriptions-item label="皮重">{{ currentRecord?.tareWeight }} kg</el-descriptions-item>
        <el-descriptions-item label="净重">{{ currentRecord?.netWeight }} kg</el-descriptions-item>
        <el-descriptions-item label="操作员">{{ currentRecord?.operator?.realName }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentRecord?.remark || '无' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '@/store/user';
import { ElMessage } from 'element-plus';
import dayjs from 'dayjs';
import request from '@/api/request';

const userStore = useUserStore();
const formRef = ref(null);

const recordList = ref([]);
const icCardList = ref([]);
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
  wasteType: '',
  vehicleNo: ''
});

const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
});

const form = ref({
  icCardId: null,
  vehicleNo: '',
  wasteType: '',
  grossWeight: 0,
  tareWeight: 0,
  inboundTime: dayjs().format('YYYY-MM-DD HH:mm'),
  remark: ''
});

const rules = {
  wasteType: [{ required: true, message: '请选择垃圾类型', trigger: 'change' }],
  grossWeight: [{ required: true, message: '请输入毛重', trigger: 'blur' }],
  tareWeight: [{ required: true, message: '请输入皮重', trigger: 'blur' }],
  inboundTime: [{ required: true, message: '请选择进料时间', trigger: 'change' }]
};

const canAdd = computed(() => {
  return ['operator', 'station_manager', 'admin'].includes(userStore.roleCode);
});

const netWeight = computed(() => {
  return Math.max(0, (form.value.grossWeight || 0) - (form.value.tareWeight || 0)).toFixed(2);
});

const getWasteTypeLabel = (type) => {
  const labels = {
    kitchen: '厨余垃圾',
    recyclable: '可回收物',
    hazardous: '有害垃圾',
    other: '其他垃圾'
  };
  return labels[type] || type;
};

const getWasteTypeTag = (type) => {
  const tags = {
    kitchen: 'success',
    recyclable: 'primary',
    hazardous: 'danger',
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
      wasteType: filters.value.wasteType || undefined,
      vehicleNo: filters.value.vehicleNo || undefined,
      startDate: filters.value.dateRange?.[0],
      endDate: filters.value.dateRange?.[1]
    };
    const res = await request.get('/inbound-records', { params });
    recordList.value = res.list || [];
    pagination.value.total = res.total || 0;
  } catch (e) {
    
  }
};

const loadStats = async () => {
  try {
    const res = await request.get('/inbound-records/stats', {
      params: { stationId: userStore.currentStationId }
    });
    stats.value = res;
  } catch (e) {
    
  }
};

const loadIcCards = async () => {
  try {
    const res = await request.get('/ic-cards', {
      params: { stationId: userStore.currentStationId, status: 'active', pageSize: 200 }
    });
    icCardList.value = res.list || [];
  } catch (e) {
    
  }
};

const showAddDialog = () => {
  form.value = {
    icCardId: null,
    vehicleNo: '',
    wasteType: 'kitchen',
    grossWeight: 0,
    tareWeight: 0,
    inboundTime: dayjs().format('YYYY-MM-DD HH:mm'),
    remark: ''
  };
  addDialogVisible.value = true;
};

const onIcCardChange = (cardId) => {
  const card = icCardList.value.find(c => c.id === cardId);
  if (card) {
    form.value.vehicleNo = card.vehicleNo;
  }
};

const saveRecord = async () => {
  await formRef.value.validate();
  saving.value = true;
  try {
    await request.post('/inbound-records', {
      ...form.value,
      netWeight: parseFloat(netWeight.value),
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
    const res = await request.get('/inbound-records/export', {
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
    link.download = `进料记录_${dayjs().format('YYYYMMDD')}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (e) {
    
  }
};

onMounted(() => {
  loadList();
  loadStats();
  loadIcCards();
});
</script>

<style lang="scss" scoped>
.inbound-page {
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
        color: #409EFF;

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
