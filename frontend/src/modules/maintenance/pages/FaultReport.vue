<template>

  <div class="fault-report-page">
    <div class="page-header">
      <h2>故障上报</h2>
      <div class="header-actions" v-if="activeTab === 'equipment' && canManageEquipment">
        <el-button type="info" @click="downloadEquipmentTemplate">
          <el-icon><Download /></el-icon>下载模板
        </el-button>
        <BaseUpload
          ref="uploadEquipmentRef"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleEquipmentFileChange"
          accept=".xlsx,.xls"
        >
          <el-button type="success">
            <el-icon><Download /></el-icon>批量导入
          </el-button>
        </BaseUpload>
        <el-button type="primary" @click="showAddEquipmentDialog">
          <el-icon><Plus /></el-icon>新增
        </el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" type="border-card">

      <el-tab-pane label="故障上报" name="report">

        <div class="report-form-card">

          <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">

            <el-form-item label="设备编号" prop="equipmentCode">

              <el-input

                v-model="form.equipmentCode"

                placeholder="请输入设备编号"

                @blur="handleEquipmentCodeBlur"

              />

            </el-form-item>



            <el-form-item label="设备名称" prop="equipmentName">

              <el-input v-model="form.equipmentName" placeholder="自动获取" disabled />

            </el-form-item>



            <el-form-item label="安装地点" prop="installationLocation">

              <el-input v-model="form.installationLocation" placeholder="自动获取" disabled />

            </el-form-item>



            <el-form-item label="故障类型" prop="faultType">

              <el-select v-model="form.faultType" placeholder="请选择故障类型">

                <el-option label="机械故障" value="mechanical" />

                <el-option label="电气故障" value="electrical" />

                <el-option label="液压故障" value="hydraulic" />

                <el-option label="控制系统故障" value="control" />

                <el-option label="其他" value="other" />

              </el-select>

            </el-form-item>



            <el-form-item label="紧急程度" prop="urgencyLevel">

              <el-radio-group v-model="form.urgencyLevel">

                <el-radio label="low">低</el-radio>

                <el-radio label="medium">中</el-radio>

                <el-radio label="high">高</el-radio>

                <el-radio label="critical">紧急</el-radio>

              </el-radio-group>

            </el-form-item>



            <el-form-item label="故障描述" prop="description">

              <el-input

                v-model="form.description"

                type="textarea"

                :rows="4"

                placeholder="请输入故障现象"

              />

            </el-form-item>



            <el-form-item label="发现时间" prop="discoveryTime">

              <el-date-picker

                v-model="form.discoveryTime"

                type="datetime"

                placeholder="请选择发现时间"

                value-format="YYYY-MM-DD HH:mm"

                format="YYYY-MM-DD HH:mm"

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

                <template #tip>

                  <div class="el-upload__tip">仅支持 jpg/png 格式，大小不超过 5MB</div>

                </template>

              </BaseUpload>

            </el-form-item>



            <el-form-item>

              <el-button type="primary" @click="submitReport" :loading="submitting" size="large">

                提交上报

              </el-button>

              <el-button @click="resetForm" size="large">重置</el-button>

            </el-form-item>

          </el-form>

        </div>



        <div class="recent-reports">

          <h3>近期上报记录</h3>

          <el-card class="filter-card">
            <FilterBar />
          </el-card>

          <el-table :data="recentReportRows" stripe border>

            <el-table-column prop="reportCode" label="上报编号" width="150" />

            <el-table-column prop="equipmentCode" label="设备编号" width="120" />

            <el-table-column prop="equipmentName" label="设备名称" width="140" />

            <el-table-column prop="installationLocation" label="安装地点" width="140" show-overflow-tooltip />

            <el-table-column label="紧急程度" width="100">

              <template #default="{ row }">

                <el-tag :type="getUrgencyType(row.urgencyLevel)">

                  {{ getUrgencyLabel(row.urgencyLevel) }}

                </el-tag>

              </template>

            </el-table-column>

            <el-table-column prop="faultDescription" label="故障描述" width="200" show-overflow-tooltip />

            <el-table-column prop="faultDate" label="上报日期" width="120">

              <template #default="{ row }">

                {{ formatDate(row.faultDate) }}

              </template>

            </el-table-column>

            <el-table-column prop="faultTime" label="上报时间" width="110" />

            <el-table-column prop="reporterName" label="上报人" width="100" />

            <el-table-column label="状态" width="100">

              <template #default="{ row }">

                <el-tag :type="getStatusType(row.displayStatus)">

                  {{ getStatusLabel(row.displayStatus) }}

                </el-tag>

              </template>

            </el-table-column>

          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="recentPagination.page"
              v-model:page-size="recentPagination.pageSize"
              :page-sizes="[5, 10, 20, 50]"
              :total="recentPagination.total"
              layout="total, sizes, prev, pager, next"
              @current-change="handleRecentPageChange"
              @size-change="handleRecentPageSizeChange"
            />
          </div>

        </div>

      </el-tab-pane>



      <el-tab-pane label="设备管理" name="equipment" v-if="canManageEquipment">

        <div class="equipment-panel">

          <div class="panel-header">

            <h4>设备管理</h4>
            <el-button type="primary" :loading="equipmentExporting" @click="handleExportEquipment">
              <el-icon><Upload /></el-icon>批量导出
            </el-button>


          </div>



          <el-card class="filter-card">
            <FilterBar />
          </el-card>

          <el-table :data="equipmentTableRows" stripe border v-loading="loadingEquipment">

            <el-table-column label="场站" width="150">

              <template #default="{ row }">

                {{ row.station?.station_name || '-' }}

              </template>

            </el-table-column>

            <el-table-column prop="equipment_code" label="设备编号" width="150" />

            <el-table-column prop="equipment_name" label="设备名称" width="200" />

            <el-table-column prop="installation_location" label="安装地点" show-overflow-tooltip />

            <el-table-column label="操作" width="160">

              <template #default="{ row }">

                <el-button link size="small" @click="editEquipment(row)">编辑</el-button>

                <el-button link size="small" type="danger" @click="deleteEquipmentItem(row.id)">删除</el-button>

              </template>

            </el-table-column>

          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="equipmentPagination.page"
              v-model:page-size="equipmentPagination.pageSize"
              :page-sizes="[5, 10, 20, 50]"
              :total="equipmentPagination.total"
              layout="total, sizes, prev, pager, next"
              @current-change="handleEquipmentPageChange"
              @size-change="handleEquipmentPageSizeChange"
            />
          </div>

        </div>

      </el-tab-pane>

    </el-tabs>



    <FormDialog
      v-model="equipmentDialogVisible"
      :title="equipmentForm.id ? '编辑璁惧' : '新增璁惧'"
      width="500px"
      :confirm-text="'保存'"
      :cancel-text="'取消'"
      :confirm-loading="savingEquipment"
      @confirm="saveEquipment"
    >

      <el-form :model="equipmentForm" :rules="equipmentRules" ref="equipmentFormRef" label-width="100px">

        <el-form-item label="设备编号" prop="equipmentCode">

          <el-input v-model="equipmentForm.equipmentCode" placeholder="请输入设备编号" />

        </el-form-item>

        <el-form-item label="设备名称" prop="equipmentName">

          <el-input v-model="equipmentForm.equipmentName" placeholder="请输入设备名称" />

        </el-form-item>

      <el-form-item label="安装地点" prop="installationLocation">

        <el-input v-model="equipmentForm.installationLocation" placeholder="请输入安装地点" />

      </el-form-item>

      </el-form>
    </FormDialog>

  </div>

