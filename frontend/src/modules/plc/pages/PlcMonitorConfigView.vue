<template>
  <div class="config-management">
    <div class="page-header">
      <h2>监控点配置</h2>
      <div class="header-actions">
        <el-button v-if="isSimpleMode" @click="simpleShowTable = !simpleShowTable">
          {{ simpleShowTable ? '切换卡片' : '切换表格' }}
        </el-button>
        <el-button type="primary" :loading="exporting" @click="handleExport">
          <el-icon><Upload /></el-icon>批量导出
        </el-button>
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
      <SimpleFilterBar
        :enabled="isSimpleMode"
        v-model:expanded="simpleFilterExpanded"
        :summary-text="simpleFilterSummary"
      >
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
      </SimpleFilterBar>
    </el-card>

    <TableWrapper v-if="!isSimpleMode || simpleShowTable">
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
    <div v-else class="simple-card-list" v-loading="loading">
      <el-empty v-if="tableData.length === 0" description="暂无数据" />
      <div v-for="row in tableData" :key="row.id" class="simple-card-item">
        <div class="card-title">{{ row.name || '-' }}</div>
        <div class="card-meta">场站：{{ row.station?.station_name || '-' }}</div>
        <div class="card-meta">分类：{{ row.category?.category_name || '-' }}</div>
        <div class="card-meta">PLC IP：{{ row.plc_ip || '-' }}</div>
        <div class="card-meta">地址：DB{{ row.db_number }}.{{ row.offset_address }}</div>
        <div class="card-meta">数据类型：{{ row.data_type || '-' }}</div>
        <div class="card-meta">单位：{{ row.unit || '-' }}</div>
        <div class="card-meta">状态：{{ row.is_active ? '启用' : '禁用' }}</div>
        <div class="card-actions">
          <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
        </div>
      </div>
    </div>

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

    <input
      ref="importFileInputRef"
      type="file"
      accept=".xlsx,.xls"
      style="display: none"
      @change="handleImportFileSelected"
    />

    <ImportPreviewDialog
      v-model="importPreviewVisible"
      title="监控点配置 - 导入预览"
      :rows="importPreviewRows"
      :summary="importPreviewSummary"
      :truncated="importPreviewTruncated"
      :max-rows="importPreviewMaxRows"
      :confirm-loading="importSubmitting"
      :columns="importPreviewColumns"
      @confirm="confirmImport"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { UploadFilled, Upload } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRoute } from 'vue-router';
import SimpleFilterBar from '@/components/common/SimpleFilterBar.vue';
import { useSimpleMode } from '@/composables/useSimpleMode';
import {
  getConfigs, createConfig, updateConfig, deleteConfig,
  importConfigFile, previewImportConfigFile, getCategories, downloadConfigTemplate
} from '@/api/plcMonitor';
import TableWrapper from '@/components/common/TableWrapper.vue';
import ImportPreviewDialog from '@/components/common/ImportPreviewDialog.vue';
import request from '@/utils/request';
import { buildExportFileName, exportRowsToXlsx, fetchAllPaged } from '@/utils/tableExport';

const loading = ref(false);
const exporting = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const tableData = ref([]);
const stations = ref([]);
const categories = ref([]);
const formRef = ref(null);
const route = useRoute();
const { isSimpleMode, simpleShowTable, simpleFilterExpanded } = useSimpleMode();

// ==================== 批量导入（预览 -> 确认导入） ====================
const importFileInputRef = ref(null);
const importPreviewLoading = ref(false);
const importSubmitting = ref(false);
const importFile = ref(null);
const importPreviewVisible = ref(false);
const importPreviewSummary = ref({});
const importPreviewRows = ref([]);
const importPreviewTruncated = ref(false);
const importPreviewMaxRows = ref(0);

const importPreviewColumns = computed(() => ([
  { prop: 'name', label: '监控点名称', minWidth: 160, diffKey: 'name' },
  { prop: 'station', label: '场站', width: 140 },
  { prop: 'plcIp', label: 'PLC IP', width: 130 },
  { prop: 'dbNumber', label: 'DB', width: 90 },
  { prop: 'offsetAddress', label: '偏移地址', width: 110 },
  { prop: 'dataType', label: '数据类型', width: 100, diffKey: 'data_type' },
  { prop: 'category', label: '分类', width: 120, diffKey: 'category_id' },
  { prop: 'unit', label: '单位', width: 90, diffKey: 'unit' },
  { prop: 'description', label: '描述', minWidth: 160, diffKey: 'description' },
  { prop: 'isActive', label: '启用', width: 80, diffKey: 'is_active' },
  { prop: 'sortOrder', label: '排序', width: 80, diffKey: 'sort_order' }
]));

