<template>
  <div class="equipment-management">
    <div class="page-header">
      <h3>设备管理</h3>
      <div class="header-actions">
        <el-button v-if="isSimpleMode" @click="simpleShowTable = !simpleShowTable">
          {{ simpleShowTable ? '切换卡片' : '切换表格' }}
        </el-button>
        <el-button type="primary" :loading="exporting" @click="handleExport">
          <el-icon><Upload /></el-icon>
          批量导出
        </el-button>
        <el-button type="primary" @click="addEquipment">
          <el-icon><Plus /></el-icon>
          新增设备
        </el-button>
        <el-button
          type="danger"
          :disabled="selectedEquipmentIds.length === 0"
          @click="handleBatchDelete"
        >
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
        <el-button type="success" :loading="importPreviewLoading" @click="triggerImport">
          <el-icon><Download /></el-icon>
          批量导入
        </el-button>
        <el-button @click="downloadTemplate" type="info">
          <el-icon><Download /></el-icon>
          下载模板
        </el-button>
      </div>
    </div>

    <input
      ref="importFileInputRef"
      type="file"
      accept=".xlsx,.xls"
      style="display: none"
      @change="handleImportFileSelected"
    />

    <ImportPreviewDialog
      v-model="importPreviewVisible"
      title="设备管理 - 导入预览"
      :rows="importPreviewRows"
      :summary="importPreviewSummary"
      :truncated="importPreviewTruncated"
      :max-rows="importPreviewMaxRows"
      :confirm-loading="importSubmitting"
      :columns="equipmentImportColumns"
      @confirm="confirmImport"
    />

    <!-- 筛选 -->
    <SimpleFilterBar
      :enabled="isSimpleMode"
      v-model:expanded="simpleFilterExpanded"
      :summary-text="simpleFilterSummary"
    >
      <el-card class="filter-card">
        <FilterBar>
          <div class="filter-item">
            <span class="filter-label">场站</span>
            <FilterSelect
              v-model="searchForm.stationId"
              placeholder="全部"
              filterable
              clearable
              @change="search"
              @clear="search"
            >
              <el-option
                v-for="station in stations"
                :key="station.id"
                :label="station.station_name"
                :value="station.id"
              />
            </FilterSelect>
          </div>
          <div class="filter-item">
            <span class="filter-label">设备编号</span>
            <FilterAutocomplete
              v-model="searchForm.equipmentCode"
              :fetch-suggestions="fetchEquipmentCodeSuggestions"
              trigger-on-focus
              placeholder="全部"
              clearable
              @select="search"
              @input="search"
              @clear="search"
            />
          </div>
          <div class="filter-item">
            <span class="filter-label">设备名称</span>
            <FilterAutocomplete
              v-model="searchForm.equipmentName"
              :fetch-suggestions="fetchEquipmentNameSuggestions"
              trigger-on-focus
              placeholder="全部"
              clearable
              @select="search"
              @input="search"
              @clear="search"
            />
          </div>
          <div class="filter-item">
            <span class="filter-label">安装地点</span>
            <FilterAutocomplete
              v-model="searchForm.installationLocation"
              :fetch-suggestions="fetchInstallationLocationSuggestions"
              trigger-on-focus
              placeholder="全部"
              clearable
              @select="search"
              @input="search"
              @clear="search"
            />
          </div>
        </FilterBar>
      </el-card>
    </SimpleFilterBar>

    <TableWrapper v-if="!isSimpleMode || simpleShowTable">
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
        <el-table-column prop="installation_location" label="安装地点" width="200">
          <template #default="{ row }">
            {{ row.installation_location || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="equipment_code" label="设备编号" width="180" />
        <el-table-column prop="equipment_name" label="设备名称" width="200" />
        <el-table-column prop="specification" label="规格" width="140">
          <template #default="{ row }">
            {{ row.specification || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="model" label="型号" width="140">
          <template #default="{ row }">
            {{ row.model || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="material" label="材质" width="140">
          <template #default="{ row }">
            {{ row.material || '-' }}
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
    </TableWrapper>

    <div v-else class="simple-card-list" v-loading="loading">
      <el-empty v-if="equipmentPageList.length === 0" description="暂无设备数据" />
      <el-card v-for="row in equipmentPageList" :key="row.id" class="simple-equipment-card">
        <div class="card-header">
          <div class="header-left">
            <el-checkbox
              :model-value="isSimpleSelected(row.id)"
              @change="(checked) => handleSimpleSelectionChange(row.id, checked)"
            />
            <div class="title-group">
              <div class="title">{{ row.equipment_name || '-' }}</div>
              <div class="subtitle">{{ row.equipment_code || '-' }}</div>
            </div>
          </div>
          <div class="header-right">
            <span class="station">{{ row.station?.station_name || '-' }}</span>
            <el-button link @click="toggleSimpleExpanded(row.id)">
              <el-icon :class="{ 'is-expanded': simpleExpandedRows[row.id] }"><ArrowDown /></el-icon>
            </el-button>
          </div>
        </div>
        <div v-if="simpleExpandedRows[row.id]" class="card-body">
          <div class="meta-line">安装地点：{{ row.installation_location || '-' }}</div>
          <div class="meta-line">规格：{{ row.specification || '-' }}</div>
          <div class="meta-line">型号：{{ row.model || '-' }}</div>
          <div class="meta-line">材质：{{ row.material || '-' }}</div>
          <div class="card-actions">
            <el-button type="primary" size="small" @click="editEquipment(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="deleteEquipment(row.id)">删除</el-button>
          </div>
        </div>
      </el-card>
    </div>

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
        <el-form-item label="安装地点" prop="installationLocation">
          <el-input
            v-model="equipmentForm.installationLocation"
            placeholder="请输入安装地点"
          />
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
        <el-form-item label="规格">
          <el-input
            v-model="equipmentForm.specification"
            placeholder="请输入规格"
          />
        </el-form-item>
        <el-form-item label="型号">
          <el-input
            v-model="equipmentForm.model"
            placeholder="请输入型号"
          />
        </el-form-item>
        <el-form-item label="材质">
          <el-input
            v-model="equipmentForm.material"
            placeholder="请输入材质"
          />
        </el-form-item>
      </el-form>
    </FormDialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Upload, Download, Plus, Delete, ArrowDown } from '@element-plus/icons-vue';
import { useRoute } from 'vue-router';

import { createListSuggestionFetcher } from '@/utils/filterAutocomplete';
import {
  getEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment as deleteEquipmentApi,
  downloadEquipmentTemplate,
  importEquipment,
  previewImportEquipment
} from '@/api/equipment';
import { getAllStations } from '@/api/station';
import { useUserStore } from '@/store/modules/user';
import { useUiModeStore } from '@/store/modules/uiMode';
import FormDialog from '@/components/system/FormDialog.vue';
import ImportPreviewDialog from '@/components/common/ImportPreviewDialog.vue';
import SimpleFilterBar from '@/components/common/SimpleFilterBar.vue';
import { buildExportFileName, exportRowsToXlsx } from '@/utils/tableExport';

const userStore = useUserStore();
const uiModeStore = useUiModeStore();
const route = useRoute();

// 响应式数据
const loading = ref(false);
const exporting = ref(false);
const equipmentList = ref([]);
const equipmentTable = ref(null);
const selectedEquipmentIds = ref([]);
const canUseSimpleMode = computed(() => userStore.roleCode === 'dev_test' || userStore.baseRoleCode === 'dev_test');
const isSimpleMode = computed(() => canUseSimpleMode.value && uiModeStore.isSimpleMode);
const simpleShowTable = ref(false);
const simpleFilterExpanded = ref(false);
const simpleExpandedRows = ref({});

const resolvePageTitle = () => {
  if (typeof route?.meta?.title === 'string' && route.meta.title.trim()) {
    return route.meta.title.trim();
  }
  return '设备管理';
};

const fetchEquipmentCodeSuggestions = createListSuggestionFetcher(
  () => equipmentList.value,
  (row) => row.equipment_code
);
const fetchEquipmentNameSuggestions = createListSuggestionFetcher(
  () => equipmentList.value,
  (row) => row.equipment_name
);
const fetchInstallationLocationSuggestions = createListSuggestionFetcher(
  () => equipmentList.value,
  (row) => row.installation_location
);

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
  specification: '',
  model: '',
  material: '',
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
  specification: '',
  model: '',
  material: '',
  installationLocation: ''
});
const pagination = reactive({
  page: 1,
  pageSize: 5,
  pageSizes: [5, 10, 20, 50],
  total: 0
});

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

const equipmentImportColumns = computed(() => ([
  { prop: 'stationName', label: '场站', minWidth: 140 },
  { prop: 'equipmentCode', label: '设备编号', minWidth: 140 },
  { prop: 'equipmentName', label: '设备名称', minWidth: 160, diffKey: 'equipment_name' },
  { prop: 'installationLocation', label: '安装地点', minWidth: 160, diffKey: 'installation_location' },
  { prop: 'specification', label: '规格', minWidth: 120 },
  { prop: 'model', label: '型号', minWidth: 120 },
  { prop: 'material', label: '材质', minWidth: 120 }
]));

const equipmentPageList = computed(() => {
  const rows = Array.isArray(equipmentList.value) ? equipmentList.value : [];
  const start = (pagination.page - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  return rows.slice(start, end);
});

const simpleFilterSummary = computed(() => {
  const parts = [];
  if (searchForm.stationId) {
    const station = stations.value.find(item => String(item.id) === String(searchForm.stationId));
    if (station?.station_name) parts.push(`场站=${station.station_name}`);
  }
  if (searchForm.equipmentCode) parts.push(`设备编号=${searchForm.equipmentCode}`);
  if (searchForm.equipmentName) parts.push(`设备名称=${searchForm.equipmentName}`);
  if (searchForm.installationLocation) parts.push(`安装地点=${searchForm.installationLocation}`);
  return parts.length > 0 ? parts.join(' | ') : '当前筛选：全部';
});

const resolveExportColumns = () => ([
  { label: '场站', value: (row) => row?.station?.station_name ?? '-' },
  { label: '安装地点', value: (row) => row?.installation_location ?? '-' },
  { label: '设备编号', prop: 'equipment_code' },
  { label: '设备名称', prop: 'equipment_name' },
  { label: '规格', value: (row) => row?.specification ?? '-' },
  { label: '型号', value: (row) => row?.model ?? '-' },
  { label: '材质', value: (row) => row?.material ?? '-' }
]);

const handleExport = async () => {
  if (exporting.value) return;
  exporting.value = true;
  try {
    const title = resolvePageTitle();
    const fileName = buildExportFileName({ title });
    const rows = Array.isArray(equipmentList.value) ? equipmentList.value : [];

    if (rows.length === 0) {
      ElMessage.warning('没有可导出的数据');
      return;
    }

    await exportRowsToXlsx({
      title,
      fileName,
      sheetName: '设备管理',
      columns: resolveExportColumns(),
      rows
    });
    ElMessage.success('导出成功');
  } catch (error) {
    const msg = typeof error?.message === 'string' && error.message.trim() ? error.message.trim() : '导出失败';
    ElMessage.error(msg);
  } finally {
    exporting.value = false;
  }
};

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
,
  installationLocation: [
    { required: true, message: '请输入安装地点', trigger: 'blur' }
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
    const res = await getAllStations();
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
    specification: '',
    model: '',
    material: '',
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
    specification: row.specification ?? '',
    model: row.model ?? '',
    material: row.material ?? '',
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
      specification: equipmentForm.specification,
      model: equipmentForm.model,
      material: equipmentForm.material,
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

const isSimpleSelected = (id) => selectedEquipmentIds.value.includes(id);

const handleSimpleSelectionChange = (id, checked) => {
  const next = new Set(selectedEquipmentIds.value);
  if (checked) next.add(id);
  else next.delete(id);
  selectedEquipmentIds.value = Array.from(next);
};

const toggleSimpleExpanded = (id) => {
  simpleExpandedRows.value = {
    ...simpleExpandedRows.value,
    [id]: !simpleExpandedRows.value[id]
  };
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

const triggerImport = () => {
  if (importPreviewLoading.value) return;
  if (!importFileInputRef.value) return;
  importFileInputRef.value.click();
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
    const res = await previewImportEquipment(file);
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
    const results = await importEquipment(importFile.value);
    const list = Array.isArray(results) ? results : [];
    const created = list.filter(r => r?.status === 'success').length;
    const updated = list.filter(r => r?.status === 'updated').length;
    const skipped = list.filter(r => r?.status === 'skip').length;
    const failed = list.filter(r => r?.status === 'error').length;

    if (failed > 0) {
      ElMessage.warning(`导入完成：新增${created}条，更新${updated}条，跳过${skipped}条，失败${failed}条`);
    } else {
      ElMessage.success(`导入完成：新增${created}条，更新${updated}条，跳过${skipped}条`);
    }

    importPreviewVisible.value = false;
    importFile.value = null;
    loadEquipmentList(true);
  } finally {
    importSubmitting.value = false;
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

watch(isSimpleMode, (enabled) => {
  if (enabled) return;
  simpleShowTable.value = false;
  simpleFilterExpanded.value = false;
  simpleExpandedRows.value = {};
});
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

  .filter-card {
    margin-bottom: 16px;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
  }

  .simple-card-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .simple-equipment-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .title {
      font-size: 15px;
      font-weight: 600;
      color: #303133;
      word-break: break-all;
    }

    .subtitle {
      margin-top: 2px;
      color: #909399;
      font-size: 13px;
      word-break: break-all;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .station {
      color: #606266;
      font-size: 13px;
    }

    .card-body {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px dashed #ebeef5;
    }

    .meta-line {
      margin-top: 6px;
      color: #606266;
      font-size: 13px;
      line-height: 1.5;
    }

    .card-actions {
      margin-top: 10px;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
  }

  .is-expanded {
    transform: rotate(180deg);
  }
}
</style>

