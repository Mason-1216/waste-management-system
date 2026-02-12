<template>
  <div class="hygiene-inspection-page">
    <div class="page-header">
      <h2>卫生自检</h2>
      <div class="header-actions">
        <el-button type="primary" @click="isRecordsView ? goFormView() : goRecordsView()">
          {{ isRecordsView ? '自检表单' : '查询' }}
        </el-button>
        <el-button v-if="isRecordsView && isSimpleMode" @click="simpleShowTable = !simpleShowTable">
          {{ simpleShowTable ? '切换卡片' : '切换表格' }}
        </el-button>
        <el-button v-if="isRecordsView" type="primary" :loading="exporting" @click="exportRecords">
          <el-icon><Upload /></el-icon>批量导出
        </el-button>
      </div>
    </div>

    <el-card v-if="!isRecordsView" class="inspection-form-card" v-loading="formLoading">
      <div class="inspection-form-header">
        <div class="form-title-row">
          <div class="form-subtitle">自检表单</div>
        </div>
        <div class="form-meta">
          {{ inspectionForm.stationName ?? '' }} {{ inspectionForm.positionName ?? '' }}
        </div>
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
            <div class="status-title">{{ incompleteStatusTitle }}</div>
            <div v-if="incompleteStatusTime" class="status-time">{{ incompleteStatusTime }}</div>
          </div>
        </div>
      </div>

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

      <div class="form-actions">
        <el-button @click="startInspection()">重新加载</el-button>
        <el-button type="primary" @click="submitInspection" :loading="submitting">
          提交自检
        </el-button>
      </div>
    </el-card>

    <template v-if="isRecordsView">
      <SimpleFilterBar
        :enabled="isSimpleMode"
        v-model:expanded="simpleFilterExpanded"
        :summary-text="simpleFilterSummary"
      >
      <el-card class="filter-card">
        <FilterBar>
        <div class="filter-item">
          <span class="filter-label">开始日期</span>
          <el-date-picker
            v-model="startDate"
            type="date"
            placeholder="全部"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="handleSearch"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">结束日期</span>
          <el-date-picker
            v-model="endDate"
            type="date"
            placeholder="全部"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="handleSearch"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">日期排序</span>
          <FilterSelect
            v-model="historyFilters.sortOrder"
            placeholder="升序"
            filterable
            style="width: 120px"
            @change="handleSearch"
          >
            <el-option
              v-for="opt in sortOrderOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </FilterSelect>
        </div>
        <div class="filter-item">
          <span class="filter-label">责任区</span>
          <FilterSelect
            v-model="historyFilters.areaName"
            placeholder="全部"
            clearable
            filterable
            @change="handleSearch"
            @clear="handleSearch"
          >
            <el-option label="全部" value="all" />
            <el-option
              v-for="option in areaOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </FilterSelect>
        </div>
        <div class="filter-item">
          <span class="filter-label">检查结果</span>
          <FilterSelect
            v-model="historyFilters.result"
            placeholder="全部"
            clearable
            filterable
            @change="handleSearch"
            @clear="handleSearch"
          >
            <el-option label="全部" value="all" />
            <el-option
              v-for="opt in historyResultOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </FilterSelect>
        </div>
        </FilterBar>
      </el-card>
      </SimpleFilterBar>

        <div class="history-section">
          <h3>记录列表</h3>
          <el-table v-if="!isSimpleMode || simpleShowTable" :data="historyList" stripe border>
            <el-table-column prop="inspectionDate" label="日期" width="120">
              <template #default="{ row }">
                {{ formatDate(row.inspectionDate) }}
              </template>
            </el-table-column>
            <el-table-column label="责任区" min-width="160">
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
          <div v-else class="simple-card-list">
            <el-empty v-if="historyList.length === 0" description="暂无记录" />
            <el-card v-for="row in historyList" :key="row.id || `${row.inspectionDate}-${row.submitTime}`" class="simple-record-card">
              <template #header>
                <div class="card-header">
                  <span class="card-title">{{ formatDate(row.inspectionDate) }}</span>
                  <el-tag :type="getInspectionResult(row).type">{{ getInspectionResult(row).text }}</el-tag>
                </div>
              </template>
              <div class="card-body">
                <div class="card-line">
                  <span>责任区：{{ getWorkTypeNames(row) }}</span>
                </div>
                <div class="card-line">
                  <span>积分：{{ getInspectionPoints(row) }}</span>
                  <span>提交时间：{{ formatDateTime(row.submitTime) }}</span>
                </div>
                <div class="card-actions">
                  <el-button link type="primary" @click="viewDetail(row)">详情</el-button>
                </div>
              </div>
            </el-card>
          </div>
        </div>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[5, 10, 20, 50]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next"
            @current-change="handlePageChange"
            @size-change="handlePageSizeChange"
          />
        </div>
    </template>

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
import { ref, onMounted, computed, watch } from 'vue';
import { useUserStore } from '@/store/modules/user';
import { useUiModeStore } from '@/store/modules/uiMode';
import { useUpload } from '@/composables/useUpload';
import { ElMessage } from 'element-plus';
import { CircleCheck, Warning } from '@element-plus/icons-vue';
import { useRoute, useRouter } from 'vue-router';
import dayjs from 'dayjs';
import request from '@/api/request';
import { getHygieneAreasByPosition } from '@/api/hygieneManagement';
import HygieneAreaChecklist from '@/modules/inspection/components/HygieneAreaChecklist.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import SimpleFilterBar from '@/components/common/SimpleFilterBar.vue';
import FormDialog from '@/components/system/FormDialog.vue';
import { buildExportFileName, exportRowsToXlsx } from '@/utils/tableExport';

