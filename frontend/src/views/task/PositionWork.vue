<template>
  <div class="position-work-page">
    <el-tabs v-model="activeTab" class="work-tabs">
      <!-- 岗位现场工作 Tab -->
      <el-tab-pane label="岗位现场工作" name="myWork">
        <div class="tab-content">
          <div class="page-header">
            <h2>我的工作</h2>
            <el-date-picker
              v-model="currentDate"
              type="date"
              placeholder="选择日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="loadTodayTasks"
            />
          </div>

          <!-- 工作列表 -->
          <el-table v-if="todayTasks.length > 0" :data="todayTasks" stripe border>
            <el-table-column prop="positionName" label="岗位" width="120" />
            <el-table-column prop="stationName" label="场站" width="150" />
            <el-table-column prop="workName" label="工作项目" min-width="200" />
            <el-table-column label="完成状态" width="150" align="center">
              <template #default="{ row }">
                <el-radio-group v-model="row.isCompleted" size="small" :disabled="!!row.logId">
                  <el-radio :label="1">完成</el-radio>
                  <el-radio :label="0">未完成</el-radio>
                </el-radio-group>
              </template>
            </el-table-column>
            <el-table-column label="备注" min-width="200">
              <template #default="{ row }">
                <el-input
                  v-model="row.remark"
                  placeholder="填写工作备注"
                  size="small"
                  maxlength="200"
                  :disabled="!!row.logId"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right" align="center">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  size="small"
                  @click="saveTask(row)"
                  :loading="row.saving"
                  :disabled="!!row.logId"
                >
                  提交
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 无数据 -->
          <el-empty v-else description="今日无排班或无工作项目" />
        </div>
      </el-tab-pane>

      <!-- 人员岗位管理 Tab -->
      <el-tab-pane
        label="人员岗位管理"
        name="management"
        v-if="['station_manager', 'department_manager', 'deputy_manager'].includes(userStore.roleCode)"
      >
        <div class="tab-content">
          <div class="page-header">
            <h2>人员岗位管理</h2>
            <div class="header-actions">
              <el-button type="primary" @click="openJobDialog()">
                <el-icon><Plus /></el-icon>
                新增工作项目
              </el-button>
              <el-upload
                :action="`${apiBaseUrl}/position-jobs/import`"
                :headers="uploadHeaders"
                :on-success="handleImportSuccess"
                :on-error="handleImportError"
                :show-file-list="false"
                accept=".xlsx,.xls"
                :before-upload="beforeUpload"
              >
                <el-button type="primary" plain>
                  <el-icon><Download /></el-icon>
                  批量导入
                </el-button>
              </el-upload>
              <el-button @click="downloadTemplate" plain>
                <el-icon><Download /></el-icon>
                下载模板
              </el-button>
            </div>
          </div>

          <!-- 筛选 -->
          <div class="filter-bar">
            <el-select
              v-model="filters.stationId"
              placeholder="选择场站"
              clearable
              @change="loadPositionJobs"
              style="width: 200px"
            >
              <el-option
                v-for="station in stations"
                :key="station.id"
                :label="station.station_name"
                :value="station.id"
              />
            </el-select>
            <el-input
              v-model="filters.positionName"
              placeholder="岗位"
              clearable
              @change="loadPositionJobs"
              style="width: 200px"
            />
            <el-button type="primary" @click="loadPositionJobs">查询</el-button>
          </div>

          <!-- 表格 -->
          <el-table :data="positionJobs" stripe border style="width: 100%">
            <el-table-column prop="station.station_name" label="场站" width="150" />
            <el-table-column prop="position_name" label="岗位" width="150" />
            <el-table-column prop="job_name" label="工作项目名称" />
            <el-table-column prop="standard_hours" label="标准工时(h/d)" width="130">
              <template #default="{ row }">
                {{ row.standard_hours || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="points" label="积分" width="120">
              <template #default="{ row }">
                {{ row.points || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="openJobDialog(row)">编辑</el-button>
                <el-button link type="danger" @click="deleteJob(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="pagination.page"
              v-model:page-size="pagination.pageSize"
              :total="pagination.total"
              layout="total, prev, pager, next"
              @current-change="loadPositionJobs"
            />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 新增/编辑工作项目对话框 -->
    <el-dialog
      v-model="jobDialogVisible"
      :title="jobForm.id ? '编辑工作项目' : '批量新增工作项目'"
      :width="jobForm.id ? '500px' : '800px'"
    >
      <el-form :model="jobForm" label-width="120px">
        <el-form-item label="场站" required>
          <el-select
            v-model="jobForm.stationId"
            placeholder="请选择场站"
            :disabled="userStore.roleCode === 'station_manager'"
          >
            <el-option
              v-for="station in formStationOptions"
              :key="station.id"
              :label="station.station_name"
              :value="station.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="岗位" required>
          <el-input v-model="jobForm.positionName" placeholder="请输入岗位" />
        </el-form-item>

        <!-- 编辑模式：单个工作项目 -->
        <template v-if="jobForm.id">
          <el-form-item label="工作项目名称" required>
            <el-input v-model="jobForm.jobName" placeholder="请输入工作项目名称" />
          </el-form-item>
          <el-form-item label="标准工时(h/d)">
            <el-input-number
              v-model="jobForm.standardHours"
              :min="0"
              :max="24"
              :step="0.1"
              :precision="1"
            />
          </el-form-item>
          <el-form-item label="积分">
            <el-input-number
              v-model="jobForm.points"
              :min="0"
              :step="1"
              :disabled="userStore.roleCode === 'station_manager'"
              placeholder="由部门经理/副经理设置"
            />
            <span v-if="userStore.roleCode === 'station_manager'" style="color: #909399; font-size: 12px; margin-left: 10px;">
              积分由部门经理/副经理设置
            </span>
          </el-form-item>
        </template>

        <!-- 批量新增模式：多个工作项目 -->
        <template v-else>
          <el-form-item label="项目信息" required>
            <div style="width: 100%;">
              <el-table :data="jobForm.jobs" border style="width: 100%; margin-bottom: 10px;">
                <el-table-column label="工作项目名称" min-width="150">
                  <template #default="{ row }">
                    <el-input v-model="row.jobName" placeholder="请输入" size="small" />
                  </template>
                </el-table-column>
                <el-table-column label="标准工时(h/d)" width="130">
                  <template #default="{ row }">
                    <el-input-number
                      v-model="row.standardHours"
                      :min="0"
                      :max="24"
                      :step="0.1"
                      :precision="1"
                      size="small"
                      style="width: 100%;"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="积分" width="110">
                  <template #default="{ row }">
                    <el-input-number
                      v-model="row.points"
                      :min="0"
                      :step="1"
                      size="small"
                      style="width: 100%;"
                      :disabled="!canSetPoints"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="80" align="center">
                  <template #default="{ $index }">
                    <el-button
                      link
                      type="danger"
                      size="small"
                      @click="removeJob($index)"
                      :disabled="jobForm.jobs.length === 1"
                    >
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
              <el-button @click="addJob" size="small" style="width: 100%;">
                <el-icon><Plus /></el-icon>
                新增一行
              </el-button>
              <div v-if="!canSetPoints" style="color: #909399; font-size: 12px; margin-top: 10px;">
                提示：积分由部门经理/副经理设置
              </div>
            </div>
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="jobDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveJob" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 申诉对话框 -->
    <el-dialog v-model="appealDialogVisible" title="工时申诉" width="500px">
      <el-form :model="appealForm" label-width="100px">
        <el-form-item label="工作项目">
          <span>{{ currentTask?.workName }}</span>
        </el-form-item>
        <el-form-item label="标准工时">
          <span>{{ currentTask?.standardHours }} h/d</span>
        </el-form-item>
        <el-form-item label="实际工时">
          <span>{{ currentTask?.actualHours }} h/d</span>
        </el-form-item>
        <el-form-item label="超时时长">
          <span class="overtime-text">
            {{ currentTask ? (currentTask.actualHours - currentTask.standardHours).toFixed(1) : 0 }} 小时
          </span>
        </el-form-item>
        <el-form-item label="申诉原因" required>
          <el-input
            v-model="appealForm.appealReason"
            type="textarea"
            :rows="4"
            placeholder="请详细说明超时原因"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="appealDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAppeal" :loading="submitting">提交申诉</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useUserStore } from '@/store/user';
import { ElMessage, ElMessageBox } from 'element-plus';
import dayjs from 'dayjs';
import * as positionWorkLogApi from '@/api/positionWorkLog';
import * as positionJobApi from '@/api/positionJob';
import * as stationApi from '@/api/station';

const userStore = useUserStore();

// Tab 状态
const activeTab = ref('myWork');

// 当前日期
const currentDate = ref(dayjs().format('YYYY-MM-DD'));

// 今日工作任务
const todayTasks = ref([]);

// 加载今日任务
const loadTodayTasks = async () => {
  try {
    const tasks = await positionWorkLogApi.getTodayTasks();
    todayTasks.value = tasks.map(task => ({
      ...task,
      // 如果是新任务（没有logId），将isCompleted设为null表示未选择
      isCompleted: task.logId ? task.isCompleted : null,
      saving: false
    }));
  } catch (error) {
    ElMessage.error('加载工作任务失败');
  }
};

// 保存任务
const saveTask = async (task) => {
  task.saving = true;
  try {
    await positionWorkLogApi.saveWorkLog({
      positionJobId: task.jobId,
      workDate: currentDate.value,
      stationId: task.stationId,
      stationName: task.stationName,
      positionName: task.positionName,
      workName: task.workName,
      standardHours: task.standardHours,
      actualHours: task.actualHours,
      isCompleted: task.isCompleted,
      progress: task.progress,
      remark: task.remark
    });
    ElMessage.success('保存成功');
    await loadTodayTasks(); // 重新加载以更新状态
  } catch (error) {
    ElMessage.error('保存失败');
  } finally {
    task.saving = false;
  }
};

// 申诉相关
const appealDialogVisible = ref(false);
const currentTask = ref(null);
const appealForm = reactive({
  appealReason: ''
});
const submitting = ref(false);

const openAppealDialog = (task) => {
  currentTask.value = task;
  appealForm.appealReason = '';
  appealDialogVisible.value = true;
};

const submitAppeal = async () => {
  if (!appealForm.appealReason) {
    ElMessage.warning('请填写申诉原因');
    return;
  }

  submitting.value = true;
  try {
    await positionWorkLogApi.submitAppeal(currentTask.value.logId, {
      appealReason: appealForm.appealReason
    });
    ElMessage.success('申诉已提交');
    appealDialogVisible.value = false;
    await loadTodayTasks();
  } catch (error) {
    ElMessage.error('申诉提交失败');
  } finally {
    submitting.value = false;
  }
};

const getAppealStatusType = (status) => {
  const map = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error'
  };
  return map[status] || 'info';
};

const getAppealStatusText = (status) => {
  const map = {
    pending: '申诉审批中...',
    approved: '申诉已通过',
    rejected: '申诉已驳回'
  };
  return map[status] || '';
};

// 岗位工作管理相关
const stations = ref([]);
const positionJobs = ref([]);
const filters = reactive({
  stationId: null,
  positionName: ''
});
const isActiveStatus = (status) => status === undefined || status === null || status === '' || status === 'active' || status === 1 || status === '1' || status === true;
const activeStationList = computed(() => stations.value.filter(station => isActiveStatus(station.status)));
const formStationOptions = computed(() => {
  const selectedId = jobForm.stationId;
  if (!selectedId) return activeStationList.value;
  const selected = stations.value.find(station => station.id === selectedId);
  if (selected && !isActiveStatus(selected.status)) {
    return [selected, ...activeStationList.value.filter(station => station.id !== selectedId)];
  }
  return activeStationList.value;
});
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
});

