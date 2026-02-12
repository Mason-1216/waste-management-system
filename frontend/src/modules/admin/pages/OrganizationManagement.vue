<template>
  <div class="organization-management-page">
    <div class="page-header">
      <h2>组织架构管理</h2>
    </div>

    <el-tabs v-model="activeTab" type="card">
      <!-- 场站管理 -->
      <el-tab-pane v-if="canViewStation" label="场站管理" name="station">
        <div class="tab-header">
          <el-button v-if="isSimpleMode" @click="simpleShowTable = !simpleShowTable">
            {{ simpleShowTable ? '切换卡片' : '切换表格' }}
          </el-button>
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
          <SimpleFilterBar
            :enabled="isSimpleMode"
            v-model:expanded="simpleFilterExpanded"
            :summary-text="stationFilterSummaryText"
          >
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
          </SimpleFilterBar>
        </el-card>

        <el-table v-if="!isSimpleMode || simpleShowTable" :data="stationList" stripe border v-loading="stationLoading">
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
        <div v-else class="simple-card-list" v-loading="stationLoading">
          <el-empty v-if="stationList.length === 0" description="暂无数据" />
          <div v-for="row in stationList" :key="row.id" class="simple-card-item">
            <div class="card-title">{{ row.stationName || row.station_name || '-' }}</div>
            <div class="card-meta">状态：{{ row.status === 'active' ? '启用' : '禁用' }}</div>
            <div class="card-meta">描述：{{ row.location || row.description || '-' }}</div>
            <div v-if="canEditStation" class="card-actions">
              <el-button link type="primary" @click="editStation(row)">编辑</el-button>
              <el-button link type="danger" @click="deleteStation(row)">删除</el-button>
            </div>
          </div>
        </div>

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
          <el-button v-if="isSimpleMode" @click="simpleShowTable = !simpleShowTable">
            {{ simpleShowTable ? '切换卡片' : '切换表格' }}
          </el-button>
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
          <SimpleFilterBar
            :enabled="isSimpleMode"
            v-model:expanded="simpleFilterExpanded"
            :summary-text="deptFilterSummaryText"
          >
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
          </SimpleFilterBar>
        </el-card>

        <el-table v-if="!isSimpleMode || simpleShowTable" :data="deptList" stripe border v-loading="deptLoading">
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
        <div v-else class="simple-card-list" v-loading="deptLoading">
          <el-empty v-if="deptList.length === 0" description="暂无数据" />
          <div v-for="row in deptList" :key="row.id" class="simple-card-item">
            <div class="card-title">{{ row.dept_name || '-' }}</div>
            <div class="card-meta">部门编码：{{ row.dept_code || '-' }}</div>
            <div class="card-meta">状态：{{ row.status === 'active' ? '启用' : '禁用' }}</div>
            <div class="card-meta">描述：{{ row.description || '-' }}</div>
            <div v-if="canEditDepartment" class="card-actions">
              <el-button link type="primary" @click="editDept(row)">编辑</el-button>
              <el-button link type="danger" @click="deleteDept(row)">删除</el-button>
            </div>
          </div>
        </div>

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
          <el-button v-if="isSimpleMode" @click="simpleShowTable = !simpleShowTable">
            {{ simpleShowTable ? '切换卡片' : '切换表格' }}
          </el-button>
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
          <SimpleFilterBar
            :enabled="isSimpleMode"
            v-model:expanded="simpleFilterExpanded"
            :summary-text="companyFilterSummaryText"
          >
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
          </SimpleFilterBar>
        </el-card>

        <el-table v-if="!isSimpleMode || simpleShowTable" :data="companyList" stripe border v-loading="companyLoading">
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
        <div v-else class="simple-card-list" v-loading="companyLoading">
          <el-empty v-if="companyList.length === 0" description="暂无数据" />
          <div v-for="row in companyList" :key="row.id" class="simple-card-item">
            <div class="card-title">{{ row.company_name || '-' }}</div>
            <div class="card-meta">公司编码：{{ row.company_code || '-' }}</div>
            <div class="card-meta">状态：{{ row.status === 'active' ? '启用' : '禁用' }}</div>
            <div class="card-meta">描述：{{ row.description || '-' }}</div>
            <div v-if="canEditCompany" class="card-actions">
              <el-button link type="primary" @click="editCompany(row)">编辑</el-button>
              <el-button link type="danger" @click="deleteCompanyRow(row)">删除</el-button>
            </div>
          </div>
        </div>

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
          <el-button v-if="isSimpleMode" @click="simpleShowTable = !simpleShowTable">
            {{ simpleShowTable ? '切换卡片' : '切换表格' }}
          </el-button>
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
          <SimpleFilterBar
            :enabled="isSimpleMode"
            v-model:expanded="simpleFilterExpanded"
            :summary-text="roleFilterSummaryText"
          >
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
          </SimpleFilterBar>
        </el-card>

        <el-table v-if="!isSimpleMode || simpleShowTable" :data="filteredRoleList" stripe border v-loading="roleLoading">
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
        <div v-else class="simple-card-list" v-loading="roleLoading">
          <el-empty v-if="filteredRoleList.length === 0" description="暂无数据" />
          <div v-for="row in filteredRoleList" :key="row.id" class="simple-card-item">
            <div class="card-title">{{ row.roleName || '-' }}</div>
            <div class="card-meta">角色编码：{{ row.roleCode || '-' }}</div>
            <div class="card-meta">基准角色：{{ row.baseRoleName || '-' }}</div>
            <div class="card-meta">描述：{{ row.description || '-' }}</div>
            <div v-if="canEditRole" class="card-actions">
              <el-button link type="primary" @click="editRole(row)">编辑</el-button>
              <el-button
                link
                type="danger"
                :disabled="systemRoleCodes.has(row.roleCode)"
                @click="deleteRole(row)"
              >
                删除
              </el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <ImportPreviewDialog
      v-model="importDialogVisible"
      :title="importDialogTitle"
      width="980px"
      :rows="importPreviewData"
      :summary="importPreviewSummary"
      :confirm-loading="importing"
      :confirm-text="`确认导入（${importOkCount}条）`"
      :columns="importPreviewColumns"
      @confirm="confirmImport"
    />

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
import SimpleFilterBar from '@/components/common/SimpleFilterBar.vue'
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
import ImportPreviewDialog from '@/components/common/ImportPreviewDialog.vue'
import { useUserStore } from '@/store/modules/user'
import { createListSuggestionFetcher } from '@/utils/filterAutocomplete'
import { useSimpleMode } from '@/composables/useSimpleMode'

