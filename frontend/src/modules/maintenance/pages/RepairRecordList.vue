<template>
  <div class="repair-list-page">
    <div class="page-header">
      <h2>设备维修记录单</h2>
      <div class="header-actions">
        <el-button type="primary" :loading="exporting" @click="handleExport">
          <el-icon><Upload /></el-icon>
          批量导出
        </el-button>
        <el-button type="primary" @click="createNew">
          <el-icon><Plus /></el-icon>
          新建维修记录
        </el-button>
      </div>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <FilterBar>
        <div class="filter-item">
          <span class="filter-label">状态</span>
          <FilterSelect v-model="filters.status" clearable filterable placeholder="全部" style="width: 150px;" @change="loadList" @clear="loadList">
            <el-option label="全部" value="all" />
            <el-option label="草稿" value="draft_report" />
            <el-option label="已提交" value="submitted_report" />
            <el-option label="已派发" value="dispatched" />
            <el-option label="维修中" value="repairing" />
            <el-option label="待验收" value="repaired_submitted" />
            <el-option label="已验收" value="accepted" />
          </FilterSelect>
        </div>
        <div class="filter-item">
          <span class="filter-label">设备名称</span>
          <FilterAutocomplete
            v-model="filters.equipmentName"
            :fetch-suggestions="fetchEquipmentNameSuggestions"
            trigger-on-focus
            placeholder="全部"
            clearable
            style="width: 150px;"
            @select="loadList"
            @input="loadList"
            @clear="loadList"
          />
        </div>
      </FilterBar>
    </el-card>

    <!-- 快捷筛选标签 -->
    <div class="quick-filters">
      <el-radio-group v-model="quickFilter" @change="handleQuickFilter">
        <el-radio-button label="all">全部</el-radio-button>
        <el-radio-button label="my_report">我上报的</el-radio-button>
        <el-radio-button label="my_repair">我负责维修</el-radio-button>
        <el-radio-button label="pending_dispatch" v-if="isStationManager">待派发</el-radio-button>
        <el-radio-button label="pending_verify" v-if="isStationManager">待验收</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 列表 -->
    <el-table :data="list" stripe border v-loading="loading">
      <el-table-column prop="record_code" label="维修单号" width="140" />
      <el-table-column prop="equipment_name" label="设备名称" min-width="120" />
      <el-table-column prop="station.station_name" label="场站" width="120" />
      <el-table-column prop="fault_date" label="故障日期" width="110" />
      <el-table-column prop="reporter_name" label="上报人" width="90" />
      <el-table-column prop="repair_person_name" label="维修人员" width="90" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="160">
        <template #default="{ row }">
          {{ formatDateTime(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button link type="primary" @click="viewDetail(row)">查看</el-button>
          <el-button v-if="canEdit(row)" link type="primary" @click="editRecord(row)">编辑</el-button>
          <el-button v-if="canDispatch(row)" link type="success" @click="goDispatch(row)">派发</el-button>
          <el-button v-if="canVerify(row)" link type="success" @click="goVerify(row)">验收</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[5, 10, 20, 50]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next"
        @size-change="loadList"
        @current-change="loadList"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import dayjs from 'dayjs';
import { Upload } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

import FilterBar from '@/components/common/FilterBar.vue';
import { useUserStore } from '@/store/modules/user';
import { getRepairRecords } from '@/api/repair';
import { createListSuggestionFetcher } from '@/utils/filterAutocomplete';
import { buildExportFileName, exportRowsToXlsx, fetchAllPaged } from '@/utils/tableExport';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const loading = ref(false);
const list = ref([]);
const listSuggestion = ref([]);
const quickFilter = ref('all');
const exporting = ref(false);

const fetchEquipmentNameSuggestions = createListSuggestionFetcher(
  () => listSuggestion.value,
  (row) => row.equipment_name
);

const filters = ref({
  status: 'all',
  equipmentName: ''
});

const pagination = ref({
  page: 1,
  pageSize: 5,
  total: 0
});

const isStationManager = computed(() => userStore.hasRole('station_manager'));

const resolvePageTitle = () => {
  if (typeof route?.meta?.title === 'string' && route.meta.title.trim()) {
    return route.meta.title.trim();
  }
  return '设备维修记录单';
};

const getStatusType = (status) => {
  const types = {
    'draft_report': 'info',
    'submitted_report': 'warning',
    'dispatched': 'primary',
    'repairing': 'primary',
    'repaired_submitted': 'warning',
    'accepted': 'success',
    'archived': 'info'
  };
  return types[status] || 'info';
};

const getStatusLabel = (status) => {
  const labels = {
    'draft_report': '草稿',
    'submitted_report': '已提交',
    'dispatched': '已派发',
    'repairing': '维修中',
    'repaired_submitted': '待验收',
    'accepted': '已验收',
    'archived': '已归档'
  };
  return labels[status] || status;
};

const formatDateTime = (date) => dayjs(date).format('YYYY-MM-DD HH:mm');

const canEdit = (row) => {
  return row.status === 'draft_report' && row.reporter_id === userStore.userId;
};

const canDispatch = (row) => {
  return row.status === 'submitted_report' && isStationManager.value;
};

const canVerify = (row) => {
  return row.status === 'repaired_submitted' && isStationManager.value;
};

const resolveTextValue = (value) => (typeof value === 'string' ? value.trim() : '');

const buildListParams = ({ page, pageSize }) => {
  const params = {
    page,
    pageSize
  };

  if (filters.value.status !== 'all') {
    params.status = filters.value.status;
  }

  const equipmentName = resolveTextValue(filters.value.equipmentName);
  if (equipmentName) {
    params.equipmentName = equipmentName;
  }

  // 根据快捷筛选添加条件
  if (quickFilter.value === 'my_report') {
    params.reporterId = userStore.userId;
  } else if (quickFilter.value === 'my_repair') {
    params.repairPersonId = userStore.userId;
  } else if (quickFilter.value === 'pending_dispatch') {
    params.status = 'submitted_report';
  } else if (quickFilter.value === 'pending_verify') {
    params.status = 'repaired_submitted';
  }

  return params;
};

const resolveExportColumns = () => ([
  { label: '维修单号', prop: 'record_code' },
  { label: '设备名称', prop: 'equipment_name' },
  { label: '场站', value: (row) => row?.station?.station_name ?? '-' },
  { label: '故障日期', prop: 'fault_date' },
  { label: '上报人', prop: 'reporter_name' },
  { label: '维修人员', prop: 'repair_person_name' },
  { label: '状态', value: (row) => getStatusLabel(row?.status) },
  { label: '创建时间', value: (row) => formatDateTime(row?.created_at) }
]);

const loadList = async () => {
  loading.value = true;
  try {
    const params = buildListParams({ page: pagination.value.page, pageSize: pagination.value.pageSize });
    const res = await getRepairRecords(params);
    list.value = res.list || [];
    pagination.value.total = res.total || 0;
    loadListSuggestions(params);
  } catch (e) {
    
  } finally {
    loading.value = false;
  }
};

const loadListSuggestions = async (baseParams) => {
  try {
    const params = {
      ...baseParams,
      page: 1,
      pageSize: 5000
    };
    const res = await getRepairRecords(params);
    listSuggestion.value = res.list || [];
  } catch (e) {
    listSuggestion.value = [];
  }
};

const handleExport = async () => {
  if (exporting.value) return;
  exporting.value = true;
  try {
    const title = resolvePageTitle();
    const fileName = buildExportFileName({ title });

    const { rows } = await fetchAllPaged({
      fetchPage: ({ page, pageSize }) => getRepairRecords(buildListParams({ page, pageSize })),
      pageSize: 5000
    });

    const allRows = Array.isArray(rows) ? rows : [];
    if (allRows.length === 0) {
      const fallback = Array.isArray(list.value) ? list.value : [];
      if (fallback.length === 0) {
        ElMessage.warning('没有可导出的数据');
        return;
      }
      await exportRowsToXlsx({
        title,
        fileName,
        sheetName: '维修记录',
        columns: resolveExportColumns(),
        rows: fallback
      });
      ElMessage.success('导出成功');
      return;
    }

    await exportRowsToXlsx({
      title,
      fileName,
      sheetName: '维修记录',
      columns: resolveExportColumns(),
      rows: allRows
    });
    ElMessage.success('导出成功');
  } catch (error) {
    const msg = typeof error?.message === 'string' && error.message.trim() ? error.message.trim() : '导出失败';
    ElMessage.error(msg);
  } finally {
    exporting.value = false;
  }
};

const resetFilters = () => {
  filters.value = { status: 'all', equipmentName: '' };
  quickFilter.value = 'all';
  pagination.value.page = 1;
  loadList();
};

const handleQuickFilter = () => {
  filters.value.status = 'all';
  pagination.value.page = 1;
  loadList();
};

const createNew = () => {
  router.push('/repair-record/new');
};

const viewDetail = (row) => {
  router.push(`/repair-record/${row.id}`);
};

const editRecord = (row) => {
  router.push(`/repair-record/${row.id}`);
};

const goDispatch = (row) => {
  router.push(`/repair-record/${row.id}`);
};

const goVerify = (row) => {
  router.push(`/repair-record/${row.id}`);
};

onMounted(() => {
  loadList();
});
</script>

<style lang="scss" scoped>
.repair-list-page {
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

  .filter-card {
    margin-bottom: 16px;
  }

  .quick-filters {
    margin-bottom: 16px;
  }

  .el-table {
    border-radius: 8px;
    overflow: hidden;
  }

  .pagination-container {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>

