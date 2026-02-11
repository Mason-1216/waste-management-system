<template>
  <div class="safety-check-management">
    <div class="page-header">
      <h3>安全检查项目管理</h3>
      <div class="header-actions">
        <el-button type="info" @click="downloadTemplate">
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
            批量导入
          </el-button>
        </BaseUpload>
        <el-button type="primary" @click="addWorkType">
          <el-icon><Plus /></el-icon>
          新增工作性质
        </el-button>
        <el-button type="primary" :loading="exporting" @click="exportAll">
          <el-icon><Upload /></el-icon>
          批量导出
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
              <div class="work-type-title" @click="toggleWorkType(workType)">
                <el-icon class="expand-icon" :class="{ expanded: isWorkTypeExpanded(workType) }"><ArrowRight /></el-icon>
                <span class="work-type-name">{{ workType.work_type_name }}（{{ formatPoints(workType.points) }}分）</span>
              </div>
              <el-tag v-if="workType.is_default === 1" type="success" size="small">默认必选</el-tag>
              <el-tag :type="workType.status === 'active' ? '' : 'info'" size="small">
                {{ workType.status === 'active' ? '启用' : '禁用' }}
              </el-tag>
            </div>
            <div class="header-right">
              <el-button type="primary" link @click="editWorkType(workType)">编辑</el-button>
              <el-button type="danger" link @click="deleteWorkType(workType)">删除</el-button>
            </div>
          </div>
        </template>

        <!-- 检查项目列表 -->
        <div class="check-items-container" v-if="isWorkTypeExpanded(workType)">
          <el-empty v-if="!workType.checkItems || workType.checkItems.length === 0"
            description="暂无检查项目" :image-size="60" />

          <div class="check-items-table" v-else>
            <div class="table-header">
              <div class="col-order">序号</div>
              <div class="col-type">类型</div>
              <div class="col-name">检查项目</div>
              <div class="col-standard">检查标准</div>
              <div class="col-parent">父项</div>
              <div class="col-trigger">触发值</div>
              <div class="col-status">状态</div>
            </div>
            <div
              v-for="(item, index) in workType.checkItems"
              :key="item.id"
              class="table-row"
            >
              <div class="col-order">{{ index + 1 }}</div>
              <div class="col-type">
                <el-tag v-if="item.parent_id" size="small" type="info">子项</el-tag>
                <el-tag v-else size="small" :type="Number(item.enable_children) === 1 ? 'success' : 'info'">
                  {{ Number(item.enable_children) === 1 ? '父项(联动)' : '父项' }}
                </el-tag>
              </div>
              <div class="col-name">{{ item.item_name }}</div>
              <div class="col-standard">{{ item.item_standard ?? '-' }}</div>
              <div class="col-parent">{{ item.parent_id ? getParentItemName(item, workType) : '-' }}</div>
              <div class="col-trigger">{{ item.parent_id ? formatTriggerValue(item.trigger_value) : '-' }}</div>
              <div class="col-status">
                <el-tag :type="item.status === 'active' ? 'success' : 'info'" size="small">
                  {{ item.status === 'active' ? '启用' : '禁用' }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
        <div class="collapsed-summary" v-else>{{ getWorkTypeItemCount(workType) }}项</div>
      </el-card>
    </div>

    <!-- 工作性质对话框 -->
    <FormDialog
      v-model="workTypeDialogVisible"
      :title="workTypeForm.id ? '编辑工作性质' : '新增工作性质'"
      width="900px"
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
      <el-divider content-position="left">检查项目</el-divider>
      <div class="work-type-items">
        <el-empty
          v-if="workTypeForm.items.length === 0"
          description="暂无检查项目"
          :image-size="60"
        />
        <div v-else>
          <div
            v-for="(parent, parentIndex) in workTypeForm.items"
            :key="parent.id ?? parent.tempId"
            class="parent-item"
          >
            <div class="parent-row">
              <el-input
                v-model="parent.itemName"
                class="field-name"
                placeholder="检查项目名称"
              />
              <el-input
                v-model="parent.itemStandard"
                class="field-standard"
                placeholder="检查标准"
              />
              <div class="parent-switch">
                <span class="switch-label">启用子项</span>
                <el-switch v-model="parent.enableChildren" @change="handleParentToggle(parent)" />
              </div>
              <el-select v-model="parent.status" class="status-select">
                <el-option label="启用" value="active" />
                <el-option label="禁用" value="inactive" />
              </el-select>
              <el-button type="danger" link @click="removeParentItem(parentIndex)">删除</el-button>
            </div>
            <div v-if="parent.enableChildren" class="child-list">
              <div
                v-for="(child, childIndex) in parent.children"
                :key="child.id ?? child.tempId"
                class="child-row"
              >
                <div class="trigger-group">
                  <span class="trigger-label">选择：</span>
                  <el-radio-group v-model="child.triggerValue">
                    <el-radio :value="1">是</el-radio>
                    <el-radio :value="0">否</el-radio>
                  </el-radio-group>
                </div>
                <el-input
                  v-model="child.itemName"
                  class="field-name"
                  placeholder="子项内容"
                />
                <el-input
                  v-model="child.itemStandard"
                  class="field-standard"
                  placeholder="子项标准"
                />
                <div class="child-actions">
                  <el-switch
                    v-model="child.status"
                    active-value="active"
                    inactive-value="inactive"
                    active-text="启用"
                  />
                  <el-button type="danger" link @click="removeChildItem(parentIndex, childIndex)">删除</el-button>
                </div>
              </div>
              <el-button type="primary" link @click="addChildItem(parent)">
                <el-icon><Plus /></el-icon>新增子项
              </el-button>
            </div>
          </div>
        </div>
        <el-button type="primary" plain @click="addParentItem">
          <el-icon><Plus /></el-icon>新增检查项
        </el-button>
      </div>
    </FormDialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Download, ArrowRight } from '@element-plus/icons-vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/store/modules/user';