const route = useRoute()
const userStore = useUserStore()
const { isSimpleMode, simpleShowTable, simpleFilterExpanded } = useSimpleMode()

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
const importPreviewSummary = ref({})

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

const importOkCount = computed(() => importPreviewData.value.filter(row => row.action === 'create' || row.action === 'update').length)
const importSkipCount = computed(() => importPreviewData.value.filter(row => row.action === 'skip').length)

const importPreviewColumns = computed(() => {
  if (importType.value === 'station') {
    return [
      { prop: 'stationName', label: '场站名称', minWidth: 180 },
      { prop: 'location', label: '描述', minWidth: 220, diffKey: 'location' },
      { prop: 'statusText', label: '状态', width: 120, diffKey: 'status' }
    ]
  }
  if (importType.value === 'department') {
    return [
      { prop: 'deptName', label: '部门名称', minWidth: 180, diffKey: 'dept_name' },
      { prop: 'deptCode', label: '部门编码', width: 160 },
      { prop: 'description', label: '描述', minWidth: 220, diffKey: 'description' },
      { prop: 'statusText', label: '状态', width: 120, diffKey: 'status' }
    ]
  }
  if (importType.value === 'company') {
    return [
      { prop: 'companyName', label: '公司名称', minWidth: 180, diffKey: 'company_name' },
      { prop: 'companyCode', label: '公司编码', width: 160 },
      { prop: 'description', label: '描述', minWidth: 220, diffKey: 'description' },
      { prop: 'statusText', label: '状态', width: 120, diffKey: 'status' }
    ]
  }
  if (importType.value === 'role') {
    return [
      { prop: 'roleName', label: '角色名称', minWidth: 180, diffKey: 'roleName' },
      { prop: 'roleCode', label: '角色编码', width: 180 },
      { prop: 'baseRoleCode', label: '基准角色编码', width: 180 },
      { prop: 'description', label: '描述', minWidth: 220, diffKey: 'description' }
    ]
  }
  return []
})

