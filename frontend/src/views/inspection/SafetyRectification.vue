<template>
  <div class="safety-rectification-page">
    <div class="page-header">
      <h2>安全隐患</h2>
      <el-button v-if="canCreate" type="primary" @click="showCreateDialog">
        <el-icon><Plus /></el-icon> 新增隐患
      </el-button>
    </div>

    <!-- 筛选条件 -->
    <FilterBar>
      <el-input
        v-model="filters.stationName"
        placeholder="场站名称"
        clearable
        style="width: 180px"
        @change="loadList"
      />
      <el-select v-model="filters.hazardCategory" placeholder="隐患类别" clearable style="width: 150px" @change="loadList">
        <el-option v-for="cat in categoryList" :key="cat.id" :label="formatCategoryName(cat.category_name)" :value="cat.category_name" />
      </el-select>
      <el-select v-model="filters.status" placeholder="状态" clearable style="width: 120px" @change="loadList">
        <el-option label="全部" value="" />
        <el-option label="待整改" value="pending" />
        <el-option label="已整改" value="rectified" />
        <el-option label="已复核" value="reviewed" />
      </el-select>
      <el-date-picker
        v-model="filters.dateRange"
        type="daterange"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        style="width: 240px"
        @change="loadList"
      />
    </FilterBar>

    <!-- 列表 -->
    <el-table :data="list" v-loading="loading" style="width: 100%">
      <el-table-column prop="record_code" label="表单编号" width="140" />
      <el-table-column prop="station_name" label="场站" width="150" />
      <el-table-column prop="hazard_category" label="隐患类别" width="120" />
      <el-table-column label="发起日期" width="110">
        <template #default="{ row }">{{ formatDate(row.inspection_date) }}</template>
      </el-table-column>
      <el-table-column label="发起时间" width="90">
        <template #default="{ row }">{{ formatTime(row.submit_time) }}</template>
      </el-table-column>
      <el-table-column prop="inspector_name" label="发起人" width="90" />
      <el-table-column prop="hazard_description" label="隐患描述" min-width="180" show-overflow-tooltip />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <el-button link type="primary" @click="viewDetail(row)">查看</el-button>
          <el-button v-if="canEdit(row)" link type="warning" @click="showEditDialog(row)">编辑</el-button>
          <el-button v-if="canReview(row)" link type="primary" @click="reviewRectification(row)">复核</el-button>
          <el-button v-if="canDelete(row)" link type="danger" @click="deleteRecord(row)">删除</el-button>
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
        @size-change="loadList"
        @current-change="loadList"
      />
    </div>

    <!-- 新增/编辑隐患对话框 -->
    <FormDialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑隐患' : '新增隐患'"
      width="650px"
      :confirm-text="'提交'"
      :cancel-text="'取消'"
      :confirm-loading="submitting"
      @confirm="submitForm"
    >
      <el-form :model="form" label-width="100px" :rules="formRules" ref="formRef">
        <!-- 自动生成字段显示 -->
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="表单编号">
              <el-input v-model="form.recordCode" disabled placeholder="提交后自动生成" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发起人">
              <el-input :value="userStore.realName" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="发起日期">
              <el-input :value="form.inspectionDate" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发起时间">
              <el-input :value="formatTime(form.submitTime)" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="场站" prop="stationId">
          <el-select v-model="form.stationId" placeholder="选择场站" filterable style="width: 100%" @change="onStationChange">
            <el-option v-for="s in stationList" :key="s.id" :label="s.stationName" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="位置" prop="location">
          <el-input v-model="form.location" placeholder="隐患具体位置（可手动修改）" />
        </el-form-item>
        <el-form-item label="隐患类别" prop="hazardCategory">
          <el-select
            v-model="form.hazardCategory"
            placeholder="选择类别"
            filterable
            allow-create
            style="width: 100%"
            @change="onCategoryChange"
          >
            <el-option v-for="cat in categoryList" :key="cat.id" :label="formatCategoryName(cat.category_name)" :value="cat.category_name" />
          </el-select>
          <div class="category-actions" v-if="canManageCategory">
            <el-button size="small" type="primary" @click="promptAddCategory">新增类别</el-button>
            <el-button size="small" @click="openCategoryLibrary">类别库</el-button>
          </div>
          <div class="tip-text">可输入新类别并选择，将自动保存到类别库</div>
        </el-form-item>
        <el-form-item label="隐患描述" prop="hazardDescription">
          <el-input v-model="form.hazardDescription" type="textarea" :rows="3" placeholder="详细描述隐患情况" />
        </el-form-item>
        <el-form-item label="隐患处照片">
          <BaseUpload
            :action="uploadUrl"
            :headers="uploadHeaders"
            list-type="picture-card"
            :file-list="form.photoList"
            accept="image/*"
            @change="(file, fileList) => updateFormPhotoList(fileList)"
            @success="(response, file, fileList) => updateFormPhotoList(fileList)"
            @remove="(file, fileList) => updateFormPhotoList(fileList)"
            @error="handleUploadError"
          >
            <el-icon><Plus /></el-icon>
          </BaseUpload>
        </el-form-item>
      </el-form>
    </FormDialog>

    <!-- 类别库对话框 -->
    <FormDialog
      v-model="categoryDialogVisible"
      title="类别库"
      width="520px"
      :show-confirm="false"
      :show-cancel="false"
    >
      <el-input
        v-model="categoryKeyword"
        placeholder="搜索类别"
        clearable
        style="margin-bottom: 12px"
      />
      <el-table :data="filteredCategories" height="360px">
        <el-table-column prop="category_name" label="类别" min-width="200" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">{{ row.is_system ? '系统预置' : '自定义' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button
              size="small"
              type="danger"
              :disabled="row.is_system"
              @click="deleteCategoryRow(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="categoryDialogVisible = false">关闭</el-button>
      </template>
    </FormDialog>

    <!-- 根本原因库对话框 -->
    <FormDialog
      v-model="rootCauseDialogVisible"
      title="原因库"
      width="520px"
      :show-confirm="false"
      :show-cancel="false"
    >
      <el-input
        v-model="rootCauseKeyword"
        placeholder="搜索原因"
        clearable
        style="margin-bottom: 12px"
      />
      <el-table :data="filteredRootCauses" height="360px">
        <el-table-column prop="cause_name" label="原因" min-width="200" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">{{ row.is_system ? '系统预置' : '自定义' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="editRootCauseRow(row)">编辑</el-button>
            <el-button
              size="small"
              type="danger"
              :disabled="row.is_system"
              @click="deleteRootCauseRow(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="rootCauseDialogVisible = false">关闭</el-button>
      </template>
    </FormDialog>

    <!-- 隐患详情/整改表单 -->
    <FormDialog
      v-model="rectDialogVisible"
      title="隐患表单"
      width="900px"
      :show-confirm="false"
      :show-cancel="false"
    >
      <el-form :model="rectForm" label-width="140px" :rules="rectFormRules" ref="rectFormRef" class="rect-form">
        <el-divider content-position="left">发起信息</el-divider>
        <div class="section-grid" v-if="currentRecord">
          <el-form-item label="表单编号">
            <el-input :model-value="currentRecord.record_code" disabled />
          </el-form-item>
          <el-form-item label="场站">
            <el-input :model-value="currentRecord.station_name || '-'" disabled />
          </el-form-item>
          <el-form-item label="发起日期">
            <el-input :model-value="formatDate(currentRecord.inspection_date)" disabled />
          </el-form-item>
          <el-form-item label="发起时间">
            <el-input :model-value="formatTime(currentRecord.submit_time)" disabled />
          </el-form-item>
          <el-form-item label="发起人">
            <el-input :model-value="currentRecord.inspector?.real_name || currentRecord.inspector_name || '-'" disabled />
          </el-form-item>
          <el-form-item label="隐患类别">
            <el-input :model-value="currentRecord.hazard_category || '-'" disabled />
          </el-form-item>
          <el-form-item label="位置" class="full-width">
            <el-input :model-value="currentRecord.location || '-'" disabled />
          </el-form-item>
          <el-form-item label="隐患描述" class="full-width">
            <el-input :model-value="currentRecord.hazard_description || '-'" type="textarea" :rows="2" disabled />
          </el-form-item>
          <el-form-item label="隐患处照片" class="full-width">
            <div v-if="currentRecord.photoUrls?.length" class="photo-preview">
              <el-image
                v-for="(url, idx) in currentRecord.photoUrls"
                :key="idx"
                :src="url"
                :preview-src-list="currentRecord.photoUrls"
                fit="cover"
                style="width: 80px; height: 80px; margin-right: 8px"
              />
            </div>
            <span v-else>-</span>
          </el-form-item>
        </div>

        <el-divider content-position="left">整改信息</el-divider>
        <el-form-item label="根本原因" prop="rootCause">
          <el-select
            v-model="rectForm.rootCause"
            placeholder="选择根本原因"
            filterable
            style="width: 100%"
            :disabled="!canEditRect"
          >
            <el-option v-for="cause in rootCauseList" :key="cause.id" :label="formatRootCauseName(cause.cause_name)" :value="cause.cause_name" />
          </el-select>
          <div class="category-actions" v-if="canManageRootCause && canEditRect">
            <el-button size="small" type="primary" @click="promptAddRootCause">新增原因</el-button>
            <el-button size="small" @click="openRootCauseLibrary">原因库</el-button>
          </div>
        </el-form-item>
        <el-form-item label="具体整改措施" prop="rectificationMeasures">
          <el-input v-model="rectForm.rectificationMeasures" type="textarea" :rows="3" placeholder="详细描述整改措施" :disabled="!canEditRect" />
        </el-form-item>
        <el-form-item label="被处罚人">
          <el-select v-model="rectForm.punishedPersonId" placeholder="选择被处罚人" filterable clearable style="width: 100%" @change="onPunishedChange" :disabled="!canEditRect">
            <el-option v-for="u in userList" :key="u.id" :label="u.realName || u.real_name" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="处罚结果">
          <el-input v-model="rectForm.punishmentResult" placeholder="如：警告、罚款等" :disabled="!canEditRect" />
        </el-form-item>
        <el-form-item label="一次是否已完成整改" prop="isCompleted">
          <el-radio-group v-model="rectForm.isCompleted" :disabled="!canEditRect">
            <el-radio label="是">是</el-radio>
            <el-radio label="否">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="隐患整改完成照片">
          <BaseUpload
            :action="uploadUrl"
            :headers="uploadHeaders"
            list-type="picture-card"
            :file-list="rectForm.photoList"
            accept="image/*"
            :disabled="!canEditRect"
            @change="(file, fileList) => updateRectPhotoList(fileList)"
            @success="(response, file, fileList) => updateRectPhotoList(fileList)"
            @remove="(file, fileList) => updateRectPhotoList(fileList)"
            @error="handleUploadError"
          >
            <el-icon><Plus /></el-icon>
          </BaseUpload>
        </el-form-item>
        <el-form-item label="根因类别" prop="rootCauseCategory">
          <el-select v-model="rectForm.rootCauseCategory" placeholder="选择根因类别" style="width: 100%" :disabled="!canEditRect">
            <el-option label="组织措施" value="组织措施" />
            <el-option label="管理措施" value="管理措施" />
            <el-option label="技术措施" value="技术措施" />
            <el-option label="经济措施" value="经济措施" />
          </el-select>
        </el-form-item>
        <el-form-item label="办理人">
          <el-input :value="userStore.realName" disabled />
        </el-form-item>
              <el-divider content-position="left">复核信息</el-divider>
        <el-form-item v-if="showReviewSection" label="是否确认复核" prop="reviewConfirmed">
          <el-radio-group v-model="rectForm.reviewConfirmed" :disabled="!canReviewRect">
            <el-radio label="是">是</el-radio>
            <el-radio label="否">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item
          v-if="showReviewSection && (rectForm.reviewConfirmed === '是' || !canReviewRect)"
          label="整改完成评分"
          prop="completionScore"
        >
          <el-rate v-model="rectForm.completionScore" :disabled="!canReviewRect" />
        </el-form-item>
