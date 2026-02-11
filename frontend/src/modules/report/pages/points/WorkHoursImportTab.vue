<template>
  <div class="work-hours-import-tab">
    <el-card class="filter-card">
      <FilterBar>
        <div class="filter-item">
          <span class="filter-label">开始月份</span>
          <el-date-picker
            v-model="filters.startMonth"
            type="month"
            value-format="YYYY-MM"
            style="width: 160px"
            @change="handleSearch"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">结束月份</span>
          <el-date-picker
            v-model="filters.endMonth"
            type="month"
            value-format="YYYY-MM"
            style="width: 160px"
            @change="handleSearch"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">姓名</span>
          <el-input
            v-model="filters.userName"
            placeholder="请输入姓名"
            clearable
            style="width: 160px"
            @clear="handleSearch"
            @input="handleNameInput"
            @keyup.enter="handleSearch"
          />
        </div>
      </FilterBar>
    </el-card>

    <div class="action-bar">
      <el-button v-if="canImport" type="info" @click="downloadTemplate">下载模板</el-button>
      <BaseUpload
        v-if="canImport"
        :action="manualImportUrl"
        :headers="uploadHeaders"
        :on-success="handleImportSuccess"
        :on-error="handleImportError"
        :show-file-list="false"
        :before-upload="beforeUpload"
        accept=".xlsx,.xls"
      >
        <el-button type="success">导入工时</el-button>
      </BaseUpload>
    </div>

    <TableWrapper>
      <el-table v-loading="loading" :data="rows" stripe border>
        <el-table-column prop="userName" label="姓名" min-width="100" />
        <el-table-column prop="workMonth" label="月份" min-width="120" align="center" />
        <el-table-column prop="workHours" label="工时(小时)" min-width="100" align="center" />
        <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
        <el-table-column prop="createdByName" label="创建人" min-width="100" />
        <el-table-column prop="createdAt" label="创建时间" min-width="160" align="center" />
        <el-table-column v-if="canImport" label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </TableWrapper>

    <div class="pagination-wrapper" v-if="pagination.total > 0">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @current-change="load"
        @size-change="handlePageSizeChange"
      />
    </div>

    <el-dialog v-model="editDialogVisible" title="编辑工时" width="400px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="姓名">
          <el-input :model-value="editForm.userName" disabled />
        </el-form-item>
        <el-form-item label="月份">
          <el-date-picker
            v-model="editForm.workMonth"
            type="month"
            value-format="YYYY-MM"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="工时">
          <el-input-number
            v-model="editForm.workHours"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editLoading" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

import FilterBar from '@/components/common/FilterBar.vue';
import TableWrapper from '@/components/common/TableWrapper.vue';
import BaseUpload from '@/components/common/BaseUpload.vue';
import request from '@/api/request';
import { useUpload } from '@/composables/useUpload';
import { useUserStore } from '@/store/modules/user';

const userStore = useUserStore();
const managerRoles = ['station_manager', 'department_manager', 'deputy_manager', 'senior_management'];
const canImport = computed(() => userStore.hasRole(managerRoles));

const { uploadUrl: manualImportUrl, uploadHeaders } = useUpload('/reports/work-hours-manual-import');

const loading = ref(false);
const rows = ref([]);
const pagination = reactive({ page: 1, pageSize: 20, total: 0 });

const filters = reactive({
  startMonth: '',
  endMonth: '',
  userName: ''
});

const editDialogVisible = ref(false);
const editLoading = ref(false);
const editForm = reactive({
  id: null,
  userName: '',
  workMonth: '',
  workHours: 0,
  remark: ''
});

const beforeUpload = (file) => {
  const type = file?.type ?? '';
  const isExcel = type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    || type === 'application/vnd.ms-excel';
  if (!isExcel) {
    ElMessage.error('只能上传Excel文件');
  }
  return isExcel;
};

const handleImportSuccess = () => {
  ElMessage.success('导入成功');
  pagination.page = 1;
  load();
};

const handleImportError = () => {
  ElMessage.error('导入失败');
};

const downloadTemplate = async () => {
  try {
    const response = await request.get('/reports/work-hours-manual-template', { responseType: 'blob' });
    const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '工时导入模板.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch {
    ElMessage.error('下载模板失败');
  }
};

const buildParams = () => {
  const params = {
    page: pagination.page,
    pageSize: pagination.pageSize
  };
  if (filters.startMonth) params.startMonth = filters.startMonth;
  if (filters.endMonth) params.endMonth = filters.endMonth;
  if (filters.userName) params.userName = filters.userName;
  return params;
};

const applyResponse = (payload) => {
  const list = Array.isArray(payload?.list) ? payload.list : [];
  rows.value = list;
  const total = Number(payload?.total);
  pagination.total = Number.isFinite(total) ? total : list.length;
};

const load = async () => {
  loading.value = true;
  try {
    const data = await request.get('/reports/work-hours-list', { params: buildParams() });
    applyResponse(data);
  } catch {
    rows.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  load();
};

let nameSearchTimer = null;
const handleNameInput = () => {
  if (nameSearchTimer) {
    clearTimeout(nameSearchTimer);
    nameSearchTimer = null;
  }
  nameSearchTimer = setTimeout(() => {
    handleSearch();
  }, 300);
};

const handlePageSizeChange = () => {
  pagination.page = 1;
  load();
};

const handleEdit = (row) => {
  editForm.id = row.id;
  editForm.userName = row.userName;
  editForm.workMonth = row.workMonth;
  editForm.workHours = row.workHours;
  editForm.remark = row.remark ?? '';
  editDialogVisible.value = true;
};

const submitEdit = async () => {
  if (!editForm.workMonth) {
    ElMessage.warning('请选择月份');
    return;
  }
  editLoading.value = true;
  try {
    await request.put(`/reports/work-hours/${editForm.id}`, {
      workMonth: editForm.workMonth,
      workHours: editForm.workHours,
      remark: editForm.remark
    });
    ElMessage.success('保存成功');
    editDialogVisible.value = false;
    load();
  } catch {
    ElMessage.error('保存失败');
  } finally {
    editLoading.value = false;
  }
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除 ${row.userName} 在 ${row.workMonth} 的工时记录吗？`, '提示', {
      type: 'warning'
    });
    await request.delete(`/reports/work-hours/${row.id}`);
    ElMessage.success('删除成功');
    load();
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

onMounted(() => {
  load();
});
</script>

<style lang="scss" scoped>
.work-hours-import-tab {
  .filter-card {
    margin-bottom: 20px;
  }

  .action-bar {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    background: #fff;
    padding: 16px;
    border-radius: 8px;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
    background: #fff;
    padding: 16px;
    border-radius: 8px;
  }
}
</style>
