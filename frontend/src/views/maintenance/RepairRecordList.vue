<template>
  <div class="repair-list-page">
    <div class="page-header">
      <h2>设备维修记录单</h2>
      <el-button type="primary" @click="createNew">
        <el-icon><Plus /></el-icon>
        新建维修记录
      </el-button>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-card">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="状态">
          <el-select v-model="filters.status" clearable placeholder="全部状态" style="width: 150px;">
            <el-option label="草稿" value="draft_report" />
            <el-option label="已提交" value="submitted_report" />
            <el-option label="已派发" value="dispatched" />
            <el-option label="维修中" value="repairing" />
            <el-option label="待验收" value="repaired_submitted" />
            <el-option label="已验收" value="accepted" />
          </el-select>
        </el-form-item>
        <el-form-item label="设备名称">
          <el-input v-model="filters.equipmentName" placeholder="设备名称" clearable style="width: 150px;" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadList">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

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
        :page-sizes="[10, 20, 50]"
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
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/modules/user';
import { getRepairRecords } from '@/api/repair';
import dayjs from 'dayjs';

const router = useRouter();
const userStore = useUserStore();

const loading = ref(false);
const list = ref([]);
const quickFilter = ref('all');

const filters = ref({
  status: '',
  equipmentName: ''
});

const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
});

const isStationManager = computed(() => ['station_manager', 'admin'].includes(userStore.roleCode));

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

const loadList = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      status: filters.value.status,
      equipmentName: filters.value.equipmentName
    };

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

    const res = await getRepairRecords(params);
    list.value = res.list || [];
    pagination.value.total = res.total || 0;
  } catch (e) {
    
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  filters.value = { status: '', equipmentName: '' };
  quickFilter.value = 'all';
  pagination.value.page = 1;
  loadList();
};

const handleQuickFilter = () => {
  filters.value.status = '';
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
    background: #fff;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
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
