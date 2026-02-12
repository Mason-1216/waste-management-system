<template>
  <div class="user-management-page">
    <div class="page-header">
      <h2>用户管理</h2>
      <div v-if="canEditUser" class="header-actions">
        <el-button v-if="isSimpleMode" @click="simpleShowTable = !simpleShowTable">
          {{ simpleShowTable ? '切换卡片' : '切换表格' }}
        </el-button>
        <el-button type="info" @click="downloadTemplate">
          <el-icon><Download /></el-icon>下载模板
        </el-button>
        <el-button type="success" :loading="importPreviewLoading" @click="triggerImport">
          <el-icon><Download /></el-icon>批量导入
        </el-button>
        <el-button type="primary" @click="showAddDialog">
          <el-icon><Plus /></el-icon>新增用户
        </el-button>
        <el-button type="primary" :loading="exporting" @click="exportUsers">
          <el-icon><Upload /></el-icon>批量导出
        </el-button>
      </div>
    </div>

    <input
      ref="importFileInputRef"
      type="file"
      accept=".xlsx,.xls"
      style="display: none"
      @change="handleImportFileSelected"
    />

    <ImportPreviewDialog
      v-model="importPreviewVisible"
      title="用户管理 - 导入预览"
      :rows="importPreviewRows"
      :summary="importPreviewSummary"
      :truncated="importPreviewTruncated"
      :max-rows="importPreviewMaxRows"
      :confirm-loading="importSubmitting"
      :columns="importPreviewColumns"
      @confirm="confirmImport"
    />

    <el-card class="filter-card">
      <SimpleFilterBar
        :enabled="isSimpleMode"
        v-model:expanded="simpleFilterExpanded"
        :summary-text="simpleFilterSummaryText"
      >
        <FilterBar>
        <div class="filter-item">
          <span class="filter-label">姓名</span>
          <FilterAutocomplete
            v-model="filters.keyword"
            :fetch-suggestions="fetchRealNameSuggestions"
            trigger-on-focus
            placeholder="全部"
            clearable
            @select="loadList"
            @input="loadList"
            @clear="loadList"
            @keyup.enter="loadList"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">公司</span>
          <FilterAutocomplete
            v-model="filters.companyName"
            :fetch-suggestions="fetchCompanyNameSuggestions"
            trigger-on-focus
            placeholder="全部"
            clearable
            @select="loadList"
            @input="loadList"
            @clear="loadList"
            @keyup.enter="loadList"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">角色</span>
          <FilterSelect v-model="filters.roleCode" placeholder="全部" filterable clearable @change="loadList" @clear="loadList">
            <el-option label="全部" value="all" />
            <el-option
              v-for="item in roleFilterOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </FilterSelect>
        </div>
        <div class="filter-item">
          <span class="filter-label">部门</span>
          <FilterSelect v-model="filters.departmentName" placeholder="全部" filterable clearable @change="loadList" @clear="loadList">
            <el-option label="全部" value="all" />
            <el-option v-for="dept in departmentList" :key="dept.id" :label="getDepartmentName(dept)" :value="getDepartmentName(dept)" />
          </FilterSelect>
        </div>
        <div class="filter-item">
          <span class="filter-label">场站</span>
          <FilterSelect v-model="filters.stationId" placeholder="全部" filterable clearable @change="loadList" @clear="loadList">
            <el-option label="全部" value="all" />
            <el-option v-for="s in stationList" :key="s.id" :label="s.stationName" :value="s.id" />
          </FilterSelect>
        </div>
        <div class="filter-item">
          <span class="filter-label">状态</span>
          <FilterSelect v-model="filters.status" placeholder="全部" filterable clearable @change="loadList" @clear="loadList">
            <el-option label="全部" value="all" />
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </FilterSelect>
        </div>
        </FilterBar>
      </SimpleFilterBar>
    </el-card>

    <el-table v-if="!isSimpleMode || simpleShowTable" ref="tableRef" :data="userList" stripe border v-loading="loading">
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
    <div v-else class="simple-card-list" v-loading="loading">
      <el-empty v-if="userList.length === 0" description="暂无数据" />
      <div v-for="row in userList" :key="row.id" class="simple-card-item">
        <div class="card-title">{{ row.realName || row.username || '-' }}</div>
        <div class="card-meta">用户名：{{ row.username || '-' }}</div>
        <div class="card-meta">角色：{{ getPositionLabel(row.roleCode) }}</div>
        <div class="card-meta">部门：{{ row.departmentName || row.department_name || '-' }}</div>
        <div class="card-meta">公司：{{ row.companyName || row.company_name || '-' }}</div>
        <div class="card-meta">手机号：{{ row.phone || '-' }}</div>
        <div class="card-meta">状态：{{ row.status === 1 ? '启用' : '禁用' }}</div>
        <div class="card-actions" v-if="canEditUser">
          <el-button link type="primary" @click="editUser(row)">编辑</el-button>
          <el-button link type="warning" @click="resetPassword(row)">重置密码</el-button>
          <el-button link type="danger" @click="deleteUser(row)">删除</el-button>
        </div>
      </div>
    </div>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[5, 10, 20, 50]"
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
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="userForm.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="模块权限">
          <ModulePermissionConfig
            :permissions="allPermissions"
            v-model:selectedIds="selectedModulePermissionIds"
          />
        </el-form-item>
      </el-form>
    </FormDialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { useRoute } from 'vue-router';
 
