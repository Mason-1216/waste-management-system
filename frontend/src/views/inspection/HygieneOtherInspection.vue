<template>
  <div class="hygiene-other-page">
    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="卫生他检" name="inspection">
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
          <el-table-column label="操作" width="120" fixed="right">
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
      </el-tab-pane>

      <el-tab-pane label="卫生工作安排" name="management">
        <el-tabs v-model="managementTab" type="card">
          <el-tab-pane label="卫生区域划分" name="areas">
            <div class="area-division-panel">
              <div class="panel-header">
                <h4>卫生区域划分</h4>
                <div class="header-actions">
                  <el-button @click="downloadTemplate">
                    <el-icon><Download /></el-icon>下载模板
                  </el-button>
                  <el-upload
                    ref="uploadRef"
                    :auto-upload="false"
                    :show-file-list="false"
                    :on-change="handleFileChange"
                    accept=".xlsx,.xls"
                  >
                    <el-button type="success">
                      <el-icon><Download /></el-icon>导入
                    </el-button>
                  </el-upload>
                  <el-button type="primary" @click="showAddAreaDialog">
                    <el-icon><Plus /></el-icon>新增
                  </el-button>
                </div>
              </div>
              <div class="panel-filters">
                <el-select
                  v-model="areaSearch.stationName"
                  placeholder="搜索场站"
                  clearable
                  filterable
                  allow-create
                  default-first-option
                  style="width: 200px;"
                >
                  <el-option
                    v-for="station in stationOptions"
                    :key="station.id || station.name"
                    :label="station.name"
                    :value="station.name"
                  />
                </el-select>
                <el-select
                  v-model="areaSearch.areaName"
                  placeholder="搜索责任区"
                  clearable
                  filterable
                  allow-create
                  default-first-option
                  style="width: 200px;"
                >
                  <el-option
                    v-for="name in areaNameOptions"
                    :key="name"
                    :label="name"
                    :value="name"
                  />
                </el-select>
              </div>
              <el-table
                :data="filteredAreaPoints"
                stripe
                border
                v-loading="loadingAreas"
                :span-method="spanMethod"
              >
                <el-table-column prop="stationName" label="场站" width="150" />
                <el-table-column prop="areaName" label="责任区" width="200" />
                <el-table-column prop="pointName" label="卫生点" width="200" />
                <el-table-column prop="workRequirements" label="工作要求及标准" show-overflow-tooltip />
                <el-table-column label="操作" width="160" fixed="right">
                  <template #default="{ row }">
                    <el-button link size="small" @click="editPoint(row)">编辑</el-button>
                    <el-button link size="small" type="danger" @click="deletePoint(row.pointId, row.areaId)">
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-tab-pane>

          <el-tab-pane label="卫生任务分配" name="assignments">
            <div class="assignment-panel">
              <div class="panel-header">
                <h4>岗位责任区分配</h4>
                <el-button type="primary" @click="showAddAssignmentDialog">
                  <el-icon><Plus /></el-icon>新增分配
                </el-button>
              </div>
              <div class="panel-filters">
                <el-select
                  v-model="assignmentSearch.stationName"
                  placeholder="搜索场站"
                  clearable
                  filterable
                  allow-create
                  default-first-option
                  style="width: 200px;"
                >
                  <el-option
                    v-for="station in stationOptions"
                    :key="station.id || station.name"
                    :label="station.name"
                    :value="station.name"
                  />
                </el-select>
                <el-select
                  v-model="assignmentSearch.positionName"
                  placeholder="搜索岗位"
                  clearable
                  filterable
                  allow-create
                  default-first-option
                  style="width: 200px;"
                >
                  <el-option
                    v-for="position in positionList"
                    :key="position"
                    :label="position"
                    :value="position"
                  />
                </el-select>
                <el-select
                  v-model="assignmentSearch.areaName"
                  placeholder="搜索责任区"
                  clearable
                  filterable
                  allow-create
                  default-first-option
                  style="width: 200px;"
                >
                  <el-option
                    v-for="name in assignmentAreaNameOptions"
                    :key="name"
                    :label="name"
                    :value="name"
                  />
                </el-select>
              </div>
              <el-table :data="filteredAssignmentList" stripe border v-loading="loadingAssignments">
                <el-table-column label="场站" width="150">
                  <template #default="{ row }">
                    {{ row.station?.station_name || '-' }}
                  </template>
                </el-table-column>
                <el-table-column prop="position_name" label="岗位" width="150" />
                <el-table-column label="责任区" min-width="200">
                  <template #default="{ row }">
                    {{ row.area?.area_name || '-' }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="100">
                  <template #default="{ row }">
                    <el-button link type="danger" @click="deleteAssignment(row.id)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="inspectionDialogVisible" title="卫生他检" width="700px">
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
              :label="area.area_name"
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

        <div v-if="inspectionForm.areas.length === 0" class="empty-hint">
          <el-empty description="请先选择责任区" />
        </div>

        <div v-for="area in inspectionForm.areas" :key="area.id" class="area-section">
          <h4 class="area-title">{{ area.area_name }}</h4>
          <div class="point-list">
            <div v-for="point in area.points" :key="point.id" class="point-item">
              <div class="point-header">
                <span class="point-name">{{ point.point_name }}</span>
                <el-radio-group v-model="point.checkStatus" @change="handlePointStatusChange(point)">
                  <el-radio :label="1">是</el-radio>
                  <el-radio :label="0">否</el-radio>
                </el-radio-group>
              </div>
              <div class="point-requirement">要求： {{ point.work_requirements || '-' }}</div>
              <el-input
                v-if="point.checkStatus === 0"
                v-model="point.remark"
                type="textarea"
                :rows="2"
                placeholder="不合格备注（选填）"
                style="margin-top: 8px"
              />
              <div class="point-photo" v-if="point.checkStatus === 0">
                <el-upload
                  :action="uploadUrl"
                  :headers="uploadHeaders"
                  list-type="picture-card"
                  :file-list="point.photoList"
                  :limit="3"
                  accept="image/*"
                  @success="(response, file, fileList) => updatePointPhotoList(point, fileList)"
                  @remove="(file, fileList) => updatePointPhotoList(point, fileList)"
                >
                  <el-icon><Plus /></el-icon>
                </el-upload>
              </div>
            </div>
          </div>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="inspectionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitInspection" :loading="submittingInspection">
          提交
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="areaDialogVisible" :title="areaForm.id ? '编辑责任区' : '新增责任区'" width="700px">
      <el-form :model="areaForm" :rules="areaRules" ref="areaFormRef" label-width="120px">
        <el-form-item label="责任区名称" prop="areaName">
          <el-input v-model="areaForm.areaName" placeholder="请输入责任区名称" style="width: 300px;" />
        </el-form-item>

        <template v-if="!areaForm.id">
          <el-divider content-position="left">卫生点配置</el-divider>

          <div class="points-config">
            <div v-for="(point, index) in areaForm.points" :key="index" class="point-config-item">
              <div class="point-header">
                <span class="point-index">{{ index + 1 }}.</span>
                <el-input
                  v-model="point.pointName"
                  placeholder="卫生点名称"
                  style="width: 180px; margin-right: 8px;"
                />
                <el-button
                  link
                  type="danger"
                  @click="removePoint(index)"
                  :disabled="areaForm.points.length === 1"
                >
                  删除
                </el-button>
              </div>
              <el-input
                v-model="point.workRequirements"
                type="textarea"
                :rows="2"
                placeholder="工作要求及标准"
                style="margin-top: 8px;"
              />
            </div>

            <el-button
              type="primary"
              plain
              @click="addPoint"
              style="width: 100%; margin-top: 12px;"
            >
              <el-icon><Plus /></el-icon>新增卫生点
            </el-button>
          </div>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="areaDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveArea" :loading="savingArea">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="pointDialogVisible" :title="pointForm.id ? '编辑卫生点' : '新增卫生点'" width="500px">
      <el-form :model="pointForm" :rules="pointRules" ref="pointFormRef" label-width="120px">
        <el-form-item label="卫生点名称" prop="pointName">
          <el-input v-model="pointForm.pointName" placeholder="卫生点名称" />
        </el-form-item>
        <el-form-item label="工作要求及标准" prop="workRequirements">
          <el-input
            v-model="pointForm.workRequirements"
            type="textarea"
            :rows="4"
            placeholder="工作要求及标准"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pointDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePoint" :loading="savingPoint">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="assignmentDialogVisible" title="新增岗位责任区分配" width="400px">
      <el-form :model="assignmentForm" :rules="assignmentRules" ref="assignmentFormRef" label-width="120px">
        <el-form-item label="岗位" prop="positionName">
          <el-select v-model="assignmentForm.positionName" placeholder="请选择岗位" style="width: 100%;">
            <el-option v-for="position in positionList" :key="position" :label="position" :value="position" />
          </el-select>
        </el-form-item>
        <el-form-item label="责任区" prop="hygieneAreaIds">
          <el-select
            v-model="assignmentForm.hygieneAreaIds"
            placeholder="请选择责任区"
            multiple
            style="width: 100%;"
          >
            <el-option v-for="area in areaList" :key="area.id" :label="area.area_name" :value="area.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignmentDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveAssignment" :loading="savingAssignment">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="检查详情" width="700px">
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
            {{ row.areaName || currentRecord?.areaName || '-' }}
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
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive, watch } from 'vue';
import { useUserStore } from '@/store/user';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '@/api/request';
import dayjs from 'dayjs';
import { Plus, Download } from '@element-plus/icons-vue';
import * as XLSX from 'xlsx';
import {
  getHygieneAreas,
  createHygieneArea,
  updateHygieneArea,
  deleteHygieneArea,
  getHygienePoints,
  createHygienePoint,
  updateHygienePoint,
  deleteHygienePoint,
  getHygienePositionAreas,
  createHygienePositionArea,
  deleteHygienePositionArea
} from '@/api/hygieneManagement';
import { getPositionNames } from '@/api/positionJob';