import { useUpload } from '@/composables/useUpload';
import request from '@/api/request';
import FormDialog from '@/components/system/FormDialog.vue';
import { buildExportFileName, exportRowsToXlsx } from '@/utils/tableExport';

const userStore = useUserStore();
const route = useRoute();

const { apiBaseUrl, uploadHeaders } = useUpload();

// 导入配置
const importUrl = computed(() => `${apiBaseUrl}/safety-check-items/import`);
const uploadRef = ref();

// 工作性质列表（包含检查项目）
const workTypes = ref([]);
const loading = ref(false);
const saving = ref(false);
const exporting = ref(false);
const expandedWorkTypes = ref({});

// 工作性质对话框
const workTypeDialogVisible = ref(false);
const workTypeFormRef = ref();
const workTypeForm = reactive({
  id: null,
  workTypeName: '',
  isDefault: false,
  sortOrder: 0,
  points: 0,
  status: 'active',
  items: []
});

const workTypeRules = {
  workTypeName: [
    { required: true, message: '请输入工作性质名称', trigger: 'blur' }
  ]
};

const originalItems = ref([]);

let tempItemIndex = 0;
const createTempId = () => `temp_${Date.now()}_${tempItemIndex++}`;

const formatPoints = (value) => (value === undefined || value === null ? 0 : value);

