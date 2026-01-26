<template>
  <el-dialog v-model="dialogVisible" width="920px" title="故障详情" destroy-on-close class="fault-dialog">
    <div v-if="currentRow" class="status-steps">
      <el-steps :active="getFlowActive(currentRow)" finish-status="success" align-center>
        <el-step v-for="step in flowSteps" :key="step" :title="step" />
      </el-steps>
    </div>
    <el-form
      v-if="currentRow"
      ref="formRef"
      :model="currentRow"
      :rules="formRules"
      label-width="120px"
      class="expand-form"
    >
      <el-divider content-position="left">上报信息</el-divider>
      <div class="section-grid">
        <el-form-item label="场站" prop="station_id" required>
          <el-select
            v-if="canEditReport(currentRow)"
            v-model="currentRow.station_id"
            placeholder="请选择场站"
            style="width: 100%;"
            @change="handleStationChange(currentRow)"
          >
            <el-option
              v-for="station in formStationOptions"
              :key="station.id"
              :label="station.station_name"
              :value="station.id"
            />
          </el-select>
          <el-input
            v-else
            :model-value="stationNameText"
            disabled
          />
        </el-form-item>
        <el-form-item label="设备编号" prop="equipment_code" required>
          <el-select
            v-model="currentRow.equipment_code"
            :disabled="!canEditReport(currentRow)"
            placeholder="选择设备"
            filterable
            clearable
            style="width: 100%;"
            @change="handleEquipmentChange(currentRow)"
          >
            <el-option
              v-for="equipment in equipmentList"
              :key="equipment.equipment_code"
              :label="equipment.equipment_code"
              :value="equipment.equipment_code"
            >
              <span>{{ equipment.equipment_code }}</span>
              <span style="color: #8492a6; font-size: 12px; margin-left: 10px;">{{ equipment.equipment_name }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="设备名称">
          <el-input v-model="currentRow.equipment_name" :disabled="!canEditReport(currentRow)" />
        </el-form-item>
        <el-form-item label="安装地点">
          <el-input v-model="currentRow.equipment_location" :disabled="!canEditReport(currentRow)" />
        </el-form-item>
        <el-form-item label="上报日期">
          <el-date-picker
            v-model="currentRow.report_date"
            type="date"
            value-format="YYYY-MM-DD"
            :disabled="!canEditReport(currentRow)"
          />
        </el-form-item>
        <el-form-item label="上报时间">
          <el-time-picker
            v-model="currentRow.report_time"
            value-format="HH:mm"
            format="HH:mm"
            :disabled="!canEditReport(currentRow)"
          />
        </el-form-item>
        <el-form-item label="上报人">
          <el-input v-model="currentRow.reporter_name" disabled />
        </el-form-item>
        <el-form-item label="紧急程度">
          <el-select v-model="currentRow.urgency_level" :disabled="!canEditReport(currentRow)">
            <el-option
              v-for="option in urgencyOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="故障现象描述">
          <el-input v-model="currentRow.fault_description" :disabled="!canEditReport(currentRow)" />
        </el-form-item>
      </div>

      <el-divider content-position="left">派单人信息</el-divider>
      <div class="section-grid">
        <el-form-item label="计划维修时间" class="full-width">
          <div class="plan-repair-datetime">
            <div class="datetime-group">
              <el-date-picker
                v-model="currentRow.plan_repair_date"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="开始日期"
                :disabled="!canEditDispatch(currentRow)"
              />
              <el-time-picker
                v-model="currentRow.plan_repair_time"
                value-format="HH:mm"
                format="HH:mm"
                placeholder="开始时间"
                :disabled="!canEditDispatch(currentRow)"
              />
            </div>
            <span class="range-separator">~</span>
            <div class="datetime-group">
              <el-date-picker
                v-model="currentRow.plan_repair_end_date"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="结束日期"
                :disabled="!canEditDispatch(currentRow)"
              />
              <el-time-picker
                v-model="currentRow.plan_repair_end_time"
                value-format="HH:mm"
                format="HH:mm"
                placeholder="结束时间"
                :disabled="!canEditDispatch(currentRow)"
              />
            </div>
          </div>
        </el-form-item>
        <el-form-item label="维修负责人" prop="repair_person_id" required>
          <el-select
            v-if="canEditDispatch(currentRow)"
            v-model="currentRow.repair_person_id"
            @change="value => onRepairerChange(currentRow, value)"
          >
            <el-option
              v-for="user in repairers"
              :key="user.id"
              :label="getUserDisplayName(user)"
              :value="user.id"
            />
          </el-select>
          <el-input
            v-else
            :model-value="resolveText(currentRow.repair_person_name, '-')"
            disabled
          />
        </el-form-item>
        <el-form-item label="维修配合人">
          <el-select
            v-if="canEditDispatch(currentRow)"
            v-model="currentRow.repair_assistant_name"
            clearable
            filterable
            placeholder="可选"
          >
            <el-option
              v-for="user in repairers"
              :key="user.id"
              :label="getUserDisplayName(user)"
              :value="getUserDisplayName(user)"
            />
          </el-select>
          <el-input
            v-else
            :model-value="resolveText(currentRow.repair_assistant_name, '-')"
            disabled
          />
        </el-form-item>
        <el-form-item label="派单人日期">
          <el-date-picker
            v-model="currentRow.dispatch_date"
            type="date"
            value-format="YYYY-MM-DD"
            :disabled="!canEditDispatch(currentRow)"
          />
        </el-form-item>
        <el-form-item label="派单人时间">
          <el-time-picker
            v-model="currentRow.dispatch_time"
            value-format="HH:mm"
            format="HH:mm"
            :disabled="!canEditDispatch(currentRow)"
          />
        </el-form-item>
        <el-form-item label="派单人">
          <el-input v-model="currentRow.dispatch_by_name" disabled />
        </el-form-item>
      </div>

      <el-divider content-position="left">维修信息</el-divider>
      <div class="section-grid">
        <el-form-item label="开始日期">
          <el-date-picker
            v-model="currentRow.repair_start_date"
            type="date"
            value-format="YYYY-MM-DD"
            :disabled="!canEditRepair(currentRow)"
          />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-time-picker
            v-model="currentRow.repair_start_time"
            value-format="HH:mm"
            format="HH:mm"
            :disabled="!canEditRepair(currentRow)"
          />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker
            v-model="currentRow.repair_end_date"
            type="date"
            value-format="YYYY-MM-DD"
            :disabled="!canEditRepair(currentRow)"
          />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-time-picker
            v-model="currentRow.repair_end_time"
            value-format="HH:mm"
            format="HH:mm"
            :disabled="!canEditRepair(currentRow)"
          />
        </el-form-item>
        <el-form-item label="故障初步判断">
          <el-input v-model="currentRow.preliminary_judgment" :disabled="!canEditRepair(currentRow)" />
        </el-form-item>
        <el-form-item label="维修方法">
          <el-input v-model="currentRow.repair_content" :disabled="!canEditRepair(currentRow)" />
        </el-form-item>
        <el-form-item label="维修工具">
          <el-input v-model="currentRow.repair_tools" :disabled="!canEditRepair(currentRow)" />
        </el-form-item>
        <el-form-item label="维修时长">
          <el-input-number v-model="currentRow.work_hours" :disabled="!canEditRepair(currentRow)" :min="0" />
        </el-form-item>

        <el-form-item label="耗材" class="full-width">
          <MaintenanceItemTable
            :items="currentRow.consumables_list || []"
            :editable="canEditRepair(currentRow)"
            :row-class-name="consumableRowClass"
            @add="addConsumable(currentRow)"
            @remove="(index) => removeConsumable(currentRow, index)"
            @lock="(index) => lockConsumable(currentRow, index)"
            @unlock="(index) => unlockConsumable(currentRow, index)"
          />
        </el-form-item>

        <el-form-item label="配件" class="full-width">
          <MaintenanceItemTable
            :items="currentRow.parts_list || []"
            :editable="canEditRepair(currentRow)"
            :row-class-name="partRowClass"
            @add="addPart(currentRow)"
            @remove="(index) => removePart(currentRow, index)"
            @lock="(index) => lockPart(currentRow, index)"
            @unlock="(index) => unlockPart(currentRow, index)"
          />
        </el-form-item>

        <el-form-item label="维修结果">
          <el-select v-model="currentRow.repair_result" :disabled="!canEditRepair(currentRow)">
            <el-option label="正常运行" value="normal" />
            <el-option label="待观察" value="observe" />
            <el-option label="未完成" value="unsolved" />
          </el-select>
        </el-form-item>
        <el-form-item label="跟踪天数">
          <el-input-number
            v-model="currentRow.observe_days"
            :disabled="!canEditRepair(currentRow) || currentRow.repair_result !== 'observe'"
            :min="0"
          />
        </el-form-item>
        <el-form-item label="未解决原因">
          <el-input
            v-model="currentRow.unsolved_reason"
            :disabled="!canEditRepair(currentRow) || currentRow.repair_result !== 'unsolved'"
          />
        </el-form-item>
      </div>

      <el-divider content-position="left">验收人信息</el-divider>
      <div class="section-grid">
        <el-form-item label="维修态度">
          <el-rate
            v-model="currentRow.verify_attitude"
            :max="5"
            :disabled="!canEditVerify(currentRow)"
            :allow-half="false"
            :show-text="true"
            :texts="['很差', '较差', '一般', '较好', '很好']"
          />
        </el-form-item>
        <el-form-item label="维修质量">
          <el-rate
            v-model="currentRow.verify_quality"
            :max="5"
            :disabled="!canEditVerify(currentRow)"
            :allow-half="false"
            :show-text="true"
            :texts="['很差', '较差', '一般', '较好', '很好']"
          />
        </el-form-item>
        <el-form-item label="验收人日期">
          <el-date-picker
            v-model="currentRow.verify_date"
            type="date"
            value-format="YYYY-MM-DD"
            :disabled="!canEditVerify(currentRow)"
          />
        </el-form-item>
        <el-form-item label="验收人时间">
          <el-time-picker
            v-model="currentRow.verify_time"
            value-format="HH:mm"
            format="HH:mm"
            :disabled="!canEditVerify(currentRow)"
          />
        </el-form-item>
      </div>

      <div class="form-actions">
        <el-button
          v-if="canReport && isDraftRow(currentRow)"
          type="primary"
          :loading="saving[rowKey(currentRow)]"
          @click="saveReport(currentRow, false)"
        >
          保存草稿
        </el-button>
        <el-button
          v-if="canReport && isDraftRow(currentRow)"
          type="success"
          :loading="saving[rowKey(currentRow)]"
          @click="saveReport(currentRow, true)"
        >
          提交上报
        </el-button>
        <el-button
          v-if="canDispatch && currentRow.status === 'submitted_report'"
          type="primary"
          :loading="saving[rowKey(currentRow)]"
          @click="dispatchRow(currentRow)"
        >
          提交派单
        </el-button>
        <el-button
          v-if="canRepair && currentRow.status === 'dispatched'"
          type="warning"
          :loading="saving[rowKey(currentRow)]"
          @click="startRowRepair(currentRow)"
        >
          开始维修
        </el-button>
        <el-button
          v-if="canRepair && ['dispatched', 'repairing'].includes(currentRow.status)"
          :loading="saving[rowKey(currentRow)]"
          @click="saveRepairRow(currentRow)"
        >
          保存
        </el-button>
        <el-button
          v-if="canRepair && ['dispatched', 'repairing'].includes(currentRow.status)"
          type="success"
          :loading="saving[rowKey(currentRow)]"
          @click="submitRepairRow(currentRow)"
        >
          提交维修
        </el-button>
        <el-button
          v-if="canVerify && currentRow.status === 'repaired_submitted'"
          type="warning"
          :loading="saving[rowKey(currentRow)]"
          @click="verifyRow(currentRow, 'reject')"
        >
          退回重做
        </el-button>
        <el-button
          v-if="canVerify && currentRow.status === 'repaired_submitted'"
          type="primary"
          :loading="saving[rowKey(currentRow)]"
          @click="verifyRow(currentRow, 'pass')"
        >
          验收完成
        </el-button>
      </div>
    </el-form>
  </el-dialog>
</template>

<script setup>
import { computed, ref, toRef } from 'vue';
import MaintenanceItemTable from '@/components/maintenance/MaintenanceItemTable.vue';

const props = defineProps({
  visible: { type: Boolean, default: false },
  row: { type: Object, default: null },
  formRules: { type: Object, default: () => ({}) },
  formStationOptions: { type: Array, default: () => [] },
  equipmentList: { type: Array, default: () => [] },
  urgencyOptions: { type: Array, default: () => [] },
  repairers: { type: Array, default: () => [] },
  getFlowActive: { type: Function, required: true },
  getFlowSteps: { type: Function, required: true },
  canEditReport: { type: Function, required: true },
  canEditDispatch: { type: Function, required: true },
  canEditRepair: { type: Function, required: true },
  canEditVerify: { type: Function, required: true },
  handleStationChange: { type: Function, required: true },
  handleEquipmentChange: { type: Function, required: true },
  onRepairerChange: { type: Function, required: true },
  getUserDisplayName: { type: Function, required: true },
  canReport: { type: Boolean, default: false },
  canDispatch: { type: Boolean, default: false },
  canRepair: { type: Boolean, default: false },
  canVerify: { type: Boolean, default: false },
  isDraftRow: { type: Function, required: true },
  saving: { type: Object, default: () => ({}) },
  rowKey: { type: Function, required: true },
  saveReport: { type: Function, required: true },
  dispatchRow: { type: Function, required: true },
  startRowRepair: { type: Function, required: true },
  saveRepairRow: { type: Function, required: true },
  submitRepairRow: { type: Function, required: true },
  verifyRow: { type: Function, required: true },
  consumableRowClass: { type: Function, default: null },
  partRowClass: { type: Function, default: null },
  addConsumable: { type: Function, required: true },
  removeConsumable: { type: Function, required: true },
  lockConsumable: { type: Function, required: true },
  unlockConsumable: { type: Function, required: true },
  addPart: { type: Function, required: true },
  removePart: { type: Function, required: true },
  lockPart: { type: Function, required: true },
  unlockPart: { type: Function, required: true }
});

const emit = defineEmits(['update:visible']);
const formRef = ref(null);
const currentRow = toRef(props, 'row');

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

const stationNameText = computed(() => {
  const row = currentRow.value;
  if (!row) return '-';
  const stationName = row.station_name ?? row.station?.station_name;
  return resolveText(stationName, '-');
});

const flowSteps = computed(() => {
  const row = currentRow.value;
  if (!row) return [];
  const steps = props.getFlowSteps(row);
  return Array.isArray(steps) ? steps : [];
});
</script>