const userStore = useUserStore();
const uiModeStore = useUiModeStore();
const route = useRoute();
const router = useRouter();

const isRecordsView = computed(() => route.query.view === 'records');
const goRecordsView = () => router.push({ query: { ...route.query, view: 'records' } });
const goFormView = () => {
  const query = { ...route.query };
  delete query.view;
  router.push({ query });
};

const { uploadUrl, uploadHeaders, resolveUploadUrl } = useUpload();
const formRef = ref(null);
const canUseSimpleMode = computed(() => userStore.roleCode === 'dev_test' || userStore.baseRoleCode === 'dev_test');
const isSimpleMode = computed(() => canUseSimpleMode.value && uiModeStore.isSimpleMode);
const simpleShowTable = ref(false);
const simpleFilterExpanded = ref(false);

const currentDate = ref(dayjs().format('YYYY-MM-DD'));
const today = dayjs().format('YYYY-MM-DD');
const startDate = ref(dayjs().subtract(5, 'day').format('YYYY-MM-DD'));
const endDate = ref(today);
const todayInspection = ref(null);
const historySource = ref([]);
const historyList = ref([]);
const currentRecord = ref(null);
const detailVisible = ref(false);
const submitting = ref(false);
const exporting = ref(false);
const formHint = ref('');
const incompleteStatusTitle = computed(() => {
  if (formHint.value) return formHint.value;
  return '今日尚未完成卫生自检';
});
const incompleteStatusTime = computed(() => {
  if (formHint.value) return '';
  return '请尽快完成卫生自检';
});
const formLoading = ref(false);

const defaultHistoryFilters = {
  areaName: 'all',
  result: 'all',
  sortOrder: 'asc'
};
const historyFilters = ref({ ...defaultHistoryFilters });
const historyResultOptions = [
  { label: '全部合格', value: 'pass' },
  { label: '有异常', value: 'fail' },
  { label: '未完成', value: 'incomplete' }
];
const sortOrderOptions = [
  { label: '升序', value: 'asc' },
  { label: '降序', value: 'desc' }
];

const simpleFilterSummary = computed(() => {
  const parts = [];
  if (startDate.value || endDate.value) {
    const start = startDate.value || '不限';
    const end = endDate.value || '不限';
    parts.push(`日期=${start}~${end}`);
  }
  if (historyFilters.value.sortOrder) {
    const sortLabel = sortOrderOptions.find(item => item.value === historyFilters.value.sortOrder)?.label;
    if (sortLabel) parts.push(`排序=${sortLabel}`);
  }
  if (historyFilters.value.areaName && historyFilters.value.areaName !== 'all') {
    parts.push(`责任区=${historyFilters.value.areaName}`);
  }
  if (historyFilters.value.result && historyFilters.value.result !== 'all') {
    const resultLabel = historyResultOptions.find(item => item.value === historyFilters.value.result)?.label;
    if (resultLabel) parts.push(`检查结果=${resultLabel}`);
  }
  return parts.length > 0 ? parts.join(' | ') : '当前筛选：全部';
});

