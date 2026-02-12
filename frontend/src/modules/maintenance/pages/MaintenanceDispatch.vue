<template>
  <div class="maintenance-dispatch-page">
    <div class="page-header">
      <h2>维修派发</h2>
      <div class="header-actions">
        <el-button v-if="isSimpleMode" @click="simpleShowTable = !simpleShowTable">
          {{ simpleShowTable ? '切换卡片' : '切换表格' }}
        </el-button>
        <el-button type="primary" :loading="exporting" @click="handleExport">
          <el-icon><Upload /></el-icon>批量导出
        </el-button>
      </div>
    </div>

    <SimpleFilterBar
      :enabled="isSimpleMode"
      v-model:expanded="simpleFilterExpanded"
      :summary-text="simpleFilterSummary"
    >
      <el-card class="filter-card">
        <FilterBar />
      </el-card>
    </SimpleFilterBar>

    <el-table v-if="!isSimpleMode || simpleShowTable" :data="faultTableRows" stripe border>
      <el-table-column prop="equipmentName" :label="'设备名称'" min-width="150" />
      <el-table-column prop="faultType" :label="'故障类型'" width="120" />
      <el-table-column prop="urgencyLevel" :label="'紧急程度'" width="100">
        <template #default="{ row }">
          <el-tag :type="getUrgencyType(row.urgencyLevel)">{{ getUrgencyLabel(row.urgencyLevel) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="reporter.realName" :label="'上报人'" width="100" />
      <el-table-column prop="createdAt" :label="'上报时间'" width="160" />
      <el-table-column :label="'操作'" width="120">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="dispatch(row)">派发</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div v-else class="simple-card-list">
      <el-empty v-if="faultTableRows.length === 0" :description="'暂无待派发记录'" />
      <el-card v-for="row in faultTableRows" :key="row.id" class="simple-dispatch-card">
        <div class="card-header">
          <div class="title-group">
            <div class="title">{{ row.equipmentName || '-' }}</div>
            <div class="subtitle">{{ row.faultType || '-' }}</div>
          </div>
          <div class="header-right">
            <el-tag size="small" :type="getUrgencyType(row.urgencyLevel)">{{ getUrgencyLabel(row.urgencyLevel) }}</el-tag>
            <el-button link @click="toggleExpanded(row.id)">
              <el-icon :class="{ 'is-expanded': expandedRows[row.id] }"><ArrowDown /></el-icon>
            </el-button>
          </div>
        </div>
        <div class="meta-line">上报时间：{{ row.createdAt || '-' }}</div>
        <div v-if="expandedRows[row.id]" class="card-body">
          <div class="meta-line">上报人：{{ row.reporter?.realName || '-' }}</div>
          <div class="meta-line">故障描述：{{ row.description || '-' }}</div>
          <div class="meta-line">初步判断：{{ row.preliminaryDiagnosis || row.initialDiagnosis || '-' }}</div>
          <div class="card-actions">
            <el-button type="primary" @click="dispatch(row)">派发</el-button>
          </div>
        </div>
      </el-card>
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
      :title="'派发维修'"
      width="500px"
      :confirm-text="'确认派发'"
      :cancel-text="'取消'"
      @confirm="confirmDispatch"
    >
      <el-form :model="form" label-width="100px">
        <el-form-item :label="'维修人员'">
          <el-select v-model="form.repairerId" :placeholder="'选择维修人员'">
            <el-option v-for="u in repairers" :key="u.id" :label="u.realName" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="'维修要求'">
          <el-input v-model="form.requirements" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
    </FormDialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Upload, ArrowDown } from '@element-plus/icons-vue';
import { useRoute } from 'vue-router';

import FilterBar from '@/components/common/FilterBar.vue';
import SimpleFilterBar from '@/components/common/SimpleFilterBar.vue';
import request from '@/api/request';
import FormDialog from '@/components/system/FormDialog.vue';
import { buildExportFileName, exportRowsToXlsx } from '@/utils/tableExport';
import { useUserStore } from '@/store/modules/user';
import { useUiModeStore } from '@/store/modules/uiMode';

const faultList = ref([]);
const pagination = ref({ page: 1, pageSize: 5, total: 0 });
const repairers = ref([]);
const dialogVisible = ref(false);
const currentFault = ref(null);
const form = ref({ repairerId: null, requirements: '' });
const exporting = ref(false);
const route = useRoute();
const userStore = useUserStore();
const uiModeStore = useUiModeStore();

const canUseSimpleMode = computed(() => userStore.roleCode === 'dev_test' || userStore.baseRoleCode === 'dev_test');
const isSimpleMode = computed(() => canUseSimpleMode.value && uiModeStore.isSimpleMode);
const simpleShowTable = ref(false);
const simpleFilterExpanded = ref(false);
const expandedRows = ref({});

const getUrgencyType = (level) => ({ low: 'info', medium: 'warning', high: 'danger', critical: 'danger' }[level] || 'info');
const getUrgencyLabel = (level) => ({ low: '一般', medium: '较急', high: '紧急', critical: '非常紧急' }[level] || level);
const simpleFilterSummary = computed(() => `状态=待派发 | 总数=${pagination.value.total || 0}`);

const resolvePageTitle = () => {
  if (typeof route?.meta?.title === 'string' && route.meta.title.trim()) {
    return route.meta.title.trim();
  }
  return '维修派发';
};

const resolveExportColumns = () => ([
  { label: '设备名称', prop: 'equipmentName' },
  { label: '故障类型', prop: 'faultType' },
  { label: '紧急程度', value: (row) => getUrgencyLabel(row?.urgencyLevel) },
  { label: '上报人', value: (row) => row?.reporter?.realName ?? '-' },
  { label: '上报时间', value: (row) => row?.createdAt ?? '-' }
]);

const loadList = async () => {
  try {
    const res = await request.get('/fault-reports', { params: { status: 'pending' } });
    faultList.value = res.list || [];
    pagination.value.page = 1;
    pagination.value.total = faultList.value.length;
  } catch (e) {}
};

const faultTableRows = computed(() => {
  const list = Array.isArray(faultList.value) ? faultList.value : [];
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
    const rows = Array.isArray(faultList.value) ? faultList.value : [];

    if (rows.length === 0) {
      ElMessage.warning('没有可导出的数据');
      return;
    }

    await exportRowsToXlsx({
      title,
      fileName,
      sheetName: '待派发',
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

const loadRepairers = async () => {
  try {
    const res = await request.get('/users', { params: { roleCode: 'maintenance' } });
    repairers.value = res.list || [];
  } catch (e) {}
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

const toggleExpanded = (id) => {
  expandedRows.value = {
    ...expandedRows.value,
    [id]: !expandedRows.value[id]
  };
};

onMounted(() => {
  loadList();
  loadRepairers();
});

watch(
  () => faultList.value.length,
  (total) => {
    pagination.value.total = total;
    const size = pagination.value.pageSize;
    const maxPage = Math.max(1, Math.ceil(total / size));
    if (pagination.value.page > maxPage) pagination.value.page = maxPage;
  }
);

watch(isSimpleMode, (enabled) => {
  if (enabled) return;
  simpleShowTable.value = false;
  simpleFilterExpanded.value = false;
  expandedRows.value = {};
});
</script>

<style lang="scss" scoped>
.maintenance-dispatch-page {
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

  .header-actions {
    display: flex;
    gap: 10px;
  }

  .simple-card-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .simple-dispatch-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    .title-group {
      min-width: 0;
    }

    .title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      word-break: break-all;
    }

    .subtitle {
      margin-top: 4px;
      color: #909399;
      font-size: 13px;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .meta-line {
      margin-top: 8px;
      color: #606266;
      font-size: 13px;
      line-height: 1.5;
      word-break: break-all;
    }

    .card-body {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px dashed #ebeef5;
    }

    .card-actions {
      margin-top: 10px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .is-expanded {
    transform: rotate(180deg);
  }
}
</style>
