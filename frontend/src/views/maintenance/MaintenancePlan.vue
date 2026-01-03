<template>
  <div class="maintenance-plan-page">
    <div class="page-header">
      <h2>保养计划</h2>
      <el-button type="primary" @click="showAddDialog">
        <el-icon><Plus /></el-icon>新增计划
      </el-button>
    </div>

    <el-table :data="planList" stripe border>
      <el-table-column prop="equipmentName" label="设备名称" min-width="150" />
      <el-table-column prop="planType" label="计划类型" width="120">
        <template #default="{ row }">
          {{ getPlanTypeLabel(row.planType) }}
        </template>
      </el-table-column>
      <el-table-column prop="nextDate" label="下次保养日期" width="130" />
      <el-table-column prop="assignee.realName" label="负责人" width="100" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'">
            {{ row.status === 'active' ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button link type="primary" @click="editPlan(row)">编辑</el-button>
          <el-button link type="danger" @click="deletePlan(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑计划' : '新增计划'" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="设备名称">
          <el-input v-model="form.equipmentName" />
        </el-form-item>
        <el-form-item label="计划类型">
          <el-select v-model="form.planType">
            <el-option label="日常保养" value="daily" />
            <el-option label="周保养" value="weekly" />
            <el-option label="月保养" value="monthly" />
            <el-option label="季度保养" value="quarterly" />
            <el-option label="年度保养" value="yearly" />
          </el-select>
        </el-form-item>
        <el-form-item label="下次保养">
          <el-date-picker v-model="form.nextDate" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePlan">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/api/request';

const planList = ref([]);
const dialogVisible = ref(false);
const isEdit = ref(false);
const form = ref({ equipmentName: '', planType: 'monthly', nextDate: '' });

const getPlanTypeLabel = (type) => {
  const labels = { daily: '日常保养', weekly: '周保养', monthly: '月保养', quarterly: '季度保养', yearly: '年度保养' };
  return labels[type] || type;
};

const loadList = async () => {
  try {
    const res = await request.get('/maintenance-plans');
    planList.value = res.list || [];
  } catch (e) {  }
};

const showAddDialog = () => {
  isEdit.value = false;
  form.value = { equipmentName: '', planType: 'monthly', nextDate: '' };
  dialogVisible.value = true;
};

const editPlan = (row) => {
  isEdit.value = true;
  form.value = { ...row };
  dialogVisible.value = true;
};

const savePlan = async () => {
  ElMessage.success('保存成功');
  dialogVisible.value = false;
  loadList();
};

const deletePlan = (row) => {
  ElMessage.success('删除成功');
  loadList();
};

onMounted(() => loadList());
</script>

<style lang="scss" scoped>
.maintenance-plan-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    h2 { margin: 0; font-size: 20px; }
  }
}
</style>
