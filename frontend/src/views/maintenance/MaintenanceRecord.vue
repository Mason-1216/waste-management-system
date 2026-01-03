<template>
  <div class="maintenance-record-page">
    <div class="page-header">
      <h2>设备保养记录</h2>
      <el-button type="primary" @click="showAddDialog">
        <el-icon><Plus /></el-icon>新增保养记录
      </el-button>
    </div>

    <!-- 筛选 -->
    <div class="filter-bar">
      <el-select v-model="filters.status" placeholder="审核状态" clearable @change="loadList">
        <el-option label="待审核" value="pending" />
        <el-option label="已通过" value="approved" />
        <el-option label="已驳回" value="rejected" />
      </el-select>
      <el-date-picker
        v-model="filters.dateRange"
        type="daterange"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        @change="loadList"
      />
    </div>

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
      <el-table-column label="操作" width="150" fixed="right">
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
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @current-change="loadList"
        @size-change="loadList"
      />
    </div>

    <!-- 新增对话框 -->
    <el-dialog v-model="addDialogVisible" title="新增保养记录" width="600px">
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
          <el-upload
            :action="uploadUrl"
            :headers="uploadHeaders"
            :on-success="handleUploadSuccess"
            :file-list="photoList"
            list-type="picture-card"
            accept="image/*"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRecord" :loading="saving">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="保养记录详情" width="600px">
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
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '@/store/user';
import { ElMessage, ElMessageBox } from 'element-plus';
import dayjs from 'dayjs';
import request from '@/api/request';

const userStore = useUserStore();
const formRef = ref(null);

const recordList = ref([]);
const currentRecord = ref(null);
const addDialogVisible = ref(false);
const detailVisible = ref(false);
const saving = ref(false);
const photoList = ref([]);

const filters = ref({
  status: '',
  dateRange: []
});

const pagination = ref({
  page: 1,
  pageSize: 10,
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

const uploadUrl = computed(() => `${import.meta.env.VITE_API_BASE_URL}/upload`);
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${userStore.token}`
}));

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

const handleUploadSuccess = (response) => {
  if (response.code === 0) {
    photoList.value.push({
      name: response.data.filename,
      url: response.data.url
    });
  }
};

const loadList = async () => {
  try {
    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      stationId: userStore.currentStationId,
      approvalStatus: filters.value.status || undefined,
      startDate: filters.value.dateRange?.[0],
      endDate: filters.value.dateRange?.[1]
    };
    const res = await request.get('/maintenance-records', { params });
    recordList.value = res.list || [];
    pagination.value.total = res.total || 0;
  } catch (e) {
    
  }
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
    gap: 12px;
    margin-bottom: 20px;
    background: #fff;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
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
