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
          <el-button v-if="canEditStation" type="info" @click="downloadImportTemplate('station')">
            <el-icon><Download /></el-icon>下载模板
          </el-button>
          <BaseUpload
            v-if="canEditStation"
            :auto-upload="false"
            :show-file-list="false"
            accept=".xlsx,.xls"
            :on-change="(file) => handleImportFileChange('station', file)"
          >
            <el-button type="success">
              <el-icon><Download /></el-icon>批量导入
            </el-button>
          </BaseUpload>
          <el-button type="primary" :loading="stationExporting" @click="exportStations">
            <el-icon><Upload /></el-icon>批量导出
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
              {{ row.location || row.description || '-' }}
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
          <el-button v-if="canEditDepartment" type="info" @click="downloadImportTemplate('department')">
            <el-icon><Download /></el-icon>下载模板
          </el-button>
          <BaseUpload
            v-if="canEditDepartment"
            :auto-upload="false"
            :show-file-list="false"
            accept=".xlsx,.xls"
            :on-change="(file) => handleImportFileChange('department', file)"
          >
            <el-button type="success">
              <el-icon><Download /></el-icon>批量导入
            </el-button>
          </BaseUpload>
          <el-button type="primary" :loading="deptExporting" @click="exportDepartments">
            <el-icon><Upload /></el-icon>批量导出
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
          <el-button v-if="canEditCompany" type="info" @click="downloadImportTemplate('company')">
            <el-icon><Download /></el-icon>下载模板
          </el-button>
          <BaseUpload
            v-if="canEditCompany"
            :auto-upload="false"
            :show-file-list="false"
            accept=".xlsx,.xls"
            :on-change="(file) => handleImportFileChange('company', file)"
          >
            <el-button type="success">
              <el-icon><Download /></el-icon>批量导入
            </el-button>
          </BaseUpload>
          <el-button type="primary" :loading="companyExporting" @click="exportCompanies">
            <el-icon><Upload /></el-icon>批量导出
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
          <el-button v-if="canEditRole" type="info" @click="downloadImportTemplate('role')">
            <el-icon><Download /></el-icon>下载模板
          </el-button>
          <BaseUpload
            v-if="canEditRole"
            :auto-upload="false"
            :show-file-list="false"
            accept=".xlsx,.xls"
            :on-change="(file) => handleImportFileChange('role', file)"
          >
            <el-button type="success">
              <el-icon><Download /></el-icon>批量导入
            </el-button>
          </BaseUpload>
          <el-button type="primary" :loading="roleExporting" @click="exportRoles">
            <el-icon><Upload /></el-icon>批量导出
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

    <FormDialog
      v-model="importDialogVisible"
      :title="importDialogTitle"
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

      <el-alert
        v-else-if="importSkipCount > 0"
        type="warning"
        :closable="false"
        style="margin-bottom: 16px;"
      >
        <template #title>
          <span>发现 {{ importSkipCount }} 条已存在数据，导入时将自动跳过</span>
        </template>
      </el-alert>

      <el-table :data="importPreviewData" border max-height="400">
        <el-table-column prop="rowIndex" label="行号" width="80" />
        <el-table-column
          v-for="col in importPreviewColumns"
          :key="col.prop"
          :prop="col.prop"
          :label="col.label"
          :width="col.width"
          :min-width="col.minWidth"
          show-overflow-tooltip
        />
        <el-table-column label="状态" width="160">
          <template #default="{ row }">
            <el-tag :type="importRowTagType(row)" size="small">
              {{ importRowStatusText(row) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="importing"
          :disabled="importErrors.length > 0 || importOkCount === 0"
          @click="confirmImport"
        >
          确认导入 ({{ importOkCount }} 条)
        </el-button>
      </template>
    </FormDialog>

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
          <el-input v-model="stationForm.location" type="textarea" :rows="3" placeholder="请输入描述" />
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
import { useRoute } from 'vue-router'
import * as XLSX from 'xlsx'

import FilterBar from '@/components/common/FilterBar.vue'
import BaseUpload from '@/components/common/BaseUpload.vue'
import { addTemplateInstructionSheet, applyTemplateHeaderStyle } from '@/utils/excelTemplate'
import { buildExportFileName, exportRowsToXlsx, fetchAllPaged } from '@/utils/tableExport'
import { getAllStations, getStations, createStation, updateStation, deleteStation as deleteStationApi } from '@/api/station'
import { getDepartments, createDepartment, updateDepartment, deleteDepartment as deleteDepartmentApi } from '@/api/department'
import { getCompanies, createCompany, updateCompany, deleteCompany as deleteCompanyApi } from '@/api/company'
import roleApi from '@/api/role'
import permissionApi from '@/api/permission'
import ModulePermissionConfig from '@/modules/admin/components/ModulePermissionConfig.vue'
import FormDialog from '@/components/system/FormDialog.vue'
import { useUserStore } from '@/store/modules/user'
import { createListSuggestionFetcher } from '@/utils/filterAutocomplete'

const route = useRoute()
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

const resolvePageTitle = () => (typeof route?.meta?.title === 'string' ? route.meta.title : '组织架构')
const resolveExportFileName = () => buildExportFileName({ title: resolvePageTitle() })

// ==================== 批量导入（组织架构） ====================
const importDialogVisible = ref(false)
const importing = ref(false)
const importType = ref('')
const importPreviewData = ref([])
const importErrors = ref([])

const resolveImportTypeLabel = (type) => {
  if (type === 'station') return '场站管理'
  if (type === 'department') return '部门管理'
  if (type === 'company') return '公司管理'
  if (type === 'role') return '角色管理'
  return ''
}

const importDialogTitle = computed(() => {
  const label = resolveImportTypeLabel(importType.value)
  return label ? `${label} - 导入预览` : '导入预览'
})

const importOkCount = computed(() => importPreviewData.value.filter(row => row.status === 'ok').length)
const importSkipCount = computed(() => importPreviewData.value.filter(row => row.status === 'skip').length)

const importPreviewColumns = computed(() => {
  if (importType.value === 'station') {
    return [
      { prop: 'stationName', label: '场站名称', minWidth: 180 },
      { prop: 'location', label: '描述', minWidth: 220 },
      { prop: 'statusText', label: '状态', width: 120 }
    ]
  }
  if (importType.value === 'department') {
    return [
      { prop: 'deptName', label: '部门名称', minWidth: 180 },
      { prop: 'deptCode', label: '部门编码', width: 160 },
      { prop: 'description', label: '描述', minWidth: 220 },
      { prop: 'statusText', label: '状态', width: 120 }
    ]
  }
  if (importType.value === 'company') {
    return [
      { prop: 'companyName', label: '公司名称', minWidth: 180 },
      { prop: 'companyCode', label: '公司编码', width: 160 },
      { prop: 'description', label: '描述', minWidth: 220 },
      { prop: 'statusText', label: '状态', width: 120 }
    ]
  }
  if (importType.value === 'role') {
    return [
      { prop: 'roleName', label: '角色名称', minWidth: 180 },
      { prop: 'roleCode', label: '角色编码', width: 180 },
      { prop: 'baseRoleCode', label: '基准角色编码', width: 180 },
      { prop: 'description', label: '描述', minWidth: 220 }
    ]
  }
  return []
})

const importRowTagType = (row) => {
  const status = row?.status
  if (status === 'error') return 'danger'
  if (status === 'skip') return 'info'
  return 'success'
}

const importRowStatusText = (row) => {
  const status = row?.status
  if (status === 'error') return row?.error || '数据错误'
  if (status === 'skip') return '已存在（跳过）'
  return '可导入'
}

const normalizeText = (value) => (value === undefined || value === null ? '' : String(value).trim())

const normalizeStatus = (value) => {
  const text = normalizeText(value)
  if (!text) return 'active'
  if (text === '启用' || text === 'active' || text === '1') return 'active'
  if (text === '禁用' || text === 'inactive' || text === '0') return 'inactive'
  return null
}

const resolveHeaderIndexMap = (headerRow) => {
  const map = new Map()
  const headers = Array.isArray(headerRow) ? headerRow : []
  headers.forEach((value, idx) => {
    const key = normalizeText(value)
    if (key) map.set(key, idx)
  })
  return map
}

const hasRowValue = (row) => {
  const list = Array.isArray(row) ? row : []
  return list.some(value => normalizeText(value))
}

const readUploadFile = (file) => new Promise((resolve, reject) => {
  const raw = file?.raw
  if (!raw) {
    reject(new Error('请选择文件'))
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => resolve(e?.target?.result)
  reader.onerror = reject
  reader.readAsArrayBuffer(raw)
})

const loadAllStations = async () => {
  const { rows } = await fetchAllPaged({
    pageSize: 5000,
    fetchPage: ({ page, pageSize }) => getStations({ page, pageSize })
  })
  return rows
}

const loadAllDepartments = async () => {
  const { rows } = await fetchAllPaged({
    pageSize: 5000,
    fetchPage: ({ page, pageSize }) => getDepartments({ page, pageSize })
  })
  return rows
}

const loadAllCompanies = async () => {
  const { rows } = await fetchAllPaged({
    pageSize: 5000,
    fetchPage: ({ page, pageSize }) => getCompanies({ page, pageSize })
  })
  return rows
}

const ensureRolesLoaded = async () => {
  if (Array.isArray(roleList.value) && roleList.value.length > 0) return
  await loadRoles()
}

const parseStationImport = async ({ headerMap, rows }) => {
  const stationNameCol = headerMap.get('场站名称') ?? headerMap.get('场站') ?? 0
  const descCol = headerMap.get('描述') ?? headerMap.get('地址') ?? 1
  const statusCol = headerMap.get('状态') ?? 2

  const existingRows = await loadAllStations()
  const existingNames = new Set(existingRows.map(r => normalizeText(r.station_name ?? r.stationName ?? r.name)).filter(Boolean))

  return rows.map((row, idx) => {
    const rowIndex = idx + 2
    const stationName = normalizeText(row[stationNameCol])
    const location = normalizeText(row[descCol])
    const resolvedStatus = normalizeStatus(row[statusCol])
    const statusText = resolvedStatus === 'inactive' ? '禁用' : '启用'

    const item = {
      rowIndex,
      stationName,
      location,
      statusValue: resolvedStatus,
      statusText,
      status: 'ok',
      error: null
    }

    if (!stationName) {
      item.status = 'error'
      item.error = '场站名称不能为空'
      return item
    }

    if (existingNames.has(stationName)) {
      item.status = 'skip'
      return item
    }

    if (!resolvedStatus) {
      item.status = 'error'
      item.error = '状态无效（可填 启用/禁用）'
      return item
    }

    return item
  })
}

const parseDepartmentImport = async ({ headerMap, rows }) => {
  const nameCol = headerMap.get('部门名称') ?? 0
  const codeCol = headerMap.get('部门编码') ?? 1
  const descCol = headerMap.get('描述') ?? 2
  const statusCol = headerMap.get('状态') ?? 3

  const existingRows = await loadAllDepartments()
  const existingNames = new Set(existingRows.map(r => normalizeText(r.dept_name)).filter(Boolean))
  const existingCodes = new Set(existingRows.map(r => normalizeText(r.dept_code)).filter(Boolean))

  return rows.map((row, idx) => {
    const rowIndex = idx + 2
    const deptName = normalizeText(row[nameCol])
    const deptCode = normalizeText(row[codeCol])
    const description = normalizeText(row[descCol])
    const resolvedStatus = normalizeStatus(row[statusCol])
    const statusText = resolvedStatus === 'inactive' ? '禁用' : '启用'

    const item = {
      rowIndex,
      deptName,
      deptCode,
      description,
      statusValue: resolvedStatus,
      statusText,
      status: 'ok',
      error: null
    }

    if (!deptName) {
      item.status = 'error'
      item.error = '部门名称不能为空'
      return item
    }

    if (existingNames.has(deptName) || (deptCode && existingCodes.has(deptCode))) {
      item.status = 'skip'
      return item
    }

    if (!resolvedStatus) {
      item.status = 'error'
      item.error = '状态无效（可填 启用/禁用）'
      return item
    }

    return item
  })
}

const parseCompanyImport = async ({ headerMap, rows }) => {
  const nameCol = headerMap.get('公司名称') ?? 0
  const codeCol = headerMap.get('公司编码') ?? 1
  const descCol = headerMap.get('描述') ?? 2
  const statusCol = headerMap.get('状态') ?? 3

  const existingRows = await loadAllCompanies()
  const existingNames = new Set(existingRows.map(r => normalizeText(r.company_name)).filter(Boolean))
  const existingCodes = new Set(existingRows.map(r => normalizeText(r.company_code)).filter(Boolean))

  return rows.map((row, idx) => {
    const rowIndex = idx + 2
    const companyName = normalizeText(row[nameCol])
    const companyCode = normalizeText(row[codeCol])
    const description = normalizeText(row[descCol])
    const resolvedStatus = normalizeStatus(row[statusCol])
    const statusText = resolvedStatus === 'inactive' ? '禁用' : '启用'

    const item = {
      rowIndex,
      companyName,
      companyCode,
      description,
      statusValue: resolvedStatus,
      statusText,
      status: 'ok',
      error: null
    }

    if (!companyName) {
      item.status = 'error'
      item.error = '公司名称不能为空'
      return item
    }

    if (existingNames.has(companyName) || (companyCode && existingCodes.has(companyCode))) {
      item.status = 'skip'
      return item
    }

    if (!resolvedStatus) {
      item.status = 'error'
      item.error = '状态无效（可填 启用/禁用）'
      return item
    }

    return item
  })
}

const parseRoleImport = async ({ headerMap, rows }) => {
  await ensureRolesLoaded()

  const nameCol = headerMap.get('角色名称') ?? 0
  const codeCol = headerMap.get('角色编码') ?? 1
  const baseCol = headerMap.get('基准角色编码') ?? 2
  const descCol = headerMap.get('描述') ?? 3

  const existingNames = new Set(roleList.value.map(r => normalizeText(r.roleName)).filter(Boolean))
  const existingCodes = new Set(roleList.value.map(r => normalizeText(r.roleCode)).filter(Boolean))
  const allowedBaseRoleCodes = new Set(baseRoleOptions.value.map(r => normalizeText(r.roleCode)).filter(Boolean))

  return rows.map((row, idx) => {
    const rowIndex = idx + 2
    const roleName = normalizeText(row[nameCol])
    const roleCode = normalizeText(row[codeCol])
    const baseRoleCode = normalizeText(row[baseCol])
    const description = normalizeText(row[descCol])

    const item = {
      rowIndex,
      roleName,
      roleCode,
      baseRoleCode,
      description,
      status: 'ok',
      error: null
    }

    if (!roleName) {
      item.status = 'error'
      item.error = '角色名称不能为空'
      return item
    }

    if (!roleCode) {
      item.status = 'error'
      item.error = '角色编码不能为空'
      return item
    }

    if (!baseRoleCode) {
      item.status = 'error'
      item.error = '基准角色编码不能为空'
      return item
    }

    if (roleCode === 'dev_test' || roleName === '开发测试') {
      item.status = 'error'
      item.error = '开发测试角色不允许导入'
      return item
    }

    if (existingNames.has(roleName) || existingCodes.has(roleCode)) {
      item.status = 'skip'
      return item
    }

    if (!allowedBaseRoleCodes.has(baseRoleCode)) {
      item.status = 'error'
      item.error = '基准角色编码无效'
      return item
    }

    return item
  })
}

const downloadImportTemplate = (type) => {
  const templates = {
    station: {
      fileName: '场站管理导入模板.xlsx',
      sheetName: '场站管理',
      data: [
        ['场站名称', '描述', '状态'],
        ['示例场站A', '示例描述', '启用'],
        ['示例场站B', '示例描述', '禁用']
      ],
      instructions: [
        ['场站名称', '必填，唯一名称；若已存在则跳过。'],
        ['描述', '选填，描述/地址信息。'],
        ['状态', '选填，启用/禁用；不填默认启用。'],
        ['导入数量', '一次最多导入 100 条数据。']
      ]
    },
    department: {
      fileName: '部门管理导入模板.xlsx',
      sheetName: '部门管理',
      data: [
        ['部门名称', '部门编码', '描述', '状态'],
        ['运营部', 'OP', '示例描述', '启用'],
        ['维修部', 'MT', '示例描述', '禁用']
      ],
      instructions: [
        ['部门名称', '必填；若已存在则跳过。'],
        ['部门编码', '选填；若编码已存在则跳过。'],
        ['描述', '选填。'],
        ['状态', '选填，启用/禁用；不填默认启用。'],
        ['导入数量', '一次最多导入 100 条数据。']
      ]
    },
    company: {
      fileName: '公司管理导入模板.xlsx',
      sheetName: '公司管理',
      data: [
        ['公司名称', '公司编码', '描述', '状态'],
        ['示例公司A', 'C001', '示例描述', '启用'],
        ['示例公司B', 'C002', '示例描述', '禁用']
      ],
      instructions: [
        ['公司名称', '必填；若已存在则跳过。'],
        ['公司编码', '选填；若编码已存在则跳过。'],
        ['描述', '选填。'],
        ['状态', '选填，启用/禁用；不填默认启用。'],
        ['导入数量', '一次最多导入 100 条数据。']
      ]
    },
    role: {
      fileName: '角色管理导入模板.xlsx',
      sheetName: '角色管理',
      data: [
        ['角色名称', '角色编码', '基准角色编码', '描述'],
        ['示例角色A', 'sample_role_a', 'operator', '示例描述'],
        ['示例角色B', 'sample_role_b', 'station_manager', '示例描述']
      ],
      instructions: [
        ['角色名称', '必填；若已存在则跳过。'],
        ['角色编码', '必填；若已存在则跳过。'],
        ['基准角色编码', '必填；必须为系统已存在角色编码。导入时默认复制基准角色的权限。'],
        ['描述', '选填。'],
        ['导入数量', '一次最多导入 100 条数据。']
      ]
    }
  }

  const template = templates[type]
  if (!template) return

  const ws = XLSX.utils.aoa_to_sheet(template.data)
  applyTemplateHeaderStyle(XLSX, ws, 1)

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, template.sheetName)
  addTemplateInstructionSheet(XLSX, wb, template.instructions)

  XLSX.writeFile(wb, template.fileName)
  ElMessage.success('模板已下载')
}

const handleImportFileChange = async (type, file) => {
  importType.value = type
  importing.value = false
  importPreviewData.value = []
  importErrors.value = []

  try {
    const buffer = await readUploadFile(file)
    const data = new Uint8Array(buffer)
    const workbook = XLSX.read(data, { type: 'array' })
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    const aoa = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })
    const headerRow = Array.isArray(aoa[0]) ? aoa[0] : []
    const bodyRows = aoa.slice(1).filter(hasRowValue)

    if (bodyRows.length === 0) {
      ElMessage.warning('没有找到有效数据')
      return
    }
    if (bodyRows.length > 100) {
      ElMessage.warning('一次最多导入100条数据')
      return
    }

    const headerMap = resolveHeaderIndexMap(headerRow)

    let preview = []
    if (type === 'station') {
      preview = await parseStationImport({ headerMap, rows: bodyRows })
    } else if (type === 'department') {
      preview = await parseDepartmentImport({ headerMap, rows: bodyRows })
    } else if (type === 'company') {
      preview = await parseCompanyImport({ headerMap, rows: bodyRows })
    } else if (type === 'role') {
      preview = await parseRoleImport({ headerMap, rows: bodyRows })
    }

    importPreviewData.value = preview
    importErrors.value = preview.filter(row => row.status === 'error')
    importDialogVisible.value = true
  } catch (e) {
    ElMessage.error('文件解析失败，请检查文件格式')
  }
}

