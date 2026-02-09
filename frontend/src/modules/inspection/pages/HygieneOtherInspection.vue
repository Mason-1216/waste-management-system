<template>
  <div class="hygiene-other-page">
    <div class="page-header">
      <h3>卫生他检</h3>
      <div class="header-actions">
        <el-button type="primary" @click="isRecordsView ? goFormView() : goRecordsView()">
          {{ isRecordsView ? '他检表单' : '查询' }}
        </el-button>
      </div>
    </div>

    <el-card v-if="!isRecordsView" class="inspection-form-card">
      <div class="inspection-form-header">
        <div class="form-title-row">
          <div class="form-subtitle">他检表单</div>
        </div>
      </div>

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

        <el-form-item label="责任区" prop="selectedWorkTypeId">
          <el-select
            v-model="inspectionForm.selectedWorkTypeId"
            placeholder="请选择责任区"
            clearable
            filterable
            style="width: 240px"
            @change="handleWorkTypeChange"
          >
            <el-option
              v-for="wt in formWorkTypes"
              :key="wt.id"
              :label="wt.work_type_name"
              :value="wt.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="被检查人" prop="inspectedUserId">
          <el-select
            v-model="inspectionForm.inspectedUserId"
            :disabled="!isInspectedUserSelectable"
            :placeholder="inspectedUserPlaceholder"
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

        <div v-if="groupedCheckItems.length > 0">
          <SafetyCheckItemList
            :groups="groupedCheckItems"
            :upload-url="uploadUrl"
            :upload-headers="uploadHeaders"
            status-field="result"
            pass-value="pass"
            fail-value="fail"
            :pass-label="'合格'"
            :fail-label="'不合格'"
            :parent-label="'点位'"
            :child-label="'子项'"
            :standard-label="'要求：'"
            :photo-label="'上传不合格项照片：'"
            :show-remark="true"
            remark-field="remark"
            :remark-placeholder="'请填写不合格原因'"
            remark-position="before"
            :use-button-radio="true"
            radio-group-size="small"
            :is-child-visible="isChildVisible"
            @status-change="handleResultChange"
            @photo-change="updateItemPhotoList"
            @upload-error="handleUploadError"
          />
        </div>
        <el-empty v-else-if="inspectionForm.selectedWorkTypeId" description="该责任区下暂无检查项目" />

        <el-form-item label="备注">
          <el-input
            v-model="inspectionForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请填写检查备注"
          />
        </el-form-item>
      </el-form>

      <div class="form-actions">
        <el-button @click="showNewInspection">重置</el-button>
        <el-button type="primary" @click="submitInspection" :loading="submitting">提交</el-button>
      </div>
    </el-card>

    <template v-if="isRecordsView">
      <el-card class="filter-card">
        <FilterBar>
        <div class="filter-item">
          <span class="filter-label">开始日期</span>
          <el-date-picker
            v-model="filters.startDate"
            type="date"
            placeholder="全部"
            value-format="YYYY-MM-DD"
            @change="applyFilters"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">结束日期</span>
          <el-date-picker
            v-model="filters.endDate"
            type="date"
            placeholder="全部"
            value-format="YYYY-MM-DD"
            @change="applyFilters"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">日期排序</span>
          <FilterSelect
            v-model="filters.sortOrder"
            placeholder="升序"
            filterable
            @change="applyFilters"
          >
            <el-option
              v-for="option in dateSortOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </FilterSelect>
        </div>
        <div class="filter-item">
          <span class="filter-label">检查性质</span>
          <FilterSelect
            v-model="filters.inspectionKind"
            placeholder="全部"
            clearable
            filterable
            @change="applyFilters"
            @clear="applyFilters"
          >
            <el-option label="全部" value="all" />
            <el-option
              v-for="option in inspectionKindOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </FilterSelect>
        </div>
        <div v-if="showStationFilter" class="filter-item">
          <span class="filter-label">场站</span>
          <FilterSelect
            v-model="filters.stationId"
            placeholder="全部"
            clearable
            filterable
            @change="applyFilters"
            @clear="applyFilters"
          >
            <el-option label="全部" value="all" />
            <el-option
              v-for="station in stationList"
              :key="station.id"
              :label="station.stationName"
              :value="station.id"
            />
          </FilterSelect>
        </div>
        <div class="filter-item">
          <span class="filter-label">被检查人</span>
          <FilterAutocomplete
            v-model="filters.inspectedName"
            :fetch-suggestions="fetchInspectedNameSuggestions"
            trigger-on-focus
            placeholder="全部"
            clearable
            @select="applyFilters"
            @input="applyFilters"
            @clear="applyFilters"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">责任区</span>
          <FilterSelect
            v-model="filters.workTypeIds"
            placeholder="全部"
            clearable
            multiple
            collapse-tags
            collapse-tags-tooltip
            filterable
            @change="applyFilters"
            @clear="applyFilters"
          >
            <el-option label="全部" value="all" />
            <el-option
              v-for="wt in workTypes"
              :key="wt.id"
              :label="wt.work_type_name"
              :value="wt.id"
            />
          </FilterSelect>
        </div>
        <div class="filter-item">
          <span class="filter-label">检查结果</span>
          <FilterSelect
            v-model="filters.inspectionResult"
            placeholder="全部"
            clearable
            filterable
            @change="applyFilters"
            @clear="applyFilters"
          >
            <el-option label="全部" value="all" />
            <el-option
              v-for="option in inspectionResultOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </FilterSelect>
        </div>
        </FilterBar>
      </el-card>

      <div class="history-section">
        <h3>记录列表</h3>
        <el-table :data="inspectionList" stripe border v-loading="loading">
        <el-table-column prop="inspection_date" label="检查日期" width="120" />
        <el-table-column label="检查性质" width="90">
          <template #default="{ row }">
            {{ getInspectionKindLabel(row) }}
          </template>
        </el-table-column>
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
      </div>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[5, 10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next"
          @current-change="loadInspectionList"
          @size-change="handlePageSizeChange"
        />
      </div>
    </template>

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
              {{ detailData.is_qualified ? '合格' : '不合格' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="备注">{{ detailData.remark || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-items" v-if="detailItems.length">
          <h4>检查项目</h4>
          <el-table :data="detailItems" border size="small" :row-class-name="getDetailRowClass">
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
                  {{ row.result === 'pass' ? '合格' : '不合格' }}
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
import { Plus, InfoFilled } from '@element-plus/icons-vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/store/modules/user';
import { useUpload } from '@/composables/useUpload';
import request from '@/api/request';
import dayjs from 'dayjs';

import { createListSuggestionFetcher } from '@/utils/filterAutocomplete';
import SafetyCheckItemList from '@/modules/inspection/components/SafetyCheckItemList.vue';
import FormDialog from '@/components/system/FormDialog.vue';

const userStore = useUserStore();
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

const showStationFilter = computed(() => {
  const user = userStore.userInfo;
  if (user?.roleCode === 'station_manager' && user?.stations?.length > 1) {
    return true;
  }
  return userStore.hasRole(['deputy_manager', 'department_manager', 'safety_inspector']);
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
const positionAssignments = ref([]);
const positionNameMap = ref({});
const todayScheduleUsers = ref([]);

const isActiveStatus = (status) => status === undefined || status === null || status === '' || status === 'active' || status === 1 || status === '1' || status === true;

const today = dayjs().format('YYYY-MM-DD');
const filters = reactive({
  startDate: dayjs().subtract(5, 'day').format('YYYY-MM-DD'),
  endDate: today,
  inspectionKind: 'all',
  stationId: 'all',
  inspectedName: '',
  workTypeIds: ['all'],
  inspectionResult: 'all',
  sortOrder: 'asc'
});

const pagination = reactive({
  page: 1,
  pageSize: 5,
  total: 0
});

const inspectionList = ref([]);
const inspectionSuggestionList = ref([]);
const loading = ref(false);

const fetchInspectedNameSuggestions = createListSuggestionFetcher(
  () => inspectionSuggestionList.value,
  (row) => row.inspected_user_name
);

const inspectionKindOptions = [
  { label: '自检', value: 'self' },
  { label: '他检', value: 'other' }
];

const inspectionResultOptions = [
  { label: '合格', value: 'pass' },
  { label: '不合格', value: 'fail' },
  { label: '未完成', value: 'incomplete' },
  { label: '未检查', value: 'unchecked' }
];
const dateSortOptions = [
  { label: '升序', value: 'asc' },
  { label: '降序', value: 'desc' }
];

const dialogVisible = ref(false);
const submitting = ref(false);
const formRef = ref();
const userList = ref([]);
const allCheckItems = ref([]);
const isInspectedUserSelectable = computed(() => userList.value.length > 1);
const inspectedUserPlaceholder = computed(() => {
  if (!inspectionForm.selectedWorkTypeId) return '请先选择责任区';
  if (userList.value.length === 0) return '该责任区今日无人排班';
  if (userList.value.length === 1) return '已自动带出';
  return '请选择被检查人';
});

const inspectionForm = reactive({
  stationId: null,
  inspectedUserId: null,
  selectedWorkTypeId: null,
  remark: ''
});

const formRules = {
  stationId: [{ required: true, message: '请选择场站', trigger: 'change' }],
  inspectedUserId: [{ required: true, message: '请选择被检查人', trigger: 'change' }],
  selectedWorkTypeId: [{ required: true, message: '请选择责任区', trigger: 'change' }]
};

const selectedWorkTypeIds = computed(() => {
  if (!inspectionForm.selectedWorkTypeId) return [];
  return [inspectionForm.selectedWorkTypeId];
});

const groupedCheckItems = computed(() => {
  const groups = [];
  selectedWorkTypeIds.value.forEach(wtId => {
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

const isRemarkItem = (item) => {
  const itemId = item?.itemId ?? item?.item_id;
  const name = item?.itemName ?? item?.item_name ?? '';
  const type = item?.itemType ?? item?.item_type ?? '';
  if (itemId === 'remark') return true;
  if (type === 'remark') return true;
  return name === '不合格说明';
};

const isAreaPhotoItem = (item) => {
  const name = item?.itemName ?? item?.item_name ?? '';
  const type = item?.itemType ?? item?.item_type ?? '';
  return type === 'area_photo' || name === '责任区照片';
};

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

const normalizeDetailItems = (items) => (Array.isArray(items) ? items : []).map((item) => {
  const workTypeName = item?.workTypeName ?? item?.work_type_name ?? '';
  const itemName = item?.itemName ?? item?.item_name ?? '';
  const itemStandard = item?.itemStandard ?? item?.item_standard ?? '';
  const photoUrls = normalizePhotoUrls(item?.photoUrls ?? item?.photo_urls);
  return {
    ...item,
    workTypeName,
    itemName,
    itemStandard,
    photoUrls
  };
});

const getDetailItems = (row) => {
  const items = row?.inspection_items ?? row?.inspectionItems ?? [];
  const filtered = items.filter(item => !isRemarkItem(item));
  return normalizeDetailItems(filtered);
};

const detailItems = computed(() => getDetailItems(detailData.value));
const getDetailRowClass = ({ row }) => (isAreaPhotoItem(row) ? 'area-photo-row' : '');

const loadStations = async () => {
  try {
    const res = await request.get('/stations/all');
    stationList.value = (res.list || res || []).map(s => ({
      id: s.id,
      stationName: s.stationName || s.station_name,
      status: s.status
    }));
  } catch (error) {
    
  }
};

const buildPositionNameMap = (assignments) => {
  const map = {};
  (assignments || []).forEach(assignment => {
    const areaId = assignment?.areaId ?? assignment?.hygieneAreaId ?? assignment?.hygiene_area_id;
    const positionName = assignment?.positionName ?? assignment?.position_name;
    if (areaId === undefined || areaId === null) return;
    if (!positionName) return;
    const key = String(areaId);
    if (!map[key]) {
      map[key] = [];
    }
    if (!map[key].includes(positionName)) {
      map[key].push(positionName);
    }
  });
  return map;
};

const loadPositionAssignments = async (stationId) => {
  if (!stationId) {
    positionAssignments.value = [];
    positionNameMap.value = {};
    return;
  }
  try {
    const res = await request.get('/hygiene-position-areas', { params: { stationId } });
    const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
    positionAssignments.value = list;
    positionNameMap.value = buildPositionNameMap(list);
  } catch (error) {
    
    positionAssignments.value = [];
    positionNameMap.value = {};
  }
};

const loadTodaySchedules = async (stationId) => {
  if (!stationId) {
    todayScheduleUsers.value = [];
    return;
  }
  try {
    const res = await request.get('/schedules/today', { params: { stationId } });
    const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
    todayScheduleUsers.value = list;
  } catch (error) {
    
    todayScheduleUsers.value = [];
  }
};

const resolvePositionNames = (workTypeIds) => {
  const ids = Array.isArray(workTypeIds) ? workTypeIds : [];
  const names = new Set();
  ids.forEach(id => {
    const key = String(id);
    const areaPositions = positionNameMap.value[key];
    if (!Array.isArray(areaPositions)) return;
    areaPositions.forEach(positionName => {
      if (positionName) {
        names.add(positionName);
      }
    });
  });
  return Array.from(names);
};

const buildUserListByPositions = (positionNames) => {
  if (!Array.isArray(positionNames) || positionNames.length === 0) return [];
  const positionSet = new Set(positionNames);
  const uniqueUsers = new Map();
  todayScheduleUsers.value.forEach(item => {
    const positionName = item?.positionName ?? item?.position_name;
    if (!positionName || !positionSet.has(positionName)) return;
    const userId = item?.user?.id ?? item?.userId ?? item?.user_id;
    if (!userId || uniqueUsers.has(userId)) return;
    const userName = item?.user?.real_name ?? item?.user?.realName ?? item?.userName ?? '';
    uniqueUsers.set(userId, { id: userId, real_name: userName });
  });
  return Array.from(uniqueUsers.values());
};

const refreshInspectedUsers = () => {
  const positionNames = resolvePositionNames(selectedWorkTypeIds.value);
  const nextUsers = buildUserListByPositions(positionNames);
  userList.value = nextUsers;
  if (nextUsers.length === 1) {
    inspectionForm.inspectedUserId = nextUsers[0].id;
    return;
  }
  if (!inspectionForm.inspectedUserId) return;
  const exists = nextUsers.some(user => user.id === inspectionForm.inspectedUserId);
  if (!exists) {
    inspectionForm.inspectedUserId = null;
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
      inspectionType: 'hygiene',
      includeSelf: 1
    };

    if (filters.startDate) {
      params.startDate = filters.startDate;
    }
    if (filters.endDate) {
      params.endDate = filters.endDate;
    }
    if (filters.stationId && filters.stationId !== 'all') {
      params.stationId = filters.stationId;
    }
    if (filters.inspectedName) {
      params.inspectedUserName = filters.inspectedName.trim();
    }
    if (filters.workTypeIds && filters.workTypeIds.length > 0 && !filters.workTypeIds.includes('all')) {
      params.workTypeIds = filters.workTypeIds.join(',');
    }
    if (filters.inspectionKind && filters.inspectionKind !== 'all') {
      params.inspectionKind = filters.inspectionKind;
    }
    if (filters.inspectionResult && filters.inspectionResult !== 'all') {
      params.inspectionResult = filters.inspectionResult;
    }
    if (filters.sortOrder) {
      params.sortOrder = filters.sortOrder;
    }

    const res = await request.get('/other-inspections', { params });
    inspectionList.value = res?.list || res || [];
    pagination.total = res?.total || 0;
    loadInspectionSuggestions(params);
  } catch (error) {
    
  } finally {
    loading.value = false;
  }
};

const loadInspectionSuggestions = async (baseParams) => {
  try {
    const params = {
      ...baseParams,
      page: 1,
      pageSize: 5000
    };
    const res = await request.get('/other-inspections', { params });
    const list = res?.list || res || [];
    inspectionSuggestionList.value = Array.isArray(list) ? list : [];
  } catch (error) {
    inspectionSuggestionList.value = [];
  }
};

const resetFilters = () => {
  filters.startDate = dayjs().subtract(5, 'day').format('YYYY-MM-DD');
  filters.endDate = today;
  filters.inspectionKind = 'all';
  filters.stationId = 'all';
  filters.inspectedName = '';
  filters.workTypeIds = ['all'];
  filters.inspectionResult = 'all';
  filters.sortOrder = 'asc';
  if (!isRecordsView.value) return;
  loadInspectionList();
};

const applyFilters = () => {
  if (!isRecordsView.value) return;
  pagination.page = 1;
  loadInspectionList();
};

const handlePageSizeChange = (size) => {
  pagination.pageSize = size;
  pagination.page = 1;
  loadInspectionList();
};

watch(
  () => [filters.startDate, filters.endDate, filters.inspectionKind, filters.stationId, filters.inspectedName, filters.workTypeIds, filters.inspectionResult, filters.sortOrder],
  () => {
    applyFilters();
  },
  { deep: true }
);

const handleStationChange = async (stationId) => {
  inspectionForm.inspectedUserId = null;
  userList.value = [];
  todayScheduleUsers.value = [];
  positionAssignments.value = [];
  positionNameMap.value = {};

  if (stationId) {
    await loadTodaySchedules(stationId);
    await loadPositionAssignments(stationId);
  }

  await loadFormWorkTypes();
  inspectionForm.selectedWorkTypeId = null;
  allCheckItems.value = [];
  refreshInspectedUsers();
};

const handleWorkTypeChange = async (selectedId) => {
  const ids = selectedId ? [selectedId] : [];
  await loadCheckItems(ids);
  refreshInspectedUsers();
};

const showNewInspection = () => {
  Object.assign(inspectionForm, {
    stationId: null,
    inspectedUserId: null,
    selectedWorkTypeId: null,
    remark: ''
  });
  userList.value = [];
  allCheckItems.value = [];
  loadFormWorkTypes();

  if (activeStationList.value.length === 1) {
    inspectionForm.stationId = activeStationList.value[0].id;
    handleStationChange(inspectionForm.stationId);
  }
};

const submitInspection = async () => {
  if (!inspectionForm.stationId) {
    ElMessage.warning('请选择场站');
    return;
  }
  if (!inspectionForm.selectedWorkTypeId) {
    ElMessage.warning('请选择责任区');
    return;
  }
  if (userList.value.length === 0) {
    ElMessage.warning('该责任区今日无人排班，无法提交');
    return;
  }
  if (!inspectionForm.inspectedUserId) {
    ElMessage.warning('请选择被检查人');
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
      workTypeIds: [inspectionForm.selectedWorkTypeId],
      inspectionItems,
      isQualified: inspectionItems.every(item => item.result === 'pass'),
      remark: inspectionForm.remark
    });

    ElMessage.success('他检提交成功');
    showNewInspection();
    if (isRecordsView.value) {
      loadInspectionList();
    }
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

const getInspectionKindLabel = (row) => {
  const kind = row?.inspection_kind ?? row?.inspectionKind;
  if (kind === 'self') return '自检';
  if (kind === 'other') return '他检';
  return '他检';
};

const getItemStatusValue = (item) => {
  if (item?.status === 0 || item?.status === 1) return item.status;
  if (item?.checkStatus === 0 || item?.checkStatus === 1) return item.checkStatus;
  if (item?.result === 'pass') return 1;
  if (item?.result === 'fail') return 0;
  return null;
};

const getSelfInspectionResult = (row) => {
  const items = row?.inspection_items || row?.inspectionItems || [];
  const visibleItems = items.filter(item => !isMetaItem(item));
  if (!Array.isArray(visibleItems) || visibleItems.length === 0) {
    return { type: 'info', text: '未检查' };
  }
  const statuses = visibleItems.map(item => getItemStatusValue(item));
  const unselectedCount = statuses.filter(value => value === null).length;
  const failCount = statuses.filter(value => value === 0).length;
  if (unselectedCount > 0) {
    return { type: 'info', text: '未完成' };
  }
  if (failCount === 0) {
    return { type: 'success', text: '全部合格' };
  }
  return { type: 'warning', text: `有${failCount}项不合格` };
};

const getInspectionResult = (row) => {
  const kind = row?.inspection_kind ?? row?.inspectionKind;
  if (kind === 'self') {
    return getSelfInspectionResult(row);
  }
  if (row?.is_qualified === 0 || row?.is_qualified === false) {
    return { type: 'danger', text: '不合格' };
  }
  if (row?.is_qualified === 1 || row?.is_qualified === true) {
    return { type: 'success', text: '合格' };
  }
  return { type: 'info', text: '未检查' };
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
  showNewInspection();
  if (isRecordsView.value) {
    await loadInspectionList();
  }
});

watch(isRecordsView, async (value) => {
  if (!value) return;
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

    .page-title-link {
      cursor: pointer;
      color: var(--el-color-primary);
    }
  }

  .inspection-form-card {
    margin-bottom: 16px;

    .inspection-form-header {
      margin-bottom: 12px;
    }

    .form-title-row {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      width: 100%;
      gap: 12px;
    }

    .form-subtitle {
      font-size: 14px;
      color: #606266;
    }

    .form-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 12px;
    }
  }

  .report-banner {
    background: #fff;
    border-radius: 8px;
    padding: 20px 24px;
    margin-bottom: 16px;
    border: 1px solid #d9ecff;
    border-left: 4px solid #409EFF;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;

    .banner-content {
      display: flex;
      align-items: center;
      gap: 16px;
      flex: 1;
      min-width: 0;
    }

    .banner-icon {
      font-size: 40px;
      color: #409EFF;
    }

    .banner-info {
      flex: 1;
      min-width: 0;

      .banner-title {
        font-size: 18px;
        font-weight: 600;
        color: #303133;
      }

      .banner-desc {
        font-size: 14px;
        color: #909399;
        margin-top: 4px;
      }
    }
  }

  .filter-card {
    margin-bottom: 20px;
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
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
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

    :deep(.area-photo-row td) {
      background-color: #e6f7ff;
    }
  }
}

@media (min-width: 1025px) {
  .report-banner {
    .banner-actions {
      order: -1;
    }

    .banner-content {
      order: 0;
    }
  }
}

@media (max-width: 1024px) {
  .report-banner {
    padding: 16px;
    flex-direction: column;
    align-items: stretch;

    .banner-content {
      width: 100%;
    }

    .banner-actions {
      width: 100%;
    }

    :deep(.el-button) {
      width: 100%;
    }
  }
}
</style>


