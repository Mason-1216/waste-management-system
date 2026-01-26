<template>
  <div class="safety-check-management">
    <div class="page-header">
      <h3>安全检查项目管理</h3>
      <div class="header-actions">
        <el-button @click="downloadTemplate">
          <el-icon><Download /></el-icon>
          下载模板
        </el-button>
        <BaseUpload
          ref="uploadRef"
          :action="importUrl"
          :headers="uploadHeaders"
          :on-success="handleImportSuccess"
          :on-error="handleImportError"
          :show-file-list="false"
          :before-upload="beforeUpload"
          accept=".xlsx,.xls"
        >
          <el-button type="success">
            <el-icon><Download /></el-icon>
            导入
          </el-button>
        </BaseUpload>
        <el-button type="primary" @click="addWorkType">
          <el-icon><Plus /></el-icon>
          新增工作性质
        </el-button>
      </div>
    </div>

    <!-- 工作性质列表（分组展示） -->
    <div class="work-type-list" v-loading="loading">
      <el-empty v-if="workTypes.length === 0" description="暂无工作性质，请添加" />

      <el-card
        v-for="workType in workTypes"
        :key="workType.id"
        class="work-type-card"
        :class="{ 'is-default': workType.is_default === 1 }"
      >
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <span class="work-type-name">{{ workType.work_type_name }}</span>
              <el-tag v-if="workType.is_default === 1" type="success" size="small">默认必选</el-tag>
              <el-tag :type="workType.status === 'active' ? '' : 'info'" size="small">
                {{ workType.status === 'active' ? '启用' : '禁用' }}
              </el-tag>
            </div>
            <div class="header-right">
              <el-button type="primary" link @click="addCheckItem(workType)">
                <el-icon><Plus /></el-icon>新增检查项
              </el-button>
              <el-button type="primary" link @click="editWorkType(workType)">编辑</el-button>
              <el-button type="danger" link @click="deleteWorkType(workType)">删除</el-button>
            </div>
          </div>
        </template>

        <!-- 检查项目列表 -->
        <div class="check-items-container">
          <el-empty v-if="!workType.checkItems || workType.checkItems.length === 0"
            description="暂无检查项目" :image-size="60" />

          <div class="check-items-table" v-else>
            <div class="table-header">
              <div class="col-order">序号</div>
              <div class="col-name">检查项目</div>
              <div class="col-standard">检查标准</div>
              <div class="col-status">状态</div>
              <div class="col-action">操作</div>
            </div>
            <div
              v-for="(item, index) in workType.checkItems"
              :key="item.id"
              class="table-row"
            >
              <div class="col-order">{{ index + 1 }}</div>
              <div class="col-name">
                <div class="item-name">
                  <el-tag v-if="item.parent_id" size="small" type="info">子项</el-tag>
                  <el-tag v-else-if="Number(item.enable_children) === 1" size="small" type="success">联动</el-tag>
                  <span>{{ item.item_name }}</span>
                </div>
                <div v-if="item.parent_id" class="item-meta">
                  父项：{{ getParentItemName(item, workType) }}
                </div>
                <div v-if="item.parent_id" class="item-meta">
                  触发：{{ formatTriggerValue(item.trigger_value) }}
                </div>
                <div v-else-if="Number(item.enable_children) === 1" class="item-meta">
                  子项联动：开启
                </div>
              </div>
              <div class="col-standard">{{ item.item_standard || '-' }}</div>
              <div class="col-status">
                <el-tag :type="item.status === 'active' ? 'success' : 'info'" size="small">
                  {{ item.status === 'active' ? '启用' : '禁用' }}
                </el-tag>
              </div>
              <div class="col-action">
                <el-button type="primary" link size="small" @click="editCheckItem(item, workType)">
                  编辑
                </el-button>
                <el-button type="danger" link size="small" @click="deleteCheckItem(item, workType)">
                  删除
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 工作性质对话框 -->
    <FormDialog
      v-model="workTypeDialogVisible"
      :title="workTypeForm.id ? '编辑工作性质' : '新增工作性质'"
      width="450px"
      :confirm-text="'确定'"
      :cancel-text="'取消'"
      :confirm-loading="saving"
      @confirm="saveWorkType"
    >
      <el-form
        :model="workTypeForm"
        :rules="workTypeRules"
        ref="workTypeFormRef"
        label-width="100px"
      >
        <el-form-item label="名称" prop="workTypeName">
          <el-input
            v-model="workTypeForm.workTypeName"
            placeholder="请输入工作性质名称"
          />
        </el-form-item>
        <el-form-item label="默认必选">
          <el-switch v-model="workTypeForm.isDefault" />
          <span style="margin-left: 10px; color: #909399; font-size: 12px;">
            默认必选的工作性质在自检时会自动勾选
          </span>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number
            v-model="workTypeForm.sortOrder"
            :min="0"
            :max="999"
          />
        </el-form-item>
        <el-form-item label="积分">
          <el-input-number
            v-model="workTypeForm.points"
            :min="0"
            :max="999"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="workTypeForm.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </FormDialog>

    <!-- 检查项目对话框 -->
    <FormDialog
      v-model="checkItemDialogVisible"
      :title="checkItemForm.id ? '编辑检查项目' : '新增检查项目'"
      width="550px"
      :confirm-text="'确定'"
      :cancel-text="'取消'"
      :confirm-loading="saving"
      @confirm="saveCheckItem"
    >
      <el-form
        :model="checkItemForm"
        :rules="checkItemRules"
        ref="checkItemFormRef"
        label-width="100px"
      >
        <el-form-item label="所属工作性质">
          <el-input :value="currentWorkType?.work_type_name" disabled />
        </el-form-item>
        <el-form-item label="检查项目" prop="itemName">
          <el-input
            v-model="checkItemForm.itemName"
            placeholder="请输入检查项目名称"
          />
        </el-form-item>
        <el-form-item label="检查标准">
          <el-input
            v-model="checkItemForm.itemStandard"
            type="textarea"
            :rows="3"
            placeholder="请输入检查标准"
          />
        </el-form-item>
        <el-form-item label="父级检查项">
          <el-select
            v-model="checkItemForm.parentId"
            clearable
            placeholder="无"
          >
            <el-option
              v-for="item in availableParentItems"
              :key="item.id"
              :label="item.item_name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="子项触发值" v-if="checkItemForm.parentId">
          <el-radio-group v-model="checkItemForm.triggerValue">
            <el-radio :value="1">是</el-radio>
            <el-radio :value="0">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="启用子项联动" v-else>
          <el-switch v-model="checkItemForm.enableChildren" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number
            v-model="checkItemForm.sortOrder"
            :min="0"
            :max="999"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="checkItemForm.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </FormDialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Download } from '@element-plus/icons-vue';
