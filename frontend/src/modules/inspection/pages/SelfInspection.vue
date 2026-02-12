<template>
  <div class="safety-inspection-page">
    <div class="page-header">
      <h2>安全自检</h2>
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

    <el-card v-if="!isRecordsView" class="inspection-form-card">
      <div class="inspection-form-header">
        <div class="form-title-row">
          <div class="form-subtitle">自检表单</div>
        </div>
      </div>

      <!-- 状态提示 -->
      <div class="status-card" :class="{ completed: hasCompletedBasicWork }">
        <div class="status-content">
          <el-icon class="status-icon" :class="{ warning: !hasCompletedBasicWork }">
            <CircleCheck v-if="hasCompletedBasicWork" />
            <Warning v-else />
          </el-icon>
          <div class="status-info">
            <div class="status-title">{{ statusTitle }}</div>
            <div v-if="!statusHint" class="status-lines">
              <div class="status-line">
                <span class="status-label">基本工作</span>
                <el-tag size="small" :type="hasCompletedBasicWork ? 'success' : 'warning'">
                  {{ hasCompletedBasicWork ? '已完成' : '未完成' }}
                </el-tag>
              </div>
              <div class="status-line" v-if="operationCompleted">
                <span class="status-label">操作</span>
                <el-tag size="small" :type="operationWorkStatus.type">
                  {{ operationWorkStatus.text }}
                </el-tag>
              </div>
              <div
                v-for="wt in extraCompletedWorkTypes"
                :key="wt.id"
                class="status-line"
              >
                <span class="status-label">{{ wt.work_type_name }}</span>
                <el-tag size="small" type="success">已完成</el-tag>
              </div>
            </div>
            <div v-if="statusTime" class="status-time">{{ statusTime }}</div>
          </div>
        </div>
      </div>

      <el-form :model="inspectionForm" label-width="100px">
        <!-- 工作性质选择 -->
        <el-form-item label="工作性质">
          <el-checkbox-group v-model="inspectionForm.selectedWorkTypes" @change="handleWorkTypesChange">
            <el-checkbox
              v-for="wt in workTypes"
              :key="wt.id"
              :label="wt.id"
              :disabled="isWorkTypeDisabled(wt)"
            >
              {{ wt.work_type_name }}
              <el-tag v-if="wt.is_default === 1" size="small" type="info" style="margin-left: 5px;">默认</el-tag>
              <el-tag v-if="completedWorkTypeIds.has(wt.id)" size="small" type="success" style="margin-left: 5px;">已完成</el-tag>
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <!-- 检查项目 -->
        <div v-if="groupedCheckItems.length > 0">
          <SafetyCheckItemList
            :groups="groupedCheckItems"
            :upload-url="uploadUrl"
            :upload-headers="uploadHeaders"
            status-field="checkStatus"
            :pass-value="1"
            :fail-value="0"
            :pass-label="'是'"
            :fail-label="'否'"
            :parent-label="'父项'"
            :child-label="'子项'"
            :standard-label="'标准：'"
            :photo-label="'异常可上传照片（选填）：'"
            :show-remark="true"
            remark-field="unqualifiedRemark"
            :remark-placeholder="'异常备注说明（选填）'"
            remark-position="after"
            :is-child-visible="isChildVisible"
            @status-change="handleCheckStatusChange"
            @photo-change="updateItemPhotoList"
            @upload-error="handleUploadError"
          />
        </div>
        <el-empty v-else description="请先选择工作性质" />

        <el-divider content-position="left">备注</el-divider>
        <el-form-item label="备注说明">
          <el-input
            v-model="inspectionForm.remark"
            type="textarea"
            :rows="3"
            placeholder="如有未勾选项，请说明原因"
          />
        </el-form-item>
      </el-form>

      <div class="form-actions">
        <el-button @click="startInspection">重置</el-button>
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
          <span class="filter-label">工作性质</span>
          <FilterSelect
            v-model="historyFilters.workTypeId"
            placeholder="全部"
            clearable
            filterable
            @change="handleSearch"
            @clear="handleSearch"
          >
            <el-option label="全部" value="all" />
            <el-option
              v-for="wt in workTypes"
              :key="wt.id"
              :label="wt.work_type_name"
              :value="String(wt.id)"
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
        <el-table v-if="!isSimpleMode || simpleShowTable" :data="historyList" stripe border v-loading="loadingHistory">
          <el-table-column prop="inspection_date" label="日期" width="120" />
          <el-table-column label="工作性质" min-width="150">
            <template #default="{ row }">
              {{ getWorkTypeNames(row.work_type_ids) }}
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
          <el-table-column prop="submit_time" label="提交时间" width="160">
            <template #default="{ row }">
              {{ formatDateTime(row.submit_time) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button link type="primary" @click="viewDetail(row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div v-else class="simple-card-list" v-loading="loadingHistory">
          <el-empty v-if="historyList.length === 0" description="暂无记录" />
          <el-card v-for="row in historyList" :key="row.id || `${row.inspection_date}-${row.submit_time}`" class="simple-record-card">
            <template #header>
              <div class="card-header">
                <span class="card-title">{{ row.inspection_date || '-' }}</span>
                <el-tag :type="getInspectionResult(row).type">{{ getInspectionResult(row).text }}</el-tag>
              </div>
            </template>
            <div class="card-body">
              <div class="card-line">
                <span>工作性质：{{ getWorkTypeNames(row.work_type_ids) }}</span>
              </div>
              <div class="card-line">
                <span>积分：{{ getInspectionPoints(row) }}</span>
                <span>提交时间：{{ formatDateTime(row.submit_time) }}</span>
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
      v-model="detailDialogVisible"
      title="自检详情"
      width="700px"
      :show-confirm="false"
      :show-cancel="false"
    >
      <div class="detail-content" v-if="detailData">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="填报人">{{ detailData.filler?.real_name || detailData.filler_name }}</el-descriptions-item>
          <el-descriptions-item label="场站">{{ detailData.station?.station_name || detailData.station_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="填报日期">{{ detailData.inspection_date }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ formatDateTime(detailData.submit_time) }}</el-descriptions-item>
          <el-descriptions-item label="工作性质" :span="2">
            {{ getWorkTypeNames(detailData.work_type_ids) }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="detail-items" v-if="detailData.inspection_items?.length">
          <h4>检查项目</h4>
          <el-table :data="detailData.inspection_items" border size="small">
            <el-table-column prop="workTypeName" label="工作性质" width="120" />
            <el-table-column prop="itemName" label="检查项目" min-width="150">
              <template #default="{ row }">
                <span v-if="row.parentName">{{ row.parentName }} / {{ row.itemName }}</span>
                <span v-else>{{ row.itemName }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="itemStandard" label="检查标准" min-width="150">
              <template #default="{ row }">
                {{ row.itemStandard || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="结果" width="90">
              <template #default="{ row }">
                <span v-if="getItemStatusValue(row) === null">-</span>
                <el-tag
                  v-else
                  :type="getItemStatusValue(row) === 1 ? 'success' : 'danger'"
                  size="small"
                >
                  {{ getItemStatusValue(row) === 1 ? '是' : '否' }}
                </el-tag>
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
import { CircleCheck, Warning } from '@element-plus/icons-vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/store/modules/user';
import { useUiModeStore } from '@/store/modules/uiMode';
import { useUpload } from '@/composables/useUpload';
import request from '@/api/request';
import dayjs from 'dayjs';
import SafetyCheckItemList from '@/modules/inspection/components/SafetyCheckItemList.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import SimpleFilterBar from '@/components/common/SimpleFilterBar.vue';
import FormDialog from '@/components/system/FormDialog.vue';
import { buildExportFileName, exportRowsToXlsx, fetchAllPaged } from '@/utils/tableExport';

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
const canUseSimpleMode = computed(() => userStore.roleCode === 'dev_test' || userStore.baseRoleCode === 'dev_test');
const isSimpleMode = computed(() => canUseSimpleMode.value && uiModeStore.isSimpleMode);
const simpleShowTable = ref(false);
const simpleFilterExpanded = ref(false);

// 当前日期
const today = dayjs().format('YYYY-MM-DD');
const startDate = ref(dayjs().subtract(5, 'day').format('YYYY-MM-DD'));
const endDate = ref(today);
const historySource = ref([]);
const defaultHistoryFilters = {
  workTypeId: 'all',
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
  if (historyFilters.value.workTypeId && historyFilters.value.workTypeId !== 'all') {
    const selected = workTypes.value.find(item => String(item.id) === String(historyFilters.value.workTypeId));
    if (selected?.work_type_name) parts.push(`工作性质=${selected.work_type_name}`);
  }
  if (historyFilters.value.result && historyFilters.value.result !== 'all') {
    const resultLabel = historyResultOptions.find(item => item.value === historyFilters.value.result)?.label;
    if (resultLabel) parts.push(`检查结果=${resultLabel}`);
  }
  return parts.length > 0 ? parts.join(' | ') : '当前筛选：全部';
});

// 今日自检列表（用于状态卡片）
const todayInspections = ref([]);
// 日期范围自检列表（用于记录展示）
const rangeInspections = ref([]);
// 今日已完成的工作性质ID列表
const completedWorkTypeIds = computed(() => {
  const ids = new Set();
  todayInspections.value.forEach(inspection => {
    const workTypeIds = inspection.work_type_ids || [];
    workTypeIds.forEach(id => ids.add(id));
  });
  return ids;
});
// 是否已完成基本工作自检
const hasCompletedBasicWork = computed(() => {
  const defaultWorkTypes = workTypes.value.filter(wt => wt.is_default === 1);
  if (defaultWorkTypes.length === 0) return todayInspections.value.length > 0;
  return defaultWorkTypes.every(wt => completedWorkTypeIds.value.has(wt.id));
});

const operationWorkTypeId = computed(() => {
  const target = workTypes.value.find(wt => (wt.work_type_name || '').includes('操作'));
  return target?.id || null;
});

const operationWorkStatus = computed(() => {
  if (!operationWorkTypeId.value) {
    return { text: '未配置', type: 'info' };
  }
  const done = completedWorkTypeIds.value.has(operationWorkTypeId.value);
  return { text: done ? '已完成' : '未完成', type: done ? 'success' : 'warning' };
});

const operationCompleted = computed(() => {
  if (!operationWorkTypeId.value) return false;
  return completedWorkTypeIds.value.has(operationWorkTypeId.value);
});

const extraCompletedWorkTypes = computed(() => {
  return workTypes.value.filter(wt => {
    if (wt.is_default === 1) return false;
    if (operationWorkTypeId.value && wt.id === operationWorkTypeId.value) return false;
    return completedWorkTypeIds.value.has(wt.id);
  });
});

// 判断工作性质是否禁用
const isWorkTypeDisabled = (wt) => {
  // 已完成的工作性质禁用
  if (completedWorkTypeIds.value.has(wt.id)) {
    return true;
  }
  // 首次自检时，默认工作性质为必选（禁用但默认勾选）
  if (!hasCompletedBasicWork.value && wt.is_default === 1) {
    return true;
  }
  return false;
};

// 历史记录
const historyList = ref([]);
const loadingHistory = ref(false);
const useServerPagination = ref(false);
const pagination = ref({
  page: 1,
  pageSize: 5,
  total: 0
});

// 工作性质列表
const workTypes = ref([]);
const workTypesMap = ref({});
const isActiveStatus = (status) => status === undefined || status === null || status === '' || status === 'active' || status === 1 || status === '1' || status === true;

// 上传配置

const submitting = ref(false);
const exporting = ref(false);
const inspectionForm = reactive({
  selectedWorkTypes: [],
  remark: ''
});

// 检查项目数组
const allCheckItems = ref([]);

// 按工作性质分组的检查项
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

// 工作性质列表
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

// 检查项
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
// 添加 checkStatus 字段，默认为 null；添加 photoList、photoUrls 用于图片上传
    allCheckItems.value = items.map(item => ({
      ...item,
      checkStatus: null,
      unqualifiedRemark: '',
      photoList: [],
      photoUrls: []
    }));
  } catch (error) {
    
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

const isChildVisible = (child) => {
  if (!child?.parent_id) return true;
  const parent = getParentItem(child);
  if (!parent || Number(parent.enable_children) !== 1) return false;
  if (parent.checkStatus === null || parent.checkStatus === undefined) return false;
  const triggerValue = child.trigger_value !== null && child.trigger_value !== undefined
    ? Number(child.trigger_value)
    : 1;
  return parent.checkStatus === triggerValue;
};

const resetChildItem = (child) => {
  child.checkStatus = null;
  child.unqualifiedRemark = '';
  child.photoList = [];
  child.photoUrls = [];
};

const handleCheckStatusChange = (item) => {
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

// 处理工作性质变化
const handleWorkTypesChange = async (selectedIds) => {
  await loadCheckItems(selectedIds);
};

// 今日自检（支持多条）
const loadTodayInspection = async () => {
  try {
    const today = dayjs().format('YYYY-MM-DD');
    const res = await request.get('/self-inspections/my', {
      params: {
        inspectionType: 'safety',
        startDate: today,
        endDate: today
      }
    });
    todayInspections.value = res || [];
  } catch (error) {

  }
};

const loadRangeInspections = async () => {
  if (!startDate.value || !endDate.value) {
    rangeInspections.value = [];
    return;
  }
  try {
    const res = await request.get('/self-inspections/my', {
      params: {
        inspectionType: 'safety',
        startDate: startDate.value,
        endDate: endDate.value
      }
    });
    const list = res ?? [];
    rangeInspections.value = filterInspectionList(list);
  } catch (error) {

  }
};

const handleSearch = () => {
  pagination.value.page = 1;
  loadRangeInspections();
  loadHistory();
};

const resetFilters = () => {
  startDate.value = dayjs().subtract(5, 'day').format('YYYY-MM-DD');
  endDate.value = today;
  historyFilters.value = { ...defaultHistoryFilters };
  pagination.value.page = 1;
  loadRangeInspections();
  loadHistory();
};

const normalizeWorkTypeIds = (row) => {
  if (!row) return [];
  const raw =
    row.work_type_ids ??
    row.workTypeIds ??
    row.work_type_id ??
    row.workTypeId ??
    [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map(value => value.trim())
      .filter(Boolean);
  }
  return [raw];
};

const getInspectionResultKey = (row) => {
  if (!row?.inspection_items || !Array.isArray(row.inspection_items)) {
    return 'incomplete';
  }
  const statusList = row.inspection_items.map(item => getItemStatusValue(item));
  const unselectedCount = statusList.filter(v => v === null).length;
  const noCount = statusList.filter(v => v === 0).length;
  if (unselectedCount > 0) return 'incomplete';
  if (noCount > 0) return 'fail';
  return 'pass';
};

const getInspectionDateValue = (row) => {
  const dateValue = row?.inspection_date || row?.inspectionDate;
  return dateValue ? dayjs(dateValue).valueOf() : 0;
};

const getInspectionTimeValue = (row) => {
  const timeValue = row?.submit_time || row?.submitTime || row?.created_at || row?.createdAt || row?.inspection_date || row?.inspectionDate;
  return timeValue ? dayjs(timeValue).valueOf() : 0;
};

const sortInspectionList = (list) => {
  const direction = historyFilters.value.sortOrder === 'desc' ? -1 : 1;
  return (list ?? []).slice().sort((a, b) => {
    const dateDiff = getInspectionDateValue(a) - getInspectionDateValue(b);
    if (dateDiff !== 0) return dateDiff * direction;
    return (getInspectionTimeValue(a) - getInspectionTimeValue(b)) * direction;
  });
};

const filterInspectionList = (list) => {
  const workTypeId = historyFilters.value.workTypeId;
  const result = historyFilters.value.result;
  const filtered = (list ?? []).filter(row => {
    if (workTypeId && workTypeId !== 'all') {
      const ids = normalizeWorkTypeIds(row).map(id => String(id));
      if (!ids.includes(workTypeId)) return false;
    }
    if (result && result !== 'all') {
      const key = getInspectionResultKey(row);
      if (key !== result) return false;
    }
    return true;
  });
  return sortInspectionList(filtered);
};

const applyHistoryFilters = (source = historySource.value) => {
  const filtered = filterInspectionList(source);
  pagination.value.total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pagination.value.pageSize));
  if (pagination.value.page > totalPages) {
    pagination.value.page = totalPages;
  }
  const startIndex = (pagination.value.page - 1) * pagination.value.pageSize;
  historyList.value = filtered.slice(startIndex, startIndex + pagination.value.pageSize);
};

const handlePageChange = () => {
  if (useServerPagination.value) {
    loadHistory();
    return;
  }
  applyHistoryFilters();
};

const handlePageSizeChange = () => {
  pagination.value.page = 1;
  if (useServerPagination.value) {
    loadHistory();
    return;
  }
  applyHistoryFilters();
};

// 合并同一人同一天的自检
const mergeInspectionRecords = (list) => {
  const merged = new Map();

  list.forEach(item => {
    const key = `${item.filler_id}-${item.inspection_date}-${item.station_id}`;
    if (merged.has(key)) {
      const existing = merged.get(key);
      // 合并工作性质ID
      const existingIds = new Set(normalizeWorkTypeIds(existing));
      normalizeWorkTypeIds(item).forEach(id => existingIds.add(id));
      existing.work_type_ids = Array.from(existingIds);
// 合并检查项
      existing.inspection_items = [
        ...(existing.inspection_items || []),
        ...(item.inspection_items || [])
      ];
// 保留原始记录用于查看详情
      existing._originalRecords = existing._originalRecords || [existing];
      existing._originalRecords.push(item);
      // 提交时间取最新
      if (item.submit_time > existing.submit_time) {
        existing.submit_time = item.submit_time;
      }
    } else {
      const normalizedIds = normalizeWorkTypeIds(item);
      merged.set(key, { ...item, work_type_ids: normalizedIds, _originalRecords: [item] });
    }
  });

  return Array.from(merged.values());
};

// 历史记录
const loadHistory = async () => {
  loadingHistory.value = true;
  try {
    const params = {
      inspectionType: 'safety',
      merge: 1,
      page: pagination.value.page,
      pageSize: pagination.value.pageSize
    };
    if (historyFilters.value.workTypeId && historyFilters.value.workTypeId !== 'all') {
      params.workTypeId = historyFilters.value.workTypeId;
    }
    if (historyFilters.value.result && historyFilters.value.result !== 'all') {
      params.inspectionResult = historyFilters.value.result;
    }
    if (historyFilters.value.sortOrder) {
      params.sortOrder = historyFilters.value.sortOrder;
    }
    const res = await request.get('/self-inspections/my', { params });
    if (res?.list) {
      useServerPagination.value = true;
      historyList.value = res.list ?? [];
      pagination.value.total = res.total ?? 0;
      return;
    }

    useServerPagination.value = false;
    const merged = mergeInspectionRecords(res ?? []);
    historySource.value = merged;
    applyHistoryFilters(merged);
  } catch (error) {

  } finally {
    loadingHistory.value = false;
  }
};

const exportRecords = async () => {
  exporting.value = true;
  try {
    const baseParams = {
      inspectionType: 'safety',
      merge: 1
    };
    if (historyFilters.value.workTypeId && historyFilters.value.workTypeId !== 'all') {
      baseParams.workTypeId = historyFilters.value.workTypeId;
    }
    if (historyFilters.value.result && historyFilters.value.result !== 'all') {
      baseParams.inspectionResult = historyFilters.value.result;
    }
    if (historyFilters.value.sortOrder) {
      baseParams.sortOrder = historyFilters.value.sortOrder;
    }

    const { rows } = await fetchAllPaged({
      pageSize: 5000,
      fetchPage: async ({ page, pageSize }) => {
        const res = await request.get('/self-inspections/my', {
          params: {
            ...baseParams,
            page,
            pageSize
          }
        });

        if (res?.list) {
          return { list: res.list ?? [], total: res.total ?? 0 };
        }

        const merged = mergeInspectionRecords(res ?? []);
        return { list: merged, total: merged.length };
      }
    });

    const filteredRows = filterInspectionList(rows);
    const columns = [
      { label: '日期', value: row => row.inspection_date ?? '' },
      { label: '工作性质', value: row => getWorkTypeNames(row.work_type_ids) },
      { label: '积分', value: row => getInspectionPoints(row) },
      { label: '检查结果', value: row => getInspectionResult(row).text },
      { label: '提交时间', value: row => formatDateTime(row.submit_time) }
    ];

    const pageTitle = typeof route?.meta?.title === 'string' ? route.meta.title : '安全自检';
    const fileName = buildExportFileName({ title: pageTitle });
    await exportRowsToXlsx({ title: pageTitle, fileName, sheetName: '记录列表', columns, rows: filteredRows });
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

const statusHint = ref('');
const statusTitle = computed(() => {
  if (statusHint.value) return statusHint.value;
  return hasCompletedBasicWork.value ? '今日安全自检已完成' : '今日尚未完成安全自检';
});
const statusTime = computed(() => {
  if (statusHint.value) return '';
  return `已完成${todayInspections.value.length} 次自检`;
});

const updateScheduleHint = async () => {
  statusHint.value = '';
  try {
    const schedule = await resolveTodaySchedule();
    if (!schedule || !schedule.station_id) {
      statusHint.value = '您今日没有排班，无法进行安全自检';
    }
  } catch (error) {
    statusHint.value = error?.message ? `加载排班失败：${error.message}` : '加载排班失败，请稍后重试';
  }
};

// 开始自检
const startInspection = async () => {
  inspectionForm.remark = '';

  if (!hasCompletedBasicWork.value) {
// 首次自检：设置默认工作性质
    const defaultWorkTypes = workTypes.value.filter(wt => wt.is_default === 1).map(wt => wt.id);
    inspectionForm.selectedWorkTypes = [...defaultWorkTypes];
// 默认工作性质的检查项
    await loadCheckItems(defaultWorkTypes);
  } else {
// 后续自检：清空选择，用户手动选择需要的工作性质
    inspectionForm.selectedWorkTypes = [];
    allCheckItems.value = [];
  }
};

// 提交自检
const submitInspection = async () => {
  if (inspectionForm.selectedWorkTypes.length === 0) {
    ElMessage.warning('请至少选择一个工作性质');
    return;
  }

// 检查是否有未选择的项目
  const visibleItems = getVisibleCheckItems();
  const unselectedItems = visibleItems.filter(
    item => item.checkStatus === null || item.checkStatus === undefined
  );
  if (unselectedItems.length > 0) {
    ElMessage.warning('请完成所有检查项');
    return;
  }

  submitting.value = true;
  try {
    const schedule = await resolveTodaySchedule();
    if (!schedule || !schedule.station_id) {
      ElMessage.warning('\u60a8\u4eca\u65e5\u6ca1\u6709\u6392\u73ed\uff0c\u65e0\u6cd5\u8fdb\u884c\u5b89\u5168\u81ea\u68c0');
      return;
    }

// 构建检查项目数组
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
      status: item.checkStatus,
      remark: item.unqualifiedRemark || '',
      photoUrls: item.photoUrls || []
    }));

    await request.post('/self-inspections', {
      inspectionType: 'safety',
      workTypeIds: inspectionForm.selectedWorkTypes,
      inspectionItems,
      remark: inspectionForm.remark,
      stationId: schedule.station_id,
      inspectionDate: dayjs().format('YYYY-MM-DD')
    });

    ElMessage.success('提交成功');
    await loadTodayInspection();
    await loadRangeInspections();
    await loadHistory();
    await startInspection();
  } catch (error) {
    ElMessage.error(error.message || '提交失败');
  } finally {
    submitting.value = false;
  }
};

// 查看详情
const viewDetail = (row) => {
  detailData.value = row;
  detailDialogVisible.value = true;
};

// 获取工作性质
const getWorkTypeNames = (workTypeIds) => {
  const ids = normalizeWorkTypeIds({ work_type_ids: workTypeIds });
  if (!ids.length) return '-';
  return ids
    .map(id => workTypesMap.value[id]?.work_type_name || `ID:${id}`)
    .join('、');
};

const getInspectionPoints = (row) => {
  const ids = normalizeWorkTypeIds(row);
  let total = 0;
  ids.forEach(id => {
    const workType = workTypesMap.value[id] ?? workTypesMap.value[Number(id)];
    const points = workType?.points;
    if (points === undefined || points === null) return;
    const value = Number(points);
    if (!Number.isNaN(value)) {
      total += value;
    }
  });
  return total;
};

const getItemStatusValue = (row) => {
  if (row?.status === 0 || row?.status === 1) return row.status;
  if (row?.checked === true) return 1;
  if (row?.checked === false) return 0;
  return null;
};

// 获取检查结果
const getInspectionResult = (row) => {
  if (!row.inspection_items || !Array.isArray(row.inspection_items)) {
    return { type: 'info', text: '未检查' };
  }
  const statusList = row.inspection_items.map(item => getItemStatusValue(item));
  const unselectedCount = statusList.filter(v => v === null).length;
  const noCount = statusList.filter(v => v === 0).length;
  if (unselectedCount > 0) {
    return { type: 'info', text: '未完成' };
  }
  if (noCount === 0) {
    return { type: 'success', text: '全部合格' };
  }
  return { type: 'warning', text: `有${noCount}项异常` };
};

// 格式化日期时间
const formatDateTime = (dateTime) => {
  if (!dateTime) return '-';
  return dayjs(dateTime).format('YYYY-MM-DD HH:mm');
};

onMounted(async () => {
  await loadWorkTypes();
  await updateScheduleHint();
  await loadTodayInspection();
  await startInspection();
  if (isRecordsView.value) {
    await loadHistory();
    await loadRangeInspections();
  }
});

watch(isRecordsView, async (value) => {
  if (!value) return;
  await loadHistory();
  await loadRangeInspections();
});

watch(isSimpleMode, (enabled) => {
  if (enabled) return;
  simpleShowTable.value = false;
  simpleFilterExpanded.value = false;
});
</script>

<style lang="scss" scoped>
.safety-inspection-page {
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

    .form-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 16px;
    }

    .status-card {
      margin-bottom: 16px;
    }
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
    }

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
        margin-bottom: 4px;
      }

      .status-time {
        color: #909399;
        font-size: 14px;
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

  .today-inspections {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 24px;
    border: 1px solid #e4e7ed;

    h3 {
      margin: 0 0 16px 0;
      font-size: 16px;
    }

    .inspection-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .inspection-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #f5f7fa;
      border-radius: 6px;
      border: 1px solid #e4e7ed;

      .inspection-item-info {
        display: flex;
        flex-direction: column;
        gap: 4px;

        .work-types {
          font-weight: 500;
          color: #303133;
        }

        .submit-time {
          font-size: 12px;
          color: #909399;
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

  .filter-bar {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .pagination-wrapper {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
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
    padding: 10px;
    background: #f5f7fa;
    border-radius: 4px;

    .check-item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 4px;
    }

    .check-item-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
      color: #303133;
    }

    .check-item-standard {
      color: #909399;
      font-size: 12px;
      padding-left: 24px;
    }

    .check-item-photo {
      margin-top: 10px;
      padding-left: 24px;

      .photo-label {
        font-size: 12px;
        color: #f56c6c;
        margin-bottom: 8px;
      }

      :deep(.el-textarea) {
        margin-top: 8px;
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