const userStore = useUserStore();
const uploadRef = ref(null);
const uploadUrl = computed(() => `${import.meta.env.VITE_API_BASE_URL}/upload`);
const uploadHeaders = computed(() => ({
  Authorization: userStore.token ? `Bearer ${userStore.token}` : ''
}));

const activeTab = ref('inspection');
const managementTab = ref('areas');

const loadingInspection = ref(false);
const submittingInspection = ref(false);
const inspectionDialogVisible = ref(false);
const inspectionFormRef = ref(null);
const inspectionList = ref([]);
const stationList = ref([]);
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

const loadingAreas = ref(false);
const areaList = ref([]);
const areaSearch = ref({
  stationName: '',
  areaName: ''
});
const areaDialogVisible = ref(false);
const pointDialogVisible = ref(false);
const areaFormRef = ref(null);
const pointFormRef = ref(null);
const savingArea = ref(false);
const savingPoint = ref(false);
const assignmentSearch = ref({
  stationName: '',
  positionName: '',
  areaName: ''
});

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

const loadAreas = async (stationId) => {
  loadingAreas.value = true;
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

    areaList.value = areasWithPoints;
  } catch (e) {
    ElMessage.error(e.message || '加载责任区失败');
  } finally {
    loadingAreas.value = false;
  }
};

