<template>
  <el-dialog v-model="dialogVisible" :title="dialogTitle" width="750px" destroy-on-close>
    <el-form ref="formRef" :model="planForm" :rules="planRules" label-width="120px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="场站" prop="stationId">
            <el-select v-model="planForm.stationId" placeholder="请选择场站" :disabled="stationLockActive" style="width: 100%;">
              <el-option v-for="s in stationOptions" :key="s.id" :label="s.stationName" :value="s.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="设备编号" prop="equipmentCode">
            <el-input v-model="planForm.equipmentCode" placeholder="请输入设备编号" maxlength="50" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="设备名称" prop="equipmentName">
            <el-input v-model="planForm.equipmentName" placeholder="请输入设备名称" maxlength="100" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="安装位置">
            <el-input v-model="planForm.installLocation" placeholder="请输入安装位置" maxlength="200" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="日保养标准">
        <div class="standards-container">
          <div v-for="(std, idx) in planForm.cycleStandards.daily" :key="`daily-${idx}`" class="standard-item">
            <el-row :gutter="12" align="middle">
              <el-col :span="8">
                <el-input v-model="std.name" placeholder="保养标准名称" />
              </el-col>
              <el-col :span="10">
                <el-input v-model="std.specification" placeholder="保养规范" />
              </el-col>
              <el-col :span="4">
                <el-input-number v-model="std.points" :min="0" :step="1" placeholder="积分" controls-position="right" style="width: 100%;" />
              </el-col>
              <el-col :span="2">
                <el-button type="danger" :icon="Delete" circle size="small" @click="handleRemove('daily', idx)" />
              </el-col>
            </el-row>
          </div>
          <el-button type="primary" link @click="handleAdd('daily')">
            <el-icon><Plus /></el-icon>添加日保养标准
          </el-button>
        </div>
      </el-form-item>
      <el-form-item label="周保养标准">
        <div class="standards-container">
          <div class="cycle-schedule-row">
            <span class="schedule-label">每周</span>
            <el-select v-model="planForm.weeklyDay" placeholder="周几" style="width: 100px;">
              <el-option label="周一" :value="1" />
              <el-option label="周二" :value="2" />
              <el-option label="周三" :value="3" />
              <el-option label="周四" :value="4" />
              <el-option label="周五" :value="5" />
              <el-option label="周六" :value="6" />
              <el-option label="周日" :value="7" />
            </el-select>
            <span class="schedule-label">完成</span>
          </div>
          <div v-for="(std, idx) in planForm.cycleStandards.weekly" :key="`weekly-${idx}`" class="standard-item">
            <el-row :gutter="12" align="middle">
              <el-col :span="8">
                <el-input v-model="std.name" placeholder="保养标准名称" />
              </el-col>
              <el-col :span="10">
                <el-input v-model="std.specification" placeholder="保养规范" />
              </el-col>
              <el-col :span="4">
                <el-input-number v-model="std.points" :min="0" :step="1" placeholder="积分" controls-position="right" style="width: 100%;" />
              </el-col>
              <el-col :span="2">
                <el-button type="danger" :icon="Delete" circle size="small" @click="handleRemove('weekly', idx)" />
              </el-col>
            </el-row>
          </div>
          <el-button type="primary" link @click="handleAdd('weekly')">
            <el-icon><Plus /></el-icon>添加周保养标准
          </el-button>
        </div>
      </el-form-item>
      <el-form-item label="月保养标准">
        <div class="standards-container">
          <div class="cycle-schedule-row">
            <span class="schedule-label">每月</span>
            <el-input-number v-model="planForm.monthlyDay" :min="1" :max="31" placeholder="几号" style="width: 100px;" />
            <span class="schedule-label">号完成</span>
          </div>
          <div v-for="(std, idx) in planForm.cycleStandards.monthly" :key="`monthly-${idx}`" class="standard-item">
            <el-row :gutter="12" align="middle">
              <el-col :span="8">
                <el-input v-model="std.name" placeholder="保养标准名称" />
              </el-col>
              <el-col :span="10">
                <el-input v-model="std.specification" placeholder="保养规范" />
              </el-col>
              <el-col :span="4">
                <el-input-number v-model="std.points" :min="0" :step="1" placeholder="积分" controls-position="right" style="width: 100%;" />
              </el-col>
              <el-col :span="2">
                <el-button type="danger" :icon="Delete" circle size="small" @click="handleRemove('monthly', idx)" />
              </el-col>
            </el-row>
          </div>
          <el-button type="primary" link @click="handleAdd('monthly')">
            <el-icon><Plus /></el-icon>添加月保养标准
          </el-button>
        </div>
      </el-form-item>
      <el-form-item label="年保养标准">
        <div class="standards-container">
          <div class="cycle-schedule-row">
            <span class="schedule-label">每年</span>
            <el-input-number v-model="planForm.yearlyMonth" :min="1" :max="12" placeholder="月" style="width: 90px;" controls-position="right" />
            <span class="schedule-label">月</span>
            <el-input-number v-model="planForm.yearlyDay" :min="1" :max="31" placeholder="日" style="width: 90px;" controls-position="right" />
            <span class="schedule-label">日完成</span>
          </div>
          <div v-for="(std, idx) in planForm.cycleStandards.yearly" :key="`yearly-${idx}`" class="standard-item">
            <el-row :gutter="12" align="middle">
              <el-col :span="8">
                <el-input v-model="std.name" placeholder="保养标准名称" />
              </el-col>
              <el-col :span="10">
                <el-input v-model="std.specification" placeholder="保养规范" />
              </el-col>
              <el-col :span="4">
                <el-input-number v-model="std.points" :min="0" :step="1" placeholder="积分" controls-position="right" style="width: 100%;" />
              </el-col>
              <el-col :span="2">
                <el-button type="danger" :icon="Delete" circle size="small" @click="handleRemove('yearly', idx)" />
              </el-col>
            </el-row>
          </div>
          <el-button type="primary" link @click="handleAdd('yearly')">
            <el-icon><Plus /></el-icon>添加年保养标准
          </el-button>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="emitSave" :loading="saving">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref, toRef } from 'vue';
import { Delete, Plus } from '@element-plus/icons-vue';

const props = defineProps({
  visible: { type: Boolean, default: false },
  isEdit: { type: Boolean, default: false },
  planForm: { type: Object, default: () => ({}) },
  planRules: { type: Object, default: () => ({}) },
  stationLockActive: { type: Boolean, default: false },
  stationOptions: { type: Array, default: () => [] },
  saving: { type: Boolean, default: false },
  addStandard: { type: Function, required: true },
  removeStandard: { type: Function, required: true }
});

const emit = defineEmits(['update:visible', 'save']);
const formRef = ref(null);
const planForm = toRef(props, 'planForm');

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
});

const dialogTitle = computed(() => (props.isEdit ? '编辑保养计划' : '新增保养计划'));

const handleAdd = (cycle) => props.addStandard(cycle);
const handleRemove = (cycle, idx) => props.removeStandard(cycle, idx);

const emitSave = () => emit('save');

const validate = () => formRef.value?.validate();

defineExpose({ validate });
</script>