</el-form>
      <template #footer>
        <el-button @click="rectDialogVisible = false">关闭</el-button>
        <el-button v-if="canEditRect" type="primary" @click="submitRectification" :loading="submitting">提交</el-button>
        <el-button v-if="canReviewRect" type="primary" @click="submitReview" :loading="submitting">提交复核</el-button>
      </template>
    </FormDialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { useUserStore } from '@/store/modules/user';
import { useUpload } from '@/composables/useUpload';
import request from '@/api/request';
import { getHazardCategories, createHazardCategory, deleteHazardCategory, getHazardRootCauses, createHazardRootCause, updateHazardRootCause, deleteHazardRootCause } from '@/api/hazardConfig';
import dayjs from 'dayjs';
import FormDialog from '@/components/system/FormDialog.vue';

const userStore = useUserStore();

const { uploadUrl, uploadHeaders } = useUpload();

// 权限判断
const canCreate = computed(() => userStore.roleCode === 'safety_inspector');
const canManageCategory = computed(() => userStore.roleCode === 'safety_inspector');
const canManageRootCause = computed(() => ['safety_inspector', 'station_manager', 'department_manager', 'deputy_manager'].includes(userStore.roleCode));
const canEdit = (row) => userStore.roleCode === 'safety_inspector' && row.status === 'pending';
const canDelete = (row) => userStore.roleCode === 'safety_inspector' && row.status === 'pending' && !row.rectification;
const canFillRectification = (row) => {
  // 站长可以填写整改（状态为待整改时）
  return userStore.roleCode === 'station_manager' && row.status === 'pending';
};
const canReview = (row) => {
  // 安全员可以复核（状态为已整改时）
  return userStore.roleCode === 'safety_inspector' && row.status === 'rectified' && row.rectification;
};
const currentRecord = ref(null);
const canEditRect = computed(() => (currentRecord.value ? canFillRectification(currentRecord.value) : false));
const canReviewRect = computed(() => (currentRecord.value ? canReview(currentRecord.value) : false));
const showReviewSection = computed(() => {
  if (!currentRecord.value || !currentRecord.value.rectification) return false;
  return ['rectified', 'reviewed'].includes(currentRecord.value.status);
});

