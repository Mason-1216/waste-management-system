<template>
  <div class="temporary-tasks-page">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- Tab 1: 分配临时工作 -->
      <el-tab-pane :label="taskTabLabel" name="tasks">
        <div class="page-header">
          <h2>临时工作列表</h2>
          <div class="actions">
            <el-button type="primary" @click="showAssignDialog" v-if="canAssign">
              <el-icon><Plus /></el-icon>分配任务
            </el-button>
            <el-button @click="loadTasks">刷新</el-button>
          </div>
        </div>

        <FilterBar>
          <el-input
            v-model="filters.taskName"
            placeholder="任务名称"
            clearable
            style="width: 150px;"
            @clear="loadTasks"
            @keyup.enter="loadTasks"
          />
          <el-input
            v-model="filters.assigneeName"
            placeholder="执行人"
            clearable
            style="width: 120px;"
            @clear="loadTasks"
            @keyup.enter="loadTasks"
          />
          <el-select v-model="filters.status" placeholder="状态" clearable style="width: 100px;" @change="loadTasks">
            <el-option label="待处理" value="pending" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
          </el-select>
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px;"
            @change="loadTasks"
          />
          <el-button type="primary" @click="loadTasks">查询</el-button>
        </FilterBar>

        <TableWrapper>
          <el-table :data="taskList" stripe border v-loading="loading">
            <el-table-column prop="taskName" label="工作名称" min-width="150" />
            <el-table-column prop="description" label="具体工作内容" min-width="200" show-overflow-tooltip />
            <el-table-column label="标准工时(h/d)" width="120">
              <template #default="{ row }">
                {{ row.workHours ?? '-' }}
              </template>
            </el-table-column>
            <el-table-column label="积分" width="80">
              <template #default="{ row }">
                {{ row.points ?? '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="assignee.realName" label="执行人" width="100" />
            <el-table-column prop="assigner.realName" label="分配人" width="100" />
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">
                  {{ getStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="deadline" label="截止日期" width="110">
              <template #default="{ row }">
                {{ formatDate(row.deadline) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="viewDetail(row)">查看</el-button>
                <el-button
                  v-if="row.status === 'pending' && row.assigneeId === userStore.userId"
                  link type="success" size="small" @click="startTask(row)"
                >开始</el-button>
                <el-button
                  v-if="row.status === 'in_progress' && row.assigneeId === userStore.userId"
                  link type="warning" size="small" @click="submitTask(row)"
                >完成</el-button>
                <el-button
                  v-if="canAssign && row.status !== 'completed'"
                  link type="danger" size="small" @click="deleteTask(row)"
                >删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </TableWrapper>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @current-change="loadTasks"
            @size-change="loadTasks"
          />
        </div>
      </el-tab-pane>

      <!-- Tab 2: 临时工作任务库 -->
      <el-tab-pane label="临时工作任务库" name="library" v-if="canAssign">
        <div class="page-header">
          <h2>临时工作任务库</h2>
          <div class="actions">
            <el-input
              v-model="libraryFilters.keyword"
              placeholder="搜索任务名称"
              clearable
              style="width: 200px; margin-right: 12px;"
              @clear="handleLibraryKeywordClear"
              @input="handleLibraryKeywordInput"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" @click="showLibraryDialog()">
              <el-icon><Plus /></el-icon>新建任务
            </el-button>
            <el-button
              v-if="canAssign"
              type="danger"
              :disabled="selectedLibraryRows.length === 0"
              @click="batchDeleteLibrary"
            >
              批量删除
            </el-button>
            <el-button @click="downloadTemplate">
              <el-icon><Download /></el-icon>下载模板
            </el-button>
            <el-button type="success" @click="triggerImport">
              <el-icon><Download /></el-icon>导入
            </el-button>
            <input
              ref="fileInputRef"
              type="file"
              accept=".xlsx,.xls"
              style="display: none;"
              @change="handleImport"
            />
            <el-button @click="loadTaskLibrary">刷新</el-button>
          </div>
        </div>

        <div v-loading="libraryLoading" class="library-content">
          <TableWrapper>
            <el-table
              ref="libraryTableRef"
              :data="taskLibraryList"
              stripe
              border
              row-key="id"
              @selection-change="handleLibrarySelectionChange"
            >
              <el-table-column type="selection" width="48" />
              <el-table-column prop="taskName" label="工作名称" min-width="150" />
              <el-table-column prop="taskContent" label="具体工作内容" min-width="200" show-overflow-tooltip />
              <el-table-column prop="standardHours" label="标准工时(h/d)" width="120" align="center" />
              <el-table-column prop="points" label="积分" width="80" align="center" />
              <el-table-column prop="createdByName" label="创建人" width="100" />
              <el-table-column label="操作" width="200">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="quickAssign(row)">
                    快速分配
                  </el-button>
                  <el-button link type="warning" size="small" @click="showLibraryDialog(row)">
                    编辑
                  </el-button>
                  <el-button link type="danger" size="small" @click="deleteLibraryItem(row)">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </TableWrapper>

          <div v-if="!libraryLoading && taskLibraryList.length === 0" class="empty-wrapper">
            <el-empty description="暂无任务模板">
              <el-button type="primary" @click="showLibraryDialog()">新建任务</el-button>
            </el-empty>
          </div>

          <div class="pagination-wrapper" v-if="libraryPagination.total > 0">
            <el-pagination
              v-model:current-page="libraryPagination.page"
              v-model:page-size="libraryPagination.pageSize"
              :total="libraryPagination.total"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next"
              @current-change="loadTaskLibrary"
              @size-change="loadTaskLibrary"
            />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 分配任务对话框 -->
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
              v-for="lib in taskLibraryList"
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
          <span class="form-hint">任务库关联自动填入</span>
        </el-form-item>
        <el-form-item label="积分">
          <el-input-number
            v-model="assignForm.points"
            :min="0"
            :max="9999"
            disabled
          />
          <span class="form-hint">任务库关联自动填入</span>
        </el-form-item>
      </el-form>
    </FormDialog>

    <!-- 任务库编辑对话框 -->
    <FormDialog
      v-model="libraryDialogVisible"
      :title="libraryIsEdit ? '编辑任务' : '新建任务'"
      width="520px"
      destroy-on-close
      :confirm-text="'保存'"
      :cancel-text="'取消'"
      :confirm-loading="librarySaving"
      @confirm="saveLibraryItem"
    >
      <el-form :model="libraryForm" :rules="libraryRules" ref="libraryFormRef" label-width="110px">
        <el-form-item label="工作名称" prop="taskName">
          <el-input v-model="libraryForm.taskName" placeholder="请输入工作名称" maxlength="100" />
        </el-form-item>
        <el-form-item label="具体工作内容" prop="taskContent">
          <el-input
            v-model="libraryForm.taskContent"
            type="textarea"
            :rows="4"
            placeholder="请详细描述工作内容"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="标准工时(h/d)" prop="standardHours">
          <el-input-number v-model="libraryForm.standardHours" :min="0.5" :max="24" :step="0.5" :precision="1" />
        </el-form-item>
        <el-form-item label="积分" prop="points">
          <el-input-number v-model="libraryForm.points" :min="0" :max="9999" :step="1" />
        </el-form-item>
      </el-form>
    </FormDialog>

    <!-- 查看详情对话框 -->
    <FormDialog
      v-model="detailDialogVisible"
      title="任务详情"
      width="500px"
      :show-confirm="false"
      :show-cancel="false"
    >
      <el-descriptions :column="1" border>
        <el-descriptions-item label="任务名称">{{ currentTask?.taskName }}</el-descriptions-item>
        <el-descriptions-item label="任务描述">{{ currentTask?.description }}</el-descriptions-item>
        <el-descriptions-item label="执行人">{{ currentTask?.assignee?.realName }}</el-descriptions-item>
        <el-descriptions-item label="分配人">{{ currentTask?.assigner?.realName }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentTask?.status)">
            {{ getStatusLabel(currentTask?.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="预计工时">{{ currentTask?.workHours }}小时</el-descriptions-item>
        <el-descriptions-item label="积分">{{ currentTask?.points ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="实际工时">{{ currentTask?.actualHours || '-' }}小时</el-descriptions-item>
        <el-descriptions-item label="截止日期">{{ formatDate(currentTask?.deadline) }}</el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ formatDateTime(currentTask?.completedAt) }}</el-descriptions-item>
        <el-descriptions-item label="完成备注">{{ currentTask?.completionNote || '-' }}</el-descriptions-item>
      </el-descriptions>
    </FormDialog>

    <!-- 提交任务对话框 -->
    <FormDialog
      v-model="submitDialogVisible"
      title="完成任务"
      width="500px"
      :confirm-text="'完成'"
      :cancel-text="'取消'"
      :confirm-loading="submitting"
      @confirm="confirmSubmit"
    >
      <el-form :model="submitForm" label-width="100px">
        <el-form-item label="实际工时">
          <el-input-number v-model="submitForm.actualHours" :min="0.5" :max="24" :step="0.5" />
          <span style="margin-left: 8px">小时</span>
        </el-form-item>
        <el-form-item label="完成备注">
          <el-input
            v-model="submitForm.completionNote"
            type="textarea"
            :rows="3"
            placeholder="请描述完成情况"
          />
        </el-form-item>
      </el-form>
    </FormDialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import dayjs from 'dayjs';

import { addTemplateInstructionSheet, applyTemplateHeaderStyle } from '@/utils/excelTemplate';
import request from '@/api/request';
import { useUserStore } from '@/store/modules/user';
import FormDialog from '@/components/system/FormDialog.vue';

const userStore = useUserStore();

// Tab 控制
const activeTab = ref('tasks');

// 监听标签页切换
watch(activeTab, (tab) => {
  if (tab === 'library') {
    loadTaskLibrary();
  } else if (tab === 'tasks') {
    loadTasks();
  }
});

// ========== 临时工作列表相关 ==========
const taskList = ref([]);
const todayScheduledUsers = ref([]);
const loading = ref(false);
const assignDialogVisible = ref(false);
const detailDialogVisible = ref(false);
const submitDialogVisible = ref(false);
const currentTask = ref(null);
const assigning = ref(false);
const submitting = ref(false);
const assignFormRef = ref(null);

const filters = ref({
  taskName: '',
  assigneeName: '',
  status: '',
  dateRange: []
});

const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
});

// 分配任务表单
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
  points: 10
});

const assignRules = {
  taskLibraryId: [{ required: true, message: '请选择工作名称', trigger: 'change' }],
  executorId: [{ required: true, message: '请选择执行人', trigger: 'change' }],
  planStartDate: [{ required: true, message: '请选择计划工作日期', trigger: 'change' }],
  planEndDate: [{ required: true, message: '请选择截止工作日期', trigger: 'change' }]
};

const submitForm = ref({
  actualHours: 1,
  completionNote: ''
});

// ========== 任务库相关 ==========
const taskLibraryList = ref([]);
const libraryLoading = ref(false);
const libraryDialogVisible = ref(false);
const libraryIsEdit = ref(false);
const librarySaving = ref(false);
const libraryFormRef = ref(null);
const currentLibraryId = ref(null);
const fileInputRef = ref(null);
const importing = ref(false);
const libraryTableRef = ref(null);
const selectedLibraryRows = ref([]);

const libraryFilters = ref({
  keyword: ''
});

const libraryPagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
});

const libraryForm = ref({
  taskName: '',
  taskContent: '',
  standardHours: 1,
  points: 10
});

const libraryRules = {
  taskName: [
    { required: true, message: '请输入工作名称', trigger: 'blur' },
    { max: 100, message: '工作名称不能超过100个字符', trigger: 'blur' }
  ],
  taskContent: [{ required: true, message: '请输入具体工作内容', trigger: 'blur' }],
  standardHours: [{ required: true, message: '请输入标准工时', trigger: 'change' }],
  points: [{ required: true, message: '请输入积分', trigger: 'change' }]
};

let libraryKeywordTimer = null;

// ========== 权限 ==========
const canAssign = computed(() => {
  return ['admin', 'station_manager', 'department_manager', 'deputy_manager'].includes(userStore.roleCode);
});
const taskTabLabel = computed(() => (userStore.roleCode === 'operator' ? '临时工作' : '分配临时工作'));

// 获取当前场站ID（优先使用选中的，否则使用第一个）
const currentStationId = computed(() => {
  return userStore.currentStationId || userStore.stations?.[0]?.id;
});
const effectiveRole = computed(() => userStore.baseRoleCode || userStore.roleCode);

// ========== 工具函数 ==========
const getStatusType = (status) => {
  const types = { pending: 'info', in_progress: 'warning', completed: 'success' };
  return types[status] || 'info';
};

const getStatusLabel = (status) => {
  const labels = { pending: '待处理', in_progress: '进行中', completed: '已完成' };
  return labels[status] || status;
};

const formatDate = (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-';
const formatDateTime = (date) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-';

const normalizeUser = (user, fallbackName) => {
  if (!user && !fallbackName) return null;
  const realName = user?.realName || user?.real_name || user?.userName || user?.username || fallbackName || '';
  return {
    ...(user || {}),
    realName
  };
};

const normalizeTask = (task) => {
  if (!task) return task;
  const assignee = normalizeUser(task.assignee || task.executor, task.executor_name || task.executorName);
  const assigner = normalizeUser(task.assigner, task.assigner_name || task.assignerName);
  const status = task.status === 'processing' ? 'in_progress' : task.status;
  const fallbackCompletedAt = status === 'completed'
    ? (task.actual_end_time || task.completedAt || task.updatedAt || task.updated_at || null)
    : (task.completedAt || task.actual_end_time || null);
  return {
    ...task,
    taskName: task.taskName || task.task_name || '',
    description: task.description || task.task_description || '',
    workHours: task.workHours ?? task.standardHours ?? task.standard_hours ?? null,
    points: task.points ?? 0,
    actualHours: task.actualHours ?? task.actual_hours ?? null,
    completionNote: task.completionNote || task.completion_note || '',
    completedAt: fallbackCompletedAt,
    deadline: task.deadline || task.plan_end_time || task.planEndTime || null,
    assignee,
    assigner,
    assigneeId: task.assigneeId || task.executor_id || assignee?.id,
    assignerId: task.assignerId || task.assigner_id || assigner?.id,
    status
  };
};

// ========== 任务列表操作 ==========
const loadTasks = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      taskName: filters.value.taskName || undefined,
      assigneeName: filters.value.assigneeName || undefined,
      status: filters.value.status || undefined,
      startDate: filters.value.dateRange?.[0],
      endDate: filters.value.dateRange?.[1]
    };
    if (['operator', 'maintenance', 'station_manager'].includes(effectiveRole.value) && currentStationId.value) {
      params.stationId = currentStationId.value;
    }
    const res = await request.get('/temporary-tasks', { params });
    taskList.value = (res.list || []).map(normalizeTask);
    pagination.value.total = res.total || 0;
  } catch (e) {

  } finally {
    loading.value = false;
  }
};

// 加载今日上岗人员（从排班表）
const loadTodayScheduledUsers = async () => {
  try {
    const res = await request.get('/schedules/today', {
      params: { stationId: currentStationId.value }
    });
    todayScheduledUsers.value = res || [];
  } catch (e) {
  }
};

// 工作名称选择变化 - 自动填充关联字段
const handleTaskLibraryChange = (libraryId) => {
  const libItem = taskLibraryList.value.find(item => item.id === libraryId);
  if (libItem) {
    assignForm.value.taskName = libItem.taskName;
    assignForm.value.taskContent = libItem.taskContent;
    assignForm.value.standardHours = parseFloat(libItem.standardHours) || 1;
    assignForm.value.points = libItem.points || 10;
  }
};

// 显示分配任务对话框
const showAssignDialog = () => {
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
    points: 10
  };
  loadTodayScheduledUsers();
  assignDialogVisible.value = true;
};

