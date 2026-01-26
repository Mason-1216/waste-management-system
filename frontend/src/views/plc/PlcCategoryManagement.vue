<template>
  <div class="category-management">
    <div class="page-header">
      <h2>分类管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleAdd">新增分类</el-button>
      </div>
    </div>

    <el-table
      v-loading="loading"
      :data="tableData"
      stripe
      border
      style="width: 100%"
    >
        <el-table-column prop="category_key" label="分类标识" width="120" />
        <el-table-column prop="category_name" label="分类名称" width="120" />
        <el-table-column prop="data_type" label="数据类型" width="100" />
        <el-table-column prop="value_type" label="取值类型" width="100">
          <template #default="{ row }">
            {{ valueTypeLabel(row.value_type) }}
          </template>
        </el-table-column>
        <el-table-column prop="schedule_type" label="采集方式" width="100">
          <template #default="{ row }">
            {{ scheduleLabel(row.schedule_type) }}
          </template>
        </el-table-column>
        <el-table-column prop="interval_hours" label="采集间隔" width="140">
          <template #default="{ row }">
            {{ row.schedule_type === 'interval' ? `${row.interval_hours || 0}小时${row.interval_minutes || 0}分钟` : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="fixed_time" label="固定时间" width="100">
          <template #default="{ row }">
            {{ row.schedule_type === 'fixed' ? row.fixed_time : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="is_enabled" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_enabled ? 'success' : 'info'" size="small">
              {{ row.is_enabled ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort_order" label="排序" width="80" align="center" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
    </el-table>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑分类' : '新增分类'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="分类标识" prop="categoryKey">
          <el-input v-model="formData.categoryKey" :disabled="isEdit" placeholder="例如: temperature" />
        </el-form-item>
        <el-form-item label="分类名称" prop="categoryName">
          <el-input v-model="formData.categoryName" placeholder="例如: 温度" />
        </el-form-item>
        <el-form-item label="取值类型" prop="valueType">
          <el-radio-group v-model="formData.valueType">
            <el-radio value="cumulative">计量型(净增值)</el-radio>
            <el-radio value="fluctuating">变化型(平均/极值)</el-radio>
            <el-radio value="event">事件型</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="数据类型" prop="dataType">
          <el-select v-model="formData.dataType" style="width: 100%;">
            <el-option label="REAL (浮点数)" value="REAL" />
            <el-option label="DINT (双字整数)" value="DINT" />
            <el-option label="INT (整数)" value="INT" />
            <el-option label="BOOL (布尔)" value="BOOL" />
          </el-select>
        </el-form-item>
        <el-form-item label="采集方式" prop="scheduleType">
          <el-radio-group v-model="formData.scheduleType">
            <el-radio value="interval">间隔采集</el-radio>
            <el-radio value="fixed">定时采集</el-radio>
            <el-radio value="on_change">变更即采集</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="formData.scheduleType === 'interval'" label="采集间隔" prop="intervalHours">
          <el-input-number v-model="formData.intervalHours" :min="0" :max="24" />
          <span style="margin: 0 8px;">小时</span>
          <el-input-number v-model="formData.intervalMinutes" :min="0" :max="59" />
          <span style="margin-left: 8px;">分钟</span>
        </el-form-item>
        <el-form-item v-if="formData.scheduleType === 'fixed'" label="固定时间" prop="fixedTime">
          <el-time-picker v-model="formData.fixedTime" format="HH:mm" value-format="HH:mm" />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="formData.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="启用" prop="isEnabled">
          <el-switch v-model="formData.isEnabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/api/plcMonitor';

const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const tableData = ref([]);
const formRef = ref(null);

const formData = reactive({
  id: null,
  categoryKey: '',
  categoryName: '',
  dataType: 'REAL',
  valueType: 'cumulative',
  scheduleType: 'interval',
  intervalHours: 1,
  intervalMinutes: 0,
  fixedTime: '08:00',
  sortOrder: 0,
  isEnabled: true
});

const formRules = {
  categoryKey: [{ required: true, message: '请输入分类标识', trigger: 'blur' }],
  categoryName: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  dataType: [{ required: true, message: '请选择数据类型', trigger: 'change' }],
  valueType: [{ required: true, message: '请选择取值类型', trigger: 'change' }]
};

const resetForm = () => {
  formData.id = null;
  formData.categoryKey = '';
  formData.categoryName = '';
  formData.dataType = 'REAL';
  formData.valueType = 'cumulative';
  formData.scheduleType = 'interval';
  formData.intervalHours = 1;
  formData.intervalMinutes = 0;
  formData.fixedTime = '08:00';
  formData.sortOrder = 0;
  formData.isEnabled = true;
};

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await getCategories();
    tableData.value = res || [];
  } catch (error) {
    console.error('获取分类列表失败:', error);
    ElMessage.error('获取分类列表失败');
  } finally {
    loading.value = false;
  }
};

const handleAdd = () => {
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  isEdit.value = true;
  formData.id = row.id;
  formData.categoryKey = row.category_key;
  formData.categoryName = row.category_name;
  formData.dataType = row.data_type;
  formData.valueType = row.value_type || 'cumulative';
  formData.scheduleType = row.schedule_type;
  formData.intervalHours = row.interval_hours;
  formData.intervalMinutes = row.interval_minutes || 0;
  formData.fixedTime = row.fixed_time || '08:00';
  formData.sortOrder = row.sort_order;
  formData.isEnabled = row.is_enabled;
  dialogVisible.value = true;
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该分类吗？', '提示', {
      type: 'warning'
    });

    await deleteCategory(row.id);
    ElMessage.success('删除成功');
    fetchData();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败');
    }
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    submitting.value = true;

    if (formData.scheduleType === 'interval' && formData.intervalHours === 0 && formData.intervalMinutes === 0) {
      ElMessage.error('采集间隔不能同时为0');
      return;
    }

    const data = {
      categoryKey: formData.categoryKey,
      categoryName: formData.categoryName,
      dataType: formData.dataType,
      valueType: formData.valueType,
      scheduleType: formData.scheduleType,
      intervalHours: formData.intervalHours,
      intervalMinutes: formData.intervalMinutes,
      fixedTime: formData.scheduleType === 'fixed' ? formData.fixedTime : null,
      sortOrder: formData.sortOrder,
      isEnabled: formData.isEnabled
    };

    if (isEdit.value) {
      await updateCategory(formData.id, data);
      ElMessage.success('更新成功');
    } else {
      await createCategory(data);
      ElMessage.success('创建成功');
    }

    dialogVisible.value = false;
    fetchData();
  } catch (error) {
    if (error !== false) {
      ElMessage.error(error.message || '操作失败');
    }
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  fetchData();
});

const valueTypeLabel = (val) => {
  if (val === 'fluctuating') return '变化型';
  if (val === 'event') return '事件型';
  return '计量型';
};

const scheduleLabel = (val) => {
  if (val === 'fixed') return '定时采集';
  if (val === 'on_change') return '变更即采集';
  return '间隔采集';
};
</script>

<style scoped lang="scss">
.category-management {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      margin: 0;
      font-size: 20px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }
  }

  .el-table {
    border-radius: 8px;
    overflow: hidden;
  }
}
</style>