const filterForm = reactive({
  stationId: 'all',
  categoryId: 'all',
  isActive: 'all'
});
const resolveStationLabel = (id) => {
  if (id === 'all') return '全部';
  const matched = stations.value.find(item => item.id === id);
  return matched?.station_name || String(id);
};
const resolveCategoryLabel = (id) => {
  if (id === 'all') return '全部';
  const matched = categories.value.find(item => item.id === id);
  return matched?.category_name || String(id);
};
const resolveStatusLabel = (value) => {
  if (value === 'true') return '启用';
  if (value === 'false') return '禁用';
  return '全部';
};
const simpleFilterSummary = computed(() => {
  return `当前筛选：场站=${resolveStationLabel(filterForm.stationId)} | 分类=${resolveCategoryLabel(filterForm.categoryId)} | 状态=${resolveStatusLabel(filterForm.isActive)}`;
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

const resolvePageTitle = () => {
  if (typeof route?.meta?.title === 'string' && route.meta.title.trim()) {
    return route.meta.title.trim();
  }
  return '监控点配置';
};

const buildListParams = ({ page, pageSize }) => {
  const params = { page, pageSize };
  if (filterForm.stationId && filterForm.stationId !== 'all') params.stationId = filterForm.stationId;
  if (filterForm.categoryId && filterForm.categoryId !== 'all') params.categoryId = filterForm.categoryId;
  if (filterForm.isActive && filterForm.isActive !== 'all') params.isActive = filterForm.isActive;
  return params;
};

const resolveExportColumns = () => ([
  { label: '监控点名称', prop: 'name' },
  { label: '场站', value: (row) => row?.station?.station_name ?? '-' },
  { label: 'PLC IP', prop: 'plc_ip' },
  {
    label: '地址',
    value: (row) => {
      const dbNumber = row?.db_number ?? '';
      const offset = row?.offset_address ?? '';
      return `DB${dbNumber}.${offset}`;
    }
  },
  { label: '数据类型', prop: 'data_type' },
  { label: '分类', value: (row) => row?.category?.category_name ?? '-' },
  { label: '单位', value: (row) => row?.unit ?? '-' },
  { label: '状态', value: (row) => (row?.is_active ? '启用' : '禁用') }
]);

const handleExport = async () => {
  if (exporting.value) return;
  exporting.value = true;
  try {
    const title = resolvePageTitle();
    const fileName = buildExportFileName({ title });
    const { rows } = await fetchAllPaged({
      fetchPage: ({ page, pageSize }) => getConfigs(buildListParams({ page, pageSize })),
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
      sheetName: '监控点配置',
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
    const params = buildListParams({ page: pagination.page, pageSize: pagination.pageSize });
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
  if (importPreviewLoading.value) return;
  if (!importFileInputRef.value) return;
  importFileInputRef.value.click();
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

const isExcelFile = (file) => {
  const mime = file?.type;
  return mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || mime === 'application/vnd.ms-excel';
};

const handleImportFileSelected = async (event) => {
  const file = event?.target?.files?.[0];
  if (event?.target) event.target.value = '';
  if (!file) return;

  if (!isExcelFile(file)) {
    ElMessage.error('只能上传 Excel 文件');
    return;
  }
  if (file.size / 1024 / 1024 >= 5) {
    ElMessage.error('文件大小不能超过 5MB');
    return;
  }

  importFile.value = file;
  importPreviewLoading.value = true;
  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await previewImportConfigFile(formData);
    importPreviewSummary.value = res?.summary ?? {};
    importPreviewRows.value = Array.isArray(res?.rows) ? res.rows : [];
    importPreviewTruncated.value = !!res?.truncated;
    importPreviewMaxRows.value = typeof res?.maxRows === 'number' ? res.maxRows : 0;
    importPreviewVisible.value = true;
  } finally {
    importPreviewLoading.value = false;
  }
};

const confirmImport = async () => {
  if (!importFile.value) {
    ElMessage.warning('请选择文件');
    return;
  }

  importSubmitting.value = true;
  try {
    const formData = new FormData();
    formData.append('file', importFile.value);
    const res = await importConfigFile(formData);

    const created = typeof res?.created === 'number' ? res.created : 0;
    const updated = typeof res?.updated === 'number' ? res.updated : 0;
    const skipped = typeof res?.skipped === 'number' ? res.skipped : 0;
    const errors = Array.isArray(res?.errors) ? res.errors : [];

    if (errors.length > 0) {
      ElMessage.warning(`导入完成：新增${created}条，更新${updated}条，跳过${skipped}条（例如：${errors[0]}）`);
    } else {
      ElMessage.success(`导入完成：新增${created}条，更新${updated}条，跳过${skipped}条`);
    }

    importPreviewVisible.value = false;
    importFile.value = null;
    fetchData();
  } finally {
    importSubmitting.value = false;
  }
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

  .simple-card-list {
    display: grid;
    gap: 12px;
  }

  .simple-card-item {
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    padding: 12px;
  }

  .card-title {
    font-weight: 600;
    margin-bottom: 8px;
  }

  .card-meta {
    color: #606266;
    font-size: 14px;
    margin-bottom: 6px;
  }

  .card-actions {
    margin-top: 8px;
    display: flex;
    gap: 8px;
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