const jobDialogVisible = ref(false);
const jobForm = reactive({
  id: null,
  stationId: null,
  positionName: '',
  jobName: '',
  standardHours: null,
  points: null,
  jobs: [] // 批量新增时使用
});
const saving = ref(false);

// 判断当前用户是否可以设置积分
const canSetPoints = computed(() => {
  return ['department_manager', 'deputy_manager', 'admin'].includes(userStore.roleCode);
});

// 加载场站列表
const loadStations = async () => {
  try {
    const data = await stationApi.getStations({ pageSize: 200 });
    stations.value = data.list || data || [];

    // 如果是站长，默认选择自己的场站
    if (userStore.roleCode === 'station_manager' && userStore.stations?.length > 0) {
      filters.stationId = userStore.stations[0].id;
      jobForm.stationId = userStore.stations[0].id;
    }
  } catch (error) {
    ElMessage.error('加载场站列表失败');
  }
};

// 加载岗位工作项目
const loadPositionJobs = async () => {
  try {
    const result = await positionJobApi.getPositionJobs({
      page: pagination.page,
      pageSize: pagination.pageSize,
      stationId: filters.stationId,
      positionName: filters.positionName
    });
    positionJobs.value = result.list || [];
    pagination.total = result.total || 0;
  } catch (error) {
    ElMessage.error('加载岗位工作项目失败');
  }
};