</template>

<script setup>

import { ref, computed, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Download, Upload } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

import FilterBar from '@/components/common/FilterBar.vue';
import { useUserStore } from '@/store/modules/user';
import { useUpload } from '@/composables/useUpload';
import { addTemplateInstructionSheet, applyTemplateHeaderStyle } from '@/utils/excelTemplate';
import request from '@/api/request';
import FormDialog from '@/components/system/FormDialog.vue';
import { buildExportFileName, exportRowsToXlsx } from '@/utils/tableExport';

import {

  getEquipment,

  getEquipmentByCode,

  createEquipment,

  batchCreateEquipment,

  updateEquipment,

  deleteEquipment

} from '@/api/equipment';



const userStore = useUserStore();

const { uploadUrl, uploadHeaders, resolveUploadUrl } = useUpload();

const formRef = ref(null);

const submitting = ref(false);
const equipmentExporting = ref(false);

const recentReports = ref([]);
const recentPagination = ref({ page: 1, pageSize: 5, total: 0 });

const photoList = ref([]);



// Tab 控制

const activeTab = ref('report');

const equipmentManageRoles = ['station_manager', 'department_manager', 'deputy_manager'];

const canManageEquipment = computed(() => userStore.hasRole(equipmentManageRoles));



// 故障上报琛ㄥ崟

