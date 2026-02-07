<template>
  <div class="config-management">
    <div class="page-header">
      <h2>监控点配置</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleAdd">新增配置</el-button>
        <el-button type="success" @click="handleImport">
          <el-icon><Download /></el-icon>批量导入
        </el-button>
        <el-button type="info" @click="handleDownloadTemplate">
          <el-icon><Download /></el-icon>下载模板
        </el-button>
      </div>
    </div>

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
      <div class="filter-item">
        <span class="filter-label">状态</span>
        <FilterSelect v-model="filterForm.isActive" placeholder="全部" filterable clearable style="width: 180px" @change="handleSearch" @clear="handleSearch">
          <el-option label="全部" value="all" />
          <el-option label="启用" value="true" />
          <el-option label="禁用" value="false" />
        </FilterSelect>
      </div>
      </FilterBar>
    </el-card>

    <TableWrapper>
      <el-table
        v-loading="loading"
        :data="tableData"
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
        <el-table-column prop="plc_ip" label="PLC IP" width="130" />
        <el-table-column label="地址" width="120">
          <template #default="{ row }">
            DB{{ row.db_number }}.{{ row.offset_address }}
          </template>
        </el-table-column>
        <el-table-column prop="data_type" label="数据类型" width="100" />
        <el-table-column prop="category.category_name" label="分类" width="100">
          <template #default="{ row }">
            {{ row.category?.category_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column prop="is_active" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small">
              {{ row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
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

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑配置' : '新增配置'"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="监控点名称" prop="name">
          <el-input v-model="formData.name" placeholder="例如: 1#炉温度" />
        </el-form-item>
        <el-form-item label="场站" prop="stationId">
          <el-select v-model="formData.stationId" placeholder="选择场站" style="width: 100%;">
            <el-option
              v-for="station in stations"
              :key="station.id"
              :label="station.station_name"
              :value="station.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="PLC IP" prop="plcIp">
          <el-input v-model="formData.plcIp" placeholder="例如: 192.168.1.10" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="DB块号" prop="dbNumber">
              <el-input-number v-model="formData.dbNumber" :min="1" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="偏移地址" prop="offsetAddress">
              <el-input-number v-model="formData.offsetAddress" :min="0" :precision="1" :step="0.1" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="数据类型" prop="dataType">
              <el-select v-model="formData.dataType" style="width: 100%;">
                <el-option label="REAL (浮点数)" value="REAL" />
                <el-option label="DINT (双字整数)" value="DINT" />
                <el-option label="INT (整数)" value="INT" />
                <el-option label="BOOL (布尔)" value="BOOL" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类" prop="categoryId">
              <el-select v-model="formData.categoryId" placeholder="选择分类" style="width: 100%;">
                <el-option
                  v-for="cat in categories"
                  :key="cat.id"
                  :label="cat.category_name"
                  :value="cat.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="单位">
              <el-input v-model="formData.unit" placeholder="例如: ℃" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="formData.sortOrder" :min="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="formData.isActive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="批量导入配置" width="600px">
      <el-alert
        title="导入说明"
        type="info"
        description="请按模板格式准备数据，使用Excel文件导入。"
        show-icon
        :closable="false"
        style="margin-bottom: 16px;"
      />
      <BaseUpload
        ref="uploadRef"
        :auto-upload="false"
        :limit="1"
        :on-change="handleFileChange"
        :on-exceed="handleExceed"
        accept=".xlsx,.xls"
        drag
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">拖拽文件到此处或<em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">仅支持 .xlsx 或 .xls 格式</div>
        </template>
      </BaseUpload>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleImportSubmit" :loading="importing">导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { UploadFilled } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  getConfigs, createConfig, updateConfig, deleteConfig,
  importConfigFile, getCategories, downloadConfigTemplate
} from '@/api/plcMonitor';
import TableWrapper from '@/components/common/TableWrapper.vue';
import request from '@/utils/request';

const loading = ref(false);
const submitting = ref(false);
const importing = ref(false);
const dialogVisible = ref(false);
const importDialogVisible = ref(false);
const isEdit = ref(false);
const tableData = ref([]);
const stations = ref([]);
const categories = ref([]);
const formRef = ref(null);
const uploadRef = ref(null);
const uploadFile = ref(null);

const filterForm = reactive({
  stationId: 'all',
  categoryId: 'all',
  isActive: 'all'
});

const pagination = reactive({
  page: 1,
  pageSize: 5,
  total: 0
});

const formData = reactive({
  id: null,
  name: '',
  stationId: null,
  plcIp: '',
  dbNumber: 1,
  offsetAddress: 0,
  dataType: 'REAL',
  categoryId: null,
  unit: '',
  description: '',
  sortOrder: 0,
  isActive: true
});

const formRules = {
  name: [{ required: true, message: '请输入监控点名称', trigger: 'blur' }],
  plcIp: [
    { required: true, message: '请输入PLC IP', trigger: 'blur' },
    { pattern: /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/, message: 'IP格式不正确', trigger: 'blur' }
  ],
  dbNumber: [{ required: true, message: '请输入DB块号', trigger: 'blur' }],
  offsetAddress: [{ required: true, message: '请输入偏移地址', trigger: 'blur' }],
  dataType: [{ required: true, message: '请选择数据类型', trigger: 'change' }],
  categoryId: [{ required: true, message: '\u8bf7\u9009\u62e9\u5206\u7c7b', trigger: 'change' }]
};

const resetForm = () => {
  formData.id = null;
  formData.name = '';
  formData.stationId = null;
  formData.plcIp = '';
  formData.dbNumber = 1;
  formData.offsetAddress = 0;
  formData.dataType = 'REAL';
  formData.categoryId = null;
  formData.unit = '';
  formData.description = '';
  formData.sortOrder = 0;
  formData.isActive = true;
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

const fetchData = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    };
    if (filterForm.stationId && filterForm.stationId !== 'all') params.stationId = filterForm.stationId;
    if (filterForm.categoryId && filterForm.categoryId !== 'all') params.categoryId = filterForm.categoryId;
    if (filterForm.isActive && filterForm.isActive !== 'all') params.isActive = filterForm.isActive;

    const res = await getConfigs(params);
    tableData.value = res?.list || [];
    pagination.total = res?.total || 0;
  } catch (error) {
    console.error('获取配置列表失败:', error);
    ElMessage.error('获取配置列表失败');
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
  filterForm.isActive = 'all';
  pagination.page = 1;
  fetchData();
};

const handleSizeChange = (val) => {
  pagination.pageSize = val;
  pagination.page = 1;
  fetchData();
};

const handleCurrentChange = (val) => {
  pagination.page = val;
  fetchData();
};

const handleAdd = () => {
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  isEdit.value = true;
  formData.id = row.id;
  formData.name = row.name;
  formData.stationId = row.station_id;
  formData.plcIp = row.plc_ip;
  formData.dbNumber = row.db_number;
  formData.offsetAddress = parseFloat(row.offset_address);
  formData.dataType = row.data_type;
  formData.categoryId = row.category_id;
  formData.unit = row.unit;
  formData.description = row.description;
  formData.sortOrder = row.sort_order;
  formData.isActive = row.is_active;
  dialogVisible.value = true;
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该配置吗？', '提示', { type: 'warning' });
    await deleteConfig(row.id);
    ElMessage.success('删除成功');
    fetchData();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败');
    }
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    submitting.value = true;

    const data = { ...formData };

    if (isEdit.value) {
      await updateConfig(formData.id, data);
      ElMessage.success('更新成功');
    } else {
      await createConfig(data);
      ElMessage.success('创建成功');
    }

    dialogVisible.value = false;
    fetchData();
  } catch (error) {
    if (error !== false) {
      ElMessage.error(error.message || '操作失败');
    }
  } finally {
    submitting.value = false;
  }
};