import { addTemplateInstructionSheet, applyTemplateHeaderStyle } from '@/utils/excelTemplate';
import { buildExportFileName, exportRowsToXlsx, fetchAllPaged } from '@/utils/tableExport';
import request from '@/api/request';
import roleApi from '@/api/role';
import permissionApi from '@/api/permission';
import ModulePermissionConfig from '@/modules/admin/components/ModulePermissionConfig.vue';
import FormDialog from '@/components/system/FormDialog.vue';
import ImportPreviewDialog from '@/components/common/ImportPreviewDialog.vue';
import SimpleFilterBar from '@/components/common/SimpleFilterBar.vue';
import { useUserStore } from '@/store/modules/user';
import { useSimpleMode } from '@/composables/useSimpleMode';

const route = useRoute();
const userStore = useUserStore();
const DEV_TEST_USERNAME = 'sum';
const { isSimpleMode, simpleShowTable, simpleFilterExpanded } = useSimpleMode();

// 权限检查
const hasPermission = (code) => userStore.permissionCodes.includes(code);
const canEditUser = computed(() => hasPermission('module:user:edit'));

const formRef = ref(null);
const tableRef = ref(null);
const userList = ref([]);
const stationList = ref([]);
const departmentList = ref([]);
const dialogVisible = ref(false);
const isEdit = ref(false);
const saving = ref(false);
const loading = ref(false);
const detailLoading = ref(false);
const exporting = ref(false);

// ==================== 批量导入（预览 -> 确认导入） ====================
const importFileInputRef = ref(null);
const importPreviewLoading = ref(false);
const importSubmitting = ref(false);
const importFile = ref(null);
const importPayloadUsers = ref([]);
const importPreviewVisible = ref(false);
const importPreviewSummary = ref({});
const importPreviewRows = ref([]);
const importPreviewTruncated = ref(false);
const importPreviewMaxRows = ref(0);

