<template>
  <div class="repair-record-page">
    <div class="page-header">
      <h2>设备维修记录单</h2>
      <div class="header-actions">
        <el-button @click="goBack">返回列表</el-button>
      </div>
    </div>

    <!-- 状态流程条 -->
    <div class="status-steps">
      <el-steps :active="currentStep" finish-status="success" align-center>
        <el-step title="上报" description="填写故障信息" />
        <el-step title="派发" description="站长派发维修" />
        <el-step title="维修" description="维修人员处理" />
        <el-step title="验收" description="站长验收确认" />
      </el-steps>
    </div>

    <div class="form-card">
      <!-- 表单编号和基础信息 -->
      <div class="form-section">
        <div class="section-header">
          <span class="section-title">基本信息</span>
          <el-tag :type="statusTagType" size="large">{{ statusLabel }}</el-tag>
        </div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="维修单号">
              <el-input v-model="form.recordCode" disabled placeholder="自动生成" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属场站">
              <el-select v-model="form.stationId" placeholder="请选择场站" :disabled="!canEditReport">
                <el-option v-for="s in formStationOptions" :key="s.id" :label="s.station_name" :value="s.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 设备信息 -->
      <div class="form-section">
        <div class="section-header">
          <span class="section-title">设备信息</span>
        </div>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="设备编号">
              <el-input v-model="form.equipmentCode" placeholder="请输入设备编号" :disabled="!canEditReport" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="设备名称" required>
              <el-input v-model="form.equipmentName" placeholder="请输入设备名称" :disabled="!canEditReport" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="设备型号">
              <el-input v-model="form.equipmentModel" placeholder="请输入设备型号" :disabled="!canEditReport" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="设备位置">
              <el-input v-model="form.equipmentLocation" placeholder="请输入设备安装位置" :disabled="!canEditReport" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 故障信息 -->
      <div class="form-section">
        <div class="section-header">
          <span class="section-title">故障信息</span>
        </div>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="故障日期" required>
              <el-date-picker v-model="form.faultDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" :disabled="!canEditReport" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="故障时间" required>
              <el-time-picker v-model="form.faultTime" value-format="HH:mm" format="HH:mm" placeholder="选择时间" :disabled="!canEditReport" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="上报人">
              <el-input v-model="form.reporterName" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="故障描述" required>
              <el-input v-model="form.faultDescription" type="textarea" :rows="3" placeholder="请详细描述故障现象" :disabled="!canEditReport" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="初步判断">
              <el-input v-model="form.preliminaryJudgment" type="textarea" :rows="2" placeholder="对故障原因的初步判断" :disabled="!canEditReport" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 派发信息（站长填写） -->
      <div class="form-section" v-if="showDispatchSection">
        <div class="section-header">
          <span class="section-title">派发信息</span>
        </div>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="派发给">
              <el-select v-model="form.repairPersonId" placeholder="请选择维修人员" :disabled="!canDispatch" @change="handleRepairPersonChange">
                <el-option v-for="u in maintenanceUsers" :key="u.id" :label="u.real_name" :value="u.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="派发人">
              <el-input v-model="form.dispatchByName" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="派发时间">
              <el-input :value="form.dispatchDate ? `${form.dispatchDate} ${form.dispatchTime || ''}` : ''" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="派发备注">
              <el-input v-model="form.dispatchRemark" type="textarea" :rows="2" placeholder="派发备注说明" :disabled="!canDispatch" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 维修信息（维修人员填写） -->
      <div class="form-section" v-if="showRepairSection">
        <div class="section-header">
          <span class="section-title">维修信息</span>
        </div>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="维修人员">
              <el-input v-model="form.repairPersonName" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="开始时间">
              <el-input :value="form.repairStartDate ? `${form.repairStartDate} ${form.repairStartTime || ''}` : ''" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="完成时间">
              <el-input :value="form.repairEndDate ? `${form.repairEndDate} ${form.repairEndTime || ''}` : ''" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="维修内容">
              <el-input v-model="form.repairContent" type="textarea" :rows="3" placeholder="请描述维修过程和处理方法" :disabled="!canRepair" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="使用工具">
              <el-input v-model="form.repairTools" placeholder="使用的维修工具" :disabled="!canRepair" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 耗材明细 -->
        <div class="detail-table">
          <div class="table-header">
            <span>维修耗材明细</span>
            <el-button v-if="canRepair" type="primary" size="small" @click="addConsumable">添加耗材</el-button>
          </div>
          <el-table :data="form.consumablesList" border size="small">
            <el-table-column prop="name" label="耗材名称" min-width="120">
              <template #default="{ row, $index }">
                <el-input v-if="canRepair" v-model="row.name" size="small" />
                <span v-else>{{ row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="model" label="规格型号" width="100">
              <template #default="{ row }">
                <el-input v-if="canRepair" v-model="row.model" size="small" />
                <span v-else>{{ row.model }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="unit" label="单位" width="70">
              <template #default="{ row }">
                <el-input v-if="canRepair" v-model="row.unit" size="small" />
                <span v-else>{{ row.unit }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="80">
              <template #default="{ row }">
                <el-input-number v-if="canRepair" v-model="row.quantity" size="small" :min="0" controls-position="right" @change="calcConsumablesTotal" />
                <span v-else>{{ row.quantity }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="unitPrice" label="单价" width="100">
              <template #default="{ row }">
                <el-input-number v-if="canRepair" v-model="row.unitPrice" size="small" :min="0" :precision="2" controls-position="right" @change="calcConsumablesTotal" />
                <span v-else>{{ row.unitPrice }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" width="100">
              <template #default="{ row }">
                {{ ((row.quantity || 0) * (row.unitPrice || 0)).toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column v-if="canRepair" label="操作" width="60">
              <template #default="{ $index }">
                <el-button type="danger" size="small" link @click="removeConsumable($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="table-footer">
            <span>耗材合计：<strong>{{ form.consumablesTotal?.toFixed(2) || '0.00' }}</strong> 元</span>
          </div>
        </div>

        <!-- 配件明细 -->
        <div class="detail-table">
          <div class="table-header">
            <span>更换配件明细</span>
            <el-button v-if="canRepair" type="primary" size="small" @click="addPart">添加配件</el-button>
          </div>
          <el-table :data="form.partsList" border size="small">
            <el-table-column prop="name" label="配件名称" min-width="120">
              <template #default="{ row }">
                <el-input v-if="canRepair" v-model="row.name" size="small" />
                <span v-else>{{ row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="model" label="规格型号" width="100">
              <template #default="{ row }">
                <el-input v-if="canRepair" v-model="row.model" size="small" />
                <span v-else>{{ row.model }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="unit" label="单位" width="70">
              <template #default="{ row }">
                <el-input v-if="canRepair" v-model="row.unit" size="small" />
                <span v-else>{{ row.unit }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="80">
              <template #default="{ row }">
                <el-input-number v-if="canRepair" v-model="row.quantity" size="small" :min="0" controls-position="right" @change="calcPartsTotal" />
                <span v-else>{{ row.quantity }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="unitPrice" label="单价" width="100">
              <template #default="{ row }">
                <el-input-number v-if="canRepair" v-model="row.unitPrice" size="small" :min="0" :precision="2" controls-position="right" @change="calcPartsTotal" />
                <span v-else>{{ row.unitPrice }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" width="100">
              <template #default="{ row }">
                {{ ((row.quantity || 0) * (row.unitPrice || 0)).toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="更换原因" min-width="120">
              <template #default="{ row }">
                <el-input v-if="canRepair" v-model="row.reason" size="small" />
                <span v-else>{{ row.reason }}</span>
              </template>
            </el-table-column>
            <el-table-column v-if="canRepair" label="操作" width="60">
              <template #default="{ $index }">
                <el-button type="danger" size="small" link @click="removePart($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="table-footer">
            <span>配件合计：<strong>{{ form.partsTotal?.toFixed(2) || '0.00' }}</strong> 元</span>
          </div>
        </div>

        <!-- 维修结果 -->
        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :span="8">
            <el-form-item label="维修结果">
              <el-radio-group v-model="form.repairResult" :disabled="!canRepair">
                <el-radio label="normal">正常运行</el-radio>
                <el-radio label="observe">待观察</el-radio>
                <el-radio label="unsolved">未解决</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="8" v-if="form.repairResult === 'observe'">
            <el-form-item label="观察天数">
              <el-input-number v-model="form.observeDays" :min="1" :max="30" :disabled="!canRepair" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="维修工时">
              <el-input-number v-model="form.workHours" :min="0" :precision="1" :disabled="!canRepair" /> 小时
            </el-form-item>
          </el-col>
          <el-col :span="24" v-if="form.repairResult === 'unsolved'">
            <el-form-item label="未解决原因">
              <el-input v-model="form.unsolvedReason" type="textarea" :rows="2" placeholder="说明未能解决的原因" :disabled="!canRepair" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 验收信息（站长填写） -->
      <div class="form-section" v-if="showVerifySection">
        <div class="section-header">
          <span class="section-title">验收信息</span>
        </div>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="验收人">
              <el-input v-model="form.verifierName" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="验收时间">
              <el-input :value="form.verifyDate ? `${form.verifyDate} ${form.verifyTime || ''}` : ''" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="验收结果">
              <el-radio-group v-model="form.verifyResult" :disabled="!canVerify">
                <el-radio label="pass">通过</el-radio>
                <el-radio label="fail">不通过</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="评价星级">
              <el-rate v-model="form.rating" :disabled="!canVerify" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="验收意见">
              <el-input v-model="form.verifyComment" type="textarea" :rows="2" placeholder="验收意见" :disabled="!canVerify" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 操作按钮 -->
      <div class="form-actions">
        <!-- 上报人操作 -->
        <template v-if="canEditReport">
          <el-button type="default" size="large" @click="saveDraft" :loading="saving">保存草稿</el-button>
          <el-button type="primary" size="large" @click="submitReport" :loading="saving">提交上报</el-button>
        </template>
        <template v-if="form.status === 'draft_report' && isReporter">
          <el-button type="danger" size="large" @click="deleteRecord" :loading="saving">删除</el-button>
        </template>

        <!-- 站长派发操作 -->
        <template v-if="canDispatch">
          <el-button type="primary" size="large" @click="dispatchRecord" :loading="saving">派发维修</el-button>
        </template>

        <!-- 维修人员操作 -->
        <template v-if="canStartRepair">
          <el-button type="primary" size="large" @click="startRepairAction" :loading="saving">开始维修</el-button>
        </template>
        <template v-if="canRepair">
          <el-button type="primary" size="large" @click="completeRepairAction" :loading="saving">提交维修完成</el-button>
        </template>

        <!-- 站长验收操作 -->
        <template v-if="canVerify">
          <el-button type="primary" size="large" @click="verifyRecord" :loading="saving">确认验收</el-button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { ElMessage, ElMessageBox } from 'element-plus';
import dayjs from 'dayjs';
import request from '@/api/request';
import {
  getRepairRecordById,
  createRepairRecord,
  updateRepairRecord,
  deleteRepairRecord,
  submitRepairRecord,
  dispatchRepairRecord,
  startRepair,
  completeRepair,
  verifyRepairRecord
} from '@/api/repair';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const saving = ref(false);
const stations = ref([]);
const maintenanceUsers = ref([]);
const isActiveStatus = (status) => status === undefined || status === null || status === '' || status === 'active' || status === 1 || status === '1' || status === true;
const activeStationList = computed(() => stations.value.filter(station => isActiveStatus(station.status)));
const formStationOptions = computed(() => {
  if (isNew.value) return activeStationList.value;
  const selectedId = form.value.stationId;
  if (!selectedId) return activeStationList.value;
  const selected = stations.value.find(station => station.id === selectedId);
  if (selected && !isActiveStatus(selected.status)) {
    return [selected, ...activeStationList.value.filter(station => station.id !== selectedId)];
  }
  return activeStationList.value;
});

const form = ref({
  id: null,
  recordCode: '',
  stationId: null,
  equipmentCode: '',
  equipmentName: '',
  equipmentModel: '',
  equipmentLocation: '',
  faultDate: dayjs().format('YYYY-MM-DD'),
  faultTime: dayjs().format('HH:mm'),
  faultDescription: '',
  preliminaryJudgment: '',
  reporterId: null,
  reporterName: '',
  reportDate: '',
  reportTime: '',
  repairPersonId: null,
  repairPersonName: '',
  dispatchBy: null,
  dispatchByName: '',
  dispatchDate: '',
  dispatchTime: '',
  dispatchRemark: '',
  repairStartDate: '',
  repairStartTime: '',
  repairEndDate: '',
  repairEndTime: '',
  repairContent: '',
  repairTools: '',
  consumablesList: [],
  consumablesTotal: 0,
  partsList: [],
  partsTotal: 0,
  repairResult: 'normal',
  observeDays: 3,
  unsolvedReason: '',
  workHours: 0,
  verifierId: null,
  verifierName: '',
  verifyDate: '',
  verifyTime: '',
  verifyResult: 'pass',
  verifyComment: '',
  rating: 5,
  status: 'draft_report'
});

const isNew = computed(() => !route.params.id);
const isReporter = computed(() => form.value.reporterId === userStore.userId);
const isRepairPerson = computed(() => form.value.repairPersonId === userStore.userId);
const isStationManager = computed(() => ['station_manager', 'admin'].includes(userStore.roleCode));
const isMaintenance = computed(() => userStore.roleCode === 'maintenance');

const canEditReport = computed(() => {
  if (isNew.value) return true;
  return form.value.status === 'draft_report' && isReporter.value;
});

const canDispatch = computed(() => {
  return form.value.status === 'submitted_report' && isStationManager.value;
});

const canStartRepair = computed(() => {
  return form.value.status === 'dispatched' && isRepairPerson.value;
});

const canRepair = computed(() => {
  return ['dispatched', 'repairing'].includes(form.value.status) && isRepairPerson.value;
});

const canVerify = computed(() => {
  return form.value.status === 'repaired_submitted' && isStationManager.value;
});

const showDispatchSection = computed(() => {
  return !isNew.value && !['draft_report'].includes(form.value.status);
});

const showRepairSection = computed(() => {
  return !isNew.value && !['draft_report', 'submitted_report'].includes(form.value.status);
});

const showVerifySection = computed(() => {
  return !isNew.value && ['repaired_submitted', 'accepted', 'archived'].includes(form.value.status);
});

const currentStep = computed(() => {
  const statusStepMap = {
    'draft_report': 0,
    'submitted_report': 0,
    'dispatched': 1,
    'repairing': 2,
    'repaired_submitted': 2,
    'accepted': 3,
    'archived': 3
  };
  return statusStepMap[form.value.status] || 0;
});

const statusLabel = computed(() => {
  const labels = {
    'draft_report': '草稿',
    'submitted_report': '已提交',
    'dispatched': '已派发',
    'repairing': '维修中',
    'repaired_submitted': '待验收',
    'accepted': '已验收',
    'archived': '已归档'
  };
  return labels[form.value.status] || form.value.status;
});

const statusTagType = computed(() => {
  const types = {
    'draft_report': 'info',
    'submitted_report': 'warning',
    'dispatched': 'primary',
    'repairing': 'primary',
    'repaired_submitted': 'warning',
    'accepted': 'success',
    'archived': 'info'
  };
  return types[form.value.status] || 'info';
});

const goBack = () => {
  router.push('/repair-records');
};

const loadStations = async () => {
  try {
    const res = await request.get('/stations', { params: { pageSize: 200 } });
    stations.value = (res.list || res || []).map(station => ({
      ...station,
      station_name: station.station_name || station.stationName
    }));
  } catch (e) {  }
};

const loadMaintenanceUsers = async () => {
  try {
    const res = await request.get('/users', { params: { roleCode: 'maintenance', pageSize: 100 } });
    maintenanceUsers.value = res.list || [];
  } catch (e) {  }
};

const loadRecord = async () => {
  if (!route.params.id) return;
  try {
    const data = await getRepairRecordById(route.params.id);
    form.value = {
      id: data.id,
      recordCode: data.record_code,
      stationId: data.station_id,
      equipmentCode: data.equipment_code,
      equipmentName: data.equipment_name,
      equipmentModel: data.equipment_model,
      equipmentLocation: data.equipment_location,
      faultDate: data.fault_date,
      faultTime: data.fault_time,
      faultDescription: data.fault_description,
      preliminaryJudgment: data.preliminary_judgment,
      reporterId: data.reporter_id,
      reporterName: data.reporter_name,
      reportDate: data.report_date,
      reportTime: data.report_time,
      repairPersonId: data.repair_person_id,
      repairPersonName: data.repair_person_name,
      dispatchBy: data.dispatch_by,
      dispatchByName: data.dispatch_by_name,
      dispatchDate: data.dispatch_date,
      dispatchTime: data.dispatch_time,
      dispatchRemark: data.dispatch_remark,
      repairStartDate: data.repair_start_date,
      repairStartTime: data.repair_start_time,
      repairEndDate: data.repair_end_date,
      repairEndTime: data.repair_end_time,
      repairContent: data.repair_content,
      repairTools: data.repair_tools,
      consumablesList: data.consumables_list || [],
      consumablesTotal: parseFloat(data.consumables_total) || 0,
      partsList: data.parts_list || [],
      partsTotal: parseFloat(data.parts_total) || 0,
      repairResult: data.repair_result || 'normal',
      observeDays: data.observe_days || 3,
      unsolvedReason: data.unsolved_reason,
      workHours: parseFloat(data.work_hours) || 0,
      verifierId: data.verifier_id,
      verifierName: data.verifier_name,
      verifyDate: data.verify_date,
      verifyTime: data.verify_time,
      verifyResult: data.verify_result || 'pass',
      verifyComment: data.verify_comment,
      rating: data.rating || 5,
      status: data.status
    };
  } catch (e) {
    ElMessage.error('加载维修记录失败');
    
  }
};

const handleRepairPersonChange = (val) => {
  const user = maintenanceUsers.value.find(u => u.id === val);
  if (user) {
    form.value.repairPersonName = user.real_name;
  }
};

const addConsumable = () => {
  form.value.consumablesList.push({ name: '', model: '', unit: '个', quantity: 1, unitPrice: 0 });
};

const removeConsumable = (index) => {
  form.value.consumablesList.splice(index, 1);
  calcConsumablesTotal();
};

const calcConsumablesTotal = () => {
  form.value.consumablesTotal = form.value.consumablesList.reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.unitPrice || 0);
  }, 0);
};

const addPart = () => {
  form.value.partsList.push({ name: '', model: '', unit: '个', quantity: 1, unitPrice: 0, reason: '' });
};

const removePart = (index) => {
  form.value.partsList.splice(index, 1);
  calcPartsTotal();
};

const calcPartsTotal = () => {
  form.value.partsTotal = form.value.partsList.reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.unitPrice || 0);
  }, 0);
};

const saveDraft = async () => {
  saving.value = true;
  try {
    if (isNew.value) {
      const res = await createRepairRecord({
        stationId: form.value.stationId,
        equipmentCode: form.value.equipmentCode,
        equipmentName: form.value.equipmentName,
        equipmentModel: form.value.equipmentModel,
        equipmentLocation: form.value.equipmentLocation,
        faultDate: form.value.faultDate,
        faultTime: form.value.faultTime,
        faultDescription: form.value.faultDescription,
        preliminaryJudgment: form.value.preliminaryJudgment,
        isDraft: true
      });
      ElMessage.success('草稿保存成功');
      router.replace(`/repair-record/${res.id}`);
    } else {
      await updateRepairRecord(form.value.id, {
        equipmentCode: form.value.equipmentCode,
        equipmentName: form.value.equipmentName,
        equipmentModel: form.value.equipmentModel,
        equipmentLocation: form.value.equipmentLocation,
        faultDate: form.value.faultDate,
        faultTime: form.value.faultTime,
        faultDescription: form.value.faultDescription,
        preliminaryJudgment: form.value.preliminaryJudgment
      });
      ElMessage.success('保存成功');
    }
  } catch (e) {
    ElMessage.error('保存失败');
    
  } finally {
    saving.value = false;
  }
};

const submitReport = async () => {
  if (!form.value.equipmentName || !form.value.faultDescription) {
    ElMessage.warning('请填写设备名称和故障描述');
    return;
  }
  saving.value = true;
  try {
    if (isNew.value) {
      await createRepairRecord({
        stationId: form.value.stationId,
        equipmentCode: form.value.equipmentCode,
        equipmentName: form.value.equipmentName,
        equipmentModel: form.value.equipmentModel,
        equipmentLocation: form.value.equipmentLocation,
        faultDate: form.value.faultDate,
        faultTime: form.value.faultTime,
        faultDescription: form.value.faultDescription,
        preliminaryJudgment: form.value.preliminaryJudgment,
        isDraft: false
      });
    } else {
      await submitRepairRecord(form.value.id);
    }
    ElMessage.success('提交成功');
    router.push('/repair-records');
  } catch (e) {
    ElMessage.error('提交失败');
    
  } finally {
    saving.value = false;
  }
};

const deleteRecord = async () => {
  await ElMessageBox.confirm('确定删除此维修记录？', '提示', { type: 'warning' });
  saving.value = true;
  try {
    await deleteRepairRecord(form.value.id);
    ElMessage.success('删除成功');
    router.push('/repair-records');
  } catch (e) {
    ElMessage.error('删除失败');
  } finally {
    saving.value = false;
  }
};

const dispatchRecord = async () => {
  if (!form.value.repairPersonId) {
    ElMessage.warning('请选择维修人员');
    return;
  }
  saving.value = true;
  try {
    await dispatchRepairRecord(form.value.id, {
      repairPersonId: form.value.repairPersonId,
      repairPersonName: form.value.repairPersonName,
      dispatchRemark: form.value.dispatchRemark
    });
    ElMessage.success('派发成功');
    loadRecord();
  } catch (e) {
    ElMessage.error('派发失败');
  } finally {
    saving.value = false;
  }
};

const startRepairAction = async () => {
  saving.value = true;
  try {
    await startRepair(form.value.id);
    ElMessage.success('已开始维修');
    loadRecord();
  } catch (e) {
    ElMessage.error('操作失败');
  } finally {
    saving.value = false;
  }
};

const completeRepairAction = async () => {
  saving.value = true;
  try {
    await completeRepair(form.value.id, {
      repairContent: form.value.repairContent,
      repairTools: form.value.repairTools,
      consumablesList: form.value.consumablesList,
      consumablesTotal: form.value.consumablesTotal,
      partsList: form.value.partsList,
      partsTotal: form.value.partsTotal,
      repairResult: form.value.repairResult,
      observeDays: form.value.observeDays,
      unsolvedReason: form.value.unsolvedReason,
      workHours: form.value.workHours
    });
    ElMessage.success('维修完成已提交');
    loadRecord();
  } catch (e) {
    ElMessage.error('提交失败');
  } finally {
    saving.value = false;
  }
};

const verifyRecord = async () => {
  saving.value = true;
  try {
    await verifyRepairRecord(form.value.id, {
      verifyResult: form.value.verifyResult,
      verifyComment: form.value.verifyComment,
      rating: form.value.rating
    });
    ElMessage.success('验收完成');
    loadRecord();
  } catch (e) {
    ElMessage.error('验收失败');
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  await Promise.all([loadStations(), loadMaintenanceUsers()]);
  if (!isNew.value) {
    await loadRecord();
  } else {
    form.value.reporterId = userStore.userId;
    form.value.reporterName = userStore.realName;
    const currentStation = stations.value.find(station => station.id === userStore.currentStationId);
    if (currentStation && isActiveStatus(currentStation.status)) {
      form.value.stationId = currentStation.id;
    }
  }
});
</script>

<style lang="scss" scoped>
.repair-record-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      margin: 0;
      font-size: 20px;
    }
  }

  .status-steps {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }

  .form-card {
    background: #fff;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }

  .form-section {
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid #eee;

    &:last-of-type {
      border-bottom: none;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .section-title {
        font-size: 16px;
        font-weight: bold;
        color: #303133;
        padding-left: 10px;
        border-left: 3px solid #409EFF;
      }
    }
  }

  .detail-table {
    margin-top: 16px;

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;

      span {
        font-weight: bold;
        color: #606266;
      }
    }

    .table-footer {
      text-align: right;
      margin-top: 10px;
      color: #606266;

      strong {
        color: #E6A23C;
        font-size: 16px;
      }
    }
  }

  .form-actions {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #eee;
  }
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}
</style>