// 从任务库快速分配
const quickAssign = (item) => {
  const today = dayjs().format('YYYY-MM-DD');
  assignForm.value = {
    taskLibraryId: item.id,
    taskName: item.taskName,
    taskContent: item.taskContent,
    executorId: null,
    executorName: '',
    planStartDate: today,
    planStartTime: '08:00',
    planEndDate: today,
    planEndTime: '17:00',
    standardHours: parseFloat(item.standardHours) || 1,
    points: item.points || 10
  };
  loadTodayScheduledUsers();
  activeTab.value = 'tasks';
  assignDialogVisible.value = true;
};

// 提交分配任务
const submitAssign = async () => {
  try {
    await assignFormRef.value.validate();
  } catch {
    return;
  }

  assigning.value = true;
  try {
    const executor = todayScheduledUsers.value.find(u => u.userId === assignForm.value.executorId);
    const planStartTime = assignForm.value.planStartDate + ' ' + (assignForm.value.planStartTime || '08:00');
    const planEndTime = assignForm.value.planEndDate + ' ' + (assignForm.value.planEndTime || '17:00');

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
      points: assignForm.value.points
    });
    ElMessage.success('任务分配成功');
    assignDialogVisible.value = false;
    loadTasks();
  } catch (e) {
    ElMessage.error(e.message || '分配失败');
  } finally {
    assigning.value = false;
  }
};

