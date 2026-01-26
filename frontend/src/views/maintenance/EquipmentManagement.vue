<template>
  <div class="equipment-management">
    <div class="page-header">
      <h3>设备管理</h3>
      <div class="header-actions">
        <el-button type="primary" @click="addEquipment">
          <el-icon><Plus /></el-icon>
          新增设备
        </el-button>
        <el-button
          type="danger"
          :disabled="selectedEquipmentIds.length === 0"
          @click="handleBatchDelete"
        >
          批量删除
        </el-button>
        <BaseUpload
          :action="`${apiBaseUrl}/equipment/import`"
          :headers="uploadHeaders"
          :on-success="handleImportSuccess"
          :on-error="handleImportError"
          :show-file-list="false"
          accept=".xlsx,.xls"
          :before-upload="beforeUpload"
        >
          <el-button type="primary" plain>
            <el-icon><Download /></el-icon>
            批量导入
          </el-button>
        </BaseUpload>
        <el-button @click="downloadTemplate" type="primary" plain>
          <el-icon><Download /></el-icon>
          下载模板
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="场站">
          <el-select
            v-model="searchForm.stationId"
            placeholder="请选择场站"
            clearable
            style="width: 200px;"
          >
            <el-option
              v-for="station in stations"
              :key="station.id"
              :label="station.station_name"
              :value="station.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="设备编号">
          <el-input
            v-model="searchForm.equipmentCode"
            placeholder="请输入设备编号"
            clearable
            style="width: 200px;"
          />
        </el-form-item>
        <el-form-item label="设备名称">
          <el-input
            v-model="searchForm.equipmentName"
            placeholder="请输入设备名称"
            clearable
            style="width: 200px;"
          />
        </el-form-item>
        <el-form-item label="安装地点">
          <el-input
            v-model="searchForm.installationLocation"
            placeholder="请输入安装地点"
            clearable
            style="width: 200px;"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 设备列表 -->
    <TableCard>
      <el-table
        ref="equipmentTable"
        :data="equipmentPageList"
        v-loading="loading"
        border
        style="width: 100%"
        row-key="id"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="station.station_name" label="场站" width="150">
          <template #default="{ row }">
            {{ row.station?.station_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="equipment_code" label="设备编号" width="180" />
        <el-table-column prop="equipment_name" label="设备名称" width="200" />
        <el-table-column prop="installation_location" label="安装地点" min-width="200">
          <template #default="{ row }">
            {{ row.installation_location || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="editEquipment(row)"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="deleteEquipment(row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="pagination.pageSizes"
          layout="total, sizes, prev, pager, next"
          @current-change="handlePageChange"
          @size-change="handlePageSizeChange"
        />
      </div>
    </TableCard>

    <!-- 新增/编辑对话框 -->
    <FormDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      :confirm-text="'确定'"
      :cancel-text="'取消'"
      @confirm="saveEquipment"
    >
      <el-form
        :model="equipmentForm"
        :rules="equipmentRules"
        ref="formRef"
        label-width="100px"
      >
        <el-form-item label="场站" prop="stationId">
          <el-select
            v-model="equipmentForm.stationId"
            placeholder="请选择场站"
            style="width: 100%;"
          >
            <el-option
              v-for="station in formStationOptions"
              :key="station.id"
              :label="station.station_name"
              :value="station.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="设备编号" prop="equipmentCode">
          <el-input
            v-model="equipmentForm.equipmentCode"
            placeholder="请输入设备编号"
          />
        </el-form-item>
        <el-form-item label="设备名称" prop="equipmentName">
          <el-input
            v-model="equipmentForm.equipmentName"
            placeholder="请输入设备名称"
          />
        </el-form-item>
        <el-form-item label="安装地点">
          <el-input
            v-model="equipmentForm.installationLocation"
            placeholder="请输入安装地点"
          />
        </el-form-item>
      </el-form>
    </FormDialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Upload, Download, Plus } from '@element-plus/icons-vue';
import {
  getEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment as deleteEquipmentApi,
  downloadEquipmentTemplate
} from '@/api/equipment';
import { getStations } from '@/api/station';
import { useUserStore } from '@/store/modules/user';
import { useUpload } from '@/composables/useUpload';
import FormDialog from '@/components/system/FormDialog.vue';

const userStore = useUserStore();

const { apiBaseUrl, uploadHeaders } = useUpload();

// API基础URL

// 上传文件的请求头

// 响应式数据
const loading = ref(false);
const equipmentList = ref([]);
const equipmentTable = ref(null);
const selectedEquipmentIds = ref([]);
const stations = ref([]);
const isActiveStatus = (status) => status === undefined || status === null || status === '' || status === 'active' || status === 1 || status === '1' || status === true;
const activeStationList = computed(() => stations.value.filter(station => isActiveStatus(station.status)));
const formStationOptions = computed(() => {
  const selectedId = equipmentForm.stationId;
  if (!selectedId) return activeStationList.value;
  const selected = stations.value.find(station => station.id === selectedId);
  if (selected && !isActiveStatus(selected.status)) {
    return [selected, ...activeStationList.value.filter(station => station.id !== selectedId)];
  }
  return activeStationList.value;
});

// 搜索表单
const searchForm = reactive({
  stationId: null,
  equipmentCode: '',
  equipmentName: '',
  installationLocation: ''
});

// 对话框控制
const dialogVisible = ref(false);
const dialogTitle = ref('');
const formRef = ref();

// 表单数据
const equipmentForm = reactive({
  id: null,
  stationId: null,
  equipmentCode: '',
  equipmentName: '',
  installationLocation: ''
});
const pagination = reactive({
  page: 1,
  pageSize: 10,
  pageSizes: [10, 20, 50],
  total: 0
});

const equipmentPageList = computed(() => {
  const rows = Array.isArray(equipmentList.value) ? equipmentList.value : [];
  const start = (pagination.page - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  return rows.slice(start, end);
});

// 表单验证规则
const equipmentRules = {
  stationId: [
    { required: true, message: '请选择场站', trigger: 'change' }
  ],
  equipmentCode: [
    { required: true, message: '请输入设备编号', trigger: 'blur' }
  ],
  equipmentName: [
    { required: true, message: '请输入设备名称', trigger: 'blur' }
  ]
};

// 获取设备列表
const loadEquipmentList = async (resetPage = false) => {
  loading.value = true;
  try {
    if (resetPage) {
      pagination.page = 1;
    }
    const params = {
      stationId: searchForm.stationId || undefined,
      equipmentCode: searchForm.equipmentCode || undefined,
      equipmentName: searchForm.equipmentName || undefined,
      installationLocation: searchForm.installationLocation || undefined
    };

    const res = await getEquipment(params);
    equipmentList.value = res || [];
    selectedEquipmentIds.value = [];
    if (equipmentTable.value) {
      equipmentTable.value.clearSelection();
    }
  } catch (error) {
    ElMessage.error('获取设备列表失败');
  } finally {
    loading.value = false;
  }
};

// 获取场站列表
const loadStations = async () => {
  try {
    const res = await getStations({ pageSize: 200 });
    stations.value = res.list || res || [];
  } catch (error) {
    
  }
};

// 搜索
const search = () => {
  loadEquipmentList(true);
};

// 重置搜索
const resetSearch = () => {
  searchForm.stationId = null;
  searchForm.equipmentCode = '';
  searchForm.equipmentName = '';
  searchForm.installationLocation = '';
  loadEquipmentList(true);
};

// 新增设备
const addEquipment = () => {
  Object.assign(equipmentForm, {
    id: null,
    stationId: null,
    equipmentCode: '',
    equipmentName: '',
    installationLocation: ''
  });
  dialogTitle.value = '新增设备';
  dialogVisible.value = true;
};

// 编辑设备
const editEquipment = (row) => {
  Object.assign(equipmentForm, {
    id: row.id,
    stationId: row.station_id,
    equipmentCode: row.equipment_code,
    equipmentName: row.equipment_name,
    installationLocation: row.installation_location
  });
  dialogTitle.value = '编辑设备';
  dialogVisible.value = true;
};

// 保存设备
const saveEquipment = async () => {
  try {
    await formRef.value.validate();

    const data = {
      stationId: equipmentForm.stationId,
      equipmentCode: equipmentForm.equipmentCode,
      equipmentName: equipmentForm.equipmentName,
      installationLocation: equipmentForm.installationLocation
    };

    if (equipmentForm.id) {
      // 更新
      await updateEquipment(equipmentForm.id, data);
      ElMessage.success('更新成功');
    } else {
      // 新增
      await createEquipment(data);
      ElMessage.success('新增成功');
    }

    dialogVisible.value = false;
    loadEquipmentList(true);
  } catch (error) {
    if (error.message) {
      ElMessage.error(error.message);
    }
  }
};

// 删除设备
const deleteEquipment = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这个设备吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    await deleteEquipmentApi(id);
    ElMessage.success('删除成功');
    loadEquipmentList(true);
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

const handleSelectionChange = (rows) => {
  selectedEquipmentIds.value = rows.map(row => row.id);
};

const handleBatchDelete = async () => {
  if (selectedEquipmentIds.value.length === 0) {
    ElMessage.warning('请选择要删除的设备');
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${selectedEquipmentIds.value.length} 台设备吗？`,
      '批量删除',
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }
    );
  } catch (error) {
    return;
  }

  let successCount = 0;
  for (const id of selectedEquipmentIds.value) {
    try {
      await deleteEquipmentApi(id);
      successCount += 1;
    } catch (error) {
      ElMessage.error('删除失败');
    }
  }

  if (successCount > 0) {
    ElMessage.success(`成功删除 ${successCount} 台设备`);
  }
  loadEquipmentList(true);
};

const handlePageChange = (page) => {
  pagination.page = page;
  selectedEquipmentIds.value = [];
  if (equipmentTable.value) {
    equipmentTable.value.clearSelection();
  }
};

const handlePageSizeChange = (size) => {
  pagination.pageSize = size;
  pagination.page = 1;
  selectedEquipmentIds.value = [];
  if (equipmentTable.value) {
    equipmentTable.value.clearSelection();
  }
};

// 下载模板
const downloadTemplate = async () => {
  try {
    const response = await downloadEquipmentTemplate();

    // 创建一个临时的URL来下载文件
    const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '设备信息模板.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    ElMessage.error('下载模板失败');
  }
};

// 上传前检查
const beforeUpload = (file) => {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                  file.type === 'application/vnd.ms-excel';
  const isLt5M = file.size / 1024 / 1024 < 5;

  if (!isExcel) {
    ElMessage.error('只能上传Excel文件!');
    return false;
  }
  if (!isLt5M) {
    ElMessage.error('文件大小不能超过5MB!');
    return false;
  }

  return true;
};

// 上传成功回调
const handleImportSuccess = (response) => {
  if (response && response.code === 200) {
    ElMessage.success(response.message || '导入成功');
    loadEquipmentList(true);
  } else {
    ElMessage.error(response.message || '导入失败');
  }
};

// 上传失败回调
const handleImportError = (error) => {
  
  try {
    const errorData = JSON.parse(error.message);
    ElMessage.error(errorData.message || '导入失败');
  } catch {
    ElMessage.error('导入失败');
  }
};

onMounted(() => {
  loadStations();
  loadEquipmentList(true);
});

watch(
  () => equipmentList.value.length,
  (total) => {
    pagination.total = total;
    const maxPage = Math.max(1, Math.ceil(total / pagination.pageSize));
    if (pagination.page > maxPage) {
      pagination.page = maxPage;
    }
  }
);
</script>

<style lang="scss" scoped>
.equipment-management {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h3 {
      margin: 0;
      font-size: 18px;
    }

    .header-actions {
      display: flex;
      gap: 10px;
    }
  }

  .search-card {
    margin-bottom: 20px;
  }

  .table-card {
    .el-table {
      margin-bottom: 20px;
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
  }
}
</style>