const afterImportReload = async () => {
  if (importType.value === 'station') {
    loadStationSuggestions()
    loadStations()
    return
  }
  if (importType.value === 'department') {
    loadDepartments()
    return
  }
  if (importType.value === 'company') {
    loadCompanies()
    return
  }
  if (importType.value === 'role') {
    loadRoles()
  }
}

const confirmImport = async () => {
  const okRows = importPreviewData.value.filter(row => row.status === 'ok')
  if (okRows.length === 0) {
    ElMessage.warning('没有可导入的有效数据')
    return
  }

  importing.value = true
  try {
    let success = 0
    let skipped = importSkipCount.value
    let failed = 0

    for (const row of okRows) {
      try {
        if (importType.value === 'station') {
          await createStation({
            stationName: row.stationName,
            location: row.location,
            status: row.statusValue
          })
        } else if (importType.value === 'department') {
          await createDepartment({
            dept_name: row.deptName,
            dept_code: row.deptCode,
            description: row.description,
            status: row.statusValue
          })
        } else if (importType.value === 'company') {
          await createCompany({
            company_name: row.companyName,
            company_code: row.companyCode,
            description: row.description,
            status: row.statusValue
          })
        } else if (importType.value === 'role') {
          await roleApi.createRole({
            roleName: row.roleName,
            roleCode: row.roleCode,
            baseRoleCode: row.baseRoleCode,
            description: row.description
          })
        }
        success += 1
      } catch (e) {
        failed += 1
      }
    }

    if (failed === 0) {
      const tip = skipped > 0 ? `导入完成：成功${success}条，跳过${skipped}条` : `导入完成：成功${success}条`
      ElMessage.success(tip)
      importDialogVisible.value = false
    } else {
      ElMessage.warning(`导入完成：成功${success}条，跳过${skipped}条，失败${failed}条`)
      importDialogVisible.value = false
    }

    importPreviewData.value = []
    importErrors.value = []
    await afterImportReload()
  } finally {
    importing.value = false
  }
}

