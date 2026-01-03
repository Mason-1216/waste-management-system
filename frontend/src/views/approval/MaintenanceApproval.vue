<template>
  <div class="maintenance-approval-page">
    <div class="page-header">
      <h2>保养审核</h2>
    </div>

    <el-tabs v-model="activeTab" @tab-change="loadList">
      <el-tab-pane label="待审核" name="pending" />
      <el-tab-pane label="已通过" name="approved" />
      <el-tab-pane label="已驳回" name="rejected" />
    </el-tabs>

    <el-table :data="approvalList" stripe border>
      <el-table-column prop="equipmentName" label="设备名称" min-width="150" />
      <el-table-column prop="maintenanceType" label="保养类型" width="120" />
      <el-table-column prop="maintenanceDate" label="保养日期" width="120" />
      <el-table-column prop="operator.realName" label="操作人" width="100" />
      <el-table-column prop="workHours" label="工时" width="80" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.approvalStatus)">{{ getStatusLabel(row.approvalStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button link type="primary" @click="viewDetail(row)">详情</el-button>
          <template v-if="row.approvalStatus === 'pending'">
            <el-button link type="success" @click="approve(row)">通过</el-button>
            <el-button link type="danger" @click="reject(row)">驳回</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="rejectDialogVisible" title="驳回原因" width="400px">
      <el-input v-model="rejectReason" type="textarea" :rows="3" placeholder="请输入驳回原因" />
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmReject">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '@/api/request';

const activeTab = ref('pending');
const approvalList = ref([]);
const rejectDialogVisible = ref(false);
const rejectReason = ref('');
const currentRecord = ref(null);

const getStatusType = (status) => ({ pending: 'warning', approved: 'success', rejected: 'danger' }[status] || 'info');
const getStatusLabel = (status) => ({ pending: '待审核', approved: '已通过', rejected: '已驳回' }[status] || status);

const loadList = async () => {
  try {
    const res = await request.get('/maintenance-records', { params: { approvalStatus: activeTab.value } });
    approvalList.value = res.list || [];
  } catch (e) {  }
};

const viewDetail = (row) => {
  ElMessage.info('查看详情');
};

const approve = async (row) => {
  await ElMessageBox.confirm('确定通过该保养记录吗？', '提示');
  await request.put(`/maintenance-records/${row.id}/approve`);
  ElMessage.success('已通过');
  loadList();
};

const reject = (row) => {
  currentRecord.value = row;
  rejectReason.value = '';
  rejectDialogVisible.value = true;
};

const confirmReject = async () => {
  await request.put(`/maintenance-records/${currentRecord.value.id}/reject`, { reason: rejectReason.value });
  ElMessage.success('已驳回');
  rejectDialogVisible.value = false;
  loadList();
};

onMounted(() => loadList());
</script>

<style lang="scss" scoped>
.maintenance-approval-page {
  .page-header {
    margin-bottom: 20px;
    h2 { margin: 0; font-size: 20px; }
  }
}
</style>
