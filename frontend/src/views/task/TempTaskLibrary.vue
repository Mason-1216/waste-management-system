<template>
  <div class="temp-task-library-page">
    <div class="page-header">
      <h2>临时工作任务库</h2>
      <div class="header-actions">
        <el-button v-if="canManage" type="primary" @click="showDialog()">
          <el-icon><Plus /></el-icon>新建任务
        </el-button>
        <el-button @click="downloadTemplate">
          <el-icon><Download /></el-icon>下载模板
        </el-button>
        <el-button v-if="canManage" type="success" @click="triggerImport">
          <el-icon><Download /></el-icon>导入
        </el-button>
        <input
          ref="fileInputRef"
          type="file"
          accept=".xlsx,.xls"
          style="display: none;"
          @change="handleImport"
        />
      </div>
    </div>

    <el-card class="filter-card">
      <div class="filter-bar">
        <el-input
          v-model="filters.keyword"
          placeholder="搜索任务名称"
          clearable
          style="width: 220px;"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="filters.stationId"
          placeholder="筛选场站"
          clearable
          filterable
          style="width: 220px;"
        >
          <el-option
            v-for="station in stationOptions"
            :key="station.id"
            :label="station.name"
            :value="station.id"
          />
        </el-select>
        <el-button @click="resetFilters">重置</el-button>
        <el-button
          v-if="canManage"
          type="danger"
          :disabled="selectedRows.length === 0"
          @click="batchDelete"
        >
          批量删除
        </el-button>
      </div>
    </el-card>

    <!-- 任务表格 -->
    <div class="table-wrapper" v-loading="loading">
      <el-table
        ref="tableRef"
        :data="flattenedTableData"
        stripe
        border
        :row-key="rowKey"
        :span-method="spanMethod"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="48" />
        <el-table-column prop="stationName" label="场站" width="150">
          <template #default="{ row }">
            {{ row.stationName || '通用' }}
          </template>
        </el-table-column>
        <el-table-column prop="taskName" label="工作名称" width="180" />
        <el-table-column prop="taskContent" label="具体工作内容" min-width="250" show-overflow-tooltip />
        <el-table-column prop="standardHours" label="标准工时(h/d)" width="120">
          <template #default="{ row }">
            {{ row.standardHours }}
          </template>
        </el-table-column>
        <el-table-column prop="points" label="积分" width="80" />
        <el-table-column label="操作" width="150" fixed="right" v-if="canManage">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="showDialog(row)">
              编辑
            </el-button>
            <el-button link type="danger" size="small" @click="deleteTask(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="!loading && taskList.length === 0" class="empty-wrapper">
        <el-empty description="暂无任务数据">
          <el-button v-if="canManage" type="primary" @click="showDialog()">
            新建任务
          </el-button>
        </el-empty>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper" v-if="pagination.total > 0">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @current-change="loadTaskLibrary"
        @size-change="loadTaskLibrary"
      />
    </div>

    <!-- 新建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑任务' : '新建任务'"
      width="520px"
      destroy-on-close
    >
      <el-form
        :model="form"
        :rules="rules"
        ref="formRef"
        label-width="100px"
      >
        <el-form-item label="工作名称" prop="taskName">
          <el-input v-model="form.taskName" placeholder="请输入工作名称" maxlength="100" />
        </el-form-item>
        <el-form-item label="具体工作内容" prop="taskContent">
          <el-input
            v-model="form.taskContent"
            type="textarea"
            :rows="4"
            placeholder="请详细描述工作内容"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="标准工时(h/d)" prop="standardHours">
          <el-input-number
            v-model="form.standardHours"
            :min="0.5"
            :max="24"
            :step="0.5"
            :precision="1"
          />
          <span class="form-hint">每天预计工作时长</span>
        </el-form-item>
        <el-form-item label="积分" prop="points">
          <el-input-number
            v-model="form.points"
            :min="0"
            :max="9999"
            :step="1"
          />
          <span class="form-hint">完成任务获得的积分</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveTask">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useUserStore } from '@/store/user';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search, Download, Edit, Delete, Clock, Star } from '@element-plus/icons-vue';
import request from '@/api/request';

const userStore = useUserStore();

// 状态
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const taskList = ref([]);
const formRef = ref(null);
const tableRef = ref(null);
const currentId = ref(null);
const fileInputRef = ref(null);
const stationOptions = ref([]);
const selectedRows = ref([]);