// 列表数据

const list = ref([]);
const loading = ref(false);
const pagination = ref({ page: 1, pageSize: 10, total: 0 });
const filters = ref({ stationName: '', hazardCategory: '', status: '', dateRange: null });

// 配置数据
const stationList = ref([]);
const userList = ref([]);
const categoryList = ref([]);
const categoryDialogVisible = ref(false);
const categoryKeyword = ref('');
const rootCauseDialogVisible = ref(false);
const rootCauseKeyword = ref('');
const filteredCategories = computed(() => {
  const keyword = categoryKeyword.value.trim();
  if (!keyword) return categoryList.value;
  return categoryList.value.filter(item => item.category_name?.includes(keyword));
});

const filteredRootCauses = computed(() => {
  const keyword = rootCauseKeyword.value.trim();
  if (!keyword) return rootCauseList.value;
  return rootCauseList.value.filter(item => item.cause_name?.includes(keyword));
});
const rootCauseList = ref([]);

// 对话框
const dialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref(null);
const submitting = ref(false);
const form = ref({
  id: null,
  recordCode: '',
  inspectionDate: dayjs().format('YYYY-MM-DD'),
  submitTime: dayjs().format('HH:mm'),
  stationId: null,
  stationName: '',
  hazardCategory: '',
  location: '',
  hazardDescription: '',
  photoList: []
});

