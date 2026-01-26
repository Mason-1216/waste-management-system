<template>
  <div class="repair-work-page">
    <div class="page-header">
      <h2>维修工作</h2>
    </div>

    <el-tabs v-model="activeTab" @tab-change="loadList">
      <el-tab-pane label="待处理" name="pending" />
      <el-tab-pane label="进行中" name="in_progress" />
      <el-tab-pane label="已完成" name="completed" />
    </el-tabs>

    <el-table :data="repairList" stripe border>
      <el-table-column prop="faultReport.equipmentName" label="设备名称" min-width="150" />
      <el-table-column prop="faultReport.faultType" label="故障类型" width="120" />
      <el-table-column prop="faultReport.urgencyLevel" label="紧急程度" width="100">
        <template #default="{ row }">
          <el-tag :type="row.faultReport?.urgencyLevel === 'high' ? 'danger' : 'warning'">
            {{ row.faultReport?.urgencyLevel === 'high' ? '紧急' : '一般' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="requirements" label="维修要求" show-overflow-tooltip />
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button v-if="row.status === 'pending'" type="primary" size="small" @click="startRepair(row)">开始维修</el-button>
          <el-button v-if="row.status === 'in_progress'" type="success" size="small" @click="completeRepair(row)">完成维修</el-button>
          <el-button link type="primary" @click="viewDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <FormDialog
      v-model="completeDialogVisible"
      title="完成维修"
      width="500px"
      :confirm-text="'提交'"
      :cancel-text="'取消'"
      @confirm="submitComplete"
    >
      <el-form :model="completeForm" label-width="100px">
        <el-form-item label="维修描述">
          <el-input v-model="completeForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="更换配件">
          <el-input v-model="completeForm.replacedParts" />
        </el-form-item>
        <el-form-item label="维修成本">
          <el-input-number v-model="completeForm.cost" :min="0" />
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

const activeTab = ref('pending');
const repairList = ref([]);
const completeDialogVisible = ref(false);
const currentRepair = ref(null);
const completeForm = ref({ description: '', replacedParts: '', cost: 0 });

const loadList = async () => {
  try {
    const res = await request.get('/repair-records', { params: { status: activeTab.value } });
    repairList.value = res.list || [];
  } catch (e) {  }
};

const startRepair = async (row) => {
  await request.put(`/repair-records/${row.id}/start`);
  ElMessage.success('已开始维修');
  loadList();
};

const completeRepair = (row) => {
  currentRepair.value = row;
  completeForm.value = { description: '', replacedParts: '', cost: 0 };
  completeDialogVisible.value = true;
};

const submitComplete = async () => {
  await request.put(`/repair-records/${currentRepair.value.id}/complete`, completeForm.value);
  ElMessage.success('维修已完成');
  completeDialogVisible.value = false;
  loadList();
};

const viewDetail = (row) => {
  ElMessage.info('查看详情');
};

onMounted(() => loadList());
</script>

<style lang="scss" scoped>
.repair-work-page {
  .page-header {
    margin-bottom: 20px;
    h2 { margin: 0; font-size: 20px; }
  }
}
</style>