// 扁平化表格数据，按场站分组
const flattenedTableData = computed(() => {
  const data = taskList.value || [];
  if (data.length === 0) return [];

  // 按场站分组
  const groupMap = new Map();
  data.forEach(item => {
    const stationName = item.station?.stationName || item.station?.station_name || '通用';
    const groupKey = stationName;

    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, {
        stationName,
        items: []
      });
    }
    groupMap.get(groupKey).items.push(item);
  });

  // 展开为行数据
  const rows = [];
  groupMap.forEach(group => {
    const rowCount = group.items.length;
    group.items.forEach((item, index) => {
      rows.push({
        ...item,
        stationName: group.stationName,
        _rowspan: index === 0 ? rowCount : 0,
        _rowKey: item.id ?? `row-${group.stationName}-${index}`
      });
    });
  });

  return rows;
});

// 单元格合并方法：场站列合并
const spanMethod = ({ row, columnIndex }) => {
  // 列索引：0-选择框 1-场站 需要合并
  if (columnIndex !== 1) return;
  if (row._rowspan > 0) {
    return { rowspan: row._rowspan, colspan: 1 };
  }
  return { rowspan: 0, colspan: 0 };
};

const rowKey = (row) => row._rowKey ?? row.id;

// 筛选
const filters = ref({
  keyword: '',
  stationId: null
});

// 分页
const pagination = ref({
  page: 1,
  pageSize: 8,
  total: 0
});

// 表单
const form = ref({
  taskName: '',
  taskContent: '',
  standardHours: 1,
  points: 10
});

// 表单验证规则
const rules = {
  taskName: [
    { required: true, message: '请输入工作名称', trigger: 'blur' },
    { max: 100, message: '工作名称不能超过100个字符', trigger: 'blur' }
  ],
  taskContent: [
    { required: true, message: '请输入具体工作内容', trigger: 'blur' }
  ],
  standardHours: [
    { required: true, message: '请输入标准工时', trigger: 'change' }
  ],
  points: [
    { required: true, message: '请输入积分', trigger: 'change' }
  ]
};

// 权限判断：站长、部门经理、部门副经理
const canManage = computed(() => {
  return ['admin', 'station_manager', 'department_manager', 'deputy_manager'].includes(userStore.roleCode);
});

// 加载任务库列表
const loadTaskLibrary = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      stationId: filters.value.stationId || undefined,
      keyword: filters.value.keyword || undefined
    };
    const res = await request.get('/temporary-task-library', { params });
    taskList.value = (res.list || []).map(item => ({
      id: item.id,
      taskName: item.task_name,
      taskContent: item.task_content,
      standardHours: item.standard_hours,
      points: item.points,
      stationId: item.station_id,
      station: item.station,
      createdBy: item.created_by,
      createdByName: item.created_by_name || item.creator?.real_name
    }));
    pagination.value.total = res.total || 0;
    selectedRows.value = [];
    tableRef.value?.clearSelection();
  } catch (e) {
    
    ElMessage.error('加载任务库失败');
  } finally {
    loading.value = false;
  }
};

const handleSelectionChange = (rows) => {
  selectedRows.value = rows || [];
};

const batchDelete = async () => {
  if (selectedRows.value.length === 0) return;
  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${selectedRows.value.length} 条任务吗？`,
      '批量删除',
      { type: 'warning' }
    );
  } catch (e) {
    return;
  }

  const ids = selectedRows.value.map(row => row.id).filter(Boolean);
  if (ids.length === 0) return;

  try {
    const results = await Promise.allSettled(
      ids.map(id => request.delete(`/temporary-task-library/${id}`))
    );
    const successCount = results.filter(item => item.status === 'fulfilled').length;
    const failedCount = results.length - successCount;
    if (successCount > 0) {
      ElMessage.success(`已删除 ${successCount} 条任务`);
    }
    if (failedCount > 0) {
      ElMessage.error(`删除失败 ${failedCount} 条任务`);
    }
    loadTaskLibrary();
  } catch (e) {
    ElMessage.error(e.message || '批量删除失败');
  }
};

const loadStations = async () => {
  try {
    const res = await request.get('/stations/all');
    const list = Array.isArray(res) ? res : (res?.list || []);
    stationOptions.value = list
      .map(station => ({
        id: station.id,
        name: station.station_name || station.stationName || station.name || ''
      }))
      .filter(station => station.name);
  } catch (e) {
    stationOptions.value = [];
  }
};

const resetFilters = () => {
  filters.value.keyword = '';
  filters.value.stationId = null;
};

// 显示对话框
const showDialog = (item = null) => {
  if (item) {
    isEdit.value = true;
    currentId.value = item.id;
    form.value = {
      taskName: item.taskName,
      taskContent: item.taskContent,
      standardHours: parseFloat(item.standardHours) || 1,
      points: item.points || 10
    };
  } else {
    isEdit.value = false;
    currentId.value = null;
    form.value = {
      taskName: '',
      taskContent: '',
      standardHours: 1,
      points: 10
    };
  }
  dialogVisible.value = true;
};

// 保存任务
const saveTask = async () => {
  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  saving.value = true;
  try {
    const data = {
      taskName: form.value.taskName,
      taskContent: form.value.taskContent,
      standardHours: form.value.standardHours,
      points: form.value.points,
      stationId: userStore.currentStationId
    };

    if (isEdit.value) {
      await request.put(`/temporary-task-library/${currentId.value}`, data);
      ElMessage.success('更新成功');
    } else {
      await request.post('/temporary-task-library', data);
      ElMessage.success('创建成功');
    }

    dialogVisible.value = false;
    loadTaskLibrary();
  } catch (e) {
    
    ElMessage.error(e.message || '保存失败');
  } finally {
    saving.value = false;
  }
};

// 删除任务
const deleteTask = async (item) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除任务"${item.taskName}"吗？`,
      '删除确认',
      { type: 'warning' }
    );

    await request.delete(`/temporary-task-library/${item.id}`);
    ElMessage.success('删除成功');
    loadTaskLibrary();
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

