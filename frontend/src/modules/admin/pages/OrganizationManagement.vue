<template>
  <div class="organization-management-page">
    <div class="page-header">
      <h2>组织架构管理</h2>
    </div>

    <el-tabs v-model="activeTab" type="card">
      <!-- 场站管理 -->
      <el-tab-pane v-if="canViewStation" label="场站管理" name="station">
        <div class="tab-header">
          <el-button v-if="canEditStation" type="primary" @click="showAddStationDialog">
            <el-icon><Plus /></el-icon>新增场站
          </el-button>
        </div>
        <el-card class="filter-card">
          <FilterBar>
            <div class="filter-item">
              <span class="filter-label">场站名称</span>
              <FilterAutocomplete
                v-model="stationFilters.keyword"
                :fetch-suggestions="fetchStationKeywordSuggestions"
                trigger-on-focus
                placeholder="全部"
                clearable
                @select="loadStations"
                @input="loadStations"
                @clear="loadStations"
                @keyup.enter="loadStations"
              />
            </div>
          </FilterBar>
        </el-card>

        <el-table :data="stationList" stripe border v-loading="stationLoading">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column label="场站名称" min-width="150">
            <template #default="{ row }">
              {{ row.stationName || row.station_name }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
                {{ row.status === 'active' ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="描述" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.description || '-' }}
            </template>
          </el-table-column>
          <el-table-column v-if="canEditStation" label="操作" width="150">
            <template #default="{ row }">
              <el-button link type="primary" @click="editStation(row)">编辑</el-button>
              <el-button link type="danger" @click="deleteStation(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="stationPagination.page"
            v-model:page-size="stationPagination.pageSize"
            :total="stationPagination.total"
            :page-sizes="[5, 10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @current-change="loadStations"
            @size-change="loadStations"
          />
        </div>
      </el-tab-pane>

      <!-- 部门管理 -->
      <el-tab-pane v-if="canViewDepartment" label="部门管理" name="department">
        <div class="tab-header">
          <el-button v-if="canEditDepartment" type="primary" @click="showAddDeptDialog">
            <el-icon><Plus /></el-icon>新增部门
          </el-button>
        </div>
        <el-card class="filter-card">
          <FilterBar>
            <div class="filter-item">
              <span class="filter-label">部门名称</span>
              <FilterAutocomplete
                v-model="deptFilters.keyword"
                :fetch-suggestions="fetchDeptKeywordSuggestions"
                trigger-on-focus
                placeholder="全部"
                clearable
                @select="loadDepartments"
                @input="loadDepartments"
                @clear="loadDepartments"
                @keyup.enter="loadDepartments"
              />
            </div>
          </FilterBar>
        </el-card>

        <el-table :data="deptList" stripe border v-loading="deptLoading">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column label="部门名称" min-width="150">
            <template #default="{ row }">
              {{ row.dept_name }}
            </template>
          </el-table-column>
          <el-table-column label="部门编码" width="120">
            <template #default="{ row }">
              {{ row.dept_code || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
                {{ row.status === 'active' ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="描述" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.description || '-' }}
            </template>
          </el-table-column>
          <el-table-column v-if="canEditDepartment" label="操作" width="150">
            <template #default="{ row }">
              <el-button link type="primary" @click="editDept(row)">编辑</el-button>
              <el-button link type="danger" @click="deleteDept(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="deptPagination.page"
            v-model:page-size="deptPagination.pageSize"
            :total="deptPagination.total"
            :page-sizes="[5, 10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @current-change="loadDepartments"
            @size-change="loadDepartments"
          />
        </div>
      </el-tab-pane>

      <!-- 公司管理 -->
      <el-tab-pane v-if="canViewCompany" label="公司管理" name="company">
        <div class="tab-header">
          <el-button v-if="canEditCompany" type="primary" @click="showAddCompanyDialog">
            <el-icon><Plus /></el-icon>新增公司
          </el-button>
        </div>
        <el-card class="filter-card">
          <FilterBar>
            <div class="filter-item">
              <span class="filter-label">公司名称</span>
              <FilterAutocomplete
                v-model="companyFilters.keyword"
                :fetch-suggestions="fetchCompanyKeywordSuggestions"
                trigger-on-focus
                placeholder="全部"
                clearable
                @select="loadCompanies"
                @input="loadCompanies"
                @clear="loadCompanies"
                @keyup.enter="loadCompanies"
              />
            </div>
          </FilterBar>
        </el-card>

        <el-table :data="companyList" stripe border v-loading="companyLoading">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column label="公司名称" min-width="200">
            <template #default="{ row }">
              {{ row.company_name }}
            </template>
          </el-table-column>
          <el-table-column label="公司编码" width="120">
            <template #default="{ row }">
              {{ row.company_code || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
                {{ row.status === 'active' ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="描述" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.description || '-' }}
            </template>
          </el-table-column>
          <el-table-column v-if="canEditCompany" label="操作" width="150">
            <template #default="{ row }">
              <el-button link type="primary" @click="editCompany(row)">编辑</el-button>
              <el-button link type="danger" @click="deleteCompanyRow(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="companyPagination.page"
            v-model:page-size="companyPagination.pageSize"
            :total="companyPagination.total"
            :page-sizes="[5, 10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @current-change="loadCompanies"
            @size-change="loadCompanies"
          />
        </div>
      </el-tab-pane>

      <!-- 角色管理 -->
      <el-tab-pane v-if="canViewRole" label="角色管理" name="role">
        <div class="tab-header">
          <el-button v-if="canEditRole" type="primary" @click="showAddRoleDialog">
            <el-icon><Plus /></el-icon>新增角色
          </el-button>
        </div>
        <el-card class="filter-card">
          <FilterBar>
            <div class="filter-item">
              <span class="filter-label">角色名称</span>
              <FilterAutocomplete
                v-model="roleFilters.keyword"
                :fetch-suggestions="fetchRoleKeywordSuggestions"
                trigger-on-focus
                placeholder="全部"
                clearable
              />
            </div>
          </FilterBar>
        </el-card>

        <el-table :data="filteredRoleList" stripe border v-loading="roleLoading">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="roleName" label="角色名称" min-width="140" />
          <el-table-column prop="roleCode" label="角色编码" min-width="140" />
          <el-table-column prop="baseRoleName" label="基准角色" min-width="140">
            <template #default="{ row }">
              {{ row.baseRoleName || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
          <el-table-column v-if="canEditRole" label="操作" width="150">
            <template #default="{ row }">
              <el-button link type="primary" @click="editRole(row)">编辑</el-button>
              <el-button
                link
                type="danger"
                :disabled="systemRoleCodes.has(row.roleCode)"
                @click="deleteRole(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 场站编辑对话框 -->
    <FormDialog
      v-model="stationDialogVisible"
      :title="isStationEdit ? '编辑场站' : '新增场站'"
      width="500px"
      :confirm-text="'保存'"
      :cancel-text="'取消'"
      :confirm-loading="stationSaving"
      @confirm="saveStation"
    >
      <el-form :model="stationForm" :rules="stationRules" ref="stationFormRef" label-width="100px">
        <el-form-item label="场站名称" prop="stationName">
          <el-input v-model="stationForm.stationName" placeholder="请输入场站名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="stationForm.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="stationForm.status"
            active-value="active"
            inactive-value="inactive"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>
    </FormDialog>

    <!-- 部门编辑对话框 -->
    <FormDialog
      v-model="deptDialogVisible"
      :title="isDeptEdit ? '编辑部门' : '新增部门'"
      width="500px"
      :confirm-text="'保存'"
      :cancel-text="'取消'"
      :confirm-loading="deptSaving"
      @confirm="saveDept"
    >
      <el-form :model="deptForm" :rules="deptRules" ref="deptFormRef" label-width="100px">
        <el-form-item label="部门名称" prop="dept_name">
          <el-input v-model="deptForm.dept_name" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item label="部门编码">
          <el-input v-model="deptForm.dept_code" placeholder="请输入部门编码（可选）" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="deptForm.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="deptForm.status"
            active-value="active"
            inactive-value="inactive"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>
    </FormDialog>

    <!-- 公司编辑对话框 -->
    <FormDialog
      v-model="companyDialogVisible"
      :title="isCompanyEdit ? '编辑公司' : '新增公司'"
      width="500px"
      :confirm-text="'保存'"
      :cancel-text="'取消'"
      :confirm-loading="companySaving"
      @confirm="saveCompany"
    >
      <el-form :model="companyForm" :rules="companyRules" ref="companyFormRef" label-width="100px">
        <el-form-item label="公司名称" prop="company_name">
          <el-input v-model="companyForm.company_name" placeholder="请输入公司名称" />
        </el-form-item>
        <el-form-item label="公司编码">
          <el-input v-model="companyForm.company_code" placeholder="请输入公司编码（可选）" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="companyForm.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="companyForm.status"
            active-value="active"
            inactive-value="inactive"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>
    </FormDialog>

    <!-- 角色编辑对话框 -->
    <FormDialog
      v-model="roleDialogVisible"
      :title="isRoleEdit ? '编辑角色' : '新增角色'"
      width="720px"
      :confirm-text="'保存'"
      :cancel-text="'取消'"
      :confirm-loading="roleSaving"
      @confirm="saveRole"
    >
      <el-form :model="roleForm" :rules="roleRules" ref="roleFormRef" label-width="110px">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="roleForm.roleName" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色编码" prop="roleCode">
          <el-input v-model="roleForm.roleCode" :disabled="isRoleEdit" placeholder="请输入角色编码" />
        </el-form-item>
        <el-form-item label="基准角色" prop="baseRoleCode">
          <el-select v-model="roleForm.baseRoleCode" placeholder="选择基准角色" @change="handleBaseRoleChange">
            <el-option
              v-for="role in baseRoleOptions"
              :key="role.roleCode"
              :label="`${role.roleName} (${role.roleCode})`"
              :value="role.roleCode"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="roleForm.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="菜单权限">
          <el-tree
            ref="menuTreeRef"
            :data="menuPermissionTree"
            node-key="id"
            show-checkbox
            default-expand-all
            :props="{ label: 'name', children: 'children' }"
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
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import FilterBar from '@/components/common/FilterBar.vue'
import { getAllStations, getStations, createStation, updateStation, deleteStation as deleteStationApi } from '@/api/station'
import { getDepartments, createDepartment, updateDepartment, deleteDepartment as deleteDepartmentApi } from '@/api/department'
import { getCompanies, createCompany, updateCompany, deleteCompany as deleteCompanyApi } from '@/api/company'
import roleApi from '@/api/role'
import permissionApi from '@/api/permission'
import ModulePermissionConfig from '@/modules/admin/components/ModulePermissionConfig.vue'
import FormDialog from '@/components/system/FormDialog.vue'
import { useUserStore } from '@/store/modules/user'
import { createListSuggestionFetcher } from '@/utils/filterAutocomplete'

const userStore = useUserStore()

// 权限检查
const hasPermission = (code) => userStore.permissionCodes.includes(code)

// 场站权限
const canViewStation = computed(() => hasPermission('module:organization:station:view'))
const canEditStation = computed(() => hasPermission('module:organization:station:edit'))

// 部门权限
const canViewDepartment = computed(() => hasPermission('module:organization:department:view'))
const canEditDepartment = computed(() => hasPermission('module:organization:department:edit'))

// 公司权限
const canViewCompany = computed(() => hasPermission('module:organization:company:view'))
const canEditCompany = computed(() => hasPermission('module:organization:company:edit'))

// 角色权限
const canViewRole = computed(() => hasPermission('module:organization:role:view'))
const canEditRole = computed(() => hasPermission('module:organization:role:edit'))

// 默认选中第一个有权限的选项卡
const defaultTab = computed(() => {
  if (canViewStation.value) return 'station'
  if (canViewDepartment.value) return 'department'
  if (canViewCompany.value) return 'company'
  if (canViewRole.value) return 'role'
  return 'station'
})

const activeTab = ref('')

// ==================== 场站管理 ====================
const stationFormRef = ref(null)
const stationList = ref([])
// Auto-complete suggestions should not depend on table pagination (default pageSize=5).
const stationSuggestionList = ref([])
const stationLoading = ref(false)
const stationDialogVisible = ref(false)
const isStationEdit = ref(false)
const stationSaving = ref(false)

const fetchStationKeywordSuggestions = createListSuggestionFetcher(
  () => stationSuggestionList.value,
  (row) => row.stationName || row.station_name || row.name
)

const stationFilters = ref({
  keyword: ''
})

const stationPagination = ref({
  page: 1,
  pageSize: 5,
  total: 0
})

const stationForm = ref({
  stationName: '',
  description: '',
  status: 'active'
})

const stationRules = {
  stationName: [{ required: true, message: '请输入场站名称', trigger: 'blur' }]
}

const loadStationSuggestions = async () => {
  try {
    const res = await getAllStations()
    stationSuggestionList.value = res?.data || res || []
  } catch (e) {
    stationSuggestionList.value = []
  }
}

const loadStations = async () => {
  stationLoading.value = true
  try {
    const params = {
      page: stationPagination.value.page,
      pageSize: stationPagination.value.pageSize,
      keyword: stationFilters.value.keyword || undefined
    }
    const res = await getStations(params)
    stationList.value = res.list || []
    stationPagination.value.total = res.total || 0
  } catch (e) {
    } finally {
    stationLoading.value = false
  }
}

const showAddStationDialog = () => {
  isStationEdit.value = false
  stationForm.value = {
    stationName: '',
    description: '',
    status: 'active'
  }
  stationDialogVisible.value = true
}

const editStation = (row) => {
  isStationEdit.value = true
  stationForm.value = {
    id: row.id,
    stationName: row.stationName || row.station_name,
    description: row.description || '',
    status: row.status || 'active'
  }
  stationDialogVisible.value = true
}

const saveStation = async () => {
  await stationFormRef.value.validate()
  stationSaving.value = true
  try {
    const data = {
      stationName: stationForm.value.stationName,
      description: stationForm.value.description,
      status: stationForm.value.status
    }

    if (isStationEdit.value) {
      await updateStation(stationForm.value.id, data)
    } else {
      await createStation(data)
    }
    ElMessage.success('保存成功')
    stationDialogVisible.value = false
    loadStationSuggestions()
    loadStations()
  } catch (e) {
    } finally {
    stationSaving.value = false
  }
}

const deleteStation = async (row) => {
  const name = row.stationName || row.station_name
  await ElMessageBox.confirm(`确定删除场站 "${name}" 吗？删除后该场站下的用户将无法登录。`, '提示', { type: 'warning' })
  try {
    await deleteStationApi(row.id)
    ElMessage.success('删除成功')
    loadStationSuggestions()
    loadStations()
  } catch (e) {
    }
}

// ==================== 部门管理 ====================
const deptFormRef = ref(null)
const deptList = ref([])
const deptSuggestionList = ref([])
const deptLoading = ref(false)
const deptDialogVisible = ref(false)
const isDeptEdit = ref(false)
const deptSaving = ref(false)

const fetchDeptKeywordSuggestions = createListSuggestionFetcher(
  () => deptSuggestionList.value,
  (row) => row.dept_name
)

const deptFilters = ref({
  keyword: ''
})

const deptPagination = ref({
  page: 1,
  pageSize: 5,
  total: 0
})

const deptForm = ref({
  dept_name: '',
  dept_code: '',
  description: '',
  status: 'active'
})

const deptRules = {
  dept_name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }]
}

const loadDepartments = async () => {
  deptLoading.value = true
  try {
    const params = {
      page: deptPagination.value.page,
      pageSize: deptPagination.value.pageSize,
      keyword: deptFilters.value.keyword || undefined
    }
    const res = await getDepartments(params)
    deptList.value = res.list || []
    deptPagination.value.total = res.total || 0
    loadDeptSuggestions(params)
  } catch (e) {
    } finally {
    deptLoading.value = false
  }
}

const loadDeptSuggestions = async (baseParams) => {
  try {
    const params = {
      ...baseParams,
      page: 1,
      pageSize: 5000
    }
    const res = await getDepartments(params)
    deptSuggestionList.value = res.list || []
  } catch (e) {
    deptSuggestionList.value = []
  }
}

const showAddDeptDialog = () => {
  isDeptEdit.value = false
  deptForm.value = {
    dept_name: '',
    dept_code: '',
    description: '',
    status: 'active'
  }
  deptDialogVisible.value = true
}

const editDept = (row) => {
  isDeptEdit.value = true
  deptForm.value = {
    id: row.id,
    dept_name: row.dept_name,
    dept_code: row.dept_code || '',
    description: row.description || '',
    status: row.status || 'active'
  }
  deptDialogVisible.value = true
}

const saveDept = async () => {
  await deptFormRef.value.validate()
  deptSaving.value = true
  try {
    const data = {
      dept_name: deptForm.value.dept_name,
      dept_code: deptForm.value.dept_code,
      description: deptForm.value.description,
      status: deptForm.value.status
    }

    if (isDeptEdit.value) {
      await updateDepartment(deptForm.value.id, data)
    } else {
      await createDepartment(data)
    }
    ElMessage.success('保存成功')
    deptDialogVisible.value = false
    loadDepartments()
  } catch (e) {
    } finally {
    deptSaving.value = false
  }
}

const deleteDept = async (row) => {
  await ElMessageBox.confirm(`确定删除部门 "${row.dept_name}" 吗？`, '提示', { type: 'warning' })
  try {
    await deleteDepartmentApi(row.id)
    ElMessage.success('删除成功')
    loadDepartments()
  } catch (e) {
    }
}

// ==================== 公司管理 ====================
const companyFormRef = ref(null)
const companyList = ref([])
const companySuggestionList = ref([])
const companyLoading = ref(false)
const companyDialogVisible = ref(false)
const isCompanyEdit = ref(false)
const companySaving = ref(false)

const fetchCompanyKeywordSuggestions = createListSuggestionFetcher(
  () => companySuggestionList.value,
  (row) => row.company_name
)

const companyFilters = ref({
  keyword: ''
})

const companyPagination = ref({
  page: 1,
  pageSize: 5,
  total: 0
})

const companyForm = ref({
  company_name: '',
  company_code: '',
  description: '',
  status: 'active'
})

const companyRules = {
  company_name: [{ required: true, message: '请输入公司名称', trigger: 'blur' }]
}

const loadCompanies = async () => {
  companyLoading.value = true
  try {
    const params = {
      page: companyPagination.value.page,
      pageSize: companyPagination.value.pageSize,
      keyword: companyFilters.value.keyword || undefined
    }
    const res = await getCompanies(params)
    companyList.value = res.list || []
    companyPagination.value.total = res.total || 0
    loadCompanySuggestions(params)
  } catch (e) {
    } finally {
    companyLoading.value = false
  }
}

const loadCompanySuggestions = async (baseParams) => {
  try {
    const params = {
      ...baseParams,
      page: 1,
      pageSize: 5000
    }
    const res = await getCompanies(params)
    companySuggestionList.value = res.list || []
  } catch (e) {
    companySuggestionList.value = []
  }
}

const showAddCompanyDialog = () => {
  isCompanyEdit.value = false
  companyForm.value = {
    company_name: '',
    company_code: '',
    description: '',
    status: 'active'
  }
  companyDialogVisible.value = true
}

const editCompany = (row) => {
  isCompanyEdit.value = true
  companyForm.value = {
    id: row.id,
    company_name: row.company_name,
    company_code: row.company_code || '',
    description: row.description || '',
    status: row.status || 'active'
  }
  companyDialogVisible.value = true
}

const saveCompany = async () => {
  await companyFormRef.value.validate()
  companySaving.value = true
  try {
    const data = {
      company_name: companyForm.value.company_name,
      company_code: companyForm.value.company_code,
      description: companyForm.value.description,
      status: companyForm.value.status
    }

    if (isCompanyEdit.value) {
      await updateCompany(companyForm.value.id, data)
    } else {
      await createCompany(data)
    }
    ElMessage.success('保存成功')
    companyDialogVisible.value = false
    loadCompanies()
  } catch (e) {
    } finally {
    companySaving.value = false
  }
}

const deleteCompanyRow = async (row) => {
  await ElMessageBox.confirm(`确定删除公司 "${row.company_name}" 吗？`, '提示', { type: 'warning' })
  try {
    await deleteCompanyApi(row.id)
    ElMessage.success('删除成功')
    loadCompanies()
  } catch (e) {
    }
}

// ==================== 角色管理 ====================
const roleFormRef = ref(null)
const menuTreeRef = ref(null)
const roleList = ref([])
const roleLoading = ref(false)
const roleDialogVisible = ref(false)
const isRoleEdit = ref(false)
const roleSaving = ref(false)
const roleFilters = ref({
  keyword: ''
})

const roleForm = ref({
  id: null,
  roleName: '',
  roleCode: '',
  baseRoleCode: '',
  description: ''
})

const roleRules = {
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  roleCode: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
  baseRoleCode: [{ required: true, message: '请选择基准角色', trigger: 'change' }]
}

const systemRoleCodes = new Set([
  'admin',
  'operator',
  'maintenance',
  'station_manager',
  'deputy_manager',
  'department_manager',
  'safety_inspector',
  'senior_management',
  'client'
])

const permissionCodeById = ref(new Map())
const permissionIdByCode = ref(new Map())
const menuPermissionTree = ref([])
const modulePermissions = ref([])
const selectedModulePermissionIds = ref([])
const allPermissions = ref([])

const hiddenRoleCodes = new Set(['dev_test'])
const isHiddenRole = (role) => hiddenRoleCodes.has(role.roleCode) || role.roleName === '开发测试'

const filteredRoleList = computed(() => {
  const visibleRoles = roleList.value.filter(role => !isHiddenRole(role))
  const keyword = roleFilters.value.keyword?.trim()
  if (!keyword) return visibleRoles
  const normalized = keyword.toLowerCase()
  return visibleRoles.filter(role => (role?.roleName || '').toLowerCase().includes(normalized))
})

const fetchRoleKeywordSuggestions = createListSuggestionFetcher(
  () => {
    const list = filteredRoleList.value || []
    const values = []
    for (const role of list) {
      if (role?.roleName) values.push(role.roleName)
    }
    return values
  },
  (value) => value
)

const baseRoleOptions = computed(() => roleList.value.filter(role => !isHiddenRole(role)))

const menuCodeToModuleCode = (menuCode) => {
  if (!menuCode || !menuCode.startsWith('menu:/')) return null
  return `module:${menuCode.slice(6)}`
}

const buildTree = (items) => {
  const map = new Map()
  const roots = []
  items.forEach(item => {
    map.set(item.id, { ...item, children: [] })
  })
  map.forEach(node => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId).children.push(node)
    } else {
      roots.push(node)
    }
  })
  return roots
}

const loadPermissions = async () => {
  try {
    const res = await permissionApi.getPermissions()
    const list = res.list || []
    const codeById = new Map()
    const idByCode = new Map()
    list.forEach(item => {
      codeById.set(item.id, item.code)
      idByCode.set(item.code, item.id)
    })
    permissionCodeById.value = codeById
    permissionIdByCode.value = idByCode
    allPermissions.value = list

    const menuPermissions = list.filter(item => item.type === 'menu')
    const moduleList = list.filter(item => item.type === 'module')
    menuPermissionTree.value = buildTree(menuPermissions)
    modulePermissions.value = moduleList
  } catch (e) {
    menuPermissionTree.value = []
    modulePermissions.value = []
    allPermissions.value = []
  }
}

const loadRoles = async () => {
  roleLoading.value = true
  try {
    const res = await roleApi.getRoles()
    roleList.value = res.list || []
  } catch (e) {
    roleList.value = []
  } finally {
    roleLoading.value = false
  }
}

const resetRoleForm = () => {
  roleForm.value = {
    id: null,
    roleName: '',
    roleCode: '',
    baseRoleCode: '',
    description: ''
  }
  selectedModulePermissionIds.value = []
  nextTick(() => {
    menuTreeRef.value?.setCheckedKeys([])
  })
}

const showAddRoleDialog = () => {
  isRoleEdit.value = false
  resetRoleForm()
  roleDialogVisible.value = true
}

const applyRolePermissions = async (roleId) => {
  try {
    const res = await roleApi.getRolePermissions(roleId)
    const permissionIds = res.permissionIds || []
    const menuIds = permissionIds.filter(id => {
      const code = permissionCodeById.value.get(id) || ''
      return code.startsWith('menu:/')
    })
    const moduleIds = permissionIds.filter(id => {
      const code = permissionCodeById.value.get(id) || ''
      return code.startsWith('module:')
    })
    selectedModulePermissionIds.value = moduleIds
    nextTick(() => {
      menuTreeRef.value?.setCheckedKeys(menuIds)
    })
  } catch (e) {
    selectedModulePermissionIds.value = []
    nextTick(() => {
      menuTreeRef.value?.setCheckedKeys([])
    })
  }
}

const handleBaseRoleChange = (baseRoleCode) => {
  if (!baseRoleCode) return
  const baseRole = roleList.value.find(role => role.roleCode === baseRoleCode)
  if (!baseRole) return
  applyRolePermissions(baseRole.id)
}

const editRole = async (row) => {
  isRoleEdit.value = true
  roleForm.value = {
    id: row.id,
    roleName: row.roleName,
    roleCode: row.roleCode,
    baseRoleCode: row.baseRoleCode || row.roleCode,
    description: row.description || ''
  }
  roleDialogVisible.value = true
  await applyRolePermissions(row.id)
}

const buildSelectedPermissionIds = () => {
  const menuChecked = menuTreeRef.value?.getCheckedKeys() || []
  const menuHalfChecked = menuTreeRef.value?.getHalfCheckedKeys() || []
  const menuIds = [...new Set([...menuChecked, ...menuHalfChecked])]
  const moduleIds = [...new Set(selectedModulePermissionIds.value || [])]

  const moduleIdsFromMenus = menuIds
    .map(id => permissionCodeById.value.get(id))
    .map(menuCode => menuCodeToModuleCode(menuCode))
    .map(moduleCode => permissionIdByCode.value.get(moduleCode))
    .filter(Boolean)

  return Array.from(new Set([...menuIds, ...moduleIds, ...moduleIdsFromMenus]))
}

const saveRole = async () => {
  await roleFormRef.value.validate()
  roleSaving.value = true
  try {
    const permissionIds = buildSelectedPermissionIds()
    const payload = {
      roleName: roleForm.value.roleName,
      roleCode: roleForm.value.roleCode,
      baseRoleCode: roleForm.value.baseRoleCode,
      description: roleForm.value.description,
      permissionIds
    }

    if (isRoleEdit.value) {
      await roleApi.updateRole(roleForm.value.id, payload)
      ElMessage.success('保存成功')
    } else {
      await roleApi.createRole(payload)
      ElMessage.success('新增成功')
    }

    roleDialogVisible.value = false
    loadRoles()
  } catch (e) {
    
  } finally {
    roleSaving.value = false
  }
}

const deleteRole = async (row) => {
  await ElMessageBox.confirm(`确定删除角色 "${row.roleName}" 吗？`, '提示', { type: 'warning' })
  try {
    await roleApi.deleteRole(row.id)
    ElMessage.success('删除成功')
    loadRoles()
  } catch (e) {
    
  }
}

onMounted(() => {
  activeTab.value = defaultTab.value
  loadStationSuggestions()
  loadStations()
  loadDepartments()
  loadCompanies()
  loadPermissions()
  loadRoles()
})
</script>

<style lang="scss" scoped>
.organization-management-page {
  .page-header {
    margin-bottom: 20px;

    h2 {
      margin: 0;
      font-size: 20px;
    }
  }

  .tab-header {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: flex-start;
    margin-bottom: 20px;
    padding: 16px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }

  .filter-card {
    margin-bottom: 20px;
  }

  .el-table {
    border-radius: 8px;
    overflow: hidden;
  }

  :deep(.el-table__body-wrapper),
  :deep(.el-table__header-wrapper) {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-x pan-y;
  }

  :deep(.el-table__body),
  :deep(.el-table__header) {
    min-width: max-content;
  }

  :deep(.el-table .el-scrollbar__wrap) {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-x pan-y;
  }

  :deep(.el-tabs__nav-wrap) {
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-x;
  }

  :deep(.el-tabs__nav-scroll) {
    width: max-content;
  }

  :deep(.el-tabs__nav) {
    flex-wrap: nowrap;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
    background: #fff;
    padding: 16px;
    border-radius: 8px;
  }

  :deep(.el-tabs__content) {
    padding: 16px 0;
  }
}
</style>