const viewDetail = (row) => {
  currentTask.value = row;
  detailDialogVisible.value = true;
};

const startTask = async (row) => {
  try {
    await request.put(`/temporary-tasks/${row.id}/start`);
    ElMessage.success('任务已开始');
    loadTasks();
  } catch (e) {
    
  }
};

const submitTask = (row) => {
  currentTask.value = row;
  submitForm.value = {
    actualHours: row.workHours || 1,
    completionNote: ''
  };
  submitDialogVisible.value = true;
};

const confirmSubmit = async () => {
  submitting.value = true;
  try {
    await request.put(`/temporary-tasks/${currentTask.value.id}/complete`, submitForm.value);
    ElMessage.success('提交成功');
    submitDialogVisible.value = false;
    await loadTasks();
    const updated = taskList.value.find(task => task.id === currentTask.value.id);
    if (updated) {
      currentTask.value = updated;
    }
  } catch (e) {
    
  } finally {
    submitting.value = false;
  }
};

const deleteTask = async (row) => {
  await ElMessageBox.confirm('确定删除该任务吗？', '提示', { type: 'warning' });
  try {
    await request.delete(`/temporary-tasks/${row.id}`);
    ElMessage.success('删除成功');
    loadTasks();
  } catch (e) {
    
  }
};