const exportAll = async () => {
  exporting.value = true;
  try {
    const types = Array.isArray(workTypes.value) ? workTypes.value : [];
    const rows = [];

    types.forEach((type) => {
      const items = Array.isArray(type?.checkItems) ? type.checkItems : [];
      if (items.length === 0) {
        rows.push({ type, item: null, itemIndex: 0 });
        return;
      }
      items.forEach((item, index) => {
        rows.push({ type, item, itemIndex: index + 1 });
      });
    });

    const columns = [
      { label: '工作性质', value: row => row.type?.work_type_name ?? '' },
      { label: '工作性质积分', value: row => formatPoints(row.type?.points) },
      { label: '工作性质状态', value: row => (row.type?.status === 'active' ? '启用' : '禁用') },
      { label: '序号', value: row => (row.item ? row.itemIndex : '') },
      {
        label: '类型',
        value: (row) => {
          const item = row.item;
          if (!item) return '';
          if (item.parent_id) return '子项';
          return Number(item.enable_children) === 1 ? '父项(联动)' : '父项';
        }
      },
      { label: '检查项目', value: row => row.item?.item_name ?? '' },
      { label: '检查标准', value: row => row.item?.item_standard ?? '' },
      {
        label: '父项',
        value: (row) => {
          const item = row.item;
          if (!item?.parent_id) return '';
          const items = Array.isArray(row.type?.checkItems) ? row.type.checkItems : [];
          const parent = items.find(entry => entry.id === item.parent_id);
          return parent?.item_name ?? '';
        }
      },
      { label: '触发值', value: row => (row.item?.parent_id ? (row.item.trigger_value ?? '') : '') },
      { label: '状态', value: row => (row.item ? (row.item.status === 'active' ? '启用' : '禁用') : '') }
    ];

    const pageTitle = typeof route?.meta?.title === 'string' ? route.meta.title : '安全检查项目';
    const fileName = buildExportFileName({ title: pageTitle });
    await exportRowsToXlsx({ title: pageTitle, fileName, sheetName: '检查项目', columns, rows });
  } catch (error) {
    const message = typeof error?.message === 'string' && error.message.trim() ? error.message : '导出失败';
    ElMessage.error(message);
  } finally {
    exporting.value = false;
  }
};

const isWorkTypeExpanded = (workType) => {
  if (!workType || workType.id === undefined || workType.id === null) return false;
  return expandedWorkTypes.value[workType.id] === true;
};

const toggleWorkType = (workType) => {
  if (!workType || workType.id === undefined || workType.id === null) return;
  const current = expandedWorkTypes.value[workType.id] === true;
  expandedWorkTypes.value = {
    ...expandedWorkTypes.value,
    [workType.id]: !current
  };
};

const getWorkTypeItemCount = (workType) => {
  if (!workType || !workType.checkItems) return 0;
  return workType.checkItems.length;
};

const normalizeText = (value) => {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value).trim();
};

const resolveSortOrder = (value, fallback) => (value === undefined || value === null ? fallback : value);

const sortByOrder = (a, b) => {
  const aOrder = resolveSortOrder(a.sort_order, 0);
  const bOrder = resolveSortOrder(b.sort_order, 0);
  if (aOrder !== bOrder) return aOrder - bOrder;
  const aId = resolveSortOrder(a.id, 0);
  const bId = resolveSortOrder(b.id, 0);
  return aId - bId;
};

const createParentItem = (overrides = {}) => ({
  id: null,
  tempId: createTempId(),
  itemName: '',
  itemStandard: '',
  enableChildren: false,
  status: 'active',
  sortOrder: 0,
  children: [],
  ...overrides
});

const createChildItem = (overrides = {}) => ({
  id: null,
  tempId: createTempId(),
  itemName: '',
  itemStandard: '',
  triggerValue: 1,
  status: 'active',
  sortOrder: 0,
  ...overrides
});

const buildEditableItems = (items = []) => {
  const parents = items.filter(item => item.parent_id === null || item.parent_id === undefined);
  const children = items.filter(item => item.parent_id !== null && item.parent_id !== undefined);
  parents.sort(sortByOrder);
  children.sort(sortByOrder);

  const parentMap = new Map();
  const editableParents = parents.map(parent => {
    const entry = createParentItem({
      id: parent.id,
      itemName: parent.item_name,
      itemStandard: parent.item_standard ?? '',
      enableChildren: Number(parent.enable_children) === 1,
      status: parent.status,
      sortOrder: resolveSortOrder(parent.sort_order, 0),
      children: []
    });
    parentMap.set(parent.id, entry);
    return entry;
  });

  children.forEach(child => {
    const parent = parentMap.get(child.parent_id);
    if (!parent) {
      return;
    }
    parent.enableChildren = true;
    parent.children.push(createChildItem({
      id: child.id,
      itemName: child.item_name,
      itemStandard: child.item_standard ?? '',
      triggerValue: child.trigger_value ?? 1,
      status: child.status,
      sortOrder: resolveSortOrder(child.sort_order, 0)
    }));
  });

  return editableParents;
};