const form = ref({

  equipmentCode: '',

  equipmentName: '',

  installationLocation: '',

  faultType: '',

  urgencyLevel: 'medium',

  description: '',

  discoveryTime: dayjs().format('YYYY-MM-DD HH:mm')

});



const rules = {

  equipmentCode: [{ required: true, message: '请输入设备编号', trigger: 'blur' }],

  equipmentName: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],

  faultType: [{ required: true, message: '请选择故障类型', trigger: 'change' }],

  urgencyLevel: [{ required: true, message: '请选择紧急程度', trigger: 'change' }],

  description: [{ required: true, message: '请输入故障描述', trigger: 'blur' }]

};



// 设备管理相关状态

const loadingEquipment = ref(false);

const equipmentList = ref([]);
const equipmentPagination = ref({ page: 1, pageSize: 5, total: 0 });

const equipmentDialogVisible = ref(false);

const equipmentFormRef = ref(null);

const savingEquipment = ref(false);



const equipmentForm = ref({

  id: null,

  equipmentCode: '',

  equipmentName: '',

  installationLocation: ''

});



const equipmentRules = {

  equipmentCode: [{ required: true, message: '请输入设备编号', trigger: 'blur' }],

  equipmentName: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],

  installationLocation: [{ required: true, message: '请输入安装地点', trigger: 'blur' }]

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

  const labels = { low: '低', medium: '中', high: '高', critical: '紧急' };

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

const formatDateTime = (date) => dayjs(date).format('YYYY-MM-DD HH:mm');

