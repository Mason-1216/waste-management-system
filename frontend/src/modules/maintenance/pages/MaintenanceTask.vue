<template>
  <div class="maintenance-task-page">
    <!-- 管理者视图：显示Tab -->
    <el-tabs v-if="canManage || activeTab === 'records'" v-model="activeTab" type="border-card" :class="{ 'tabs-hidden': hideTabs }">
      <!-- Tab 1: 保养工作 -->
      <el-tab-pane v-if="!hideTabs || activeTab === 'work'" label="保养工作" name="work">
        <MaintenanceWorkPanel :can-manage="canManage" />
      </el-tab-pane>

      <!-- Tab 2: 保养计划 -->
      <el-tab-pane v-if="!hideTabs || activeTab === 'plan'" label="保养计划" name="plan">
        <div class="page-header">
          <h2>设备保养计划</h2>
          <div class="header-actions">
            <el-button type="primary" :loading="planExporting" @click="handleExportPlans">
              <el-icon><Upload /></el-icon>批量导出
            </el-button>
            <el-button type="primary" @click="showPlanDialog()">
              <el-icon><Plus /></el-icon>新增保养计划
            </el-button>
            <el-button type="info" @click="downloadPlanTemplate">
              <el-icon><Download /></el-icon>下载模板
            </el-button>
            <el-button type="success" @click="triggerPlanImport">
              <el-icon><Download /></el-icon>批量导入
            </el-button>
            <input ref="planFileInputRef" type="file" accept=".xlsx,.xls" style="display:none" @change="handlePlanImport" />
            <el-button v-if="selectedPlanRows.length" type="danger" @click="batchDeletePlans">
              <el-icon><Delete /></el-icon>
              批量删除 ({{ selectedPlanRows.length }})
            </el-button>
          </div>
        </div>

        <el-card class="filter-card">
          <FilterBar>
            <div class="filter-item">
              <span class="filter-label">关键词</span>
              <FilterAutocomplete
                v-model="planFilters.keyword"
                :fetch-suggestions="fetchPlanKeywordSuggestions"
                trigger-on-focus
                placeholder="全部"
                clearable
                style="width: 200px;"
                @select="applyPlanFilters"
                @input="applyPlanFilters"
                @clear="applyPlanFilters"
                @keyup.enter="applyPlanFilters"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </FilterAutocomplete>
            </div>
            <div class="filter-item">
              <span class="filter-label">场站</span>
              <FilterSelect v-model="planFilters.stationId" placeholder="全部" filterable clearable style="width: 150px;" @change="applyPlanFilters" @clear="applyPlanFilters">
                <el-option label="全部" value="all" />
                <el-option v-for="s in stationList" :key="s.id" :label="s.stationName" :value="s.id" />
              </FilterSelect>
            </div>
            <div class="filter-item">
              <span class="filter-label">保养周期</span>
              <FilterSelect v-model="planFilters.cycleType" placeholder="全部" filterable clearable style="width: 120px;" @change="applyPlanFilters" @clear="applyPlanFilters">
                <el-option label="全部" value="all" />
                <el-option label="日保养" value="daily" />
                <el-option label="周保养" value="weekly" />
                <el-option label="月保养" value="monthly" />
                <el-option label="年保养" value="yearly" />
              </FilterSelect>
            </div>
          </FilterBar>
        </el-card>

        <TableWrapper v-loading="planLoading">
          <el-table
            ref="planTableRef"
            :data="planTableRows"
            stripe
            border
            row-key="rowKey"
            :span-method="planSpanMethod"
            @selection-change="handlePlanSelectionChange"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="station.stationName" label="场站" width="120" />
            <el-table-column prop="equipmentCode" label="设备编号" width="120" />
            <el-table-column prop="equipmentName" label="设备名称" min-width="150" />
            <el-table-column prop="installLocation" label="安装位置" width="150" />
            <el-table-column label="工作名称" min-width="220">
              <template #default="{ row }">
                <span v-if="row.standard?.name">{{ row.standard.name }}</span>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column label="规范" min-width="200">
              <template #default="{ row }">
                <span v-if="row.standard?.specification">{{ row.standard.specification }}</span>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column label="积分" width="90">
              <template #default="{ row }">
                <span v-if="row.standard">{{ row.standard.points ?? 0 }}</span>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column label="保养周期" width="100">
              <template #default="{ row }">
                {{ getCycleLabel(row.cycleType) }}
              </template>
            </el-table-column>
            <el-table-column label="保养日期" width="130">
              <template #default="{ row }">
                {{ getMaintenanceTimeText(row) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="showPlanDialog(row)">编辑</el-button>
                <el-button link type="danger" size="small" @click="deletePlan(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </TableWrapper>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="planPagination.page"
            v-model:page-size="planPagination.pageSize"
            :total="planPagination.total"
            :page-sizes="[5, 10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @current-change="loadPlanList"
            @size-change="loadPlanList"
          />
        </div>
      </el-tab-pane>

      <!-- Tab 3: 保养计划岗位分配 -->
      <el-tab-pane v-if="!hideTabs || activeTab === 'position'" label="保养计划岗位分配" name="position">
        <div class="page-header">
          <h2>保养计划岗位分配</h2>
          <div class="header-actions">
            <el-button type="primary" :loading="positionExporting" @click="handleExportPositionPlans">
              <el-icon><Upload /></el-icon>批量导出
            </el-button>
            <el-button type="primary" @click="showPositionAssignDialog">
              <el-icon><Plus /></el-icon>分配保养计划
            </el-button>
          </div>
        </div>

        <el-card class="filter-card">
          <FilterBar>
            <div class="filter-item">
              <span class="filter-label">场站</span>
              <FilterSelect v-model="positionFilters.stationId" placeholder="全部" filterable clearable style="width: 150px;" @change="applyPositionFilters" @clear="applyPositionFilters">
                <el-option label="全部" value="all" />
                <el-option v-for="s in stationList" :key="s.id" :label="s.stationName" :value="s.id" />
              </FilterSelect>
            </div>
            <div class="filter-item">
              <span class="filter-label">岗位</span>
              <FilterSelect v-model="positionFilters.positionName" placeholder="全部" filterable clearable style="width: 150px;" @change="applyPositionFilters" @clear="applyPositionFilters">
                <el-option label="全部" value="all" />
                <el-option v-for="p in allPositions" :key="p" :label="p" :value="p" />
              </FilterSelect>
            </div>
            <div class="filter-item">
              <span class="filter-label">设备编号</span>
              <FilterAutocomplete
                v-model="positionFilters.equipmentCode"
                :fetch-suggestions="fetchPositionEquipmentCodeSuggestions"
                trigger-on-focus
                placeholder="全部"
                clearable
                style="width: 150px;"
                @select="applyPositionFilters"
                @input="applyPositionFilters"
                @clear="applyPositionFilters"
                @keyup.enter="applyPositionFilters"
              />
            </div>
            <div class="filter-item">
              <span class="filter-label">设备名称</span>
              <FilterAutocomplete
                v-model="positionFilters.equipmentName"
                :fetch-suggestions="fetchPositionEquipmentNameSuggestions"
                trigger-on-focus
                placeholder="全部"
                clearable
                style="width: 160px;"
                @select="applyPositionFilters"
                @input="applyPositionFilters"
                @clear="applyPositionFilters"
                @keyup.enter="applyPositionFilters"
              />
            </div>
            <div class="filter-item">
              <span class="filter-label">安装位置</span>
              <FilterAutocomplete
                v-model="positionFilters.installLocation"
                :fetch-suggestions="fetchPositionInstallLocationSuggestions"
                trigger-on-focus
                placeholder="全部"
                clearable
                style="width: 160px;"
                @select="applyPositionFilters"
                @input="applyPositionFilters"
                @clear="applyPositionFilters"
                @keyup.enter="applyPositionFilters"
              />
            </div>
            <div class="filter-item">
              <span class="filter-label">保养周期</span>
              <FilterSelect v-model="positionFilters.cycleType" placeholder="全部" filterable clearable style="width: 120px;" @change="applyPositionFilters" @clear="applyPositionFilters">
                <el-option label="全部" value="all" />
                <el-option label="日保养" value="daily" />
                <el-option label="周保养" value="weekly" />
                <el-option label="月保养" value="monthly" />
                <el-option label="年保养" value="yearly" />
              </FilterSelect>
            </div>
          </FilterBar>
        </el-card>

        <TableWrapper v-loading="positionLoading">
          <el-table :data="positionPlanList" stripe border>
            <el-table-column prop="stationName" label="场站" width="120" />
            <el-table-column prop="positionName" label="岗位" width="120" />
            <el-table-column prop="equipmentCode" label="设备编号" width="120" />
            <el-table-column prop="equipmentName" label="设备名称" min-width="150" />
            <el-table-column prop="installLocation" label="安装位置" width="150" />
            <el-table-column label="保养周期" width="260">
              <template #default="{ row }">
                <div class="cycle-tags">
                  <el-tag v-if="row.hasDailyCycle" size="small" type="success">日保养</el-tag>
                  <el-tag v-if="row.hasWeeklyCycle" size="small" type="warning">周保养</el-tag>
                  <el-tag v-if="row.hasMonthlyCycle" size="small" type="primary">月保养</el-tag>
                  <el-tag v-if="row.hasYearlyCycle" size="small" type="danger">年保养</el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button link type="danger" size="small" @click="deletePositionPlan(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </TableWrapper>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="positionPagination.page"
            v-model:page-size="positionPagination.pageSize"
            :total="positionPagination.total"
            :page-sizes="[5, 10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @current-change="loadPositionPlans"
            @size-change="loadPositionPlans"
          />
        </div>
      </el-tab-pane>

      <!-- Tab 3: 保养工作记录 -->
      <el-tab-pane v-if="!hideTabs || activeTab === 'records'" label="保养工作记录" name="records">
        <div class="page-header">
          <h2>保养工作记录</h2>
          <div class="header-actions">
            <el-button type="primary" :loading="recordExporting" @click="handleExportWorkRecords">
              <el-icon><Upload /></el-icon>批量导出
            </el-button>
          </div>
        </div>

        <el-card class="filter-card">
          <FilterBar>
            <div class="filter-item">
              <span class="filter-label">场站</span>
              <FilterSelect v-model="recordFilters.stationId" placeholder="全部" filterable clearable style="width: 150px;" @change="applyRecordFilters" @clear="applyRecordFilters">
                <el-option label="全部" value="all" />
                <el-option v-for="s in stationList" :key="s.id" :label="s.stationName" :value="s.id" />
              </FilterSelect>
            </div>
            <div class="filter-item">
              <span class="filter-label">岗位</span>
              <FilterAutocomplete
                v-model="recordFilters.positionName"
                :fetch-suggestions="fetchRecordPositionNameSuggestions"
                trigger-on-focus
                placeholder="全部"
                clearable
                style="width: 130px;"
                @select="applyRecordFilters"
                @input="applyRecordFilters"
                @clear="applyRecordFilters"
                @keyup.enter="applyRecordFilters"
              />
            </div>
            <div class="filter-item">
              <span class="filter-label">设备编号</span>
              <FilterAutocomplete
                v-model="recordFilters.equipmentCode"
                :fetch-suggestions="fetchRecordEquipmentCodeSuggestions"
                trigger-on-focus
                placeholder="全部"
                clearable
                style="width: 140px;"
                @select="applyRecordFilters"
                @input="applyRecordFilters"
                @clear="applyRecordFilters"
                @keyup.enter="applyRecordFilters"
              />
            </div>
            <div class="filter-item">
              <span class="filter-label">设备名称</span>
              <FilterAutocomplete
                v-model="recordFilters.equipmentName"
                :fetch-suggestions="fetchRecordEquipmentNameSuggestions"
                trigger-on-focus
                placeholder="全部"
                clearable
                style="width: 160px;"
                @select="applyRecordFilters"
                @input="applyRecordFilters"
                @clear="applyRecordFilters"
                @keyup.enter="applyRecordFilters"
              />
            </div>
            <div class="filter-item">
              <span class="filter-label">保养周期</span>
              <FilterSelect v-model="recordFilters.cycleType" placeholder="全部" filterable clearable style="width: 120px;" @change="applyRecordFilters" @clear="applyRecordFilters">
                <el-option label="全部" value="all" />
                <el-option label="日保养" value="daily" />
                <el-option label="周保养" value="weekly" />
                <el-option label="月保养" value="monthly" />
                <el-option label="年保养" value="yearly" />
              </FilterSelect>
            </div>
            <div class="filter-item">
              <span class="filter-label">执行人</span>
              <FilterAutocomplete
                v-model="recordFilters.executorName"
                :fetch-suggestions="fetchRecordExecutorNameSuggestions"
                trigger-on-focus
                placeholder="全部"
                clearable
                style="width: 130px;"
                @select="applyRecordFilters"
                @input="applyRecordFilters"
                @clear="applyRecordFilters"
                @keyup.enter="applyRecordFilters"
              />
            </div>
            <div class="filter-item">
              <span class="filter-label">状态</span>
              <FilterSelect v-model="recordFilters.status" placeholder="全部" filterable clearable style="width: 120px;" @change="applyRecordFilters" @clear="applyRecordFilters">
                <el-option label="全部" value="all" />
                <el-option label="待完成" value="pending" />
                <el-option label="已完成" value="completed" />
                <el-option label="已验收" value="verified" />
                <el-option label="未完成" value="missed" />
              </FilterSelect>
            </div>
            <div class="filter-item">
              <span class="filter-label">开始日期</span>
              <el-date-picker
                v-model="recordFilters.startDate"
                type="date"
                placeholder="全部"
                value-format="YYYY-MM-DD"
                @change="applyRecordFilters"
              />
            </div>
            <div class="filter-item">
              <span class="filter-label">结束日期</span>
              <el-date-picker
                v-model="recordFilters.endDate"
                type="date"
                placeholder="全部"
                value-format="YYYY-MM-DD"
                @change="applyRecordFilters"
              />
            </div>
          </FilterBar>
        </el-card>

        <TableWrapper v-loading="recordLoading">
          <el-table :data="workRecordList" stripe border>
            <el-table-column prop="stationName" label="场站" width="110" />
            <el-table-column prop="positionName" label="岗位" width="110" />
            <el-table-column prop="equipmentCode" label="设备编号" width="120" />
            <el-table-column prop="equipmentName" label="设备名称" width="140" show-overflow-tooltip />
            <el-table-column label="积分" width="110">
              <template #default="{ row }">
                {{ getRecordPoints(row) }}
              </template>
            </el-table-column>
            <el-table-column label="保养周期" width="110">
              <template #default="{ row }">
                {{ getCycleLabel(row.cycleType) }}
              </template>
            </el-table-column>
            <el-table-column prop="workDate" label="工作日期" width="120" />
            <el-table-column prop="executorName" label="执行人" width="110" />
            <el-table-column label="状态" width="110">
              <template #default="{ row }">
                <el-tag :type="getRecordStatusType(row)" size="small">
                  {{ getRecordStatusText(row) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="submitTime" label="提交时间" width="160" />
            <el-table-column label="操作" width="140">
              <template #default="{ row }">
                <template v-if="!row.isMissing">
                  <el-button link type="primary" size="small" @click="viewWorkRecord(row)">查看</el-button>
                  <el-button
                    v-if="row.status === 'completed'"
                    link type="success" size="small"
                    @click="showVerifyDialog(row)"
                  >验收</el-button>
                </template>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
          </el-table>
        </TableWrapper>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="recordPagination.page"
            v-model:page-size="recordPagination.pageSize"
            :total="recordPagination.total"
            :page-sizes="[5, 10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @current-change="loadWorkRecords"
            @size-change="loadWorkRecords"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 普通员工视图：只显示保养工作 -->
    <MaintenanceWorkPanel v-else :can-manage="canManage" />

    <!-- 岗位计划分配对话框 -->
    <FormDialog
      v-model="positionAssignDialogVisible"
      title="分配岗位保养计划"
      width="700px"
      destroy-on-close
      :show-confirm="false"
      :show-cancel="false"
    >
      <el-form :model="positionAssignForm" ref="positionAssignFormRef" label-width="100px">
        <el-form-item label="场站" prop="stationId" :rules="[{ required: true, message: '请选择场站', trigger: 'change' }]">
          <el-select v-model="positionAssignForm.stationId" placeholder="请选择场站" style="width: 100%;" @change="onPositionStationChange">
            <el-option v-for="s in stationList" :key="s.id" :label="s.stationName" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="岗位" prop="positionName" :rules="[{ required: true, message: '请选择岗位', trigger: 'change' }]">
          <el-select v-model="positionAssignForm.positionName" placeholder="请选择岗位" style="width: 100%;">
            <el-option v-for="p in stationPositions" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
        <el-form-item label="保养计划" prop="planIds" :rules="[{ required: true, message: '请选择保养计划', trigger: 'change' }]">
          <el-table
            ref="planSelectTableRef"
            :data="stationPlanOptions"
            border
            size="small"
            max-height="300"
            @selection-change="onPlanSelectionChange"
          >
            <el-table-column type="selection" width="50" />
            <el-table-column prop="equipmentCode" label="设备编号" width="120" />
            <el-table-column prop="equipmentName" label="设备名称" min-width="150" />
            <el-table-column prop="installLocation" label="安装位置" width="120" />
            <el-table-column label="保养周期" width="200">
              <template #default="{ row }">
                <div class="cycle-tags">
                  <el-tag v-if="row.hasDailyCycle" size="small" type="success">日</el-tag>
                  <el-tag v-if="row.hasWeeklyCycle" size="small" type="warning">周</el-tag>
                  <el-tag v-if="row.hasMonthlyCycle" size="small" type="primary">月</el-tag>
                  <el-tag v-if="row.hasYearlyCycle" size="small" type="danger">年</el-tag>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="positionAssignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPositionAssign" :loading="positionAssignSubmitting">确定分配</el-button>
      </template>
    </FormDialog>

    <!-- 保养工作记录详情对话框 -->
    <MaintenanceWorkRecordDetailDialog
      v-model:visible="recordDetailVisible"
      :record="currentRecord"
      :get-cycle-label="getCycleLabel"
    />

    <!-- 验收对话框 -->
    <FormDialog
      v-model="verifyDialogVisible"
      title="验收保养记录"
      width="500px"
      destroy-on-close
      :show-confirm="false"
      :show-cancel="false"
    >
      <el-form :model="verifyForm" label-width="100px">
        <el-form-item label="设备名称">
          <span>{{ verifyForm.equipmentName }}</span>
        </el-form-item>
        <el-form-item label="执行人">
          <span>{{ verifyForm.executorName }}</span>
        </el-form-item>
        <el-form-item label="验收结果" required>
          <el-radio-group v-model="verifyForm.result">
            <el-radio value="pass">通过</el-radio>
            <el-radio value="fail">不通过</el-radio>
          </el-radio-group>
        </el-form-item>
        <template v-if="verifyForm.result === 'fail'">
          <el-form-item label="扣分">
            <el-input-number
              v-model="verifyForm.deductionPoints"
              :min="-9999"
              :max="0"
              :step="1"
              controls-position="right"
            />
          </el-form-item>
          <el-form-item label="扣分说明">
            <el-input v-model="verifyForm.deductionRemark" type="textarea" :rows="2" placeholder="请输入扣分说明" />
          </el-form-item>
        </template>
        <el-form-item label="验收备注">
          <el-input v-model="verifyForm.remark" type="textarea" :rows="3" placeholder="请输入验收备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="verifyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitVerify" :loading="verifySubmitting">确认验收</el-button>
      </template>
    </FormDialog>

    <!-- 保养计划编辑对话框 -->
    <MaintenancePlanDialog
      ref="planFormRef"
      v-model:visible="planDialogVisible"
      :is-edit="planIsEdit"
      :plan-form="planForm"
      :plan-rules="planRules"
      :station-options="stationList"
      :saving="planSaving"
      :add-standard="addStandard"
      :remove-standard="removeStandard"
      @save="savePlan"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search, Download, Upload } from '@element-plus/icons-vue';
import dayjs from 'dayjs';

import { addTemplateInstructionSheet, applyTemplateHeaderStyle } from '@/utils/excelTemplate';
import { createListSuggestionFetcher } from '@/utils/filterAutocomplete';
import request from '@/api/request';
import { useUserStore } from '@/store/modules/user';
import MaintenanceWorkRecordDetailDialog from '@/modules/maintenance/components/MaintenanceWorkRecordDetailDialog.vue';
import MaintenanceWorkPanel from '@/modules/maintenance/components/MaintenanceWorkPanel.vue';
import MaintenancePlanDialog from '@/modules/maintenance/components/MaintenancePlanDialog.vue';
import FormDialog from '@/components/system/FormDialog.vue';
import { buildExportFileName, exportRowsToXlsx, fetchAllPaged } from '@/utils/tableExport';

const props = defineProps({
  defaultTab: { type: String, default: 'work' },
  hideTabs: { type: Boolean, default: false }
});

const userStore = useUserStore();

// 权限控制：只有站长、部门经理、副经理可以看到管理功能
const canManage = computed(() => userStore.hasRole(['station_manager', 'department_manager', 'deputy_manager']));

// Tab控制
const activeTab = ref(props.defaultTab || 'work');
const hideTabs = computed(() => props.hideTabs);

// 监听标签页切换
watch(
  () => props.defaultTab,
  (tab) => {
    if (tab && activeTab.value !== tab) {
      activeTab.value = tab;
    }
  },
  { immediate: true }
);

// ========== 保养计划相关 ==========
const planList = ref([]);
const planCycleOrder = ['daily', 'weekly', 'monthly', 'yearly'];
const planGroupMap = computed(() => {
  const map = new Map();
  (planList.value || []).forEach((plan) => {
    const groupKey = [
      plan.stationId || '',
      plan.equipmentCode || '',
      plan.equipmentName || '',
      plan.installLocation || ''
    ].join('||');
    if (!map.has(groupKey)) {
      map.set(groupKey, {
        groupKey,
        stationId: plan.stationId,
        stationName: plan.station?.stationName || '-',
        equipmentCode: plan.equipmentCode,
        equipmentName: plan.equipmentName,
        installLocation: plan.installLocation,
        weeklyDay: plan.weeklyDay,
        monthlyDay: plan.monthlyDay,
        yearlyMonth: plan.yearlyMonth,
        yearlyDay: plan.yearlyDay,
        cycles: {}
      });
    }
    const group = map.get(groupKey);
    if (plan.weeklyDay) group.weeklyDay = plan.weeklyDay;
    if (plan.monthlyDay) group.monthlyDay = plan.monthlyDay;
    if (plan.yearlyMonth) group.yearlyMonth = plan.yearlyMonth;
    if (plan.yearlyDay) group.yearlyDay = plan.yearlyDay;
    const cycleType = plan.cycleType || 'monthly';
    if (!group.cycles[cycleType]) {
      group.cycles[cycleType] = { cycleType, planIds: [], standards: [] };
    }
    const cycle = group.cycles[cycleType];
    cycle.planIds.push(plan.id);
    cycle.standards.push(...normalizeStandards(plan.maintenanceStandards));
  });
  return map;
});

const planTableRows = computed(() => {
  const rows = [];
  const groups = Array.from(planGroupMap.value.values());
  const start = (planPagination.value.page - 1) * planPagination.value.pageSize;
  const pagedGroups = groups.slice(start, start + planPagination.value.pageSize);

  pagedGroups.forEach((group) => {
    const cycleEntries = planCycleOrder
      .map((cycle) => group.cycles[cycle])
      .filter(Boolean);
    if (cycleEntries.length === 0) return;

    const cycleData = cycleEntries.map((cycle) => ({
      cycle,
      standards: cycle.standards.length > 0 ? cycle.standards : [null]
    }));
    const groupRowspan = cycleData.reduce((sum, item) => sum + item.standards.length, 0);

    cycleData.forEach((item, cycleIndex) => {
      item.standards.forEach((std, stdIndex) => {
        rows.push({
          groupKey: group.groupKey,
          rowKey: `${group.groupKey}||${item.cycle.cycleType}||${stdIndex}`,
          station: { stationName: group.stationName },
          stationId: group.stationId,
          equipmentCode: group.equipmentCode,
          equipmentName: group.equipmentName,
          installLocation: group.installLocation,
          cycleType: item.cycle.cycleType,
          planIds: item.cycle.planIds,
          standard: std ? { ...std } : null,
          _groupRowspan: cycleIndex === 0 && stdIndex === 0 ? groupRowspan : 0,
          _cycleRowspan: stdIndex === 0 ? item.standards.length : 0
        });
      });
    });
  });

  return rows;
});

const buildPlanExportRows = () => {
  const rows = [];
  const groups = Array.from(planGroupMap.value.values());

  groups.forEach((group) => {
    const cycleEntries = planCycleOrder
      .map((cycle) => group.cycles[cycle])
      .filter(Boolean);
    if (cycleEntries.length === 0) return;

    const cycleData = cycleEntries.map((cycle) => ({
      cycle,
      standards: cycle.standards.length > 0 ? cycle.standards : [null]
    }));

    cycleData.forEach((item) => {
      item.standards.forEach((std) => {
        rows.push({
          groupKey: group.groupKey,
          station: { stationName: group.stationName },
          equipmentCode: group.equipmentCode,
          equipmentName: group.equipmentName,
          installLocation: group.installLocation,
          cycleType: item.cycle.cycleType,
          standard: std ? { ...std } : null
        });
      });
    });
  });

  return rows;
};

const resolvePlanExportColumns = () => ([
  { label: '场站', value: (row) => row?.station?.stationName ?? '-' },
  { label: '设备编号', prop: 'equipmentCode' },
  { label: '设备名称', prop: 'equipmentName' },
  { label: '安装位置', prop: 'installLocation' },
  { label: '工作名称', value: (row) => row?.standard?.name ?? '-' },
  { label: '规范', value: (row) => row?.standard?.specification ?? '-' },
  { label: '积分', value: (row) => (row?.standard ? (row.standard.points ?? 0) : '-') },
  { label: '保养周期', value: (row) => getCycleLabel(row?.cycleType) },
  { label: '保养日期', value: (row) => getMaintenanceTimeText(row) }
]);

const handleExportPlans = async () => {
  if (planExporting.value) return;
  planExporting.value = true;
  try {
    const title = '设备保养计划';
    const fileName = buildExportFileName({ title });
    const rows = buildPlanExportRows();

    if (rows.length === 0) {
      ElMessage.warning('没有可导出的数据');
      return;
    }

    await exportRowsToXlsx({
      title,
      fileName,
      sheetName: '设备保养计划',
      columns: resolvePlanExportColumns(),
      rows
    });
    ElMessage.success('导出成功');
  } catch (error) {
    const msg = typeof error?.message === 'string' && error.message.trim() ? error.message.trim() : '导出失败';
    ElMessage.error(msg);
  } finally {
    planExporting.value = false;
  }
};

const getPositionCycleText = (row) => {
  const labels = [];
  if (row?.hasDailyCycle) labels.push('日保养');
  if (row?.hasWeeklyCycle) labels.push('周保养');
  if (row?.hasMonthlyCycle) labels.push('月保养');
  if (row?.hasYearlyCycle) labels.push('年保养');
  return labels.length > 0 ? labels.join('/') : '-';
};

const resolvePositionExportColumns = () => ([
  { label: '场站', prop: 'stationName' },
  { label: '岗位', prop: 'positionName' },
  { label: '设备编号', prop: 'equipmentCode' },
  { label: '设备名称', prop: 'equipmentName' },
  { label: '安装位置', prop: 'installLocation' },
  { label: '保养周期', value: (row) => getPositionCycleText(row) }
]);

const handleExportPositionPlans = async () => {
  if (positionExporting.value) return;
  positionExporting.value = true;
  try {
    const title = '保养计划岗位分配';
    const fileName = buildExportFileName({ title });

    const { rows } = await fetchAllPaged({
      fetchPage: ({ page, pageSize }) => {
        const params = buildPositionPlanParamsForPage({ page, pageSize });
        return request.get('/maintenance-position-plans', { params: { ...params } });
      }
    });

    const list = Array.isArray(rows) ? rows : [];
    const exportRows = list.map(normalizePositionPlan);
    if (exportRows.length === 0) {
      ElMessage.warning('没有可导出的数据');
      return;
    }

    await exportRowsToXlsx({
      title,
      fileName,
      sheetName: title,
      columns: resolvePositionExportColumns(),
      rows: exportRows
    });
    ElMessage.success('导出成功');
  } catch (error) {
    const msg = typeof error?.message === 'string' && error.message.trim() ? error.message.trim() : '导出失败';
    ElMessage.error(msg);
  } finally {
    positionExporting.value = false;
  }
};

const resolveWorkRecordExportColumns = () => ([
  { label: '场站', prop: 'stationName' },
  { label: '岗位', prop: 'positionName' },
  { label: '设备编号', prop: 'equipmentCode' },
  { label: '设备名称', prop: 'equipmentName' },
  { label: '积分', value: (row) => getRecordPoints(row) },
  { label: '保养周期', value: (row) => getCycleLabel(row?.cycleType) },
  { label: '工作日期', prop: 'workDate' },
  { label: '执行人', prop: 'executorName' },
  { label: '状态', value: (row) => getRecordStatusText(row) },
  { label: '提交时间', prop: 'submitTime' }
]);

const handleExportWorkRecords = async () => {
  if (recordExporting.value) return;
  recordExporting.value = true;
  try {
    const title = '保养工作记录';
    const fileName = buildExportFileName({ title });

    const { rows } = await fetchAllPaged({
      fetchPage: ({ page, pageSize }) => {
        const params = buildWorkRecordParamsForPage({ page, pageSize });
        return request.get('/maintenance-work-records', { params: { ...params } });
      }
    });

    const list = Array.isArray(rows) ? rows : [];
    const exportRows = list.filter(Boolean).map(normalizeWorkRecord);
    if (exportRows.length === 0) {
      ElMessage.warning('没有可导出的数据');
      return;
    }

    await exportRowsToXlsx({
      title,
      fileName,
      sheetName: title,
      columns: resolveWorkRecordExportColumns(),
      rows: exportRows
    });
    ElMessage.success('导出成功');
  } catch (error) {
    const msg = typeof error?.message === 'string' && error.message.trim() ? error.message.trim() : '导出失败';
    ElMessage.error(msg);
  } finally {
    recordExporting.value = false;
  }
};

const planSpanMethod = ({ row, columnIndex }) => {
  const groupColumns = [1, 2, 3, 4, 10];
  if (groupColumns.includes(columnIndex)) {
    if (row._groupRowspan > 0) {
      return { rowspan: row._groupRowspan, colspan: 1 };
    }
    return { rowspan: 0, colspan: 0 };
  }
  // 合并同一周期下的“保养周期/保养日期”，避免重复显示
  const cycleColumns = [8, 9];
  if (cycleColumns.includes(columnIndex)) {
    if (row._cycleRowspan > 0) {
      return { rowspan: row._cycleRowspan, colspan: 1 };
    }
    return { rowspan: 0, colspan: 0 };
  }
};

const planLoading = ref(false);
const today = dayjs().format('YYYY-MM-DD');
const defaultPlanFilters = {
  stationId: 'all',
  cycleType: 'all',
  keyword: ''
};
const planFilters = ref({ ...defaultPlanFilters });

const planKeywordSuggestionSource = computed(() => {
  const plans = planList.value;
  if (!Array.isArray(plans)) return [];

  const values = [];
  plans.forEach((plan) => {
    values.push(plan.equipmentCode);
    values.push(plan.equipmentName);
    const standards = Array.isArray(plan.maintenanceStandards) ? plan.maintenanceStandards : [];
    standards.forEach((standard) => {
      values.push(standard?.name);
      values.push(standard?.specification);
    });
  });
  return values;
});
const fetchPlanKeywordSuggestions = createListSuggestionFetcher(
  () => planKeywordSuggestionSource.value,
  (value) => value
);

const planPagination = ref({
  page: 1,
  pageSize: 5,
  total: 0
});
const planDialogVisible = ref(false);
const planFormRef = ref(null);
const planIsEdit = ref(false);
const planSaving = ref(false);
const planForm = ref({
  stationId: null,
  equipmentCode: '',
  equipmentName: '',
  installLocation: '',
  weeklyDay: null,
  monthlyDay: null,
  yearlyMonth: null,
  yearlyDay: null,
  cycleStandards: { daily: [], weekly: [], monthly: [], yearly: [] },
  cyclePlanIds: { daily: [], weekly: [], monthly: [], yearly: [] }
});
const planRules = {
  stationId: [{ required: true, message: '请选择场站', trigger: 'change' }],
  equipmentCode: [{ required: true, message: '请输入设备编号', trigger: 'blur' }],
  equipmentName: [{ required: true, message: '请输入设备名称', trigger: 'blur' }]
};
const planFileInputRef = ref(null);
const planTableRef = ref(null);
const selectedPlanRows = ref([]);

// ========== 保养计划岗位分配相关 ==========
const stationList = ref([]);
const positionPlanList = ref([]);
const positionPlanSuggestionList = ref([]);
const positionLoading = ref(false);
const defaultPositionFilters = {
  stationId: 'all',
  positionName: 'all',
  equipmentCode: '',
  equipmentName: '',
  installLocation: '',
  cycleType: 'all'
};
const positionFilters = ref({ ...defaultPositionFilters });

const fetchPositionEquipmentCodeSuggestions = createListSuggestionFetcher(
  () => positionPlanSuggestionList.value,
  (row) => row.equipmentCode
);
const fetchPositionEquipmentNameSuggestions = createListSuggestionFetcher(
  () => positionPlanSuggestionList.value,
  (row) => row.equipmentName
);
const fetchPositionInstallLocationSuggestions = createListSuggestionFetcher(
  () => positionPlanSuggestionList.value,
  (row) => row.installLocation
);

const positionPagination = ref({
  page: 1,
  pageSize: 5,
  total: 0
});

const positionAssignDialogVisible = ref(false);
const positionAssignFormRef = ref(null);
const positionAssignSubmitting = ref(false);
const positionAssignForm = ref({
  stationId: null,
  positionName: '',
  planIds: []
});
const stationPositions = ref([]);
const stationPlanOptions = ref([]);
const selectedPlanIds = ref([]);
const planSelectTableRef = ref(null);

const allPositions = computed(() => {
  const positions = new Set();
  positionPlanList.value.forEach(item => {
    if (item.positionName) positions.add(item.positionName);
  });
  ['操作1', '操作2', '操作3', '控制室', '机修'].forEach(p => positions.add(p));
  return Array.from(positions);
});

// ========== 保养工作记录相关 ==========
const workRecordList = ref([]);
const workRecordSuggestionList = ref([]);
const recordLoading = ref(false);
const planExporting = ref(false);
const positionExporting = ref(false);
const recordExporting = ref(false);
const defaultRecordFilters = {
  stationId: 'all',
  positionName: '',
  equipmentCode: '',
  equipmentName: '',
  cycleType: 'all',
  executorName: '',
  status: 'all',
  startDate: dayjs().subtract(5, 'day').format('YYYY-MM-DD'),
  endDate: today
};
const recordFilters = ref({ ...defaultRecordFilters });

const fetchRecordPositionNameSuggestions = createListSuggestionFetcher(
  () => workRecordSuggestionList.value,
  (row) => row.positionName
);
const fetchRecordEquipmentCodeSuggestions = createListSuggestionFetcher(
  () => workRecordSuggestionList.value,
  (row) => row.equipmentCode
);
const fetchRecordEquipmentNameSuggestions = createListSuggestionFetcher(
  () => workRecordSuggestionList.value,
  (row) => row.equipmentName
);
const fetchRecordExecutorNameSuggestions = createListSuggestionFetcher(
  () => workRecordSuggestionList.value,
  (row) => row.executorName
);

const recordPagination = ref({
  page: 1,
  pageSize: 5,
  total: 0
});
const recordDetailVisible = ref(false);
const currentRecord = ref(null);

// 验收相关
const verifyDialogVisible = ref(false);
const verifySubmitting = ref(false);
const verifyForm = ref({
  id: null,
  equipmentName: '',
  executorName: '',
  result: 'pass',
  remark: '',
  deductionPoints: 0,
  deductionRemark: ''
});

// ========== 辅助函数 ==========
const getCycleLabel = (cycle) => {
  const labels = { daily: '日保养', weekly: '周保养', monthly: '月保养', yearly: '年保养' };
  return labels[cycle] || cycle;
};

const normalizePointsValue = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const normalizeStandards = (standards) => {
  if (!standards) return [];
  let normalized = standards;
  if (typeof normalized === 'string') {
    try {
      normalized = JSON.parse(normalized);
    } catch {
      return [{ name: normalized, specification: '', points: 0 }];
    }
  }
  if (!Array.isArray(normalized)) return [];
  return normalized
    .map((item) => {
      if (typeof item === 'string') {
        return { name: item, specification: '', points: 0 };
      }
      return {
        name: item?.name || '',
        specification: item?.specification || '',
        points: normalizePointsValue(item?.points)
      };
    })
    .filter((item) => item.name || item.specification);
};

const getMaintenanceTimeText = (row) => {
  const cycleType = row.cycleType;
  const group = planGroupMap.value.get(row.groupKey);
  if (cycleType === 'daily') {
    return '每日';
  } else if (cycleType === 'weekly') {
    const weeklyDay = group?.weeklyDay;
    if (weeklyDay) {
      const weekDays = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
      return `每周${weekDays[weeklyDay] || weeklyDay}`;
    }
    return '每周';
  } else if (cycleType === 'monthly') {
    const monthlyDay = group?.monthlyDay;
    if (monthlyDay) {
      return `每月${monthlyDay}号`;
    }
    return '每月';
  } else if (cycleType === 'yearly') {
    const yearlyMonth = group?.yearlyMonth;
    const yearlyDay = group?.yearlyDay;
    if (yearlyMonth && yearlyDay) {
      return `每年${yearlyMonth}月${yearlyDay}日`;
    } else if (yearlyMonth) {
      return `每年${yearlyMonth}月`;
    }
    return '每年';
  }
  return '-';
};

const getRecordStatusType = (row) => {
  if (row?.status === 'missed') return 'danger';
  const types = { pending: 'info', completed: 'warning', verified: 'success' };
  return types[row?.status] || 'info';
};

const getRecordStatusText = (row) => {
  if (row?.status === 'missed') return row.missedLabel || '未完成';
  const texts = { pending: '待完成', completed: '已完成', verified: '已验收' };
  return texts[row?.status] || row?.status || '';
};

const isQualifiedValue = (value) => value === true || value === 'yes' || value === 1 || value === 'true';

const getRecordPoints = (row) => {
  if (!row || row.isMissing) return '-';
  if (row.status !== 'completed' && row.status !== 'verified') return '-';
  const items = Array.isArray(row.maintenanceItems) ? row.maintenanceItems : [];
  if (items.length === 0) return 0;
  return items.reduce((sum, item) => {
    if (!item || typeof item === 'string') return sum;
    const points = normalizePointsValue(item?.points);
    const flag = item?.qualified ?? item?.confirmed;
    return isQualifiedValue(flag) ? sum + points : sum;
  }, 0);
};

// ========== 数据加载 ==========
const loadStations = async () => {
  try {
    const res = await request.get('/stations/all');
    stationList.value = (res.list || res || []).map(s => ({
      id: s.id,
      stationName: s.station_name || s.stationName,
      status: s.status
    }));
  } catch (e) {
  }
};

// 加载保养计划列表
const loadPlanList = async () => {
  planLoading.value = true;
  try {
    const params = {
      page: 1,
      pageSize: 5000,
      stationId: planFilters.value.stationId === 'all' ? undefined : planFilters.value.stationId,
      cycleType: planFilters.value.cycleType === 'all' ? undefined : planFilters.value.cycleType,
      keyword: planFilters.value.keyword?.trim() || undefined
    };
    const res = await request.get('/maintenance-plan-library', { params });

    planList.value = (res.list || []).map(item => ({
      id: item.id,
      stationId: item.station_id,
      station: { stationName: item.station?.station_name || '-' },
      equipmentCode: item.equipment_code,
      equipmentName: item.equipment_name,
      installLocation: item.install_location,
      cycleType: item.cycle_type,
      weeklyDay: item.weekly_day,
      monthlyDay: item.monthly_day,
      yearlyMonth: item.yearly_month,
      yearlyDay: item.yearly_day,
      maintenanceStandards: normalizeStandards(item.maintenance_standards || [])
    }));
    planPagination.value.total = planGroupMap.value.size;
    const maxPage = Math.max(1, Math.ceil(planPagination.value.total / planPagination.value.pageSize));
    if (planPagination.value.page > maxPage) {
      planPagination.value.page = 1;
    }
    selectedPlanRows.value = [];
    planTableRef.value?.clearSelection();
  } catch (e) {
  } finally {
    planLoading.value = false;
  }
};

const normalizePositionPlan = (item) => ({
  id: item.id,
  stationId: item.station_id,
  stationName: item.station?.station_name || '-',
  positionName: item.position_name,
  planId: item.plan_id,
  equipmentCode: item.plan?.equipment_code || '-',
  equipmentName: item.plan?.equipment_name || '-',
  installLocation: item.plan?.install_location || '-',
  hasDailyCycle: item.plan?.daily_enabled ?? false,
  hasWeeklyCycle: item.plan?.weekly_enabled ?? false,
  hasMonthlyCycle: item.plan?.monthly_enabled ?? false,
  hasYearlyCycle: item.plan?.yearly_enabled ?? false
});

const normalizeWorkRecord = (item) => ({
  id: item.id,
  recordCode: item.record_code,
  stationId: item.station_id,
  stationName: item.station?.station_name || '-',
  planId: item.plan_id,
  positionName: item.position_name,
  equipmentCode: item.equipment_code,
  equipmentName: item.equipment_name,
  installLocation: item.install_location,
  cycleType: item.cycle_type,
  workDate: item.work_date,
  executorId: item.executor_id,
  executorName: item.executor_name || '-',
  maintenanceItems: item.maintenance_items || [],
  maintenanceTools: item.maintenance_tools,
  workHours: item.work_hours,
  consumablesList: item.consumables_list || [],
  partsList: item.parts_list || [],
  remark: item.remark,
  status: item.status,
  submitTime: item.submit_time ? dayjs(item.submit_time).format('YYYY-MM-DD HH:mm:ss') : '-',
  verifierId: item.verifier_id,
  verifierName: item.verifier_name,
  verifyTime: item.verify_time ? dayjs(item.verify_time).format('YYYY-MM-DD HH:mm:ss') : '-',
  verifyResult: item.verify_result,
  verifyRemark: item.verify_remark,
  deductionPoints: item.deduction_points,
  deductionRemark: item.deduction_remark,
  missedLabel: item.missed_label || item.missedLabel,
  isMissing: item.is_missing || item.isMissing || item.status === 'missed'
});

const applyPlanFilters = () => {
  planPagination.value.page = 1;
  loadPlanList();
};

const resetPlanFilters = () => {
  planFilters.value = { ...defaultPlanFilters };
  planPagination.value.page = 1;
  loadPlanList();
};

const handlePlanSelectionChange = (rows) => {
  selectedPlanRows.value = rows;
};

const buildPlanGroupKey = (row) => {
  return [
    row?.stationId ?? '',
    row?.equipmentCode ?? '',
    row?.equipmentName ?? '',
    row?.installLocation ?? ''
  ].join('||');
};

const getPlanIdsFromCycles = (cycles, cycleType) => {
  if (!cycles) return [];
  if (cycleType) {
    return cycles?.[cycleType]?.planIds || [];
  }
  const ids = [];
  planCycleOrder.forEach((key) => {
    const planIds = cycles?.[key]?.planIds || [];
    planIds.forEach((id) => ids.push(id));
  });
  return ids;
};

const getPlanIdsFromRow = (row) => {
  const idSet = new Set();
  const addIds = (ids) => {
    (ids || []).forEach((id) => idSet.add(id));
  };

  addIds(row?.planIds);
  addIds(getPlanIdsFromCycles(row?.cycles, row?.cycleType));

  if (!idSet.size) {
    const groupKey = row?.groupKey || buildPlanGroupKey(row);
    const group = groupKey ? planGroupMap.value.get(groupKey) : null;
    addIds(getPlanIdsFromCycles(group?.cycles, row?.cycleType));
  }

  if (!idSet.size && Array.isArray(planList.value)) {
    const rowGroupKey = row?.groupKey || buildPlanGroupKey(row);
    planList.value.forEach((plan) => {
      const planGroupKey = buildPlanGroupKey(plan);
      if (rowGroupKey && planGroupKey !== rowGroupKey) return;
      if (row?.cycleType && plan.cycleType !== row.cycleType) return;
      if (plan?.id) idSet.add(plan.id);
    });
  }

  return Array.from(idSet.values());
};

const collectPlanIds = (rows) => {
  const idSet = new Set();
  (rows || []).forEach((row) => {
    getPlanIdsFromRow(row).forEach((id) => idSet.add(id));
  });
  return Array.from(idSet.values());
};

const fetchPlanIdsByRow = async (row) => {
  const stationId = row?.stationId ?? null;
  const equipmentCode = row?.equipmentCode ? String(row.equipmentCode).trim() : '';
  const equipmentName = row?.equipmentName ? String(row.equipmentName).trim() : '';
  const installLocation = row?.installLocation ? String(row.installLocation).trim() : '';
  const cycleType = row?.cycleType ?? '';
  let keyword = '';
  if (equipmentCode) {
    keyword = equipmentCode;
  } else if (equipmentName) {
    keyword = equipmentName;
  }

  if (!stationId && !keyword) return [];

  try {
    const params = { page: 1, pageSize: 200 };
    if (stationId) {
      params.stationId = stationId;
    }
    if (cycleType) {
      params.cycleType = cycleType;
    }
    if (keyword) {
      params.keyword = keyword;
    }
    const res = await request.get('/maintenance-plan-library', { params });
    const list = Array.isArray(res?.list) ? res.list : [];
    const matchedIds = list
      .filter((item) => {
        const itemCode = item?.equipment_code ?? '';
        const itemName = item?.equipment_name ?? '';
        const itemLocation = item?.install_location ?? '';
        if (equipmentCode && itemCode !== equipmentCode) return false;
        if (!equipmentCode && equipmentName && itemName !== equipmentName) return false;
        if (installLocation && itemLocation !== installLocation) return false;
        return true;
      })
      .map((item) => item?.id)
      .filter((id) => id !== undefined && id !== null);
    return Array.from(new Set(matchedIds));
  } catch (e) {
    return [];
  }
};

const collectPlanIdsWithFetch = async (rows) => {
  const idSet = new Set();
  for (const row of rows || []) {
    const localIds = getPlanIdsFromRow(row);
    if (localIds.length) {
      localIds.forEach((id) => idSet.add(id));
      continue;
    }
    const fetchedIds = await fetchPlanIdsByRow(row);
    fetchedIds.forEach((id) => idSet.add(id));
  }
  return Array.from(idSet.values());
};

const batchDeletePlans = async () => {
  if (!selectedPlanRows.value.length) {
    ElMessage.warning('请选择需要删除的保养计划');
    return;
  }
  const planIds = await collectPlanIdsWithFetch(selectedPlanRows.value);
  if (!planIds.length) {
    ElMessage.warning('未识别到可删除的保养计划，请刷新后重试');
    return;
  }
  try {
    await ElMessageBox.confirm(`确认删除已选择的${planIds.length}条保养计划？`, '删除确认', { type: 'warning' });
    for (const id of planIds) {
      await request.delete(`/maintenance-plan-library/${id}`);
    }
    ElMessage.success('批量删除成功');
    selectedPlanRows.value = [];
    planTableRef.value?.clearSelection();
    loadPlanList();
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('批量删除失败');
    }
  }
};

// 显示保养计划对话框
const showPlanDialog = (row = null) => {
  if (row) {
    planIsEdit.value = true;
    const groupKey = row.groupKey ?? buildPlanGroupKey(row);
    const group = groupKey ? planGroupMap.value.get(groupKey) : null;
    const cycles = row.cycles ?? group?.cycles ?? {};
    const rowCycleType = row.cycleType ?? '';
    const rowPlanIds = Array.isArray(row.planIds) ? row.planIds : [];
    const getCycleStandards = (cycleType) => {
      const standards = cycles?.[cycleType]?.standards;
      if (Array.isArray(standards) && standards.length > 0) {
        return normalizeStandards(standards).map((std) => ({ ...std }));
      }
      if (cycleType === rowCycleType && row.standard) {
        return normalizeStandards([row.standard]).map((std) => ({ ...std }));
      }
      return [];
    };
    const getCyclePlanIds = (cycleType) => {
      const ids = cycles?.[cycleType]?.planIds;
      if (Array.isArray(ids) && ids.length > 0) {
        return [...ids];
      }
      if (cycleType === rowCycleType && rowPlanIds.length > 0) {
        return [...rowPlanIds];
      }
      return [];
    };
    planForm.value = {
      stationId: row.stationId ?? group?.stationId ?? null,
      equipmentCode: row.equipmentCode ?? group?.equipmentCode ?? '',
      equipmentName: row.equipmentName ?? group?.equipmentName ?? '',
      installLocation: row.installLocation ?? group?.installLocation ?? '',
      weeklyDay: row.weeklyDay ?? group?.weeklyDay ?? null,
      monthlyDay: row.monthlyDay ?? group?.monthlyDay ?? null,
      yearlyMonth: row.yearlyMonth ?? group?.yearlyMonth ?? null,
      yearlyDay: row.yearlyDay ?? group?.yearlyDay ?? null,
      cycleStandards: {
        daily: getCycleStandards('daily'),
        weekly: getCycleStandards('weekly'),
        monthly: getCycleStandards('monthly'),
        yearly: getCycleStandards('yearly')
      },
      cyclePlanIds: {
        daily: getCyclePlanIds('daily'),
        weekly: getCyclePlanIds('weekly'),
        monthly: getCyclePlanIds('monthly'),
        yearly: getCyclePlanIds('yearly')
      }
    };
  } else {
    planIsEdit.value = false;
    planForm.value = {
      stationId: null,
      equipmentCode: '',
      equipmentName: '',
      installLocation: '',
      weeklyDay: null,
      monthlyDay: null,
      yearlyMonth: null,
      yearlyDay: null,
      cycleStandards: { daily: [], weekly: [], monthly: [], yearly: [] },
      cyclePlanIds: { daily: [], weekly: [], monthly: [], yearly: [] }
    };
  }
  planDialogVisible.value = true;
};

// 添加保养标准
const addStandard = (cycle) => {
  if (!planForm.value.cycleStandards[cycle]) return;
  planForm.value.cycleStandards[cycle].push({ name: '', specification: '', points: 0 });
};

// 移除保养标准
const removeStandard = (cycle, idx) => {
  if (!planForm.value.cycleStandards[cycle]) return;
  planForm.value.cycleStandards[cycle].splice(idx, 1);
};

// 获取有效标准
const getValidStandards = (list) => {
  return (list || [])
    .map((item) => {
      const name = String(item?.name ?? '').trim();
      const specification = String(item?.specification ?? '').trim();
      return {
        name,
        specification,
        points: normalizePointsValue(item?.points)
      };
    })
    .filter((item) => item.name || item.specification);
};

// 保存保养计划
const savePlan = async () => {
  try {
    await planFormRef.value?.validate();
  } catch {
    return;
  }

  const cyclePayloads = [
    { cycleType: 'daily', standards: getValidStandards(planForm.value.cycleStandards.daily) },
    { cycleType: 'weekly', standards: getValidStandards(planForm.value.cycleStandards.weekly) },
    { cycleType: 'monthly', standards: getValidStandards(planForm.value.cycleStandards.monthly) },
    { cycleType: 'yearly', standards: getValidStandards(planForm.value.cycleStandards.yearly) }
  ];

  const hasAnyStandards = cyclePayloads.some(item => item.standards.length > 0);
  if (!hasAnyStandards) {
    ElMessage.warning('请至少填写一个周期的保养标准');
    return;
  }

  planSaving.value = true;
  try {
    const baseData = {
      stationId: planForm.value.stationId,
      equipmentCode: planForm.value.equipmentCode,
      equipmentName: planForm.value.equipmentName,
      installLocation: planForm.value.installLocation,
      weeklyDay: planForm.value.weeklyDay,
      monthlyDay: planForm.value.monthlyDay,
      yearlyMonth: planForm.value.yearlyMonth,
      yearlyDay: planForm.value.yearlyDay
    };

    for (const item of cyclePayloads) {
      const planIds = planForm.value.cyclePlanIds[item.cycleType] || [];
      if (item.standards.length === 0) {
        for (const id of planIds) {
          await request.delete(`/maintenance-plan-library/${id}`);
        }
        continue;
      }
      const data = {
        ...baseData,
        cycleType: item.cycleType,
        maintenanceStandards: item.standards
      };
      if (planIsEdit.value && planIds.length > 0) {
        await request.put(`/maintenance-plan-library/${planIds[0]}`, data);
        for (let i = 1; i < planIds.length; i++) {
          await request.delete(`/maintenance-plan-library/${planIds[i]}`);
        }
      } else if (item.standards.length > 0) {
        await request.post('/maintenance-plan-library', data);
      }
    }

    ElMessage.success('保存成功');
    planDialogVisible.value = false;
    loadPlanList();
  } catch (e) {
    ElMessage.error(e.message || '保存失败');
  } finally {
    planSaving.value = false;
  }
};

// 删除保养计划
const deletePlan = async (row) => {
  let planIds = getPlanIdsFromRow(row);
  if (!planIds.length) {
    planIds = await fetchPlanIdsByRow(row);
  }
  if (!planIds.length) {
    ElMessage.warning('未识别到可删除的保养计划，请刷新后重试');
    return;
  }
  try {
    await ElMessageBox.confirm(`确认删除设备"${row.equipmentName}"的所有保养计划？`, '删除确认', { type: 'warning' });
    for (const id of planIds) {
      await request.delete(`/maintenance-plan-library/${id}`);
    }
    ElMessage.success('删除成功');
    loadPlanList();
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

// 下载保养计划模板
const downloadPlanTemplate = () => {
  import('xlsx').then((XLSX) => {
    const templateData = [
      {
        '场站': '示例场站',
        '设备编号': 'EQ0001',
        '设备名称': '压缩机',
        '安装位置': '1号站',
        '保养周期': '月保养',
        '周检查日': '',
        '月检查日': 15,
        '年检查月': '',
        '年检查日': '',
        '工作名称': '润滑检查',
        '规范': '检查润滑油位',
        '积分': 5
      },
      {
        '场站': '示例场站',
        '设备编号': 'EQ0001',
        '设备名称': '压缩机',
        '安装位置': '1号站',
        '保养周期': '周保养',
        '周检查日': 3,
        '月检查日': '',
        '年检查月': '',
        '年检查日': '',
        '工作名称': '滤网清洁',
        '规范': '清理过滤网',
        '积分': 3
      },
      {
        '场站': '示例场站',
        '设备编号': 'EQ0002',
        '设备名称': '风机',
        '安装位置': '2号站',
        '保养周期': '年保养',
        '周检查日': '',
        '月检查日': '',
        '年检查月': 12,
        '年检查日': 20,
        '工作名称': '运行检查',
        '规范': '检查运行状态',
        '积分': 8
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    applyTemplateHeaderStyle(XLSX, ws, 1);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '保养计划');
    addTemplateInstructionSheet(XLSX, wb, [
      ['场站', '必填，系统已有场站名称。'],
      ['设备编号', '必填，设备唯一编号。'],
      ['设备名称', '必填，设备名称。'],
      ['安装位置', '选填，设备安装位置说明。'],
      ['保养周期', '必填，日保养/周保养/月保养/年保养。'],
      ['周检查日', '周期为“周保养”时必填，1-7 或 周一-周日。'],
      ['月检查日', '周期为“月保养”时必填，1-31。'],
      ['年检查月', '周期为“年保养”时必填，1-12。'],
      ['年检查日', '周期为“年保养”时必填，1-31。'],
      ['工作名称', '选填，保养工作/检查项名称。'],
      ['规范', '选填，操作规范/注意事项。'],
      ['积分', '必填，整数，默认0。']
    ]);
    XLSX.writeFile(wb, '保养计划模板.xlsx');
    ElMessage.success('模板已下载');
  });
};

// 触发导入
const triggerPlanImport = () => {
  planFileInputRef.value?.click();
};

const parseScheduleNumber = (value, min, max) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number.parseInt(String(value).trim(), 10);
  if (Number.isNaN(parsed)) return null;
  if (min !== undefined && parsed < min) return null;
  if (max !== undefined && parsed > max) return null;
  return parsed;
};

const parseWeeklyDay = (value) => {
  const text = String(value ?? '').trim();
  if (!text) return null;
  const map = {
    '周一': 1,
    '周二': 2,
    '周三': 3,
    '周四': 4,
    '周五': 5,
    '周六': 6,
    '周日': 7,
    '周天': 7,
    '星期一': 1,
    '星期二': 2,
    '星期三': 3,
    '星期四': 4,
    '星期五': 5,
    '星期六': 6,
    '星期日': 7,
    '星期天': 7,
    '日': 7,
    '天': 7
  };
  if (map[text]) return map[text];
  return parseScheduleNumber(text, 1, 7);
};

// 处理导入
const handlePlanImport = async (event) => {
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
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const planMap = new Map();
    const cycleMap = { '日保养': 'daily', '周保养': 'weekly', '月保养': 'monthly', '年保养': 'yearly' };
    const headerRow = Array.isArray(jsonData[0]) ? jsonData[0] : [];
    const getHeaderValue = (value) => String(value ?? '').trim();
    const hasScheduleColumns = ['周检查日', '月检查日', '年检查月', '年检查日']
      .some(label => headerRow.some(cell => getHeaderValue(cell) === label));
    const findHeaderIndex = (labels, fallback) => {
      for (const label of labels) {
        const idx = headerRow.findIndex(cell => getHeaderValue(cell) === label);
        if (idx > -1) return idx;
      }
      return fallback;
    };

    const stationIndex = findHeaderIndex(['场站'], 0);
    const equipmentCodeIndex = findHeaderIndex(['设备编号'], 1);
    const equipmentNameIndex = findHeaderIndex(['设备名称'], 2);
    const installLocationIndex = findHeaderIndex(['安装位置'], 3);
    const cycleIndex = findHeaderIndex(['保养周期'], 4);
    const weeklyIndex = findHeaderIndex(['周检查日'], hasScheduleColumns ? 5 : -1);
    const monthlyIndex = findHeaderIndex(['月检查日'], hasScheduleColumns ? 6 : -1);
    const yearlyMonthIndex = findHeaderIndex(['年检查月'], hasScheduleColumns ? 7 : -1);
    const yearlyDayIndex = findHeaderIndex(['年检查日'], hasScheduleColumns ? 8 : -1);
    // 兼容旧模板：保养标准/保养规范
    const standardIndex = findHeaderIndex(['工作名称', '保养标准'], hasScheduleColumns ? 9 : 5);
    const specIndex = findHeaderIndex(['规范', '保养规范'], hasScheduleColumns ? 10 : 6);
    const pointsIndex = findHeaderIndex(['积分'], hasScheduleColumns ? 11 : 7);

    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;
      const stationName = String(row[stationIndex] ?? '').trim();
      const equipmentCode = String(row[equipmentCodeIndex] ?? '').trim();
      const equipmentName = String(row[equipmentNameIndex] ?? '').trim();
      const installLocation = String(row[installLocationIndex] ?? '').trim();
      const cycleLabel = String(row[cycleIndex] ?? '').trim();
      const cycleType = cycleMap[cycleLabel] ? cycleMap[cycleLabel] : 'monthly';
      if (!stationName || !equipmentCode || !equipmentName) continue;

      const weeklyDay = weeklyIndex > -1 ? parseWeeklyDay(row[weeklyIndex]) : null;
      const monthlyDay = monthlyIndex > -1 ? parseScheduleNumber(row[monthlyIndex], 1, 31) : null;
      const yearlyMonth = yearlyMonthIndex > -1 ? parseScheduleNumber(row[yearlyMonthIndex], 1, 12) : null;
      const yearlyDay = yearlyDayIndex > -1 ? parseScheduleNumber(row[yearlyDayIndex], 1, 31) : null;

      const key = `${stationName}||${equipmentCode}||${equipmentName}||${installLocation}||${cycleType}`;
      if (!planMap.has(key)) {
        planMap.set(key, {
          stationName,
          equipmentCode,
          equipmentName,
          installLocation,
          cycleType,
          weeklyDay: cycleType === 'weekly' ? weeklyDay : null,
          monthlyDay: cycleType === 'monthly' ? monthlyDay : null,
          yearlyMonth: cycleType === 'yearly' ? yearlyMonth : null,
          yearlyDay: cycleType === 'yearly' ? yearlyDay : null,
          maintenanceStandards: []
        });
      }
      const plan = planMap.get(key);
      if (cycleType === 'weekly' && plan.weeklyDay === null && weeklyDay !== null) {
        plan.weeklyDay = weeklyDay;
      }
      if (cycleType === 'monthly' && plan.monthlyDay === null && monthlyDay !== null) {
        plan.monthlyDay = monthlyDay;
      }
      if (cycleType === 'yearly' && plan.yearlyMonth === null && yearlyMonth !== null) {
        plan.yearlyMonth = yearlyMonth;
      }
      if (cycleType === 'yearly' && plan.yearlyDay === null && yearlyDay !== null) {
        plan.yearlyDay = yearlyDay;
      }

      const standardName = String(row[standardIndex] ?? '').trim();
      const standardSpec = String(row[specIndex] ?? '').trim();
      const standardPoints = pointsIndex > -1 ? normalizePointsValue(row[pointsIndex]) : 0;
      if (standardName || standardSpec) {
        plan.maintenanceStandards.push({
          name: standardName || '工作名称',
          specification: standardSpec,
          points: standardPoints
        });
      }
    }

    const plans = Array.from(planMap.values());
    if (plans.length === 0) {
      ElMessage.warning('未找到有效数据');
      return;
    }

    const res = await request.post('/maintenance-plan-library/batch-import', { plans });
    const successCount = res.success ?? res.successCount ?? 0;
    const failedCount = res.failed ?? 0;
    const firstError = Array.isArray(res.errors) && res.errors.length > 0 ? res.errors[0] : '';
    if (failedCount > 0) {
      ElMessage.warning(`导入完成: 成功${successCount}条，失败${failedCount}条${firstError ? `，例如：${firstError}` : ''}`);
    } else {
      ElMessage.success(`导入完成: 成功${successCount}条`);
    }
    loadPlanList();
  } catch (err) {
    ElMessage.error(err.message || '导入失败');
  } finally {
    if (planFileInputRef.value) planFileInputRef.value.value = '';
  }
};

const buildPositionPlanParamsForPage = ({ page, pageSize } = {}) => {
  const params = {};
  if (Number.isFinite(Number(page))) params.page = Number(page);
  if (Number.isFinite(Number(pageSize))) params.pageSize = Number(pageSize);

  if (positionFilters.value.stationId && positionFilters.value.stationId !== 'all') {
    params.stationId = positionFilters.value.stationId;
  }
  if (positionFilters.value.positionName && positionFilters.value.positionName !== 'all') {
    params.positionName = positionFilters.value.positionName;
  }
  const equipmentCode = String(positionFilters.value.equipmentCode ?? '').trim();
  if (equipmentCode) {
    params.equipmentCode = equipmentCode;
  }
  const equipmentName = String(positionFilters.value.equipmentName ?? '').trim();
  if (equipmentName) {
    params.equipmentName = equipmentName;
  }
  const installLocation = String(positionFilters.value.installLocation ?? '').trim();
  if (installLocation) {
    params.installLocation = installLocation;
  }
  if (positionFilters.value.cycleType && positionFilters.value.cycleType !== 'all') {
    params.cycleType = positionFilters.value.cycleType;
  }
  return params;
};

const buildWorkRecordParamsForPage = ({ page, pageSize } = {}) => {
  const params = {};
  if (Number.isFinite(Number(page))) params.page = Number(page);
  if (Number.isFinite(Number(pageSize))) params.pageSize = Number(pageSize);

  if (recordFilters.value.stationId && recordFilters.value.stationId !== 'all') {
    params.stationId = recordFilters.value.stationId;
  }
  const positionName = String(recordFilters.value.positionName ?? '').trim();
  if (positionName) {
    params.positionName = positionName;
  }
  const equipmentCode = String(recordFilters.value.equipmentCode ?? '').trim();
  if (equipmentCode) {
    params.equipmentCode = equipmentCode;
  }
  const equipmentName = String(recordFilters.value.equipmentName ?? '').trim();
  if (equipmentName) {
    params.equipmentName = equipmentName;
  }
  if (recordFilters.value.cycleType && recordFilters.value.cycleType !== 'all') {
    params.cycleType = recordFilters.value.cycleType;
  }
  const executorName = String(recordFilters.value.executorName ?? '').trim();
  if (executorName) {
    params.executorName = executorName;
  }
  if (recordFilters.value.status && recordFilters.value.status !== 'all') {
    params.status = recordFilters.value.status;
  }
  if (recordFilters.value.startDate) {
    params.startDate = recordFilters.value.startDate;
  }
  if (recordFilters.value.endDate) {
    params.endDate = recordFilters.value.endDate;
  }
  return params;
};

const loadPositionPlans = async () => {
  positionLoading.value = true;
  try {
    const params = buildPositionPlanParamsForPage({ page: positionPagination.value.page, pageSize: positionPagination.value.pageSize });
    const res = await request.get('/maintenance-position-plans', { params: { ...params } });
    const list = Array.isArray(res.list) ? res.list : [];
    positionPlanList.value = list.map(normalizePositionPlan);
    positionPagination.value.total = res.total || 0;
    loadPositionPlanSuggestions(params);
  } catch (e) {
  } finally {
    positionLoading.value = false;
  }
};

const loadPositionPlanSuggestions = async (baseParams) => {
  try {
    const params = {
      ...baseParams,
      page: 1,
      pageSize: 5000
    };
    const res = await request.get('/maintenance-position-plans', { params });
    const list = Array.isArray(res.list) ? res.list : [];
    positionPlanSuggestionList.value = list.map(normalizePositionPlan);
  } catch (e) {
    positionPlanSuggestionList.value = [];
  }
};

const applyPositionFilters = () => {
  positionPagination.value.page = 1;
  loadPositionPlans();
};

const resetPositionFilters = () => {
  positionFilters.value = { ...defaultPositionFilters };
  positionPagination.value.page = 1;
  loadPositionPlans();
};

const loadWorkRecords = async () => {
  recordLoading.value = true;
  try {
    const params = buildWorkRecordParamsForPage({ page: recordPagination.value.page, pageSize: recordPagination.value.pageSize });
    const res = await request.get('/maintenance-work-records', { params: { ...params } });
    const records = Array.isArray(res.list) ? res.list.filter(Boolean) : [];
    workRecordList.value = records.map(normalizeWorkRecord);
    recordPagination.value.total = res.total || 0;
    loadWorkRecordSuggestions(params);
  } catch (e) {
  } finally {
    recordLoading.value = false;
  }
};

const loadWorkRecordSuggestions = async (baseParams) => {
  try {
    const params = {
      ...baseParams,
      page: 1,
      pageSize: 5000
    };
    const res = await request.get('/maintenance-work-records', { params });
    const records = Array.isArray(res.list) ? res.list.filter(Boolean) : [];
    workRecordSuggestionList.value = records.map(normalizeWorkRecord);
  } catch (e) {
    workRecordSuggestionList.value = [];
  }
};

const applyRecordFilters = () => {
  recordPagination.value.page = 1;
  loadWorkRecords();
};

const resetRecordFilters = () => {
  recordFilters.value = { ...defaultRecordFilters };
  recordPagination.value.page = 1;
  loadWorkRecords();
};

// ========== 岗位分配操作 ==========
const showPositionAssignDialog = () => {
  positionAssignForm.value = {
    stationId: null,
    positionName: '',
    planIds: []
  };
  stationPositions.value = [];
  stationPlanOptions.value = [];
  selectedPlanIds.value = [];
  positionAssignDialogVisible.value = true;
};

const onPositionStationChange = async (stationId) => {
  positionAssignForm.value.positionName = '';
  positionAssignForm.value.planIds = [];
  selectedPlanIds.value = [];

  if (!stationId) {
    stationPositions.value = [];
    stationPlanOptions.value = [];
    return;
  }

  // 加载场站岗位
  try {
    const res = await request.get('/position-jobs/positions', { params: { stationId } });
    const positions = new Set();
    const source = Array.isArray(res) ? res : (res.list || res || []);
    source.forEach((item) => {
      if (typeof item === 'string' && item.trim()) {
        positions.add(item.trim());
        return;
      }
      if (item?.position_name) {
        positions.add(item.position_name);
      }
    });
    stationPositions.value = Array.from(positions);
  } catch (e) {
    stationPositions.value = ['操作1', '操作2', '操作3', '控制室', '机修'];
  }

  // 加载场站保养计划
  try {
    const res = await request.get('/maintenance-plan-library', { params: { stationId, pageSize: 200 } });
    const planMap = new Map();
    (res.list || []).forEach(item => {
      const key = `${item.equipment_code}||${item.equipment_name}||${item.install_location}`;
      if (!planMap.has(key)) {
        planMap.set(key, {
          key,
          planId: item.id,
          planIds: [item.id],
          equipmentCode: item.equipment_code,
          equipmentName: item.equipment_name,
          installLocation: item.install_location,
          hasDailyCycle: false,
          hasWeeklyCycle: false,
          hasMonthlyCycle: false,
          hasYearlyCycle: false
        });
      }
      const plan = planMap.get(key);
      if (plan && Array.isArray(plan.planIds) && !plan.planIds.includes(item.id)) {
        plan.planIds.push(item.id);
      }
      if (item.cycle_type === 'daily') plan.hasDailyCycle = true;
      if (item.cycle_type === 'weekly') plan.hasWeeklyCycle = true;
      if (item.cycle_type === 'monthly') plan.hasMonthlyCycle = true;
      if (item.cycle_type === 'yearly') plan.hasYearlyCycle = true;
    });
    stationPlanOptions.value = Array.from(planMap.values());
  } catch (e) {
    stationPlanOptions.value = [];
  }
};

const onPlanSelectionChange = (selection) => {
  const planIdSet = new Set();
  selection.forEach((item) => {
    const ids = Array.isArray(item.planIds) && item.planIds.length
      ? item.planIds
      : (item.planId ? [item.planId] : []);
    ids.forEach((id) => planIdSet.add(id));
  });
  selectedPlanIds.value = Array.from(planIdSet);
  positionAssignForm.value.planIds = selectedPlanIds.value;
};

const submitPositionAssign = async () => {
  if (!positionAssignForm.value.stationId) {
    ElMessage.warning('请选择场站');
    return;
  }
  if (!positionAssignForm.value.positionName) {
    ElMessage.warning('请选择岗位');
    return;
  }
  if (selectedPlanIds.value.length === 0) {
    ElMessage.warning('请选择保养计划');
    return;
  }

  positionAssignSubmitting.value = true;
  try {
    await request.post('/maintenance-position-plans', {
      stationId: positionAssignForm.value.stationId,
      positionName: positionAssignForm.value.positionName,
      planIds: selectedPlanIds.value
    });
    ElMessage.success('分配成功');
    positionAssignDialogVisible.value = false;
    loadPositionPlans();
  } catch (e) {
    ElMessage.error(e.message || '分配失败');
  } finally {
    positionAssignSubmitting.value = false;
  }
};

const deletePositionPlan = async (row) => {
  try {
    await ElMessageBox.confirm('确认删除该岗位保养计划分配？', '提示', { type: 'warning' });
    await request.delete(`/maintenance-position-plans/${row.id}`);
    ElMessage.success('删除成功');
    loadPositionPlans();
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

// ========== 工作记录操作 ==========
const viewWorkRecord = (row) => {
  currentRecord.value = { ...row };
  recordDetailVisible.value = true;
};

const showVerifyDialog = (row) => {
  verifyForm.value = {
    id: row.id,
    equipmentName: row.equipmentName,
    executorName: row.executorName,
    result: 'pass',
    remark: '',
    deductionPoints: 0,
    deductionRemark: ''
  };
  verifyDialogVisible.value = true;
};

const submitVerify = async () => {
  if (!verifyForm.value.result) {
    ElMessage.warning('请选择验收结果');
    return;
  }

  verifySubmitting.value = true;
  try {
    const payload = {
      verifyResult: verifyForm.value.result,
      verifyRemark: verifyForm.value.remark
    };
    if (verifyForm.value.result === 'fail') {
      payload.deductionPoints = verifyForm.value.deductionPoints;
      payload.deductionRemark = verifyForm.value.deductionRemark;
    }
    await request.put(`/maintenance-work-records/${verifyForm.value.id}/verify`, payload);
    ElMessage.success('验收成功');
    verifyDialogVisible.value = false;
    loadWorkRecords();
  } catch (e) {
    ElMessage.error(e.message || '验收失败');
  } finally {
    verifySubmitting.value = false;
  }
};

watch(
  activeTab,
  (tab) => {
    if (tab === 'records') {
      loadWorkRecords();
      return;
    }
    if (!canManage.value) return;
    if (tab === 'plan') {
      loadPlanList();
    } else if (tab === 'position') {
      loadPositionPlans();
    }
  },
  { immediate: true }
);

// ========== 初始化 ==========
onMounted(() => {
  if (canManage.value) {
    loadStations();
  }
});
</script>

<style lang="scss" scoped>
.maintenance-task-page {
  padding: 16px;

  :deep(.tabs-hidden) {
    .el-tabs__header {
      display: none;
    }

    .el-tabs__content {
      padding: 0;
    }

    &.el-tabs--border-card {
      border: none;
      background: transparent;
      box-shadow: none;
    }

    &.el-tabs--border-card > .el-tabs__content {
      background: transparent;
    }
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h2 {
      margin: 0;
      font-size: 20px;
    }




    .header-info {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #909399;
      font-size: 14px;
    }

    .actions,
    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }

  .filter-card {
    margin-bottom: 16px;
  }

  .overdue-banner {
    margin-bottom: 16px;
  }


  .cycle-tags {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  .plan-standards {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
  }

  .text-muted {
    color: #909399;
  }

  .section-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px 16px;
  }

  .standards-container {
    .standard-item {
      margin-bottom: 12px;
    }
  }

  .cycle-schedule-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    padding: 8px 12px;
    background: #f5f7fa;
    border-radius: 4px;

    .schedule-label {
      color: #606266;
      font-size: 14px;
    }
  }
}

// 保养工作内容样式
:deep(.maintenance-work-content) {
  .cycle-cards-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .cycle-card-wrapper {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .cycle-card-date {
    align-self: flex-end;
    font-size: 14px;
    color: #606266;
  }

  .cycle-card {
    display: flex;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    transition: all 0.3s ease;
    min-height: 100px;

    &.has-tasks {
      cursor: pointer;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
      }
    }

    &.no-tasks {
      opacity: 0.65;
    }

    .card-color-bar {
      width: 8px;
      flex-shrink: 0;
    }

    .card-body {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      gap: 20px;
    }

    .card-left {
      display: flex;
      align-items: center;
      gap: 16px;
      flex: 1;
    }

    .card-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      flex-shrink: 0;
    }

    .card-info {
      .card-title {
        font-size: 18px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 4px;
      }

      .card-desc {
        font-size: 14px;
        color: #909399;
      }
    }

    .card-center {
      flex-shrink: 0;
    }

    .card-right {
      flex-shrink: 0;

      .no-task-hint {
        color: #c0c4cc;
        font-size: 14px;
      }
    }
  }

  .cycle-detail-content {
    max-height: 60vh;
    overflow-y: auto;

    .task-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #f5f7fa;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }

      .task-info {
        flex: 1;

        .task-name {
          margin-bottom: 4px;

          .equipment-code {
            font-weight: 600;
            color: #303133;
            margin-right: 8px;
          }

          .equipment-name {
            color: #606266;
          }
        }

        .task-location {
          font-size: 13px;
          color: #909399;
          margin-bottom: 2px;
        }

        .task-standards {
          font-size: 12px;
          color: #c0c4cc;
        }
      }

      .task-status {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 0 16px;
      }

      .task-action {
        flex-shrink: 0;
      }
    }
  }

  .work-task-form {
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0 16px;

      @media (max-width: 600px) {
        grid-template-columns: 1fr;
      }
    }

    .standards-table {
      margin-bottom: 16px;
    }

    .unit {
      margin-left: 8px;
      color: #909399;
    }

    .list-block {
      margin-bottom: 16px;

      .list-actions {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 8px;
      }

      .list-table-wrapper {
        overflow-x: auto;
      }

      .list-table {
        min-width: 700px;
      }
    }

    .verify-info,
    .verify-pending {
      padding: 12px;
      background: #f5f7fa;
      border-radius: 4px;
    }
  }
}

// 移动端适配
@media screen and (max-width: 768px) {
  .maintenance-task-page {
    padding: 12px;

    .page-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;

      h2 {
        font-size: 18px;
      }

      .header-info {
        flex-wrap: wrap;
      }

      .actions,
      .header-actions {
        flex-wrap: wrap;
        width: 100%;
        gap: 8px;

        .el-button {
          flex: 1;
          min-width: 80px;
        }
      }
    }

    .filter-bar {
      flex-direction: column;

      .el-select,
      .el-date-editor {
        width: 100% !important;
      }
    }

    .table-wrapper {
      padding: 12px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;

      .el-table {
        min-width: 600px;
      }
    }

    .pagination-wrapper {
      justify-content: center;
      padding: 8px 12px;
    }

    .section-grid {
      grid-template-columns: 1fr;
    }
  }
}

@media screen and (max-width: 480px) {
  .maintenance-task-page {
    padding: 8px;

    .page-header {
      h2 {
        font-size: 16px;
      }

      .actions {
        .el-button {
          font-size: 12px;
          padding: 8px 12px;
        }
      }
    }
  }
}
</style>