const handleImport = () => {
  uploadFile.value = null;
  uploadRef.value?.clearFiles();
  importDialogVisible.value = true;
};

const handleDownloadTemplate = async () => {
  try {
    const blob = await downloadConfigTemplate();
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plc_config_template.xlsx';
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('下载模板失败:', error);
    ElMessage.error('下载模板失败');
  }
};

const handleImportSubmit = async () => {
  try {
    if (!uploadFile.value) {
      ElMessage.error('请选择要上传的文件');
      return;
    }

    importing.value = true;
    const formData = new FormData();
    formData.append('file', uploadFile.value);
    const res = await importConfigFile(formData);
    ElMessage.success(res.message || '导入成功');
    importDialogVisible.value = false;
    uploadFile.value = null;
    uploadRef.value?.clearFiles();
    fetchData();
  } catch (error) {
    ElMessage.error(error.message || '导入失败');
  } finally {
    importing.value = false;
  }
};

const handleFileChange = (file) => {
  uploadFile.value = file.raw;
};

const handleExceed = () => {
  ElMessage.warning('只能上传一个文件');
};

onMounted(() => {
  fetchStations();
  fetchCategories();
  fetchData();
});
</script>

<style scoped lang="scss">
.config-management {
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

  .filter-card {
    margin-bottom: 20px;
  }

  .filter-bar {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
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
