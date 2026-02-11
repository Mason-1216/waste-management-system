<template>
  <div class="maintenance-record-page">
    <div class="page-header">
      <h2>设备保养记录</h2>
      <div class="header-actions">
        <el-button type="primary" :loading="exporting" @click="handleExport">
          <el-icon><Upload /></el-icon>批量导出
        </el-button>
        <el-button type="primary" @click="showAddDialog">
          <el-icon><Plus /></el-icon>新增保养记录
        </el-button>
      </div>
    </div>

    <!-- 筛选 -->
    <el-card class="filter-card">
      <FilterBar>
        <div class="filter-item">
          <span class="filter-label">审核状态</span>
          <FilterSelect v-model="filters.status" placeholder="全部" filterable clearable @change="loadList" @clear="loadList">
            <el-option label="全部" value="all" />
            <el-option label="待审核" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已驳回" value="rejected" />
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
      </FilterBar>
    </el-card>

    <!-- 列表 -->
    <el-table :data="recordList" stripe border>
      <el-table-column prop="equipmentName" label="设备名称" min-width="120" />
      <el-table-column prop="maintenanceType" label="保养类型" width="100">
        <template #default="{ row }">
          {{ getTypeLabel(row.maintenanceType) }}
        </template>
      </el-table-column>
      <el-table-column prop="maintenanceDate" label="保养日期" width="120">
        <template #default="{ row }">
          {{ formatDate(row.maintenanceDate) }}
        </template>
      </el-table-column>
      <el-table-column prop="workHours" label="工时" width="80">
        <template #default="{ row }">
          {{ row.workHours }}h
        </template>
      </el-table-column>
      <el-table-column label="审核状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.approvalStatus)">
            {{ getStatusLabel(row.approvalStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="operator.realName" label="操作人" width="100" />
      <el-table-column prop="description" label="保养内容" show-overflow-tooltip />
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button link type="primary" @click="viewDetail(row)">详情</el-button>
          <el-button
            v-if="row.approvalStatus === 'pending'"
            link
            type="danger"
            @click="deleteRecord(row)"
          >
            删除
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

    <!-- 新增对话框 -->
    <FormDialog
      v-model="addDialogVisible"
      title="新增保养记录"
      width="600px"
      :confirm-text="'保存'"
      :cancel-text="'取消'"
      :confirm-loading="saving"
      @confirm="saveRecord"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="设备名称" prop="equipmentName">
          <el-input v-model="form.equipmentName" placeholder="请输入设备名称" />
        </el-form-item>
        <el-form-item label="保养类型" prop="maintenanceType">
          <el-select v-model="form.maintenanceType" placeholder="请选择保养类型">
            <el-option label="日常保养" value="daily" />
            <el-option label="周保养" value="weekly" />
            <el-option label="月保养" value="monthly" />
            <el-option label="季度保养" value="quarterly" />
            <el-option label="年度保养" value="yearly" />
          </el-select>
        </el-form-item>
        <el-form-item label="保养日期" prop="maintenanceDate">
          <el-date-picker
            v-model="form.maintenanceDate"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="工时" prop="workHours">
          <el-input-number v-model="form.workHours" :min="0.5" :max="24" :step="0.5" />
          <span style="margin-left: 8px">小时</span>
        </el-form-item>
        <el-form-item label="保养内容" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请描述保养内容"
          />
        </el-form-item>
        <el-form-item label="更换配件">
          <el-input
            v-model="form.replacedParts"
            type="textarea"
            :rows="2"
            placeholder="如有更换配件请填写"
          />
        </el-form-item>
        <el-form-item label="现场照片">
          <BaseUpload
            :action="uploadUrl"
            :headers="uploadHeaders"
            :file-list="photoList"
            list-type="picture-card"
            accept="image/*"
            @change="(file, fileList) => updatePhotoList(fileList)"
            @success="(response, file, fileList) => updatePhotoList(fileList)"
            @remove="(file, fileList) => updatePhotoList(fileList)"
            @error="handleUploadError"
          >
            <el-icon><Plus /></el-icon>
          </BaseUpload>
        </el-form-item>
      </el-form>
    </FormDialog>

    <!-- 详情对话框 -->
    <FormDialog
      v-model="detailVisible"
      title="保养记录详情"
      width="600px"
      :show-confirm="false"
      :show-cancel="false"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="设备名称">{{ currentRecord?.equipmentName }}</el-descriptions-item>
        <el-descriptions-item label="保养类型">{{ getTypeLabel(currentRecord?.maintenanceType) }}</el-descriptions-item>
        <el-descriptions-item label="保养日期">{{ formatDate(currentRecord?.maintenanceDate) }}</el-descriptions-item>
        <el-descriptions-item label="工时">{{ currentRecord?.workHours }}小时</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ currentRecord?.operator?.realName }}</el-descriptions-item>
        <el-descriptions-item label="审核状态">
          <el-tag :type="getStatusType(currentRecord?.approvalStatus)">
            {{ getStatusLabel(currentRecord?.approvalStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="保养内容" :span="2">{{ currentRecord?.description }}</el-descriptions-item>
        <el-descriptions-item label="更换配件" :span="2">{{ currentRecord?.replacedParts || '无' }}</el-descriptions-item>
        <el-descriptions-item v-if="currentRecord?.approvalStatus === 'rejected'" label="驳回原因" :span="2">
          {{ currentRecord?.rejectReason }}
        </el-descriptions-item>
      </el-descriptions>
    </FormDialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '@/store/modules/user';
import { useUpload } from '@/composables/useUpload';
import { ElMessage, ElMessageBox } from 'element-plus';
import dayjs from 'dayjs';
import request from '@/api/request';
import FormDialog from '@/components/system/FormDialog.vue';
import { useRoute } from 'vue-router';
import { Upload } from '@element-plus/icons-vue';
import { buildExportFileName, exportRowsToXlsx, fetchAllPaged } from '@/utils/tableExport';

const userStore = useUserStore();
const route = useRoute();

const { uploadUrl, uploadHeaders, resolveUploadUrl } = useUpload();
const formRef = ref(null);

const recordList = ref([]);
const currentRecord = ref(null);
const addDialogVisible = ref(false);
const detailVisible = ref(false);
const saving = ref(false);
const photoList = ref([]);
const exporting = ref(false);

const today = dayjs().format('YYYY-MM-DD');
const defaultFilters = {
  status: 'all',
  startDate: dayjs().subtract(5, 'day').format('YYYY-MM-DD'),
  endDate: today
};
const filters = ref({ ...defaultFilters });

const pagination = ref({
  page: 1,
  pageSize: 5,
  total: 0
});

const form = ref({
  equipmentName: '',
  maintenanceType: '',
  maintenanceDate: '',
  workHours: 1,
  description: '',
  replacedParts: ''
});

const rules = {
  equipmentName: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  maintenanceType: [{ required: true, message: '请选择保养类型', trigger: 'change' }],
  maintenanceDate: [{ required: true, message: '请选择保养日期', trigger: 'change' }],
  description: [{ required: true, message: '请描述保养内容', trigger: 'blur' }]
};


const getTypeLabel = (type) => {
  const labels = {
    daily: '日常保养',
    weekly: '周保养',
    monthly: '月保养',
    quarterly: '季度保养',
    yearly: '年度保养'
  };
  return labels[type] || type;
};

const getStatusType = (status) => {
  const types = { pending: 'warning', approved: 'success', rejected: 'danger' };
  return types[status] || 'info';
};

const getStatusLabel = (status) => {
  const labels = { pending: '待审核', approved: '已通过', rejected: '已驳回' };
  return labels[status] || status;
};

const formatDate = (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-';

const normalizeUploadFile = (file) => {
  const responseUrl = file?.response?.data?.url ?? file?.response?.url ?? '';
  let rawUrl = '';
  if (responseUrl) {
    rawUrl = responseUrl;
  } else if (file?.url) {
    rawUrl = file.url;
  }
  const url = resolveUploadUrl(rawUrl);
  return url ? { ...file, url } : file;
};

const updatePhotoList = (fileList) => {
  photoList.value = (fileList ?? []).map(normalizeUploadFile);
};

const handleUploadError = () => {
  ElMessage.error('图片上传失败，请检查图片大小或网络');
};

const resolvePageTitle = () => {
  if (typeof route?.meta?.title === 'string' && route.meta.title.trim()) {
    return route.meta.title.trim();
  }
  return '设备保养记录';
};

const buildListParams = ({ page, pageSize }) => {
  const params = {
    page,
    pageSize,
    stationId: userStore.currentStationId
  };
  if (filters.value.status !== 'all') params.approvalStatus = filters.value.status;
  if (filters.value.startDate) params.startDate = filters.value.startDate;
  if (filters.value.endDate) params.endDate = filters.value.endDate;
  return params;
};

const resolveExportColumns = () => ([
  { label: '设备名称', prop: 'equipmentName' },
  { label: '保养类型', value: (row) => getTypeLabel(row?.maintenanceType) },
  { label: '保养日期', value: (row) => formatDate(row?.maintenanceDate) },
  { label: '工时', value: (row) => (row?.workHours !== undefined && row?.workHours !== null ? `${row.workHours}h` : '-') },
  { label: '审核状态', value: (row) => getStatusLabel(row?.approvalStatus) },
  { label: '操作人', value: (row) => row?.operator?.realName ?? '-' },
  { label: '保养内容', value: (row) => row?.description ?? '' }
]);

const handleExport = async () => {
  if (exporting.value) return;
  exporting.value = true;
  try {
    const title = resolvePageTitle();
    const fileName = buildExportFileName({ title });
    const { rows } = await fetchAllPaged({
      fetchPage: ({ page, pageSize }) => request.get('/maintenance-records', { params: buildListParams({ page, pageSize }) }),
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
      sheetName: '保养记录',
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

const loadList = async () => {
  try {
    const params = buildListParams({ page: pagination.value.page, pageSize: pagination.value.pageSize });
    const res = await request.get('/maintenance-records', { params });
    recordList.value = res.list || [];
    pagination.value.total = res.total || 0;
  } catch (e) {
    
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

const showAddDialog = () => {
  form.value = {
    equipmentName: '',
    maintenanceType: '',
    maintenanceDate: dayjs().format('YYYY-MM-DD'),
    workHours: 1,
    description: '',
    replacedParts: ''
  };
  photoList.value = [];
  addDialogVisible.value = true;
};

const saveRecord = async () => {
  await formRef.value.validate();
  saving.value = true;
  try {
    await request.post('/maintenance-records', {
      ...form.value,
      stationId: userStore.currentStationId,
      photos: photoList.value.map(p => p.url).join(',')
    });
    ElMessage.success('保存成功');
    addDialogVisible.value = false;
    loadList();
  } catch (e) {
    
  } finally {
    saving.value = false;
  }
};

const viewDetail = (row) => {
  currentRecord.value = row;
  detailVisible.value = true;
};

const deleteRecord = async (row) => {
  await ElMessageBox.confirm('确定删除该记录吗？', '提示', { type: 'warning' });
  try {
    await request.delete(`/maintenance-records/${row.id}`);
    ElMessage.success('删除成功');
    loadList();
  } catch (e) {
    
  }
};

onMounted(() => {
  loadList();
});
</script>

<style lang="scss" scoped>
.maintenance-record-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      margin: 0;
      font-size: 20px;
    }
  }

  .filter-bar {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .filter-card {
    margin-bottom: 16px;
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