// ========== 任务库操作 ==========
const handleLibraryKeywordInput = () => {
  if (libraryKeywordTimer) {
    clearTimeout(libraryKeywordTimer);
  }
  libraryKeywordTimer = setTimeout(() => {
    if (activeTab.value !== 'library') {
      return;
    }
    libraryPagination.value.page = 1;
    loadTaskLibrary();
  }, 300);
};

const handleLibraryKeywordClear = () => {
  if (libraryKeywordTimer) {
    clearTimeout(libraryKeywordTimer);
  }
  libraryPagination.value.page = 1;
  loadTaskLibrary();
};

const loadTaskLibrary = async () => {
  libraryLoading.value = true;
  try {
    const params = {
      page: libraryPagination.value.page,
      pageSize: libraryPagination.value.pageSize,
      keyword: libraryFilters.value.keyword || undefined
    };
    const res = await request.get('/temporary-task-library', { params });
    taskLibraryList.value = (res.list || []).map(item => ({
      id: item.id,
      taskName: item.task_name,
      taskContent: item.task_content,
      standardHours: item.standard_hours,
      points: item.points,
      stationId: item.station_id,
      createdByName: item.created_by_name || item.creator?.real_name
    }));
    libraryPagination.value.total = res.total || 0;
    selectedLibraryRows.value = [];
    libraryTableRef.value?.clearSelection();
  } catch (e) {
    
  } finally {
    libraryLoading.value = false;
  }
};

