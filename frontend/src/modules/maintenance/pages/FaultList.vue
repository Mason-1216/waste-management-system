<template>
  <div class="fault-list-page">
    <div class="page-header">
      <h2>故障上报单</h2>
      <div class="header-actions">
        <el-button type="primary" :loading="exporting" @click="handleExport">
          <el-icon><Upload /></el-icon>批量导出
        </el-button>
      </div>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <FilterBar>
        <div class="filter-item">
          <span class="filter-label">状态</span>
          <FilterSelect v-model="filters.status" placeholder="全部" filterable clearable @change="loadList">
            <el-option label="全部" value="all" />
            <el-option label="待处理" value="pending" />
            <el-option label="已派发" value="assigned" />
            <el-option label="维修中" value="in_progress" />
            <el-option label="已完成" value="completed" />
          </FilterSelect>
        </div>
        <div class="filter-item">
          <span class="filter-label">紧急程度</span>
          <FilterSelect v-model="filters.urgencyLevel" placeholder="全部" filterable clearable @change="loadList">
            <el-option label="全部" value="all" />
            <el-option label="一般" value="low" />
            <el-option label="较急" value="medium" />
            <el-option label="紧急" value="high" />
            <el-option label="非常紧急" value="critical" />
          </FilterSelect>
        </div>
        <div class="filter-item">
          <span class="filter-label">开始日期</span>
          <el-date-picker
            v-model="filters.startDate"
            type="date"
            placeholder="全部"
            value-format="YYYY-MM-DD"
            @change="loadList"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">结束日期</span>
          <el-date-picker
            v-model="filters.endDate"
            type="date"
            placeholder="全部"
            value-format="YYYY-MM-DD"
            @change="loadList"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">设备名称</span>
          <FilterAutocomplete
            v-model="filters.keyword"
            :fetch-suggestions="fetchEquipmentNameSuggestions"
            trigger-on-focus
            placeholder="全部"
            clearable
            style="width: 200px"
            @select="loadList"
            @input="loadList"
            @clear="loadList"
            @keyup.enter="loadList"
          />
        </div>
      </FilterBar>
    </el-card>

    <!-- 列表 -->
    <el-table :data="faultList" stripe border>
      <el-table-column prop="equipmentName" label="设备名称" min-width="120" />
      <el-table-column label="故障类型" width="100">
        <template #default="{ row }">
          {{ getFaultTypeLabel(row.faultType) }}
        </template>
      </el-table-column>
      <el-table-column label="紧急程度" width="100">
        <template #default="{ row }">
          <el-tag :type="getUrgencyType(row.urgencyLevel)" size="small">
            {{ getUrgencyLabel(row.urgencyLevel) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.displayStatus)" size="small">
            {{ getStatusLabel(row.displayStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="reporter.realName" label="上报人" width="100" />
      <el-table-column prop="location" label="位置" width="120" show-overflow-tooltip />
      <el-table-column label="上报时间" width="160">
        <template #default="{ row }">
          {{ formatDateTime(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button link type="primary" @click="viewDetail(row)">详情</el-button>
          <el-button
            v-if="row.status === 'pending' && canDispatch"
            link
            type="success"
            @click="dispatchRepair(row)"
          >
            派发维修
          </el-button>
          <el-button
            v-if="row.status === 'completed'"
            link
            type="info"
            @click="viewRepairRecord(row)"
          >
            维修记录
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[5, 10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @current-change="loadList"
        @size-change="loadList"
      />
    </div>

    <!-- 详情对话框 -->
    <FormDialog
      v-model="detailVisible"
      title="故障详情"
      width="600px"
      :show-confirm="false"
      :show-cancel="false"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="设备名称">{{ currentFault?.equipmentName }}</el-descriptions-item>
        <el-descriptions-item label="故障类型">{{ getFaultTypeLabel(currentFault?.faultType) }}</el-descriptions-item>
        <el-descriptions-item label="紧急程度">
          <el-tag :type="getUrgencyType(currentFault?.urgencyLevel)">
            {{ getUrgencyLabel(currentFault?.urgencyLevel) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentFault?.displayStatus)">
            {{ getStatusLabel(currentFault?.displayStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="上报人">{{ currentFault?.reporter?.realName }}</el-descriptions-item>
        <el-descriptions-item label="位置">{{ currentFault?.location }}</el-descriptions-item>
        <el-descriptions-item label="发现时间" :span="2">{{ formatDateTime(currentFault?.discoveryTime) }}</el-descriptions-item>
        <el-descriptions-item label="故障描述" :span="2">{{ currentFault?.description }}</el-descriptions-item>
      </el-descriptions>
      <div v-if="currentFault?.photos" class="photo-preview">
        <h4>现场照片</h4>
        <el-image
          v-for="(photo, index) in currentFault.photos.split(',')"
          :key="index"
          :src="photo"
          :preview-src-list="currentFault.photos.split(',')"
          style="width: 100px; height: 100px; margin-right: 8px"
          fit="cover"
        />
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">退出</el-button>
      </template>
    </FormDialog>

    <!-- 派发维修对话框 -->
    <FormDialog
      v-model="dispatchVisible"
      title="派发维修"
      width="500px"
      :confirm-text="'确认派发'"
      :cancel-text="'取消'"
      :confirm-loading="dispatching"
      @confirm="confirmDispatch"
    >
      <el-form :model="dispatchForm" label-width="100px">
        <el-form-item label="维修人员" required>
          <el-select v-model="dispatchForm.repairerId" placeholder="请选择维修人员">
            <el-option
              v-for="user in repairers"
              :key="user.id"
              :label="user.realName"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="维修要求">
          <el-input
            v-model="dispatchForm.requirements"
            type="textarea"
            :rows="3"
            placeholder="请输入维修要求或注意事项"
          />
        </el-form-item>
        <el-form-item label="预计完成">
          <el-date-picker
            v-model="dispatchForm.expectedCompletionTime"
            type="datetime"
            placeholder="选择预计完成时间"
            value-format="YYYY-MM-DD HH:mm"
            format="YYYY-MM-DD HH:mm"
          />
        </el-form-item>
      </el-form>
    </FormDialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '@/store/modules/user';
import { ElMessage } from 'element-plus';
import dayjs from 'dayjs';
import { useRoute } from 'vue-router';
import { Upload } from '@element-plus/icons-vue';

import { createListSuggestionFetcher } from '@/utils/filterAutocomplete';
import request from '@/api/request';
import FormDialog from '@/components/system/FormDialog.vue';
import { buildExportFileName, exportRowsToXlsx, fetchAllPaged } from '@/utils/tableExport';

const userStore = useUserStore();
const route = useRoute();

const faultList = ref([]);
const faultSuggestionList = ref([]);
const exporting = ref(false);

const fetchEquipmentNameSuggestions = createListSuggestionFetcher(
  () => faultSuggestionList.value,
  (row) => row.equipmentName
);

const repairers = ref([]);
const currentFault = ref(null);
const detailVisible = ref(false);
const dispatchVisible = ref(false);
const dispatching = ref(false);

const today = dayjs().format('YYYY-MM-DD');
const defaultFilters = {
  status: 'all',
  urgencyLevel: 'all',
  startDate: dayjs().subtract(5, 'day').format('YYYY-MM-DD'),
  endDate: today,
  keyword: ''
};
const filters = ref({ ...defaultFilters });

const pagination = ref({
  page: 1,
  pageSize: 5,
  total: 0
});

const dispatchForm = ref({
  repairerId: null,
  requirements: '',
  expectedCompletionTime: ''
});

const canDispatch = computed(() => {
  return userStore.hasRole('station_manager');
});

const resolvePageTitle = () => {
  if (typeof route?.meta?.title === 'string' && route.meta.title.trim()) {
    return route.meta.title.trim();
  }
  return '故障上报单';
};

const getFaultTypeLabel = (type) => {
  const labels = {
    mechanical: '机械故障',
    electrical: '电气故障',
    hydraulic: '液压故障',
    control: '控制系统故障',
    other: '其他'
  };
  return labels[type] || type;
};

const getUrgencyType = (level) => {
  const types = { low: 'info', medium: 'warning', high: 'danger', critical: 'danger' };
  return types[level] || 'info';
};

const getUrgencyLabel = (level) => {
  const labels = { low: '一般', medium: '较急', high: '紧急', critical: '非常紧急' };
  return labels[level] || level;
};

const getStatusType = (status) => {
  const types = {
    pending: 'info',
    assigned: 'warning',
    in_progress: 'primary',
    pending_verify: 'warning',
    completed: 'success',
    observe: 'warning',
    unsolved: 'danger'
  };
  return types[status] || 'info';
};

const getStatusLabel = (status) => {
  const labels = {
    pending: '待处理',
    assigned: '已派发',
    in_progress: '维修中',
    pending_verify: '待验收',
    completed: '已完成',
    observe: '待观察',
    unsolved: '未解决'
  };
  return labels[status] || status;
};

const resolveDisplayStatus = (item) => {
  const repair = item.repairRecord || item.repair_record;
  if (repair?.status === 'repairing') return 'in_progress';
  if (repair?.status === 'repaired_submitted') {
    if (repair.repair_result === 'observe') return 'observe';
    if (repair.repair_result === 'unsolved') return 'unsolved';
    return 'pending_verify';
  }
  if (repair?.status === 'accepted') return 'completed';
  if (repair?.status === 'dispatched') return 'assigned';
  if (repair?.status === 'submitted_report') return 'pending';

  if (item.status === 'processing') return 'in_progress';
  if (item.status === 'assigned') return 'assigned';
  if (item.status === 'completed' || item.status === 'closed') return 'completed';
  return 'pending';
};

const formatDateTime = (date) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-';

const buildListParams = ({ page, pageSize }) => {
  const params = {
    page,
    pageSize,
    stationId: userStore.currentStationId
  };

  if (filters.value.status !== 'all') params.status = filters.value.status;
  if (filters.value.urgencyLevel !== 'all') params.urgencyLevel = filters.value.urgencyLevel;
  if (filters.value.startDate) params.startDate = filters.value.startDate;
  if (filters.value.endDate) params.endDate = filters.value.endDate;

  const keyword = typeof filters.value.keyword === 'string' ? filters.value.keyword.trim() : '';
  if (keyword) params.keyword = keyword;

  return params;
};

const resolveExportColumns = () => ([
  { label: '设备名称', prop: 'equipmentName' },
  { label: '故障类型', value: (row) => getFaultTypeLabel(row?.faultType) },
  { label: '紧急程度', value: (row) => getUrgencyLabel(row?.urgencyLevel) },
  { label: '状态', value: (row) => getStatusLabel(row?.displayStatus) },
  { label: '上报人', value: (row) => row?.reporter?.realName ?? '-' },
  { label: '位置', value: (row) => row?.location ?? '-' },
  { label: '上报时间', value: (row) => formatDateTime(row?.createdAt) }
]);

const loadList = async () => {
  try {
    const params = buildListParams({ page: pagination.value.page, pageSize: pagination.value.pageSize });
    const res = await request.get('/fault-reports', { params });
    faultList.value = (res.list || []).map(item => ({
      ...item,
      displayStatus: resolveDisplayStatus(item)
    }));
    pagination.value.total = res.total || 0;
    loadFaultSuggestions(params);
  } catch (e) {
    
  }
};

const loadFaultSuggestions = async (baseParams) => {
  try {
    const params = {
      ...baseParams,
      page: 1,
      pageSize: 5000
    };
    const res = await request.get('/fault-reports', { params });
    faultSuggestionList.value = (res.list || []).map(item => ({
      ...item,
      displayStatus: resolveDisplayStatus(item)
    }));
  } catch (e) {
    faultSuggestionList.value = [];
  }
};

const handleExport = async () => {
  if (exporting.value) return;
  exporting.value = true;
  try {
    const title = resolvePageTitle();
    const fileName = buildExportFileName({ title });
    const { rows } = await fetchAllPaged({
      fetchPage: async ({ page, pageSize }) => {
        const params = buildListParams({ page, pageSize });
        const res = await request.get('/fault-reports', { params });
        const list = Array.isArray(res?.list) ? res.list : [];
        const mapped = list.map(item => ({ ...item, displayStatus: resolveDisplayStatus(item) }));
        return { list: mapped, total: res?.total };
      },
      pageSize: 5000
    });

    const list = Array.isArray(rows) ? rows : [];
    if (list.length === 0) {
      ElMessage.warning('没有可导出的数据');
      return;
    }

    await exportRowsToXlsx({
      title,
      fileName,
      sheetName: '故障上报单',
      columns: resolveExportColumns(),
      rows: list
    });
    ElMessage.success('导出成功');
  } catch (error) {
    const msg = typeof error?.message === 'string' && error.message.trim() ? error.message.trim() : '导出失败';
    ElMessage.error(msg);
  } finally {
    exporting.value = false;
  }
};

const handleSearch = () => {
  pagination.value.page = 1;
  loadList();
};

const resetFilters = () => {
  filters.value = { ...defaultFilters };
  pagination.value.page = 1;
  loadList();
};

const loadRepairers = async () => {
  try {
    const res = await request.get('/users', {
      params: { roleCode: 'maintenance', pageSize: 50 }
    });
    repairers.value = res.list || [];
  } catch (e) {
    
  }
};

const viewDetail = (row) => {
  currentFault.value = row;
  detailVisible.value = true;
};

const dispatchRepair = (row) => {
  currentFault.value = row;
  dispatchForm.value = {
    repairerId: null,
    requirements: '',
    expectedCompletionTime: ''
  };
  dispatchVisible.value = true;
};

const confirmDispatch = async () => {
  if (!dispatchForm.value.repairerId) {
    ElMessage.warning('请选择维修人员');
    return;
  }

  dispatching.value = true;
  try {
    await request.post('/repair-records', {
      faultReportId: currentFault.value.id,
      ...dispatchForm.value,
      stationId: userStore.currentStationId
    });
    ElMessage.success('派发成功');
    dispatchVisible.value = false;
    loadList();
  } catch (e) {
    
  } finally {
    dispatching.value = false;
  }
};

const viewRepairRecord = async (row) => {
  // TODO: 跳转到维修记录详情
  ElMessage.info('查看维修记录');
};

onMounted(() => {
  loadList();
  if (canDispatch.value) {
    loadRepairers();
  }
});
</script>

<style lang="scss" scoped>
.fault-list-page {
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
    flex-wrap: wrap;
  }

  .filter-card {
    margin-bottom: 20px;
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

  .photo-preview {
    margin-top: 20px;

    h4 {
      margin: 0 0 12px;
      font-size: 14px;
      color: #606266;
    }
  }
}
</style>