import { useUserStore } from '@/store/modules/user';
import { useUpload } from '@/composables/useUpload';
import request from '@/api/request';
import FormDialog from '@/components/system/FormDialog.vue';

const userStore = useUserStore();

const { apiBaseUrl, uploadHeaders } = useUpload();

// 导入配置
const importUrl = computed(() => `${apiBaseUrl}/safety-check-items/import`);
const uploadRef = ref();

// 工作性质列表（包含检查项目）
const workTypes = ref([]);
const loading = ref(false);
const saving = ref(false);

// 工作性质对话框
const workTypeDialogVisible = ref(false);
const workTypeFormRef = ref();
const workTypeForm = reactive({
  id: null,
  workTypeName: '',
  isDefault: false,
  sortOrder: 0,
  points: 0,
  status: 'active'
});

const workTypeRules = {
  workTypeName: [
    { required: true, message: '请输入工作性质名称', trigger: 'blur' }
  ]
};

// 检查项目对话框
const checkItemDialogVisible = ref(false);
const checkItemFormRef = ref();
const currentWorkType = ref(null);
const checkItemForm = reactive({
  id: null,
  workTypeId: null,
  itemName: '',
  itemStandard: '',
  parentId: null,
  enableChildren: false,
  triggerValue: 1,
  sortOrder: 0,
  status: 'active'
});

const availableParentItems = computed(() => {
  const items = currentWorkType.value?.checkItems || [];
  return items.filter(item =>
    (item.parent_id === null || item.parent_id === undefined) &&
    item.id !== checkItemForm.id
  );
});

const checkItemRules = {
  itemName: [
    { required: true, message: '请输入检查项目名称', trigger: 'blur' }
  ]
};