const importPreviewColumns = computed(() => ([
  { prop: 'username', label: '用户名', width: 120 },
  { prop: 'realName', label: '姓名', width: 100, diffKey: 'realName' },
  { prop: 'roleCode', label: '角色', width: 140, diffKey: 'roleCode' },
  { prop: 'stationName', label: '所属场站', width: 150, diffKey: 'stationName' },
  { prop: 'companyName', label: '公司', width: 140, diffKey: 'companyName' },
  { prop: 'departmentName', label: '部门', width: 120, diffKey: 'departmentName' },
  { prop: 'phone', label: '手机号', width: 130, diffKey: 'phone' },
  { prop: 'email', label: '邮箱', minWidth: 180, diffKey: 'email' }
]));

 const roleList = ref([]);
 const allPermissions = ref([]);
 const allowPermissionIds = ref([]);
 const denyPermissionIds = ref([]);
 const selectedModulePermissionIds = ref([]);
 const baseModulePermissionIds = ref([]);
 const permissionCodeById = ref(new Map());
 const permissionIdByCode = ref(new Map());

const toAutocompleteValues = (list) => {
  if (!Array.isArray(list)) {
    return [];
  }
  return list
    .map((value) => ({ value: String(value) }))
    .filter((item) => item.value.trim());
};

const fetchRealNameSuggestions = async (queryString, callback) => {
  try {
    const res = await request.get('/users/real-name-suggestions', {
      params: { q: queryString }
    });
    callback(toAutocompleteValues(res));
  } catch {
    callback([]);
  }
};

const fetchCompanyNameSuggestions = async (queryString, callback) => {
  try {
    const res = await request.get('/users/company-name-suggestions', {
      params: { q: queryString }
    });
    callback(toAutocompleteValues(res));
  } catch {
    callback([]);
  }
};

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

const roleFilterOptions = computed(() => roleList.value.map(role => ({
  value: role.roleCode,
  label: role.roleName
})));

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

 const splitIdsByType = (ids = []) => {
   const modules = [];
   ids.forEach(id => {
     const code = permissionCodeById.value.get(id);
     if (!code) return;
     if (code.startsWith('module:')) {
       modules.push(id);
     }
   });
   return { modules };
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

const defaultFilters = {
  keyword: '',
  roleCode: 'all',
  departmentName: 'all',
  companyName: '',
  stationId: 'all',
  status: 'all'
};
const filters = ref({ ...defaultFilters });
const simpleFilterSummaryText = computed(() => {
  const parts = [];
  const keyword = String(filters.value.keyword || '').trim();
  const companyName = String(filters.value.companyName || '').trim();
  if (keyword) parts.push(`姓名=${keyword}`);
  if (companyName) parts.push(`公司=${companyName}`);
  if (filters.value.roleCode !== 'all') parts.push(`角色=${filters.value.roleCode}`);
  if (filters.value.departmentName !== 'all') parts.push(`部门=${filters.value.departmentName}`);
  if (filters.value.stationId !== 'all') parts.push(`场站=${filters.value.stationId}`);
  if (filters.value.status !== 'all') parts.push(`状态=${Number(filters.value.status) === 1 ? '启用' : '禁用'}`);
  return parts.length ? `当前筛选：${parts.join('，')}` : '当前筛选：全部';
});

const pagination = ref({
  page: 1,
  pageSize: 5,
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
      keyword: filters.value.keyword?.trim() || undefined,
      companyName: filters.value.companyName?.trim() || undefined,
      roleCode: filters.value.roleCode === 'all' ? undefined : (mapPositionToRoleCode(filters.value.roleCode) || undefined),
      departmentName: filters.value.departmentName === 'all' ? undefined : filters.value.departmentName,
      stationId: filters.value.stationId === 'all' ? undefined : filters.value.stationId,
      status: filters.value.status === 'all' ? undefined : filters.value.status
    };
    const res = await request.get('/users', { params });
    const list = Array.isArray(res.list) ? res.list.map(normalizeUser) : [];
    const filteredList = list.filter(item => item.username !== DEV_TEST_USERNAME);
    const removedCount = list.length - filteredList.length;
    userList.value = filteredList;
    const totalValue = Number.isFinite(res.total) ? res.total : 0;
    const adjustedTotal = totalValue - removedCount;
    pagination.value.total = adjustedTotal > 0 ? adjustedTotal : 0;
  } catch (e) {
    
  } finally {
    loading.value = false;
  }
};

