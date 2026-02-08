<template>
  <div class="maintenance-work-panel">
    <div class="page-header">
      <h2>设备保养工作</h2>
    </div>

    <div v-if="overdueCount > 0 && !overdueNoticeClosed" class="overdue-banner">
      <el-alert
        :title="`当前有${overdueCount}条延期保养任务${overdueSummaryText ? `（${overdueSummaryText}）` : ''}`"
        type="error"
        show-icon
        closable
        @close="overdueNoticeClosed = true"
      />
    </div>

    <TableWrapper v-loading="workLoading">
      <el-table
        :data="workTableRows"
        stripe
        border
        row-key="rowKey"
        :span-method="workSpanMethod"
      >
        <el-table-column label="场站" width="110">
          <template #default="{ row }">
            <span>{{ row.task.stationName ?? '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="岗位" width="110">
          <template #default="{ row }">
            <span>{{ row.task.positionName ?? '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="设备编号" width="120">
          <template #default="{ row }">
            <span>{{ row.task.equipmentCode ?? '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="设备名称" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.task.equipmentName ?? '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="安装位置" width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.task.installLocation ?? '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="保养周期" width="100">
          <template #default="{ row }">
            {{ getCycleLabel(row.task.cycleType) }}
          </template>
        </el-table-column>
        <el-table-column label="保养标准" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.item.name ?? '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="保养规范" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.item.specification ?? '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="积分" width="90" align="center">
          <template #default="{ row }">
            <span>{{ row.item.points ?? 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="是否完成" width="140" align="center">
          <template #default="{ row }">
            <el-radio-group v-model="row.item.confirmed" size="small" :disabled="row.task.status !== 'pending'">
              <el-radio :label="true">完成</el-radio>
              <el-radio :label="false">未完成</el-radio>
            </el-radio-group>
          </template>
        </el-table-column>
        <el-table-column label="保养工具" width="160">
          <template #default="{ row }">
            <el-input
              v-model="row.task.form.maintenanceTools"
              placeholder="填写保养工具"
              size="small"
              :disabled="row.task.status !== 'pending'"
            />
          </template>
        </el-table-column>
        <el-table-column label="保养时长" width="140">
          <template #default="{ row }">
            <div class="hours-input">
              <el-input-number
                v-model="row.task.form.workHours"
                :min="0"
                :max="24"
                :step="0.5"
                size="small"
                controls-position="right"
                :disabled="row.task.status !== 'pending'"
              />
              <span class="unit">小时</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="耗材使用" width="120" align="center">
          <template #default="{ row }">
            <el-button
              size="small"
              :type="row.task.status === 'pending' ? 'primary' : 'info'"
              plain
              @click="openConsumablesDialog(row.task)"
            >
              {{ row.task.form.consumablesList.length ? `已填${row.task.form.consumablesList.length}项` : '填写' }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="配件更换" width="120" align="center">
          <template #default="{ row }">
            <el-button
              size="small"
              :type="row.task.status === 'pending' ? 'primary' : 'info'"
              plain
              @click="openPartsDialog(row.task)"
            >
              {{ row.task.form.partsList.length ? `已填${row.task.form.partsList.length}项` : '填写' }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="160">
          <template #default="{ row }">
            <el-input
              v-model="row.task.form.remark"
              placeholder="填写备注"
              size="small"
              maxlength="200"
              :disabled="row.task.status !== 'pending'"
            />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="130">
          <template #default="{ row }">
            <div class="status-tags">
              <el-tag :type="getWorkStatusTagType(row.task.status)" size="small">
                {{ getWorkStatusText(row.task.status) }}
              </el-tag>
              <el-tag v-if="row.task.isOverdue" type="danger" size="small">延期</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button
                v-if="row.task.status === 'pending'"
                type="primary"
                size="small"
                :loading="row.task.submitting"
                @click="submitWorkTask(row.task)"
              >
                提交
              </el-button>
              <el-button
                v-else-if="canManage && row.task.status === 'completed'"
                type="success"
                size="small"
                @click="openVerifyDialog(row.task)"
              >
                验收
              </el-button>
              <el-tag v-else size="small" type="info">
                {{ row.task.status === 'verified' ? '已验收' : '已提交' }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </TableWrapper>

    <el-empty v-if="!workLoading && workTableRows.length === 0" description="暂无任务" />

    <el-dialog v-model="consumablesDialogVisible" title="耗材使用" width="760px" destroy-on-close>
      <div class="material-dialog">
        <div v-if="canEditActiveTask" class="dialog-actions">
          <el-button type="primary" size="small" @click="addConsumableRow">新增</el-button>
        </div>
        <el-table :data="activeConsumables" border size="small">
          <el-table-column label="名称" min-width="140">
            <template #default="{ row }">
              <el-input v-model="row.name" placeholder="名称" size="small" :disabled="!canEditActiveTask" />
            </template>
          </el-table-column>
          <el-table-column label="型号" min-width="120">
            <template #default="{ row }">
              <el-input v-model="row.model" placeholder="型号" size="small" :disabled="!canEditActiveTask" />
            </template>
          </el-table-column>
          <el-table-column label="规格" min-width="120">
            <template #default="{ row }">
              <el-input v-model="row.spec" placeholder="规格" size="small" :disabled="!canEditActiveTask" />
            </template>
          </el-table-column>
          <el-table-column label="数量" width="120">
            <template #default="{ row }">
              <el-input-number v-model="row.quantity" :min="0" size="small" :disabled="!canEditActiveTask" />
            </template>
          </el-table-column>
          <el-table-column v-if="canEditActiveTask" label="操作" width="80" align="center">
            <template #default="{ $index }">
              <el-button link type="danger" @click="removeConsumableRow($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button type="primary" @click="saveConsumablesDialog">保存</el-button>
        <el-button @click="consumablesDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="partsDialogVisible" title="配件更换" width="820px" destroy-on-close>
      <div class="material-dialog">
        <div v-if="canEditActiveTask" class="dialog-actions">
          <el-button type="primary" size="small" @click="addPartRow">新增</el-button>
        </div>
        <el-table :data="activeParts" border size="small">
          <el-table-column label="名称" min-width="140">
            <template #default="{ row }">
              <el-input v-model="row.name" placeholder="名称" size="small" :disabled="!canEditActiveTask" />
            </template>
          </el-table-column>
          <el-table-column label="型号" min-width="120">
            <template #default="{ row }">
              <el-input v-model="row.model" placeholder="型号" size="small" :disabled="!canEditActiveTask" />
            </template>
          </el-table-column>
          <el-table-column label="规格" min-width="120">
            <template #default="{ row }">
              <el-input v-model="row.spec" placeholder="规格" size="small" :disabled="!canEditActiveTask" />
            </template>
          </el-table-column>
          <el-table-column label="数量" width="120">
            <template #default="{ row }">
              <el-input-number v-model="row.quantity" :min="0" size="small" :disabled="!canEditActiveTask" />
            </template>
          </el-table-column>
          <el-table-column label="更换原因" min-width="140">
            <template #default="{ row }">
              <el-input v-model="row.reason" placeholder="更换原因" size="small" :disabled="!canEditActiveTask" />
            </template>
          </el-table-column>
          <el-table-column v-if="canEditActiveTask" label="操作" width="80" align="center">
            <template #default="{ $index }">
              <el-button link type="danger" @click="removePartRow($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button type="primary" @click="savePartsDialog">保存</el-button>
        <el-button @click="partsDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="verifyDialogVisible" title="验收" width="520px" destroy-on-close>
      <el-form :model="verifyForm" label-width="100px">
        <el-form-item label="设备名称">
          <span>{{ verifyForm.equipmentName ?? '-' }}</span>
        </el-form-item>
        <el-form-item label="执行人">
          <span>{{ verifyForm.executorName ?? '-' }}</span>
        </el-form-item>
        <el-form-item label="验收结果">
          <el-radio-group v-model="verifyForm.result">
            <el-radio label="pass">验收通过</el-radio>
            <el-radio label="fail">验收不通过</el-radio>
          </el-radio-group>
        </el-form-item>
        <template v-if="verifyForm.result === 'fail'">
          <el-form-item label="扣分">
            <el-input-number
              v-model="verifyForm.deductionPoints"
              :min="-9999"
              :max="0"
              :step="1"
              controls-position="right"
            />
          </el-form-item>
          <el-form-item label="扣分说明">
            <el-input v-model="verifyForm.deductionRemark" type="textarea" :rows="2" placeholder="请输入扣分说明" />
          </el-form-item>
        </template>
        <el-form-item label="验收备注">
          <el-input v-model="verifyForm.remark" type="textarea" :rows="3" placeholder="请输入验收备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="verifyDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="verifySubmitting" @click="submitVerify">确认验收</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import dayjs from 'dayjs';
import request from '@/api/request';
import { useUserStore } from '@/store/modules/user';

const props = defineProps({
  canManage: { type: Boolean, default: false }
});

const userStore = useUserStore();

const workLoading = ref(false);
const workTaskList = ref([]);

const overdueNoticeClosed = ref(false);
const overdueTasks = computed(() => workTaskList.value.filter(task => task.isOverdue));
const overdueCount = computed(() => overdueTasks.value.length);
const overdueSummaryText = computed(() => {
  const summary = { daily: 0, weekly: 0, monthly: 0, yearly: 0 };
  overdueTasks.value.forEach((task) => {
    if (summary[task.cycleType] !== undefined) summary[task.cycleType] += 1;
  });
  const parts = [];
  if (summary.daily) parts.push(`日保养${summary.daily}项`);
  if (summary.weekly) parts.push(`周保养${summary.weekly}项`);
  if (summary.monthly) parts.push(`月保养${summary.monthly}项`);
  if (summary.yearly) parts.push(`年保养${summary.yearly}项`);
  return parts.join('，');
});

watch(overdueCount, (value, prev) => {
  if (value > 0 && prev === 0) {
    overdueNoticeClosed.value = false;
  }
});

const verifyDialogVisible = ref(false);
const verifySubmitting = ref(false);
const verifyForm = ref({
  id: null,
  equipmentName: '',
  executorName: '',
  result: 'pass',
  remark: '',
  deductionPoints: 0,
  deductionRemark: ''
});

const consumablesDialogVisible = ref(false);
const partsDialogVisible = ref(false);
const activeTask = ref(null);

const canEditActiveTask = computed(() => activeTask.value?.status === 'pending');
const activeConsumables = computed(() => activeTask.value?.form?.consumablesList ?? []);
const activeParts = computed(() => activeTask.value?.form?.partsList ?? []);

const getCycleLabel = (cycle) => {
  const labels = { daily: '日保养', weekly: '周保养', monthly: '月保养', yearly: '年保养' };
  return labels[cycle] ?? cycle ?? '-';
};

const getWorkStatusText = (status) => {
  const texts = { pending: '待完成', completed: '已完成', verified: '已验收' };
  return texts[status] ?? status ?? '-';
};

const getWorkStatusTagType = (status) => {
  const types = { pending: 'info', completed: 'warning', verified: 'success' };
  return types[status] ?? 'info';
};

const normalizePointsValue = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const resolveItemName = (item) => {
  if (typeof item === 'string') return item;
  return item?.name ?? item?.item_name ?? '';
};

const resolveConfirmedValue = (value) => value === true || value === 1 || value === 'yes' || value === 'true';

const resolveConfirmed = (item) => {
  if (!item || typeof item !== 'object') return null;
  const value = item.confirmed ?? item.qualified ?? item.checked;
  if (value === undefined || value === null) return null;
  return resolveConfirmedValue(value);
};

const normalizeStandards = (standards) => {
  if (!standards) return [];
  let normalized = standards;
  if (typeof normalized === 'string') {
    try {
      normalized = JSON.parse(normalized);
    } catch {
      return [{ name: normalized, specification: '', points: 0 }];
    }
  }
  if (!Array.isArray(normalized)) return [];
  return normalized
    .map((item) => {
      if (typeof item === 'string') {
        return { name: item, specification: '', points: 0 };
      }
      return {
        name: item?.name ?? '',
        specification: item?.specification ?? '',
        points: normalizePointsValue(item?.points)
      };
    })
    .filter((item) => (item.name ?? '') !== '' || (item.specification ?? '') !== '');
};

const buildMaintenanceItems = (standards, existingItems) => {
  const normalizedStandards = Array.isArray(standards) ? standards : [];
  const existingList = Array.isArray(existingItems) ? existingItems : [];
  if (normalizedStandards.length === 0 && existingList.length > 0) {
    return existingList.map(item => ({
      name: resolveItemName(item),
      specification: item?.specification ?? '',
      points: normalizePointsValue(item?.points),
      confirmed: resolveConfirmed(item)
    }));
  }

  const existingMap = new Map();
  existingList.forEach((item) => {
    const name = resolveItemName(item);
    if (name) existingMap.set(name, item);
  });

  return normalizedStandards.map((std) => {
    const match = existingMap.get(std.name);
    return {
      name: std.name ?? '',
      specification: std.specification ?? '',
      points: normalizePointsValue(std.points),
      confirmed: match ? resolveConfirmed(match) : null
    };
  });
};

const normalizeConsumables = (items) => {
  if (!Array.isArray(items)) return [];
  return items.map(item => ({
    name: item?.name ?? '',
    model: item?.model ?? '',
    spec: item?.spec ?? '',
    quantity: item?.quantity ?? 0
  }));
};

const normalizeParts = (items) => {
  if (!Array.isArray(items)) return [];
  return items.map(item => ({
    name: item?.name ?? '',
    model: item?.model ?? '',
    spec: item?.spec ?? '',
    quantity: item?.quantity ?? 0,
    reason: item?.reason ?? ''
  }));
};

const loadTodayTasks = async () => {
  workLoading.value = true;
  try {
    const res = await request.get('/maintenance-work-records/today-tasks');
    const data = res?.data ?? res?.tasks ?? res?.list ?? res ?? [];
    const list = Array.isArray(data) ? data : [];
    workTaskList.value = list.map((item) => {
      const existingRecord = item.existingRecord ?? null;
      const standards = normalizeStandards(item.maintenance_standards ?? item.maintenanceStandards ?? []);
      const maintenanceItems = buildMaintenanceItems(standards, existingRecord?.maintenanceItems ?? existingRecord?.maintenance_items);
      return {
        planId: item.plan_id ?? item.planId,
        stationId: item.station_id ?? item.stationId,
        stationName: item.stationName ?? item.station?.station_name ?? item.station?.stationName ?? '',
        positionName: item.position_name ?? item.positionName,
        equipmentCode: item.equipment_code ?? item.equipmentCode,
        equipmentName: item.equipment_name ?? item.equipmentName,
        installLocation: item.install_location ?? item.installLocation,
        cycleType: item.cycle_type ?? item.cycleType,
        dueDate: item.due_date ?? item.dueDate ?? '',
        isOverdue: item.is_overdue ?? item.isOverdue ?? false,
        status: existingRecord?.status ?? 'pending',
        recordId: existingRecord?.id ?? null,
        executorName: existingRecord?.executorName ?? existingRecord?.executor_name ?? item.executor_name ?? '',
        form: {
          maintenanceItems,
          maintenanceTools: existingRecord?.maintenanceTools ?? existingRecord?.maintenance_tools ?? '',
          workHours: existingRecord?.workHours ?? existingRecord?.work_hours ?? 0,
          consumablesList: normalizeConsumables(existingRecord?.consumablesList ?? existingRecord?.consumables_list),
          partsList: normalizeParts(existingRecord?.partsList ?? existingRecord?.parts_list),
          remark: existingRecord?.remark ?? ''
        },
        submitting: false
      };
    });
  } catch (error) {
    ElMessage.error('加载任务失败');
  } finally {
    workLoading.value = false;
  }
};

const workTableRows = computed(() => {
  const rows = [];
  workTaskList.value.forEach((task, taskIndex) => {
    const items = Array.isArray(task.form?.maintenanceItems) ? task.form.maintenanceItems : [];
    const rowCount = Math.max(items.length, 1);
    for (let i = 0; i < rowCount; i += 1) {
      rows.push({
        rowKey: `${task.planId ?? 'plan'}-${task.cycleType ?? 'cycle'}-${taskIndex}-${i}`,
        task,
        item: items[i] ?? { name: '', specification: '', points: 0, confirmed: null },
        rowspan: i === 0 ? rowCount : 0
      });
    }
  });
  return rows;
});

const workSpanMethod = ({ row, columnIndex }) => {
  const mergeColumns = [0, 1, 2, 3, 4, 5, 10, 11, 12, 13, 14, 15, 16];
  if (!mergeColumns.includes(columnIndex)) return;
  if (row.rowspan > 0) {
    return { rowspan: row.rowspan, colspan: 1 };
  }
  return { rowspan: 0, colspan: 0 };
};

const openConsumablesDialog = (task) => {
  activeTask.value = task;
  consumablesDialogVisible.value = true;
};

const openPartsDialog = (task) => {
  activeTask.value = task;
  partsDialogVisible.value = true;
};

const addConsumableRow = () => {
  if (!activeTask.value) return;
  activeTask.value.form.consumablesList.push({ name: '', model: '', spec: '', quantity: 0 });
};

const saveConsumablesDialog = () => {
  consumablesDialogVisible.value = false;
};

const removeConsumableRow = (index) => {
  if (!activeTask.value) return;
  activeTask.value.form.consumablesList.splice(index, 1);
};

const addPartRow = () => {
  if (!activeTask.value) return;
  activeTask.value.form.partsList.push({ name: '', model: '', spec: '', quantity: 0, reason: '' });
};

const savePartsDialog = () => {
  partsDialogVisible.value = false;
};

const removePartRow = (index) => {
  if (!activeTask.value) return;
  activeTask.value.form.partsList.splice(index, 1);
};

const submitWorkTask = async (task) => {
  if (!task || task.submitting) return;
  const items = Array.isArray(task.form?.maintenanceItems) ? task.form.maintenanceItems : [];
  const unchecked = items.filter(item => item.confirmed === null || item.confirmed === undefined);
  if (unchecked.length > 0) {
    ElMessage.warning(`还有${unchecked.length}项未选择完成情况`);
    return;
  }
  task.submitting = true;
  try {
    const payloadItems = items.map(item => ({
      name: item?.name ?? '',
      specification: item?.specification ?? '',
      points: normalizePointsValue(item?.points),
      confirmed: item?.confirmed === true
    }));
    await request.post('/maintenance-work-records', {
      planId: task.planId,
      stationId: task.stationId,
      positionName: task.positionName,
      equipmentCode: task.equipmentCode,
      equipmentName: task.equipmentName,
      installLocation: task.installLocation,
      cycleType: task.cycleType,
      workDate: dayjs().format('YYYY-MM-DD'),
      maintenanceItems: payloadItems,
      maintenanceTools: task.form.maintenanceTools,
      workHours: task.form.workHours,
      consumablesList: task.form.consumablesList.filter(item => (item?.name ?? '') !== ''),
      partsList: task.form.partsList.filter(item => (item?.name ?? '') !== ''),
      remark: task.form.remark
    });
    ElMessage.success('提交成功');
    loadTodayTasks();
  } catch (error) {
    ElMessage.error(error?.message ?? '提交失败');
  } finally {
    task.submitting = false;
  }
};

const openVerifyDialog = (task) => {
  if (!task?.recordId) {
    ElMessage.warning('未找到可验收的记录');
    return;
  }
  verifyForm.value = {
    id: task.recordId,
    equipmentName: task.equipmentName ?? '',
    executorName: task.executorName ?? '',
    result: 'pass',
    remark: '',
    deductionPoints: 0,
    deductionRemark: ''
  };
  verifyDialogVisible.value = true;
};

const submitVerify = async () => {
  if (!verifyForm.value.result) {
    ElMessage.warning('请选择验收结果');
    return;
  }
  verifySubmitting.value = true;
  try {
    const payload = {
      verifyResult: verifyForm.value.result,
      verifyRemark: verifyForm.value.remark
    };
    if (verifyForm.value.result === 'fail') {
      payload.deductionPoints = verifyForm.value.deductionPoints;
      payload.deductionRemark = verifyForm.value.deductionRemark;
    }
    await request.put(`/maintenance-work-records/${verifyForm.value.id}/verify`, payload);
    ElMessage.success('验收成功');
    verifyDialogVisible.value = false;
    loadTodayTasks();
  } catch (error) {
    ElMessage.error(error?.message ?? '验收失败');
  } finally {
    verifySubmitting.value = false;
  }
};

onMounted(() => {
  loadTodayTasks();
});
</script>

<style lang="scss" scoped>
.maintenance-work-panel {
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

  .overdue-banner {
    margin-bottom: 16px;
  }

  .hours-input {
    display: flex;
    align-items: center;
    gap: 6px;

    .unit {
      color: #909399;
      font-size: 12px;
    }
  }

  .status-tags {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
  }

  .action-buttons {
    display: flex;
    justify-content: center;
  }

  .material-dialog {
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 8px;
    }
  }
}

@media screen and (max-width: 768px) {
  .maintenance-work-panel {
    .page-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;

      h2 {
        font-size: 18px;
      }
    }
  }
}
</style>
