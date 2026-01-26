<template>
  <div class="position-work-page">
    <div v-if="showFixedView" class="tab-content">
          <div class="page-header">
            <h2>固定任务</h2>
            <div class="header-actions">
              <el-date-picker
                v-model="currentDate"
                type="date"
                placeholder="选择日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                @change="loadTodayTasks"
              />
              <el-button @click="loadTodayTasks">刷新</el-button>
            </div>
          </div>

          <el-table
            v-if="showScoring"
            v-loading="taskLoading"
            :data="todayTasks"
            stripe
            border
            style="width: 100%"
          >
            <el-table-column prop="stationName" label="场站" width="140" />
            <el-table-column prop="positionName" label="岗位" width="120" />
            <el-table-column prop="workName" label="任务名称" min-width="180" />
            <el-table-column prop="taskCategory" label="任务类别" width="120" />
            <el-table-column prop="scoreMethod" label="给分方式" width="120" />
            <el-table-column prop="unitPoints" label="单位积分" width="100" />
            <el-table-column label="数量" width="110">
              <template #default="{ row }">
                <el-input-number
                  v-model="row.quantity"
                  :min="1"
                  :max="1000"
                  :precision="0"
                  :step="1"
                  size="small"
                  controls-position="right"
                  :disabled="row.isSubmitted || !row.quantityEditable"
                />
              </template>
            </el-table-column>
            <el-table-column label="积分" width="110">
              <template #default="{ row }">
                {{ formatPoints(row.unitPoints, row.quantity) }}
              </template>
            </el-table-column>
            <el-table-column label="任务来源" width="120">
              <template #default="{ row }">
                {{ taskSourceLabel(row.taskSource) }}
              </template>
            </el-table-column>
            <el-table-column label="完成状态" width="140">
              <template #default="{ row }">
                <el-radio-group v-model="row.isCompleted" size="small" :disabled="row.isSubmitted">
                  <el-radio :label="1">完成</el-radio>
                  <el-radio :label="0">未完成</el-radio>
                </el-radio-group>
              </template>
            </el-table-column>
            <el-table-column label="备注" min-width="160">
              <template #default="{ row }">
                <el-input
                  v-model="row.remark"
                  placeholder="填写备注"
                  size="small"
                  maxlength="200"
                  :disabled="row.isSubmitted"
                />
              </template>
            </el-table-column>
            <el-table-column label="审核状态" width="120">
              <template #default="{ row }">
                <el-tag :type="reviewStatusType(row)">
                  {{ reviewStatusText(row) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right" align="center">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  size="small"
                  :loading="row.saving"
                  :disabled="row.isSubmitted"
                  @click="saveTask(row)"
                >
                  提交
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-table
            v-else
            v-loading="taskLoading"
            :data="todayTasks"
            stripe
            border
            style="width: 100%"
          >
            <el-table-column prop="positionName" label="岗位" width="120" />
            <el-table-column prop="stationName" label="场站" width="150" />
            <el-table-column prop="workName" label="任务名称" min-width="200" />
            <el-table-column label="完成状态" width="150" align="center">
              <template #default="{ row }">
                <el-radio-group v-model="row.isCompleted" size="small" :disabled="row.isSubmitted">
                  <el-radio :label="1">完成</el-radio>
                  <el-radio :label="0">未完成</el-radio>
                </el-radio-group>
              </template>
            </el-table-column>
            <el-table-column label="备注" min-width="200">
              <template #default="{ row }">
                <el-input
                  v-model="row.remark"
                  placeholder="填写备注"
                  size="small"
                  maxlength="200"
                  :disabled="row.isSubmitted"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right" align="center">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  size="small"
                  :loading="row.saving"
                  :disabled="row.isSubmitted"
                  @click="saveTask(row)"
                >
                  提交
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-if="!taskLoading && todayTasks.length === 0" description="暂无任务" />
    </div>

    <div v-if="showManagementView" class="tab-content">
          <div class="page-header">
            <h2>岗位工作任务库</h2>
            <div class="header-actions" v-if="canManageLibrary">
              <el-button type="primary" @click="openJobDialog()">
                <el-icon><Plus /></el-icon>
                新增任务
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

          <div class="filter-bar">
            <el-select
              v-model="filters.stationId"
              placeholder="场站"
              clearable
              :disabled="userStore.roleCode === 'station_manager'"
              style="width: 160px"
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
              style="width: 140px"
              @keyup.enter="handleJobSearch"
            />
            <el-input
              v-model="filters.jobName"
              placeholder="任务名称"
              clearable
              style="width: 160px"
              @keyup.enter="handleJobSearch"
            />
            <el-input
              v-model="filters.taskCategory"
              placeholder="任务类别"
              clearable
              style="width: 140px"
              @keyup.enter="handleJobSearch"
            />
            <el-select
              v-model="filters.scoreMethod"
              placeholder="给分方式"
              clearable
              style="width: 160px"
            >
              <el-option v-for="option in scoreMethodOptions" :key="option" :label="option" :value="option" />
            </el-select>
            <el-input
              v-model="filters.standardHours"
              placeholder="标准工时(h/d)"
              clearable
              type="number"
              style="width: 150px"
              @keyup.enter="handleJobSearch"
            />
            <el-input
              v-model="filters.points"
              placeholder="单位积分"
              clearable
              type="number"
              style="width: 120px"
              @keyup.enter="handleJobSearch"
            />
            <el-input
              v-model="filters.quantity"
              placeholder="数量"
              clearable
              type="number"
              style="width: 100px"
              @keyup.enter="handleJobSearch"
            />
            <el-input
              v-model="filters.pointsRule"
              placeholder="积分规则"
              clearable
              style="width: 160px"
              @keyup.enter="handleJobSearch"
            />
            <el-select
              v-model="filters.quantityEditable"
              placeholder="数量是否可修改"
              clearable
              style="width: 150px"
            >
              <el-option label="是" :value="1" />
              <el-option label="否" :value="0" />
            </el-select>
            <el-select
              v-model="filters.dispatchReviewRequired"
              placeholder="派发任务是否强制审核"
              clearable
              style="width: 180px"
            >
              <el-option label="是" :value="1" />
              <el-option label="否" :value="0" />
            </el-select>
            <el-button type="primary" @click="handleJobSearch">查询</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </div>

          <el-table
            v-loading="jobLoading"
            :data="positionJobs"
            stripe
            border
            style="width: 100%"
          >
            <el-table-column prop="station.station_name" label="场站" width="140">
              <template #default="{ row }">
                {{ row.station?.station_name ?? '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="position_name" label="岗位" width="140" />
            <el-table-column prop="job_name" label="任务名称" min-width="160" />
            <el-table-column prop="task_category" label="任务类别" width="120">
              <template #default="{ row }">
                {{ row.task_category ?? '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="score_method" label="给分方式" width="120">
              <template #default="{ row }">
                {{ row.score_method ?? '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="standard_hours" label="标准工时(h/d)" width="130">
              <template #default="{ row }">
                {{ row.standard_hours ?? '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="points" label="单位积分" width="110">
              <template #default="{ row }">
                {{ row.points ?? '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="90">
              <template #default="{ row }">
                {{ row.quantity ?? 1 }}
              </template>
            </el-table-column>
            <el-table-column prop="points_rule" label="积分规则" min-width="160">
              <template #default="{ row }">
                <span class="cell-ellipsis" :title="row.points_rule ?? ''">
                  {{ row.points_rule ?? '-' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="quantity_editable" label="数量是否可修改" width="140">
              <template #default="{ row }">
                <el-tag :type="row.quantity_editable === 1 ? 'success' : 'info'">
                  {{ row.quantity_editable === 1 ? '是' : '否' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="dispatch_review_required" label="派发任务是否强制审核" width="160">
              <template #default="{ row }">
                <el-tag :type="row.dispatch_review_required === 1 ? 'warning' : 'info'">
                  {{ row.dispatch_review_required === 1 ? '是' : '否' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="240" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="openApplyDialog(row)">申请填报</el-button>
                <el-button
                  v-if="canManageLibrary"
                  link
                  type="primary"
                  @click="openDispatchDialog(row)"
                >
                  派发任务
                </el-button>
                <el-button
                  v-if="canManageLibrary"
                  link
                  type="primary"
                  @click="openJobDialog(row)"
                >
                  编辑
                </el-button>
                <el-button
                  v-if="canManageLibrary"
                  link
                  type="danger"
                  @click="deleteJob(row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="pagination.page"
              v-model:page-size="pagination.pageSize"
              :total="pagination.total"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next"
              @current-change="loadPositionJobs"
              @size-change="handleJobPageSizeChange"
            />
          </div>
    </div>

    <FormDialog
      v-model="jobDialogVisible"
      :title="jobForm.id ? '编辑任务' : '新增任务'"
      width="640px"
      :show-confirm="false"
      :show-cancel="false"
    >
      <el-form :model="jobForm" label-width="120px">
        <el-form-item label="场站" required>
          <el-select
            v-model="jobForm.stationId"
            placeholder="请选择场站"
            :disabled="userStore.roleCode === 'station_manager'"
          >
            <el-option
              v-for="station in stations"
              :key="station.id"
              :label="station.station_name"
              :value="station.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="岗位" required>
          <el-input v-model="jobForm.positionName" placeholder="请输入岗位名称" />
        </el-form-item>
        <el-form-item label="任务名称" required>
          <el-input v-model="jobForm.jobName" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="任务类别">
          <el-input v-model="jobForm.taskCategory" placeholder="自由文本，用于筛选" />
        </el-form-item>
        <el-form-item label="给分方式">
          <el-select v-model="jobForm.scoreMethod" placeholder="请选择给分方式">
            <el-option v-for="option in scoreMethodOptions" :key="option" :label="option" :value="option" />
          </el-select>
        </el-form-item>
        <el-form-item label="标准工时(h/d)">
          <el-input-number
            v-model="jobForm.standardHours"
            :min="0"
            :step="0.1"
            :precision="1"
          />
        </el-form-item>
        <el-form-item label="单位积分" required>
          <el-input-number v-model="jobForm.points" :step="1" />
        </el-form-item>
        <el-form-item label="数量" required>
          <el-input-number
            v-model="jobForm.quantity"
            :min="1"
            :max="1000"
            :precision="0"
            :step="1"
          />
        </el-form-item>
        <el-form-item label="积分规则">
          <el-input
            v-model="jobForm.pointsRule"
            type="textarea"
            :rows="3"
            placeholder="备注说明"
            maxlength="200"
          />
        </el-form-item>
        <el-form-item label="数量是否可修改">
          <el-switch v-model="jobForm.quantityEditable" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="派发任务是否强制审核">
          <el-switch v-model="jobForm.dispatchReviewRequired" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="jobDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingJob" @click="saveJob">保存</el-button>
      </template>
    </FormDialog>

    <FormDialog
      v-model="applyDialogVisible"
      title="申请填报"
      width="520px"
      :show-confirm="false"
      :show-cancel="false"
    >
      <el-form :model="applyForm" label-width="120px">
        <el-form-item label="任务名称">
          <span>{{ applyForm.jobName }}</span>
        </el-form-item>
        <el-form-item label="工作日期" required>
          <el-date-picker
            v-model="applyForm.workDate"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number
            v-model="applyForm.quantity"
            :min="1"
            :max="1000"
            :precision="0"
            :step="1"
            :disabled="!applyForm.quantityEditable"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="applyForm.remark" type="textarea" :rows="3" maxlength="200" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="applyDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submittingApply" @click="submitApply">提交</el-button>
      </template>
    </FormDialog>

    <FormDialog
      v-model="dispatchDialogVisible"
      title="派发任务"
      width="520px"
      :show-confirm="false"
      :show-cancel="false"
    >
      <el-form :model="dispatchForm" label-width="120px">
        <el-form-item label="任务名称">
          <span>{{ dispatchForm.jobName }}</span>
        </el-form-item>
        <el-form-item label="执行人" required>
          <el-select v-model="dispatchForm.executorId" filterable placeholder="请选择执行人">
            <el-option
              v-for="user in executorOptions"
              :key="user.id"
              :label="user.real_name ?? user.realName ?? user.username"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="工作日期" required>
          <el-date-picker
            v-model="dispatchForm.workDate"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number
            v-model="dispatchForm.quantity"
            :min="1"
            :max="1000"
            :precision="0"
            :step="1"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dispatchDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submittingDispatch" @click="submitDispatch">派发</el-button>
      </template>
    </FormDialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Download } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import * as positionWorkLogApi from '@/api/positionWorkLog';
import * as positionJobApi from '@/api/positionJob';
import * as stationApi from '@/api/station';
import request from '@/api/request';
import { useUserStore } from '@/store/modules/user';
import FormDialog from '@/components/system/FormDialog.vue';

const props = defineProps({
  defaultTab: {
    type: String,
    default: 'fixed'
  }
});

const userStore = useUserStore();

const isDevTest = computed(() => userStore.roleCode === 'dev_test' || userStore.baseRoleCode === 'dev_test');
const showScoring = computed(() => isDevTest.value);
const managerRoles = ['station_manager', 'department_manager', 'deputy_manager', 'senior_management'];
const canManageLibrary = computed(() => userStore.hasRole(managerRoles));
const allowManagement = computed(() => isDevTest.value);

const showManagementView = computed(() => allowManagement.value && props.defaultTab === 'management');
const showFixedView = computed(() => !showManagementView.value);

const handleViewChange = () => {
  if (showManagementView.value) {
    loadStations();
    loadPositionJobs();
    return;
  }
  if (showFixedView.value) {
    loadTodayTasks();
  }
};

const currentDate = ref(dayjs().format('YYYY-MM-DD'));
const todayTasks = ref([]);
const taskLoading = ref(false);

const loadTodayTasks = async () => {
  taskLoading.value = true;
  try {
    const tasks = await positionWorkLogApi.getTodayTasks({ workDate: currentDate.value });
    const normalizedTasks = Array.isArray(tasks) ? tasks : [];
    todayTasks.value = normalizedTasks.map(task => ({
      ...task,
      quantity: Number(task.quantity ?? 1),
      isCompleted: task.isSubmitted ? Number(task.isCompleted ?? 0) : task.isCompleted ?? null,
      remark: task.remark ?? '',
      saving: false
    }));
  } catch (error) {
    ElMessage.error('加载任务失败');
  } finally {
    taskLoading.value = false;
  }
};

const formatPoints = (unitPoints, quantity) => {
  const unit = Number(unitPoints ?? 0);
  const qty = Number(quantity ?? 1);
  return (unit * qty).toFixed(2);
};

const taskSourceLabel = (source) => {
  if (source === 'dispatch') return '派发任务';
  if (source === 'self_apply') return '自行申请';
  return '固定岗位工作';
};

const reviewStatusText = (row) => {
  if (!row.isSubmitted) return '-';
  const status = row.reviewStatus;
  if (row.taskSource === 'self_apply') {
    if (status === 'approved') return '审核通过';
    if (status === 'rejected') return '审核未通过';
    return '待审核';
  }
  if (status === 'approved') return '审核通过';
  if (status === 'rejected') return '审核未通过';
  if (status === 'pending') return '待审核';
  return '自动通过';
};

const reviewStatusType = (row) => {
  if (!row.isSubmitted) return 'info';
  const status = row.reviewStatus;
  if (row.taskSource === 'self_apply') {
    if (status === 'approved') return 'success';
    if (status === 'rejected') return 'danger';
    return 'warning';
  }
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'danger';
  if (status === 'pending') return 'warning';
  return 'info';
};

const saveTask = async (task) => {
  const quantityValue = Number.parseInt(task.quantity, 10);
  if (!Number.isInteger(quantityValue) || quantityValue < 1 || quantityValue > 1000) {
    ElMessage.warning('数量必须是 1-1000 的整数');
    return;
  }

  task.saving = true;
  try {
    await positionWorkLogApi.saveWorkLog({
      logId: task.logId ?? undefined,
      positionJobId: task.jobId,
      taskSource: task.taskSource,
      workDate: currentDate.value,
      stationId: task.stationId,
      stationName: task.stationName,
      positionName: task.positionName,
      workName: task.workName,
      standardHours: task.standardHours,
      actualHours: task.actualHours,
      isCompleted: task.isCompleted,
      progress: task.progress,
      remark: task.remark,
      quantity: quantityValue
    });
    ElMessage.success('提交成功');
    await loadTodayTasks();
  } catch (error) {
    ElMessage.error(error.message ?? '提交失败');
  } finally {
    task.saving = false;
  }
};

const stations = ref([]);
const positionJobs = ref([]);
const jobLoading = ref(false);
const filters = reactive({
  stationId: null,
  positionName: '',
  jobName: '',
  taskCategory: '',
  scoreMethod: '',
  standardHours: '',
  points: '',
  quantity: '',
  pointsRule: '',
  quantityEditable: null,
  dispatchReviewRequired: null
});
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
});

const hasFilterValue = (value) => value !== undefined && value !== null && value !== '';

const resolveTextFilter = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

const handleJobSearch = () => {
  pagination.page = 1;
  loadPositionJobs();
};

const resetFilters = () => {
  filters.stationId = userStore.roleCode === 'station_manager' && userStore.stations?.length > 0
    ? userStore.stations[0].id
    : null;
  filters.positionName = '';
  filters.jobName = '';
  filters.taskCategory = '';
  filters.scoreMethod = '';
  filters.standardHours = '';
  filters.points = '';
  filters.quantity = '';
  filters.pointsRule = '';
  filters.quantityEditable = null;
  filters.dispatchReviewRequired = null;
  pagination.page = 1;
  loadPositionJobs();
};

const handleJobPageSizeChange = (size) => {
  if (typeof size === 'number') {
    pagination.pageSize = size;
  }
  pagination.page = 1;
  loadPositionJobs();
};

const loadStations = async () => {
  try {
    const data = await stationApi.getStations({ pageSize: 200 });
    stations.value = data?.list ?? data ?? [];
    if (userStore.roleCode === 'station_manager' && userStore.stations?.length > 0) {
      filters.stationId = userStore.stations[0].id;
      if (!jobForm.stationId) {
        jobForm.stationId = userStore.stations[0].id;
      }
    }
  } catch (error) {
    ElMessage.error('加载场站失败');
  }
};

const loadPositionJobs = async () => {
  jobLoading.value = true;
  try {
    const positionName = resolveTextFilter(filters.positionName);
    const jobName = resolveTextFilter(filters.jobName);
    const taskCategory = resolveTextFilter(filters.taskCategory);
    const pointsRule = resolveTextFilter(filters.pointsRule);
    const scoreMethod = resolveTextFilter(filters.scoreMethod);
    const result = await positionJobApi.getPositionJobs({
      page: pagination.page,
      pageSize: pagination.pageSize,
      stationId: hasFilterValue(filters.stationId) ? filters.stationId : undefined,
      positionName: positionName ? positionName : undefined,
      jobName: jobName ? jobName : undefined,
      taskCategory: taskCategory ? taskCategory : undefined,
      scoreMethod: scoreMethod ? scoreMethod : undefined,
      standardHours: hasFilterValue(filters.standardHours) ? filters.standardHours : undefined,
      points: hasFilterValue(filters.points) ? filters.points : undefined,
      quantity: hasFilterValue(filters.quantity) ? filters.quantity : undefined,
      pointsRule: pointsRule ? pointsRule : undefined,
      quantityEditable: hasFilterValue(filters.quantityEditable) ? filters.quantityEditable : undefined,
      dispatchReviewRequired: hasFilterValue(filters.dispatchReviewRequired)
        ? filters.dispatchReviewRequired
        : undefined
    });
    positionJobs.value = result?.list ?? [];
    pagination.total = result?.total ?? 0;
  } catch (error) {
    ElMessage.error('加载岗位任务失败');
  } finally {
    jobLoading.value = false;
  }
};

const scoreMethodOptions = ['奖扣结合式', '扣分项', '奖分项'];
const jobDialogVisible = ref(false);
const savingJob = ref(false);
const jobForm = reactive({
  id: null,
  stationId: null,
  positionName: '',
  jobName: '',
  taskCategory: '',
  scoreMethod: '',
  standardHours: null,
  points: null,
  quantity: 1,
  pointsRule: '',
  quantityEditable: 0,
  dispatchReviewRequired: 0,
  originalPositionName: ''
});

const resetJobForm = () => {
  jobForm.id = null;
  jobForm.stationId = userStore.roleCode === 'station_manager'
    ? (userStore.stations?.[0]?.id ?? null)
    : null;
  jobForm.positionName = '';
  jobForm.jobName = '';
  jobForm.taskCategory = '';
  jobForm.scoreMethod = '';
  jobForm.standardHours = null;
  jobForm.points = null;
  jobForm.quantity = 1;
  jobForm.pointsRule = '';
  jobForm.quantityEditable = 0;
  jobForm.dispatchReviewRequired = 0;
  jobForm.originalPositionName = '';
};

const openJobDialog = (row = null) => {
  if (row) {
    jobForm.id = row.id;
    jobForm.stationId = row.station_id;
    jobForm.positionName = row.position_name;
    jobForm.jobName = row.job_name;
    jobForm.taskCategory = row.task_category ?? '';
    jobForm.scoreMethod = row.score_method ?? '';
    jobForm.standardHours = row.standard_hours ?? null;
    jobForm.points = row.points ?? null;
    jobForm.quantity = row.quantity ?? 1;
    jobForm.pointsRule = row.points_rule ?? '';
    jobForm.quantityEditable = row.quantity_editable ?? 0;
    jobForm.dispatchReviewRequired = row.dispatch_review_required ?? 0;
    jobForm.originalPositionName = row.position_name ?? '';
  } else {
    resetJobForm();
  }
  jobDialogVisible.value = true;
};

const saveJob = async () => {
  if (!jobForm.stationId || !jobForm.positionName || !jobForm.jobName) {
    ElMessage.warning('请填写场站、岗位和任务名称');
    return;
  }
  if (jobForm.points === null || jobForm.points === undefined || jobForm.points === '') {
    ElMessage.warning('请填写单位积分');
    return;
  }
  const quantityValue = Number.parseInt(jobForm.quantity, 10);
  if (!Number.isInteger(quantityValue) || quantityValue < 1 || quantityValue > 1000) {
    ElMessage.warning('数量必须是 1-1000 的整数');
    return;
  }

  savingJob.value = true;
  try {
    const payload = {
      stationId: jobForm.stationId,
      positionName: jobForm.positionName,
      jobName: jobForm.jobName,
      taskCategory: jobForm.taskCategory,
      scoreMethod: jobForm.scoreMethod,
      standardHours: jobForm.standardHours,
      points: jobForm.points,
      quantity: quantityValue,
      pointsRule: jobForm.pointsRule,
      quantityEditable: jobForm.quantityEditable,
      dispatchReviewRequired: jobForm.dispatchReviewRequired
    };
    if (jobForm.id) {
      const renamePosition = jobForm.originalPositionName
        && jobForm.positionName !== jobForm.originalPositionName;
      if (renamePosition) {
        await ElMessageBox.confirm(
          '修改岗位名称会同步更新该岗位下所有任务与排班记录，是否继续？',
          '确认修改',
          { type: 'warning' }
        );
      }
      await positionJobApi.updatePositionJob(jobForm.id, { ...payload, renamePosition });
    } else {
      await positionJobApi.createPositionJob(payload);
    }
    ElMessage.success('保存成功');
    jobDialogVisible.value = false;
    await loadPositionJobs();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message ?? '保存失败');
    }
  } finally {
    savingJob.value = false;
  }
};

const deleteJob = async (row, confirmed = false) => {
  try {
    const result = await positionJobApi.deletePositionJob(row.id, confirmed);
    if (result?.needConfirm) {
      const count = result.scheduleCount ?? 0;
      await ElMessageBox.confirm(
        `该岗位当前有 ${count} 个排班，删除后将移除未来排班记录，是否继续？`,
        '确认删除',
        { type: 'warning' }
      );
      await deleteJob(row, true);
      return;
    }
    ElMessage.success('删除成功');
    await loadPositionJobs();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message ?? '删除失败');
    }
  }
};

const apiBaseUrl = computed(() => import.meta.env.VITE_API_BASE_URL ?? '/api');
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${userStore.token}`
}));

const beforeUpload = (file) => {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    || file.type === 'application/vnd.ms-excel';
  if (!isExcel) {
    ElMessage.error('只能上传Excel文件');
  }
  return isExcel;
};

const handleImportSuccess = (response) => {
  if (response.code === 200) {
    ElMessage.success(response.message ?? '导入成功');
    loadPositionJobs();
  } else {
    ElMessage.error(response.message ?? '导入失败');
  }
};

const handleImportError = () => {
  ElMessage.error('导入失败');
};

const downloadTemplate = async () => {
  try {
    const response = await positionJobApi.downloadTemplate();
    const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '岗位任务模板.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    ElMessage.error('下载模板失败');
  }
};

const applyDialogVisible = ref(false);
const submittingApply = ref(false);
const applyForm = reactive({
  positionJobId: null,
  jobName: '',
  stationId: null,
  stationName: '',
  positionName: '',
  workDate: dayjs().format('YYYY-MM-DD'),
  quantity: 1,
  quantityEditable: false,
  remark: ''
});

const openApplyDialog = (row) => {
  applyForm.positionJobId = row.id;
  applyForm.jobName = row.job_name;
  applyForm.stationId = row.station_id;
  applyForm.stationName = row.station?.station_name ?? '';
  applyForm.positionName = row.position_name;
  applyForm.workDate = dayjs().format('YYYY-MM-DD');
  applyForm.quantity = row.quantity ?? 1;
  applyForm.quantityEditable = Number(row.quantity_editable) === 1;
  applyForm.remark = '';
  applyDialogVisible.value = true;
};

const submitApply = async () => {
  const quantityValue = Number.parseInt(applyForm.quantity, 10);
  if (!Number.isInteger(quantityValue) || quantityValue < 1 || quantityValue > 1000) {
    ElMessage.warning('数量必须是 1-1000 的整数');
    return;
  }
  submittingApply.value = true;
  try {
    await positionWorkLogApi.applyWorkLog({
      positionJobId: applyForm.positionJobId,
      workDate: applyForm.workDate,
      stationId: applyForm.stationId,
      stationName: applyForm.stationName,
      positionName: applyForm.positionName,
      quantity: quantityValue,
      remark: applyForm.remark
    });
    ElMessage.success('申请成功');
    applyDialogVisible.value = false;
  } catch (error) {
    ElMessage.error(error.message ?? '申请失败');
  } finally {
    submittingApply.value = false;
  }
};

const dispatchDialogVisible = ref(false);
const submittingDispatch = ref(false);
const executorOptions = ref([]);
const dispatchForm = reactive({
  positionJobId: null,
  jobName: '',
  stationId: null,
  stationName: '',
  positionName: '',
  workDate: dayjs().format('YYYY-MM-DD'),
  executorId: null,
  quantity: 1
});

const loadExecutors = async (stationId) => {
  try {
    const params = {
      pageSize: 500,
      stationId: stationId ?? undefined
    };
    const res = await request.get('/users', { params });
    executorOptions.value = res?.list ?? res ?? [];
  } catch (error) {
    executorOptions.value = [];
  }
};

const openDispatchDialog = async (row) => {
  dispatchForm.positionJobId = row.id;
  dispatchForm.jobName = row.job_name;
  dispatchForm.stationId = row.station_id;
  dispatchForm.stationName = row.station?.station_name ?? '';
  dispatchForm.positionName = row.position_name;
  dispatchForm.workDate = dayjs().format('YYYY-MM-DD');
  dispatchForm.executorId = null;
  dispatchForm.quantity = row.quantity ?? 1;
  dispatchDialogVisible.value = true;
  await loadExecutors(row.station_id);
};

const submitDispatch = async () => {
  if (!dispatchForm.executorId) {
    ElMessage.warning('请选择执行人');
    return;
  }
  const quantityValue = Number.parseInt(dispatchForm.quantity, 10);
  if (!Number.isInteger(quantityValue) || quantityValue < 1 || quantityValue > 1000) {
    ElMessage.warning('数量必须是 1-1000 的整数');
    return;
  }
  submittingDispatch.value = true;
  try {
    await positionWorkLogApi.dispatchWorkLog({
      positionJobId: dispatchForm.positionJobId,
      executorId: dispatchForm.executorId,
      workDate: dispatchForm.workDate,
      stationId: dispatchForm.stationId,
      stationName: dispatchForm.stationName,
      positionName: dispatchForm.positionName,
      quantity: quantityValue
    });
    ElMessage.success('派发成功');
    dispatchDialogVisible.value = false;
  } catch (error) {
    ElMessage.error(error.message ?? '派发失败');
  } finally {
    submittingDispatch.value = false;
  }
};

watch([() => props.defaultTab, () => allowManagement.value], () => {
  handleViewChange();
});

onMounted(() => {
  handleViewChange();
});
</script>

<style lang="scss" scoped>
.position-work-page {
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
        align-items: center;
      }
    }

    .filter-bar {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .pagination-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }
  }

  .cell-ellipsis {
    display: inline-block;
    max-width: 160px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    vertical-align: middle;
  }
}
</style>