const normalizeOptionalTrim = (value) => {
  const text = typeof value === 'string' ? value.trim() : '';
  return text ? text : undefined;
};

const buildListParams = ({ page, pageSize }) => ({
  page,
  pageSize,
  keyword: normalizeOptionalTrim(filters.value.keyword),
  companyName: normalizeOptionalTrim(filters.value.companyName),
  roleCode: filters.value.roleCode === 'all' ? undefined : (mapPositionToRoleCode(filters.value.roleCode) ?? undefined),
  departmentName: filters.value.departmentName === 'all' ? undefined : filters.value.departmentName,
  stationId: filters.value.stationId === 'all' ? undefined : filters.value.stationId,
  status: filters.value.status === 'all' ? undefined : filters.value.status
});

const exportUsers = async () => {
  if (!canEditUser.value) return;
  exporting.value = true;
  try {
    const { rows } = await fetchAllPaged({
      pageSize: 5000,
      fetchPage: async ({ page, pageSize }) => {
        const res = await request.get('/users', { params: buildListParams({ page, pageSize }) });
        const list = Array.isArray(res?.list) ? res.list.map(normalizeUser) : [];
        const filteredList = list.filter(item => item.username !== DEV_TEST_USERNAME);
        return { list: filteredList, total: res?.total };
      }
    });

    const columns = [
      { label: '用户名', value: row => row.username ?? '' },
      { label: '密码', value: () => '******' },
      { label: '姓名', value: row => row.realName ?? row.real_name ?? '' },
      { label: '部门', value: row => row.departmentName ?? row.department_name ?? '-' },
      { label: '公司', value: row => row.companyName ?? row.company_name ?? '-' },
      { label: '角色', value: row => getPositionLabel(row.roleCode) ?? '' },
      { label: '手机号', value: row => row.phone ?? '' },
      { label: '邮箱', value: row => row.email ?? '' },
      { label: '所属场站', value: row => Array.isArray(row.scheduleStations) ? row.scheduleStations.map(s => s.stationName).join(', ') : '-' },
      { label: '创建时间', value: row => formatDateTime(row.createdAt) },
      { label: '状态', value: row => (row.status === 1 ? '启用' : '禁用') }
    ];

    const pageTitle = typeof route?.meta?.title === 'string' ? route.meta.title : '用户管理';
    const fileName = buildExportFileName({ title: pageTitle });
    await exportRowsToXlsx({ title: pageTitle, fileName, sheetName: pageTitle, columns, rows });
  } catch (error) {
    const message = typeof error?.message === 'string' && error.message.trim() ? error.message : '导出失败';
    ElMessage.error(message);
  } finally {
    exporting.value = false;
  }
};

const handleSearch = () => {
  pagination.value.page = 1;
  loadList();
};

const resetFilters = () => {
  filters.value = { ...defaultFilters };
  pagination.value.page = 1;
  loadList();
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
    const res = await request.get('/stations/all');
    const list = (res.list || res || []).map(normalizeStation);
    stationList.value = list.length > 0 ? list : [];
  } catch (e) {
    stationList.value = [];
  }
};