const formRules = {
  stationId: [{ required: true, message: '请选择场站', trigger: 'change' }],
  hazardCategory: [{ required: true, message: '请选择隐患类别', trigger: 'change' }]
};

// 整改对话框
const rectDialogVisible = ref(false);
const rectFormRef = ref(null);
const currentInspectionId = ref(null);
const currentRectificationId = ref(null);
const rectForm = ref({
  rootCause: '',
  rootCauseCategory: '',
  rectificationMeasures: '',
  punishedPersonId: null,
  punishedPersonName: '',
  punishmentResult: '',
  isCompleted: '',
  photoList: []
});

const rectFormRules = {
  rootCause: [{ required: true, message: '???????', trigger: 'change' }],
  rectificationMeasures: [{ required: true, message: '???????', trigger: 'blur' }],
  isCompleted: [{ required: true, message: '??????????', trigger: 'change' }],
  reviewConfirmed: [{
    validator: (_rule, value, callback) => {
      if (!canReviewRect.value) return callback();
      if (value !== '?') return callback(new Error('?????????'));
      return callback();
    },
    trigger: 'change'
  }],
  completionScore: [{
    validator: (_rule, value, callback) => {
      if (!canReviewRect.value) return callback();
      if (rectForm.value.reviewConfirmed !== '?') return callback();
      if (!value || value <= 0) return callback(new Error('?????????'));
      return callback();
    },
    trigger: 'change'
  }]
};