const pagination = ref({
  page: 1,
  pageSize: 5,
  total: 0
});

const inspectionForm = ref({
  areas: [], // 责任区列表，包含卫生点
  unqualifiedDescription: ''
});

const areaPointsMap = ref({});
const areaNameMap = ref({});

const normalizeAreaName = (value) => {
  const name = typeof value === 'string' ? value.trim() : '';
  if (!name || name === '未分类责任区') return '未配置责任区';
  return name;
};

const areaOptions = computed(() => {
  const names = new Set();
  const mapValues = Object.values(areaNameMap.value ?? {});
  mapValues.forEach(name => {
    const normalized = normalizeAreaName(name);
    if (normalized) names.add(normalized);
  });
  (historySource.value ?? []).forEach(record => {
    const list = record.workTypeNames ?? [];
    list.forEach(name => {
      const normalized = normalizeAreaName(name);
      if (normalized) names.add(normalized);
    });
  });
  return Array.from(names).map(name => ({ label: name, value: name }));
});


const formatDate = (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-';
const formatDateTime = (date) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-';

const isRemarkItem = (item) => item?.itemId === 'remark' || item?.itemName === '不合格说明';
const isAreaPhotoItem = (item) => item?.itemType === 'area_photo' || item?.itemName === '责任区照片';
const isMetaItem = (item) => isRemarkItem(item) || isAreaPhotoItem(item);
const normalizePhotoUrls = (value) => {
  if (Array.isArray(value)) return value.map(item => resolveUploadUrl(item)).filter(Boolean);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.map(item => resolveUploadUrl(item)).filter(Boolean)
        : [];
    } catch (error) {
      return [];
    }
  }
  return [];
};

const getItemStatusValue = (item) => {
  if (item?.status === 0 || item?.status === 1) return item.status;
  if (item?.checkStatus === 0 || item?.checkStatus === 1) return item.checkStatus;
  if (item?.result === 'fail') return 0;
  if (item?.result === 'pass') return 1;
  return null;
};

