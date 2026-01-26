<template>
  <div class="user-management-page">
    <div class="page-header">
      <h2>用户管理</h2>
      <div v-if="canEditUser" class="header-actions">
        <el-button @click="downloadTemplate">
          <el-icon><Download /></el-icon>下载导入模板
        </el-button>
        <BaseUpload
          ref="uploadRef"
          :auto-upload="false"
          :show-file-list="false"
          accept=".xlsx,.xls"
          :on-change="handleFileChange"
        >
          <el-button type="success">
            <el-icon><Download /></el-icon>批量导入
          </el-button>
        </BaseUpload>
        <el-button type="primary" @click="showAddDialog">
          <el-icon><Plus /></el-icon>新增用户
        </el-button>
      </div>
    </div>

    <FilterBar>
      <el-input
        v-model="filters.keyword"
        placeholder="搜索用户名/姓名/手机号"
        clearable
        style="width: 250px"
        @keyup.enter="loadList"
      />
      <el-input
        v-model="filters.companyName"
        placeholder="公司"
        clearable
        style="width: 180px"
        @keyup.enter="loadList"
      />
      <el-select v-model="filters.roleCode" placeholder="角色" clearable @change="loadList">
        <el-option-group v-for="group in positionGroups" :key="group.label" :label="group.label">
          <el-option
            v-for="item in group.options"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-option-group>
      </el-select>
      <el-select v-model="filters.departmentName" placeholder="部门" clearable @change="loadList">
        <el-option v-for="dept in departmentList" :key="dept.id" :label="getDepartmentName(dept)" :value="getDepartmentName(dept)" />
      </el-select>
      <el-select v-model="filters.stationId" placeholder="场站" clearable @change="loadList">
        <el-option v-for="s in stationList" :key="s.id" :label="s.stationName" :value="s.id" />
      </el-select>
      <el-select v-model="filters.status" placeholder="状态" clearable @change="loadList">
        <el-option label="启用" :value="1" />
        <el-option label="禁用" :value="0" />
      </el-select>
      <el-button type="primary" @click="loadList">搜索</el-button>
    </FilterBar>

    <el-table ref="tableRef" :data="userList" stripe border v-loading="loading">
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column label="密码" width="120">
        <template #default>
          ******
        </template>
      </el-table-column>
      <el-table-column prop="realName" label="姓名" width="100" />
      <el-table-column label="部门" width="120">
        <template #default="{ row }">
          {{ row.departmentName || row.department_name || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="公司" width="140">
        <template #default="{ row }">
          {{ row.companyName || row.company_name || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="角色" width="140">
        <template #default="{ row }">
          {{ getPositionLabel(row.roleCode) }}
        </template>
      </el-table-column>
      <el-table-column prop="phone" label="手机号" width="130" />
      <el-table-column prop="email" label="邮箱" width="180" show-overflow-tooltip />
      <el-table-column label="所属场站" width="150" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.scheduleStations?.map(s => s.stationName).join(', ') || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="160">
        <template #default="{ row }">
          {{ formatDateTime(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column v-if="canEditUser" label="操作" width="240">
        <template #default="{ row }">
          <div class="action-buttons">
          <el-button link type="primary" @click="editUser(row)">编辑</el-button>
          <el-button link type="warning" @click="resetPassword(row)">重置密码</el-button>
          <el-button link type="danger" @click="deleteUser(row)">删除</el-button>
                  </div>
        </template>
      </el-table-column>
    </el-table>

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

    <FormDialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      width="720px"
      :confirm-text="'保存'"
      :cancel-text="'取消'"
      :confirm-loading="saving"
      @confirm="saveUser"
    >
      <el-form :model="userForm" :rules="userRules" ref="formRef" label-width="110px" v-loading="detailLoading">
        <el-form-item label="姓名" prop="realName">
          <el-input v-model="userForm.realName" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" :disabled="isEdit" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!isEdit">
          <el-input v-model="userForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="角色" prop="roleCode">
          <el-cascader
            v-model="userForm.positionPath"
            :options="positionOptions"
            :props="{ expandTrigger: 'hover', emitPath: false }"
            placeholder="请选择角色"
            clearable
            style="width: 100%;"
            @change="handlePositionChange"
          />
        </el-form-item>
        <el-form-item label="部门" prop="departmentName">
          <el-select v-model="userForm.departmentName" placeholder="请选择部门" clearable style="width: 100%;">
            <el-option v-for="dept in departmentOptionsForForm" :key="dept.id" :label="getDepartmentName(dept)" :value="getDepartmentName(dept)" />
          </el-select>
        </el-form-item>
        <el-form-item label="公司" prop="companyName">
          <el-input v-model="userForm.companyName" placeholder="请输入公司名称" />
        </el-form-item>
        <el-form-item label="所属场站" prop="stationIds">
          <el-select v-model="userForm.stationIds" multiple placeholder="请选择场站" style="width: 100%;">
            <el-option v-for="s in stationOptionsForForm" :key="s.id" :label="s.stationName" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="单价管理员">
          <el-radio-group v-model="userForm.isPriceAdmin">
            <el-radio :value="1">是</el-radio>
            <el-radio :value="0">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="userForm.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="菜单权限">
          <el-tree
            ref="menuTreeRef"
            :data="menuPermissionTree"
            node-key="id"
            show-checkbox
            default-expand-all
            :props="{ label: 'name', children: 'children' }"
            v-model:checked-keys="selectedMenuPermissionIds"
          />
        </el-form-item>
        <el-form-item label="模块权限">
          <ModulePermissionConfig
            :permissions="allPermissions"
            v-model:selectedIds="selectedModulePermissionIds"
          />
        </el-form-item>
      </el-form>
    </FormDialog>

    <FormDialog
      v-model="importDialogVisible"
      title="导入预览"
      width="900px"
      :show-confirm="false"
      :show-cancel="false"
    >
      <el-alert
        v-if="importErrors.length > 0"
        type="error"
        :closable="false"
        style="margin-bottom: 16px;"
      >
        <template #title>
          <span>发现 {{ importErrors.length }} 条数据有问题，请修正后重新导入</span>
        </template>
      </el-alert>

      <el-table :data="importPreviewData" border max-height="400">
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="realName" label="姓名" width="100" />
        <el-table-column prop="companyName" label="公司" width="120" />
        <el-table-column prop="departmentName" label="部门" width="120" />
        <el-table-column prop="positionName" label="角色" width="140" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="email" label="邮箱" width="180" show-overflow-tooltip />
        <el-table-column prop="stationName" label="所属场站" width="150" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.error ? 'danger' : 'success'" size="small">
              {{ row.error || '可导入' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="confirmImport"
          :loading="importing"
          :disabled="importErrors.length > 0"
        >
          确认导入 ({{ importPreviewData.filter(d => !d.error).length }} 条)
        </el-button>
      </template>
    </FormDialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

import { addTemplateInstructionSheet, applyTemplateHeaderStyle } from '@/utils/excelTemplate';
import request from '@/api/request';
import roleApi from '@/api/role';
import permissionApi from '@/api/permission';
import ModulePermissionConfig from '@/components/ModulePermissionConfig.vue';
import FormDialog from '@/components/system/FormDialog.vue';
import { useUserStore } from '@/store/modules/user';

const userStore = useUserStore();

// 权限检查
const hasPermission = (code) => userStore.permissionCodes.includes(code);
const canEditUser = computed(() => hasPermission('module:user:edit'));

const formRef = ref(null);
const uploadRef = ref(null);
const tableRef = ref(null);
const userList = ref([]);
const stationList = ref([]);
const departmentList = ref([]);
const dialogVisible = ref(false);
const importDialogVisible = ref(false);
const isEdit = ref(false);
const saving = ref(false);
const loading = ref(false);
const detailLoading = ref(false);
const importing = ref(false);
const importPreviewData = ref([]);
const importErrors = ref([]);

const roleList = ref([]);
const allPermissions = ref([]);
const allowPermissionIds = ref([]);
const denyPermissionIds = ref([]);
const menuPermissionTree = ref([]);
const selectedMenuPermissionIds = ref([]);
const selectedModulePermissionIds = ref([]);
const baseMenuPermissionIds = ref([]);
const baseModulePermissionIds = ref([]);
const permissionCodeById = ref(new Map());
const permissionIdByCode = ref(new Map());
const menuTreeRef = ref(null);

const isActiveStatus = (status) => status === undefined || status === null || status === '' || status === 'active' || status === 1 || status === '1' || status === true;
const getDepartmentName = (dept) => dept?.name || dept?.dept_name || dept?.departmentName || '';

const activeRoleList = computed(() => roleList.value.filter(role => isActiveStatus(role.status)));
const roleOptionsForForm = computed(() => {
  const selectedCode = userForm.value.roleCode;
  if (!selectedCode) return activeRoleList.value;
  const selected = roleList.value.find(role => role.roleCode === selectedCode);
  if (selected && !isActiveStatus(selected.status)) {
    return [selected, ...activeRoleList.value.filter(role => role.roleCode !== selectedCode)];
  }
  return activeRoleList.value;
});

const positionOptions = computed(() => roleOptionsForForm.value.map(role => ({
  value: role.roleCode,
  label: role.roleName
})));

const positionGroups = computed(() => ([
  {
    label: '角色',
    options: roleList.value.map(role => ({
      value: role.roleCode,
      label: role.roleName
    }))
  }
]));

const positionLabelMap = computed(() => {
  const map = {};
  roleList.value.forEach(role => {
    map[role.roleCode] = role.roleName;
  });
  return map;
});

const getPositionLabel = (code) => positionLabelMap.value[code] || code;
const mapPositionToRoleCode = (value) => value;

const buildPositionNameToCode = () => {
  const map = {};
  activeRoleList.value.forEach(role => {
    map[role.roleName] = role.roleCode;
  });
  return map;
};

const normalizeUser = (user) => {
  const stations = (user.stations || []).map(s => ({
    id: s.id,
    stationName: s.stationName || s.station_name,
    stationType: s.stationType || s.station_type
  }));

  return {
    ...user,
    realName: user.realName || user.real_name,
    roleCode: user.roleCode || user.role?.role_code,
    roleName: user.roleName || user.role?.role_name,
    departmentName: user.departmentName || user.department_name,
    companyName: user.companyName || user.company_name,
    stations
  };
};

const buildTree = (items) => {
  const map = new Map();
  const roots = [];
  items.forEach(item => {
    map.set(item.id, { ...item, children: [] });
  });
  map.forEach(node => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
};

const splitIdsByType = (ids = []) => {
  const menus = [];
  const modules = [];
  ids.forEach(id => {
    const code = permissionCodeById.value.get(id);
    if (!code) return;
    if (code.startsWith('menu:/')) {
      menus.push(id);
    } else if (code.startsWith('module:')) {
      modules.push(id);
    }
  });
  return { menus, modules };
};

const expandModulesWithChildren = (ids = []) => {
  const idSet = new Set(ids || []);
  const codeSet = new Set([...idSet].map(id => permissionCodeById.value.get(id)).filter(Boolean));
  allPermissions.value.forEach(p => {
    if (p.type !== 'module') return;
    for (const code of codeSet) {
      if (p.code.startsWith(`${code}:`)) {
        idSet.add(p.id);
        break;
      }
    }
  });
  return Array.from(idSet);
};

const filters = ref({
  keyword: '',
  roleCode: '',
  departmentName: '',
  companyName: '',
  stationId: '',
  status: ''
});

const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
});

const userForm = ref({
  username: '',
  realName: '',
  password: '',
  roleCode: '',
  positionPath: '',
  departmentName: '',
  companyName: '',
  phone: '',
  email: '',
  stationIds: [],
  isPriceAdmin: 0,
  status: 1
});

const userRules = {
  realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在3到20个字符', trigger: 'blur' }
  ],
  roleCode: [{ required: true, message: '请选择角色', trigger: 'change' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
};

const loadList = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      keyword: filters.value.keyword || undefined,
      companyName: filters.value.companyName || undefined,
      roleCode: mapPositionToRoleCode(filters.value.roleCode) || undefined,
      departmentName: filters.value.departmentName || undefined,
      stationId: filters.value.stationId || undefined,
      status: filters.value.status !== '' ? filters.value.status : undefined
    };
    const res = await request.get('/users', { params });
    userList.value = (res.list || []).map(normalizeUser);
    pagination.value.total = res.total || 0;
  } catch (e) {
    
  } finally {
    loading.value = false;
  }
};

const refreshTableLayout = async () => {
  await nextTick();
  tableRef.value?.doLayout?.();
};

const normalizeStation = (station) => ({
  id: station.id,
  stationName: station.stationName || station.station_name || station.name || '',
  stationType: station.stationType || station.station_type,
  status: station.status
});

const activeStationList = computed(() => stationList.value.filter(station => isActiveStatus(station.status)));
const stationOptionsForForm = computed(() => {
  const selectedIds = new Set(userForm.value.stationIds || []);
  const inactiveSelected = stationList.value.filter(
    station => selectedIds.has(station.id) && !isActiveStatus(station.status)
  );
  const active = activeStationList.value.filter(station => !selectedIds.has(station.id));
  return [...inactiveSelected, ...active];
});

const activeDepartmentList = computed(() => departmentList.value.filter(dept => isActiveStatus(dept.status)));
const departmentOptionsForForm = computed(() => {
  const selectedName = userForm.value.departmentName;
  if (!selectedName) return activeDepartmentList.value;
  const selected = departmentList.value.find(dept => getDepartmentName(dept) === selectedName);
  if (selected && !isActiveStatus(selected.status)) {
    return [selected, ...activeDepartmentList.value.filter(dept => getDepartmentName(dept) !== selectedName)];
  }
  return activeDepartmentList.value;
});

const loadStations = async () => {
  try {
    const res = await request.get('/stations', { params: { pageSize: 100 } });
    const list = (res.list || []).map(normalizeStation);
    stationList.value = list.length > 0 ? list : [];
  } catch (e) {
    stationList.value = [];
  }
};

const loadDepartments = async () => {
  try {
    const res = await request.get('/departments', { params: { pageSize: 100 } });
    departmentList.value = res.list || [];
  } catch (e) {
    departmentList.value = [];
  }
};

const loadRoles = async () => {
  try {
    const res = await roleApi.getRoles();
    roleList.value = res.list || [];
  } catch (e) {
    roleList.value = [];
  }
};

const loadPermissions = async () => {
  try {
    const res = await permissionApi.getPermissions();
    const list = res.list || [];
    allPermissions.value = list;

    const codeById = new Map();
    const idByCode = new Map();
    list.forEach(item => {
      codeById.set(item.id, item.code);
      idByCode.set(item.code, item.id);
    });
    permissionCodeById.value = codeById;
    permissionIdByCode.value = idByCode;

    const menuList = list.filter(item => item.type === 'menu');
    menuPermissionTree.value = buildTree(menuList);
  } catch (e) {
    allPermissions.value = [];
    permissionCodeById.value = new Map();
    permissionIdByCode.value = new Map();
    menuPermissionTree.value = [];
  }
};

const formatDateTime = (value) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-');

const showAddDialog = () => {
  isEdit.value = false;
  userForm.value = {
    username: '',
    realName: '',
    password: '',
    roleCode: '',
    positionPath: '',
    departmentName: '',
    companyName: '',
    phone: '',
    email: '',
    stationIds: [],
    isPriceAdmin: 0,
    status: 1
  };
  allowPermissionIds.value = [];
  denyPermissionIds.value = [];
  selectedMenuPermissionIds.value = [];
  selectedModulePermissionIds.value = [];
  baseMenuPermissionIds.value = [];
  baseModulePermissionIds.value = [];
  nextTick(() => {
    if (menuTreeRef.value) {
      menuTreeRef.value.setCheckedKeys([]);
    }
  });
  dialogVisible.value = true;
};

const applyBasePermissions = async (roleCode, overrides = {}) => {
  if (!roleCode) {
    baseMenuPermissionIds.value = [];
    baseModulePermissionIds.value = [];
    selectedMenuPermissionIds.value = [];
    selectedModulePermissionIds.value = [];
    await nextTick();
    if (menuTreeRef.value) {
      menuTreeRef.value.setCheckedKeys([]);
    }
    return;
  }

  if (!allPermissions.value.length) {
    await loadPermissions();
  }

  const role = roleList.value.find(r => r.roleCode === roleCode);
  if (!role) return;

  try {
    const res = await roleApi.getRolePermissions(role.id);
    const permissionIds = res.permissionIds || [];
    const { menus: baseMenus, modules: baseModules } = splitIdsByType(permissionIds);
    baseMenuPermissionIds.value = baseMenus;
    baseModulePermissionIds.value = expandModulesWithChildren(baseModules);

    const { allowIds = [], denyIds = [] } = overrides;
    const { menus: allowMenus, modules: allowModules } = splitIdsByType(allowIds);
    const { menus: denyMenus, modules: denyModules } = splitIdsByType(denyIds);

    const menuSet = new Set(baseMenus);
    allowMenus.forEach(id => menuSet.add(id));
    denyMenus.forEach(id => menuSet.delete(id));
    selectedMenuPermissionIds.value = Array.from(menuSet);
    await nextTick();
    if (menuTreeRef.value) {
      menuTreeRef.value.setCheckedKeys(selectedMenuPermissionIds.value);
    }

    const expandedBaseModules = new Set(baseModulePermissionIds.value);
    const allowExpanded = new Set(expandModulesWithChildren(allowModules));
    const denyExpanded = new Set(expandModulesWithChildren(denyModules));

    const moduleSet = new Set(expandedBaseModules);
    allowExpanded.forEach(id => moduleSet.add(id));
    denyExpanded.forEach(id => moduleSet.delete(id));
    selectedModulePermissionIds.value = Array.from(moduleSet);
  } catch (e) {
    
  }
};

const editUser = async (row) => {
  isEdit.value = true;
  detailLoading.value = true;
  dialogVisible.value = true;
  try {
    if (!allPermissions.value.length) {
      await loadPermissions();
    }
    const res = await request.get(`/users/${row.id}`);
    const normalized = normalizeUser(res);
    userForm.value = {
      id: normalized.id,
      username: normalized.username,
      realName: normalized.realName,
      roleCode: normalized.roleCode,
      positionPath: normalized.roleCode,
      departmentName: normalized.departmentName || '',
      companyName: normalized.companyName || '',
      phone: normalized.phone,
      email: normalized.email,
      stationIds: normalized.stations?.map(s => s.id) || [],
      isPriceAdmin: normalized.isPriceAdmin || 0,
      status: normalized.status
    };
    allowPermissionIds.value = res.allowPermissionIds || [];
    denyPermissionIds.value = res.denyPermissionIds || [];
    await applyBasePermissions(normalized.roleCode, {
      allowIds: allowPermissionIds.value,
      denyIds: denyPermissionIds.value
    });
  } catch (e) {
    
  } finally {
    detailLoading.value = false;
  }
};

const handlePositionChange = async (value) => {
  userForm.value.roleCode = mapPositionToRoleCode(value);
  allowPermissionIds.value = [];
  denyPermissionIds.value = [];
  await applyBasePermissions(userForm.value.roleCode);
};

const computePermissionDiff = () => {
  const baseMenuSet = new Set(baseMenuPermissionIds.value || []);
  const baseModuleSet = new Set(baseModulePermissionIds.value || []);
  const selectedMenuSet = new Set(selectedMenuPermissionIds.value || []);
  const selectedModuleSet = new Set(selectedModulePermissionIds.value || []);

  const allowMenuIds = Array.from(selectedMenuSet).filter(id => !baseMenuSet.has(id));
  const allowModuleIds = Array.from(selectedModuleSet).filter(id => !baseModuleSet.has(id));
  const denyMenuIds = Array.from(baseMenuSet).filter(id => !selectedMenuSet.has(id));
  const denyModuleIds = Array.from(baseModuleSet).filter(id => !selectedModuleSet.has(id));

  return {
    allowPermissionIds: [...allowMenuIds, ...allowModuleIds],
    denyPermissionIds: [...denyMenuIds, ...denyModuleIds]
  };
};

const saveUser = async () => {
  if (!formRef.value) return;
  const isValid = await formRef.value.validate().catch(() => false);
  if (!isValid) return;
  saving.value = true;
  try {
    const diff = computePermissionDiff();
    const data = {
      ...userForm.value,
      ...diff
    };
    delete data.positionPath;

    if (isEdit.value) {
      await request.put(`/users/${userForm.value.id}`, data);
    } else {
      await request.post('/users', data);
    }
    ElMessage.success('保存成功');
    dialogVisible.value = false;
    loadList();
  } catch (e) {
    ElMessage.error(e?.message || '保存失败');
  } finally {
    saving.value = false;
  }
};

const resetPassword = async (row) => {
  await ElMessageBox.confirm(`确定重置用户 ${row.username} 的密码吗？`, '提示', { type: 'warning' });
  try {
    await request.put(`/users/${row.id}/reset-password`);
    ElMessage.success('密码已重置为：123456');
  } catch (e) {
    
  }
};

const deleteUser = async (row) => {
  await ElMessageBox.confirm(`确定删除用户 ${row.username} 吗？`, '提示', { type: 'warning' });
  try {
    await request.delete(`/users/${row.id}`);
    ElMessage.success('删除成功');
    loadList();
  } catch (e) {
    
  }
};

const downloadTemplate = () => {
  const templateData = [
    ['用户名', '姓名', '公司', '部门', '角色', '手机号', '邮箱', '所属场站'],
    ['zhangsan', '张三', '示例公司', '运营部', '操作岗1', '13800138001', 'zhangsan@example.com', '示例场站'],
    ['lisi', '李四', '示例公司', '运营部', '站长', '13800138002', 'lisi@example.com', '示例场站']
  ];

  const ws = XLSX.utils.aoa_to_sheet(templateData);
  applyTemplateHeaderStyle(XLSX, ws, 1);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '用户导入模板');

  const roleNames = Object.keys(buildPositionNameToCode());
  const roleText = roleNames.length > 0 ? roleNames.join('、') : '';
  const instructionData = [
    ['用户名', '必填，登录账号，3-20个字符。'],
    ['姓名', '必填，用户真实姓名。'],
    ['公司', '选填，公司名称。'],
    ['部门', '选填，所属部门名称。'],
    ['角色', `必填，可选值：${roleText}`],
    ['手机号', '选填，11位手机号。'],
    ['邮箱', '选填。'],
    ['所属场站', '选填，场站名称。'],
    ['默认密码', '导入后默认密码为 123456。'],
    ['导入数量', '一次最多导入 100 条数据。']
  ];
  addTemplateInstructionSheet(XLSX, wb, instructionData);

  XLSX.writeFile(wb, '用户管理导入模板.xlsx');
  ElMessage.success('模板已下载');
};

const handleFileChange = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

      const rows = jsonData.slice(1).filter(row => row.length > 0 && row[0]);
      if (rows.length === 0) {
        ElMessage.warning('没有找到有效数据');
        return;
      }
      if (rows.length > 100) {
        ElMessage.warning('一次最多导入100条数据');
        return;
      }

      const positionNameToCode = buildPositionNameToCode();

      const previewData = rows.map((row, index) => {
        const item = {
          rowIndex: index + 2,
          username: row[0]?.toString().trim() || '',
          realName: row[1]?.toString().trim() || '',
          companyName: row[2]?.toString().trim() || '',
          departmentName: row[3]?.toString().trim() || '',
          positionName: row[4]?.toString().trim() || '',
          phone: row[5]?.toString().trim() || '',
          email: row[6]?.toString().trim() || '',
          stationName: row[7]?.toString().trim() || '',
          error: null
        };

        if (!item.realName) {
          item.error = '姓名不能为空';
        } else if (!item.username) {
          item.error = '用户名不能为空';
        } else if (item.username.length < 3 || item.username.length > 20) {
          item.error = '用户名长度应为3-20';
        } else if (!item.positionName || !positionNameToCode[item.positionName]) {
          item.error = '岗位无效';
        } else if (item.phone && !/^1[3-9]\d{9}$/.test(item.phone)) {
          item.error = '手机号格式错误';
        }

        item.roleCode = positionNameToCode[item.positionName];
        item.isPriceAdmin = 0;

        return item;
      });

      importPreviewData.value = previewData;
      importErrors.value = previewData.filter(d => d.error);
      importDialogVisible.value = true;
    } catch (err) {
      
      ElMessage.error('文件解析失败，请检查文件格式');
    }
  };
  reader.readAsArrayBuffer(file.raw);
};

const confirmImport = async () => {
  const validData = importPreviewData.value.filter(d => !d.error);
  if (validData.length === 0) {
    ElMessage.warning('没有可导入的有效数据');
    return;
  }

  importing.value = true;
  try {
    const importList = validData.map(item => ({
      realName: item.realName,
      username: item.username,
      roleCode: item.roleCode,
      departmentName: item.departmentName,
      companyName: item.companyName,
      stationName: item.stationName,
      isPriceAdmin: item.isPriceAdmin,
      phone: item.phone,
      email: item.email,
      password: '123456'
    }));

    await request.post('/users/batch-import', { users: importList });
    ElMessage.success(`成功导入 ${validData.length} 条数据`);
    importDialogVisible.value = false;
    loadList();
  } catch (e) {
    
    ElMessage.error('导入失败: ' + (e.response?.data?.message || e.message));
  } finally {
    importing.value = false;
  }
};

onMounted(async () => {
  loadList();
  loadStations();
  loadDepartments();
  loadRoles();
  loadPermissions();
  await refreshTableLayout();
});

onActivated(async () => {
  if (!loading.value && userList.value.length === 0) {
    loadList();
  }
  await refreshTableLayout();
});
</script>

<style lang="scss" scoped>
.user-management-page {
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
      gap: 12px;
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
    flex-wrap: wrap;
  }

  .el-table {
    border-radius: 8px;
    overflow: hidden;
  }

  .action-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }

  :deep(.action-buttons .el-button + .el-button) {
    margin-left: 0;
  }

  :deep(.action-buttons .el-button) {
    white-space: nowrap;
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

// 移动端强制隐藏固定列
@media screen and (max-width: 768px) {
  .user-management-page :deep(.el-table__fixed),
  .user-management-page :deep(.el-table__fixed-right) {
    display: none !important;
    width: 0 !important;
  }

  .user-management-page :deep(.el-table__fixed-right-patch) {
    display: none !important;
  }

  .user-management-page :deep(.el-table .el-table__body-wrapper) {
    overflow-x: auto !important;
  }

  .user-management-page :deep(.el-table__cell.is-right),
  .user-management-page :deep(.el-table__cell.is-left) {
    position: static !important;
  }
}
</style>
