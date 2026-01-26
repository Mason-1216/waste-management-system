<template>
  <div class="hygiene-other-page">
    <div class="page-header">
      <h3>卫生他检记录</h3>
      <el-button type="primary" @click="showNewInspection">
        <el-icon><Plus /></el-icon>新建检查
      </el-button>
    </div>

    <div class="panel-filters inspection-filters">
      <el-select
        v-model="inspectionFilters.stationId"
        placeholder="筛选场站"
        clearable
        filterable
        style="width: 200px;"
        @change="applyInspectionFilters"
      >
        <el-option
          v-for="station in stationIdOptions"
          :key="station.id"
          :label="station.name"
          :value="station.id"
        />
      </el-select>
      <el-select
        v-model="inspectionFilters.inspectedUserName"
        placeholder="筛选被检查人"
        clearable
        filterable
        allow-create
        default-first-option
        style="width: 200px;"
        @change="applyInspectionFilters"
      >
        <el-option
          v-for="name in inspectedUserOptions"
          :key="name"
          :label="name"
          :value="name"
        />
      </el-select>
      <el-select
        v-model="inspectionFilters.positionName"
        placeholder="筛选岗位"
        clearable
        filterable
        allow-create
        default-first-option
        style="width: 200px;"
        @change="applyInspectionFilters"
      >
        <el-option
          v-for="name in inspectionPositionOptions"
          :key="name"
          :label="name"
          :value="name"
        />
      </el-select>
      <el-select
        v-model="inspectionFilters.areaName"
        placeholder="筛选责任区"
        clearable
        filterable
        allow-create
        default-first-option
        style="width: 200px;"
        @change="applyInspectionFilters"
      >
        <el-option
          v-for="name in inspectionAreaOptions"
          :key="name"
          :label="name"
          :value="name"
        />
      </el-select>
      <el-button @click="resetInspectionFilters">重置</el-button>
    </div>

    <el-table :data="filteredInspectionList" stripe border v-loading="loadingInspection">
      <el-table-column prop="inspectionDate" label="检查日期" width="120" />
      <el-table-column prop="stationName" label="场站" width="140" />
      <el-table-column prop="inspectedUserName" label="被检查人" width="140" />
      <el-table-column prop="positionName" label="岗位" width="120" />
      <el-table-column prop="areaName" label="责任区" min-width="160" />
      <el-table-column prop="inspectorName" label="检查人" width="120" />
      <el-table-column label="检查结果" width="100">
        <template #default="{ row }">
          <el-tag :type="row.isQualified ? 'success' : 'danger'">
            {{ row.isQualified ? '合格' : '不合格' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button link type="primary" @click="viewInspectionDetail(row)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="inspectionPagination.page"
        v-model:page-size="inspectionPagination.pageSize"
        :total="inspectionPagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @current-change="loadInspectionList"
        @size-change="loadInspectionList"
      />
    </div>

    <FormDialog
      v-model="inspectionDialogVisible"
      title="卫生他检"
      width="700px"
      :show-confirm="false"
      :show-cancel="false"
    >
      <el-form :model="inspectionForm" :rules="inspectionRules" ref="inspectionFormRef" label-width="120px">
        <el-form-item label="场站" prop="stationId">
          <el-select
            v-model="inspectionForm.stationId"
            placeholder="请选择场站"
            @change="handleStationChange"
            style="width: 220px;"
          >
            <el-option
              v-for="station in stationIdOptions"
              :key="station.id"
              :label="station.name"
              :value="station.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="责任区" prop="selectedAreaIds">
          <el-select
            v-model="inspectionForm.selectedAreaIds"
            placeholder="请选择责任区"
            multiple
            style="width: 100%;"
            @change="handleAreaChange"
          >
            <el-option
              v-for="area in areaList"
              :key="area.id"
              :label="area.areaName ?? area.area_name ?? ''"
              :value="area.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="岗位">
          <el-input v-model="inspectionForm.positionName" disabled placeholder="根据责任区自动填写" />
        </el-form-item>

        <el-form-item label="被检查人" prop="inspectedUserId">
          <el-select
            v-model="inspectionForm.inspectedUserId"
            placeholder="根据岗位自动填写"
            style="width: 220px;"
            disabled
          >
            <el-option
              v-for="user in todayUsers"
              :key="user.userId"
              :label="`${user.userName} (${user.positionName})`"
              :value="user.userId"
            />
          </el-select>
        </el-form-item>

        <el-divider content-position="left">检查内容</el-divider>

        <HygieneAreaChecklist
          :areas="inspectionForm.areas"
          :upload-url="uploadUrl"
          :upload-headers="uploadHeaders"
          header-type="title"
          :empty-description="'请先选择责任区'"
          :requirement-prefix="'要求：'"
          :requirement-fallback="'-'"
          :pass-label="'是'"
          :fail-label="'否'"
          :show-point-remark="true"
          :remark-placeholder="'不合格备注（选填）'"
          @point-status-change="handlePointStatusChange"
          @point-photo-change="updatePointPhotoList"
          @upload-error="handleUploadError"
        />
      </el-form>
      <template #footer>
        <el-button @click="inspectionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitInspection" :loading="submittingInspection">
          提交
        </el-button>
      </template>
    </FormDialog>

    <FormDialog
      v-model="detailDialogVisible"
      title="检查详情"
      width="700px"
      :show-confirm="false"
      :show-cancel="false"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="检查日期">{{ currentRecord?.inspectionDate }}</el-descriptions-item>
        <el-descriptions-item label="被检查人">{{ currentRecord?.inspectedUserName }}</el-descriptions-item>
        <el-descriptions-item label="岗位">{{ currentRecord?.positionName }}</el-descriptions-item>
        <el-descriptions-item label="责任区">{{ currentRecord?.areaName }}</el-descriptions-item>
        <el-descriptions-item label="检查人">{{ currentRecord?.inspectorName }}</el-descriptions-item>
        <el-descriptions-item label="检查结果">
          <el-tag :type="currentRecord?.isQualified ? 'success' : 'danger'">
            {{ currentRecord?.isQualified ? '合格' : '不合格' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">检查项目</el-divider>

      <el-table :data="currentRecord?.items || []" border size="small">
        <el-table-column label="责任区" min-width="140">
          <template #default="{ row }">
            {{ row.areaName || row.area_name || currentRecord?.areaName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="卫生点" min-width="140">
          <template #default="{ row }">
            {{ row.pointName || row.point_name || row.itemName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="工作要求及标准" min-width="200">
          <template #default="{ row }">
            {{ row.workRequirements || row.work_requirements || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="是否合格" width="100">
          <template #default="{ row }">
            {{ row.status === 1 ? '是' : row.status === 0 ? '否' : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="180">
          <template #default="{ row }">
            {{ row.remark || '-' }}
          </template>
        </el-table-column>
      </el-table>
    </FormDialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive, watch } from 'vue';
import { useUserStore } from '@/store/modules/user';
import { useUpload } from '@/composables/useUpload';
import { ElMessage } from 'element-plus';
import request from '@/api/request';
import dayjs from 'dayjs';
import { Plus } from '@element-plus/icons-vue';
import { getHygieneAreas, getHygienePoints, getHygienePositionAreas } from '@/api/hygieneManagement';
import HygieneAreaChecklist from '@/components/inspection/HygieneAreaChecklist.vue';
import FormDialog from '@/components/system/FormDialog.vue';

const userStore = useUserStore();

const { uploadUrl, uploadHeaders } = useUpload();

const loadingInspection = ref(false);
const submittingInspection = ref(false);
const inspectionDialogVisible = ref(false);
const inspectionFormRef = ref(null);
const inspectionList = ref([]);
const stationList = ref([]);
const areaList = ref([]);
const todayUsers = ref([]);
const detailDialogVisible = ref(false);
const currentRecord = ref(null);

const inspectionPagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
});

const inspectionFilters = reactive({
  stationId: null,
  inspectedUserName: '',
  positionName: '',
  areaName: ''
});

const inspectionForm = ref({
  stationId: null,
  selectedAreaIds: [],
  inspectedUserId: null,
  positionName: '',
  areas: []
});

const inspectionRules = {
  stationId: [{ required: true, message: '请选择场站', trigger: 'change' }],
  selectedAreaIds: [
    { required: true, type: 'array', min: 1, message: '请至少选择一个责任区', trigger: 'change' }
  ],
  inspectedUserId: [{ required: true, message: '请选择被检查人', trigger: 'change' }]
};

const normalizeRecord = (item) => {
  let meta = {};
  try {
    meta = item.unqualified_items ? JSON.parse(item.unqualified_items) : {};
  } catch (e) {
    meta = {};
  }
  const items = Array.isArray(meta.items) ? meta.items : [];
  const isQualified = item.is_qualified === 1 || item.isQualified === true;

  return {
    inspectionDate: item.inspection_date || item.inspectionDate,
    stationId: item.station_id || item.station?.id || null,
    stationName: item.station?.station_name || item.station_name || '-',
    inspectedUserName: item.inspected_user_name || item.inspectedUser?.realName,
    inspectorName: item.inspector_name || item.inspector?.realName,
    positionName: meta.positionName || '-',
    areaName: meta.areaName || '-',
    items,
    isQualified
  };
};

const filteredInspectionList = computed(() => {
  const stationId = inspectionFilters.stationId;
  const inspectedKeyword = inspectionFilters.inspectedUserName?.trim().toLowerCase() || '';
  const positionKeyword = inspectionFilters.positionName?.trim().toLowerCase() || '';
  const areaKeyword = inspectionFilters.areaName?.trim().toLowerCase() || '';

  return inspectionList.value.filter(row => {
    const matchStation = stationId ? row.stationId === stationId : true;
    const matchInspected = inspectedKeyword
      ? (row.inspectedUserName || '').toLowerCase().includes(inspectedKeyword)
      : true;
    const matchPosition = positionKeyword
      ? (row.positionName || '').toLowerCase().includes(positionKeyword)
      : true;
    const matchArea = areaKeyword
      ? (row.areaName || '').toLowerCase().includes(areaKeyword)
      : true;
    return matchStation && matchInspected && matchPosition && matchArea;
  });
});

const inspectedUserOptions = computed(() => {
  const names = new Set();
  inspectionList.value.forEach(row => {
    if (row?.inspectedUserName) names.add(row.inspectedUserName);
  });
  return Array.from(names);
});

const inspectionPositionOptions = computed(() => {
  const names = new Set();
  inspectionList.value.forEach(row => {
    if (row?.positionName && row.positionName !== '-') names.add(row.positionName);
  });
  return Array.from(names);
});

const inspectionAreaOptions = computed(() => {
  const names = new Set();
  inspectionList.value.forEach(row => {
    if (row?.areaName && row.areaName !== '-') names.add(row.areaName);
  });
  return Array.from(names);
});

const applyInspectionFilters = () => {
  inspectionPagination.value.page = 1;
  loadInspectionList();
};

const resetInspectionFilters = () => {
  inspectionFilters.stationId = null;
  inspectionFilters.inspectedUserName = '';
  inspectionFilters.positionName = '';
  inspectionFilters.areaName = '';
};

watch(inspectionFilters, () => {
  applyInspectionFilters();
}, { deep: true });

const loadInspectionList = async () => {
  loadingInspection.value = true;
  try {
    const stationParam = inspectionFilters.stationId || undefined;
    const res = await request.get('/other-inspections', {
      params: {
        inspectionType: 'hygiene',
        page: inspectionPagination.value.page,
        pageSize: inspectionPagination.value.pageSize,
        stationId: stationParam
      }
    });
    inspectionList.value = (res.list || []).map(normalizeRecord);
    inspectionPagination.value.total = res.total || 0;
  } catch (e) {
    ElMessage.error(e.message || '加载检查记录失败');
  } finally {
    loadingInspection.value = false;
  }
};

const loadStations = async () => {
  try {
    const res = await request.get('/stations/all');
    const list = Array.isArray(res) ? res : (res?.list || []);
    stationList.value = list;
  } catch (e) {
    ElMessage.error(e.message || '加载场站列表失败');
  }
};

const stationOptions = computed(() => {
  const list = Array.isArray(stationList.value) ? stationList.value : [];
  return list
    .filter(Boolean)
    .map(station => ({
      id: station.id ?? station.station_id ?? station.stationId ?? null,
      name: station.station_name || station.stationName || station.name || ''
    }))
    .filter(station => station.name);
});

const stationIdOptions = computed(() => {
  return stationOptions.value.filter(station => station.id !== null && station.id !== undefined && station.id !== '');
});

const handleStationChange = async (stationId) => {
  inspectionForm.value.selectedAreaIds = [];
  inspectionForm.value.inspectedUserId = null;
  inspectionForm.value.positionName = '';
  inspectionForm.value.areas = [];
  todayUsers.value = [];

  if (!stationId) return;

  try {
    const areas = await getHygieneAreas({
      stationId: stationId || userStore.currentStationId
    });

    const areasWithPoints = await Promise.all(
      (areas || []).map(async (area) => {
        try {
          const points = await getHygienePoints({
            hygieneAreaId: area.id
          });
          return { ...area, points: points || [] };
        } catch (e) {
          return { ...area, points: [] };
        }
      })
    );

    areaList.value = areasWithPoints.map(area => ({
      ...area,
      areaName: area.areaName ?? area.area_name ?? '',
      points: (area.points || []).map(point => ({
        ...point,
        pointName: point.pointName ?? point.point_name ?? '',
        workRequirements: point.workRequirements ?? point.work_requirements ?? ''
      }))
    }));
  } catch (e) {
    ElMessage.error(e.message || '加载责任区失败');
  }

  try {
    const res = await request.get('/schedules/today', { params: { stationId } });
    todayUsers.value = res || [];
  } catch (e) {
    ElMessage.error(e.message || '加载排班人员失败');
  }
};

const handleAreaChange = async (selectedIds) => {
  if (!selectedIds || selectedIds.length === 0) {
    inspectionForm.value.areas = [];
    inspectionForm.value.positionName = '';
    inspectionForm.value.inspectedUserId = null;
    return;
  }

  try {
    const assignments = await getHygienePositionAreas({
      stationId: inspectionForm.value.stationId
    });

    const selectedAssignments = assignments.filter(item =>
      selectedIds.includes(item.areaId ?? item.hygiene_area_id)
    );

    const positionNames = [...new Set(selectedAssignments.map(item => item.positionName ?? item.position_name).filter(Boolean))];

    if (positionNames.length === 0) {
      ElMessage.warning('所选责任区未分配岗位，请先在【卫生工作安排】中配置');
      inspectionForm.value.selectedAreaIds = [];
      inspectionForm.value.areas = [];
      return;
    }

    if (positionNames.length > 1) {
      ElMessage.warning('所选责任区属于不同岗位，请选择同一岗位的责任区');
      inspectionForm.value.selectedAreaIds = [];
      inspectionForm.value.areas = [];
      return;
    }

    const positionName = positionNames[0];
    inspectionForm.value.positionName = positionName;

    const userWithPosition = todayUsers.value.find(u => u.positionName === positionName);
    if (userWithPosition) {
      inspectionForm.value.inspectedUserId = userWithPosition.userId;
    } else {
      ElMessage.warning(`今日排班中未找到岗位"${positionName}"的人员`);
      inspectionForm.value.inspectedUserId = null;
    }

    const selectedAreas = areaList.value.filter(area => selectedIds.includes(area.id));
    inspectionForm.value.areas = selectedAreas.map(area => ({
      ...area,
      areaName: area.areaName ?? area.area_name ?? '',
      points: (area.points || []).map(point => ({
        ...point,
        pointName: point.pointName ?? point.point_name ?? '',
        workRequirements: point.workRequirements ?? point.work_requirements ?? '',
        checkStatus: null,
        remark: '',
        photoList: []
      }))
    }));
  } catch (e) {
    ElMessage.error(e.message || '加载责任区失败');
  }
};

const updatePointPhotoList = (point, fileList) => {
  point.photoList = (fileList ?? []).map(file => {
    const responseUrl = file?.response?.data?.url ?? file?.response?.url ?? '';
    const url = responseUrl ? responseUrl : (file?.url ?? '');
    return url ? { ...file, url } : file;
  });
};

const handleUploadError = () => {
  ElMessage.error('图片上传失败，请检查图片大小或网络');
};

const handlePointStatusChange = (point) => {
  if (point.checkStatus !== 0) {
    point.remark = '';
    point.photoList = [];
  }
};

const submitInspection = async () => {
  await inspectionFormRef.value.validate();

  const allPoints = inspectionForm.value.areas.flatMap(area => area.points);
  const hasUnchecked = allPoints.some(point => point.checkStatus === null);
  if (hasUnchecked) {
    ElMessage.warning('请完成所有检查项');
    return;
  }

  submittingInspection.value = true;
  try {
    const isQualified = allPoints.every(point => point.checkStatus === 1);
    let itemIndex = 1;
    const items = inspectionForm.value.areas.flatMap(area =>
      (area.points || []).map(point => ({
        itemId: itemIndex++,
        areaName: area.areaName ?? area.area_name ?? '',
        pointName: point.pointName ?? point.point_name ?? '',
        workRequirements: point.workRequirements ?? point.work_requirements ?? '',
        status: point.checkStatus,
        itemName: point.pointName ?? point.point_name ?? '',
        remark: point.remark || '',
        photoUrls: (point.photoList || []).map(file => file.url).filter(Boolean)
      }))
    );

    const photoUrls = items.flatMap(item => item.photoUrls || []);
    const inspectedUser = todayUsers.value.find(u => u.userId === inspectionForm.value.inspectedUserId);

    const payloadMeta = {
      positionName: inspectionForm.value.positionName,
      areaName: inspectionForm.value.areas.map(a => a.areaName ?? a.area_name ?? '').filter(Boolean).join(', '),
      items
    };

    await request.post('/other-inspections', {
      inspectionType: 'hygiene',
      stationId: inspectionForm.value.stationId,
      inspectionDate: dayjs().format('YYYY-MM-DD'),
      inspectedUserId: inspectionForm.value.inspectedUserId,
      inspectedUserName: inspectedUser?.userName || inspectedUser?.realName || '',
      violationDescription: isQualified ? '' : '存在不合格项',
      isQualified,
      unqualifiedItems: JSON.stringify(payloadMeta),
      photoUrls
    });

    ElMessage.success('提交成功');
    inspectionDialogVisible.value = false;
    loadInspectionList();
  } catch (e) {
    ElMessage.error(e.message || '提交失败');
  } finally {
    submittingInspection.value = false;
  }
};

const showNewInspection = () => {
  inspectionForm.value = {
    stationId: userStore.currentStationId,
    selectedAreaIds: [],
    inspectedUserId: null,
    positionName: '',
    areas: []
  };
  inspectionDialogVisible.value = true;

  if (userStore.currentStationId) {
    handleStationChange(userStore.currentStationId);
  }
};

const viewInspectionDetail = (row) => {
  currentRecord.value = row;
  detailDialogVisible.value = true;
};

onMounted(() => {
  loadInspectionList();
  loadStations();
});
</script>

<style lang="scss" scoped>
.hygiene-other-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
    }
  }

  .inspection-filters {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }

  .area-section {
    margin-bottom: 24px;

    .area-title {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 500;
      color: #409eff;
    }
  }

  .panel-header {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;

    h4 {
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1 1 100%;
    }

    .header-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      width: 100%;
    }
  }

  .point-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .point-item {
    padding: 12px;
    background: #f5f7fa;
    border-radius: 4px;

    .point-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .point-name {
        font-weight: 500;
        color: #303133;
      }
    }

    .point-requirement {
      font-size: 12px;
      color: #606266;
      margin-bottom: 8px;
    }
  }

  .empty-hint {
    padding: 40px 0;
  }
}
</style>
