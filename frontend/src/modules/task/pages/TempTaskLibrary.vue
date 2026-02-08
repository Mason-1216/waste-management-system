<template>
  <div class="temp-task-library-page">
    <div class="page-header">
      <h2>临时工作任务汇总表</h2>
      <div class="header-actions" v-if="canManage">
        <el-button
          type="danger"
          :disabled="selectedRows.length === 0"
          @click="batchDelete"
        >
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
        <el-button type="primary" @click="showDialog()">
          <el-icon><Plus /></el-icon>新增任务
        </el-button>
        <el-button type="success" @click="triggerImport">
          <el-icon><Download /></el-icon>批量导入
        </el-button>
        <el-button type="info" @click="downloadTemplate">
          <el-icon><Download /></el-icon>下载模板
        </el-button>
      </div>
    </div>

    <input
      ref="fileInputRef"
      type="file"
      accept=".xlsx,.xls"
      style="display: none;"
      @change="handleImport"
    />

    <el-card class="filter-card">
      <FilterBar>
        <div class="filter-item">
          <span class="filter-label">场站</span>
          <FilterSelect
            v-model="filters.stationId"
            placeholder="全部"
            clearable
            filterable
            style="width: 160px"
            @change="handleSearch"
            @clear="handleSearch"
          >
            <el-option label="全部" value="all" />
            <el-option
              v-for="station in stationOptions"
              :key="station.id"
              :label="station.name"
              :value="station.id"
            />
          </FilterSelect>
        </div>
        <div class="filter-item">
          <span class="filter-label">任务名称</span>
          <FilterAutocomplete
            v-model="filters.keyword"
            :fetch-suggestions="fetchTaskNameSuggestions"
            trigger-on-focus
            placeholder="全部"
            clearable
            style="width: 160px"
            @select="handleSearch"
            @input="handleSearch"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">任务类别</span>
          <FilterAutocomplete
            v-model="filters.taskCategory"
            :fetch-suggestions="fetchTaskCategorySuggestions"
            trigger-on-focus
            placeholder="全部"
            clearable
            style="width: 160px"
            @select="handleSearch"
            @input="handleSearch"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">给分方式</span>
          <FilterSelect
            v-model="filters.scoreMethod"
            placeholder="全部"
            clearable
            filterable
            style="width: 160px"
            @change="handleSearch"
            @clear="handleSearch"
          >
            <el-option label="全部" value="all" />
            <el-option
              v-for="option in scoreMethodOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </FilterSelect>
        </div>
        <div class="filter-item">
          <span class="filter-label">数量是否可修改</span>
          <FilterSelect
            v-model="filters.quantityEditable"
            placeholder="全部"
            clearable
            filterable
            style="width: 160px"
            @change="handleSearch"
            @clear="handleSearch"
          >
            <el-option
              v-for="option in yesNoOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </FilterSelect>
        </div>
        <div class="filter-item">
          <span class="filter-label">派发任务是否强制审核</span>
          <FilterSelect
            v-model="filters.dispatchReviewRequired"
            placeholder="全部"
            clearable
            filterable
            style="width: 160px"
            @change="handleSearch"
            @clear="handleSearch"
          >
            <el-option
              v-for="option in yesNoOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </FilterSelect>
        </div>
      </FilterBar>
    </el-card>

    <!-- 任务表格 -->
    <TableWrapper v-loading="loading">
      <el-table
        ref="tableRef"
        :data="flattenedTableData"
        stripe
        border
        :row-key="rowKey"
        :span-method="spanMethod"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="48" />
        <el-table-column prop="stationName" label="场站" width="150">
          <template #default="{ row }">
            {{ row.stationName || '通用' }}
          </template>
        </el-table-column>
        <el-table-column prop="taskName" label="任务名称" width="180" />
        <el-table-column prop="taskCategory" label="任务类别" width="120">
          <template #default="{ row }">
            {{ row.taskCategory || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="scoreMethod" label="给分方式" width="120">
          <template #default="{ row }">
            {{ row.scoreMethod || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="taskContent" label="具体工作内容" min-width="250" show-overflow-tooltip />
        <el-table-column prop="standardHours" label="标准工时(h/d)" width="130">
          <template #default="{ row }">
            {{ row.standardHours }}
          </template>
        </el-table-column>
        <el-table-column prop="unitPoints" label="单位积分" width="100" />
        <el-table-column prop="quantity" label="数量" width="90" />
        <el-table-column prop="pointsRule" label="积分规则" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.pointsRule || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="unitPointsEditable" label="单位积分是否可修改" width="160">
          <template #default="{ row }">
            <el-tag :type="row.unitPointsEditable === 1 ? 'success' : 'info'">
              {{ row.unitPointsEditable === 1 ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="quantityEditable" label="数量是否可修改" width="140">
          <template #default="{ row }">
            <el-tag :type="row.quantityEditable === 1 ? 'success' : 'info'">
              {{ row.quantityEditable === 1 ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dispatchReviewRequired" label="派发任务是否强制审核" width="170">
          <template #default="{ row }">
            <el-tag :type="row.dispatchReviewRequired === 1 ? 'warning' : 'info'">
              {{ row.dispatchReviewRequired === 1 ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" v-if="canManage">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="showAssignDialog(row)">
              分配任务
            </el-button>
            <el-button link type="primary" size="small" @click="showDialog(row)">
              编辑
            </el-button>
            <el-button link type="danger" size="small" @click="deleteTask(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="!loading && taskList.length === 0" class="empty-wrapper">
        <el-empty description="暂无任务数据">
          <el-button v-if="canManage" type="primary" @click="showDialog()">
            新建任务
          </el-button>
        </el-empty>
      </div>
    </TableWrapper>

    <!-- 分页 -->
    <div class="pagination-wrapper" v-if="pagination.total > 0">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[5, 10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @current-change="loadTaskLibrary"
        @size-change="loadTaskLibrary"
      />
    </div>

    <!-- 新建/编辑对话框 -->
    <FormDialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑任务' : '新建任务'"
      width="760px"
      destroy-on-close
      :confirm-text="'保存'"
      :cancel-text="'取消'"
      :confirm-loading="saving"
      @confirm="saveTask"
    >
      <el-form
        :model="form"
        :rules="rules"
        ref="formRef"
        label-width="100px"
      >
        <el-form-item label="场站" prop="stationId">
          <el-select
            v-model="form.stationId"
            placeholder="通用"
            clearable
            filterable
            style="width: 100%;"
          >
            <el-option label="通用" :value="null" />
            <el-option
              v-for="station in stationOptions"
              :key="station.id"
              :label="station.name"
              :value="station.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="任务名称" prop="taskName">
          <el-input v-model="form.taskName" placeholder="请输入任务名称" maxlength="100" />
        </el-form-item>
        <el-form-item label="任务类别" prop="taskCategory">
          <el-input v-model="form.taskCategory" placeholder="请输入任务类别" maxlength="50" />
        </el-form-item>
        <el-form-item label="给分方式" prop="scoreMethod">
          <el-select v-model="form.scoreMethod" placeholder="请选择给分方式" style="width: 100%;">
            <el-option
              v-for="option in scoreMethodOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="具体工作内容" prop="taskContent">
          <el-input
            v-model="form.taskContent"
            type="textarea"
            :rows="4"
            placeholder="请详细描述工作内容"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="标准工时(h/d)" prop="standardHours">
          <el-input-number
            v-model="form.standardHours"
            :min="0.5"
            :max="24"
            :step="0.5"
            :precision="1"
          />
          <span class="form-hint">每天预计工作时长</span>
        </el-form-item>
        <el-form-item label="单位积分" prop="unitPoints">
          <el-input-number
            v-model="form.unitPoints"
            :min="0"
            :max="9999"
            :step="1"
          />
          <span class="form-hint">每个任务单位积分</span>
        </el-form-item>
        <el-form-item label="单位积分是否可修改" prop="unitPointsEditable">
          <el-radio-group v-model="form.unitPointsEditable">
            <el-radio :label="1">是</el-radio>
            <el-radio :label="0">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number
            v-model="form.quantity"
            :min="1"
            :max="1000"
            :step="1"
          />
        </el-form-item>
        <el-form-item label="积分规则" prop="pointsRule">
          <el-input
            v-model="form.pointsRule"
            type="textarea"
            :rows="3"
            placeholder="请输入积分规则"
            maxlength="300"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="数量是否可修改" prop="quantityEditable">
          <el-radio-group v-model="form.quantityEditable">
            <el-radio :label="1">是</el-radio>
            <el-radio :label="0">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="派发任务是否强制审核" prop="dispatchReviewRequired">
          <el-radio-group v-model="form.dispatchReviewRequired">
            <el-radio :label="1">是</el-radio>
            <el-radio :label="0">否</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </FormDialog>

    <FormDialog
      v-model="assignDialogVisible"
      title="分配任务"
      width="600px"
      destroy-on-close
      :confirm-text="'确定分配'"
      :cancel-text="'取消'"
      :confirm-loading="assigning"
      @confirm="submitAssign"
    >
      <el-form :model="assignForm" :rules="assignRules" ref="assignFormRef" label-width="120px">
        <el-form-item label="工作名称" prop="taskLibraryId">
          <el-select
            v-model="assignForm.taskLibraryId"
            placeholder="请选择工作名称"
            @change="handleTaskLibraryChange"
            style="width: 100%;"
            filterable
          >
            <el-option
              v-for="lib in assignTaskLibraryOptions"
              :key="lib.id"
              :label="lib.taskName"
              :value="lib.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="工作内容">
          <el-input
            v-model="assignForm.taskContent"
            type="textarea"
            :rows="3"
            placeholder="选择工作名称后自动填充"
            readonly
          />
        </el-form-item>
        <el-form-item label="执行人" prop="executorId">
          <el-select
            v-model="assignForm.executorId"
            placeholder="请选择今日上岗人员"
            style="width: 100%;"
            filterable
          >
            <el-option
              v-for="user in todayScheduledUsers"
              :key="user.userId"
              :label="`${user.userName} (${user.positionName || '未知岗位'})`"
              :value="user.userId"
            />
          </el-select>
          <div class="form-hint" v-if="todayScheduledUsers.length === 0">
            今日暂无排班人员
          </div>
        </el-form-item>
        <el-form-item label="计划工作日期" prop="planStartDate">
          <el-col :span="11">
            <el-date-picker
              v-model="assignForm.planStartDate"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
              style="width: 100%;"
            />
          </el-col>
          <el-col :span="2" style="text-align: center;">-</el-col>
          <el-col :span="11">
            <el-time-picker
              v-model="assignForm.planStartTime"
              placeholder="选择时间"
              format="HH:mm"
              value-format="HH:mm"
              style="width: 100%;"
            />
          </el-col>
        </el-form-item>
        <el-form-item label="截止工作日期" prop="planEndDate">
          <el-col :span="11">
            <el-date-picker
              v-model="assignForm.planEndDate"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
              style="width: 100%;"
            />
          </el-col>
          <el-col :span="2" style="text-align: center;">-</el-col>
          <el-col :span="11">
            <el-time-picker
              v-model="assignForm.planEndTime"
              placeholder="选择时间"
              format="HH:mm"
              value-format="HH:mm"
              style="width: 100%;"
            />
          </el-col>
        </el-form-item>
        <el-form-item label="标准工时(h/d)">
          <el-input-number
            v-model="assignForm.standardHours"
            :min="0.5"
            :max="24"
            :step="0.5"
            :precision="1"
            disabled
          />
          <span class="form-hint">任务汇总表关联自动填入</span>
        </el-form-item>
        <el-form-item label="单位积分">
          <el-input-number
            v-model="assignForm.unitPoints"
            :min="0"
            :max="9999"
            disabled
          />
          <span class="form-hint">任务汇总表关联自动填入</span>
        </el-form-item>
      </el-form>
    </FormDialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import dayjs from 'dayjs';
import { Plus, Search, Download, Edit, Delete, Clock, Star, InfoFilled } from '@element-plus/icons-vue';

import FilterBar from '@/components/common/FilterBar.vue';
import { addTemplateInstructionSheet, applyTemplateHeaderStyle } from '@/utils/excelTemplate';
import request from '@/api/request';
import { useUserStore } from '@/store/modules/user';
import FormDialog from '@/components/system/FormDialog.vue';
import { createListSuggestionFetcher } from '@/utils/filterAutocomplete';

const userStore = useUserStore();

// 状态
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const taskList = ref([]);
const taskSuggestionList = ref([]);
const formRef = ref(null);
const tableRef = ref(null);
const currentId = ref(null);
const fileInputRef = ref(null);
const stationOptions = ref([]);
const selectedRows = ref([]);
const assigning = ref(false);
const assignDialogVisible = ref(false);
const todayScheduledUsers = ref([]);
const assignTaskLibraryOptions = ref([]);
const assignFormRef = ref(null);

const fetchTaskNameSuggestions = createListSuggestionFetcher(
  () => taskSuggestionList.value,
  (row) => row.taskName
);

const fetchTaskCategorySuggestions = createListSuggestionFetcher(
  () => taskSuggestionList.value,
  (row) => row.taskCategory
);

// 扁平化表格数据，按场站分组
const flattenedTableData = computed(() => {
  const data = taskList.value || [];
  if (data.length === 0) return [];

  // 按场站分组
  const groupMap = new Map();
  data.forEach(item => {
    const stationName = item.station?.stationName || item.station?.station_name || '通用';
    const groupKey = stationName;

    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, {
        stationName,
        items: []
      });
    }
    groupMap.get(groupKey).items.push(item);
  });

  // 展开为行数据
  const rows = [];
  groupMap.forEach(group => {
    const rowCount = group.items.length;
    group.items.forEach((item, index) => {
      rows.push({
        ...item,
        stationName: group.stationName,
        _rowspan: index === 0 ? rowCount : 0,
        _rowKey: item.id ?? `row-${group.stationName}-${index}`
      });
    });
  });

  return rows;
});

// 单元格合并方法：场站列合并
const spanMethod = ({ row, columnIndex }) => {
  // 列索引：0-选择框 1-场站 需要合并
  if (columnIndex !== 1) return;
  if (row._rowspan > 0) {
    return { rowspan: row._rowspan, colspan: 1 };
  }
  return { rowspan: 0, colspan: 0 };
};

const rowKey = (row) => row._rowKey ?? row.id;

// 筛选
const filters = ref({
  keyword: '',
  stationId: 'all',
  taskCategory: '',
  scoreMethod: 'all',
  quantityEditable: 'all',
  dispatchReviewRequired: 'all'
});

// 分页
const pagination = ref({
  page: 1,
  pageSize: 5,
  total: 0
});

// 表单
const form = ref({
  stationId: null,
  taskName: '',
  taskCategory: '',
  scoreMethod: '',
  taskContent: '',
  standardHours: 1,
  unitPoints: 10,
  unitPointsEditable: 1,
  quantity: 1,
  pointsRule: '',
  quantityEditable: 0,
  dispatchReviewRequired: 0
});

const scoreMethodOptions = [
  { label: '奖扣结合式', value: '奖扣结合式' },
  { label: '奖分项', value: '奖分项' },
  { label: '扣分项', value: '扣分项' }
];
const yesNoOptions = [
  { label: '全部', value: 'all' },
  { label: '是', value: '1' },
  { label: '否', value: '0' }
];

// 表单验证规则
const rules = {
  taskName: [
    { required: true, message: '请输入任务名称', trigger: 'blur' },
    { max: 100, message: '任务名称不能超过100个字符', trigger: 'blur' }
  ],
  taskContent: [
    { required: true, message: '请输入具体工作内容', trigger: 'blur' }
  ],
  standardHours: [
    { required: true, message: '请输入标准工时', trigger: 'change' }
  ],
  unitPoints: [
    { required: true, message: '请输入单位积分', trigger: 'change' }
  ],
  quantity: [
    { required: true, message: '请输入数量', trigger: 'change' }
  ]
};

// 权限判断：站长、部门经理、部门副经理
const canManage = computed(() => {
  return userStore.hasRole(['station_manager', 'department_manager', 'deputy_manager']);
});
const currentStationId = computed(() => userStore.currentStationId || userStore.stations?.[0]?.id);

const assignForm = ref({
  taskLibraryId: null,
  taskName: '',
  taskContent: '',
  executorId: null,
  executorName: '',
  planStartDate: '',
  planStartTime: '',
  planEndDate: '',
  planEndTime: '',
  standardHours: 1,
  unitPoints: 10,
  unitPointsEditable: 1,
  quantity: 1
});

const assignRules = {
  taskLibraryId: [{ required: true, message: '请选择工作名称', trigger: 'change' }],
  executorId: [{ required: true, message: '请选择执行人', trigger: 'change' }],
  planStartDate: [{ required: true, message: '请选择计划工作日期', trigger: 'change' }],
  planEndDate: [{ required: true, message: '请选择截止工作日期', trigger: 'change' }]
};

const normalizeTaskLibraryItem = (item) => ({
  id: item.id,
  taskName: item.task_name,
  taskContent: item.task_content,
  taskCategory: item.task_category || '',
  scoreMethod: item.score_method || '',
  standardHours: item.standard_hours,
  quantity: item.quantity ?? 1,
  unitPoints: item.unit_points ?? 0,
  unitPointsEditable: Number(item.unit_points_editable) === 1 ? 1 : 0,
  pointsRule: item.points_rule || item.task_content || '',
  quantityEditable: Number(item.quantity_editable) === 1 ? 1 : 0,
  dispatchReviewRequired: Number(item.dispatch_review_required) === 1 ? 1 : 0,
  stationId: item.station_id,
  station: item.station,
  createdBy: item.created_by,
  createdByName: item.created_by_name || item.creator?.real_name
});

// 加载任务汇总表列表
const loadTaskLibrary = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      stationId: filters.value.stationId === 'all' ? undefined : filters.value.stationId,
      keyword: filters.value.keyword?.trim() || undefined,
      taskCategory: filters.value.taskCategory?.trim() || undefined,
      scoreMethod: filters.value.scoreMethod === 'all' ? undefined : filters.value.scoreMethod,
      quantityEditable: filters.value.quantityEditable === 'all' ? undefined : filters.value.quantityEditable,
      dispatchReviewRequired: filters.value.dispatchReviewRequired === 'all' ? undefined : filters.value.dispatchReviewRequired
    };
    const res = await request.get('/temporary-task-library', { params });
    const list = Array.isArray(res.list) ? res.list : [];
    taskList.value = list.map(normalizeTaskLibraryItem);
    pagination.value.total = res.total || 0;
    loadTaskLibrarySuggestions(params);
    selectedRows.value = [];
    tableRef.value?.clearSelection();
  } catch (e) {
    
    ElMessage.error('加载任务汇总表失败');
  } finally {
    loading.value = false;
  }
};

const loadTaskLibrarySuggestions = async (baseParams) => {
  try {
    const params = {
      ...baseParams,
      page: 1,
      pageSize: 5000
    };
    const res = await request.get('/temporary-task-library', { params });
    const list = Array.isArray(res.list) ? res.list : [];
    taskSuggestionList.value = list.map(normalizeTaskLibraryItem);
  } catch (e) {
    taskSuggestionList.value = [];
  }
};

const handleSelectionChange = (rows) => {
  selectedRows.value = rows || [];
};

const batchDelete = async () => {
  if (selectedRows.value.length === 0) return;
  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${selectedRows.value.length} 条任务吗？`,
      '批量删除',
      { type: 'warning' }
    );
  } catch (e) {
    return;
  }

  const ids = selectedRows.value.map(row => row.id).filter(Boolean);
  if (ids.length === 0) return;

  try {
    const results = await Promise.allSettled(
      ids.map(id => request.delete(`/temporary-task-library/${id}`))
    );
    const successCount = results.filter(item => item.status === 'fulfilled').length;
    const failedCount = results.length - successCount;
    if (successCount > 0) {
      ElMessage.success(`已删除 ${successCount} 条任务`);
    }
    if (failedCount > 0) {
      ElMessage.error(`删除失败 ${failedCount} 条任务`);
    }
    loadTaskLibrary();
  } catch (e) {
    ElMessage.error(e.message || '批量删除失败');
  }
};

const loadStations = async () => {
  try {
    const res = await request.get('/stations/all');
    const list = Array.isArray(res) ? res : (res?.list || []);
    stationOptions.value = list
      .map(station => ({
        id: station.id,
        name: station.station_name || station.stationName || station.name || ''
      }))
      .filter(station => station.name);
  } catch (e) {
    stationOptions.value = [];
  }
};

const resetFilters = () => {
  filters.value.keyword = '';
  filters.value.stationId = 'all';
  filters.value.taskCategory = '';
  filters.value.scoreMethod = 'all';
  filters.value.quantityEditable = 'all';
  filters.value.dispatchReviewRequired = 'all';
};

const handleSearch = () => {
  pagination.value.page = 1;
  loadTaskLibrary();
};

const loadTodayScheduledUsers = async () => {
  try {
    const res = await request.get('/schedules/today', {
      params: { stationId: currentStationId.value }
    });
    todayScheduledUsers.value = res || [];
  } catch (e) {
    todayScheduledUsers.value = [];
  }
};

const loadAssignTaskLibraryOptions = async () => {
  try {
    const res = await request.get('/temporary-task-library', {
      params: { page: 1, pageSize: 1000 }
    });
    assignTaskLibraryOptions.value = (res.list || []).map(item => ({
      id: item.id,
      taskName: item.task_name,
      taskContent: item.task_content,
      standardHours: item.standard_hours,
      unitPoints: item.unit_points ?? 0,
      unitPointsEditable: Number(item.unit_points_editable) === 1 ? 1 : 0,
      quantity: item.quantity ?? 1
    }));
  } catch (e) {
    assignTaskLibraryOptions.value = [];
  }
};

const handleTaskLibraryChange = (libraryId) => {
  const item = assignTaskLibraryOptions.value.find(lib => lib.id === libraryId);
  if (!item) return;
  assignForm.value.taskName = item.taskName;
  assignForm.value.taskContent = item.taskContent;
  assignForm.value.standardHours = parseFloat(item.standardHours) || 1;
  assignForm.value.unitPoints = item.unitPoints ?? 10;
  assignForm.value.unitPointsEditable = item.unitPointsEditable ?? 1;
  assignForm.value.quantity = item.quantity ?? 1;
};

const showAssignDialog = async (task = null) => {
  const today = dayjs().format('YYYY-MM-DD');
  assignForm.value = {
    taskLibraryId: null,
    taskName: '',
    taskContent: '',
    executorId: null,
    executorName: '',
    planStartDate: today,
    planStartTime: '08:00',
    planEndDate: today,
    planEndTime: '17:00',
    standardHours: 1,
    unitPoints: 10,
    unitPointsEditable: 1,
    quantity: 1
  };
  await loadAssignTaskLibraryOptions();
  await loadTodayScheduledUsers();
  if (task?.id) {
    const taskId = Number(task.id);
    const matched = assignTaskLibraryOptions.value.find(item => Number(item.id) === taskId);
    if (matched) {
      assignForm.value.taskLibraryId = matched.id;
      handleTaskLibraryChange(matched.id);
    }
  }
  assignDialogVisible.value = true;
};

const submitAssign = async () => {
  try {
    await assignFormRef.value.validate();
  } catch {
    return;
  }

  assigning.value = true;
  try {
    const executor = todayScheduledUsers.value.find(u => u.userId === assignForm.value.executorId);
    const planStartTime = `${assignForm.value.planStartDate} ${assignForm.value.planStartTime || '08:00'}`;
    const planEndTime = `${assignForm.value.planEndDate} ${assignForm.value.planEndTime || '17:00'}`;

    await request.post('/temporary-tasks', {
      taskName: assignForm.value.taskName,
      taskDescription: assignForm.value.taskContent,
      taskType: 'temporary',
      executorId: assignForm.value.executorId,
      executorName: executor?.userName || '',
      stationId: currentStationId.value,
      planStartTime,
      planEndTime,
      standardHours: assignForm.value.standardHours,
      unitPoints: assignForm.value.unitPoints,
      unitPointsEditable: assignForm.value.unitPointsEditable,
      quantity: assignForm.value.quantity
    });
    ElMessage.success('任务分配成功');
    assignDialogVisible.value = false;
  } catch (e) {
    ElMessage.error(e.message || '分配失败');
  } finally {
    assigning.value = false;
  }
};

// 显示对话框
const showDialog = (item = null) => {
  if (item) {
    isEdit.value = true;
    currentId.value = item.id;
    form.value = {
      stationId: item.stationId ?? null,
      taskName: item.taskName,
      taskCategory: item.taskCategory || '',
      scoreMethod: item.scoreMethod || '',
      taskContent: item.taskContent,
      standardHours: parseFloat(item.standardHours) || 1,
      unitPoints: item.unitPoints ?? 10,
      unitPointsEditable: item.unitPointsEditable ?? 1,
      quantity: item.quantity ?? 1,
      pointsRule: item.pointsRule || '',
      quantityEditable: item.quantityEditable ?? 0,
      dispatchReviewRequired: item.dispatchReviewRequired ?? 0
    };
  } else {
    isEdit.value = false;
    currentId.value = null;
    form.value = {
      stationId: null,
      taskName: '',
      taskCategory: '',
      scoreMethod: '',
      taskContent: '',
      standardHours: 1,
      unitPoints: 10,
      unitPointsEditable: 1,
      quantity: 1,
      pointsRule: '',
      quantityEditable: 0,
      dispatchReviewRequired: 0
    };
  }
  dialogVisible.value = true;
};

// 保存任务
const saveTask = async () => {
  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  saving.value = true;
  try {
    const data = {
      taskName: form.value.taskName,
      taskCategory: form.value.taskCategory || '',
      scoreMethod: form.value.scoreMethod || '',
      taskContent: form.value.taskContent,
      standardHours: form.value.standardHours,
      unitPoints: form.value.unitPoints,
      unitPointsEditable: form.value.unitPointsEditable,
      quantity: form.value.quantity,
      pointsRule: form.value.pointsRule || '',
      quantityEditable: form.value.quantityEditable,
      dispatchReviewRequired: form.value.dispatchReviewRequired,
      stationId: form.value.stationId ?? null
    };

    if (isEdit.value) {
      await request.put(`/temporary-task-library/${currentId.value}`, data);
      ElMessage.success('更新成功');
    } else {
      await request.post('/temporary-task-library', data);
      ElMessage.success('创建成功');
    }

    dialogVisible.value = false;
    loadTaskLibrary();
  } catch (e) {
    
    ElMessage.error(e.message || '保存失败');
  } finally {
    saving.value = false;
  }
};

// 删除任务
const deleteTask = async (item) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除任务"${item.taskName}"吗？`,
      '删除确认',
      { type: 'warning' }
    );

    await request.delete(`/temporary-task-library/${item.id}`);
    ElMessage.success('删除成功');
    loadTaskLibrary();
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

// 下载模板
const downloadTemplate = async () => {
  try {
    const XLSX = await import('xlsx');

    // 参考卫生区域划分模块的模板格式
    const templateData = [
      {
        '场站': '示例场站',
        '任务名称': '场地清扫',
        '任务类别': '环境清洁',
        '给分方式': '奖扣结合式',
        '具体工作内容': '清扫厂区道路及公共区域',
        '标准工时': 2,
        '单位积分': 10,
        '单位积分是否可修改': '是',
        '数量': 1,
        '积分规则': '完成一次计10分',
        '数量是否可修改': '否',
        '派发任务是否强制审核': '是'
      },
      {
        '场站': '示例场站',
        '任务名称': '设备维修',
        '任务类别': '设备维护',
        '给分方式': '奖分项',
        '具体工作内容': '更换破损零部件',
        '标准工时': 4,
        '单位积分': 20,
        '单位积分是否可修改': '否',
        '数量': 1,
        '积分规则': '更换零件按单计分',
        '数量是否可修改': '是',
        '派发任务是否强制审核': '是'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);

    applyTemplateHeaderStyle(XLSX, ws, 1);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '临时工作任务汇总表');
    addTemplateInstructionSheet(XLSX, wb, [
      ['场站', '选填，场站名称；空或“通用”表示通用任务。'],
      ['任务名称', '必填，任务名称。'],
      ['任务类别', '选填。'],
      ['给分方式', '选填，可填写“奖扣结合式/奖分项/扣分项”。'],
      ['具体工作内容', '必填，任务内容描述。'],
      ['标准工时', '必填，数字，单位 h/d。'],
      ['单位积分', '必填，数字。'],
      ['单位积分是否可修改', '选填，填“是/否”。'],
      ['数量', '必填，1-1000 的整数。'],
      ['积分规则', '选填。'],
      ['数量是否可修改', '选填，填“是/否”。'],
      ['派发任务是否强制审核', '选填，填“是/否”。']
    ]);
    XLSX.writeFile(wb, '临时工作任务汇总表导入模板.xlsx');
    ElMessage.success('模板下载成功');
  } catch (error) {
    ElMessage.error('下载模板失败');
  }
};

// 触发导入
const triggerImport = () => {
  fileInputRef.value?.click();
};

// 处理导入
const handleImport = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const XLSX = await import('xlsx');

    const readFile = () => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });

    const arrayBuffer = await readFile();
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      ElMessage.warning('未找到有效数据，请检查文件格式');
      return;
    }

    // 解析数据
    const normalizeYesNo = (value) => {
      const raw = String(value ?? '').trim();
      if (!raw) return 0;
      return raw === '是' || raw.toLowerCase() === 'yes' || raw === '1' ? 1 : 0;
    };
    const resolveStationId = (value) => {
      const raw = String(value ?? '').trim();
      if (!raw || raw === '通用') return null;
      const matched = stationOptions.value.find(item => item.name === raw);
      return matched ? matched.id : (userStore.currentStationId ?? null);
    };
    const tasks = jsonData.map(row => ({
      taskName: String(row['任务名称'] || '').trim(),
      taskCategory: String(row['任务类别'] || '').trim(),
      scoreMethod: String(row['给分方式'] || '').trim(),
      taskContent: String(row['具体工作内容'] || '').trim(),
      standardHours: parseFloat(row['标准工时']) || 1,
      unitPoints: parseInt(row['单位积分']) || 0,
      unitPointsEditable: normalizeYesNo(row['单位积分是否可修改']),
      quantity: parseInt(row['数量']) || 1,
      pointsRule: String(row['积分规则'] || '').trim(),
      quantityEditable: normalizeYesNo(row['数量是否可修改']),
      dispatchReviewRequired: normalizeYesNo(row['派发任务是否强制审核']),
      stationId: resolveStationId(row['场站'])
    })).filter(task => task.taskName && task.taskContent);

    if (tasks.length === 0) {
      ElMessage.warning('未找到有效数据，请检查文件格式');
      return;
    }

    // 批量创建
    let successCount = 0;
    for (const task of tasks) {
      try {
        await request.post('/temporary-task-library', task);
        successCount++;
      } catch (e) {
      }
    }

    ElMessage.success(`导入完成: 成功${successCount}条`);
    loadTaskLibrary();
  } catch (err) {
    ElMessage.error(err.message || '导入失败，请检查文件格式');
  } finally {
    if (fileInputRef.value) {
      fileInputRef.value.value = '';
    }
  }
};

onMounted(() => {
  loadStations();
  loadTaskLibrary();
});

watch(
  () => [filters.value.keyword, filters.value.stationId],
  () => {
    pagination.value.page = 1;
    loadTaskLibrary();
  }
);
</script>

<style lang="scss" scoped>
.temp-task-library-page {
  .report-banner {
    background: #fff;
    border-radius: 8px;
    padding: 24px;
    margin-bottom: 16px;
    border: 1px solid #e4e7ed;
    border-left: 4px solid #f56c6c;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 16px;

    .banner-content {
      display: flex;
      align-items: center;
      gap: 16px;
      flex: 1;
      min-width: 0;
    }

    .banner-icon {
      font-size: 44px;
      color: #f56c6c;
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

  .report-banner--blue {
    border-color: #d9ecff;
    border-left-color: #409eff;

    .banner-icon {
      color: #409eff;
    }
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      margin: 0;
      font-size: 20px;
      color: #303133;
    }

    .header-actions {
      display: flex;
      gap: 10px;
    }
  }

  .filter-bar {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .filter-card {
    margin-bottom: 20px;
  }

  .empty-wrapper {
    padding: 60px 20px;
    text-align: center;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }

  .form-hint {
    margin-left: 12px;
    font-size: 12px;
    color: #909399;
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
}
</style>




