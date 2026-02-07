<template>
  <div class="temporary-tasks-page">
    <div class="page-header">
      <h2>{{ pageTitle }}</h2>
    </div>

    <el-card class="filter-card">
      <FilterBar>
        <div class="filter-item">
          <span class="filter-label">任务名称</span>
          <FilterAutocomplete
            v-model="filters.taskName"
            :fetch-suggestions="fetchTaskNameSuggestions"
            trigger-on-focus
            placeholder="全部"
            clearable
            style="width: 180px"
            @select="handleSearch"
            @input="handleSearch"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">执行人</span>
          <FilterAutocomplete
            v-model="filters.assigneeName"
            :fetch-suggestions="fetchAssigneeNameSuggestions"
            trigger-on-focus
            placeholder="全部"
            clearable
            style="width: 140px"
            @select="handleSearch"
            @input="handleSearch"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">开始日期</span>
          <el-date-picker
            v-model="filters.startDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="全部"
            @change="handleSearch"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">结束日期</span>
          <el-date-picker
            v-model="filters.endDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="全部"
            @change="handleSearch"
          />
        </div>
      </FilterBar>
    </el-card>

    <TableWrapper>
      <el-table :data="taskList" border stripe v-loading="loading">
        <el-table-column prop="assigneeName" label="用户名" width="120" />
        <el-table-column prop="stationName" label="场站" width="140" />


        <el-table-column prop="taskName" label="任务名称" min-width="170" />
        <el-table-column prop="description" label="具体工作内容" min-width="220" show-overflow-tooltip />
        <el-table-column label="标准工时(h/d)" width="120">
          <template #default="{ row }">{{ row.workHours ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="单位积分" width="130">
          <template #default="{ row }">
            <template v-if="isFillMode && canSubmit(row)">
              <el-input-number
                v-model="row.unitPoints"
                :min="0"
                :max="9999"
                :step="1"
                :precision="0"
                size="small"
                controls-position="right"
                :disabled="Number(row.unitPointsEditable) !== 1"
                class="table-input-number"
              />
            </template>
            <template v-else>
              {{ row.unitPoints ?? '-' }}
            </template>
          </template>
        </el-table-column>
        <el-table-column label="数量" width="130">
          <template #default="{ row }">
            <template v-if="isFillMode && canSubmit(row)">
              <el-input-number
                v-model="row.quantity"
                :min="1"
                :max="1000"
                :step="1"
                :precision="0"
                size="small"
                controls-position="right"
                class="table-input-number"
              />
            </template>
            <template v-else>
              {{ row.quantity ?? 1 }}
            </template>
          </template>
        </el-table-column>
        <el-table-column label="任务来源" width="120">
          <template #default="{ row }">{{ taskSourceLabel(row.source) }}</template>
        </el-table-column>
        <el-table-column label="截止时间" width="160">
          <template #default="{ row }">{{ formatTime(row.deadline) }}</template>
        </el-table-column>
        <el-table-column label="完成情况" width="140">
          <template #default="{ row }">
            <template v-if="isFillMode && canSubmit(row)">
              <el-radio-group v-model="row.isCompleted" size="small">
                <el-radio :label="1">完成</el-radio>
                <el-radio :label="0">未完成</el-radio>
              </el-radio-group>
            </template>
            <template v-else>
              <el-tag :type="Number(row.isCompleted) === 1 ? 'success' : 'info'">
                {{ Number(row.isCompleted) === 1 ? '完成' : '未完成' }}
              </el-tag>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="160">
          <template #default="{ row }">
            <template v-if="isFillMode && canSubmit(row)">
              <el-input v-model="row.remark" size="small" maxlength="200" placeholder="填写备注" />
            </template>
            <template v-else>
              {{ row.remark || '-' }}
            </template>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="160">
          <template #default="{ row }">{{ formatTime(row.submitTime) }}</template>
        </el-table-column>
        <el-table-column label="审核状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审核人" width="120">
          <template #default="{ row }">{{ row.approverName || '-' }}</template>
        </el-table-column>
        <el-table-column label="审核时间" width="160">
          <template #default="{ row }">{{ formatTime(row.approveTime) }}</template>
        </el-table-column>
        <el-table-column label="扣分原因" min-width="140">
          <template #default="{ row }">{{ row.deductionReason || '-' }}</template>
        </el-table-column>
        <el-table-column label="扣分值" width="100">
          <template #default="{ row }">{{ row.deductionPoints ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button v-if="isFillMode && canSubmit(row)" type="primary" size="small" @click="submitTask(row)">
              提交
            </el-button>
            <el-button v-else-if="isHistoryMode && canReview(row)" link type="primary" @click="openReview(row)">
              审核
            </el-button>
            <span v-else>—</span>
          </template>
        </el-table-column>
      </el-table>
    </TableWrapper>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[5, 10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @current-change="loadTasks"
        @size-change="handlePageSizeChange"
      />
    </div>

    <FormDialog
      v-model="reviewDialogVisible"
      title="审核任务"
      width="520px"
      :show-confirm="false"
      :show-cancel="false"
    >
      <el-form :model="reviewForm" label-width="100px">
        <el-form-item label="任务名称">{{ reviewForm.taskName }}</el-form-item>
        <el-form-item label="执行人">{{ reviewForm.assigneeName }}</el-form-item>
        <el-form-item label="审核结果">
          <el-radio-group v-model="reviewForm.status">
            <el-radio label="approved">审核通过</el-radio>
            <el-radio label="rejected">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <template v-if="reviewForm.status === 'rejected'">
          <el-form-item label="扣分原因">
            <el-input v-model="reviewForm.deductionReason" type="textarea" :rows="3" maxlength="200" />
          </el-form-item>
          <el-form-item label="扣分值">
            <el-input-number v-model="reviewForm.deductionPoints" :max="0" :step="1" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="reviewSubmitting" @click="confirmReview">提交审核</el-button>
      </template>
    </FormDialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import dayjs from 'dayjs';
import { ElMessage } from 'element-plus';

import { createListSuggestionFetcher } from '@/utils/filterAutocomplete';
import request from '@/api/request';
import FormDialog from '@/components/system/FormDialog.vue';
import { useUserStore } from '@/store/modules/user';

const props = defineProps({
  mode: { type: String, default: 'fill' }
});

const userStore = useUserStore();
const isFillMode = computed(() => props.mode !== 'history');
const isHistoryMode = computed(() => props.mode === 'history');
const pageTitle = computed(() => (isFillMode.value ? '临时任务填报' : '临时任务完成情况记录'));
const effectiveRole = computed(() => userStore.baseRoleCode || userStore.roleCode);

const loading = ref(false);
const taskList = ref([]);
const taskSuggestionList = ref([]);

const fetchTaskNameSuggestions = createListSuggestionFetcher(
  () => taskSuggestionList.value,
  (row) => row.taskName
);
const fetchAssigneeNameSuggestions = createListSuggestionFetcher(
  () => taskSuggestionList.value,
  (row) => row.assigneeName
);

const pagination = ref({ page: 1, pageSize: 10, total: 0 });
const filters = ref({
  taskName: '',
  assigneeName: '',
  startDate: '',
  endDate: ''
});

const reviewDialogVisible = ref(false);
const reviewSubmitting = ref(false);
const reviewTarget = ref(null);
const reviewForm = ref({
  taskName: '',
  assigneeName: '',
  status: 'approved',
  deductionReason: '',
  deductionPoints: 0
});

const statusText = (status) => {
  const map = {
    pending: '待处理',
    processing: '已提交待审',
    completed: '已通过',
    rejected: '驳回'
  };
  return map[status] || status || '-';
};

const statusTagType = (status) => {
  const map = {
    pending: 'info',
    processing: 'warning',
    completed: 'success',
    rejected: 'danger'
  };
  return map[status] || 'info';
};

const formatTime = (value) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-');

const taskSourceLabel = (source) => {
  if (source === 'position_dispatch') return '派发任务';
  return '临时任务';
};

const normalizeTask = (item) => ({
  ...item,
  source: item.source || item.task_source || 'temporary',
  taskName: item.task_name || item.taskName || item.work_name || '',
  description: item.task_description || item.description || '',
  assigneeName: item.executor_name || item.executorName || item.executor?.real_name || item.assignee?.real_name || '',
  stationName: item.station_name || item.stationName || '',
  positionName: item.position_name || item.positionName || '',
  workHours: item.standard_hours ?? item.standardHours ?? null,
  unitPoints: item.unit_points ?? item.points ?? 0,
  unitPointsEditable: item.unit_points_editable ?? item.unitPointsEditable ?? 1,
  quantity: item.quantity ?? 1,
  deadline: item.plan_end_time || item.deadline || null,
  isCompleted: Number(item.is_completed ?? 1),
  remark: item.completion_note || item.remark || '',
  submitTime: item.submit_time || null,
  approverName: item.approver_name || '',
  approveTime: item.approve_time || null,
  deductionReason: item.deduction_reason || '',
  deductionPoints: item.deduction_points ?? null,
  status: item.status || 'pending',
  workDate: item.work_date || item.workDate || null,
  positionJobId: item.position_job_id || item.positionJobId || null
});

const canSubmit = (row) => {
  const selfId = String(userStore.userId ?? '');
  const assigneeId = String(row.executor_id ?? row.assigneeId ?? row.executor?.id ?? '');
  return selfId && assigneeId === selfId && ['pending', 'rejected'].includes(row.status);
};

const canReview = (row) => {
  if (row.status !== 'processing') return false;
  return ['station_manager', 'department_manager', 'deputy_manager', 'senior_management', 'dev_test'].includes(effectiveRole.value);
};

const buildSubmitPayloadForDispatch = (row) => ({
  logId: row.id,
  positionJobId: row.positionJobId,
  workDate: row.workDate || (row.deadline ? dayjs(row.deadline).format('YYYY-MM-DD') : null),
  stationId: row.station_id ?? row.stationId ?? null,
  stationName: row.stationName || '',
  positionName: row.positionName || '',
  workName: row.taskName || '',
  standardHours: row.workHours,
  actualHours: row.workHours,
  isCompleted: Number(row.isCompleted) === 1 ? 1 : 0,
  progress: Number(row.isCompleted) === 1 ? 100 : 0,
  remark: row.remark || '',
  unitPoints: row.unitPoints ?? 0,
  quantity: row.quantity ?? 1,
  taskSource: 'dispatch'
});

const loadTasks = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      status: isFillMode.value ? 'unfinished' : 'history',
      taskName: filters.value.taskName || undefined,
      assigneeName: filters.value.assigneeName || undefined,
      startDate: filters.value.startDate || undefined,
      endDate: filters.value.endDate || undefined
    };
    const res = await request.get('/temporary-tasks', { params });
    taskList.value = (res.list || []).map(normalizeTask);
    pagination.value.total = res.total || 0;
    loadTaskSuggestions(params);
  } finally {
    loading.value = false;
  }
};

