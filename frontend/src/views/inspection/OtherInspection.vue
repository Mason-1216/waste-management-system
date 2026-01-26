<template>
  <div class="safety-other-page">
    <div class="page-header">
      <h3>安全他检</h3>
      <el-button type="primary" @click="showNewInspection">
        <el-icon><Plus /></el-icon>新建检查
      </el-button>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :inline="true">
        <el-form-item>
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item v-if="showStationFilter">
          <el-select
            v-model="filters.stationId"
            placeholder="请选择场站"
            clearable
            style="width: 180px"
          >
            <el-option
              v-for="station in stationList"
              :key="station.id"
              :label="station.stationName"
              :value="station.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="filters.inspectedName"
            placeholder="请输入姓名"
            clearable
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item>
          <el-select
            v-model="filters.workTypeIds"
            placeholder="请选择工作性质"
            clearable
            multiple
            collapse-tags
            collapse-tags-tooltip
            filterable
            style="width: 240px"
          >
            <el-option
              v-for="wt in workTypes"
              :key="wt.id"
              :label="wt.work_type_name"
              :value="wt.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 检查记录列表 -->
    <TableCard>
      <el-table :data="inspectionList" stripe border v-loading="loading">
        <el-table-column prop="inspection_date" label="检查日期" width="120" />
        <el-table-column label="场站" width="150">
          <template #default="{ row }">
            {{ row.station?.station_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="被检查人" width="100">
          <template #default="{ row }">
            {{ row.inspected_user_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="工作性质" min-width="150">
          <template #default="{ row }">
            {{ getWorkTypeNames(row.work_type_ids) }}
          </template>
        </el-table-column>
        <el-table-column label="检查人" width="100">
          <template #default="{ row }">
            {{ row.inspector?.real_name || row.inspector_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="检查结果" width="100">
          <template #default="{ row }">
            <el-tag :type="getInspectionResult(row).type">
              {{ getInspectionResult(row).text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewDetail(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          layout="total, prev, pager, next"
          @current-change="loadInspectionList"
        />
      </div>
    </TableCard>

    <!-- 新建检查对话框 -->
    <FormDialog
      v-model="dialogVisible"
      title="安全他检"
      width="750px"
      :close-on-click-modal="false"
      :show-confirm="false"
      :show-cancel="false"
    >
      <el-form :model="inspectionForm" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="场站" prop="stationId">
          <el-select
            v-model="inspectionForm.stationId"
            placeholder="请选择场站"
            @change="handleStationChange"
            style="width: 200px"
          >
            <el-option
              v-for="station in formStationOptions"
              :key="station.id"
              :label="station.stationName"
              :value="station.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="被检查人" prop="inspectedUserId">
          <el-select
            v-model="inspectionForm.inspectedUserId"
            placeholder="请选择被检查人"
            filterable
            style="width: 200px"
          >
            <el-option
              v-for="user in userList"
              :key="user.id"
              :label="user.real_name"
              :value="user.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="工作性质" prop="selectedWorkTypes">
          <el-checkbox-group v-model="inspectionForm.selectedWorkTypes" @change="handleWorkTypesChange">
            <el-checkbox
              v-for="wt in workTypes"
              :key="wt.id"
              :label="wt.id"
              :disabled="wt.is_default === 1"
            >
              {{ wt.work_type_name }}
              <el-tag v-if="wt.is_default === 1" size="small" type="info" style="margin-left: 5px;">默认</el-tag>
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <!-- 检查项目 -->
        <div v-if="groupedCheckItems.length > 0">
          <SafetyCheckItemList
            :groups="groupedCheckItems"
            :upload-url="uploadUrl"
            :upload-headers="uploadHeaders"
            status-field="result"
            pass-value="pass"
            fail-value="fail"
            :pass-label="'合格'"
            :fail-label="'异常'"
            :parent-label="'父项'"
            :child-label="'子项'"
            :standard-label="'标准：'"
            :photo-label="'上传异常项照片：'"
            :show-remark="true"
            remark-field="remark"
            :remark-placeholder="'请填写异常原因'"
            remark-position="before"
            :use-button-radio="true"
            radio-group-size="small"
            :is-child-visible="isChildVisible"
            @status-change="handleResultChange"
            @photo-change="updateItemPhotoList"
            @upload-error="handleUploadError"
          />
        </div>
        <el-empty v-else-if="inspectionForm.selectedWorkTypes.length > 0" description="该工作性质下暂无检查项目" />

        <el-form-item label="备注">
          <el-input
            v-model="inspectionForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请填写检查备注"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitInspection" :loading="submitting">提交</el-button>
      </template>
    </FormDialog>

    <!-- 详情对话框 -->
    <FormDialog
      v-model="detailDialogVisible"
      title="检查详情"
      width="700px"
      :show-confirm="false"
      :show-cancel="false"
    >
      <div class="detail-content" v-if="detailData">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="检查人">{{ detailData.inspector?.real_name || detailData.inspector_name }}</el-descriptions-item>
          <el-descriptions-item label="被检查人">{{ detailData.inspected_user_name }}</el-descriptions-item>
          <el-descriptions-item label="场站">{{ detailData.station?.station_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="检查日期">{{ detailData.inspection_date }}</el-descriptions-item>
          <el-descriptions-item label="工作性质" :span="2">
            {{ getWorkTypeNames(detailData.work_type_ids) }}
          </el-descriptions-item>
          <el-descriptions-item label="总体结论">
            <el-tag :type="detailData.is_qualified ? 'success' : 'danger'">
              {{ detailData.is_qualified ? '合格' : '异常' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="备注">{{ detailData.remark || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-items" v-if="detailData.inspection_items?.length">
          <h4>检查项目</h4>
          <el-table :data="detailData.inspection_items" border size="small">
            <el-table-column prop="workTypeName" label="工作性质" width="100" />
            <el-table-column prop="itemName" label="检查项目" min-width="120">
              <template #default="{ row }">
                <span v-if="row.parentName">{{ row.parentName }} / {{ row.itemName }}</span>
                <span v-else>{{ row.itemName }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="itemStandard" label="检查标准" min-width="140">
              <template #default="{ row }">
                {{ row.itemStandard || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="结果" width="80">
              <template #default="{ row }">
                <el-tag :type="row.result === 'pass' ? 'success' : 'danger'" size="small">
                  {{ row.result === 'pass' ? '合格' : '异常' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" width="100">
              <template #default="{ row }">
                {{ row.remark || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="照片" width="120">
              <template #default="{ row }">
                <div v-if="row.photoUrls?.length" class="photo-preview">
                  <el-image
                    v-for="(url, idx) in row.photoUrls"
                    :key="idx"
                    :src="url"
                    :preview-src-list="row.photoUrls"
                    fit="cover"
                    style="width: 40px; height: 40px; margin-right: 4px;"
                  />
                </div>
                <span v-else>-</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </FormDialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { useUserStore } from '@/store/modules/user';
import { useUpload } from '@/composables/useUpload';
import request from '@/api/request';
import dayjs from 'dayjs';
import SafetyCheckItemList from '@/components/inspection/SafetyCheckItemList.vue';
import FormDialog from '@/components/system/FormDialog.vue';

const userStore = useUserStore();

const { uploadUrl, uploadHeaders } = useUpload();

// 场站筛选显示控制
const showStationFilter = computed(() => {
  const user = userStore.userInfo;
  if (user?.roleCode === 'station_manager' && user?.stations?.length > 1) {
    return true;
  }
  return ['deputy_manager', 'department_manager', 'admin', 'safety_inspector'].includes(user?.roleCode);
});

// 场站列表
const stationList = ref([]);
const activeStationList = computed(() => stationList.value.filter(station => isActiveStatus(station.status)));
const formStationOptions = computed(() => {
  const selectedId = inspectionForm.stationId;
  if (!selectedId) return activeStationList.value;
  const selected = stationList.value.find(station => station.id === selectedId);
  if (selected && !isActiveStatus(selected.status)) {
    return [selected, ...activeStationList.value.filter(station => station.id !== selectedId)];
  }
  return activeStationList.value;
});

// 工作性质
const workTypes = ref([]);
const workTypesMap = ref({});
const isActiveStatus = (status) => status === undefined || status === null || status === '' || status === 'active' || status === 1 || status === '1' || status === true;

// 上传配置

// 筛选条件
const filters = reactive({
  dateRange: [],
  stationId: null,
  inspectedName: '',
  workTypeIds: []
});

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
});

// 列表数据
const inspectionList = ref([]);
const loading = ref(false);

// 新建检查对话框
const dialogVisible = ref(false);
const submitting = ref(false);
const formRef = ref();
const userList = ref([]);
const allCheckItems = ref([]);

const inspectionForm = reactive({
  stationId: null,
  inspectedUserId: null,
  selectedWorkTypes: [],
  remark: ''
});

const formRules = {
  stationId: [{ required: true, message: '请选择场站', trigger: 'change' }],
  inspectedUserId: [{ required: true, message: '请选择被检查人', trigger: 'change' }],
  selectedWorkTypes: [{ required: true, message: '请选择工作性质', trigger: 'change', type: 'array', min: 1 }]
};

// 按工作性质分组的检查项目
const groupedCheckItems = computed(() => {
  const groups = [];
  inspectionForm.selectedWorkTypes.forEach(wtId => {
    const workType = workTypesMap.value[wtId];
    if (workType) {
      const items = allCheckItems.value.filter(item => item.work_type_id === wtId);
      if (items.length > 0) {
        const parents = items.filter(item => item.parent_id === null || item.parent_id === undefined);
        const parentIds = new Set(parents.map(item => item.id));
        const childrenByParent = new Map();

        items.forEach(item => {
          if (item.parent_id !== null && item.parent_id !== undefined) {
            if (!childrenByParent.has(item.parent_id)) {
              childrenByParent.set(item.parent_id, []);
            }
            childrenByParent.get(item.parent_id).push(item);
          }
        });

        const sortByOrder = (a, b) => {
          const aOrder = a.sort_order ?? 0;
          const bOrder = b.sort_order ?? 0;
          if (aOrder !== bOrder) return aOrder - bOrder;
          return (a.id || 0) - (b.id || 0);
        };

        parents.sort(sortByOrder);

        const groupedItems = parents.map(parent => ({
          parent,
          children: (childrenByParent.get(parent.id) || []).sort(sortByOrder)
        }));

        const orphanChildren = items.filter(item =>
          item.parent_id !== null &&
          item.parent_id !== undefined &&
          !parentIds.has(item.parent_id)
        );
        orphanChildren.sort(sortByOrder);
        orphanChildren.forEach(orphan => {
          groupedItems.push({ parent: orphan, children: [] });
        });

        groups.push({
          workType,
          items: groupedItems
        });
      }
    }
  });
  return groups;
});

// 详情对话框
const detailDialogVisible = ref(false);
const detailData = ref(null);

// 加载场站列表
const loadStations = async () => {
  try {
    const res = await request.get('/stations', { params: { pageSize: 200 } });
    stationList.value = (res.list || res || []).map(s => ({
      id: s.id,
      stationName: s.stationName || s.station_name,
      status: s.status
    }));
  } catch (error) {
    
  }
};

// 加载工作性质
const loadWorkTypes = async () => {
  try {
    const res = await request.get('/safety-work-types');
    workTypes.value = (res || []).filter(wt => isActiveStatus(wt.status));
    workTypesMap.value = {};
    workTypes.value.forEach(wt => {
      workTypesMap.value[wt.id] = wt;
    });
  } catch (error) {
    
  }
};

// 加载检查项目
const loadCheckItems = async (workTypeIds) => {
  if (!workTypeIds || workTypeIds.length === 0) {
    allCheckItems.value = [];
    return;
  }
  try {
    const res = await request.get('/safety-check-items/by-work-types', {
      params: { workTypeIds: workTypeIds.join(',') }
    });
    const items = (res || []).flatMap(group => group.items || []);
    allCheckItems.value = items.map(item => ({
      ...item,
      result: null,
      remark: '',
      photoList: [],
      photoUrls: []
    }));
  } catch (error) {
    
  }
};

const normalizeUploadFile = (file) => {
  const responseUrl = file?.response?.data?.url ?? file?.response?.url ?? '';
  const url = responseUrl ? responseUrl : (file?.url ?? '');
  return url ? { ...file, url } : file;
};

const updateItemPhotoList = (item, fileList) => {
  const normalized = (fileList ?? []).map(normalizeUploadFile);
  item.photoList = normalized;
  item.photoUrls = normalized
    .map(file => file.response?.data?.url ?? file.response?.url)
    .filter(Boolean);
};

const getParentItem = (child) => {
  if (!child?.parent_id) return null;
  return allCheckItems.value.find(item => item.id === child.parent_id) || null;
};

const resolveParentResultValue = (parent) => {
  if (parent.result === 'pass') return 1;
  if (parent.result === 'fail') return 0;
  return null;
};

const isChildVisible = (child) => {
  if (!child?.parent_id) return true;
  const parent = getParentItem(child);
  if (!parent || Number(parent.enable_children) !== 1) return false;
  const parentValue = resolveParentResultValue(parent);
  if (parentValue === null) return false;
  const triggerValue = child.trigger_value !== null && child.trigger_value !== undefined
    ? Number(child.trigger_value)
    : 1;
  return parentValue === triggerValue;
};

const resetChildItem = (child) => {
  child.result = null;
  child.remark = '';
  child.photoList = [];
  child.photoUrls = [];
};

const handleResultChange = (item) => {
  if (!item || item.parent_id) return;
  const children = allCheckItems.value.filter(child => child.parent_id === item.id);
  if (Number(item.enable_children) !== 1) {
    children.forEach(resetChildItem);
    return;
  }
  children.forEach(child => {
    if (!isChildVisible(child)) {
      resetChildItem(child);
    }
  });
};

const getVisibleCheckItems = () => allCheckItems.value.filter(
  item => item.parent_id === null || item.parent_id === undefined || isChildVisible(item)
);

const getParentName = (item) => {
  const parent = getParentItem(item);
  return parent ? parent.item_name : '';
};

const handleUploadError = () => {
  ElMessage.error('图片上传失败，请检查图片大小或网络');
};

// 加载检查列表
const loadInspectionList = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    };

    if (filters.dateRange && filters.dateRange.length === 2) {
      params.startDate = filters.dateRange[0];
      params.endDate = filters.dateRange[1];
    }
    if (filters.stationId) {
      params.stationId = filters.stationId;
    }
    if (filters.inspectedName) {
      params.inspectedUserName = filters.inspectedName;
    }
    if (filters.workTypeIds && filters.workTypeIds.length > 0) {
      params.workTypeIds = filters.workTypeIds.join(',');
    }

    const res = await request.get('/other-inspections', { params });
    inspectionList.value = res?.list || res || [];
    pagination.total = res?.total || 0;
  } catch (error) {
    
  } finally {
    loading.value = false;
  }
};

// 重置筛选
const resetFilters = () => {
  filters.dateRange = [];
  filters.stationId = null;
  filters.inspectedName = '';
  filters.workTypeIds = [];
  loadInspectionList();
};

const applyFilters = () => {
  pagination.page = 1;
  loadInspectionList();
};

watch(
  () => [filters.dateRange, filters.stationId, filters.inspectedName, filters.workTypeIds],
  () => {
    applyFilters();
  },
  { deep: true }
);

// 场站变更
const handleStationChange = async (stationId) => {
  inspectionForm.inspectedUserId = null;
  userList.value = [];

  if (stationId) {
    try {
      const res = await request.get('/schedules/today', {
        params: { stationId }
      });
      const uniqueUsers = new Map();
      (res || []).forEach(item => {
        const userId = item.userId || item.user?.id;
        if (!userId || uniqueUsers.has(userId)) return;
        uniqueUsers.set(userId, {
          id: userId,
          real_name: item.user?.real_name || item.userName || ''
        });
      });
      userList.value = Array.from(uniqueUsers.values());
    } catch (error) {
      
    }
  }
};

// 工作性质变更
const handleWorkTypesChange = async (selectedIds) => {
  await loadCheckItems(selectedIds);
};

// 显示新建检查对话框
const showNewInspection = () => {
  // 重置表单
  Object.assign(inspectionForm, {
    stationId: null,
    inspectedUserId: null,
    selectedWorkTypes: [],
    overallResult: 'pass',
    remark: ''
  });
  userList.value = [];
  allCheckItems.value = [];

  // 设置默认工作性质
  const defaultWorkTypes = workTypes.value.filter(wt => wt.is_default === 1).map(wt => wt.id);
  inspectionForm.selectedWorkTypes = [...defaultWorkTypes];

  // 如果只有一个场站，自动选中
  if (activeStationList.value.length === 1) {
    inspectionForm.stationId = activeStationList.value[0].id;
    handleStationChange(inspectionForm.stationId);
  }

  // 加载默认工作性质的检查项目
  if (defaultWorkTypes.length > 0) {
    loadCheckItems(defaultWorkTypes);
  }

  dialogVisible.value = true;
};

// 提交检查
const submitInspection = async () => {
  try {
    await formRef.value.validate();

    // 检查是否所有项目都已填写结果
    const visibleItems = getVisibleCheckItems();
    const uncheckedItems = visibleItems.filter(item => item.result === null);
    if (uncheckedItems.length > 0) {
      ElMessage.warning('请对所有检查项目进行评价');
      return;
    }

    submitting.value = true;

    // 获取被检查人姓名
    const inspectedUser = userList.value.find(u => u.id === inspectionForm.inspectedUserId);

    // 构建检查项目数据
    const inspectionItems = visibleItems.map(item => ({
      workTypeId: item.work_type_id,
      workTypeName: workTypesMap.value[item.work_type_id]?.work_type_name || '',
      itemId: item.id,
      itemName: item.item_name,
      parentId: item.parent_id ?? null,
      parentName: item.parent_id ? getParentName(item) : '',
      triggerValue: item.trigger_value ?? null,
      enableChildren: item.enable_children ?? 0,
      itemStandard: item.item_standard,
      result: item.result,
      remark: item.remark,
      photoUrls: item.photoUrls || []
    }));

    await request.post('/other-inspections', {
      stationId: inspectionForm.stationId,
      inspectedUserId: inspectionForm.inspectedUserId,
      inspectedUserName: inspectedUser?.real_name || '',
      workTypeIds: inspectionForm.selectedWorkTypes,
      inspectionItems,
      isQualified: visibleItems.every(item => item.result === 'pass'),
      remark: inspectionForm.remark
    });

    ElMessage.success('安全他检提交成功');
    dialogVisible.value = false;
    loadInspectionList();
  } catch (error) {
    if (error.message) {
      ElMessage.error(error.message);
    }
  } finally {
    submitting.value = false;
  }
};

// 查看详情
const viewDetail = (row) => {
  detailData.value = row;
  detailDialogVisible.value = true;
};

// 获取工作性质名称
const getWorkTypeNames = (workTypeIds) => {
  if (!workTypeIds || !Array.isArray(workTypeIds)) return '-';
  return workTypeIds
    .map(id => workTypesMap.value[id]?.work_type_name || `ID:${id}`)
    .join('、');
};

// 获取检查结果
const getInspectionResult = (row) => {
  if (row.is_qualified) {
    return { type: 'success', text: '合格' };
  } else {
    return { type: 'danger', text: '异常' };
  }
};

onMounted(async () => {
  await loadStations();
  await loadWorkTypes();

  await loadInspectionList();
});
</script>

<style lang="scss" scoped>
.safety-other-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h3 {
      margin: 0;
      font-size: 18px;
    }
  }

  .filter-card {
    margin-bottom: 20px;
  }

  .table-card {
    .pagination-wrapper {
      margin-top: 16px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .check-group {
    margin-bottom: 16px;
  }

  .check-item-list {
    padding-left: 20px;
  }

  .check-item-group {
    margin-bottom: 12px;
  }

  .check-item {
    margin-bottom: 12px;
    padding: 12px;
    background: #f5f7fa;
    border-radius: 4px;

    .check-item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .item-name {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 500;
      }
    }

    .check-item-standard {
      color: #909399;
      font-size: 12px;
      margin-top: 4px;
    }

    .check-item-photo {
      margin-top: 10px;

      .photo-label {
        font-size: 12px;
        color: #f56c6c;
        margin-bottom: 8px;
      }

      :deep(.el-upload--picture-card) {
        width: 80px;
        height: 80px;
      }

      :deep(.el-upload-list--picture-card .el-upload-list__item) {
        width: 80px;
        height: 80px;
      }
    }
  }

  .check-item.child {
    margin-top: 8px;
    margin-left: 16px;
    background: #fff;
    border: 1px dashed #dcdfe6;
  }

  .photo-preview {
    display: flex;
    flex-wrap: wrap;
  }

  .detail-content {
    .detail-items {
      margin-top: 20px;

      h4 {
        margin: 0 0 12px 0;
        font-size: 14px;
      }
    }
  }
}
</style>
