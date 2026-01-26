<template>
  <div class="hygiene-inspection-page">
    <div class="page-header">
      <h2>卫生自检</h2>
    </div>

    <el-tabs v-model="activeTab" class="inspection-tabs">
      <!-- 我的卫生自检 -->
      <el-tab-pane label="我的卫生自检" name="my">
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
            <el-table-column label="检查结果" width="100">
              <template #default="{ row }">
                <el-tag :type="row.hasUnqualified ? 'danger' : 'success'">
                  {{ row.hasUnqualified ? '有不合格' : '全部合格' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="unqualifiedDescription" label="不合格说明" show-overflow-tooltip />
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
      </el-tab-pane>

      <!-- 人员卫生自检 -->
      <el-tab-pane label="人员卫生自检" name="staff" v-if="canViewStaff">
        <FilterBar>
          <el-date-picker
            v-model="staffFilters.dateRange"
            type="daterange"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
          <el-select
            v-model="staffFilters.stationId"
            placeholder="场站"
            clearable
            filterable
            style="width: 180px"
            v-if="showStationFilter"
          >
            <el-option
              v-for="station in stationList"
              :key="station.id"
              :label="station.stationName"
              :value="station.id"
            />
          </el-select>
          <el-select
            v-model="staffFilters.positionName"
            placeholder="岗位"
            clearable
            filterable
            style="width: 150px"
            @change="handlePositionChange"
          >
            <el-option
              v-for="position in positionList"
              :key="position"
              :label="position"
              :value="position"
            />
          </el-select>
          <el-select
            v-model="staffFilters.fillerName"
            placeholder="姓名"
            clearable
            filterable
            allow-create
            default-first-option
            style="width: 150px"
          >
            <el-option
              v-for="user in staffUserList"
              :key="user.id"
              :label="user.realName"
              :value="user.realName"
            />
          </el-select>
          <el-select
            v-model="staffFilters.hasUnqualified"
            placeholder="自检情况"
            clearable
            style="width: 150px"
          >
            <el-option label="全部合格" :value="0" />
            <el-option label="有不合格" :value="1" />
            <el-option label="未填写" :value="2" />
          </el-select>
          <el-button @click="resetStaffFilters">重置</el-button>
        </FilterBar>

        <el-table :data="staffInspectionList" stripe border>
          <el-table-column prop="inspectionDate" label="日期" width="120">
            <template #default="{ row }">
              {{ formatDate(row.inspectionDate) }}
            </template>
          </el-table-column>
          <el-table-column prop="station.stationName" label="场站" width="150" />
          <el-table-column prop="filler.positionName" label="岗位" width="120" />
          <el-table-column prop="filler.realName" label="姓名" width="100" />
          <el-table-column label="自检情况" width="120">
            <template #default="{ row }">
              <el-tag :type="row.hasUnqualified ? 'danger' : 'success'">
                {{ row.hasUnqualified ? '有不合格' : '全部合格' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="unqualifiedDescription" label="异常说明" show-overflow-tooltip />
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
            v-model:current-page="staffPagination.page"
            v-model:page-size="staffPagination.pageSize"
            :total="staffPagination.total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @current-change="loadStaffInspections"
            @size-change="loadStaffInspections"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

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
        <el-table :data="currentRecord.inspectionItems.filter(i => i.itemId !== 'remark')" border>
          <el-table-column label="责任区" min-width="140">
            <template #default="{ row }">
              {{ row.areaName || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="卫生点" min-width="140">
            <template #default="{ row }">
              {{ row.pointName || row.itemName || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="工作要求及标准" min-width="200">
            <template #default="{ row }">
              {{ row.workRequirements || '-' }}
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
import { ref, computed, onMounted, watch } from 'vue';
import { useUserStore } from '@/store/modules/user';
import { useUpload } from '@/composables/useUpload';
import { ElMessage } from 'element-plus';
import { Plus, CircleCheck, Warning } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import request from '@/api/request';
import { getHygieneAreasByPosition } from '@/api/hygieneManagement';
import { getPositionNames } from '@/api/positionJob';
import HygieneAreaChecklist from '@/components/inspection/HygieneAreaChecklist.vue';
import FormDialog from '@/components/system/FormDialog.vue';

const userStore = useUserStore();

const { uploadUrl, uploadHeaders } = useUpload();
const formRef = ref(null);

const activeTab = ref('my');
const currentDate = ref(dayjs().format('YYYY-MM-DD'));
const dateRange = ref([]);
const todayInspection = ref(null);
const historyList = ref([]);
const staffInspectionList = ref([]);
const currentRecord = ref(null);
const inspectionDialogVisible = ref(false);
const detailVisible = ref(false);
const submitting = ref(false);

const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
});

const staffPagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
});

const staffFilters = ref({
  dateRange: [],
  stationId: null,
  positionName: '',
  fillerName: '',
  hasUnqualified: null
});

const resetStaffFilters = () => {
  staffFilters.value = {
    dateRange: [],
    stationId: null,
    positionName: '',
    fillerName: '',
    hasUnqualified: null
  };
};

const stationList = ref([]);
const positionList = ref([]);
const staffUserList = ref([]);

const inspectionForm = ref({
  areas: [], // 责任区列表，包含卫生点
  unqualifiedDescription: ''
});

const canViewStaff = computed(() => {
  return ['station_manager', 'department_manager', 'deputy_manager', 'admin', 'safety_inspector'].includes(userStore.roleCode);
});

// 是否显示场站筛选器（非站长，或站长绑定多个场站时显示）
const showStationFilter = computed(() => {
  if (userStore.roleCode !== 'station_manager') {
    return true;
  }
  // 站长绑定多个场站时也显示
  return (userStore.stations?.length || 0) > 1;
});


const formatDate = (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-';
const formatDateTime = (date) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-';

const normalizeRecord = (record) => {
  const rawItems = record?.inspectionItems || record?.inspection_items || [];
  const items = Array.isArray(rawItems) ? rawItems : [];
  const remarkItem = items.find(i => i.itemId === 'remark' || i.itemName === '不合格说明');
  const hasUnqualified = items.some(i => i.status === 0);

  // 统一字段名映射
  const station = record.station ? {
    id: record.station.id,
    stationName: record.station.station_name || record.station.stationName
  } : null;

  const filler = record.filler ? {
    id: record.filler.id,
    realName: record.filler.real_name || record.filler.realName,
    positionName: record.filler.positionName || record.filler.position_name ||
                  record.filler.dataValues?.positionName || '-'
  } : null;

  return {
    ...record,
    submitTime: record.submit_time || record.submitTime,
    inspectionDate: record.inspection_date || record.inspectionDate,
    inspectionItems: items,
    unqualifiedDescription: remarkItem?.remark || '',
    hasUnqualified,
    station,
    filler
  };
};

const loadInspection = async () => {
  try {
    const res = await request.get('/self-inspections', {
      params: {
        page: 1,
        pageSize: 1,
        inspectionType: 'hygiene',
        fillerId: userStore.userId,
        stationId: userStore.currentStationId || undefined,
        startDate: currentDate.value,
        endDate: currentDate.value
      }
    });
    const list = (res.list || []).map(normalizeRecord);
    todayInspection.value = list[0] || null;
  } catch (e) {
    
  }
};

const loadHistory = async () => {
  try {
    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      inspectionType: 'hygiene',
      fillerId: userStore.userId
    };
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0];
      params.endDate = dateRange.value[1];
    }
    const res = await request.get('/self-inspections', { params });
    historyList.value = (res.list || []).map(normalizeRecord);
    pagination.value.total = res.total || 0;
  } catch (e) {
    
  }
};

const loadStaffInspections = async () => {
  if (!canViewStaff.value) return;

  try {
    const params = {
      page: staffPagination.value.page,
      pageSize: staffPagination.value.pageSize,
      inspectionType: 'hygiene'
    };

    // 日期范围
    if (staffFilters.value.dateRange && staffFilters.value.dateRange.length === 2) {
      params.startDate = staffFilters.value.dateRange[0];
      params.endDate = staffFilters.value.dateRange[1];
    }

    // 场站筛选
    if (staffFilters.value.stationId) {
      // 用户选择了场站
      params.stationId = staffFilters.value.stationId;
    } else if (userStore.roleCode === 'station_manager' && userStore.currentStationId) {
      // 站长默认使用当前场站
      params.stationId = userStore.currentStationId;
    }

    // 岗位筛选
    if (staffFilters.value.positionName) {
      params.positionName = staffFilters.value.positionName;
    }

    // 姓名筛选
    if (staffFilters.value.fillerName) {
      params.fillerName = staffFilters.value.fillerName;
    }

    // 自检情况筛选
    if (staffFilters.value.hasUnqualified !== null && staffFilters.value.hasUnqualified !== '') {
      params.hasUnqualified = staffFilters.value.hasUnqualified;
    }

    const res = await request.get('/self-inspections', { params });
    staffInspectionList.value = (res.list || []).map(normalizeRecord);
    staffPagination.value.total = res.total || 0;
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
    let itemIndex = 1;
    const payloadItems = inspectionForm.value.areas.flatMap(area =>
      (area.points || []).map(point => ({
        itemId: itemIndex++,
        areaName: area.areaName ?? area.area_name ?? '',
        pointName: point.pointName ?? point.point_name ?? '',
        workRequirements: point.workRequirements ?? point.work_requirements ?? '',
        status: point.checkStatus,
        itemName: point.pointName ?? point.point_name ?? '',
        remark: '',
        photoUrls: point.photoUrls ?? []
      }))
    );

    const areaPhotoItems = inspectionForm.value.areas.flatMap(area => {
      const areaPhotoUrls = area.photoUrls ?? [];
      if (!areaPhotoUrls.length) return [];
      return [{
        itemId: itemIndex++,
        areaName: area.areaName ?? area.area_name ?? '',
        pointName: '责任区照片',
        workRequirements: '',
        status: 1,
        itemName: '责任区照片',
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
        remark: inspectionForm.value.unqualifiedDescription
      });
    }

    const photoUrls = payloadItems.flatMap(item => item.photoUrls ?? []);

    await request.post('/self-inspections', {
      inspectionType: 'hygiene',
      inspectionDate: currentDate.value,
      stationId: inspectionForm.value.stationId,
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

// 加载场站列表
const loadStations = async () => {
  try {
    const res = await request.get('/stations', {
      params: { pageSize: 200 }
    });
    const list = res.list || res || [];
    stationList.value = list.map(station => ({
      ...station,
      stationName: station.stationName || station.station_name
    }));
  } catch (e) {
    
  }
};

// 加载岗位列表
const loadPositions = async () => {
  try {
    const res = await getPositionNames();
    const positions = res || [];
    // 添加"站长"到岗位列表
    const allPositions = new Set(['站长', ...positions]);
    positionList.value = Array.from(allPositions).sort();
  } catch (e) {
    
    positionList.value = ['站长', '操作岗']; // 失败时使用默认值
  }
};

// 加载今日排班人员
const loadStaffUsers = async (positionName) => {
  if (!positionName) {
    staffUserList.value = [];
    return;
  }

  try {
    // 获取今日排班人员
    const schedules = [];
    const stationsToQuery = userStore.roleCode === 'station_manager'
      ? [{ id: userStore.currentStationId }]
      : stationList.value;

    for (const station of stationsToQuery) {
      try {
        const res = await request.get('/schedules/today', {
          params: { stationId: station.id }
        });
        const todaySchedules = (res || []).filter(s => s.positionName === positionName);
        schedules.push(...todaySchedules);
      } catch (e) {
        
      }
    }

    // 去重并提取用户信息
    const userMap = new Map();
    schedules.forEach(schedule => {
      if (schedule.userId && schedule.realName) {
        userMap.set(schedule.userId, {
          id: schedule.userId,
          realName: schedule.realName
        });
      }
    });

    staffUserList.value = Array.from(userMap.values());
  } catch (e) {
    
    staffUserList.value = [];
  }
};

// 岗位改变时加载对应人员
const handlePositionChange = (positionName) => {
  staffFilters.value.fillerName = ''; // 清空姓名选择
  loadStaffUsers(positionName);
};

const viewDetail = (row) => {
  currentRecord.value = row;
  detailVisible.value = true;
};

onMounted(() => {
  loadInspection();
  loadHistory();
  if (canViewStaff.value) {
    loadStations();
    loadPositions();
    // 站长默认选中当前场站
    if (userStore.roleCode === 'station_manager' && userStore.currentStationId) {
      staffFilters.value.stationId = userStore.currentStationId;
    }
    loadStaffInspections();
  }
});

watch(
  () => staffFilters.value,
  () => {
    staffPagination.value.page = 1;
    loadStaffInspections();
  },
  { deep: true }
);
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

  .inspection-tabs {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }

  .header-controls {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
  }

  .filter-bar {
    display: flex;
    gap: 12px;
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