const showLibraryDialog = (item = null) => {
  if (item) {
    libraryIsEdit.value = true;
    currentLibraryId.value = item.id;
    libraryForm.value = {
      taskName: item.taskName,
      taskContent: item.taskContent,
      standardHours: parseFloat(item.standardHours) || 1,
      points: item.points || 10
    };
  } else {
    libraryIsEdit.value = false;
    currentLibraryId.value = null;
    libraryForm.value = {
      taskName: '',
      taskContent: '',
      standardHours: 1,
      points: 10
    };
  }
  libraryDialogVisible.value = true;
};

const saveLibraryItem = async () => {
  try {
    await libraryFormRef.value.validate();
  } catch {
    return;
  }

  librarySaving.value = true;
  try {
    const data = {
      taskName: libraryForm.value.taskName,
      taskContent: libraryForm.value.taskContent,
      standardHours: libraryForm.value.standardHours,
      points: libraryForm.value.points
    };

    if (libraryIsEdit.value) {
      await request.put(`/temporary-task-library/${currentLibraryId.value}`, data);
      ElMessage.success('更新成功');
    } else {
      await request.post('/temporary-task-library', data);
      ElMessage.success('创建成功');
    }

    libraryDialogVisible.value = false;
    loadTaskLibrary();
  } catch (e) {
    
    ElMessage.error(e.message || '保存失败');
  } finally {
    librarySaving.value = false;
  }
};