const addParentItem = () => {
  workTypeForm.items.push(createParentItem({ sortOrder: workTypeForm.items.length }));
};

const removeParentItem = (index) => {
  workTypeForm.items.splice(index, 1);
};

const handleParentToggle = (parent) => {
  if (!parent.enableChildren) {
    parent.children = [];
    return;
  }
  if (!parent.children || parent.children.length === 0) {
    parent.children = [createChildItem({ sortOrder: 0 })];
  }
};

const addChildItem = (parent) => {
  parent.enableChildren = true;
  if (!parent.children) {
    parent.children = [];
  }
  parent.children.push(createChildItem({ sortOrder: parent.children.length }));
};

const removeChildItem = (parentIndex, childIndex) => {
  const parent = workTypeForm.items[parentIndex];
  if (!parent || !parent.children) {
    return;
  }
  parent.children.splice(childIndex, 1);
};

const validateWorkTypeItems = () => {
  const items = workTypeForm.items ?? [];
  for (let i = 0; i < items.length; i += 1) {
    const parent = items[i];
    if (!normalizeText(parent.itemName)) {
      ElMessage.error(`第${i + 1}个检查项目名称不能为空`);
      return false;
    }
    if (parent.enableChildren) {
      if (!parent.children || parent.children.length === 0) {
        ElMessage.error(`第${i + 1}个检查项目需要至少一个子项`);
        return false;
      }
      for (let j = 0; j < parent.children.length; j += 1) {
        const child = parent.children[j];
        if (!normalizeText(child.itemName)) {
          ElMessage.error(`第${i + 1}个检查项目的第${j + 1}个子项名称不能为空`);
          return false;
        }
      }
    }
  }
  return true;
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
    status: 'active',
    items: []
  });
  originalItems.value = [];
  workTypeDialogVisible.value = true;
};

// 编辑工作性质
const editWorkType = (row) => {
  Object.assign(workTypeForm, {
    id: row.id,
    workTypeName: row.work_type_name,
    isDefault: row.is_default === 1,
    sortOrder: row.sort_order,
    points: row.points ?? 0,
    status: row.status,
    items: buildEditableItems(row.checkItems ?? [])
  });
  originalItems.value = (row.checkItems ?? []).map(item => ({
    id: item.id,
    parent_id: item.parent_id ?? null
  }));
  workTypeDialogVisible.value = true;
};

