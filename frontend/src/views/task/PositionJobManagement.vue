<template>
  <div class="position-job-management">
    <div class="page-header">
      <h2>岗位工作任务汇总表</h2>
      <div class="header-actions">
        <el-button type="primary" @click="addPositionJob">
          <el-icon><Plus /></el-icon>
          新增工作项目
        </el-button>
        <!-- 导入和下载模板按钮 -->
        <BaseUpload
          :action="`${apiBaseUrl}/position-jobs/import`"
          :headers="uploadHeaders"
          :on-success="handleImportSuccess"
          :on-error="handleImportError"
          :show-file-list="false"
          accept=".xlsx,.xls"
          :before-upload="beforeUpload"
        >
          <el-button type="success">
            <el-icon><Download /></el-icon>
            批量导入
          </el-button>
        </BaseUpload>
        <el-button @click="downloadTemplate" type="info">
          <el-icon><Download /></el-icon>
          下载模板
        </el-button>
      </div>
    </div>

    <!-- 搜索表单 -->
    <el-card class="filter-card">
      <FilterBar>
        <div class="filter-item">
          <span class="filter-label">岗位名称</span>
          <FilterAutocomplete
            v-model="searchForm.positionName"
            :fetch-suggestions="fetchPositionNameSuggestions"
            trigger-on-focus
            placeholder="请输入岗位名称"
            clearable
            style="width: 200px;"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">工作项目</span>
          <FilterAutocomplete
            v-model="searchForm.jobName"
            :fetch-suggestions="fetchJobNameSuggestions"
            trigger-on-focus
            placeholder="请输入工作项目"
            clearable
            style="width: 200px;"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">场站</span>
          <FilterSelect 
            v-model="searchForm.stationId" 
            placeholder="请选择场站"
            clearable
            style="width: 200px;"
          >
            <el-option
              v-for="station in formStationOptions"
              :key="station.id"
              :label="station.stationName"
              :value="station.id"
            />
          </FilterSelect>
        </div>
      </FilterBar>
    </el-card>

    <!-- 数据表格 -->
    <TableWrapper>
      <el-table
        :data="flattenedTableData"
        v-loading="loading"
        border
        style="width: 100%"
        :span-method="spanMethod"
      >
        <el-table-column prop="stationName" label="场站" width="150">
          <template #default="{ row }">
            {{ row.stationName || '通用' }}
          </template>
        </el-table-column>
        <el-table-column prop="position_name" label="岗位名称" width="150" />
        <el-table-column prop="job_name" label="工作项目" min-width="200" />
        <el-table-column prop="standard_hours" label="标准工时" width="100">
          <template #default="{ row }">
            {{ row.standard_hours ? `${row.standard_hours}小时` : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="is_active" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'">
              {{ row.is_active ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="editPositionJob(row)"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="deletePositionJob(row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </TableWrapper>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[5, 10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 编辑对话框 -->
    <FormDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :width="dialogTitle.includes('新增') ? '800px' : '500px'"
      :confirm-text="'确定'"
      :cancel-text="'取消'"
      @confirm="savePositionJob"
    >
      <!-- 单个编辑表单 -->
      <el-form
        v-if="!dialogTitle.includes('新增')"
        :model="positionJobForm"
        :rules="positionJobRules"
        ref="formRef"
        label-width="100px"
      >
        <el-form-item label="岗位名称" prop="positionName">
          <el-input
            v-model="positionJobForm.positionName"
            placeholder="请输入岗位名称"
          />
        </el-form-item>
        <el-form-item label="工作项目" prop="jobName">
          <el-input
            v-model="positionJobForm.jobName"
            placeholder="请输入工作项目"
          />
        </el-form-item>
        <el-form-item label="标准工时">
          <el-input-number
            v-model="positionJobForm.standardHours"
            :min="0"
            :step="0.5"
            placeholder="小时"
            style="width: 100px;"
          />
          <span style="margin-left: 8px;">小时</span>
        </el-form-item>
        <el-form-item label="场站">
          <el-select
            v-model="positionJobForm.stationId"
            placeholder="请选择场站"
            clearable
            style="width: 200px;"
          >
            <el-option
              v-for="station in stations"
              :key="station.id"
              :label="station.stationName"
              :value="station.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="positionJobForm.isActive"
            :active-value="1"
            :inactive-value="0"
          />
        </el-form-item>
      </el-form>

      <!-- 批量新增表单 -->
      <div v-else>
        <el-form
          :model="batchForm"
          ref="batchFormRef"
          label-width="100px"
        >
          <el-form-item label="场站" required>
            <el-select
              v-model="batchForm.stationId"
              placeholder="请选择场站"
              clearable
              style="width: 300px;"
            >
              <el-option
                v-for="station in formStationOptions"
                :key="station.id"
                :label="station.stationName"
                :value="station.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="岗位名称" required>
            <el-input
              v-model="batchForm.positionName"
              placeholder="请输入岗位名称"
              style="width: 300px;"
            />
          </el-form-item>
        </el-form>

        <el-divider content-position="left">工作项目列表</el-divider>

        <el-table
          :data="batchForm.jobs"
          border
          style="width: 100%; margin-bottom: 20px;"
        >
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column label="工作项目名称" min-width="200">
            <template #default="{ row }">
              <el-input
                v-model="row.jobName"
                placeholder="请输入工作项目名称"
              />
            </template>
          </el-table-column>
          <el-table-column label="标准工时" width="150">
            <template #default="{ row }">
              <el-input-number
                v-model="row.standardHours"
                :min="0"
                :step="0.5"
                placeholder="小时"
                style="width: 100%;"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80">
            <template #default="{ $index }">
              <el-button
                type="danger"
                size="small"
                @click="removeJob($index)"
                :disabled="batchForm.jobs.length === 1"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-button
          type="primary"
          @click="addJob"
          style="width: 100%;"
        >
          <el-icon><Plus /></el-icon>
          添加工作项目
        </el-button>
      </div>

    </FormDialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Upload, Download, Plus } from '@element-plus/icons-vue';

import FilterBar from '@/components/common/FilterBar.vue';
import { addTemplateInstructionSheet, applyTemplateHeaderStyle } from '@/utils/excelTemplate';
import { positionJobApi } from '@/api/positionJob';
import { useUserStore } from '@/store/modules/user';
import FormDialog from '@/components/system/FormDialog.vue';
import { createListSuggestionFetcher } from '@/utils/filterAutocomplete';

const userStore = useUserStore();

// API基础URL
const apiBaseUrl = computed(() => import.meta.env.VITE_API_BASE_URL || '/api');

// 上传文件的请求头
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${userStore.token}`
}));

// 响应式数据
const loading = ref(false);
const tableData = ref([]);
const suggestionList = ref([]);
const stations = ref([]);

const fetchPositionNameSuggestions = createListSuggestionFetcher(
  () => suggestionList.value,
  (row) => row.position_name
);

const fetchJobNameSuggestions = createListSuggestionFetcher(
  () => suggestionList.value,
  (row) => row.job_name
);

// 扁平化表格数据，按场站+岗位名称分组
const flattenedTableData = computed(() => {
  const data = tableData.value || [];
  if (data.length === 0) return [];

  // 按场站+岗位名称分组
  const groupMap = new Map();
  data.forEach(item => {
    const stationName = item.station?.station_name || '通用';
    const positionName = item.position_name || '';
    const groupKey = `${stationName}||${positionName}`;

    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, {
        stationName,
        positionName,
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
        position_name: group.positionName,
        _rowspan: index === 0 ? rowCount : 0
      });
    });
  });

  return rows;
});

// 单元格合并方法：场站、岗位名称、状态、操作列合并
const spanMethod = ({ row, columnIndex }) => {
  // 列索引：0-场站 1-岗位名称 2-工作项目 3-标准工时 4-状态 5-操作
  // 场站和岗位名称需要合并
  const mergeColumns = [0, 1];
  if (!mergeColumns.includes(columnIndex)) return;
  if (row._rowspan > 0) {
    return { rowspan: row._rowspan, colspan: 1 };
  }
  return { rowspan: 0, colspan: 0 };
};
const isActiveStatus = (status) => status === undefined || status === null || status === '' || status === 'active' || status === 1 || status === '1' || status === true;
const activeStationList = computed(() => stations.value.filter(station => isActiveStatus(station.status)));
const formStationOptions = computed(() => {
  const selectedIds = new Set([
    positionJobForm.stationId,
    batchForm.stationId
  ].filter(Boolean));
  if (selectedIds.size === 0) return activeStationList.value;
  const inactiveSelected = stations.value.filter(
    station => selectedIds.has(station.id) && !isActiveStatus(station.status)
  );
  const active = activeStationList.value.filter(station => !selectedIds.has(station.id));
  return [...inactiveSelected, ...active];
});

// 搜索表单
const searchForm = reactive({
  positionName: '',
  jobName: '',
  stationId: null
});

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 5,
  total: 0
});

// 对话框控制
const dialogVisible = ref(false);
const dialogTitle = ref('');
const formRef = ref();
const batchFormRef = ref();

// 表单数据
const positionJobForm = reactive({
  id: null,
  positionName: '',
  originalPositionName: '',
  jobName: '',
  standardHours: null,
  stationId: null,
  isActive: 1
});

// 批量新增表单
const batchForm = reactive({
  stationId: null,
  positionName: '',
  jobs: [
    { jobName: '', standardHours: null }
  ]
});

// 表单验证规则
const positionJobRules = {
  positionName: [
    { required: true, message: '请输入岗位名称', trigger: 'blur' }
  ],
  jobName: [
    { required: true, message: '请输入工作项目', trigger: 'blur' }
  ]
};

// 获取数据列表
const getList = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      positionName: searchForm.positionName || undefined,
      jobName: searchForm.jobName || undefined,
      stationId: searchForm.stationId || undefined
    };
    
    const res = await positionJobApi.getPositionJobs(params);
    tableData.value = res.list || [];
    pagination.total = res.total || 0;
    loadSuggestionList(params);
  } catch (error) {
    
  } finally {
    loading.value = false;
  }
};

const loadSuggestionList = async (baseParams) => {
  try {
    const params = {
      ...baseParams,
      page: 1,
      pageSize: 5000
    };
    const res = await positionJobApi.getPositionJobs(params);
    suggestionList.value = Array.isArray(res?.list) ? res.list : [];
  } catch (error) {
    suggestionList.value = [];
  }
};

// 获取场站列表
const getStations = async () => {
  try {
    const res = await fetch(`${apiBaseUrl.value}/stations/all`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userStore.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.code === 200) {
        stations.value = data.data || [];
      }
    }
  } catch (error) {
    
  }
};

// 搜索
const search = () => {
  pagination.currentPage = 1;
  getList();
};

// 重置搜索
const resetSearch = () => {
  searchForm.positionName = '';
  searchForm.jobName = '';
  searchForm.stationId = null;
  pagination.currentPage = 1;
  getList();
};

// 分页处理
const handleSizeChange = (size) => {
  pagination.pageSize = size;
  getList();
};

const handleCurrentChange = (page) => {
  pagination.currentPage = page;
  getList();
};

// 添加新的工作项目
const addNewJob = () => {
  // 这里可以弹出一个对话框让用户输入新工作项目名称
  // 为简化当前实现，我们直接在表单中编辑
};

// 新增岗位工作项目
const addPositionJob = () => {
  // 重置批量表单
  Object.assign(batchForm, {
    stationId: null,
    positionName: '',
    jobs: [{ jobName: '', standardHours: null }]
  });
  positionJobForm.originalPositionName = '';
  dialogTitle.value = '新增岗位工作项目';
  dialogVisible.value = true;
};

// 添加工作项目到列表
const addJob = () => {
  batchForm.jobs.push({
    jobName: '',
    standardHours: null
  });
};

// 删除工作项目
const removeJob = (index) => {
  if (batchForm.jobs.length > 1) {
    batchForm.jobs.splice(index, 1);
  }
};

// 编辑岗位工作项目
const editPositionJob = (row) => {
  Object.assign(positionJobForm, {
    id: row.id,
    positionName: row.position_name,
    originalPositionName: row.position_name ?? '',
    jobName: row.job_name,
    standardHours: row.standard_hours ? parseFloat(row.standard_hours) : null,
    stationId: row.station_id,
    isActive: row.is_active
  });
  dialogTitle.value = '编辑岗位工作项目';
  dialogVisible.value = true;
};

// 保存岗位工作项目
const savePositionJob = async () => {
  try {
    // 判断是批量新增还是单个编辑
    if (dialogTitle.value.includes('新增')) {
      // 批量新增逻辑
      if (!batchForm.positionName) {
        ElMessage.error('请输入岗位名称');
        return;
      }

      // 过滤掉空的工作项目
      const validJobs = batchForm.jobs.filter(job => job.jobName && job.jobName.trim());

      if (validJobs.length === 0) {
        ElMessage.error('请至少添加一个工作项目');
        return;
      }

      // 批量创建
      const requests = validJobs.map(job => {
        const data = {
          positionName: batchForm.positionName,
          jobName: job.jobName,
          standardHours: job.standardHours,
          stationId: batchForm.stationId,
          isActive: 1
        };
        return positionJobApi.createPositionJob(data);
      });

      await Promise.all(requests);
      ElMessage.success(`成功添加${validJobs.length}个工作项目`);
      dialogVisible.value = false;
      getList();
    } else {
      // 单个编辑逻辑
      await formRef.value.validate();

      const renamePosition = positionJobForm.originalPositionName
        && positionJobForm.positionName !== positionJobForm.originalPositionName;
      if (renamePosition) {
        try {
          await ElMessageBox.confirm('修改岗位名称将同步该岗位下所有工作项目，并更新排班中的岗位名称，是否继续？', '确认修改', {
            type: 'warning',
            confirmButtonText: '确认修改',
            cancelButtonText: '取消'
          });
        } catch (error) {
          return;
        }
      }

      const data = {
        positionName: positionJobForm.positionName,
        jobName: positionJobForm.jobName,
        standardHours: positionJobForm.standardHours,
        stationId: positionJobForm.stationId,
        isActive: positionJobForm.isActive,
        renamePosition
      };

      if (positionJobForm.id) {
        // 更新
        await positionJobApi.updatePositionJob(positionJobForm.id, data);
        ElMessage.success('更新成功');
      } else {
        // 单个新增
        await positionJobApi.createPositionJob(data);
        ElMessage.success('新增成功');
      }

      dialogVisible.value = false;
      getList();
    }
  } catch (error) {
    
    if (error.message) {
      ElMessage.error(error.message);
    } else {
      ElMessage.error('保存失败');
    }
  }
};

// 删除岗位工作项目
const deletePositionJob = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这个岗位工作项目吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    await positionJobApi.deletePositionJob(id);
    ElMessage.success('删除成功');
    getList();
  } catch (error) {
    if (error !== 'cancel') {
      
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
      { '场站': '示例场站', '岗位名称': '司磅员', '工作项目': '过磅登记', '标准工时': 2 },
      { '场站': '示例场站', '岗位名称': '司磅员', '工作项目': '数据核对', '标准工时': 1 },
      { '场站': '示例场站', '岗位名称': '司磅员', '工作项目': '设备检查', '标准工时': 0.5 },
      { '场站': '示例场站', '岗位名称': '操作工', '工作项目': '设备操作', '标准工时': 4 },
      { '场站': '示例场站', '岗位名称': '操作工', '工作项目': '日常巡检', '标准工时': 2 }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);

    applyTemplateHeaderStyle(XLSX, ws, 1);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '岗位工作项目');
    addTemplateInstructionSheet(XLSX, wb, [
      ['场站', '选填，场站名称，留空表示通用。'],
      ['岗位名称', '必填，岗位名称。'],
      ['工作项目', '必填，岗位工作项目名称。'],
      ['标准工时', '选填，数字，单位 h/d。']
    ]);
    XLSX.writeFile(wb, '岗位工作项目导入模板.xlsx');
    ElMessage.success('模板下载成功');
  } catch (error) {
    ElMessage.error('下载模板失败');
  }
};

// 上传前检查
const beforeUpload = (file) => {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                  file.type === 'application/vnd.ms-excel';
  const isLt5M = file.size / 1024 / 1024 < 5;

  if (!isExcel) {
    ElMessage.error('只能上传Excel文件!');
    return false;
  }
  if (!isLt5M) {
    ElMessage.error('文件大小不能超过5MB!');
    return false;
  }

  return true;
};

// 上传成功回调
const handleImportSuccess = (response) => {
  if (response && response.code === 200) {
    ElMessage.success(response.message || '导入成功');
    getList();
  } else {
    ElMessage.error(response.message || '导入失败');
  }
};

// 上传失败回调
const handleImportError = (error) => {
  
  try {
    const errorData = JSON.parse(error.message);
    ElMessage.error(errorData.message || '导入失败');
  } catch {
    ElMessage.error('导入失败');
  }
};

onMounted(() => {
  getList();
  getStations();
});
</script>

<style lang="scss" scoped>
.position-job-management {
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
      gap: 10px;
    }
  }

  .search-card {
    margin-bottom: 20px;
  }

}
</style>