const handleStationChange = async (stationId) => {
  inspectionForm.value.selectedAreaIds = [];
  inspectionForm.value.inspectedUserId = null;
  inspectionForm.value.positionName = '';
  inspectionForm.value.areas = [];
  todayUsers.value = [];

  if (!stationId) return;

  await loadAreas(stationId);

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
      selectedIds.includes(item.hygiene_area_id)
    );

    const positionNames = [...new Set(selectedAssignments.map(item => item.position_name))];

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
      points: (area.points || []).map(point => ({
        ...point,
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
  point.photoList = (fileList || []).map(file => {
    const url = file.url || file.response?.data?.url || file.response?.url || '';
    return { ...file, url };
  });
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
        areaName: area.area_name,
        pointName: point.point_name,
        workRequirements: point.work_requirements || '',
        status: point.checkStatus,
        itemName: point.point_name,
        remark: point.remark || '',
        photoUrls: (point.photoList || []).map(file => file.url).filter(Boolean)
      }))
    );

    const photoUrls = items.flatMap(item => item.photoUrls || []);
    const inspectedUser = todayUsers.value.find(u => u.userId === inspectionForm.value.inspectedUserId);

    const payloadMeta = {
      positionName: inspectionForm.value.positionName,
      areaName: inspectionForm.value.areas.map(a => a.area_name).join(', '),
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

const flattenedAreaPoints = computed(() => {
  const result = [];
  areaList.value.forEach(area => {
    const points = area.points || [];
    const stationName = area.station?.station_name || '-';

    if (points.length === 0) {
      result.push({
        areaId: area.id,
        stationName,
        areaName: area.area_name,
        pointId: null,
        pointName: '-',
        workRequirements: '-',
        rowspan: 1
      });
    } else {
      points.forEach((point, index) => {
        result.push({
          areaId: area.id,
          stationName,
          areaName: area.area_name,
          pointId: point.id,
          pointName: point.point_name,
          workRequirements: point.work_requirements || '-',
          rowspan: index === 0 ? points.length : 0
        });
      });
    }
  });
  return result;
});

const filteredAreaPoints = computed(() => {
  const stationKeyword = areaSearch.value.stationName?.trim().toLowerCase() || '';
  const areaKeyword = areaSearch.value.areaName?.trim().toLowerCase() || '';

  const filtered = flattenedAreaPoints.value.filter(row => {
    const stationName = (row.stationName || '').toLowerCase();
    const areaName = (row.areaName || '').toLowerCase();
    const matchStation = stationKeyword ? stationName.includes(stationKeyword) : true;
    const matchArea = areaKeyword ? areaName.includes(areaKeyword) : true;
    return matchStation && matchArea;
  });

  const groupCounts = new Map();
  filtered.forEach(row => {
    const key = `${row.stationName}__${row.areaName}`;
    groupCounts.set(key, (groupCounts.get(key) || 0) + 1);
  });

  const seen = new Set();
  return filtered.map(row => {
    const key = `${row.stationName}__${row.areaName}`;
    if (seen.has(key)) {
      return { ...row, rowspan: 0 };
    }
    seen.add(key);
    return { ...row, rowspan: groupCounts.get(key) || 1 };
  });
});

const areaNameOptions = computed(() => {
  const names = new Set();
  areaList.value.forEach(area => {
    if (area?.area_name) names.add(area.area_name);
  });
  return Array.from(names);
});

const spanMethod = ({ row, columnIndex }) => {
  if (columnIndex === 0 || columnIndex === 1) {
    if (row.rowspan > 0) {
      return { rowspan: row.rowspan, colspan: 1 };
    }
    return { rowspan: 0, colspan: 0 };
  }
  return { rowspan: 1, colspan: 1 };
};

const areaForm = ref({
  id: null,
  areaName: '',
  points: [{ pointName: '', workRequirements: '' }]
});

const pointForm = ref({
  id: null,
  pointName: '',
  workRequirements: '',
  areaId: null
});

const areaRules = {
  areaName: [{ required: true, message: '请输入责任区名称', trigger: 'blur' }]
};

const pointRules = {
  pointName: [{ required: true, message: '请输入卫生点名称', trigger: 'blur' }],
  workRequirements: [{ required: true, message: '请输入工作要求及标准', trigger: 'blur' }]
};

const showAddAreaDialog = () => {
  areaForm.value = {
    id: null,
    areaName: '',
    points: [{ pointName: '', workRequirements: '' }]
  };
  areaDialogVisible.value = true;
};

const editPoint = (row) => {
  if (!row.pointId) {
    ElMessage.warning('请选择要编辑的卫生点');
    return;
  }
  pointForm.value = {
    id: row.pointId,
    pointName: row.pointName,
    workRequirements: row.workRequirements === '-' ? '' : row.workRequirements,
    areaId: row.areaId
  };
  pointDialogVisible.value = true;
};

const addPoint = () => {
  areaForm.value.points.push({ pointName: '', workRequirements: '' });
};

const removePoint = (index) => {
  areaForm.value.points.splice(index, 1);
};

const saveArea = async () => {
  await areaFormRef.value.validate();

  if (!areaForm.value.id) {
    if (areaForm.value.points.length === 0) {
      ElMessage.warning('请至少添加一个卫生点');
      return;
    }

    const hasEmptyPoint = areaForm.value.points.some(
      p => !p.pointName || !p.workRequirements
    );
    if (hasEmptyPoint) {
      ElMessage.warning('请填写完整的卫生点名称和工作要求');
      return;
    }
  }

  savingArea.value = true;
  try {
    if (areaForm.value.id) {
      await updateHygieneArea(areaForm.value.id, {
        areaName: areaForm.value.areaName
      });
      ElMessage.success('更新成功');
    } else {
      await createHygieneArea({
        stationId: userStore.currentStationId,
        areaName: areaForm.value.areaName,
        points: areaForm.value.points
      });
      ElMessage.success('新增成功');
    }
    areaDialogVisible.value = false;
    loadAreas();
  } catch (e) {
    ElMessage.error(e.message || '保存失败');
  } finally {
    savingArea.value = false;
  }
};

const deleteArea = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除该责任区吗？删除后相关卫生点也会被删除。', '提示', {
      type: 'warning'
    });

    await deleteHygieneArea(id);
    ElMessage.success('删除成功');
    loadAreas();
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '删除失败');
    }
  }
};