// 详情对话框

// 上传配置
const decodeMojibake = (text) => {
  if (!text) return text;
  try {
    const bytes = new Uint8Array(Array.from(text, char => char.charCodeAt(0)));
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    return text;
  }
};

const formatCategoryName = (name) => {
  return decodeMojibake(name);
};

const formatRootCauseName = (name) => {
  return decodeMojibake(name);
};

const loadList = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize
    };
    if (filters.value.stationName) params.stationName = filters.value.stationName;
    if (filters.value.hazardCategory) params.hazardCategory = filters.value.hazardCategory;
    if (filters.value.status) params.status = filters.value.status;
    if (filters.value.dateRange?.length === 2) {
      params.startDate = filters.value.dateRange[0];
      params.endDate = filters.value.dateRange[1];
    }

    const res = await request.get('/hazard-inspections', { params });
    list.value = (res.list || []).map(item => ({
      ...item,
      photoUrls: item.photo_urls ? JSON.parse(item.photo_urls) : [],
      rectification: item.rectification ? {
        ...item.rectification,
        completionPhotos: item.rectification.completion_photos ? JSON.parse(item.rectification.completion_photos) : []
      } : null
    }));
    pagination.value.total = res.total || 0;
  } catch (e) {
    ElMessage.error('加载列表失败');
  } finally {
    loading.value = false;
  }
};

const loadStations = async () => {
  try {
    const res = await request.get('/stations/all');
    stationList.value = (res || []).map(s => ({
      id: s.id,
      stationName: s.station_name || s.stationName
    }));
  } catch (e) {
    
  }
};

const loadUsers = async () => {
  try {
    const roleCodes = ['station_manager', 'operator', 'maintenance'];
    const res = await request.get('/users', { params: { pageSize: 500, roleCode: roleCodes.join(',') } });
    const list = res.list || [];
    userList.value = list.filter(user => {
      const code = user.roleCode || user.baseRoleCode || user.role?.role_code || user.role?.roleCode;
      return code ? roleCodes.includes(code) : false;
    });
  } catch (e) {
    
  }
};

const loadCategories = async () => {
  try {
    let res = await getHazardCategories({ status: 1 });
    let list = res?.data || res || [];
    if (!Array.isArray(list) || list.length === 0) {
      res = await getHazardCategories({});
      list = res?.data || res || [];
    }
    categoryList.value = list;
  } catch (e) {
    ElMessage.error('加载隐患类别失败');
  }
};

