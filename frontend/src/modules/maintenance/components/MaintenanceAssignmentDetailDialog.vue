<template>
  <el-dialog v-model="dialogVisible" title="设备保养任务详情" width="820px" destroy-on-close>
    <div v-if="assignment" class="status-steps">
      <el-steps :active="getMaintainFlowActive(assignment)" finish-status="success" align-center>
        <el-step v-for="step in flowSteps" :key="step" :title="step" />
      </el-steps>
    </div>
    <el-form v-if="assignment" :model="assignment" label-width="120px">
      <el-divider content-position="left">任务信息</el-divider>
      <div class="section-grid">
        <el-form-item label="场站">
          <el-input v-model="assignment.stationName" disabled />
        </el-form-item>
        <el-form-item label="设备编号">
          <el-input v-model="assignment.equipmentCode" disabled />
        </el-form-item>
        <el-form-item label="设备名称">
          <el-input v-model="assignment.equipmentName" disabled />
        </el-form-item>
        <el-form-item label="安装位置">
          <el-input v-model="assignment.installLocation" disabled />
        </el-form-item>
        <el-form-item label="保养周期">
          <el-input :model-value="cycleLabelText" disabled />
        </el-form-item>
        <el-form-item label="执行人">
          <el-input v-model="assignment.executorName" disabled />
        </el-form-item>
        <el-form-item label="计划日期">
          <el-input :model-value="planRangeText" disabled />
        </el-form-item>
        <el-form-item label="状态">
          <el-tag :type="getAssignStatusType(assignment.status)">
            {{ getAssignStatusLabel(assignment.status) }}
          </el-tag>
        </el-form-item>
      </div>

      <el-divider content-position="left">保养标准确认</el-divider>
      <el-table :data="maintenanceItems" border size="small">
        <el-table-column prop="name" label="项目" min-width="180" />
        <el-table-column prop="specification" label="标准" min-width="220" />
        <el-table-column label="确认" width="140" align="center">
          <template #default="{ row: item }">
            <el-radio-group v-model="item.result" :disabled="!canEdit">
              <el-radio label="yes">是</el-radio>
              <el-radio label="no">否</el-radio>
            </el-radio-group>
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="180">
          <template #default="{ row: item }">
            <el-input v-model="item.remark" :disabled="!canEdit" />
          </template>
        </el-table-column>
      </el-table>

      <el-divider content-position="left">设备保养信息</el-divider>
      <div class="section-grid">
        <el-form-item label="开始日期">
          <el-date-picker
            v-model="assignment.actualStartDate"
            type="date"
            value-format="YYYY-MM-DD"
            :disabled="!canEdit"
          />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-time-picker
            v-model="assignment.actualStartTime"
            value-format="HH:mm"
            format="HH:mm"
            :disabled="!canEdit"
          />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker
            v-model="assignment.actualEndDate"
            type="date"
            value-format="YYYY-MM-DD"
            :disabled="!canEdit"
          />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-time-picker
            v-model="assignment.actualEndTime"
            value-format="HH:mm"
            format="HH:mm"
            :disabled="!canEdit"
          />
        </el-form-item>
        <el-form-item label="保养工具">
          <el-input v-model="assignment.maintenanceTools" :disabled="!canEdit" />
        </el-form-item>
        <el-form-item label="保养时长">
          <el-input-number v-model="assignment.workHours" :min="0" :disabled="!canEdit" />
        </el-form-item>
        <el-form-item label="耗材" class="full-row">
          <MaintenanceItemTable
            :items="consumables"
            :editable="canEdit"
            :row-class-name="consumableRowClass"
            @add="handleAddConsumable"
            @remove="handleRemoveConsumable"
            @lock="handleLockConsumable"
            @unlock="handleUnlockConsumable"
          />
        </el-form-item>

        <el-form-item label="配件" class="full-row">
          <MaintenanceItemTable
            :items="parts"
            :editable="canEdit"
            :row-class-name="partRowClass"
            :show-reason="true"
            @add="handleAddPart"
            @remove="handleRemovePart"
            @lock="handleLockPart"
            @unlock="handleUnlockPart"
          />
        </el-form-item>
        <el-form-item label="保养备注">
          <el-input v-model="assignment.completionNote" :disabled="!canEdit" />
        </el-form-item>
      </div>

      <el-divider content-position="left">验收信息</el-divider>
      <div class="section-grid">
        <el-form-item label="验收人">
          <el-input v-model="assignment.verifyByName" disabled />
        </el-form-item>
        <el-form-item label="验收时间">
          <el-input :model-value="verifyTimeText" disabled />
        </el-form-item>
        <el-form-item label="安全评分">
          <el-rate v-model="assignment.verifySafety" :disabled="!canVerify" />
        </el-form-item>
        <el-form-item label="质量评分">
          <el-rate v-model="assignment.verifyQuality" :disabled="!canVerify" />
        </el-form-item>
        <el-form-item label="进度评分">
          <el-rate v-model="assignment.verifyProgress" :disabled="!canVerify" />
        </el-form-item>
        <el-form-item label="卫生评分">
          <el-rate v-model="assignment.verifyHygiene" :disabled="!canVerify" />
        </el-form-item>
        <el-form-item label="验收意见" class="full-row">
          <el-input
            v-model="assignment.verifyComment"
            type="textarea"
            :rows="2"
            :disabled="!canVerify"
          />
        </el-form-item>
      </div>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
      <el-button
        v-if="assignment && assignmentStatus === 'pending' && canStart"
        type="primary"
        @click="handleStart"
        :loading="assignmentSaving"
      >
        开始保养
      </el-button>
      <el-button
        v-if="assignment && canSave"
        @click="handleSave"
        :loading="assignmentSaving"
      >
        保存
      </el-button>
      <el-button
        v-if="assignment && canComplete"
        type="success"
        @click="handleComplete"
        :loading="assignmentSaving"
      >
        提交保养
      </el-button>
      <el-button
        v-if="assignment && canVerify"
        type="warning"
        @click="handleVerify('reject')"
        :loading="assignmentSaving"
      >
        退回重做
      </el-button>
      <el-button
        v-if="assignment && canVerify"
        type="success"
        @click="handleVerify('pass')"
        :loading="assignmentSaving"
      >
        验收通过
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue';
import MaintenanceItemTable from '@/components/maintenance/MaintenanceItemTable.vue';

