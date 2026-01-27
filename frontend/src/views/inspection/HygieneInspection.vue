<template>
  <div class="hygiene-inspection-page">
    <div class="page-header">
      <h2>卫生自检</h2>
    </div>

    <!-- 我的卫生自检 -->
    <div class="header-controls">
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        @change="loadHistory"
        @clear="loadHistory"
        style="width: 240px"
      />
    </div>

        <!-- 今日自检状态 -->
        <div class="status-card" :class="{ completed: todayInspection }">
          <div v-if="todayInspection" class="status-content">
            <el-icon class="status-icon"><CircleCheck /></el-icon>
            <div class="status-info">
              <div class="status-title">今日卫生自检已完成</div>
              <div class="status-time">完成时间：{{ formatDateTime(todayInspection.submitTime) }}</div>
            </div>
            <el-button type="primary" @click="viewDetail(todayInspection)">查看详情</el-button>
          </div>
          <div v-else class="status-content">
            <el-icon class="status-icon warning"><Warning /></el-icon>
            <div class="status-info">
              <div class="status-title">今日尚未完成卫生自检</div>
              <div class="status-time">请尽快完成卫生自检</div>
            </div>
            <el-button type="primary" @click="startInspection">开始自检</el-button>
          </div>
        </div>

        <!-- 自检表单 -->
        <FormDialog
          v-model="inspectionDialogVisible"
          :title="`卫生自检 - ${inspectionForm.stationName || ''} - ${inspectionForm.positionName || ''}`"
          width="700px"
          :close-on-click-modal="false"
          :show-confirm="false"
          :show-cancel="false"
        >
          <el-form :model="inspectionForm" ref="formRef" label-width="140px">
            <HygieneAreaChecklist
              :areas="inspectionForm.areas"
              :upload-url="uploadUrl"
              :upload-headers="uploadHeaders"
              header-type="divider"
              :show-area-photos="true"
              :empty-description="'暂无分配的卫生责任区'"
              :requirement-prefix="'要求：'"
              :requirement-fallback="'无'"
              :pass-label="'合格'"
              :fail-label="'不合格'"
              :point-photo-label="'不合格照片（有不合格项至少 1 张，可任选点位上传）：'"
              :area-photo-label="'责任区照片（必填，至少 1 张）：'"
              @point-status-change="handlePointStatusChange"
              @point-photo-change="updatePointPhotoList"
              @area-photo-change="updateAreaPhotoList"
              @upload-error="handleUploadError"
            />

            <el-divider content-position="left">其他</el-divider>
            <el-form-item label="不合格说明">
              <el-input
                v-model="inspectionForm.unqualifiedDescription"
                type="textarea"
                :rows="3"
                placeholder="如有不合格项请详细说明"
              />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="inspectionDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="submitInspection" :loading="submitting">
              提交自检
            </el-button>
          </template>
        </FormDialog>

        <!-- 历史记录 -->
        <div class="history-section">
          <h3>历史记录</h3>
          <el-table :data="historyList" stripe border>
            <el-table-column prop="inspectionDate" label="日期" width="120">
              <template #default="{ row }">
                {{ formatDate(row.inspectionDate) }}
              </template>
            </el-table-column>
            <el-table-column label="工作性质" min-width="160">
              <template #default="{ row }">
                {{ getWorkTypeNames(row) }}
              </template>
            </el-table-column>
            <el-table-column label="积分" width="90">
              <template #default="{ row }">
                {{ getInspectionPoints(row) }}
              </template>
            </el-table-column>
            <el-table-column label="检查结果" width="100">
              <template #default="{ row }">
                <el-tag :type="getInspectionResult(row).type">
                  {{ getInspectionResult(row).text }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="submitTime" label="提交时间" width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.submitTime) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button link type="primary" @click="viewDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="pagination.page"
              v-model:page-size="pagination.pageSize"
              :total="pagination.total"
              layout="total, prev, pager, next"
              @current-change="loadHistory"
            />
          </div>
        </div>

    <!-- 详情对话框 -->
    <FormDialog
      v-model="detailVisible"
      title="卫生自检详情"
      width="600px"
      :show-confirm="false"
      :show-cancel="false"
    >
      <el-descriptions :column="1" border>
        <el-descriptions-item label="检查日期">{{ formatDate(currentRecord?.inspectionDate) }}</el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ formatDateTime(currentRecord?.submitTime) }}</el-descriptions-item>
        <el-descriptions-item label="检查结果">
          <el-tag :type="currentRecord?.hasUnqualified ? 'danger' : 'success'">
            {{ currentRecord?.hasUnqualified ? '有不合格' : '全部合格' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <div v-if="currentRecord?.inspectionItems" class="detail-items">
        <h4>检查项目</h4>
        <el-table :data="getDetailItems(currentRecord)" border>
          <el-table-column label="责任区" min-width="140">
            <template #default="{ row }">
              {{ row.workTypeName || row.areaName || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="检查项" min-width="160">
            <template #default="{ row }">
              {{ row.itemName || row.pointName || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="标准" min-width="200">
            <template #default="{ row }">
              {{ row.itemStandard || row.workRequirements || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="照片" width="120">
            <template #default="{ row }">
              <div v-if="row.photoUrls?.length" class="photo-preview">
                <el-image
                  v-for="(url, idx) in row.photoUrls"
                  :key="idx"
                  :src="url"
                  :preview-src-list="row.photoUrls ?? []"
                  fit="cover"
                  style="width: 40px; height: 40px; margin-right: 4px;"
                />
              </div>
              <span v-else>-</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <el-descriptions :column="1" border style="margin-top: 16px;">
        <el-descriptions-item label="不合格说明">
          {{ currentRecord?.unqualifiedDescription || '无' }}
        </el-descriptions-item>
      </el-descriptions>
    </FormDialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/store/modules/user';
import { useUpload } from '@/composables/useUpload';
import { ElMessage } from 'element-plus';
import { CircleCheck, Warning } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import request from '@/api/request';
import { getHygieneAreasByPosition } from '@/api/hygieneManagement';
import HygieneAreaChecklist from '@/components/inspection/HygieneAreaChecklist.vue';
import FormDialog from '@/components/system/FormDialog.vue';

const userStore = useUserStore();

const { uploadUrl, uploadHeaders } = useUpload();
const formRef = ref(null);

const currentDate = ref(dayjs().format('YYYY-MM-DD'));
const dateRange = ref([]);
const todayInspection = ref(null);
const historyList = ref([]);
const currentRecord = ref(null);
const inspectionDialogVisible = ref(false);
const detailVisible = ref(false);
const submitting = ref(false);

const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
});

const inspectionForm = ref({
  areas: [], // 责任区列表，包含卫生点
  unqualifiedDescription: ''
});

const areaPointsMap = ref({});
const areaNameMap = ref({});


const formatDate = (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-';
const formatDateTime = (date) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-';

const isRemarkItem = (item) => item?.itemId === 'remark' || item?.itemName === '不合格说明';
const isAreaPhotoItem = (item) => item?.itemType === 'area_photo' || item?.itemName === '责任区照片';
const isMetaItem = (item) => isRemarkItem(item) || isAreaPhotoItem(item);

const getItemStatusValue = (item) => {
  if (item?.status === 0 || item?.status === 1) return item.status;
  if (item?.checkStatus === 0 || item?.checkStatus === 1) return item.checkStatus;
  if (item?.result === 'fail') return 0;
  if (item?.result === 'pass') return 1;
  return null;
};

const getDetailItems = (record) => {
  const items = record?.inspectionItems || [];
  return items.filter(item => !isMetaItem(item));
};

const getInspectionResult = (record) => {
  const items = record?.inspectionItems || [];
  if (!items.length) {
    return { type: 'info', text: '未检查' };
  }
  const statuses = items
    .filter(item => !isMetaItem(item))
    .map(item => getItemStatusValue(item));
  if (!statuses.length) {
    return { type: 'info', text: '未检查' };
  }
  const unselectedCount = statuses.filter(value => value === null).length;
  const failCount = statuses.filter(value => value === 0).length;
  if (unselectedCount > 0) {
    return { type: 'info', text: '未完成' };
  }
  if (failCount === 0) {
    return { type: 'success', text: '全部合格' };
  }
  return { type: 'warning', text: `有${failCount}项异常` };
};

const getInspectionPoints = (record) => {
  const ids = record?.workTypeIds || [];
  let total = 0;
  ids.forEach(id => {
    const points = areaPointsMap.value[id];
    if (points === undefined || points === null) return;
    const value = Number(points);
    if (!Number.isNaN(value)) {
      total += value;
    }
  });
  return total;
};

const normalizeRecord = (record) => {
  const rawItems = record?.inspectionItems || record?.inspection_items || [];
  const items = Array.isArray(rawItems) ? rawItems : [];
  const normalizedItems = items.map(item => ({
    ...item,
    workTypeId: item.workTypeId ?? item.work_type_id ?? item.areaId ?? item.area_id ?? null,
    workTypeName: item.workTypeName ?? item.work_type_name ?? item.areaName ?? item.area_name ?? '',
    itemId: item.itemId ?? item.item_id ?? item.id ?? null,
    itemName: item.itemName ?? item.item_name ?? item.pointName ?? item.point_name ?? '',
    itemStandard: item.itemStandard ?? item.item_standard ?? item.workRequirements ?? item.work_requirements ?? '',
    status: item.status ?? item.checkStatus ?? item.result ?? null
  }));

  const remarkItem = normalizedItems.find(item => isRemarkItem(item));
  const workTypeIds = Array.from(new Set(normalizedItems.map(item => item.workTypeId).filter(Boolean)));
  const workTypeNames = Array.from(new Set(normalizedItems.map(item => item.workTypeName).filter(Boolean)));
  const hasUnqualified = normalizedItems.some(item => getItemStatusValue(item) === 0);

  // 统一字段名映射
  const station = record.station ? {
    id: record.station.id,
    stationName: record.station.station_name ?? record.station.stationName
  } : null;

  const filler = record.filler ? {
    id: record.filler.id,
    realName: record.filler.real_name ?? record.filler.realName,
    positionName: record.filler.positionName ??
      record.filler.position_name ??
      record.filler.dataValues?.positionName ??
      '-'
  } : null;

  return {
    ...record,
    submitTime: record.submit_time ?? record.submitTime,
    inspectionDate: record.inspection_date ?? record.inspectionDate,
    inspectionItems: normalizedItems,
    workTypeIds,
    workTypeNames,
    unqualifiedDescription: remarkItem?.remark || '',
    hasUnqualified,
    station,
    filler
  };
};

const getWorkTypeNames = (record) => {
  const names = record?.workTypeNames;
  if (Array.isArray(names) && names.length > 0) return names.join('、');
  const ids = record?.workTypeIds || [];
  if (!Array.isArray(ids) || ids.length === 0) return '-';
  const mapped = ids.map(id => areaNameMap.value[id]).filter(Boolean);
  if (mapped.length === 0) return '-';
  return mapped.join('、');
};

const loadInspection = async () => {
  try {
    const res = await request.get('/self-inspections/my', {
      params: {
        inspectionType: 'hygiene',
        startDate: currentDate.value,
        endDate: currentDate.value
      }
    });
    const list = (res || []).map(normalizeRecord);
    todayInspection.value = list[0] || null;
  } catch (e) {

  }
};

const loadHistory = async () => {
  try {
    const params = {
      inspectionType: 'hygiene',
      startDate: undefined,
      endDate: undefined
    };
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0];
      params.endDate = dateRange.value[1];
    }
    const res = await request.get('/self-inspections/my', { params });
    const normalized = (res || []).map(normalizeRecord);
    pagination.value.total = normalized.length;
    const startIndex = (pagination.value.page - 1) * pagination.value.pageSize;
    historyList.value = normalized.slice(startIndex, startIndex + pagination.value.pageSize);
  } catch (e) {

  }
};

const resolveTodaySchedule = async () => {
  const today = dayjs().format('YYYY-MM-DD');
  const year = dayjs(today).year();
  const month = dayjs(today).month() + 1;
  const scheduleRes = await request.get('/schedules', {
    params: {
      year,
      month,
      userId: userStore.userId
    }
  });
  const schedules = scheduleRes.schedules || scheduleRes.list || scheduleRes || [];
  return schedules.find(s => s.user_id === userStore.userId && s.schedules && s.schedules[today]) || null;
};

const loadAssignedAreas = async () => {
  try {
    const userSchedule = await resolveTodaySchedule();
    if (!userSchedule) return;
    const positionName = userSchedule.position_name || userSchedule.positionName;
    const stationId = userSchedule.station_id || userSchedule.stationId;
    if (!positionName || !stationId) return;
    const areas = await getHygieneAreasByPosition({
      stationId,
      positionName
    });
    const pointsMap = {};
    const nameMap = {};
    (areas || []).forEach(area => {
      pointsMap[area.id] = area.areaPoints ?? area.points ?? 0;
      nameMap[area.id] = area.areaName ?? area.area_name ?? '';
    });
    areaPointsMap.value = pointsMap;
    areaNameMap.value = nameMap;
  } catch (e) {
    
  }
};

const startInspection = async () => {
  try {
    const userSchedule = await resolveTodaySchedule();
    if (!userSchedule) {
      ElMessage.warning('您今日没有排班，无法进行卫生自检');
      return;
    }

    const positionName = userSchedule.position_name || userSchedule.positionName;
    if (!positionName) {
      ElMessage.warning('您的排班信息中没有岗位，无法进行卫生自检');
      return;
    }

    const stationId = userSchedule.station_id || userSchedule.stationId;
    const stationName = userSchedule.station?.station_name
      || userSchedule.station_name
      || userSchedule.stationName
      || '';

    

    // 根据用户岗位加载责任区和卫生点
    const areas = await getHygieneAreasByPosition({
      stationId: stationId,
      positionName: positionName
    });

    

    if (!areas || areas.length === 0) {
      ElMessage.warning(`岗位"${positionName}"暂未分配卫生责任区，请联系管理员配置`);
      return;
    }

    // 为每个卫生点添加检查状态
    const normalizedAreas = (areas || []).map(area => {
      const areaName = area.areaName ?? area.area_name ?? '';
      const points = (area.points || []).map(point => ({
        ...point,
        pointName: point.pointName ?? point.point_name ?? '',
        workRequirements: point.workRequirements ?? point.work_requirements ?? '',
        checkStatus: null,
        photoList: [],
        photoUrls: []
      }));
      return {
        ...area,
        areaName,
        photoList: [],
        photoUrls: [],
        points
      };
    });

    const pointsMap = {};
    const nameMap = {};
    normalizedAreas.forEach(area => {
      pointsMap[area.id] = area.areaPoints ?? area.points ?? 0;
      nameMap[area.id] = area.areaName ?? '';
    });
    areaPointsMap.value = pointsMap;
    areaNameMap.value = nameMap;

    inspectionForm.value = {
      stationId: stationId,
      stationName: stationName,
      positionName: positionName,
      areas: normalizedAreas,
      unqualifiedDescription: ''
    };

    inspectionDialogVisible.value = true;
  } catch (e) {
    
    
    ElMessage.error('加载排班或责任区失败: ' + (e.message || '未知错误'));
  }
};

const normalizeUploadFile = (file) => {
  const responseUrl = file?.response?.data?.url ?? file?.response?.url ?? '';
  const url = responseUrl || file?.url || '';
  return url ? { ...file, url } : file;
};

const updatePointPhotoList = (point, fileList) => {
  const normalized = (fileList ?? []).map(normalizeUploadFile);
  point.photoList = normalized;
  point.photoUrls = normalized
    .map(item => item.response?.data?.url ?? item.response?.url)
    .filter(Boolean);
};

const updateAreaPhotoList = (area, fileList) => {
  const normalized = (fileList ?? []).map(normalizeUploadFile);
  area.photoList = normalized;
  area.photoUrls = normalized
    .map(item => item.response?.data?.url ?? item.response?.url)
    .filter(Boolean);
};

const handleUploadError = () => {
  ElMessage.error('图片上传失败，请检查图片大小或网络');
};

const handlePointStatusChange = (point) => {
  if (point.checkStatus !== 0) {
    point.photoUrls = [];
    point.photoList = [];
  }
};

const submitInspection = async () => {
  // 获取所有卫生点
  const allPoints = inspectionForm.value.areas.flatMap(area => area.points);

  // 验证所有卫生点都已检查
  const hasUnchecked = allPoints.some(point => point.checkStatus === null);
  if (hasUnchecked) {
    ElMessage.warning('请对所有卫生点进行检查');
    return;
  }

  const hasUnqualified = allPoints.some(point => point.checkStatus === 0);
  const missingAreaPhotos = inspectionForm.value.areas.some(area => (area.photoUrls || []).length === 0);
  if (missingAreaPhotos) {
    ElMessage.warning('每个责任区至少上传 1 张照片');
    return;
  }
  if (hasUnqualified) {
    const unqualifiedPhotos = allPoints
      .filter(point => point.checkStatus === 0)
      .flatMap(point => point.photoUrls || []);
    if (unqualifiedPhotos.length === 0) {
      ElMessage.warning('存在不合格项，请至少上传 1 张不合格照片');
      return;
    }
  }

  submitting.value = true;
  try {

    // 构建检查项目数据
    const payloadItems = inspectionForm.value.areas.flatMap(area =>
      (area.points || []).map(point => ({
        workTypeId: area.id,
        workTypeName: area.areaName ?? area.area_name ?? '',
        itemId: point.id,
        itemName: point.pointName ?? point.point_name ?? '',
        itemStandard: point.workRequirements ?? point.work_requirements ?? '',
        status: point.checkStatus,
        remark: point.remark || '',
        photoUrls: point.photoUrls ?? []
      }))
    );

    const areaPhotoItems = inspectionForm.value.areas.flatMap(area => {
      const areaPhotoUrls = area.photoUrls ?? [];
      if (!areaPhotoUrls.length) return [];
      return [{
        workTypeId: area.id,
        workTypeName: area.areaName ?? area.area_name ?? '',
        itemId: `area_photo_${area.id}`,
        itemName: '责任区照片',
        itemStandard: '',
        status: 1,
        itemType: 'area_photo',
        remark: '',
        photoUrls: areaPhotoUrls
      }];
    });

    payloadItems.push(...areaPhotoItems);

    // 添加不合格说明
    if (inspectionForm.value.unqualifiedDescription) {
      payloadItems.push({
        itemId: 'remark',
        itemName: '不合格说明',
        status: 1,
        itemType: 'remark',
        remark: inspectionForm.value.unqualifiedDescription
      });
    }

    const photoUrls = payloadItems.flatMap(item => item.photoUrls ?? []);
    const workTypeIds = inspectionForm.value.areas.map(area => area.id);

    await request.post('/self-inspections', {
      inspectionType: 'hygiene',
      inspectionDate: currentDate.value,
      stationId: inspectionForm.value.stationId,
      workTypeIds,
      inspectionItems: payloadItems,
      photoUrls,
      hasUnqualified
    });
    ElMessage.success('提交成功');
    inspectionDialogVisible.value = false;
    loadInspection();
    loadHistory();
  } catch (e) {
    ElMessage.error('提交失败');
    
  } finally {
    submitting.value = false;
  }
};

const viewDetail = (row) => {
  currentRecord.value = row;
  detailVisible.value = true;
};

onMounted(() => {
  loadAssignedAreas();
  loadInspection();
  loadHistory();
});
</script>

<style lang="scss" scoped>
.hygiene-inspection-page {
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

  .header-controls {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
  }

  .status-card {
    background: #fff;
    border-radius: 8px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    border-left: 4px solid #E6A23C;

    &.completed {
      border-left-color: #67C23A;
    }

    .status-content {
      display: flex;
      align-items: center;
      gap: 16px;

      .status-icon {
        font-size: 48px;
        color: #67C23A;

        &.warning {
          color: #E6A23C;
        }
      }

      .status-info {
        flex: 1;

        .status-title {
          font-size: 18px;
          font-weight: bold;
          color: #303133;
        }

        .status-time {
          font-size: 14px;
          color: #909399;
          margin-top: 4px;
        }
      }
    }
  }

  .history-section {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

    h3 {
      margin: 0 0 16px;
      font-size: 16px;
      color: #303133;
    }

    .pagination-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }

  .empty-hint {
    padding: 40px 0;
  }

  .area-section {
    margin-bottom: 24px;
  }

  .point-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .area-photo {
    margin-top: 12px;

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

    .point-photo {
      margin-top: 8px;

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

  .photo-preview {
    display: flex;
    flex-wrap: wrap;
  }

  .detail-items {
    margin-top: 16px;

    h4 {
      margin: 0 0 12px;
      font-size: 14px;
      color: #303133;
    }
  }
}
</style>
