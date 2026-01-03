<template>
  <div class="price-management-page">
    <div class="page-header">
      <h2>单价管理</h2>
      <el-button type="primary" @click="showAddDialog">
        <el-icon><Plus /></el-icon>新增单价
      </el-button>
    </div>

    <!-- 筛选 -->
    <div class="filter-bar">
      <el-select v-model="filters.type" placeholder="类型" clearable @change="loadList">
        <el-option label="工时单价" value="work_hour" />
        <el-option label="进料单价" value="inbound" />
        <el-option label="出料单价" value="outbound" />
        <el-option label="维修单价" value="repair" />
      </el-select>
      <el-select v-model="filters.stationId" placeholder="场站" clearable @change="loadList">
        <el-option label="全部场站" :value="null" />
        <el-option
          v-for="s in stationList"
          :key="s.id"
          :label="s.stationName"
          :value="s.id"
        />
      </el-select>
      <el-button type="primary" @click="loadList">搜索</el-button>
    </div>

    <!-- 列表 -->
    <el-table :data="priceList" stripe border>
      <el-table-column prop="name" label="名称" min-width="150" />
      <el-table-column label="类型" width="120">
        <template #default="{ row }">
          <el-tag>{{ getTypeLabel(row.type) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="price" label="单价" width="120">
        <template #default="{ row }">
          ¥{{ row.price.toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column prop="unit" label="单位" width="100" />
      <el-table-column prop="station.stationName" label="适用场站" width="150">
        <template #default="{ row }">
          {{ row.station?.stationName || '全部' }}
        </template>
      </el-table-column>
      <el-table-column prop="effectiveDate" label="生效日期" width="120">
        <template #default="{ row }">
          {{ formatDate(row.effectiveDate) }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="editPrice(row)">编辑</el-button>
          <el-button link type="danger" @click="deletePrice(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @current-change="loadList"
        @size-change="loadList"
      />
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑单价' : '新增单价'"
      width="500px"
    >
      <el-form :model="priceForm" :rules="priceRules" ref="formRef" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="priceForm.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="priceForm.type" placeholder="请选择类型">
            <el-option label="工时单价" value="work_hour" />
            <el-option label="进料单价" value="inbound" />
            <el-option label="出料单价" value="outbound" />
            <el-option label="维修单价" value="repair" />
          </el-select>
        </el-form-item>
        <el-form-item label="单价" prop="price">
          <el-input-number v-model="priceForm.price" :min="0" :precision="2" />
          <span style="margin-left: 8px">元</span>
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="priceForm.unit" placeholder="如：元/小时、元/吨" />
        </el-form-item>
        <el-form-item label="适用场站">
          <el-select v-model="priceForm.stationId" placeholder="全部场站" clearable>
            <el-option
              v-for="s in formStationOptions"
              :key="s.id"
              :label="s.stationName"
              :value="s.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="生效日期" prop="effectiveDate">
          <el-date-picker
            v-model="priceForm.effectiveDate"
            type="date"
            placeholder="选择生效日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="priceForm.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="priceForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePrice" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import dayjs from 'dayjs';
import request from '@/api/request';

const formRef = ref(null);
const priceList = ref([]);
const stationList = ref([]);
const dialogVisible = ref(false);
const isEdit = ref(false);
const saving = ref(false);
const isActiveStatus = (status) => status === undefined || status === null || status === '' || status === 'active' || status === 1 || status === '1' || status === true;
const activeStationList = computed(() => stationList.value.filter(station => isActiveStatus(station.status)));
const formStationOptions = computed(() => {
  const selectedId = priceForm.value.stationId;
  if (!selectedId) return activeStationList.value;
  const selected = stationList.value.find(station => station.id === selectedId);
  if (selected && !isActiveStatus(selected.status)) {
    return [selected, ...activeStationList.value.filter(station => station.id !== selectedId)];
  }
  return activeStationList.value;
});

const filters = ref({
  type: '',
  stationId: null
});

const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
});

const priceForm = ref({
  name: '',
  type: '',
  price: 0,
  unit: '',
  stationId: null,
  effectiveDate: '',
  status: 1,
  remark: ''
});

const priceRules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  price: [{ required: true, message: '请输入单价', trigger: 'blur' }],
  unit: [{ required: true, message: '请输入单位', trigger: 'blur' }],
  effectiveDate: [{ required: true, message: '请选择生效日期', trigger: 'change' }]
};

const getTypeLabel = (type) => {
  const labels = {
    work_hour: '工时单价',
    inbound: '进料单价',
    outbound: '出料单价',
    repair: '维修单价'
  };
  return labels[type] || type;
};

const formatDate = (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-';

const loadList = async () => {
  try {
    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      type: filters.value.type || undefined,
      stationId: filters.value.stationId || undefined
    };
    const res = await request.get('/prices', { params });
    priceList.value = res.list || [];
    pagination.value.total = res.total || 0;
  } catch (e) {
    
  }
};

const loadStations = async () => {
  try {
    const res = await request.get('/stations', { params: { pageSize: 100 } });
    stationList.value = res.list || [];
  } catch (e) {
    
  }
};

const showAddDialog = () => {
  isEdit.value = false;
  priceForm.value = {
    name: '',
    type: '',
    price: 0,
    unit: '',
    stationId: null,
    effectiveDate: dayjs().format('YYYY-MM-DD'),
    status: 1,
    remark: ''
  };
  dialogVisible.value = true;
};

const editPrice = (row) => {
  isEdit.value = true;
  priceForm.value = { ...row };
  dialogVisible.value = true;
};

const savePrice = async () => {
  await formRef.value.validate();
  saving.value = true;
  try {
    if (isEdit.value) {
      await request.put(`/prices/${priceForm.value.id}`, priceForm.value);
    } else {
      await request.post('/prices', priceForm.value);
    }
    ElMessage.success('保存成功');
    dialogVisible.value = false;
    loadList();
  } catch (e) {
    
  } finally {
    saving.value = false;
  }
};

const deletePrice = async (row) => {
  await ElMessageBox.confirm(`确定删除单价 ${row.name} 吗？`, '提示', { type: 'warning' });
  try {
    await request.delete(`/prices/${row.id}`);
    ElMessage.success('删除成功');
    loadList();
  } catch (e) {
    
  }
};

onMounted(() => {
  loadList();
  loadStations();
});
</script>

<style lang="scss" scoped>
.price-management-page {
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

  .filter-bar {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    background: #fff;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }

  .el-table {
    border-radius: 8px;
    overflow: hidden;
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