const loadTaskSuggestions = async (baseParams) => {
  try {
    const params = {
      ...baseParams,
      page: 1,
      pageSize: 5000
    };
    const res = await request.get('/temporary-tasks', { params });
    taskSuggestionList.value = (res.list || []).map(normalizeTask);
  } catch (error) {
    taskSuggestionList.value = [];
  }
};

const submitTask = async (row) => {
  try {
    if (row.source === 'position_dispatch') {
      await request.post('/position-work-logs', buildSubmitPayloadForDispatch(row));
    } else {
      await request.put(`/temporary-tasks/${row.id}/submit`, {
        isCompleted: Number(row.isCompleted) === 1 ? 1 : 0,
        actualHours: row.workHours ?? 0,
        completionNote: row.remark || '',
        unitPoints: row.unitPoints ?? 0,
        quantity: row.quantity ?? 1
      });
    }
    ElMessage.success('提交成功');
    await loadTasks();
  } catch (error) {
    ElMessage.error(error?.message || '提交失败');
  }
};

const openReview = (row) => {
  reviewTarget.value = row;
  reviewForm.value = {
    taskName: row.taskName,
    assigneeName: row.assigneeName,
    status: 'approved',
    deductionReason: '',
    deductionPoints: 0
  };
  reviewDialogVisible.value = true;
};