// 打开工作项目对话框
const openJobDialog = (row = null) => {
  if (row) {
    // 编辑模式
    jobForm.id = row.id;
    jobForm.stationId = row.station_id;
    jobForm.positionName = row.position_name;
    jobForm.jobName = row.job_name;
    jobForm.standardHours = row.standard_hours;
    jobForm.points = row.points;
    jobForm.jobs = [];
  } else {
    // 批量新增模式
    jobForm.id = null;
    jobForm.stationId = userStore.roleCode === 'station_manager' ? userStore.stations?.[0]?.id : null;
    jobForm.positionName = '';
    jobForm.jobName = '';
    jobForm.standardHours = null;
    jobForm.points = null;
    jobForm.jobs = [
      { jobName: '', standardHours: null, points: null }
    ];
  }
  jobDialogVisible.value = true;
};

// 添加一行工作项目
const addJob = () => {
  jobForm.jobs.push({
    jobName: '',
    standardHours: null,
    points: null
  });
};

// 删除一行工作项目
const removeJob = (index) => {
  if (jobForm.jobs.length > 1) {
    jobForm.jobs.splice(index, 1);
  }
};

// 保存工作项目
const saveJob = async () => {
  if (!jobForm.stationId || !jobForm.positionName) {
    ElMessage.warning('请选择场站并填写岗位');
    return;
  }

  if (jobForm.id) {
    // 编辑模式：保存单个工作项目
    if (!jobForm.jobName) {
      ElMessage.warning('请填写工作项目名称');
      return;
    }

    saving.value = true;
    try {
      await positionJobApi.updatePositionJob(jobForm.id, jobForm);
      ElMessage.success('保存成功');
      jobDialogVisible.value = false;
      await loadPositionJobs();
    } catch (error) {
      ElMessage.error(error.message || '保存失败');
    } finally {
      saving.value = false;
    }
  } else {
    // 批量新增模式：保存多个工作项目
    const validJobs = jobForm.jobs.filter(job => job.jobName && job.jobName.trim());
    if (validJobs.length === 0) {
      ElMessage.warning('请至少填写一个工作项目名称');
      return;
    }

    saving.value = true;
    try {
      // 并行创建所有工作项目
      await Promise.all(
        validJobs.map(job =>
          positionJobApi.createPositionJob({
            stationId: jobForm.stationId,
            positionName: jobForm.positionName,
            jobName: job.jobName,
            standardHours: job.standardHours,
            points: job.points
          })
        )
      );
      ElMessage.success(`成功新增 ${validJobs.length} 个工作项目`);
      jobDialogVisible.value = false;
      await loadPositionJobs();
    } catch (error) {
      ElMessage.error(error.message || '保存失败');
    } finally {
      saving.value = false;
    }
  }
};