const buildCheckItemList = (items = []) => {
  const parents = items.filter(item => item.parent_id === null || item.parent_id === undefined);
  const parentIds = new Set(parents.map(item => item.id));
  const childrenByParent = new Map();

  items.forEach(item => {
    if (item.parent_id !== null && item.parent_id !== undefined) {
      if (!childrenByParent.has(item.parent_id)) {
        childrenByParent.set(item.parent_id, []);
      }
      childrenByParent.get(item.parent_id).push(item);
    }
  });

  const sortByOrder = (a, b) => {
    const aOrder = a.sort_order !== undefined && a.sort_order !== null ? a.sort_order : 0;
    const bOrder = b.sort_order !== undefined && b.sort_order !== null ? b.sort_order : 0;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return (a.id || 0) - (b.id || 0);
  };

  parents.sort(sortByOrder);

  const ordered = [];
  parents.forEach(parent => {
    ordered.push(parent);
    const children = childrenByParent.get(parent.id) || [];
    children.sort(sortByOrder);
    ordered.push(...children);
  });

  const orphanChildren = items.filter(item =>
    item.parent_id !== null &&
    item.parent_id !== undefined &&
    !parentIds.has(item.parent_id)
  );
  if (orphanChildren.length > 0) {
    orphanChildren.sort(sortByOrder);
    ordered.push(...orphanChildren);
  }

  return ordered;
};

const getParentItemName = (item, workType) => {
  if (!item?.parent_id || !workType?.checkItems) return '-';
  const parent = workType.checkItems.find(entry => entry.id === item.parent_id);
  return parent ? parent.item_name : '-';
};

const formatTriggerValue = (value) => (Number(value) === 0 ? '否' : '是');

// 加载工作性质列表（包含检查项目）
const loadWorkTypes = async () => {
  loading.value = true;
  try {
    const res = await request.get('/safety-work-types');
    const types = res || [];

    // 为每个工作性质加载检查项目
    for (const type of types) {
      try {
        const items = await request.get('/safety-check-items', {
          params: { workTypeId: type.id }
        });
        type.checkItems = buildCheckItemList(items || []);
      } catch {
        type.checkItems = [];
      }
    }

    workTypes.value = types;
  } catch (error) {
    ElMessage.error('获取工作性质列表失败');
  } finally {
    loading.value = false;
  }
};

// 新增工作性质
const addWorkType = () => {
  Object.assign(workTypeForm, {
    id: null,
    workTypeName: '',
    isDefault: false,
    sortOrder: workTypes.value.length,
    points: 0,
    status: 'active'
  });
  workTypeDialogVisible.value = true;
};

// 编辑工作性质
const editWorkType = (row) => {
  Object.assign(workTypeForm, {
    id: row.id,
    workTypeName: row.work_type_name,
    isDefault: row.is_default === 1,
    sortOrder: row.sort_order,
    points: row.points || 0,
    status: row.status
  });
  workTypeDialogVisible.value = true;
};

// 保存工作性质
const saveWorkType = async () => {
  try {
    await workTypeFormRef.value.validate();
    saving.value = true;

    const data = {
      workTypeName: workTypeForm.workTypeName,
      isDefault: workTypeForm.isDefault,
      sortOrder: workTypeForm.sortOrder,
      points: workTypeForm.points,
      status: workTypeForm.status
    };

    if (workTypeForm.id) {
      await request.put(`/safety-work-types/${workTypeForm.id}`, data);
      ElMessage.success('更新成功');
    } else {
      await request.post('/safety-work-types', data);
      ElMessage.success('创建成功');
    }

    workTypeDialogVisible.value = false;
    loadWorkTypes();
  } catch (error) {
    if (error.message) {
      ElMessage.error(error.message);
    }
  } finally {
    saving.value = false;
  }
};