const syncCheckItems = async (workTypeId) => {
  const currentIds = new Set();
  const parents = workTypeForm.items ?? [];

  for (let i = 0; i < parents.length; i += 1) {
    const parent = parents[i];
    const enableChildren = parent.enableChildren === true || (parent.children && parent.children.length > 0);
    parent.enableChildren = enableChildren;

    const parentPayload = {
      workTypeId,
      itemName: parent.itemName,
      itemStandard: parent.itemStandard,
      parentId: null,
      enableChildren,
      sortOrder: resolveSortOrder(parent.sortOrder, i),
      status: parent.status
    };

    if (parent.id) {
      await request.put(`/safety-check-items/${parent.id}`, parentPayload);
    } else {
      const createdParent = await request.post('/safety-check-items', parentPayload);
      parent.id = createdParent?.id;
    }

    if (!parent.id) {
      throw new Error('创建检查项目失败');
    }

    currentIds.add(parent.id);

    const children = enableChildren ? (parent.children || []) : [];
    for (let j = 0; j < children.length; j += 1) {
      const child = children[j];
      const triggerValue = Number(child.triggerValue) === 0 ? 0 : 1;
      const childPayload = {
        workTypeId,
        itemName: child.itemName,
        itemStandard: child.itemStandard,
        parentId: parent.id,
        enableChildren: false,
        triggerValue,
        sortOrder: resolveSortOrder(child.sortOrder, j),
        status: child.status
      };

      if (child.id) {
        await request.put(`/safety-check-items/${child.id}`, childPayload);
      } else {
        const createdChild = await request.post('/safety-check-items', childPayload);
        child.id = createdChild?.id;
      }

      if (!child.id) {
        throw new Error('创建检查项目失败');
      }

      currentIds.add(child.id);
    }
  }

  const removedItems = originalItems.value.filter(item => !currentIds.has(item.id));
  const removedParents = removedItems.filter(item => item.parent_id === null || item.parent_id === undefined);
  const removedParentIds = new Set(removedParents.map(item => item.id));
  const removedChildren = removedItems.filter(item =>
    item.parent_id !== null &&
    item.parent_id !== undefined &&
    !removedParentIds.has(item.parent_id)
  );

  for (const child of removedChildren) {
    await request.delete(`/safety-check-items/${child.id}`);
  }

  for (const parent of removedParents) {
    await request.delete(`/safety-check-items/${parent.id}`);
  }
};

// 保存工作性质
const saveWorkType = async () => {
  const isEdit = workTypeForm.id !== null && workTypeForm.id !== undefined;
  try {
    await workTypeFormRef.value.validate();
    if (!validateWorkTypeItems()) {
      return;
    }
    saving.value = true;

    const data = {
      workTypeName: workTypeForm.workTypeName,
      isDefault: workTypeForm.isDefault,
      sortOrder: workTypeForm.sortOrder,
      points: workTypeForm.points,
      status: workTypeForm.status
    };

    let workTypeId = workTypeForm.id;
    if (isEdit) {
      await request.put(`/safety-work-types/${workTypeForm.id}`, data);
    } else {
      const created = await request.post('/safety-work-types', data);
      workTypeId = created?.id;
      workTypeForm.id = workTypeId;
    }

    if (!workTypeId) {
      throw new Error('创建工作性质失败');
    }

    await syncCheckItems(workTypeId);
    ElMessage.success(isEdit ? '更新成功' : '创建成功');

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

        .work-type-title {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }

        .expand-icon {
          transition: transform 0.2s ease;
        }

        .expand-icon.expanded {
          transform: rotate(90deg);
        }

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

  .collapsed-summary {
    padding: 12px 4px;
    color: #909399;
    font-size: 12px;
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

    .col-type {
      width: 90px;
      text-align: center;
      flex-shrink: 0;
    }

    .col-name {
      flex: 1;
      min-width: 180px;
      padding: 0 10px;
    }

    .col-standard {
      flex: 1.5;
      min-width: 200px;
      padding: 0 10px;
      color: #606266;
    }

    .col-parent {
      width: 180px;
      padding: 0 10px;
      color: #909399;
      flex-shrink: 0;
    }

    .col-trigger {
      width: 100px;
      text-align: center;
      flex-shrink: 0;
      color: #606266;
    }

    .col-status {
      width: 80px;
      text-align: center;
      flex-shrink: 0;
    }
  }

  .work-type-items {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .parent-item {
    border: 1px solid #ebeef5;
    border-radius: 6px;
    padding: 12px;
    background: #fff;
  }

  .parent-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .field-name {
    flex: 1;
    min-width: 180px;
  }

  .field-standard {
    flex: 1.5;
    min-width: 220px;
  }

  .parent-switch {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .switch-label {
    font-size: 12px;
    color: #909399;
  }

  .status-select {
    width: 120px;
  }

  .child-list {
    margin-top: 10px;
    padding-left: 12px;
    border-left: 2px solid #ebeef5;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .child-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    background: #f7f8fa;
    padding: 8px;
    border-radius: 6px;
  }
  .trigger-group {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .trigger-label {
    font-size: 12px;
    color: #909399;
  }

  .child-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}
</style>