const formatDate = (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-';

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



const normalizeFaultReport = (item) => ({

  reportCode: item.reportCode || item.report_code,

  equipmentCode: item.equipmentCode || item.equipment_code,

  equipmentName: item.equipmentName || item.equipment_name,

  installationLocation: item.installationLocation || item.installation_location || item.location,

  urgencyLevel: item.urgencyLevel || item.urgency_level,

  faultDescription: item.faultDescription || item.fault_description || item.description,

  faultDate: item.faultDate || item.fault_date,

  faultTime: item.faultTime || item.fault_time,

  reporterName: item.reporterName || item.reporter_name || item.reporter?.realName,

  status: item.status,

  displayStatus: resolveDisplayStatus(item),

  createdAt: item.createdAt || item.created_at

});



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



const submitReport = async () => {

  await formRef.value.validate();

  submitting.value = true;

  try {

    await request.post('/fault-reports', {

      ...form.value,

      stationId: userStore.currentStationId,

      photos: photoList.value.map(p => p.url).join(',')

    });

    ElMessage.success('涓婃姤鎴愬姛');

    resetForm();

    loadRecentReports();

  } catch (e) {

    

  } finally {

    submitting.value = false;

  }

};



const resetForm = () => {

  formRef.value?.resetFields();

  photoList.value = [];

  form.value.discoveryTime = dayjs().format('YYYY-MM-DD HH:mm');

};



const loadRecentReports = async () => {

  try {

    const res = await request.get('/fault-reports', {

      params: {

        reporterId: userStore.userId,

        pageSize: 10

      }

    });

    const list = Array.isArray(res?.list) ? res.list : [];
    recentReports.value = list.map(normalizeFaultReport);
    recentPagination.value.page = 1;
    recentPagination.value.total = recentReports.value.length;

  } catch (e) {

    

  }

};

const recentReportRows = computed(() => {
  const list = Array.isArray(recentReports.value) ? recentReports.value : [];
  const startIndex = (recentPagination.value.page - 1) * recentPagination.value.pageSize;
  const endIndex = startIndex + recentPagination.value.pageSize;
  return list.slice(startIndex, endIndex);
});

const handleRecentPageChange = (page) => {
  recentPagination.value.page = page;
};

const handleRecentPageSizeChange = (size) => {
  recentPagination.value.pageSize = size;
  recentPagination.value.page = 1;
};

const equipmentTableRows = computed(() => {
  const list = Array.isArray(equipmentList.value) ? equipmentList.value : [];
  const startIndex = (equipmentPagination.value.page - 1) * equipmentPagination.value.pageSize;
  const endIndex = startIndex + equipmentPagination.value.pageSize;
  return list.slice(startIndex, endIndex);
});

const handleEquipmentPageChange = (page) => {
  equipmentPagination.value.page = page;
};

const handleEquipmentPageSizeChange = (size) => {
  equipmentPagination.value.pageSize = size;
  equipmentPagination.value.page = 1;
};



// 设备编码失焦时自动填充设备信息

const handleEquipmentCodeBlur = async () => {

  const code = form.value.equipmentCode?.trim();

  if (!code) {

    form.value.equipmentName = '';

    form.value.installationLocation = '';

    return;

  }



  try {

    const equipment = await getEquipmentByCode({

      stationId: userStore.currentStationId,

      equipmentCode: code

    });



    if (equipment) {

      form.value.equipmentName = equipment.equipment_name;

      form.value.installationLocation = equipment.installation_location || '';

    } else {

      ElMessage.warning('未找到该设备编号，请先在设备管理中添加设备');

      form.value.equipmentName = '';

      form.value.installationLocation = '';

    }

  } catch (e) {

    // 静默处理错误

  }

};

const loadEquipmentList = async () => {

  loadingEquipment.value = true;

  try {

    const res = await getEquipment({

      stationId: userStore.currentStationId

    });

    equipmentList.value = Array.isArray(res) ? res : [];
    equipmentPagination.value.page = 1;
    equipmentPagination.value.total = equipmentList.value.length;

  } catch (e) {

    ElMessage.error('加载设备列表失败');

  } finally {

    loadingEquipment.value = false;

  }

};

const resolveEquipmentExportColumns = () => ([
  { label: '场站', value: (row) => row?.station?.station_name ?? '-' },
  { label: '设备编号', prop: 'equipment_code' },
  { label: '设备名称', prop: 'equipment_name' },
  { label: '安装地点', value: (row) => row?.installation_location ?? '-' }
]);

const handleExportEquipment = async () => {
  if (equipmentExporting.value) return;
  equipmentExporting.value = true;
  try {
    const title = '设备管理';
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
      columns: resolveEquipmentExportColumns(),
      rows
    });
    ElMessage.success('导出成功');
  } catch (error) {
    const msg = typeof error?.message === 'string' && error.message.trim() ? error.message.trim() : '导出失败';
    ElMessage.error(msg);
  } finally {
    equipmentExporting.value = false;
  }
};



// 新增设备

const showAddEquipmentDialog = () => {

  equipmentForm.value = {

    id: null,

    equipmentCode: '',

    equipmentName: '',

    installationLocation: ''

  };

  equipmentDialogVisible.value = true;

};