const savePoint = async () => {
  await pointFormRef.value.validate();
  savingPoint.value = true;

  try {
    await updateHygienePoint(pointForm.value.id, {
      pointName: pointForm.value.pointName,
      workRequirements: pointForm.value.workRequirements
    });
    ElMessage.success('更新成功');
    pointDialogVisible.value = false;
    loadAreas();
  } catch (e) {
    ElMessage.error(e.message || '保存失败');
  } finally {
    savingPoint.value = false;
  }
};

const deletePoint = async (id, areaId) => {
  if (!id) {
    ElMessage.warning('未找到卫生点');
    return;
  }

  try {
    const area = areaList.value.find(item => item.id === areaId);
    const isLastPoint = area && area.points && area.points.length === 1;
    const confirmMessage = isLastPoint
      ? '这是该责任区的最后一个卫生点，删除后将同时删除责任区，是否继续？'
      : '确定删除该卫生点吗？';

    await ElMessageBox.confirm(confirmMessage, '提示', { type: 'warning' });
    await deleteHygienePoint(id);

    if (isLastPoint) {
      await deleteHygieneArea(areaId);
      ElMessage.success('已删除卫生点及责任区');
    } else {
      ElMessage.success('删除成功');
    }
    loadAreas();
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '删除失败');
    }
  }
};