const loadRootCauses = async () => {
  try {
    let res = await getHazardRootCauses({ status: 1 });
    let list = res.data || res || [];
    if (!Array.isArray(list) || list.length === 0) {
      res = await getHazardRootCauses({});
      list = res.data || res || [];
    }
    rootCauseList.value = (Array.isArray(list) ? list : []).map(item => ({
      ...item,
      cause_name: formatRootCauseName(item.cause_name)
    }));
  } catch (e) {
    
  }
};

const onStationChange = (stationId) => {
  const station = stationList.value.find(s => s.id === stationId);
  form.value.stationName = station?.stationName || '';
};

const onCategoryChange = async (value) => {
  // 检查是否是新类别
  const exists = categoryList.value.some(c => c.category_name === value);
  if (!exists && value) {
    try {
      await createHazardCategory({ categoryName: value });
      await loadCategories();
    } catch (e) {
      
    }
  }
};

const promptAddCategory = async () => {
  try {
    const { value } = await ElMessageBox.prompt('请输入新类别', '新增类别', {
      confirmButtonText: '保存',
      cancelButtonText: '取消',
      inputPlaceholder: '例如：电气、消防',
      inputValidator: (val) => (val && val.trim() ? true : '请输入类别名称')
    });
    const name = value.trim();
    const exists = categoryList.value.some(c => c.category_name === name);
    if (exists) {
      ElMessage.warning('该类别已存在');
      return;
    }
    await createHazardCategory({ categoryName: name });
    await loadCategories();
    form.value.hazardCategory = name;
    ElMessage.success('新增类别成功');
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('新增类别失败');
  }
};

const openCategoryLibrary = () => {
  categoryDialogVisible.value = true;
};

const deleteCategoryRow = async (row) => {
  try {
    await ElMessageBox.confirm(`确认删除类别“${row.category_name}”吗？`, '确认删除', { type: 'warning' });
    await deleteHazardCategory(row.id);
    await loadCategories();
    if (form.value.hazardCategory === row.category_name) {
      form.value.hazardCategory = '';
    }
    ElMessage.success('删除类别成功');
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除类别失败');
  }
};

const promptAddRootCause = async () => {
  try {
    const { value } = await ElMessageBox.prompt('请输入新原因', '新增原因', {
      confirmButtonText: '保存',
      cancelButtonText: '取消',
      inputPlaceholder: '例如：人的不安全行为',
      inputValidator: (val) => (val && val.trim() ? true : '请输入原因名称')
    });
    const name = value.trim();
    const exists = rootCauseList.value.some(c => c.cause_name === name);
    if (exists) {
      ElMessage.warning('该原因已存在');
      return;
    }
    await createHazardRootCause({ causeName: name });
    await loadRootCauses();
    rectForm.value.rootCause = name;
    ElMessage.success('新增原因成功');
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('新增原因失败');
  }
};

const openRootCauseLibrary = () => {
  rootCauseDialogVisible.value = true;
};

const editRootCauseRow = async (row) => {
  try {
    const { value } = await ElMessageBox.prompt('编辑原因', '编辑原因', {
      confirmButtonText: '保存',
      cancelButtonText: '取消',
      inputValue: row.cause_name,
      inputValidator: (val) => (val && val.trim() ? true : '请输入原因名称')
    });
    const name = value.trim();
    if (name === row.cause_name) return;
    const exists = rootCauseList.value.some(c => c.cause_name === name);
    if (exists) {
      ElMessage.warning('该原因已存在');
      return;
    }
    await updateHazardRootCause(row.id, { causeName: name });
    await loadRootCauses();
    if (rectForm.value.rootCause === row.cause_name) {
      rectForm.value.rootCause = name;
    }
    ElMessage.success('更新成功');
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('更新失败');
  }
};