// 编辑设备

const editEquipment = (row) => {

  equipmentForm.value = {

    id: row.id,

    equipmentCode: row.equipment_code,

    equipmentName: row.equipment_name,

    installationLocation: row.installation_location || ''

  };

  equipmentDialogVisible.value = true;

};



// 保存设备

const saveEquipment = async () => {

  await equipmentFormRef.value.validate();

  savingEquipment.value = true;



  try {

    if (equipmentForm.value.id) {

      // 编辑

      await updateEquipment(equipmentForm.value.id, {

        equipmentCode: equipmentForm.value.equipmentCode,

        equipmentName: equipmentForm.value.equipmentName,

        installationLocation: equipmentForm.value.installationLocation

      });

      ElMessage.success('保存成功');

    } else {

      // 新增

      await createEquipment({

        stationId: userStore.currentStationId,

        equipmentCode: equipmentForm.value.equipmentCode,

        equipmentName: equipmentForm.value.equipmentName,

        installationLocation: equipmentForm.value.installationLocation

      });

      ElMessage.success('新增成功');

    }

    equipmentDialogVisible.value = false;

    loadEquipmentList();

  } catch (e) {

    ElMessage.error(e.message || '保存失败');

  } finally {

    savingEquipment.value = false;

  }

};



// 删除设备

const deleteEquipmentItem = async (id) => {

  try {

    await ElMessageBox.confirm('确认删除该设备吗？删除后无法恢复。', '提示', {
      type: 'warning'

    });



    await deleteEquipment(id);

    ElMessage.success('删除成功');

    loadEquipmentList();

  } catch (e) {

    if (e !== 'cancel') {

      ElMessage.error(e.message || '删除失败');

    }

  }

};



// 下载导入模板

const downloadEquipmentTemplate = () => {
  const templateData = [
    { 'åºç«': 'ç«ç¹A', 'è®¾å¤ç¼å·': 'EQ001', 'è®¾å¤åç§°': 'è®¾å¤A', 'å®è£å°ç¹': 'ä½ç½®A' },
    { 'åºç«': 'ç«ç¹B', 'è®¾å¤ç¼å·': 'EQ002', 'è®¾å¤åç§°': 'è®¾å¤B', 'å®è£å°ç¹': 'ä½ç½®B' },
    { 'åºç«': 'ç«ç¹C', 'è®¾å¤ç¼å·': 'EQ003', 'è®¾å¤åç§°': 'è®¾å¤C', 'å®è£å°ç¹': 'ä½ç½®C' }
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  applyTemplateHeaderStyle(XLSX, ws, 1);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '设备导入模板');
  addTemplateInstructionSheet(XLSX, wb, [
    ['场站', '必填，系统已有场站名称。'],
    ['设备编号', '必填，设备唯一编号。'],
    ['设备名称', '必填，设备名称。'],
    ['安装地点', '选填，设备安装位置说明。']
  ]);
  XLSX.writeFile(wb, '设备导入模板.xlsx');
};



// 处理设备导入文件

const handleEquipmentFileChange = async (file) => {

  const rawFile = file.raw;

  if (!rawFile) return;



  try {

    const data = await readExcelFile(rawFile);

    await importEquipmentData(data);

  } catch (e) {

    ElMessage.error(e.message || '导入失败');

  }

};



// 读取 Excel 文件

const readExcelFile = (file) => {

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onload = (e) => {

      try {

        const data = new Uint8Array(e.target.result);

        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        resolve(jsonData);

      } catch (error) {

        reject(new Error('Excel 解析失败'));

      }

    };

    reader.onerror = () => reject(new Error('Excel 读取失败'));

    reader.readAsArrayBuffer(file);

  });

};



// 导入设备数据

