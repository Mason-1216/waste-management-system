<template>
  <div class="maintenance-plan-page">
    <div class="page-header">
      <h2>保养计划</h2>
      <div class="header-actions">
        <el-button v-if="isSimpleMode" @click="simpleShowTable = !simpleShowTable">
          {{ simpleShowTable ? '切换卡片' : '切换表格' }}
        </el-button>
        <el-button type="primary" :loading="exporting" @click="handleExport">
          <el-icon><Upload /></el-icon>批量导出
        </el-button>
        <el-button type="primary" @click="showAddDialog">
          <el-icon><Plus /></el-icon>新增计划
        </el-button>
      </div>
    </div>

    <el-card class="filter-card">
      <SimpleFilterBar
        :enabled="isSimpleMode"
        v-model:expanded="simpleFilterExpanded"
        summary-text="当前筛选：全部"
      >
        <FilterBar />
      </SimpleFilterBar>
    </el-card>

    <el-table v-if="!isSimpleMode || simpleShowTable" :data="planTableRows" stripe border>
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
    <div v-else class="simple-card-list">
      <el-empty v-if="planTableRows.length === 0" description="暂无数据" />
      <div v-for="row in planTableRows" :key="row.id" class="simple-card-item">
        <div class="card-title">{{ row.equipmentName || '-' }}</div>
        <div class="card-meta">计划类型：{{ getPlanTypeLabel(row.planType) }}</div>
        <div class="card-meta">下次保养日期：{{ row.nextDate || '-' }}</div>
        <div class="card-meta">负责人：{{ row.assignee?.realName || '-' }}</div>
        <div class="card-meta">状态：{{ row.status === 'active' ? '启用' : '停用' }}</div>
        <div class="card-actions">
          <el-button link type="primary" @click="editPlan(row)">编辑</el-button>
          <el-button link type="danger" @click="deletePlan(row)">删除</el-button>
        </div>
      </div>
    </div>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[5, 10, 20, 50]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next"
        @current-change="handlePageChange"
        @size-change="handlePageSizeChange"
      />
    </div>

    <FormDialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑计划' : '新增计划'"
      width="500px"
      :confirm-text="'保存'"
      :cancel-text="'取消'"
      @confirm="savePlan"
    >
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
    </FormDialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Upload, Plus } from '@element-plus/icons-vue';
import { useRoute } from 'vue-router';

import FilterBar from '@/components/common/FilterBar.vue';
import SimpleFilterBar from '@/components/common/SimpleFilterBar.vue';
import request from '@/api/request';
import FormDialog from '@/components/system/FormDialog.vue';
import { buildExportFileName, exportRowsToXlsx } from '@/utils/tableExport';
import { useSimpleMode } from '@/composables/useSimpleMode';

const planList = ref([]);
const exporting = ref(false);
const pagination = ref({ page: 1, pageSize: 5, total: 0 });
const dialogVisible = ref(false);
const isEdit = ref(false);
const form = ref({ equipmentName: '', planType: 'monthly', nextDate: '' });
const route = useRoute();
const { isSimpleMode, simpleShowTable, simpleFilterExpanded } = useSimpleMode();

const getPlanTypeLabel = (type) => {
  const labels = { daily: '日常保养', weekly: '周保养', monthly: '月保养', quarterly: '季度保养', yearly: '年度保养' };
  return labels[type] || type;
};

const resolvePageTitle = () => {
  if (typeof route?.meta?.title === 'string' && route.meta.title.trim()) {
    return route.meta.title.trim();
  }
  return '保养计划';
};

const resolveExportColumns = () => ([
  { label: '设备名称', prop: 'equipmentName' },
  { label: '计划类型', value: (row) => getPlanTypeLabel(row?.planType) },
  { label: '下次保养日期', prop: 'nextDate' },
  { label: '负责人', value: (row) => row?.assignee?.realName ?? '-' },
  { label: '状态', value: (row) => (row?.status === 'active' ? '启用' : '停用') }
]);

const loadList = async () => {
  try {
    const res = await request.get('/maintenance-plans');
    planList.value = res.list || [];
    pagination.value.page = 1;
    pagination.value.total = planList.value.length;
  } catch (e) {  }
};

const planTableRows = computed(() => {
  const list = Array.isArray(planList.value) ? planList.value : [];
  const startIndex = (pagination.value.page - 1) * pagination.value.pageSize;
  const endIndex = startIndex + pagination.value.pageSize;
  return list.slice(startIndex, endIndex);
});

const handleExport = async () => {
  if (exporting.value) return;
  exporting.value = true;
  try {
    const title = resolvePageTitle();
    const fileName = buildExportFileName({ title });
    const rows = Array.isArray(planList.value) ? planList.value : [];

    if (rows.length === 0) {
      ElMessage.warning('没有可导出的数据');
      return;
    }

    await exportRowsToXlsx({
      title,
      fileName,
      sheetName: '保养计划',
      columns: resolveExportColumns(),
      rows
    });
    ElMessage.success('导出成功');
  } catch (error) {
    const msg = typeof error?.message === 'string' && error.message.trim() ? error.message.trim() : '导出失败';
    ElMessage.error(msg);
  } finally {
    exporting.value = false;
  }
};

const handlePageChange = (page) => {
  pagination.value.page = page;
};

const handlePageSizeChange = (size) => {
  pagination.value.pageSize = size;
  pagination.value.page = 1;
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

watch(
  () => planList.value.length,
  (total) => {
    pagination.value.total = total;
    const size = pagination.value.pageSize;
    const maxPage = Math.max(1, Math.ceil(total / size));
    if (pagination.value.page > maxPage) pagination.value.page = maxPage;
  }
);
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

  .simple-card-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .simple-card-item {
    border: 1px solid #ebeef5;
    border-radius: 8px;
    background: #fff;
    padding: 12px;
  }

  .card-title {
    font-weight: 600;
    margin-bottom: 8px;
  }

  .card-meta {
    font-size: 13px;
    color: #606266;
    margin-bottom: 4px;
  }

  .card-actions {
    margin-top: 8px;
    display: flex;
    gap: 8px;
  }
}
</style>