const props = defineProps({
  visible: { type: Boolean, default: false },
  assignment: { type: Object, default: null },
  assignmentSaving: { type: Boolean, default: false },
  getMaintainFlowActive: { type: Function, required: true },
  getMaintainFlowSteps: { type: Function, required: true },
  getCycleLabel: { type: Function, required: true },
  getAssignStatusType: { type: Function, required: true },
  getAssignStatusLabel: { type: Function, required: true },
  canEditAssignment: { type: Function, required: true },
  canVerifyAssignment: { type: Function, required: true },
  canStartAssignment: { type: Function, required: true },
  consumableRowClass: { type: Function, default: null },
  partRowClass: { type: Function, default: null },
  addConsumable: { type: Function, required: true },
  removeConsumable: { type: Function, required: true },
  lockConsumable: { type: Function, required: true },
  unlockConsumable: { type: Function, required: true },
  addPart: { type: Function, required: true },
  removePart: { type: Function, required: true },
  lockPart: { type: Function, required: true },
  unlockPart: { type: Function, required: true },
  startAssignment: { type: Function, required: true },
  saveAssignment: { type: Function, required: true },
  completeAssignment: { type: Function, required: true },
  verifyAssignment: { type: Function, required: true }
});

const emit = defineEmits(['update:visible']);

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
});

const resolveText = (value, fallback) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  return value;
};