// ==================== 场站管理 ====================
const stationFormRef = ref(null)
const stationList = ref([])
// Auto-complete suggestions should not depend on table pagination (default pageSize=5).
const stationSuggestionList = ref([])
const stationLoading = ref(false)
const stationExporting = ref(false)
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
  location: '',
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

const exportStations = async () => {
  stationExporting.value = true
  try {
    const title = resolvePageTitle()
    const fileName = resolveExportFileName()
    const keyword = typeof stationFilters.value.keyword === 'string' ? stationFilters.value.keyword.trim() : ''

    const { rows } = await fetchAllPaged({
      pageSize: 5000,
      fetchPage: ({ page, pageSize }) => getStations({
        page,
        pageSize,
        keyword: keyword ? keyword : undefined
      })
    })

    const columns = [
      { label: 'ID', value: row => row.id ?? '' },
      { label: '场站名称', value: row => row.stationName ?? row.station_name ?? row.name ?? '' },
      { label: '状态', value: row => (row.status === 'active' ? '启用' : '禁用') },
      { label: '描述', value: row => row.location ?? row.description ?? '-' }
    ]

    await exportRowsToXlsx({ title, fileName, sheetName: '场站管理', columns, rows })
  } catch (error) {
    const message = typeof error?.message === 'string' && error.message.trim() ? error.message : '导出失败'
    ElMessage.error(message)
  } finally {
    stationExporting.value = false
  }
}