const deleteRootCauseRow = async (row) => {
  try {
    await ElMessageBox.confirm(`确认删除原因“${row.cause_name}”吗？`, '确认删除', { type: 'warning' });
    await deleteHazardRootCause(row.id);
    await loadRootCauses();
    if (rectForm.value.rootCause === row.cause_name) {
      rectForm.value.rootCause = '';
    }
    ElMessage.success('删除成功');
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败');
  }
};

const showCreateDialog = () => {
  isEdit.value = false;
  form.value = {
    id: null,
    recordCode: '',
    inspectionDate: dayjs().format('YYYY-MM-DD'),
    submitTime: dayjs().format('HH:mm'),
    stationId: userStore.currentStationId || null,
    stationName: '',
    hazardCategory: '',
    location: '',
    hazardDescription: '',
    photoList: []
  };
  // 自动填充场站名称
  if (form.value.stationId) {
    const station = stationList.value.find(s => s.id === form.value.stationId);
    form.value.stationName = station?.stationName || '';
  }
  dialogVisible.value = true;
};

const showEditDialog = (row) => {
  isEdit.value = true;
  form.value = {
    id: row.id,
    recordCode: row.record_code,
    inspectionDate: row.inspection_date,
    submitTime: row.submit_time || '',
    stationId: row.station_id,
    stationName: row.station_name,
    hazardCategory: row.hazard_category,
    location: row.location || '',
    hazardDescription: row.hazard_description || '',
    photoList: (row.photoUrls || []).map((url, idx) => ({ name: `photo${idx}`, url }))
  };
  dialogVisible.value = true;
};

const normalizeUploadFile = (file) => {
  const responseUrl = file?.response?.data?.url ?? file?.response?.url ?? '';
  const url = responseUrl ? responseUrl : (file?.url ?? '');
  return url ? { ...file, url } : file;
};

const updateFormPhotoList = (fileList) => {
  form.value.photoList = (fileList ?? []).map(normalizeUploadFile);
};

const updateRectPhotoList = (fileList) => {
  rectForm.value.photoList = (fileList ?? []).map(normalizeUploadFile);
};

const handleUploadError = () => {
  ElMessage.error('图片上传失败，请检查图片大小或网络');
};

const submitForm = async () => {
  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  submitting.value = true;
  try {
    const data = {
      stationId: form.value.stationId,
      stationName: form.value.stationName,
      hazardCategory: form.value.hazardCategory,
      location: form.value.location,
      hazardDescription: form.value.hazardDescription,
      photoUrls: form.value.photoList.map(f => f.url)
    };

    if (isEdit.value) {
      await request.put(`/hazard-inspections/${form.value.id}`, data);
      ElMessage.success('更新成功');
    } else {
      await request.post('/hazard-inspections', data);
      ElMessage.success('提交成功，表单状态为"待整改"');
    }
    dialogVisible.value = false;
    loadList();
  } catch (e) {
    ElMessage.error(e.message || '操作失败');
  } finally {
    submitting.value = false;
  }
};

const showRectificationDialog = (row) => {
  currentRecord.value = row;
  currentInspectionId.value = row.id;
  if (row.rectification) {
    currentRectificationId.value = row.rectification.id;
    rectForm.value = {
      rootCause: row.rectification.root_cause || '',
      rootCauseCategory: row.rectification.root_cause_category || '',
      rectificationMeasures: row.rectification.rectification_measures || '',
      punishedPersonId: row.rectification.punished_person_id,
      punishedPersonName: row.rectification.punished_person_name || '',
      punishmentResult: row.rectification.punishment_result || '',
      isCompleted: row.rectification.is_completed || '',
      photoList: (row.rectification.completionPhotos || []).map((url, idx) => ({ name: `photo${idx}`, url }))
    };
  } else {
    currentRectificationId.value = null;
    rectForm.value = {
      rootCause: '',
      rootCauseCategory: '',
      rectificationMeasures: '',
      punishedPersonId: null,
      punishedPersonName: '',
      punishmentResult: '',
      isCompleted: '',
      photoList: []
    };
  }
  rectDialogVisible.value = true;
};