const confirmReview = async () => {
  if (!reviewTarget.value) return;
  reviewSubmitting.value = true;
  try {
    if (reviewTarget.value.source === 'position_dispatch') {
      await request.put(`/position-work-logs/${reviewTarget.value.id}/review`, {
        status: reviewForm.value.status,
        deductionReason: reviewForm.value.status === 'rejected' ? reviewForm.value.deductionReason : undefined,
        deductionPoints: reviewForm.value.status === 'rejected' ? reviewForm.value.deductionPoints : undefined
      });
    } else {
      await request.put(`/temporary-tasks/${reviewTarget.value.id}/review`, {
        status: reviewForm.value.status,
        deductionReason: reviewForm.value.status === 'rejected' ? reviewForm.value.deductionReason : undefined,
        deductionPoints: reviewForm.value.status === 'rejected' ? reviewForm.value.deductionPoints : undefined
      });
    }
    ElMessage.success('审核成功');
    reviewDialogVisible.value = false;
    await loadTasks();
  } catch (error) {
    ElMessage.error(error?.message || '审核失败');
  } finally {
    reviewSubmitting.value = false;
  }
};

const handleSearch = () => {
  pagination.value.page = 1;
  loadTasks();
};

const handlePageSizeChange = () => {
  pagination.value.page = 1;
  loadTasks();
};

watch(
  () => props.mode,
  () => {
    pagination.value.page = 1;
    loadTasks();
  }
);

onMounted(() => {
  loadTasks();
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
  }

  .filter-card {
    margin-bottom: 16px;
  }

  :deep(.table-input-number) {
    width: 100%;
  }

  :deep(.table-input-number .el-input__wrapper) {
    width: 100%;
  }

  :deep(.table-input-number.is-controls-right .el-input__wrapper) {
    padding-right: 52px;
  }

  :deep(.table-input-number.is-controls-right .el-input-number__decrease),
  :deep(.table-input-number.is-controls-right .el-input-number__increase) {
    width: 26px;
  }


  :deep(.table-input-number .el-input-number__decrease),
  :deep(.table-input-number .el-input-number__increase) {
    right: 0;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>