const flowSteps = computed(() => {
  if (!props.assignment) return [];
  const steps = props.getMaintainFlowSteps(props.assignment);
  return Array.isArray(steps) ? steps : [];
});

const assignmentStatus = computed(() => {
  if (!props.assignment) return '';
  const status = props.assignment.status;
  if (status === undefined || status === null) return '';
  return status;
});

const cycleLabelText = computed(() => {
  if (!props.assignment) return '';
  const cycleType = props.assignment.cycleType;
  const normalized = cycleType === undefined || cycleType === null ? '' : cycleType;
  return props.getCycleLabel(normalized);
});

const planRangeText = computed(() => {
  if (!props.assignment) return '';
  const startDate = resolveText(props.assignment.planStartDate, '-');
  const startTime = resolveText(props.assignment.planStartTime, '');
  const endDate = resolveText(props.assignment.planEndDate, '-');
  const endTime = resolveText(props.assignment.planEndTime, '');
  return `${startDate} ${startTime} ~ ${endDate} ${endTime}`.trim();
});

const verifyTimeText = computed(() => {
  if (!props.assignment) return '';
  const verifyDate = resolveText(props.assignment.verifyDate, '-');
  const verifyTime = resolveText(props.assignment.verifyTime, '');
  return `${verifyDate} ${verifyTime}`.trim();
});

const maintenanceItems = computed(() => {
  if (!props.assignment) return [];
  const items = props.assignment.maintenanceItems;
  if (Array.isArray(items)) return items;
  return [];
});

const consumables = computed(() => {
  if (!props.assignment) return [];
  const items = props.assignment.consumablesList;
  if (Array.isArray(items)) return items;
  return [];
});

const parts = computed(() => {
  if (!props.assignment) return [];
  const items = props.assignment.partsList;
  if (Array.isArray(items)) return items;
  return [];
});

const canEdit = computed(() => {
  if (!props.assignment) return false;
  return props.canEditAssignment(props.assignment);
});

const canVerify = computed(() => {
  if (!props.assignment) return false;
  return props.canVerifyAssignment(props.assignment);
});

const canStart = computed(() => {
  if (!props.assignment) return false;
  return props.canStartAssignment(props.assignment);
});

const canSave = computed(() => {
  const status = assignmentStatus.value;
  if (!status) return false;
  if (status !== 'pending' && status !== 'in_progress') return false;
  return canEdit.value;
});

const canComplete = computed(() => {
  if (assignmentStatus.value !== 'in_progress') return false;
  return canEdit.value;
});

const handleClose = () => {
  dialogVisible.value = false;
};

const handleStart = () => {
  if (!props.assignment) return;
  props.startAssignment(props.assignment);
};

const handleSave = () => {
  if (!props.assignment) return;
  props.saveAssignment(props.assignment);
};

const handleComplete = () => {
  if (!props.assignment) return;
  props.completeAssignment(props.assignment);
};

const handleVerify = (result) => {
  if (!props.assignment) return;
  props.verifyAssignment(props.assignment, result);
};

const handleAddConsumable = () => {
  if (!props.assignment) return;
  props.addConsumable(props.assignment);
};

const handleRemoveConsumable = (index) => {
  if (!props.assignment) return;
  props.removeConsumable(props.assignment, index);
};

const handleLockConsumable = (index) => {
  if (!props.assignment) return;
  props.lockConsumable(props.assignment, index);
};

const handleUnlockConsumable = (index) => {
  if (!props.assignment) return;
  props.unlockConsumable(props.assignment, index);
};

const handleAddPart = () => {
  if (!props.assignment) return;
  props.addPart(props.assignment);
};

const handleRemovePart = (index) => {
  if (!props.assignment) return;
  props.removePart(props.assignment, index);
};

const handleLockPart = (index) => {
  if (!props.assignment) return;
  props.lockPart(props.assignment, index);
};

const handleUnlockPart = (index) => {
  if (!props.assignment) return;
  props.unlockPart(props.assignment, index);
};
</script>