// 下载模板
const downloadTemplate = async () => {
  try {
    const XLSX = await import('xlsx');

    // 参考卫生区域划分模块的模板格式
    const templateData = [
      { '场站': '示例场站', '工作名称': '场地清扫', '具体工作内容': '清扫厂区道路及公共区域', '标准工时': 2, '积分': 10 },
      { '场站': '示例场站', '工作名称': '场地清扫', '具体工作内容': '清理绿化带落叶', '标准工时': 1, '积分': 5 },
      { '场站': '示例场站', '工作名称': '设备维修', '具体工作内容': '更换破损零部件', '标准工时': 4, '积分': 20 },
      { '场站': '示例场站', '工作名称': '设备维修', '具体工作内容': '设备调试测试', '标准工时': 2, '积分': 10 }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);

    // 设置列宽
    ws['!cols'] = [
      { wch: 15 }, // 场站
      { wch: 18 }, // 工作名称
      { wch: 35 }, // 具体工作内容
      { wch: 12 }, // 标准工时
      { wch: 8 }   // 积分
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '临时工作任务库');
    XLSX.writeFile(wb, '临时工作任务库导入模板.xlsx');
    ElMessage.success('模板下载成功');
  } catch (error) {
    ElMessage.error('下载模板失败');
  }
};

// 触发导入
const triggerImport = () => {
  fileInputRef.value?.click();
};

// 处理导入
const handleImport = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const XLSX = await import('xlsx');

    const readFile = () => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });

    const arrayBuffer = await readFile();
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      ElMessage.warning('未找到有效数据，请检查文件格式');
      return;
    }

    // 解析数据
    const tasks = jsonData.map(row => ({
      taskName: String(row['工作名称'] || '').trim(),
      taskContent: String(row['具体工作内容'] || '').trim(),
      standardHours: parseFloat(row['标准工时']) || 1,
      points: parseInt(row['积分']) || 10,
      stationId: userStore.currentStationId
    })).filter(task => task.taskName && task.taskContent);

    if (tasks.length === 0) {
      ElMessage.warning('未找到有效数据，请检查文件格式');
      return;
    }

    // 批量创建
    let successCount = 0;
    for (const task of tasks) {
      try {
        await request.post('/temporary-task-library', task);
        successCount++;
      } catch (e) {
        console.error('创建任务失败', e);
      }
    }

    ElMessage.success(`导入完成: 成功${successCount}条`);
    loadTaskLibrary();
  } catch (err) {
    console.error('导入失败', err);
    ElMessage.error(err.message || '导入失败，请检查文件格式');
  } finally {
    if (fileInputRef.value) {
      fileInputRef.value.value = '';
    }
  }
};

onMounted(() => {
  loadStations();
  loadTaskLibrary();
});

watch(
  () => [filters.value.keyword, filters.value.stationId],
  () => {
    pagination.value.page = 1;
    loadTaskLibrary();
  }
);
</script>

<style lang="scss" scoped>
.temp-task-library-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    background: #fff;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

    h2 {
      margin: 0;
      font-size: 20px;
      color: #303133;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }

  .table-wrapper {
    background: #fff;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    min-height: 400px;
  }

  .empty-wrapper {
    padding: 60px 20px;
    text-align: center;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
    background: #fff;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }

  .form-hint {
    margin-left: 12px;
    font-size: 12px;
    color: #909399;
  }
}
</style>