const downloadTemplate = () => {
  const currentStation = userStore.stations?.find(s => s.id === userStore.currentStationId);
  const stationName = currentStation?.station_name || '当前场站';

  const templateData = [
    { '场站': stationName, '责任区': '大门区域', '卫生点': '大门入口', '工作要求及标准': '保持地面清洁' },
    { '场站': stationName, '责任区': '大门区域', '卫生点': '门卫室', '工作要求及标准': '室内整洁，物品摆放有序' },
    { '场站': stationName, '责任区': '办公区', '卫生点': '办公区走廊', '工作要求及标准': '地面干净，墙面无污渍' },
    { '场站': stationName, '责任区': '办公区', '卫生点': '会议室', '工作要求及标准': '室内整洁，物品摆放有序' },
    { '场站': stationName, '责任区': '生产车间', '卫生点': '车间地面', '工作要求及标准': '无油污、无杂物、通道畅通' }
];

  const ws = XLSX.utils.json_to_sheet(templateData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '卫生区域划分');

  ws['!cols'] = [
    { wch: 15 },
    { wch: 15 },
    { wch: 20 },
    { wch: 40 }
  ];

  XLSX.writeFile(wb, '卫生区域划分导入模板.xlsx');
  ElMessage.success('模板下载成功');
};

const handleFileChange = async (file) => {
  const rawFile = file.raw;
  if (!rawFile) return;

  try {
    const data = await readExcelFile(rawFile);
    await importData(data);
  } catch (e) {
    ElMessage.error(e.message || '导入失败');
  }
};