const normalizeText = (value) => (value === undefined || value === null ? '' : String(value).trim())

const normalizeStatus = (value) => {
  const text = normalizeText(value)
  if (!text) return null
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
  const existingByName = new Map()
  existingRows.forEach((r) => {
    const name = normalizeText(r.station_name ?? r.stationName ?? r.name)
    if (name && !existingByName.has(name)) existingByName.set(name, r)
  })

  return rows.map((row, idx) => {
    const rowNum = idx + 2
    const stationName = normalizeText(row[stationNameCol])
    const locationInput = normalizeText(row[descCol])
    const statusRaw = normalizeText(row[statusCol])
    const statusInput = normalizeStatus(row[statusCol])

    const previewRow = {
      rowNum,
      action: 'error',
      message: '',
      diff: {},
      stationName,
      location: '',
      statusText: '',
      statusValue: ''
    }

    if (!stationName) {
      previewRow.message = '场站名称不能为空'
      return previewRow
    }

    const existing = existingByName.get(stationName) ?? null
    const existingLocation = existing ? normalizeText(existing.location) : ''
    const existingStatus = existing ? normalizeText(existing.status) : ''

    if (!existing) {
      if (statusRaw && statusInput === null) {
        previewRow.message = '状态无效（可填 启用/禁用）'
        return previewRow
      }
      const statusValue = statusInput ?? 'active'
      previewRow.location = locationInput
      previewRow.statusValue = statusValue
      previewRow.statusText = statusValue === 'inactive' ? '禁用' : '启用'
      previewRow.action = 'create'
      previewRow.message = '将新增'
      return previewRow
    }

    const patch = {}
    const diff = {}

    if (locationInput && locationInput !== existingLocation) {
      patch.location = locationInput
      diff.location = { from: existingLocation, to: locationInput }
    }
    if (statusRaw && statusInput === null) {
      previewRow.message = '状态无效（可填 启用/禁用）'
      return previewRow
    }

    if (statusInput !== null && statusInput !== existingStatus) {
      patch.status = statusInput
      diff.status = { from: existingStatus, to: statusInput }
    }

    previewRow.location = locationInput ? locationInput : existingLocation
    const nextStatus = statusInput !== null ? statusInput : existingStatus
    previewRow.statusValue = nextStatus
    previewRow.statusText = nextStatus === 'inactive' ? '禁用' : '启用'
    previewRow.diff = diff
    previewRow.__existingId = existing.id
    previewRow.__patch = patch

    if (Object.keys(patch).length === 0) {
      previewRow.action = 'skip'
      previewRow.message = '无变更，跳过'
    } else {
      previewRow.action = 'update'
      previewRow.message = '将更新'
    }

    return previewRow
  })
}