const showAddStationDialog = () => {
  isStationEdit.value = false
  stationForm.value = {
    stationName: '',
    location: '',
    status: 'active'
  }
  stationDialogVisible.value = true
}

const editStation = (row) => {
  isStationEdit.value = true
  stationForm.value = {
    id: row.id,
    stationName: row.stationName || row.station_name,
    location: row.location || row.description || '',
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
      location: stationForm.value.location,
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
const deptExporting = ref(false)
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

const exportDepartments = async () => {
  deptExporting.value = true
  try {
    const title = resolvePageTitle()
    const fileName = resolveExportFileName()
    const keyword = typeof deptFilters.value.keyword === 'string' ? deptFilters.value.keyword.trim() : ''

    const { rows } = await fetchAllPaged({
      pageSize: 5000,
      fetchPage: ({ page, pageSize }) => getDepartments({
        page,
        pageSize,
        keyword: keyword ? keyword : undefined
      })
    })

    const columns = [
      { label: 'ID', value: row => row.id ?? '' },
      { label: '部门名称', value: row => row.dept_name ?? '' },
      { label: '部门编码', value: row => row.dept_code ?? '-' },
      { label: '状态', value: row => (row.status === 'active' ? '启用' : '禁用') },
      { label: '描述', value: row => row.description ?? '-' }
    ]

    await exportRowsToXlsx({ title, fileName, sheetName: '部门管理', columns, rows })
  } catch (error) {
    const message = typeof error?.message === 'string' && error.message.trim() ? error.message : '导出失败'
    ElMessage.error(message)
  } finally {
    deptExporting.value = false
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
const companyExporting = ref(false)
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

const exportCompanies = async () => {
  companyExporting.value = true
  try {
    const title = resolvePageTitle()
    const fileName = resolveExportFileName()
    const keyword = typeof companyFilters.value.keyword === 'string' ? companyFilters.value.keyword.trim() : ''

    const { rows } = await fetchAllPaged({
      pageSize: 5000,
      fetchPage: ({ page, pageSize }) => getCompanies({
        page,
        pageSize,
        keyword: keyword ? keyword : undefined
      })
    })

    const columns = [
      { label: 'ID', value: row => row.id ?? '' },
      { label: '公司名称', value: row => row.company_name ?? '' },
      { label: '公司编码', value: row => row.company_code ?? '-' },
      { label: '状态', value: row => (row.status === 'active' ? '启用' : '禁用') },
      { label: '描述', value: row => row.description ?? '-' }
    ]

    await exportRowsToXlsx({ title, fileName, sheetName: '公司管理', columns, rows })
  } catch (error) {
    const message = typeof error?.message === 'string' && error.message.trim() ? error.message : '导出失败'
    ElMessage.error(message)
  } finally {
    companyExporting.value = false
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
const roleList = ref([])
const roleLoading = ref(false)
const roleExporting = ref(false)
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

const loadPermissions = async () => {
  try {
    const res = await permissionApi.getPermissions()
    const list = res.list || []
    const codeById = new Map()
    list.forEach(item => {
      codeById.set(item.id, item.code)
    })
    permissionCodeById.value = codeById
    allPermissions.value = list
  } catch (e) {
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

const exportRoles = async () => {
  roleExporting.value = true
  try {
    const title = resolvePageTitle()
    const fileName = resolveExportFileName()
    const rows = Array.isArray(filteredRoleList.value) ? filteredRoleList.value : []

    const columns = [
      { label: 'ID', value: row => row.id ?? '' },
      { label: '角色名称', value: row => row.roleName ?? '' },
      { label: '角色编码', value: row => row.roleCode ?? '' },
      { label: '基准角色', value: row => row.baseRoleName ?? '-' },
      { label: '描述', value: row => row.description ?? '' }
    ]

    await exportRowsToXlsx({ title, fileName, sheetName: '角色管理', columns, rows })
  } catch (error) {
    const message = typeof error?.message === 'string' && error.message.trim() ? error.message : '导出失败'
    ElMessage.error(message)
  } finally {
    roleExporting.value = false
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
    const moduleIds = permissionIds.filter(id => {
      const code = permissionCodeById.value.get(id) || ''
      return code.startsWith('module:')
    })
    selectedModulePermissionIds.value = moduleIds
  } catch (e) {
    selectedModulePermissionIds.value = []
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
  const moduleIds = [...new Set(selectedModulePermissionIds.value || [])]
  return moduleIds
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