// 删除工作性质
const deleteWorkType = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除工作性质"${row.work_type_name}"吗？该工作性质下的所有检查项目也将被删除。`,
      '提示',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    );

    await request.delete(`/safety-work-types/${row.id}`);
    ElMessage.success('删除成功');
    loadWorkTypes();
  } catch (error) {
    if (error !== 'cancel' && error.message) {
      ElMessage.error(error.message);
    }
  }
};

// 新增检查项目
const addCheckItem = (workType) => {
  currentWorkType.value = workType;
  Object.assign(checkItemForm, {
    id: null,
    workTypeId: workType.id,
    itemName: '',
    itemStandard: '',
    parentId: null,
    enableChildren: false,
    triggerValue: 1,
    sortOrder: workType.checkItems?.length || 0,
    status: 'active'
  });
  checkItemDialogVisible.value = true;
};

// 编辑检查项目
const editCheckItem = (item, workType) => {
  currentWorkType.value = workType;
  Object.assign(checkItemForm, {
    id: item.id,
    workTypeId: item.work_type_id,
    itemName: item.item_name,
    itemStandard: item.item_standard || '',
    parentId: item.parent_id ?? null,
    enableChildren: Number(item.enable_children) === 1,
    triggerValue: item.trigger_value ?? 1,
    sortOrder: item.sort_order,
    status: item.status
  });
  checkItemDialogVisible.value = true;
};

// 保存检查项目
const saveCheckItem = async () => {
  try {
    await checkItemFormRef.value.validate();
    saving.value = true;

    const data = {
      workTypeId: checkItemForm.workTypeId,
      itemName: checkItemForm.itemName,
      itemStandard: checkItemForm.itemStandard,
      parentId: checkItemForm.parentId,
      enableChildren: checkItemForm.enableChildren,
      triggerValue: checkItemForm.triggerValue,
      sortOrder: checkItemForm.sortOrder,
      status: checkItemForm.status
    };

    if (checkItemForm.id) {
      await request.put(`/safety-check-items/${checkItemForm.id}`, data);
      ElMessage.success('更新成功');
    } else {
      await request.post('/safety-check-items', data);
      ElMessage.success('创建成功');
    }

    checkItemDialogVisible.value = false;
    loadWorkTypes();
  } catch (error) {
    if (error.message) {
      ElMessage.error(error.message);
    }
  } finally {
    saving.value = false;
  }
};

// 删除检查项目
const deleteCheckItem = async (item, workType) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除检查项目"${item.item_name}"吗？`,
      '提示',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    );

    await request.delete(`/safety-check-items/${item.id}`);
    ElMessage.success('删除成功');
    loadWorkTypes();
  } catch (error) {
    if (error !== 'cancel' && error.message) {
      ElMessage.error(error.message);
    }
  }
};

// 下载模板
const downloadTemplate = async () => {
  try {
    const response = await fetch(`${apiBaseUrl}/safety-check-items/template`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${userStore.token}`
      }
    });

    if (!response.ok) {
      throw new Error('下载失败');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '安全检查项目导入模板.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    
    ElMessage.error('下载模板失败');
  }
};

// 上传前检查
const beforeUpload = (file) => {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                  file.type === 'application/vnd.ms-excel' ||
                  file.name.endsWith('.xlsx') ||
                  file.name.endsWith('.xls');
  if (!isExcel) {
    ElMessage.error('只能上传 Excel 文件！');
    return false;
  }
  return true;
};

// 导入成功
const handleImportSuccess = (response) => {
  if (response.code === 200) {
    ElMessage.success(response.message);
    loadWorkTypes();
  } else {
    ElMessage.error(response.message || '导入失败');
  }
};

// 导入失败
const handleImportError = (error) => {
  
  ElMessage.error('导入失败，请检查文件格式');
};

onMounted(() => {
  loadWorkTypes();
});
</script>

<style lang="scss" scoped>
.safety-check-management {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h3 {
      margin: 0;
      font-size: 18px;
    }

    .header-actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }
  }

  .work-type-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .work-type-card {
    &.is-default {
      border-color: #67c23a;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-left {
        display: flex;
        align-items: center;
        gap: 8px;

        .work-type-name {
          font-size: 16px;
          font-weight: 500;
        }
      }

      .header-right {
        display: flex;
        gap: 4px;
      }
    }
  }

  .check-items-container {
    min-height: 60px;
  }

  .check-items-table {
    .table-header {
      display: flex;
      background: #f5f7fa;
      padding: 10px 0;
      font-weight: 500;
      font-size: 13px;
      color: #606266;
      border-bottom: 1px solid #ebeef5;
    }

    .table-row {
      display: flex;
      padding: 12px 0;
      border-bottom: 1px solid #ebeef5;
      align-items: center;

      &:hover {
        background: #f5f7fa;
      }

      &:last-child {
        border-bottom: none;
      }
    }

    .col-order {
      width: 60px;
      text-align: center;
      flex-shrink: 0;
    }

    .col-name {
      flex: 1;
      min-width: 150px;
      padding: 0 10px;

      .item-name {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .item-meta {
        margin-top: 4px;
        font-size: 12px;
        color: #909399;
      }
    }

    .col-standard {
      flex: 2;
      min-width: 200px;
      padding: 0 10px;
      color: #606266;
    }

    .col-status {
      width: 80px;
      text-align: center;
      flex-shrink: 0;
    }

    .col-action {
      width: 120px;
      text-align: center;
      flex-shrink: 0;
    }
  }
}
</style>