const parseDepartmentImport = async ({ headerMap, rows }) => {
  const nameCol = headerMap.get('部门名称') ?? 0
  const codeCol = headerMap.get('部门编码') ?? 1
  const descCol = headerMap.get('描述') ?? 2
  const statusCol = headerMap.get('状态') ?? 3

  const existingRows = await loadAllDepartments()
  const existingByCode = new Map()
  const existingByName = new Map()
  existingRows.forEach((r) => {
    const code = normalizeText(r.dept_code)
    const name = normalizeText(r.dept_name)
    if (code && !existingByCode.has(code)) existingByCode.set(code, r)
    if (name) {
      const list = existingByName.get(name) ?? []
      list.push(r)
      existingByName.set(name, list)
    }
  })

  return rows.map((row, idx) => {
    const rowNum = idx + 2
    const deptName = normalizeText(row[nameCol])
    const deptCode = normalizeText(row[codeCol])
    const descriptionInput = normalizeText(row[descCol])
    const statusRaw = normalizeText(row[statusCol])
    const statusInput = normalizeStatus(row[statusCol])

    const previewRow = {
      rowNum,
      action: 'error',
      message: '',
      diff: {},
      deptName,
      deptCode,
      description: '',
      statusText: '',
      statusValue: ''
    }

    if (!deptName) {
      previewRow.message = '部门名称不能为空'
      return previewRow
    }

    if (statusRaw && statusInput === null) {
      previewRow.message = '状态无效（可填 启用/禁用）'
      return previewRow
    }

    let existing = null
    if (deptCode) {
      existing = existingByCode.get(deptCode) ?? null
    } else {
      const matched = existingByName.get(deptName) ?? []
      if (matched.length > 1) {
        previewRow.message = '部门名称重复，请填写部门编码后再导入'
        return previewRow
      }
      existing = matched.length === 1 ? matched[0] : null
    }

    if (!existing) {
      const statusValue = statusInput ?? 'active'
      previewRow.description = descriptionInput
      previewRow.statusValue = statusValue
      previewRow.statusText = statusValue === 'inactive' ? '禁用' : '启用'
      previewRow.action = 'create'
      previewRow.message = '将新增'
      return previewRow
    }

    const patch = {}
    const diff = {}
    const existingName = normalizeText(existing.dept_name)
    const existingDescription = normalizeText(existing.description)
    const existingStatus = normalizeText(existing.status)

    if (deptName && deptName !== existingName) {
      patch.dept_name = deptName
      diff.dept_name = { from: existingName, to: deptName }
    }
    if (descriptionInput && descriptionInput !== existingDescription) {
      patch.description = descriptionInput
      diff.description = { from: existingDescription, to: descriptionInput }
    }
    if (statusInput !== null && statusInput !== existingStatus) {
      patch.status = statusInput
      diff.status = { from: existingStatus, to: statusInput }
    }

    previewRow.description = descriptionInput ? descriptionInput : existingDescription
    const nextStatus = statusInput !== null ? statusInput : existingStatus
    previewRow.statusValue = nextStatus
    previewRow.statusText = nextStatus === 'inactive' ? '禁用' : '启用'
    previewRow.diff = diff
    previewRow.__existingId = existing.id
    previewRow.__patch = patch

    if (Object.keys(patch).length === 0) {
      previewRow.action = 'skip'
      previewRow.message = '无变更，跳过'
    } else {
      previewRow.action = 'update'
      previewRow.message = '将更新'
    }

    return previewRow
  })
}

const parseCompanyImport = async ({ headerMap, rows }) => {
  const nameCol = headerMap.get('公司名称') ?? 0
  const codeCol = headerMap.get('公司编码') ?? 1
  const descCol = headerMap.get('描述') ?? 2
  const statusCol = headerMap.get('状态') ?? 3

  const existingRows = await loadAllCompanies()
  const existingByCode = new Map()
  const existingByName = new Map()
  existingRows.forEach((r) => {
    const code = normalizeText(r.company_code)
    const name = normalizeText(r.company_name)
    if (code && !existingByCode.has(code)) existingByCode.set(code, r)
    if (name && !existingByName.has(name)) existingByName.set(name, r)
  })

  return rows.map((row, idx) => {
    const rowNum = idx + 2
    const companyName = normalizeText(row[nameCol])
    const companyCode = normalizeText(row[codeCol])
    const descriptionInput = normalizeText(row[descCol])
    const statusRaw = normalizeText(row[statusCol])
    const statusInput = normalizeStatus(row[statusCol])

    const previewRow = {
      rowNum,
      action: 'error',
      message: '',
      diff: {},
      companyName,
      companyCode,
      description: '',
      statusText: '',
      statusValue: ''
    }

    if (!companyName) {
      previewRow.message = '公司名称不能为空'
      return previewRow
    }

    if (statusRaw && statusInput === null) {
      previewRow.message = '状态无效（可填 启用/禁用）'
      return previewRow
    }

    const existingByCodeHit = companyCode ? (existingByCode.get(companyCode) ?? null) : null
    const existingByNameHit = existingByName.get(companyName) ?? null

    if (existingByCodeHit && existingByNameHit && existingByCodeHit.id !== existingByNameHit.id) {
      previewRow.message = '公司编码与公司名称指向不同记录，请修正后再导入'
      return previewRow
    }

    const existing = existingByCodeHit ?? existingByNameHit

    if (!existing) {
      const statusValue = statusInput ?? 'active'
      previewRow.description = descriptionInput
      previewRow.statusValue = statusValue
      previewRow.statusText = statusValue === 'inactive' ? '禁用' : '启用'
      previewRow.action = 'create'
      previewRow.message = '将新增'
      return previewRow
    }

    const patch = {}
    const diff = {}
    const existingName = normalizeText(existing.company_name)
    const existingDescription = normalizeText(existing.description)
    const existingStatus = normalizeText(existing.status)

    if (companyName && companyName !== existingName) {
      patch.company_name = companyName
      diff.company_name = { from: existingName, to: companyName }
    }
    if (descriptionInput && descriptionInput !== existingDescription) {
      patch.description = descriptionInput
      diff.description = { from: existingDescription, to: descriptionInput }
    }
    if (statusInput !== null && statusInput !== existingStatus) {
      patch.status = statusInput
      diff.status = { from: existingStatus, to: statusInput }
    }

    previewRow.description = descriptionInput ? descriptionInput : existingDescription
    const nextStatus = statusInput !== null ? statusInput : existingStatus
    previewRow.statusValue = nextStatus
    previewRow.statusText = nextStatus === 'inactive' ? '禁用' : '启用'
    previewRow.diff = diff
    previewRow.__existingId = existing.id
    previewRow.__patch = patch

    if (Object.keys(patch).length === 0) {
      previewRow.action = 'skip'
      previewRow.message = '无变更，跳过'
    } else {
      previewRow.action = 'update'
      previewRow.message = '将更新'
    }

    return previewRow
  })
}

