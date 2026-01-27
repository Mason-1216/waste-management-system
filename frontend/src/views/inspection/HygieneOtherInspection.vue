<template>
  <div class="hygiene-other-page">
    <div class="page-header">
      <h3>员工检查记录</h3>
      <el-button type="primary" @click="showNewInspection">
        <el-icon><Plus /></el-icon>新增他检
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
            placeholder="请选择责任区"
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
        <el-table-column label="责任区" min-width="150">
          <template #default="{ row }">
            {{ getWorkTypeNames(row.work_type_ids) }}
          </template>
        </el-table-column>
        <el-table-column label="积分" width="90">
          <template #default="{ row }">
            {{ getInspectionPoints(row) }}
          </template>
        </el-table-column>
        <el-table-column label="检查人" width="100">
          <template #default="{ row }">
            {{ row.inspector?.real_name || row.inspector_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="检查结果" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_qualified ? 'success' : 'danger'">
              {{ row.is_qualified ? '合格' : '异常' }}
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
      title="新增他检"
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

        <el-form-item label="责任区" prop="selectedWorkTypes">
          <el-checkbox-group v-model="inspectionForm.selectedWorkTypes" @change="handleWorkTypesChange">
            <el-checkbox
              v-for="wt in formWorkTypes"
              :key="wt.id"
              :label="wt.id"
            >
              {{ wt.work_type_name }}
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
            :parent-label="'点位'"
            :child-label="'子项'"
            :standard-label="'要求：'"
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
        <el-empty v-else-if="inspectionForm.selectedWorkTypes.length > 0" description="该责任区下暂无检查项目" />

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
          <el-descriptions-item label="责任区" :span="2">
            {{ getWorkTypeNames(detailData.work_type_ids) }}
          </el-descriptions-item>
          <el-descriptions-item label="总体结论">
            <el-tag :type="detailData.is_qualified ? 'success' : 'danger'">
              {{ detailData.is_qualified ? '合格' : '异常' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="备注">{{ detailData.remark || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-items" v-if="detailItems.length">
          <h4>检查项目</h4>
          <el-table :data="detailItems" border size="small">
            <el-table-column prop="workTypeName" label="责任区" width="120" />
            <el-table-column prop="itemName" label="检查点位" min-width="140" />
            <el-table-column prop="itemStandard" label="工作要求" min-width="160">
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

const showStationFilter = computed(() => {
  const user = userStore.userInfo;
  if (user?.roleCode === 'station_manager' && user?.stations?.length > 1) {
    return true;
  }
  return ['deputy_manager', 'department_manager', 'admin', 'safety_inspector'].includes(user?.roleCode);
});

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

const workTypes = ref([]);
const workTypesMap = ref({});
const formWorkTypes = ref([]);
const formWorkTypesMap = ref({});
const stationAreas = ref([]);
const areaPointsMap = ref({});

const isActiveStatus = (status) => status === undefined || status === null || status === '' || status === 'active' || status === 1 || status === '1' || status === true;

const filters = reactive({
  dateRange: [],
  stationId: null,
  inspectedName: '',
  workTypeIds: []
});

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
});

const inspectionList = ref([]);
const loading = ref(false);

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
  selectedWorkTypes: [{ required: true, message: '请选择责任区', trigger: 'change', type: 'array', min: 1 }]
};

const groupedCheckItems = computed(() => {
  const groups = [];
  inspectionForm.selectedWorkTypes.forEach(wtId => {
    const workType = formWorkTypesMap.value[wtId];
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

        const groupedItems = parents.map(parent => ({
          parent,
          children: childrenByParent.get(parent.id) || []
        }));

        const orphanChildren = items.filter(item =>
          item.parent_id !== null &&
          item.parent_id !== undefined &&
          !parentIds.has(item.parent_id)
        );
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

const detailDialogVisible = ref(false);
const detailData = ref(null);

const isMetaItem = (item) => {
  const name = item?.itemName || item?.item_name || '';
  const type = item?.itemType || item?.item_type || '';
  return type === 'remark' || type === 'area_photo' || name === '不合格说明' || name === '责任区照片';
};

const getDetailItems = (row) => {
  const items = row?.inspection_items || [];
  return items.filter(item => !isMetaItem(item));
};

const detailItems = computed(() => getDetailItems(detailData.value));

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

const mapWorkTypes = (list, targetMap) => {
  targetMap.value = {};
  (list || []).forEach(wt => {
    targetMap.value[wt.id] = wt;
  });
};

const mapAreasToWorkTypes = (areas) => (areas || []).map(area => ({
  id: area.id,
  work_type_name: area.areaName ?? area.area_name ?? '',
  points: area.areaPoints ?? area.points ?? 0,
  pointsList: area.points ?? area.hygienePoints ?? []
}));

const loadHygieneAreas = async (stationId) => {
  const params = {};
  if (stationId) {
    params.stationId = stationId;
  }
  const res = await request.get('/hygiene-areas', { params });
  return res || [];
};

const loadFilterWorkTypes = async () => {
  try {
    const areas = await loadHygieneAreas();
    workTypes.value = mapAreasToWorkTypes(areas);
    mapWorkTypes(workTypes.value, workTypesMap);
    const pointsMap = {};
    workTypes.value.forEach(area => {
      pointsMap[area.id] = area.points ?? 0;
    });
    areaPointsMap.value = pointsMap;
  } catch (error) {
    
  }
};

const loadFormWorkTypes = async () => {
  try {
    const areas = await loadHygieneAreas(inspectionForm.stationId);
    stationAreas.value = areas;
    formWorkTypes.value = mapAreasToWorkTypes(areas);
    mapWorkTypes(formWorkTypes.value, formWorkTypesMap);
  } catch (error) {
    
  }
};

const buildHygieneCheckItems = (areas, workTypeIds) => {
  const selected = new Set((workTypeIds || []).map(id => Number(id)));
  const items = [];
  (areas || []).forEach(area => {
    if (!selected.has(Number(area.id))) return;
    const points = area.points || area.hygienePoints || [];
    points.forEach(point => {
      items.push({
        id: point.id,
        item_name: point.pointName ?? point.point_name ?? '',
        item_standard: point.workRequirements ?? point.work_requirements ?? '',
        work_type_id: area.id,
        parent_id: null,
        result: null,
        remark: '',
        photoList: [],
        photoUrls: []
      });
    });
  });
  return items;
};

const loadCheckItems = async (workTypeIds) => {
  if (!workTypeIds || workTypeIds.length === 0) {
    allCheckItems.value = [];
    return;
  }
  allCheckItems.value = buildHygieneCheckItems(stationAreas.value, workTypeIds);
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

const handleUploadError = () => {
  ElMessage.error('图片上传失败，请检查图片大小或网络');
};

const loadInspectionList = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      inspectionType: 'hygiene'
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

  await loadFormWorkTypes();
  inspectionForm.selectedWorkTypes = [];
  allCheckItems.value = [];
};

const handleWorkTypesChange = async (selectedIds) => {
  await loadCheckItems(selectedIds);
};

const showNewInspection = () => {
  Object.assign(inspectionForm, {
    stationId: null,
    inspectedUserId: null,
    selectedWorkTypes: [],
    remark: ''
  });
  userList.value = [];
  allCheckItems.value = [];
  loadFormWorkTypes();

  if (activeStationList.value.length === 1) {
    inspectionForm.stationId = activeStationList.value[0].id;
    handleStationChange(inspectionForm.stationId);
  }

  dialogVisible.value = true;
};

const submitInspection = async () => {
  if (!inspectionForm.stationId) {
    ElMessage.warning('请选择场站');
    return;
  }
  if (!inspectionForm.inspectedUserId) {
    ElMessage.warning('请选择被检查人');
    return;
  }
  if (!inspectionForm.selectedWorkTypes.length) {
    ElMessage.warning('请选择责任区');
    return;
  }

  const visibleItems = allCheckItems.value.filter(item => item.result === 'pass' || item.result === 'fail');
  const unselectedItems = allCheckItems.value.filter(item => item.result !== 'pass' && item.result !== 'fail');
  if (unselectedItems.length > 0) {
    ElMessage.warning('请完成所有检查项');
    return;
  }

  submitting.value = true;
  try {
    const inspectedUser = userList.value.find(user => user.id === inspectionForm.inspectedUserId);

    const inspectionItems = visibleItems.map(item => ({
      workTypeId: item.work_type_id,
      workTypeName: formWorkTypesMap.value[item.work_type_id]?.work_type_name || '',
      itemId: item.id,
      itemName: item.item_name,
      parentId: item.parent_id ?? null,
      parentName: item.parent_id ? getParentItem(item)?.item_name || '' : '',
      itemStandard: item.item_standard,
      result: item.result,
      remark: item.remark || '',
      photoUrls: item.photoUrls || []
    }));

    await request.post('/other-inspections', {
      inspectionType: 'hygiene',
      stationId: inspectionForm.stationId,
      inspectedUserId: inspectionForm.inspectedUserId,
      inspectedUserName: inspectedUser?.real_name || '',
      workTypeIds: inspectionForm.selectedWorkTypes,
      inspectionItems,
      isQualified: inspectionItems.every(item => item.result === 'pass'),
      remark: inspectionForm.remark
    });

    ElMessage.success('他检提交成功');
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

const viewDetail = (row) => {
  detailData.value = row;
  detailDialogVisible.value = true;
};

const getWorkTypeNames = (workTypeIds) => {
  const ids = Array.isArray(workTypeIds) ? workTypeIds : [];
  if (!ids.length) return '-';
  return ids
    .map(id => workTypesMap.value[id]?.work_type_name || `ID:${id}`)
    .join('、');
};

const getInspectionPoints = (row) => {
  const ids = Array.isArray(row?.work_type_ids) ? row.work_type_ids : [];
  let total = 0;
  ids.forEach(id => {
    const points = areaPointsMap.value[id];
    const value = Number(points);
    if (!Number.isNaN(value)) {
      total += value;
    }
  });
  return total;
};

onMounted(async () => {
  await loadStations();
  await loadFilterWorkTypes();
  await loadInspectionList();
});
</script>

<style lang="scss" scoped>
.hygiene-other-page {
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

  .detail-content {
    .detail-items {
      margin-top: 16px;
    }

    .photo-preview {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
    }
  }
}
</style>