const readExcelFile = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);
      resolve(jsonData);
    } catch (error) {
      reject(new Error('Excel文件解析失败'));
    }
  };
  reader.onerror = () => reject(new Error('文件读取失败'));
  reader.readAsArrayBuffer(file);
});

const importData = async (data) => {
  if (!data || data.length === 0) {
    ElMessage.warning('Excel文件为空');
    return;
  }

  const requiredFields = ['场站', '责任区', '卫生点', '工作要求及标准'];
  const firstRow = data[0];
  const hasAllFields = requiredFields.every(field => field in firstRow);

  if (!hasAllFields) {
    ElMessage.error('Excel格式不正确，请使用下载的模板');
    return;
  }

  const stationNames = [...new Set(data.map(row => row['场站']?.trim()).filter(Boolean))];
  if (stationNames.length === 0) {
    ElMessage.error('未检测到场站名称');
    return;
  }
  if (stationNames.length > 1) {
    ElMessage.error('导入文件包含多个场站，请拆分后再导入');
    return;
  }

  const stationName = stationNames[0];

  let stations = [];
  try {
    const res = await request.get('/stations/all');
    stations = res || [];
  } catch (e) {
    ElMessage.error('加载场站列表失败');
    return;
  }

  const station = stations.find(item => item.station_name === stationName);
  if (!station) {
    ElMessage.error(`未找到场站：${stationName}`);
    return;
  }

  const stationId = station.id;
  const areaMap = new Map();

  data.forEach(row => {
    const rowStationName = row['场站']?.trim();
    const areaName = row['责任区']?.trim();
    const pointName = row['卫生点']?.trim();
    const workRequirements = row['工作要求及标准']?.trim();

    if (rowStationName !== stationName) return;
    if (!areaName || !pointName || !workRequirements) return;

    if (!areaMap.has(areaName)) {
      areaMap.set(areaName, []);
    }
    areaMap.get(areaName).push({
      pointName,
      workRequirements
    });
  });

  if (areaMap.size === 0) {
    ElMessage.warning('没有可导入的有效数据');
    return;
  }

  const loading = ElMessage({
    message: `正在导入数据到场站 ${stationName}...`,
    duration: 0,
    type: 'info'
  });

  let successCount = 0;
  let failCount = 0;

  try {
    for (const [areaName, points] of areaMap.entries()) {
      try {
        await createHygieneArea({
          stationId,
          areaName,
          points
        });
        successCount += 1;
      } catch (e) {
        failCount += 1;
      }
    }

    loading.close();
    if (failCount === 0) {
      ElMessage.success(`导入成功！共导入 ${successCount} 个责任区到场站${stationName}`);
    } else {
      ElMessage.warning(`导入完成！成功 ${successCount} 个，失败 ${failCount} 个`);
    }

    loadAreas();
  } catch (e) {
    loading.close();
    ElMessage.error('导入失败');
  }
};

const loadingAssignments = ref(false);
const assignmentList = ref([]);
const positionList = ref([]);
const assignmentDialogVisible = ref(false);
const assignmentFormRef = ref(null);
const savingAssignment = ref(false);