const deleteLibraryItem = async (item) => {
  try {
    await ElMessageBox.confirm(`确定要删除任务"${item.taskName}"吗？`, '删除确认', { type: 'warning' });
    await request.delete(`/temporary-task-library/${item.id}`);
    ElMessage.success('删除成功');
    loadTaskLibrary();
  } catch (e) {
    if (e !== 'cancel') {

      ElMessage.error('删除失败');
    }
  }
};

const handleLibrarySelectionChange = (rows) => {
  selectedLibraryRows.value = rows || [];
};

const batchDeleteLibrary = async () => {
  if (selectedLibraryRows.value.length === 0) return;
  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${selectedLibraryRows.value.length} 条任务吗？`,
      '批量删除',
      { type: 'warning' }
    );
  } catch (e) {
    return;
  }

  const ids = selectedLibraryRows.value.map(row => row.id).filter(Boolean);
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

// ========== 模板下载和批量导入 ==========
const downloadTemplate = () => {
  // 使用 xlsx 库生成模板
  import('xlsx').then((XLSX) => {
    const templateData = [
      ['工作名称', '具体工作内容', '标准工时(h/d)', '积分'],
      ['示例任务1', '这是示例任务的具体工作内容描述', 2, 10],
      ['示例任务2', '请按照此格式填写任务信息', 1.5, 8]
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);

    applyTemplateHeaderStyle(XLSX, ws, 1);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '临时工作任务库模板');
    addTemplateInstructionSheet(XLSX, wb, [
      ['工作名称', '必填，任务名称。'],
      ['具体工作内容', '必填，任务内容描述。'],
      ['标准工时(h/d)', '必填，数字，单位 h/d。'],
      ['积分', '必填，数字。']
    ]);
    XLSX.writeFile(wb, '临时工作任务库导入模板.xlsx');
    ElMessage.success('模板下载成功');
  });
};

const triggerImport = () => {
  fileInputRef.value?.click();
};

const handleImport = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  importing.value = true;
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
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // 跳过标题行，解析数据
    const tasks = [];
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (row && row.length > 0 && row[0]) { // 确保有工作名称
        tasks.push({
          taskName: String(row[0] || '').trim(),
          taskContent: String(row[1] || '').trim(),
          standardHours: parseFloat(row[2]) || 1,
          points: parseInt(row[3]) || 10
        });
      }
    }

    if (tasks.length === 0) {
      ElMessage.warning('未找到有效数据，请检查文件格式');
      return;
    }

    // 调用批量导入API（共享任务库，无需场站ID）
    const res = await request.post('/temporary-task-library/batch-import', { tasks });

    const successCount = res.success || res.successCount || tasks.length;
    ElMessage.success(`导入完成: 成功${successCount}条`);
    loadTaskLibrary();
  } catch (err) {
    ElMessage.error(err.message || '导入失败，请检查文件格式');
  } finally {
    importing.value = false;
    if (fileInputRef.value) {
      fileInputRef.value.value = '';
    }
  }
};

// ========== 初始化 ==========
onMounted(() => {
  loadTasks();
  loadTaskLibrary();
});
</script>

<style lang="scss" scoped>
.temporary-tasks-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h2 {
      margin: 0;
      font-size: 20px;
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }

  .filter-bar {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
  }

  .table-wrapper {
    background: #fff;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
    background: #fff;
    padding: 12px 16px;
    border-radius: 8px;
  }

  // 任务库样式
  .library-content {
    min-height: 300px;
  }

  .empty-wrapper {
    background: #fff;
    padding: 60px 20px;
    border-radius: 8px;
    text-align: center;
  }

  .form-hint {
    margin-left: 12px;
    font-size: 12px;
    color: #909399;
  }
}
</style>