// 删除工作项目
const deleteJob = async (id, confirmed = false) => {
  try {
    // 第一次调用：检查是否需要确认
    const result = await positionJobApi.deletePositionJob(id, confirmed);

    // 如果后端返回需要确认
    if (result && result.needConfirm) {
      await ElMessageBox.confirm(result.message, '确认删除', {
        type: 'warning',
        confirmButtonText: '确认删除',
        cancelButtonText: '取消'
      });

      // 用户确认后，再次调用删除接口，带上 confirmed=true
      await deleteJob(id, true);
      return;
    }

    // 删除成功
    ElMessage.success('删除成功');
    await loadPositionJobs();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败');
    }
  }
};

// 上传相关
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${userStore.token}`
}));

const beforeUpload = (file) => {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    || file.type === 'application/vnd.ms-excel';
  if (!isExcel) {
    ElMessage.error('只能上传Excel文件！');
  }
  return isExcel;
};

const handleImportSuccess = (response) => {
  if (response.code === 200) {
    ElMessage.success(response.message || '导入成功');
    loadPositionJobs();
  } else {
    ElMessage.error(response.message || '导入失败');
  }
};

const handleImportError = () => {
  ElMessage.error('导入失败');
};

const downloadTemplate = async () => {
  try {
    const response = await positionJobApi.downloadTemplate();

    // 创建一个临时的URL来下载文件
    const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '岗位工作项目模板.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    ElMessage.error('下载模板失败');
  }
};

onMounted(() => {
  loadTodayTasks();
  loadStations();
  if (['station_manager', 'department_manager', 'deputy_manager'].includes(userStore.roleCode)) {
    loadPositionJobs();
  }
});
</script>

<style lang="scss" scoped>
.position-work-page {
  .work-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 20px;
    }
  }

  .tab-content {
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      h2 {
        margin: 0;
        font-size: 20px;
      }

      .header-actions {
        display: flex;
        gap: 10px;
      }
    }

    .filter-bar {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }

    .pagination-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }
  }

  .el-table {
    margin-top: 20px;
  }
}
</style>