const filteredAssignmentList = computed(() => {
  const stationKeyword = assignmentSearch.value.stationName?.trim().toLowerCase() || '';
  const positionKeyword = assignmentSearch.value.positionName?.trim().toLowerCase() || '';
  const areaKeyword = assignmentSearch.value.areaName?.trim().toLowerCase() || '';

  return assignmentList.value.filter(row => {
    const stationName = (row.station?.station_name || '').toLowerCase();
    const positionName = (row.position_name || '').toLowerCase();
    const areaName = (row.area?.area_name || '').toLowerCase();
    const matchStation = stationKeyword ? stationName.includes(stationKeyword) : true;
    const matchPosition = positionKeyword ? positionName.includes(positionKeyword) : true;
    const matchArea = areaKeyword ? areaName.includes(areaKeyword) : true;
    return matchStation && matchPosition && matchArea;
  });
});

const assignmentAreaNameOptions = computed(() => {
  const names = new Set();
  assignmentList.value.forEach(row => {
    const areaName = row.area?.area_name;
    if (areaName) names.add(areaName);
  });
  return Array.from(names);
});

const assignmentForm = ref({
  positionName: '',
  hygieneAreaIds: []
});

const assignmentRules = {
  positionName: [{ required: true, message: '请选择岗位', trigger: 'change' }],
  hygieneAreaIds: [
    { required: true, type: 'array', min: 1, message: '请至少选择一个责任区', trigger: 'change' }
  ]
};

const loadPositions = async () => {
  try {
    const res = await getPositionNames({
      stationId: userStore.currentStationId
    });
    positionList.value = res || [];
  } catch (e) {
    ElMessage.error('加载岗位列表失败');
  }
};

const loadAssignments = async () => {
  loadingAssignments.value = true;
  try {
    const res = await getHygienePositionAreas({
      stationId: userStore.currentStationId
    });
    assignmentList.value = res || [];
  } catch (e) {
    ElMessage.error('加载分配列表失败');
  } finally {
    loadingAssignments.value = false;
  }
};

const showAddAssignmentDialog = () => {
  assignmentForm.value = {
    positionName: '',
    hygieneAreaIds: []
  };
  assignmentDialogVisible.value = true;
};

const saveAssignment = async () => {
  await assignmentFormRef.value.validate();
  savingAssignment.value = true;

  try {
    const promises = assignmentForm.value.hygieneAreaIds.map(areaId =>
      createHygienePositionArea({
        stationId: userStore.currentStationId,
        positionName: assignmentForm.value.positionName,
        hygieneAreaId: areaId
      })
    );

    await Promise.all(promises);
    ElMessage.success(`分配成功，共分配 ${assignmentForm.value.hygieneAreaIds.length} 个责任区`);
    assignmentDialogVisible.value = false;
    loadAssignments();
  } catch (e) {
    ElMessage.error(e.message || '分配失败');
  } finally {
    savingAssignment.value = false;
  }
};

const deleteAssignment = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除该分配吗？', '提示', {
      type: 'warning'
    });

    await deleteHygienePositionArea(id);
    ElMessage.success('删除成功');
    loadAssignments();
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '删除失败');
    }
  }
};

onMounted(() => {
  loadInspectionList();
  loadStations();
  loadAreas();
  loadPositions();
  loadAssignments();
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

  .area-division-panel {
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

    .panel-filters {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
  }

  .assignment-panel {
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
    }

    .panel-filters {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
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

  .points-config {
    padding: 0 12px;

    .point-config-item {
      padding: 16px;
      background: #f5f7fa;
      border-radius: 4px;
      margin-bottom: 12px;

      .point-header {
        display: flex;
        align-items: center;
        margin-bottom: 8px;

        .point-index {
          font-weight: 500;
          color: #606266;
          margin-right: 12px;
          min-width: 20px;
        }
      }
    }
  }
}
</style>
