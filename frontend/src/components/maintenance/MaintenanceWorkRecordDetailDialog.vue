<template>
  <el-dialog v-model="dialogVisible" title="保养工作记录详情" width="800px" destroy-on-close>
    <el-form v-if="record" :model="record" label-width="120px">
      <el-divider content-position="left">基本信息</el-divider>
      <div class="section-grid">
        <el-form-item label="记录编号">
          <el-input v-model="record.recordCode" disabled />
        </el-form-item>
        <el-form-item label="场站">
          <el-input v-model="record.stationName" disabled />
        </el-form-item>
        <el-form-item label="岗位">
          <el-input v-model="record.positionName" disabled />
        </el-form-item>
        <el-form-item label="设备编号">
          <el-input v-model="record.equipmentCode" disabled />
        </el-form-item>
        <el-form-item label="设备名称">
          <el-input v-model="record.equipmentName" disabled />
        </el-form-item>
        <el-form-item label="安装位置">
          <el-input v-model="record.installLocation" disabled />
        </el-form-item>
        <el-form-item label="保养周期">
          <el-input :model-value="cycleLabelText" disabled />
        </el-form-item>
        <el-form-item label="工作日期">
          <el-input v-model="record.workDate" disabled />
        </el-form-item>
        <el-form-item label="执行人">
          <el-input v-model="record.executorName" disabled />
        </el-form-item>
        <el-form-item label="提交时间">
          <el-input v-model="record.submitTime" disabled />
        </el-form-item>
      </div>

      <el-divider content-position="left">保养标准确认</el-divider>
      <el-table :data="maintenanceItems" border size="small">
        <el-table-column prop="name" label="项目" min-width="150" />
        <el-table-column prop="specification" label="标准" min-width="200" />
        <el-table-column label="积分" width="90" align="center">
          <template #default="{ row }">
            <span>{{ row.points ?? 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="确认" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.confirmed ? 'success' : 'info'" size="small">
              {{ row.confirmed ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <el-divider content-position="left">保养信息</el-divider>
      <div class="section-grid">
        <el-form-item label="保养工具">
          <el-input v-model="record.maintenanceTools" disabled />
        </el-form-item>
        <el-form-item label="保养时长">
          <el-input :model-value="workHoursText" disabled />
        </el-form-item>
      </div>

      <el-form-item label="耗材清单" v-if="hasConsumables">
        <el-table :data="consumables" border size="small">
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="quantity" label="数量" width="80" />
          <el-table-column prop="unit" label="单位" width="80" />
        </el-table>
      </el-form-item>

      <el-form-item label="配件清单" v-if="hasParts">
        <el-table :data="parts" border size="small">
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="quantity" label="数量" width="80" />
          <el-table-column prop="unit" label="单位" width="80" />
        </el-table>
      </el-form-item>

      <el-form-item label="保养备注">
        <el-input v-model="record.remark" type="textarea" :rows="2" disabled />
      </el-form-item>
      <template v-if="showVerify">
        <el-divider content-position="left">验收信息</el-divider>
        <div class="section-grid">
          <el-form-item label="验收结果">
            <el-tag :type="verifyTagType">
              {{ verifyResultText }}
            </el-tag>
          </el-form-item>
          <el-form-item v-if="showDeduction" label="扣分">
            <span>{{ deductionPointsText }}</span>
          </el-form-item>
          <el-form-item v-if="showDeduction && deductionRemarkText" label="扣分说明">
            <span>{{ deductionRemarkText }}</span>
          </el-form-item>
          <el-form-item label="验收人">
            <span>{{ verifyPersonText }}</span>
          </el-form-item>
          <el-form-item label="验收时间">
            <span>{{ verifyTimeText }}</span>
          </el-form-item>
          <el-form-item v-if="verifyRemarkText" label="验收备注">
            <span>{{ verifyRemarkText }}</span>
          </el-form-item>
        </div>
      </template>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  visible: { type: Boolean, default: false },
  record: { type: Object, default: null },
  getCycleLabel: { type: Function, required: true }
});

const emit = defineEmits(['update:visible']);

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
});

const maintenanceItems = computed(() => {
  if (!props.record) return [];
  const items = props.record.maintenanceItems;
  if (Array.isArray(items)) return items;
  return [];
});

const consumables = computed(() => {
  if (!props.record) return [];
  const items = props.record.consumablesList;
  if (Array.isArray(items)) return items;
  return [];
});

const parts = computed(() => {
  if (!props.record) return [];
  const items = props.record.partsList;
  if (Array.isArray(items)) return items;
  return [];
});

const hasConsumables = computed(() => consumables.value.length > 0);
const hasParts = computed(() => parts.value.length > 0);

const cycleLabelText = computed(() => {
  if (!props.record) return '';
  const cycleType = props.record.cycleType;
  const normalized = cycleType === undefined || cycleType === null ? '' : cycleType;
  return props.getCycleLabel(normalized);
});

const workHoursText = computed(() => {
  if (!props.record) return '-';
  const hours = props.record.workHours;
  if (hours === undefined || hours === null || hours === '') return '-';
  return `${hours} 小时`;
});

const hasValue = (value) => value !== undefined && value !== null && value !== '';

const showVerify = computed(() => {
  const record = props.record;
  if (!record) return false;
  if (record.status === 'verified') return true;
  if (hasValue(record.verifyResult)) return true;
  if (hasValue(record.verifierName)) return true;
  if (hasValue(record.verifyTime)) return true;
  if (hasValue(record.verifyRemark)) return true;
  return false;
});

const verifyResultText = computed(() => {
  const record = props.record;
  if (!record) return '-';
  const result = record.verifyResult;
  if (result === 'pass') return '验收通过';
  if (result === 'fail') return '验收不通过';
  return '-';
});

const verifyTagType = computed(() => {
  const record = props.record;
  if (!record) return 'info';
  const result = record.verifyResult;
  if (result === 'pass') return 'success';
  if (result === 'fail') return 'danger';
  return 'info';
});

const verifyPersonText = computed(() => {
  if (!props.record) return '-';
  return hasValue(props.record.verifierName) ? props.record.verifierName : '-';
});

const verifyTimeText = computed(() => {
  if (!props.record) return '-';
  return hasValue(props.record.verifyTime) ? props.record.verifyTime : '-';
});

const verifyRemarkText = computed(() => {
  if (!props.record) return '';
  return hasValue(props.record.verifyRemark) ? props.record.verifyRemark : '';
});

const showDeduction = computed(() => {
  if (!props.record) return false;
  if (props.record.verifyResult === 'fail') return true;
  if (hasValue(props.record.deductionPoints)) return true;
  if (hasValue(props.record.deductionRemark)) return true;
  return false;
});

const deductionPointsText = computed(() => {
  if (!props.record) return '-';
  return hasValue(props.record.deductionPoints) ? props.record.deductionPoints : '0';
});

const deductionRemarkText = computed(() => {
  if (!props.record) return '';
  return hasValue(props.record.deductionRemark) ? props.record.deductionRemark : '';
});

const handleClose = () => {
  dialogVisible.value = false;
};
</script>
