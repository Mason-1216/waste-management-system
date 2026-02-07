<template>
  <div class="position-work-records">
    <div class="page-header">
      <h2>岗位工作完成情况记录</h2>
      <div class="header-actions">
        <el-button @click="loadRecords">刷新</el-button>
      </div>
    </div>

    <el-card class="filter-card">
      <FilterBar>
        <div class="filter-item">
          <span class="filter-label">用户名</span>
          <FilterAutocomplete
            v-model="filters.userName"
            :fetch-suggestions="fetchUserNameSuggestions"
            trigger-on-focus
            placeholder="全部"
            clearable
            style="width: 140px"
            @select="loadRecords"
            @input="loadRecords"
            @clear="loadRecords"
            @keyup.enter="loadRecords"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">场站</span>
          <FilterSelect
            v-model="filters.stationId"
            placeholder="全部"
            clearable
            filterable
            style="width: 200px"
            @change="handleFilterChange"
            @clear="handleFilterChange"
          >
            <el-option label="全部" :value="null" />
            <el-option
              v-for="s in stations"
              :key="s.id"
              :label="s.stationName"
              :value="s.id"
            />
          </FilterSelect>
        </div>
        <div class="filter-item">
          <span class="filter-label">岗位</span>
          <FilterAutocomplete
            v-model="filters.positionName"
            :fetch-suggestions="fetchPositionNameSuggestions"
            trigger-on-focus
            placeholder="全部"
            clearable
            style="width: 140px"
            @select="loadRecords"
            @input="loadRecords"
            @clear="loadRecords"
            @keyup.enter="loadRecords"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">任务名称</span>
          <FilterAutocomplete
            v-model="filters.workName"
            :fetch-suggestions="fetchWorkNameSuggestions"
            trigger-on-focus
            placeholder="全部"
            clearable
            style="width: 160px"
            @select="loadRecords"
            @input="loadRecords"
            @clear="loadRecords"
            @keyup.enter="loadRecords"
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
            style="width: 140px"
            @select="loadRecords"
            @input="loadRecords"
            @clear="loadRecords"
            @keyup.enter="loadRecords"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">给分方式</span>
          <FilterSelect v-model="filters.scoreMethod" placeholder="全部" filterable clearable style="width: 150px" @change="loadRecords" @clear="loadRecords">
            <el-option v-for="option in scoreMethodOptions" :key="option" :label="option" :value="option" />
          </FilterSelect>
        </div>
        <div class="filter-item">
          <span class="filter-label">任务来源</span>
          <FilterSelect v-model="filters.taskSource" placeholder="全部" filterable clearable style="width: 140px" @change="loadRecords" @clear="loadRecords">
            <el-option v-for="option in taskSourceOptions" :key="option.value" :label="option.label" :value="option.value" />
          </FilterSelect>
        </div>
        <div class="filter-item">
          <span class="filter-label">完成情况</span>
          <FilterSelect v-model="filters.isCompleted" placeholder="全部" filterable clearable style="width: 120px" @change="loadRecords" @clear="loadRecords">
            <el-option v-for="option in completionOptions" :key="option.value" :label="option.label" :value="option.value" />
          </FilterSelect>
        </div>
        <div class="filter-item">
          <span class="filter-label">提交开始</span>
          <el-date-picker
            v-model="filters.submitStartDate"
            type="date"
            placeholder="全部"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="loadRecords"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">提交结束</span>
          <el-date-picker
            v-model="filters.submitEndDate"
            type="date"
            placeholder="全部"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="loadRecords"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">审核状态</span>
          <FilterSelect v-model="filters.reviewStatus" placeholder="全部" filterable clearable style="width: 140px" @change="loadRecords" @clear="loadRecords">
            <el-option v-for="option in reviewStatusOptions" :key="option.value" :label="option.label" :value="option.value" />
          </FilterSelect>
        </div>
        <div class="filter-item">
          <span class="filter-label">审核人</span>
          <FilterAutocomplete
            v-model="filters.approverName"
            :fetch-suggestions="fetchApproverNameSuggestions"
            trigger-on-focus
            placeholder="全部"
            clearable
            style="width: 140px"
            @select="loadRecords"
            @input="loadRecords"
            @clear="loadRecords"
            @keyup.enter="loadRecords"
          />
        </div>
      </FilterBar>
    </el-card>

    <el-table
      v-loading="loading"
      :data="records"
      stripe
      border
      style="width: 100%"
    >
      <el-table-column prop="user_name" label="用户名" width="120" />
      <el-table-column prop="station_name" label="场站" width="140" />
      <el-table-column prop="position_name" label="岗位" width="120" />
      <el-table-column prop="work_name" label="任务名称" min-width="160" />
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
      <el-table-column prop="unit_points" label="单位积分" width="100">
        <template #default="{ row }">
          {{ row.unit_points ?? '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="quantity" label="数量" width="90">
        <template #default="{ row }">
          {{ row.quantity ?? 1 }}
        </template>
      </el-table-column>
      <el-table-column label="计算积分" width="110">
        <template #default="{ row }">
          {{ formatPoints(row.unit_points, row.quantity) }}
        </template>
      </el-table-column>
      <el-table-column label="任务来源" width="120">
        <template #default="{ row }">
          {{ taskSourceLabel(row.task_source) }}
        </template>
      </el-table-column>
      <el-table-column label="完成情况" width="100">
        <template #default="{ row }">
          <el-tag :type="Number(row.is_completed) === 1 ? 'success' : 'info'">
            {{ Number(row.is_completed) === 1 ? '完成' : '未完成' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="提交时间" width="160">
        <template #default="{ row }">
          {{ formatTime(row.submit_time) }}
        </template>
      </el-table-column>
      <el-table-column label="审核状态" width="120">
        <template #default="{ row }">
          <el-tag :type="reviewStatusType(row)">
            {{ reviewStatusText(row) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="approver_name" label="审核人" width="120">
        <template #default="{ row }">
          {{ row.approver_name ?? '-' }}
        </template>
      </el-table-column>
      <el-table-column label="审核时间" width="160">
        <template #default="{ row }">
          {{ formatTime(row.approve_time) }}
        </template>
      </el-table-column>
      <el-table-column prop="deduction_reason" label="扣分原因" min-width="160">
        <template #default="{ row }">
          <span class="cell-ellipsis" :title="row.deduction_reason ?? ''">
            {{ row.deduction_reason ?? '-' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="deduction_points" label="扣分值" width="100">
        <template #default="{ row }">
          {{ row.deduction_points ?? '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="canReview(row)"
            link
            type="primary"
            @click="openReviewDialog(row)"
          >
            审核
          </el-button>
          <span v-else>—</span>
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
        @current-change="loadRecords"
        @size-change="handlePageSizeChange"
      />
    </div>

    <FormDialog
      v-model="reviewDialogVisible"
      title="审核工作记录"
      width="520px"
      :show-confirm="false"
      :show-cancel="false"
    >
      <el-form :model="reviewForm" label-width="120px">
        <el-form-item label="任务名称">
          <span>{{ reviewForm.workName }}</span>
        </el-form-item>
        <el-form-item label="提交人">
          <span>{{ reviewForm.userName }}</span>
        </el-form-item>
        <el-form-item label="审核结果" required>
          <el-radio-group v-model="reviewForm.status">
            <el-radio label="approved">审核通过</el-radio>
            <el-radio label="rejected">审核未通过</el-radio>
          </el-radio-group>
        </el-form-item>
        <template v-if="reviewForm.status === 'rejected'">
          <el-form-item label="扣分原因" required>
            <el-input
              v-model="reviewForm.deductionReason"
              type="textarea"
              :rows="3"
              maxlength="200"
              placeholder="填写扣分原因"
            />
          </el-form-item>
          <el-form-item label="扣分值" required>
            <el-input-number
              v-model="reviewForm.deductionPoints"
              :max="0"
              :step="1"
              :precision="2"
              placeholder="填写0或负数"
              style="width: 180px"
            />
            <span class="hint">可为0或负数</span>
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="reviewSubmitting" @click="submitReview">
          确认
        </el-button>
      </template>
    </FormDialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import dayjs from 'dayjs';

import FilterBar from '@/components/common/FilterBar.vue';
import { createListSuggestionFetcher } from '@/utils/filterAutocomplete';
import { getAllStations } from '@/api/station';
import { useUserStore } from '@/store/modules/user';
import * as positionWorkLogApi from '@/api/positionWorkLog';
import FormDialog from '@/components/system/FormDialog.vue';

const userStore = useUserStore();

const managerRoles = ['station_manager', 'department_manager', 'deputy_manager', 'senior_management'];
const canReviewRole = computed(() => userStore.hasRole(managerRoles));

const taskSourceOptions = [
  { value: 'fixed', label: '固定岗位工作' },
  { value: 'dispatch', label: '派发任务' },
  { value: 'self_apply', label: '自行申请' }
];

const scoreMethodOptions = ['奖扣结合式', '扣分项', '奖分项'];

const completionOptions = [
  { value: 1, label: '完成' },
  { value: 0, label: '未完成' }
];

const reviewStatusOptions = [
  { value: 'pending', label: '待审核' },
  { value: 'auto_approved', label: '自动通过' },
  { value: 'approved', label: '审核通过' },
  { value: 'rejected', label: '审核未通过' }
];

const today = dayjs().format('YYYY-MM-DD');
const filters = reactive({
  userName: '',
  stationId: null,
  positionName: '',
  workName: '',
  taskCategory: '',
  scoreMethod: '',
  taskSource: '',
  isCompleted: '',
  submitStartDate: dayjs().subtract(5, 'day').format('YYYY-MM-DD'),
  submitEndDate: today,
  reviewStatus: '',
  approverName: '',
});

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
});


const records = ref([]);
const recordSuggestionList = ref([]);
const loading = ref(false);
const stations = ref([]);

const fetchUserNameSuggestions = createListSuggestionFetcher(
  () => recordSuggestionList.value,
  (row) => row.user_name
);
const fetchPositionNameSuggestions = createListSuggestionFetcher(
  () => recordSuggestionList.value,
  (row) => row.position_name
);
const fetchWorkNameSuggestions = createListSuggestionFetcher(
  () => recordSuggestionList.value,
  (row) => row.work_name
);
const fetchTaskCategorySuggestions = createListSuggestionFetcher(
  () => recordSuggestionList.value,
  (row) => row.task_category
);
const fetchApproverNameSuggestions = createListSuggestionFetcher(
  () => recordSuggestionList.value,
  (row) => row.approver_name
);

const resolveTextValue = (value) => (typeof value === 'string' ? value.trim() : '');
const hasValue = (value) => value !== undefined && value !== null && value !== '';

const buildParams = () => {
  const params = {
    page: pagination.page,
    pageSize: pagination.pageSize
  };

  const userName = resolveTextValue(filters.userName);
  if (userName) params.userName = userName;

  if (hasValue(filters.stationId)) {
    params.stationId = filters.stationId;
  }

  const positionName = resolveTextValue(filters.positionName);
  if (positionName) params.positionName = positionName;

  const workName = resolveTextValue(filters.workName);
  if (workName) params.workName = workName;

  const taskCategory = resolveTextValue(filters.taskCategory);
  if (taskCategory) params.taskCategory = taskCategory;

  if (filters.scoreMethod) {
    params.scoreMethod = filters.scoreMethod;
  }

  if (filters.taskSource) {
    params.taskSource = filters.taskSource;
  }

  if (hasValue(filters.isCompleted)) {
    params.isCompleted = filters.isCompleted;
  }

  if (filters.submitStartDate) {
    params.submitStartDate = filters.submitStartDate;
  }
  if (filters.submitEndDate) {
    params.submitEndDate = filters.submitEndDate;
  }

  if (filters.reviewStatus) {
    params.reviewStatus = filters.reviewStatus;
  }

  const approverName = resolveTextValue(filters.approverName);
  if (approverName) params.approverName = approverName;

  return params;
};

const buildSuggestionParams = () => {
  const params = buildParams();
  params.page = 1;
  params.pageSize = 5000;
  return params;
};

const resetFilters = () => {
  filters.userName = '';
  filters.stationId = null;
  filters.positionName = '';
  filters.workName = '';
  filters.taskCategory = '';
  filters.scoreMethod = '';
  filters.taskSource = '';
  filters.isCompleted = '';
  filters.submitStartDate = dayjs().subtract(5, 'day').format('YYYY-MM-DD');
  filters.submitEndDate = today;
  filters.reviewStatus = '';
  filters.approverName = '';
  pagination.page = 1;
  loadRecords();
};

const loadStations = async () => {
  try {
    const res = await getAllStations();
    const list = res?.data || res || [];
    stations.value = (Array.isArray(list) ? list : []).map(item => ({
      ...item,
      stationName: item.stationName || item.station_name || item.name || ''
    }));
  } catch {
    stations.value = [];
  }
};

const handleFilterChange = () => {
  pagination.page = 1;
  loadRecords();
};

const loadRecords = async () => {
  loading.value = true;
  try {
    const result = await positionWorkLogApi.getWorkRecords(buildParams());
    records.value = result?.list ?? [];
    pagination.total = result?.total ?? 0;
    loadRecordSuggestions();
  } catch (error) {
    ElMessage.error('加载记录失败');
  } finally {
    loading.value = false;
  }
};

const loadRecordSuggestions = async () => {
  try {
    const result = await positionWorkLogApi.getWorkRecords(buildSuggestionParams());
    recordSuggestionList.value = result?.list ?? [];
  } catch (error) {
    recordSuggestionList.value = [];
  }
};

const handlePageSizeChange = (size) => {
  if (typeof size === 'number') {
    pagination.pageSize = size;
  }
  pagination.page = 1;
  loadRecords();
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
  const status = row.review_status;
  const source = row.task_source;
  if (source === 'self_apply') {
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
  const status = row.review_status;
  const source = row.task_source;
  if (source === 'self_apply') {
    if (status === 'approved') return 'success';
    if (status === 'rejected') return 'danger';
    return 'warning';
  }
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'danger';
  if (status === 'pending') return 'warning';
  return 'info';
};

const formatTime = (value) => {
  if (!value) return '-';
  const timeValue = dayjs(value);
  if (!timeValue.isValid()) return '-';
  return timeValue.format('YYYY-MM-DD HH:mm:ss');
};

const canReview = (row) => {
  if (!canReviewRole.value) return false;
  if (!row.submit_time) return false;
  return row.review_status !== 'approved' && row.review_status !== 'rejected';
};

const reviewDialogVisible = ref(false);
const reviewSubmitting = ref(false);
const reviewForm = reactive({
  id: null,
  workName: '',
  userName: '',
  status: 'approved',
  deductionReason: '',
  deductionPoints: null
});

const openReviewDialog = (row) => {
  reviewForm.id = row.id;
  reviewForm.workName = row.work_name ?? '';
  reviewForm.userName = row.user_name ?? '';
  reviewForm.status = 'approved';
  reviewForm.deductionReason = '';
  reviewForm.deductionPoints = null;
  reviewDialogVisible.value = true;
};

const submitReview = async () => {
  if (!reviewForm.id) return;
  if (reviewForm.status === 'rejected') {
    if (!reviewForm.deductionReason) {
      ElMessage.warning('请填写扣分原因');
      return;
    }
    if (reviewForm.deductionPoints === null || reviewForm.deductionPoints === undefined || reviewForm.deductionPoints === '') {
      ElMessage.warning('请填写扣分值');
      return;
    }
    const value = Number(reviewForm.deductionPoints);
    if (Number.isNaN(value) || value > 0) {
      ElMessage.warning('扣分值必须为0或负数');
      return;
    }
  }

  reviewSubmitting.value = true;
  try {
    await positionWorkLogApi.reviewWorkLog(reviewForm.id, {
      status: reviewForm.status,
      deductionReason: reviewForm.status === 'rejected' ? reviewForm.deductionReason : null,
      deductionPoints: reviewForm.status === 'rejected' ? reviewForm.deductionPoints : null
    });
    ElMessage.success('审核完成');
    reviewDialogVisible.value = false;
    await loadRecords();
  } catch (error) {
    ElMessage.error(error.message ?? '审核失败');
  } finally {
    reviewSubmitting.value = false;
  }
};

onMounted(() => {
  loadStations();
  loadRecords();
});
</script>

<style lang="scss" scoped>
.position-work-records {
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

  .filter-card {
    margin-bottom: 20px;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }

  .cell-ellipsis {
    display: inline-block;
    max-width: 160px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    vertical-align: middle;
  }

  .hint {
    color: #909399;
    margin-left: 8px;
    font-size: 12px;
  }
}
</style>