const getDetailItems = (record) => {
  const items = record?.inspectionItems ?? [];
  return items.filter(item => !isRemarkItem(item));
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

const getInspectionResultKey = (record) => {
  const items = record?.inspectionItems || [];
  if (!items.length) {
    return 'incomplete';
  }
  const statuses = items
    .filter(item => !isMetaItem(item))
    .map(item => getItemStatusValue(item));
  if (!statuses.length) {
    return 'incomplete';
  }
  const unselectedCount = statuses.filter(value => value === null).length;
  const failCount = statuses.filter(value => value === 0).length;
  if (unselectedCount > 0) return 'incomplete';
  if (failCount > 0) return 'fail';
  return 'pass';
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
    workTypeName: normalizeAreaName(item.workTypeName ?? item.work_type_name ?? item.areaName ?? item.area_name ?? ''),
    itemId: item.itemId ?? item.item_id ?? item.id ?? null,
    itemName: item.itemName ?? item.item_name ?? item.pointName ?? item.point_name ?? '',
    itemStandard: item.itemStandard ?? item.item_standard ?? item.workRequirements ?? item.work_requirements ?? '',
    status: item.status ?? item.checkStatus ?? item.result ?? null,
    photoUrls: normalizePhotoUrls(item.photoUrls ?? item.photo_urls)
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
  if (Array.isArray(names) && names.length > 0) {
    const normalized = names.map(normalizeAreaName).filter(Boolean);
    if (normalized.length > 0) return normalized.join('、');
  }
  const ids = record?.workTypeIds ?? [];
  if (!Array.isArray(ids) || ids.length === 0) return '-';
  const mapped = ids.map(id => normalizeAreaName(areaNameMap.value[id])).filter(Boolean);
  if (mapped.length === 0) return '-';
  return mapped.join('、');
};

const filterHistoryList = (list) => {
  const areaName = historyFilters.value.areaName;
  const result = historyFilters.value.result;
  return (list ?? []).filter(record => {
    if (areaName && areaName !== 'all') {
      let names = (record.workTypeNames ?? [])
        .map(name => normalizeAreaName(name))
        .filter(Boolean);
      if (!names.length) {
        const ids = record.workTypeIds ?? [];
        if (Array.isArray(ids) && ids.length > 0) {
          names = ids
            .map(id => normalizeAreaName(areaNameMap.value[id]))
            .filter(Boolean);
        }
      }
      if (!names.includes(areaName)) return false;
    }
    if (result && result !== 'all') {
      const key = getInspectionResultKey(record);
      if (key !== result) return false;
    }
    return true;
  });
};

const getHistoryDateValue = (record) => {
  const dateValue = record?.inspectionDate || record?.inspection_date;
  return dateValue ? dayjs(dateValue).valueOf() : 0;
};

const getHistoryTimeValue = (record) => {
  const timeValue = record?.submitTime || record?.submit_time || record?.created_at || record?.createdAt || record?.inspectionDate || record?.inspection_date;
  return timeValue ? dayjs(timeValue).valueOf() : 0;
};

const sortHistoryList = (list) => {
  const direction = historyFilters.value.sortOrder === 'desc' ? -1 : 1;
  return (list ?? []).slice().sort((a, b) => {
    const dateDiff = getHistoryDateValue(a) - getHistoryDateValue(b);
    if (dateDiff !== 0) return dateDiff * direction;
    return (getHistoryTimeValue(a) - getHistoryTimeValue(b)) * direction;
  });
};

const applyHistoryFilters = (source = historySource.value) => {
  const filtered = sortHistoryList(filterHistoryList(source));
  pagination.value.total = filtered.length;
  const startIndex = (pagination.value.page - 1) * pagination.value.pageSize;
  historyList.value = filtered.slice(startIndex, startIndex + pagination.value.pageSize);
};

const handleSearch = () => {
  pagination.value.page = 1;
  loadHistory();
};

const resetFilters = () => {
  startDate.value = dayjs().subtract(5, 'day').format('YYYY-MM-DD');
  endDate.value = today;
  historyFilters.value = { ...defaultHistoryFilters };
  pagination.value.page = 1;
  loadHistory();
};

const handlePageChange = () => {
  applyHistoryFilters();
};

const handlePageSizeChange = () => {
  pagination.value.page = 1;
  applyHistoryFilters();
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
      inspectionType: 'hygiene'
    };
    if (startDate.value) {
      params.startDate = startDate.value;
    }
    if (endDate.value) {
      params.endDate = endDate.value;
    }
    if (historyFilters.value.sortOrder) {
      params.sortOrder = historyFilters.value.sortOrder;
    }
    const res = await request.get('/self-inspections/my', { params });
    const normalized = (res || []).map(normalizeRecord);
    historySource.value = normalized;
    applyHistoryFilters(normalized);
  } catch (e) {

  }
};

const exportRecords = async () => {
  exporting.value = true;
  try {
    const source = Array.isArray(historySource.value) ? historySource.value : [];
    const rows = sortHistoryList(filterHistoryList(source));

    const columns = [
      { label: '日期', value: row => formatDate(row.inspectionDate) },
      { label: '责任区', value: row => getWorkTypeNames(row) },
      { label: '积分', value: row => getInspectionPoints(row) },
      { label: '检查结果', value: row => getInspectionResult(row).text },
      { label: '提交时间', value: row => formatDateTime(row.submitTime) }
    ];

    const pageTitle = typeof route?.meta?.title === 'string' ? route.meta.title : '卫生自检';
    const fileName = buildExportFileName({ title: pageTitle });
    await exportRowsToXlsx({ title: pageTitle, fileName, sheetName: '记录列表', columns, rows });
  } catch (error) {
    const message = typeof error?.message === 'string' && error.message.trim() ? error.message : '导出失败';
    ElMessage.error(message);
  } finally {
    exporting.value = false;
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
      nameMap[area.id] = normalizeAreaName(area.areaName ?? area.area_name ?? '');
    });
    areaPointsMap.value = pointsMap;
    areaNameMap.value = nameMap;
  } catch (e) {
    
  }
};