const loadDepartments = async () => {
  try {
    const res = await request.get('/departments', { params: { pageSize: 50 } });
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
   } catch (e) {
     allPermissions.value = [];
     permissionCodeById.value = new Map();
     permissionIdByCode.value = new Map();
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
    status: 1
   };
   allowPermissionIds.value = [];
   denyPermissionIds.value = [];
   selectedModulePermissionIds.value = [];
   baseModulePermissionIds.value = [];
   dialogVisible.value = true;
 };

 const applyBasePermissions = async (roleCode, overrides = {}) => {
   if (!roleCode) {
     baseModulePermissionIds.value = [];
     selectedModulePermissionIds.value = [];
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
     const { modules: baseModules } = splitIdsByType(permissionIds);
     baseModulePermissionIds.value = expandModulesWithChildren(baseModules);

     const { allowIds = [], denyIds = [] } = overrides;
     const { modules: allowModules } = splitIdsByType(allowIds);
     const { modules: denyModules } = splitIdsByType(denyIds);

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
   const baseModuleSet = new Set(baseModulePermissionIds.value || []);
   const selectedModuleSet = new Set(selectedModulePermissionIds.value || []);

   const allowModuleIds = Array.from(selectedModuleSet).filter(id => !baseModuleSet.has(id));
   const denyModuleIds = Array.from(baseModuleSet).filter(id => !selectedModuleSet.has(id));

   return {
     allowPermissionIds: [...allowModuleIds],
     denyPermissionIds: [...denyModuleIds]
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

const triggerImport = () => {
  if (importPreviewLoading.value) return;
  if (!importFileInputRef.value) return;
  importFileInputRef.value.click();
};

const isExcelFile = (file) => {
  const mime = file?.type;
  return mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || mime === 'application/vnd.ms-excel';
};

const handleImportFileSelected = async (event) => {
  const file = event?.target?.files?.[0];
  if (event?.target) event.target.value = '';
  if (!file) return;

  if (!isExcelFile(file)) {
    ElMessage.error('只能上传 Excel 文件');
    return;
  }
  if (file.size / 1024 / 1024 >= 5) {
    ElMessage.error('文件大小不能超过 5MB');
    return;
  }

  importFile.value = file;
  importPreviewLoading.value = true;

  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

    const rows = jsonData.slice(1).filter(row => row.length > 0 && row[0]);
    if (rows.length === 0) {
      ElMessage.warning('没有找到有效数据');
      return;
    }
    if (rows.length > 100) {
      ElMessage.warning('一次最多导入 100 条数据');
      return;
    }

    const positionNameToCode = buildPositionNameToCode();
    const users = rows.map((row) => {
      const positionName = row[4]?.toString().trim() || '';
      const roleCode = positionNameToCode[positionName] || '';

      return {
        username: row[0]?.toString().trim() || '',
        realName: row[1]?.toString().trim() || '',
        companyName: row[2]?.toString().trim() || '',
        departmentName: row[3]?.toString().trim() || '',
        roleCode,
        phone: row[5]?.toString().trim() || '',
        email: row[6]?.toString().trim() || '',
        stationName: row[7]?.toString().trim() || ''
      };
    });

    importPayloadUsers.value = users;
    const res = await request.post('/users/batch-import-preview', { users });
    importPreviewSummary.value = res?.summary ?? {};
    importPreviewRows.value = Array.isArray(res?.rows) ? res.rows : [];
    importPreviewTruncated.value = !!res?.truncated;
    importPreviewMaxRows.value = typeof res?.maxRows === 'number' ? res.maxRows : 0;
    importPreviewVisible.value = true;
  } catch (err) {
    ElMessage.error(err?.message || '文件解析失败，请检查文件格式');
  } finally {
    importPreviewLoading.value = false;
  }
};

const confirmImport = async () => {
  const users = Array.isArray(importPayloadUsers.value) ? importPayloadUsers.value : [];
  if (users.length === 0) {
    ElMessage.warning('没有可导入的数据');
    return;
  }

  importSubmitting.value = true;
  try {
    const res = await request.post('/users/batch-import', { users });
    const count = typeof res?.count === 'number' ? res.count : users.length;
    ElMessage.success(`导入完成：处理${count}条（密码不覆盖，仅对新增生效）`);
    importPreviewVisible.value = false;
    importPayloadUsers.value = [];
    importFile.value = null;
    loadList();
  } finally {
    importSubmitting.value = false;
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
  overflow-x: hidden;

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
    flex-wrap: wrap;
  }

  .filter-card {
    margin-bottom: 20px;
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
    flex-wrap: wrap;
    gap: 8px;
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

  .user-management-page :deep(.el-table__cell.is-right),
  .user-management-page :deep(.el-table__cell.is-left) {
    position: static !important;
  }
}
</style>