const parseRoleImport = async ({ headerMap, rows }) => {
  await ensureRolesLoaded()

  const nameCol = headerMap.get('角色名称') ?? 0
  const codeCol = headerMap.get('角色编码') ?? 1
  const baseCol = headerMap.get('基准角色编码') ?? 2
  const descCol = headerMap.get('描述') ?? 3

  const existingByCode = new Map()
  roleList.value.forEach((r) => {
    const code = normalizeText(r.roleCode)
    if (code && !existingByCode.has(code)) existingByCode.set(code, r)
  })
  const allowedBaseRoleCodes = new Set(baseRoleOptions.value.map(r => normalizeText(r.roleCode)).filter(Boolean))

  return rows.map((row, idx) => {
    const rowNum = idx + 2
    const roleName = normalizeText(row[nameCol])
    const roleCode = normalizeText(row[codeCol])
    const baseRoleCode = normalizeText(row[baseCol])
    const description = normalizeText(row[descCol])

    const previewRow = {
      rowNum,
      action: 'error',
      message: '',
      diff: {},
      roleName,
      roleCode,
      baseRoleCode,
      description
    }

    if (!roleName) {
      previewRow.message = '角色名称不能为空'
      return previewRow
    }

    if (!roleCode) {
      previewRow.message = '角色编码不能为空'
      return previewRow
    }

    if (roleCode === 'dev_test' || roleName === '开发测试') {
      previewRow.message = '开发测试角色不允许导入'
      return previewRow
    }

    const existing = existingByCode.get(roleCode) ?? null

    if (!existing) {
      if (!baseRoleCode) {
        previewRow.message = '基准角色编码不能为空'
        return previewRow
      }

      if (!allowedBaseRoleCodes.has(baseRoleCode)) {
        previewRow.message = '基准角色编码无效'
        return previewRow
      }

      previewRow.action = 'create'
      previewRow.message = '将新增（将复制基准角色权限）'
      return previewRow
    }

    const patch = {}
    const diff = {}
    const existingRoleName = normalizeText(existing.roleName ?? existing.role_name)
    const existingDescription = normalizeText(existing.description)

    if (roleName && roleName !== existingRoleName) {
      patch.roleName = roleName
      diff.roleName = { from: existingRoleName, to: roleName }
    }
    if (description && description !== existingDescription) {
      patch.description = description
      diff.description = { from: existingDescription, to: description }
    }

    previewRow.baseRoleCode = baseRoleCode
    previewRow.description = description ? description : existingDescription
    previewRow.diff = diff
    previewRow.__existingId = existing.id
    previewRow.__patch = patch

    if (Object.keys(patch).length === 0) {
      previewRow.action = 'skip'
      previewRow.message = '无变更，跳过（不覆盖权限）'
    } else {
      previewRow.action = 'update'
      previewRow.message = '将更新（不覆盖权限）'
    }

    return previewRow
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
        ['场站名称', '必填，唯一名称；若已存在则更新（空值不覆盖）。'],
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
        ['部门名称', '必填；若已存在则更新（空值不覆盖）。'],
        ['部门编码', '选填；若编码已存在则更新（空值不覆盖）。'],
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
        ['公司名称', '必填；若已存在则更新（空值不覆盖）。'],
        ['公司编码', '选填；若编码已存在则更新（空值不覆盖）。'],
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
        ['角色名称', '必填；若已存在则更新（仅更新名称/描述，不覆盖权限）。'],
        ['角色编码', '必填；若已存在则更新（仅更新名称/描述，不覆盖权限）。'],
        ['基准角色编码', '新增时必填；必须为系统已存在角色编码。新增时将复制基准角色的权限。'],
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
  importPreviewSummary.value = {}

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
    importPreviewSummary.value = {
      total: preview.length,
      create: preview.filter(r => r.action === 'create').length,
      update: preview.filter(r => r.action === 'update').length,
      skip: preview.filter(r => r.action === 'skip').length,
      error: preview.filter(r => r.action === 'error').length
    }
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
  const pendingRows = importPreviewData.value.filter(row => row.action === 'create' || row.action === 'update')
  if (pendingRows.length === 0) {
    ElMessage.warning('没有可导入的数据')
    return
  }

  importing.value = true
  try {
    let created = 0
    let updated = 0
    const skipped = importSkipCount.value
    let failed = 0

    for (const row of pendingRows) {
      try {
        if (importType.value === 'station') {
          if (row.action === 'create') {
            await createStation({
              stationName: row.stationName,
              location: row.location,
              status: row.statusValue
            })
            created += 1
          } else {
            await updateStation(row.__existingId, row.__patch)
            updated += 1
          }
        } else if (importType.value === 'department') {
          if (row.action === 'create') {
            await createDepartment({
              dept_name: row.deptName,
              dept_code: row.deptCode,
              description: row.description,
              status: row.statusValue
            })
            created += 1
          } else {
            await updateDepartment(row.__existingId, row.__patch)
            updated += 1
          }
        } else if (importType.value === 'company') {
          if (row.action === 'create') {
            await createCompany({
              company_name: row.companyName,
              company_code: row.companyCode,
              description: row.description,
              status: row.statusValue
            })
            created += 1
          } else {
            await updateCompany(row.__existingId, row.__patch)
            updated += 1
          }
        } else if (importType.value === 'role') {
          if (row.action === 'create') {
            await roleApi.createRole({
              roleName: row.roleName,
              roleCode: row.roleCode,
              baseRoleCode: row.baseRoleCode,
              description: row.description
            })
            created += 1
          } else {
            // 已存在角色：只更新名称/描述，不覆盖权限
            await roleApi.updateRole(row.__existingId, row.__patch)
            updated += 1
          }
        }
      } catch (e) {
        failed += 1
      }
    }

    if (failed === 0) {
      ElMessage.success(`导入完成：新增${created}条，更新${updated}条，跳过${skipped}条`)
    } else {
      ElMessage.warning(`导入完成：新增${created}条，更新${updated}条，跳过${skipped}条，失败${failed}条`)
    }

    importDialogVisible.value = false
    importPreviewData.value = []
    importPreviewSummary.value = {}
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
const stationFilterSummaryText = computed(() => `当前筛选：场站名称=${(stationFilters.value.keyword || '').trim() || '全部'}`)
const deptFilterSummaryText = computed(() => `当前筛选：部门名称=${(deptFilters.value.keyword || '').trim() || '全部'}`)
const companyFilterSummaryText = computed(() => `当前筛选：公司名称=${(companyFilters.value.keyword || '').trim() || '全部'}`)
const roleFilterSummaryText = computed(() => `当前筛选：角色名称=${(roleFilters.value.keyword || '').trim() || '全部'}`)

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

  .simple-card-list {
    display: grid;
    gap: 12px;
  }

  .simple-card-item {
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    padding: 12px;
  }

  .card-title {
    font-weight: 600;
    margin-bottom: 8px;
  }

  .card-meta {
    color: #606266;
    font-size: 14px;
    margin-bottom: 6px;
  }

  .card-actions {
    margin-top: 8px;
    display: flex;
    gap: 8px;
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