const importEquipmentData = async (data) => {

  if (!data || data.length === 0) {

    ElMessage.warning('Excel 内容为空');

    return;

  }



  const requiredFields = ['场站', '设备编号', '设备名称', '安装地点'];

  const firstRow = data[0];

  const hasAllFields = requiredFields.every(field => field in firstRow);



  if (!hasAllFields) {

    ElMessage.error('Excel 字段不匹配，请使用模板');

    return;

  }



  const loading = ElMessage({

    message: '正在导入设备...',

    duration: 0,

    type: 'info'

  });



  try {

    const equipmentList = data

      .filter(row => row['设备编号'] && row['设备名称'])

      .map(row => ({

        stationId: userStore.currentStationId,

        equipmentCode: row['设备编号'].toString().trim(),

        equipmentName: row['设备名称'].trim(),

        installationLocation: row['安装地点']?.trim() || ''

      }));



    if (equipmentList.length === 0) {

      loading.close();

      ElMessage.warning('未找到有效设备数据');

      return;

    }



    await batchCreateEquipment({ equipmentList });



    loading.close();

    ElMessage.success(`成功导入 ${equipmentList.length} 条设备`);

    loadEquipmentList();

  } catch (e) {

    loading.close();

    ElMessage.error(e.message || '导入失败');

  }

};



onMounted(() => {

  loadRecentReports();

  loadEquipmentList();

});

watch(
  () => recentReports.value.length,
  (total) => {
    recentPagination.value.total = total;
    const size = recentPagination.value.pageSize;
    const maxPage = Math.max(1, Math.ceil(total / size));
    if (recentPagination.value.page > maxPage) recentPagination.value.page = maxPage;
  }
);

watch(
  () => equipmentList.value.length,
  (total) => {
    equipmentPagination.value.total = total;
    const size = equipmentPagination.value.pageSize;
    const maxPage = Math.max(1, Math.ceil(total / size));
    if (equipmentPagination.value.page > maxPage) equipmentPagination.value.page = maxPage;
  }
);

</script>



<style lang="scss" scoped>

.fault-report-page {

  .page-header {

    display: flex;

    justify-content: space-between;

    align-items: center;

    margin-bottom: 20px;



    h2 {

      margin: 0;

      font-size: 20px;

      color: #303133;

    }



    .header-actions {

      display: flex;

      gap: 8px;

    }

  }

  .report-form-card {

    background: #fff;

    border-radius: 8px;

    padding: 24px;

    margin-bottom: 24px;

  }



  .recent-reports {

    background: #fff;

    border-radius: 8px;

    padding: 20px;



    h3 {

      margin: 0 0 16px;

      font-size: 16px;

      color: #303133;

    }

  }



  .equipment-panel {

    background: #fff;

    border-radius: 8px;

    padding: 16px;



    .panel-header {

      display: flex;

      justify-content: space-between;

      align-items: center;

      margin-bottom: 16px;



      h4 {

        margin: 0;

        font-size: 14px;

        font-weight: 500;

      }



      .header-actions {

        display: flex;

        gap: 8px;

      }

    }

  }

  @media (max-width: 1024px) {
    .report-form-card {
      padding: 16px;
    }

    .report-form-card :deep(.el-form-item) {
      flex-direction: column;
      align-items: stretch;
    }

    .report-form-card :deep(.el-form-item__label) {
      width: 100% !important;
      text-align: left;
      padding: 0 0 6px;
    }

    .report-form-card :deep(.el-form-item__content) {
      width: 100%;
      margin-left: 0 !important;
    }

    .report-form-card :deep(.el-input),
    .report-form-card :deep(.el-select),
    .report-form-card :deep(.el-textarea),
    .report-form-card :deep(.el-date-editor),
    .report-form-card :deep(.el-input-number),
    .report-form-card :deep(.el-radio-group) {
      width: 100% !important;
    }

    .report-form-card :deep(.el-radio-group) {
      flex-wrap: wrap;
      row-gap: 6px;
    }

    .recent-reports {
      display: none;
    }
  }
}
</style>












