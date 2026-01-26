<template>
  <div class="maintenance-dispatch-page">
    <div class="page-header">
      <h2>维修派发</h2>
    </div>

    <el-table :data="faultList" stripe border>
      <el-table-column prop="equipmentName" label="设备名称" min-width="150" />
      <el-table-column prop="faultType" label="故障类型" width="120" />
      <el-table-column prop="urgencyLevel" label="紧急程度" width="100">
        <template #default="{ row }">
          <el-tag :type="getUrgencyType(row.urgencyLevel)">{{ getUrgencyLabel(row.urgencyLevel) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="reporter.realName" label="上报人" width="100" />
      <el-table-column prop="createdAt" label="上报时间" width="160" />
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="dispatch(row)">派发</el-button>
        </template>
      </el-table-column>
    </el-table>

    <FormDialog
      v-model="dialogVisible"
      title="派发维修"
      width="500px"
      :confirm-text="'确认派发'"
      :cancel-text="'取消'"
      @confirm="confirmDispatch"
    >
      <el-form :model="form" label-width="100px">
        <el-form-item label="维修人员">
          <el-select v-model="form.repairerId" placeholder="选择维修人员">
            <el-option v-for="u in repairers" :key="u.id" :label="u.realName" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="维修要求">
          <el-input v-model="form.requirements" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
    </FormDialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/api/request';
import FormDialog from '@/components/system/FormDialog.vue';

const faultList = ref([]);
const repairers = ref([]);
const dialogVisible = ref(false);
const currentFault = ref(null);
const form = ref({ repairerId: null, requirements: '' });

const getUrgencyType = (level) => ({ low: 'info', medium: 'warning', high: 'danger', critical: 'danger' }[level] || 'info');
const getUrgencyLabel = (level) => ({ low: '一般', medium: '较急', high: '紧急', critical: '非常紧急' }[level] || level);

const loadList = async () => {
  try {
    const res = await request.get('/fault-reports', { params: { status: 'pending' } });
    faultList.value = res.list || [];
  } catch (e) {  }
};

const loadRepairers = async () => {
  try {
    const res = await request.get('/users', { params: { roleCode: 'maintenance' } });
    repairers.value = res.list || [];
  } catch (e) {  }
};

const dispatch = (row) => {
  currentFault.value = row;
  form.value = { repairerId: null, requirements: '' };
  dialogVisible.value = true;
};

const confirmDispatch = async () => {
  await request.post('/repair-records', { faultReportId: currentFault.value.id, ...form.value });
  ElMessage.success('派发成功');
  dialogVisible.value = false;
  loadList();
};

onMounted(() => { loadList(); loadRepairers(); });
</script>

<style lang="scss" scoped>
.maintenance-dispatch-page {
  .page-header {
    margin-bottom: 20px;
    h2 { margin: 0; font-size: 20px; }
  }
}
</style>