const startInspection = async (options = {}) => {
  const silent = options.silent === true;
  formHint.value = '';
  formLoading.value = true;
  try {
    const userSchedule = await resolveTodaySchedule();
    if (!userSchedule) {
      formHint.value = '您今日没有排班，无法进行卫生自检';
      if (!silent) {
        ElMessage.warning(formHint.value);
      }
      inspectionForm.value = { areas: [], unqualifiedDescription: '' };
      return;
    }

    const positionName = userSchedule.position_name || userSchedule.positionName;
    if (!positionName) {
      formHint.value = '您的排班信息中没有岗位，无法进行卫生自检';
      if (!silent) {
        ElMessage.warning(formHint.value);
      }
      inspectionForm.value = { areas: [], unqualifiedDescription: '' };
      return;
    }

    const stationId = userSchedule.station_id || userSchedule.stationId;
    const stationName = userSchedule.station?.station_name
      ?? userSchedule.station_name
      ?? userSchedule.stationName
      ?? '';

    

    // 根据用户岗位加载责任区和卫生点
    const areas = await getHygieneAreasByPosition({
      stationId: stationId,
      positionName: positionName
    });

    

    if (!areas || areas.length === 0) {
      formHint.value = `岗位"${positionName}"暂未分配卫生责任区，请联系管理员配置`;
      if (!silent) {
        ElMessage.warning(formHint.value);
      }
      inspectionForm.value = {
        stationId,
        stationName,
        positionName,
        areas: [],
        unqualifiedDescription: ''
      };
      return;
    }

    // 为每个卫生点添加检查状态
    const normalizedAreas = (areas || []).map(area => {
      const areaName = normalizeAreaName(area.areaName ?? area.area_name ?? '');
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

  } catch (e) {
    ElMessage.error(`加载排班或责任区失败: ${e.message ?? '未知错误'}`);
  } finally {
    formLoading.value = false;
  }
};

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
    await loadInspection();
    await loadHistory();
    await startInspection({ silent: true });
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
  if (isRecordsView.value) {
    loadHistory();
  }
  startInspection({ silent: true });
});

watch(isRecordsView, (value) => {
  if (!value) return;
  loadHistory();
});

watch(isSimpleMode, (enabled) => {
  if (enabled) return;
  simpleShowTable.value = false;
  simpleFilterExpanded.value = false;
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

    .page-title-link {
      cursor: pointer;
      color: var(--el-color-primary);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
  }

  .filter-card {
    margin-bottom: 20px;
  }

  .simple-card-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .simple-record-card {
    border-left: 4px solid #409eff;

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }

    .card-body {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .card-line {
      display: flex;
      gap: 12px;
      justify-content: space-between;
      flex-wrap: wrap;
      color: #606266;
      font-size: 14px;
    }

    .card-actions {
      display: flex;
      justify-content: flex-end;
    }
  }

  .inspection-form-card {
    margin-bottom: 20px;

    .inspection-form-header {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 16px;
    }

    .form-title-row {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      width: 100%;
      gap: 12px;
    }

    .form-title {
      font-size: 16px;
      font-weight: 500;
      color: #303133;
    }

    .form-subtitle {
      font-size: 14px;
      color: #606266;
    }

    .form-meta {
      font-size: 12px;
      color: #909399;
    }

    .form-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 16px;
    }

    .form-hint {
      margin-bottom: 16px;
    }

    .status-card {
      margin-bottom: 16px;
      box-shadow: none;
    }
  }

  .filter-bar {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .status-card {
    background: #fff;
    border-radius: 8px;
    padding: 24px;
    margin-bottom: 24px;
    border: 1px solid #e4e7ed;

    &.completed {
      border-color: #67c23a;
      background: linear-gradient(135deg, #f0f9eb 0%, #fff 100%);

      .status-icon {
        color: #67c23a;
      }
    }

    .status-content {
      display: flex;
      align-items: center;
      gap: 16px;

      .status-icon {
        font-size: 48px;
        color: #e6a23c;

        &.warning {
          color: #e6a23c;
        }
      }

      .status-info {
        flex: 1;

        .status-title {
          font-size: 18px;
          font-weight: 500;
          color: #303133;
          margin-bottom: 4px;
        }

        .status-time {
          font-size: 14px;
          color: #909399;
        }

        .status-lines {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 6px;
        }

        .status-line {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-label {
          min-width: 56px;
          color: #606266;
          font-size: 14px;
        }
      }
    }
  }

  .history-section {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    border: 1px solid #e4e7ed;

    h3 {
      margin: 0 0 16px 0;
      font-size: 16px;
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
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