const onPunishedChange = (id) => {
  const user = userList.value.find(u => u.id === id);
  rectForm.value.punishedPersonName = user?.realName || user?.real_name || '';
};

const submitRectification = async () => {
  try {
    await rectFormRef.value.validate();
  } catch {
    return;
  }

  submitting.value = true;
  try {
    const data = {
      inspectionId: currentInspectionId.value,
      rootCause: rectForm.value.rootCause,
      rootCauseCategory: rectForm.value.rootCauseCategory,
      rectificationMeasures: rectForm.value.rectificationMeasures,
      punishedPersonId: rectForm.value.punishedPersonId,
      punishedPersonName: rectForm.value.punishedPersonName,
      punishmentResult: rectForm.value.punishmentResult,
      isCompleted: rectForm.value.isCompleted,
      completionPhotos: rectForm.value.photoList.map(f => f.url)
    };

    if (currentRectificationId.value) {
      await request.put(`/safety-rectifications/${currentRectificationId.value}`, data);
      ElMessage.success('更新成功');
    } else {
      await request.post('/safety-rectifications', data);
      ElMessage.success('提交成功，表单状态变为"已整改"');
    }
    rectDialogVisible.value = false;
    loadList();
  } catch (e) {
    ElMessage.error(e.message || '操作失败');
  } finally {
    submitting.value = false;
  }
};

const submitReview = async () => {
  if (!currentRectificationId.value) return;
  try {
    await rectFormRef.value.validate();
  } catch {
    return;
  }

  submitting.value = true;
  try {
    if (rectForm.value.reviewConfirmed !== '?') {
      ElMessage.warning('?????????');
      return;
    }
    await request.put(`/safety-rectifications/${currentRectificationId.value}/review`, {
      reviewConfirmed: rectForm.value.reviewConfirmed,
      completionScore: rectForm.value.completionScore
    });
    ElMessage.success('???????????"???"');
    rectDialogVisible.value = false;
    loadList();
  } catch (e) {
    ElMessage.error(e.message || '????');
  } finally {
    submitting.value = false;
  }
};

const reviewRectification = (row) => {
  showRectificationDialog(row);
};

const deleteRecord = async (row) => {
  try {
    await ElMessageBox.confirm('确认删除该隐患记录？', '确认删除', { type: 'warning' });
    await request.delete(`/hazard-inspections/${row.id}`);
    ElMessage.success('删除成功');
    loadList();
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e.message || '删除失败');
  }
};

const viewDetail = (row) => {
  showRectificationDialog(row);
};

onMounted(() => {
  loadList();
  loadStations();
  loadUsers();
  loadCategories();
  loadRootCauses();
});
</script>

<style lang="scss" scoped>
.safety-rectification-page {
  padding: 20px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 { margin: 0; }
  }

  .filter-bar {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }

  .tip-text {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }

  .category-actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }

  // 流转图样式
  .status-flow {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px 0;
    margin-bottom: 10px;

    .flow-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      opacity: 0.4;

      &.active {
        opacity: 1;
      }

      &.current .step-icon {
        background: #409eff;
        color: #fff;
        box-shadow: 0 2px 8px rgba(64, 158, 255, 0.4);
      }

      .step-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #e4e7ed;
        color: #909399;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 16px;
        margin-bottom: 8px;
      }

      .step-label {
        font-size: 14px;
        color: #606266;
      }
    }

    .flow-arrow {
      margin: 0 20px;
      color: #c0c4cc;
      font-size: 20px;

      &.active {
        color: #409eff;
      }
    }
  }
}

.rect-form {
  .section-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px 24px;
  }

  .full-width {
    grid-column: 1 / -1;
  }
}
</style>
