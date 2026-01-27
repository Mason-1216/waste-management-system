<template>
  <div class="device-fault-page">
    <div class="page-header">
      <h2>设备维修记录</h2>
      <div class="actions">
        <el-button v-if="canReport" type="primary" @click="addRow">新增报障</el-button>
        <el-button @click="loadRecords">刷新</el-button>
      </div>
    </div>

    <FilterBar>
      <el-select v-model="filters.stationId" placeholder="场站" clearable style="width: 160px;" @change="loadRecords">
        <el-option
          v-for="station in stationFilterOptions"
          :key="station.id"
          :label="station.name"
          :value="station.id"
        />
      </el-select>
      <el-input
        v-model="filters.equipmentName"
        placeholder="设备名称"
        clearable
        style="width: 160px;"
        @clear="loadRecords"
        @keyup.enter="loadRecords"
      />
      <el-select v-model="filters.urgencyLevel" placeholder="紧急程度" clearable style="width: 140px;" @change="loadRecords">
        <el-option
          v-for="option in urgencyOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
      <el-input
        v-model="filters.repairPersonName"
        placeholder="维修人员"
        clearable
        style="width: 160px;"
        @clear="loadRecords"
        @keyup.enter="loadRecords"
      />
      <el-select v-model="filters.status" placeholder="状态" clearable style="width: 140px;" @change="loadRecords">
        <el-option label="草稿" value="draft_report" />
        <el-option label="已上报" value="submitted_report" />
        <el-option label="已派单" value="dispatched" />
        <el-option label="维修中" value="repairing" />
        <el-option label="退回重做" value="rework" />
        <el-option label="待验收" value="repaired_submitted" />
        <el-option label="已验收" value="accepted" />
        <el-option label="已归档" value="archived" />
      </el-select>
    </FilterBar>

    <TableWrapper>
      <el-table
        :data="records"
        border
        stripe
        class="fault-table"
        v-loading="loading"
        :row-key="rowKey"
      >
        <el-table-column label="表单编号">
          <template #default="{ row }">
            <span>{{ row.record_code || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="场站" width="140">
          <template #default="{ row }">
            <span>{{ row.station?.station_name || row.station_name || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="设备名称">
          <template #default="{ row }">
            <span>{{ row.equipment_name || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="安装地点">
          <template #default="{ row }">
            <span>{{ row.equipment_location || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="{ row }">
            <el-tag :type="statusTag(row)">{{ statusLabel(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="紧急程度">
          <template #default="{ row }">
            <el-tag :type="urgencyTag(row.urgency_level)">{{ urgencyLabel(row.urgency_level) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="上报人">
          <template #default="{ row }">
            <span>{{ row.reporter_name || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="派单人">
          <template #default="{ row }">
            <span>{{ row.dispatch_by_name || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="维修人员">
          <template #default="{ row }">
            <span>{{ formatRepairNames(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="任务积分合计" width="120">
          <template #default="{ row }">
            <span>{{ formatRepairTaskPointsTotal(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="验收人">
          <template #default="{ row }">
            <span>{{ row.verifier_name || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button size="small" @click="openDialog(row)">查看</el-button>
            <el-tooltip
              v-if="showDelete(row)"
              :content="deleteState(row).reason"
              placement="top"
              :disabled="deleteState(row).allowed"
            >
              <el-button
                size="small"
                type="danger"
                :disabled="!deleteState(row).allowed"
                @click="deleteRow(row)"
              >
                删除
              </el-button>
            </el-tooltip>
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
        @current-change="loadRecords"
        @size-change="loadRecords"
      />
    </div>
    <MaintenanceFaultDetailDialog
      v-model:visible="dialogVisible"
      :row="currentRow"
      :form-rules="formRules"
      :form-station-options="formStationOptions"
      :equipment-list="equipmentList"
      :urgency-options="urgencyOptions"
      :repairers="repairers"
      :get-flow-active="getFlowActive"
      :get-flow-steps="getFlowSteps"
      :can-edit-report="canEditReport"
      :can-edit-dispatch="canEditDispatch"
      :can-edit-repair="canEditRepair"
      :can-edit-verify="canEditVerify"
      :handle-station-change="handleStationChange"
      :handle-equipment-change="handleEquipmentChange"
      :on-repairer-change="onRepairerChange"
      :get-user-display-name="getUserDisplayName"
      :can-report="canReport"
      :can-dispatch="canDispatch"
      :can-repair="canRepair"
      :can-verify="canVerify"
      :is-draft-row="isDraftRow"
      :saving="saving"
      :row-key="rowKey"
      :save-report="saveReport"
      :dispatch-row="dispatchRow"
      :start-row-repair="startRowRepair"
      :save-repair-row="saveRepairRow"
      :submit-repair-row="submitRepairRow"
      :verify-row="verifyRow"
      :consumable-row-class="consumableRowClass"
      :part-row-class="partRowClass"
      :add-consumable="addConsumable"
      :remove-consumable="removeConsumable"
      :lock-consumable="lockConsumable"
      :unlock-consumable="unlockConsumable"
      :add-part="addPart"
      :remove-part="removePart"
      :lock-part="lockPart"
      :unlock-part="unlockPart"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import dayjs from 'dayjs';
import { useUserStore } from '@/store/modules/user';
import MaintenanceFaultDetailDialog from '@/components/maintenance/MaintenanceFaultDetailDialog.vue';
import {
  getRepairRecords,
  createRepairRecord,
  updateRepairRecord,
  deleteRepairRecord,
  submitRepairRecord,
  dispatchRepairRecord,
  startRepair,
  completeRepair,
  verifyRepairRecord
} from '@/api/repair';
import request from '@/api/request';
import { getEquipmentByCode, getEquipment } from '@/api/equipment';
import { getStations } from '@/api/station';

const userStore = useUserStore();

const records = ref([]);
const loading = ref(false);
const saving = ref({});
const repairers = ref([]);
const stations = ref([]);
const equipmentList = ref([]);
const isActiveStatus = (status) => status === undefined || status === null || status === '' || status === 'active' || status === 1 || status === '1' || status === true;
const activeStationList = computed(() => stations.value.filter(station => isActiveStatus(station.status)));
const formStationOptions = computed(() => {
  const selectedId = currentRow.value?.station_id;
  if (!selectedId) return activeStationList.value;
  const selected = stations.value.find(station => station.id === selectedId);
  if (selected && !isActiveStatus(selected.status)) {
    return [selected, ...activeStationList.value.filter(station => station.id !== selectedId)];
  }
  return activeStationList.value;
});

const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
});

const dialogVisible = ref(false);
const currentRow = ref(null);
const filters = ref({
  status: '',
  stationId: null,
  equipmentName: '',
  urgencyLevel: '',
  repairPersonName: ''
});

const stationFilterOptions = computed(() => {
  return (stations.value || [])
    .map(station => ({
      id: station.id,
      name: station.station_name || station.stationName || station.name || ''
    }))
    .filter(station => station.name);
});

const urgencyOptions = [
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' },
  { label: '紧急', value: 'critical' }
];

const formRules = {
  station_id: [
    { required: true, message: '请选择场站', trigger: 'change' }
  ],
  equipment_code: [
    { required: true, message: '请选择设备编号', trigger: 'change' }
  ],
  repair_person_id: [
    { required: true, message: '请选择维修负责人', trigger: 'change' }
  ]
};

const reportRoles = ['operator', 'station_manager', 'deputy_manager', 'department_manager', 'maintenance'];
const dispatchRoles = ['station_manager', 'deputy_manager', 'department_manager'];

const canReport = computed(() => userStore.hasRole(reportRoles));
const canDispatch = computed(() => dispatchRoles.includes(userStore.roleCode));
const canVerify = computed(() => dispatchRoles.includes(userStore.roleCode));
const canRepair = computed(() => userStore.roleCode === 'maintenance');
const canDeleteAny = computed(() => ['admin', ...dispatchRoles].includes(userStore.roleCode));

const rowKey = (row) => row.id || row._tempId;

const statusLabel = (row) => {
  const status = row?.status;
  if (status === 'repairing') {
    if (row?.verify_result === 'reject') return '退回重做';
    return getRepairPhaseLabel(row);
  }
  const labels = {
    draft_report: '草稿',
    submitted_report: '已上报',
    dispatched: '已派单',
    repairing: '维修中',
    repaired_submitted: '维修完成',
    accepted: '已验收',
    archived: '已归档'
  };
  return labels[status] || status || '-';
};

const statusTag = (row) => {
  const status = row?.status;
  if (status === 'repairing') {
    if (row?.verify_result === 'reject') return 'danger';
    const result = row?.repair_result;
    if (result === 'normal') return 'success';
    if (result === 'observe') return 'warning';
    if (result === 'unsolved') return 'danger';
    return 'primary';
  }
  const types = {
    draft_report: 'info',
    submitted_report: 'warning',
    dispatched: 'warning',
    repairing: 'primary',
    repaired_submitted: 'warning',
    accepted: 'success',
    archived: 'info'
  };
  return types[status] || 'info';
};

const formatRepairNames = (row) => {
  const primary = row?.repair_person_name || '';
  const assistant = row?.repair_assistant_name || '';
  if (primary && assistant) return `${primary}、${assistant}`;
  return primary || assistant || '-';
};

const urgencyLabel = (level) => {
  const labels = {
    low: '低',
    medium: '中',
    high: '高',
    critical: '紧急'
  };
  return labels[level] || level || '-';
};

const urgencyTag = (level) => {
  const types = {
    low: 'info',
    medium: 'warning',
    high: 'danger',
    critical: 'danger'
  };
  return types[level] || 'info';
};

const getRepairPhaseLabel = (row) => {
  const result = row?.repair_result;
  if (result === 'normal') return '正常';
  if (result === 'observe') return '需观察';
  if (result === 'unsolved') return '未解决';
  return '维修中';
};

const getFlowSteps = (row) => {
  const steps = ['上报', '派单', getRepairPhaseLabel(row)];
  if (['repaired_submitted', 'accepted', 'archived'].includes(row?.status)) {
    steps.push('验收');
  }
  return steps;
};

const getFlowActive = (row) => {
  const status = row?.status;
  if (status === 'submitted_report') return 1;
  if (status === 'dispatched') return 2;
  if (status === 'repairing') return 2;
  if (status === 'repaired_submitted') return 3;
  if (['accepted', 'archived'].includes(status)) {
    const steps = getFlowSteps(row);
    return steps.length;
  }
  return 0;
};

const isDraftRow = (row) => !row.id || row.status === 'draft_report';

const canEditReport = (row) => {
  if (!canReport.value) return false;
  if (!row.id) return true;
  return row.status === 'draft_report' && (!row.reporter_id || row.reporter_id === userStore.userId);
};

const canEditDispatch = (row) => canDispatch.value && row.status === 'submitted_report';

const canEditRepair = (row) => {
  if (!canRepair.value) return false;
  if (!['dispatched', 'repairing'].includes(row.status)) return false;
  return row.repair_person_id === userStore.userId;
};

const canEditVerify = (row) => canVerify.value && row.status === 'repaired_submitted';

const showDelete = (row) => {
  if (canDeleteAny.value) return true;
  return canReport.value && row.status === 'draft_report';
};

const deleteState = (row) => {
  if (["accepted", "archived"].includes(row.status)) {
    return { allowed: false, reason: '已验收或归档不可删除' };
  }
  if (canDeleteAny.value) {
    return { allowed: true, reason: '' };
  }
  if (!canReport.value) {
    return { allowed: false, reason: '无删除权限' };
  }
  if (row.status !== 'draft_report') {
    return { allowed: false, reason: '非草稿不可删除' };
  }
  if (row.reporter_id && row.reporter_id !== userStore.userId) {
    return { allowed: false, reason: '非本人上报不可删除' };
  }
  return { allowed: true, reason: '' };
};

const parseList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch (e) {
    return [];
  }
};

const normalizeText = (value) => {
  if (value === undefined || value === null) return '';
  return String(value).trim();
};

const normalizeNumberValue = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return null;
  return parsed;
};

const normalizeQuantityValue = (value) => {
  if (value === undefined || value === null || value === '') return 1;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed)) return 1;
  if (parsed < 1) return 1;
  return parsed;
};

const getRepairTaskPointsTotal = (row) => {
  const tasks = Array.isArray(row?.repair_tasks) ? row.repair_tasks : parseList(row?.repair_tasks);
  if (!Array.isArray(tasks) || tasks.length === 0) return null;
  return tasks.reduce((sum, task) => {
    const points = normalizeNumberValue(task?.points);
    if (points === null) return sum;
    const quantity = normalizeQuantityValue(task?.quantity);
    return sum + points * quantity;
  }, 0);
};

const formatRepairTaskPointsTotal = (row) => {
  const total = getRepairTaskPointsTotal(row);
  if (total === null) return '-';
  return total;
};

const normalizeRecord = (item) => {
  const normalized = {
    ...item,
    repair_person_name: item.repair_person_name || item.repairPerson?.real_name,
    reporter_name: item.reporter_name || item.reporter?.real_name,
    consumables_list: parseList(item.consumables_list),
    parts_list: parseList(item.parts_list),
    work_contents: parseList(item.work_contents),
    repair_tasks: parseList(item.repair_tasks)
  };
  return ensurePlanRange(normalized);
};

const getUserDisplayName = (user) => {
  if (!user) return '';
  return user.realName || user.real_name || user.username || '';
};

const ensurePlanRange = (row) => {
  if (!row) return row;
  const startDate = row.plan_repair_date || '';
  const endDate = row.plan_repair_end_date || startDate || '';
  row.plan_repair_date_range = startDate ? [startDate, endDate] : [];

  const startTime = row.plan_repair_time || '';
  const endTime = row.plan_repair_end_time || startTime || '';
  row.plan_repair_time_range = startTime ? [startTime, endTime] : [];

  return row;
};

const loadRecords = async () => {
  loading.value = true;
  try {
    const isRework = filters.value.status === 'rework';
    const statusParam = isRework ? 'repairing' : (filters.value.status || undefined);
    const res = await getRepairRecords({
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      stationId: filters.value.stationId || userStore.currentStationId,
      status: statusParam,
      equipmentName: filters.value.equipmentName || undefined,
      urgencyLevel: filters.value.urgencyLevel || undefined,
      repairPersonName: filters.value.repairPersonName || undefined
    });
    let list = (res.list || []).map(normalizeRecord);
    if (isRework) {
      list = list.filter(item => item.status === 'repairing' && item.verify_result === 'reject');
    }
    records.value = list;
    pagination.value.total = res.total || 0;
  } catch {
    // 静默处理异常
  } finally {
    loading.value = false;
  }
};

const loadRepairers = async () => {
  if (!canDispatch.value) return;
  try {
    const res = await request.get('/users', { params: { roleCode: 'maintenance', pageSize: 200 } });
    repairers.value = (res.list || []).map((user) => ({
      ...user,
      realName: user.realName || user.real_name || user.username || ''
    }));
  } catch {
    // 静默处理异常
  }
};

// 设备信息相关

const handleEquipmentCodeBlur = async (row) => {

  if (!row.equipment_code || !userStore.currentStationId) {

    return;

  }



  // 已存在设备时的查询

  if (row.equipment_name && row.equipment_code === row._lastQueriedCode) {

    return;

  }



  try {

    const res = await getEquipmentByCode({

      stationId: userStore.currentStationId,

      equipmentCode: row.equipment_code.trim()

    });



    if (res && res.equipment_code) {

      // 设备信息自动回填

      row.equipment_name = res.equipment_name;

      row.equipment_location = res.installation_location || '';

      row._lastQueriedCode = row.equipment_code;

      ElMessage.success('设备信息已更新');

    } else {

      ElMessage.warning('未找到设备 "' + row.equipment_code + '" 信息');

    }

  } catch (error) {

    // 静默处理异常

  }

};



const addRow = () => {
  const now = dayjs();
  const currentStation = stations.value.find(station => station.id === userStore.currentStationId);
  const defaultStationId = currentStation && isActiveStatus(currentStation.status)
    ? currentStation.id
    : null;
  records.value.unshift({
    _tempId: `temp-${Date.now()}`,
    status: 'draft_report',
    station_id: defaultStationId,
    equipment_code: '',
    equipment_name: '',
    equipment_location: '',
    report_date: now.format('YYYY-MM-DD'),
    report_time: now.format('HH:mm'),
    reporter_id: userStore.userId,
    reporter_name: userStore.realName,
    urgency_level: 'medium',
    fault_description: '',
    plan_repair_date: '',
    plan_repair_end_date: '',
    plan_repair_time: '',
    plan_repair_end_time: '',
    plan_repair_date_range: [],
    plan_repair_time_range: [],
    repair_person_id: null,
    repair_person_name: '',
    repair_assistant_name: '',
    dispatch_date: '',
    dispatch_time: '',
    dispatch_by_name: '',
    repair_start_date: '',
    repair_start_time: '',
    repair_end_date: '',
    repair_end_time: '',
    preliminary_judgment: '',
    repair_content: '',
    repair_tools: '',
    work_hours: 0,
    work_contents: [],
    repair_tasks: [],
    consumables_list: [],
    parts_list: [],
    repair_result: 'normal',
    observe_days: 0,
    unsolved_reason: '',
    verify_attitude: '',
    verify_quality: '',
    verify_date: '',
    verify_time: ''
  });
  openDialog(records.value[0]);
};

const onRepairerChange = (row, value) => {
  const repairer = repairers.value.find((item) => item.id === value);
  row.repair_person_name = getUserDisplayName(repairer);
};

const openDialog = async (row) => {
  if (!Array.isArray(row.consumables_list)) {
    row.consumables_list = [];
  }
  if (!Array.isArray(row.parts_list)) {
    row.parts_list = [];
  }
  if (!Array.isArray(row.work_contents)) {
    row.work_contents = [];
  }
  if (!Array.isArray(row.repair_tasks)) {
    row.repair_tasks = [];
  }
  currentRow.value = ensurePlanRange(row);

  // 如果已经选择了场站，该场站的设备列表
  if (row.station_id) {
    await loadEquipmentByStation(row.station_id);
  }

  dialogVisible.value = true;
};

const deleteRow = async (row) => {
  try {
    await ElMessageBox.confirm('确认删除该记录？删除后无法恢复', '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    });
  } catch (e) {
    return;
  }
  if (!row.id) {
    records.value = records.value.filter((item) => rowKey(item) !== rowKey(row));
    return;
  }
  try {
    await deleteRepairRecord(row.id);
    records.value = records.value.filter((item) => item.id !== row.id);
    ElMessage.success('删除成功');
  } catch {
    ElMessage.error('删除失败');
  }
};

const setSaving = (row, value) => {
  saving.value[rowKey(row)] = value;
};

const normalizeItems = (list, fields) => {
  const items = Array.isArray(list) ? list : [];
  return items
    .map((item) => {
      const next = {};
      fields.forEach((field) => {
        const value = item?.[field];
        next[field] = typeof value === 'string' ? value.trim() : value;
      });
      return next;
    })
    .filter((item) => fields.some((field) => item[field]));
};

const buildConsumables = (row) => {
  return normalizeItems(row.consumables_list, ['name', 'model', 'spec', 'quantity']);
};

const buildParts = (row) => {
  return normalizeItems(row.parts_list, ['name', 'model', 'spec', 'quantity', 'reason']);
};

const buildWorkContents = (row) => {
  const list = Array.isArray(row.work_contents) ? row.work_contents : [];
  return list
    .map(item => normalizeText(item))
    .filter(item => item.length > 0);
};

const buildRepairTasks = (row) => {
  const list = Array.isArray(row.repair_tasks) ? row.repair_tasks : [];
  return list
    .map(item => {
      const taskName = normalizeText(item?.task_name ?? item?.taskName ?? item?.job_name ?? item?.jobName);
      return ({
        task_id: item?.task_id ?? item?.job_id ?? item?.id ?? null,
        task_name: taskName,
        task_category: normalizeText(item?.task_category ?? item?.taskCategory),
        score_method: normalizeText(item?.score_method ?? item?.scoreMethod),
        points_rule: normalizeText(item?.points_rule ?? item?.pointsRule),
        points: normalizeNumberValue(item?.points),
        points_editable: Number(item?.points_editable) === 1 ? 1 : 0,
        quantity: normalizeQuantityValue(item?.quantity),
        quantity_editable: Number(item?.quantity_editable) === 1 ? 1 : 0
      });
    })
    .filter(item => item.task_id || item.task_name);
};

const addConsumable = (row) => {
  if (!Array.isArray(row.consumables_list)) {
    row.consumables_list = [];
  }
  row.consumables_list.push({ name: '', model: '', spec: '', quantity: 0 });
};

const removeConsumable = (row, index) => {
  if (!Array.isArray(row.consumables_list)) return;
  row.consumables_list.splice(index, 1);
};

const lockConsumable = async (row, index) => {
  if (!row.consumables_list?.[index]) return;
  await saveRepairRow(row);
  row.consumables_list[index]._locked = true;
};

const unlockConsumable = (row, index) => {
  if (!row.consumables_list?.[index]) return;
  row.consumables_list[index]._locked = false;
};

const addPart = (row) => {
  if (!Array.isArray(row.parts_list)) {
    row.parts_list = [];
  }
  row.parts_list.push({ name: '', model: '', spec: '', quantity: 0, reason: '' });
};

const removePart = (row, index) => {
  if (!Array.isArray(row.parts_list)) return;
  row.parts_list.splice(index, 1);
};

const lockPart = async (row, index) => {
  if (!row.parts_list?.[index]) return;
  await saveRepairRow(row);
  row.parts_list[index]._locked = true;
};

const unlockPart = (row, index) => {
  if (!row.parts_list?.[index]) return;
  row.parts_list[index]._locked = false;
};

const saveReport = async (row, submit) => {
  // 验证必填字段
  if (!row.station_id) {
    ElMessage.warning('请选择场站');
    return;
  }
  if (!row.equipment_code || !row.equipment_code.trim()) {
    ElMessage.warning('请输入设备编号');
    return;
  }
  if (!row.equipment_name || !row.equipment_name.trim()) {
    ElMessage.warning('请输入设备名称');
    return;
  }
  if (!row.equipment_location || !row.equipment_location.trim()) {
    ElMessage.warning('请输入安装地点');
    return;
  }

  setSaving(row, true);
  try {
    if (!row.id) {
      const res = await createRepairRecord({
        stationId: row.station_id,
        equipmentCode: row.equipment_code,
        equipmentName: row.equipment_name,
        equipmentLocation: row.equipment_location,
        faultDescription: row.fault_description,
        preliminaryJudgment: row.preliminary_judgment,
        reportDate: row.report_date,
        reportTime: row.report_time,
        urgencyLevel: row.urgency_level,
        isDraft: !submit
      });
      row.id = res.id;
      row.record_code = res.recordCode;
      row.status = submit ? 'submitted_report' : 'draft_report';
    } else {
      await updateRepairRecord(row.id, {
        station_id: row.station_id,
        equipment_code: row.equipment_code,
        equipment_name: row.equipment_name,
        equipment_location: row.equipment_location,
        fault_description: row.fault_description,
        preliminary_judgment: row.preliminary_judgment,
        report_date: row.report_date,
        report_time: row.report_time,
        urgency_level: row.urgency_level
      });
      if (submit && row.status === 'draft_report') {
        await submitRepairRecord(row.id);
        row.status = 'submitted_report';
      }
    }
    ElMessage.success(submit ? '提交成功' : '保存成功');
  } catch {
    ElMessage.error(submit ? '提交失败' : '保存失败');
  } finally {
    setSaving(row, false);
  }
};

const dispatchRow = async (row) => {
  if (!row.repair_person_id) {
    ElMessage.warning('请选择维修人');
    return;
  }
  setSaving(row, true);
  try {
    const now = dayjs();
    const dateRange = Array.isArray(row.plan_repair_date_range) ? row.plan_repair_date_range : [];
    const timeRange = Array.isArray(row.plan_repair_time_range) ? row.plan_repair_time_range : [];
    const planRepairDate = dateRange[0] || row.plan_repair_date || null;
    const planRepairEndDate = dateRange[1] || row.plan_repair_end_date || planRepairDate;
    const planRepairTime = timeRange[0] || row.plan_repair_time || null;
    const planRepairEndTime = timeRange[1] || row.plan_repair_end_time || planRepairTime;
    const payload = {
      repairPersonId: row.repair_person_id,
      repairPersonName: row.repair_person_name,
      repairAssistantName: row.repair_assistant_name,
      planRepairDate,
      planRepairTime,
      planRepairEndDate,
      planRepairEndTime,
      dispatchDate: row.dispatch_date || now.format('YYYY-MM-DD'),
      dispatchTime: row.dispatch_time || now.format('HH:mm'),
      dispatchRemark: row.dispatch_remark || ''
    };
    await dispatchRepairRecord(row.id, payload);
    row.status = 'dispatched';
    row.dispatch_date = payload.dispatchDate;
    row.dispatch_time = payload.dispatchTime;
    row.dispatch_by_name = userStore.realName;
    row.plan_repair_date = planRepairDate;
    row.plan_repair_time = planRepairTime;
    row.plan_repair_end_date = planRepairEndDate;
    row.plan_repair_end_time = planRepairEndTime;
    row.plan_repair_date_range = planRepairDate ? [planRepairDate, planRepairEndDate] : [];
    row.plan_repair_time_range = planRepairTime ? [planRepairTime, planRepairEndTime] : [];
    ElMessage.success('派单成功');
  } catch {
    ElMessage.error('派单失败');
  } finally {
    setSaving(row, false);
  }
};

const startRowRepair = async (row) => {
  setSaving(row, true);
  try {
    const now = dayjs();
    const repairStartDate = row.repair_start_date || now.format('YYYY-MM-DD');
    const repairStartTime = row.repair_start_time || now.format('HH:mm');
    await startRepair(row.id, { repairStartDate, repairStartTime });
    row.status = 'repairing';
    row.repair_start_date = repairStartDate;
    row.repair_start_time = repairStartTime;
    ElMessage.success('开始维修成功');
  } catch {
    ElMessage.error('开始维修失败');
  } finally {
    setSaving(row, false);
  }
};

const submitRepairRow = async (row) => {
  setSaving(row, true);
  try {
    const now = dayjs();
    if (!row.repair_start_date) row.repair_start_date = now.format('YYYY-MM-DD');
    if (!row.repair_start_time) row.repair_start_time = now.format('HH:mm');
    if (!row.repair_end_date) row.repair_end_date = now.format('YYYY-MM-DD');
    if (!row.repair_end_time) row.repair_end_time = now.format('HH:mm');

    const payload = {
      repairContent: row.repair_content,
      repairTools: row.repair_tools,
      workContents: buildWorkContents(row),
      repairTasks: buildRepairTasks(row),
      consumablesList: buildConsumables(row),
      partsList: buildParts(row),
      repairResult: row.repair_result || 'normal',
      observeDays: row.observe_days,
      unsolvedReason: row.unsolved_reason,
      workHours: row.work_hours,
      repairStartDate: row.repair_start_date,
      repairStartTime: row.repair_start_time,
      repairEndDate: row.repair_end_date,
      repairEndTime: row.repair_end_time,
      preliminaryJudgment: row.preliminary_judgment
    };
    await completeRepair(row.id, payload);
    row.status = 'repaired_submitted';
    ElMessage.success('提交维修成功');
  } catch {
    ElMessage.error('提交维修失败');
  } finally {
    setSaving(row, false);
  }
};

const saveRepairRow = async (row) => {
  setSaving(row, true);
  try {
    const payload = {
      repair_content: row.repair_content,
      repair_tools: row.repair_tools,
      work_contents: buildWorkContents(row),
      repair_tasks: buildRepairTasks(row),
      consumables_list: buildConsumables(row),
      parts_list: buildParts(row),
      repair_result: row.repair_result,
      observe_days: row.observe_days,
      unsolved_reason: row.unsolved_reason,
      work_hours: row.work_hours,
      repair_start_date: row.repair_start_date,
      repair_start_time: row.repair_start_time,
      repair_end_date: row.repair_end_date,
      repair_end_time: row.repair_end_time,
      preliminary_judgment: row.preliminary_judgment
    };
    await updateRepairRecord(row.id, payload);
    ElMessage.success('保存成功');
  } catch {
    ElMessage.error('保存失败');
  } finally {
    setSaving(row, false);
  }
};

const consumableRowClass = ({ row }) => (row?._locked ? 'row-locked' : '');
const partRowClass = ({ row }) => (row?._locked ? 'row-locked' : '');

const verifyRow = async (row, result = 'pass') => {
  setSaving(row, true);
  try {
    const payload = {
      verifyResult: result,
      verifyAttitude: row.verify_attitude,
      verifyQuality: row.verify_quality,
      verifyDate: row.verify_date || dayjs().format('YYYY-MM-DD'),
      verifyTime: row.verify_time || dayjs().format('HH:mm')
    };
    await verifyRepairRecord(row.id, payload);
    row.verify_result = result;
    row.status = result === 'pass' ? 'accepted' : 'repairing';
    row.verify_date = payload.verifyDate;
    row.verify_time = payload.verifyTime;
    ElMessage.success(result === 'pass' ? '验收完成' : '已退回重新维修');
  } catch {
    ElMessage.error('验收失败');
  } finally {
    setSaving(row, false);
  }
};

// 场站列表
const loadStations = async () => {
  try {
    const res = await getStations({ pageSize: 200 });
    stations.value = res.list || res || [];
  } catch (error) {
    
  }
};

// 设备列表ï¼基于场站ï¼
const loadEquipmentByStation = async (stationId) => {
  if (!stationId) {
    equipmentList.value = [];
    return;
  }
  try {
    const res = await getEquipment({ stationId });
    equipmentList.value = res || [];
  } catch (error) {
    
    equipmentList.value = [];
  }
};

// 场站改变时的处理
const handleStationChange = async (row) => {
  // 清空设备相关字段
  row.equipment_code = '';
  row.equipment_name = '';
  row.equipment_location = '';
  // 该场站的设备列表
  await loadEquipmentByStation(row.station_id);
};

// 设备改变时的处理
const handleEquipmentChange = (row) => {
  const equipment = equipmentList.value.find(e => e.equipment_code === row.equipment_code);
  if (equipment) {
    row.equipment_name = equipment.equipment_name;
    row.equipment_location = equipment.installation_location || '';
  }
};

onMounted(() => {
  loadRecords();
  loadRepairers();
  loadStations();
});
</script>

<style lang="scss" scoped>
.device-fault-page {
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

  .actions {
    display: flex;
    gap: 12px;
  }

  .table-wrapper {
    background: #fff;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    overflow-x: auto;
  }

  .fault-table {
    width: 100%;
    min-width: 1200px;
  }

  .filter-bar {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
  }

  .expand-form {
    overflow-x: hidden;

    .section-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px 24px;
      min-width: 0;
    }

    :deep(.el-form-item),
    :deep(.el-form-item__content) {
      min-width: 0;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .list-block {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
    }

    .table-scroll {
      width: 100%;
      max-width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .list-actions {
      display: flex;
      justify-content: flex-end;
    }

    .inner-table {
      width: 100%;
      min-width: 900px;
    }

    :deep(.el-input-number) {
      width: 120px;
    }

    :deep(.row-locked td) {
      background-color: #f5f7fa;
    }

    .plan-repair-datetime {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
      column-gap: 8px;
      width: 100%;

      .datetime-group {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }

      .range-separator {
        color: #909399;
        padding: 0 6px;
        line-height: 32px;
      }

      :deep(.el-date-editor),
      :deep(.el-time-picker) {
        width: 160px;
        max-width: 100%;
        min-width: 0;
      }
    }
  }

  .status-steps {
    margin: 4px 0 16px;
  }

  .form-actions {
    margin-top: 16px;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
    background: #fff;
    padding: 12px 16px;
    border-radius: 8px;
  }

  @media (max-width: 1024px) {
    :deep(.el-dialog) {
      width: 95% !important;
      margin: 20px auto !important;
      max-width: 95vw;
    }

    :deep(.el-dialog__body) {
      padding: 10px 15px;
      overflow-x: hidden;
      max-width: 100%;
    }

    .expand-form {
      max-width: 100%;
      overflow-x: hidden;

      .section-grid {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      :deep(.el-form-item) {
        flex-direction: column;
        align-items: stretch;
        margin-bottom: 12px;
      }

      :deep(.el-form-item__label) {
        width: 100% !important;
        text-align: left;
        padding: 0 0 6px;
        margin: 0;
      }

      :deep(.el-form-item__content) {
        width: 100%;
        margin-left: 0 !important;
        max-width: 100%;
      }

      :deep(.el-input),
      :deep(.el-select),
      :deep(.el-textarea),
      :deep(.el-date-editor),
      :deep(.el-time-picker),
      :deep(.el-input-number),
      :deep(.el-rate) {
        width: 100% !important;
        max-width: 100% !important;
      }

      .plan-repair-datetime {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
        max-width: 100%;

        .range-separator {
          display: none;
        }

        .datetime-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;

          :deep(.el-date-editor),
          :deep(.el-time-picker) {
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      }

      .list-block {
        width: 100%;
        max-width: 100%;
        overflow: hidden;
      }

      .table-scroll {
        width: 100%;
        max-width: 100%;
        overflow-x: auto !important;
        -webkit-overflow-scrolling: touch;
      }

      .inner-table {
        min-width: 700px !important;
      }
    }
  }

  :deep(.fault-dialog .el-dialog__body) {
    overflow-x: hidden;
    max-width: 100%;
  }
}
</style>





