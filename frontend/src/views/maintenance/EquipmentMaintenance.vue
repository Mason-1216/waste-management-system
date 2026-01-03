<template>
  <div class="equipment-maintenance-page">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- Tab 1: 设备保养工作分配 -->
      <el-tab-pane label="设备保养工作分配" name="assignment">
        <div class="page-header">
          <h2>设备保养工作分配</h2>
          <div class="actions">
            <el-button type="primary" @click="showAssignDialog">
              <el-icon><Plus /></el-icon>分配保养任务
            </el-button>
            <el-button @click="loadAssignments">刷新</el-button>
          </div>
        </div>

        <div class="filter-bar">
          <el-select v-model="assignFilters.stationId" placeholder="场站" clearable style="width: 150px;" @change="loadAssignments">
            <el-option v-for="s in stationList" :key="s.id" :label="s.stationName" :value="s.id" />
          </el-select>
          <el-select v-model="assignFilters.status" placeholder="状态" clearable style="width: 100px;" @change="loadAssignments">
            <el-option label="待执行" value="pending" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="待验收" value="pending_verify" />
            <el-option label="已验收" value="accepted" />
          </el-select>
          <el-date-picker
            v-model="assignFilters.dateRange"
            type="daterange"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px;"
            @change="loadAssignments"
          />
        </div>

        <div class="table-wrapper">
          <el-table :data="assignmentList" stripe border v-loading="assignLoading">
            <el-table-column prop="station.stationName" label="场站" width="120" />
            <el-table-column prop="equipmentCode" label="设备编号" width="120" />
            <el-table-column prop="equipmentName" label="设备名称" min-width="150" />
            <el-table-column prop="installLocation" label="安装位置" width="150" />
            <el-table-column prop="executorName" label="执行人" width="100" />
            <el-table-column prop="assignerName" label="派发人" width="100" />
            <el-table-column label="计划保养日期" width="200">
              <template #default="{ row }">
                <div>{{ row.planStartDate }} ~ {{ row.planEndDate }}</div>
                <div v-if="row.planStartTime || row.planEndTime" class="text-muted">
                  {{ row.planStartTime || '-' }} ~ {{ row.planEndTime || '-' }}
                </div>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="getAssignStatusType(row.status)" size="small">
                  {{ getAssignStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="viewAssignDetail(row)">查看</el-button>
            <el-button
              v-if="row.status !== 'completed'"
              link type="danger" size="small" @click="deleteAssignment(row)"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="assignPagination.page"
            v-model:page-size="assignPagination.pageSize"
            :total="assignPagination.total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @current-change="loadAssignments"
            @size-change="loadAssignments"
          />
        </div>
      </el-tab-pane>

      <!-- Tab 2: 设备保养计划 -->
      <el-tab-pane v-if="canManagePlans" label="保养计划" name="plan">
        <div class="page-header">
          <h2>设备保养计划</h2>
          <div class="actions">
            <el-input
              v-model="planFilters.keyword"
              placeholder="请输入关键词"
              clearable
              style="width: 200px; margin-right: 12px;"
              @clear="loadPlanList"
              @keyup.enter="loadPlanList"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" @click="showPlanDialog()">
              <el-icon><Plus /></el-icon>新增保养计划
            </el-button>
            <el-button @click="downloadPlanTemplate">
              <el-icon><Download /></el-icon>下载模板
            </el-button>
            <el-button type="success" @click="triggerPlanImport">
              <el-icon><Download /></el-icon>导入
            </el-button>
            <input
              ref="planFileInputRef"
              type="file"
              accept=".xlsx,.xls"
              style="display: none;"
              @change="handlePlanImport"
            />
            <el-button @click="loadPlanList">刷新</el-button>
          </div>
        </div>

        <div class="filter-bar">
          <el-select v-model="planFilters.stationId" placeholder="场站" clearable style="width: 150px;" @change="loadPlanList">
            <el-option v-for="s in stationList" :key="s.id" :label="s.stationName" :value="s.id" />
          </el-select>
          <el-select v-model="planFilters.cycleType" placeholder="保养周期" clearable style="width: 120px;" @change="loadPlanList">
            <el-option label="日保养" value="daily" />
            <el-option label="周保养" value="weekly" />
            <el-option label="月保养" value="monthly" />
            <el-option label="年保养" value="yearly" />
          </el-select>
        </div>

        <div class="table-wrapper" v-loading="planLoading">
          <el-table :data="planTableRows" stripe border :span-method="planSpanMethod">
            <el-table-column prop="station.stationName" label="场站" width="120" />
            <el-table-column prop="equipmentCode" label="设备编号" width="120" />
            <el-table-column prop="equipmentName" label="设备名称" min-width="150" />
            <el-table-column prop="installLocation" label="安装位置" width="150" />
            <el-table-column label="保养周期" width="100">
              <template #default="{ row }">
                {{ getCycleLabel(row.cycleType) }}
              </template>
            </el-table-column>
            <el-table-column label="保养标准" min-width="260">
  <template #default="{ row }">
    <div v-if="row.standard">
      <div>{{ row.standard.name }}</div>
      <div v-if="row.standard.specification" class="text-muted">{{ row.standard.specification }}</div>
      <div v-else class="text-muted">-</div>
    </div>
    <span v-else class="text-muted">-</span>
  </template>
</el-table-column>
            <el-table-column label="保养时间" width="130">
              <template #default="{ row }">
                {{ getMaintenanceTimeText(row) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="quickAssignFromPlan(row)">
                  分配任务
                </el-button>
                <el-button link type="warning" size="small" @click="showPlanDialog(row)">
                  编辑
                </el-button>
                <el-button link type="danger" size="small" @click="deletePlan(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="planPagination.page"
            v-model:page-size="planPagination.pageSize"
            :total="planPagination.total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @current-change="loadPlanList"
            @size-change="loadPlanList"
          />
        </div>
      </el-tab-pane>

      <!-- Tab 3: 保养计划岗位分配 -->
      <el-tab-pane v-if="canManagePlans" label="保养计划岗位分配" name="position">
        <div class="page-header">
          <h2>保养计划岗位分配</h2>
          <div class="actions">
            <el-button type="primary" @click="showPositionAssignDialog">
              <el-icon><Plus /></el-icon>分配岗位计划
            </el-button>
            <el-button @click="loadPositionPlans">刷新</el-button>
          </div>
        </div>

        <div class="filter-bar">
          <el-select v-model="positionFilters.stationId" placeholder="场站" clearable style="width: 150px;" @change="loadPositionPlans">
            <el-option v-for="s in stationList" :key="s.id" :label="s.stationName" :value="s.id" />
          </el-select>
          <el-select v-model="positionFilters.positionName" placeholder="岗位" clearable style="width: 150px;" @change="loadPositionPlans">
            <el-option v-for="p in allPositions" :key="p" :label="p" :value="p" />
          </el-select>
        </div>

        <div class="table-wrapper" v-loading="positionLoading">
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
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button link type="danger" size="small" @click="deletePositionPlan(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="positionPagination.page"
            v-model:page-size="positionPagination.pageSize"
            :total="positionPagination.total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @current-change="loadPositionPlans"
            @size-change="loadPositionPlans"
          />
        </div>
      </el-tab-pane>

      <!-- Tab 4: 保养工作记录 -->
      <el-tab-pane v-if="canManagePlans" label="保养工作记录" name="records">
        <div class="page-header">
          <h2>保养工作记录</h2>
          <div class="actions">
            <el-button @click="loadWorkRecords">刷新</el-button>
          </div>
        </div>

        <div class="filter-bar">
          <el-select v-model="recordFilters.stationId" placeholder="场站" clearable style="width: 150px;" @change="loadWorkRecords">
            <el-option v-for="s in stationList" :key="s.id" :label="s.stationName" :value="s.id" />
          </el-select>
          <el-select v-model="recordFilters.cycleType" placeholder="保养周期" clearable style="width: 120px;" @change="loadWorkRecords">
            <el-option label="日保养" value="daily" />
            <el-option label="周保养" value="weekly" />
            <el-option label="月保养" value="monthly" />
            <el-option label="年保养" value="yearly" />
          </el-select>
          <el-date-picker
            v-model="recordFilters.dateRange"
            type="daterange"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px;"
            @change="loadWorkRecords"
          />
        </div>

        <div class="table-wrapper" v-loading="recordLoading">
          <el-table :data="workRecordList" stripe border>
            <el-table-column prop="stationName" label="场站" width="100" />
            <el-table-column prop="positionName" label="岗位" width="100" />
            <el-table-column prop="equipmentCode" label="设备编号" width="110" />
            <el-table-column prop="equipmentName" label="设备名称" min-width="130" />
            <el-table-column label="保养周期" width="90">
              <template #default="{ row }">
                {{ getCycleLabel(row.cycleType) }}
              </template>
            </el-table-column>
            <el-table-column prop="workDate" label="工作日期" width="110" />
            <el-table-column prop="executorName" label="执行人" width="90" />
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 'completed' ? 'success' : 'info'" size="small">
                  {{ row.status === 'completed' ? '已完成' : '待完成' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="submitTime" label="提交时间" width="160" />
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="viewWorkRecord(row)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="recordPagination.page"
            v-model:page-size="recordPagination.pageSize"
            :total="recordPagination.total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @current-change="loadWorkRecords"
            @size-change="loadWorkRecords"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 分配保养任务对话框 -->
    <el-dialog v-model="assignDialogVisible" title="分配保养任务" width="650px" destroy-on-close>
      <el-form :model="assignForm" :rules="assignRules" ref="assignFormRef" label-width="120px">
        <el-form-item label="场站" prop="stationId">
          <el-select v-model="assignForm.stationId" placeholder="请选择场站" style="width: 100%;" @change="onAssignStationChange">
            <el-option v-for="s in formStationOptions" :key="s.id" :label="s.stationName" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="设备编号" prop="equipmentCode">
          <el-select
            v-model="assignForm.equipmentCode"
            placeholder="请选择设备编号"
            style="width: 100%;"
            filterable
            @change="onEquipmentCodeSelect"
          >
            <el-option
              v-for="item in stationEquipmentList"
              :key="item.key"
              :label="item.equipmentCode"
              :value="item.equipmentCode"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="设备名称">
          <el-select
            v-model="assignForm.equipmentName"
            placeholder="请选择设备名称"
            style="width: 100%;"
            filterable
            @change="onEquipmentNameSelect"
          >
            <el-option
              v-for="item in stationEquipmentList"
              :key="item.key"
              :label="item.equipmentName"
              :value="item.equipmentName"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="安装位置">
          <el-input v-model="assignForm.installLocation" placeholder="选择设备后自动填充" readonly />
        </el-form-item>
        <el-form-item label="保养周期" prop="cycleType">
          <el-select
            v-model="assignForm.cycleType"
            placeholder="请选择保养周期"
            style="width: 100%;"
            @change="onCycleSelect"
          >
            <el-option label="日保养" value="daily" />
            <el-option label="周保养" value="weekly" />
            <el-option label="月保养" value="monthly" />
            <el-option label="年保养" value="yearly" />
          </el-select>
        </el-form-item>
        <el-form-item label="保养标准">
          <el-table
            v-if="selectedPlanStandards.length"
            :data="selectedPlanStandards"
            border
            size="small"
            max-height="200"
            style="width: 100%;"
          >
            <el-table-column prop="name" label="项目" min-width="140" />
            <el-table-column prop="specification" label="标准" min-width="200" />
          </el-table>
          <span v-else class="plan-standards-empty">请选择保养周期后显示标准</span>
        </el-form-item>
        <el-form-item label="计划保养日期" prop="planDate">
          <el-date-picker
            v-model="assignForm.planDate"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            style="width: 100%;"
            @change="onPlanDateChange"
          />
        </el-form-item>
        <el-form-item label="计划保养时间" prop="planTimeRange">
          <el-time-picker
            v-model="assignForm.planTimeRange"
            is-range
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="HH:mm"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="执行人" prop="executorId">
          <el-select
            v-model="assignForm.executorId"
            placeholder="请选择执行人"
            style="width: 100%;"
            filterable
          >
            <el-option
              v-for="user in stationUserList"
              :key="user.id"
              :label="user.realName"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="派发人">
          <el-input v-model="assignForm.assignerName" disabled />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAssignment" :loading="assignSubmitting">确定分配</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="planDialogVisible" :title="planIsEdit ? '编辑保养计划' : '新增保养计划'" width="750px" destroy-on-close>
      <el-form :model="planForm" :rules="planRules" ref="planFormRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="场站" prop="stationId">
              <el-select v-model="planForm.stationId" placeholder="请选择场站" style="width: 100%;">
                <el-option v-for="s in formStationOptions" :key="s.id" :label="s.stationName" :value="s.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备编号" prop="equipmentCode">
              <el-input v-model="planForm.equipmentCode" placeholder="请输入设备编号" maxlength="50" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备名称" prop="equipmentName">
              <el-input v-model="planForm.equipmentName" placeholder="请输入设备名称" maxlength="100" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="安装位置" prop="installLocation">
              <el-input v-model="planForm.installLocation" placeholder="请输入安装位置" maxlength="200" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="日保养标准">
          <div class="standards-container">
            <div v-for="(std, idx) in planForm.cycleStandards.daily" :key="`daily-${idx}`" class="standard-item">
              <el-row :gutter="12" align="middle">
                <el-col :span="10">
                  <el-input v-model="std.name" placeholder="保养标准名称" />
                </el-col>
                <el-col :span="12">
                  <el-input v-model="std.specification" placeholder="保养规范" />
                </el-col>
                <el-col :span="2">
                  <el-button type="danger" :icon="Delete" circle size="small" @click="removeStandard('daily', idx)" />
                </el-col>
              </el-row>
            </div>
            <el-button type="primary" link @click="addStandard('daily')">
              <el-icon><Plus /></el-icon>添加日保养标准
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="周保养标准">
          <div class="standards-container">
            <div class="cycle-schedule-row">
              <span class="schedule-label">每周</span>
              <el-select v-model="planForm.weeklyDay" placeholder="周几" style="width: 100px;">
                <el-option label="周一" :value="1" />
                <el-option label="周二" :value="2" />
                <el-option label="周三" :value="3" />
                <el-option label="周四" :value="4" />
                <el-option label="周五" :value="5" />
                <el-option label="周六" :value="6" />
                <el-option label="周日" :value="7" />
              </el-select>
              <span class="schedule-label">完成</span>
            </div>
            <div v-for="(std, idx) in planForm.cycleStandards.weekly" :key="`weekly-${idx}`" class="standard-item">
              <el-row :gutter="12" align="middle">
                <el-col :span="10">
                  <el-input v-model="std.name" placeholder="保养标准名称" />
                </el-col>
                <el-col :span="12">
                  <el-input v-model="std.specification" placeholder="保养规范" />
                </el-col>
                <el-col :span="2">
                  <el-button type="danger" :icon="Delete" circle size="small" @click="removeStandard('weekly', idx)" />
                </el-col>
              </el-row>
            </div>
            <el-button type="primary" link @click="addStandard('weekly')">
              <el-icon><Plus /></el-icon>添加周保养标准
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="月保养标准">
          <div class="standards-container">
            <div class="cycle-schedule-row">
              <span class="schedule-label">每月</span>
              <el-input-number v-model="planForm.monthlyDay" :min="1" :max="31" placeholder="几号" style="width: 100px;" />
              <span class="schedule-label">号完成</span>
            </div>
            <div v-for="(std, idx) in planForm.cycleStandards.monthly" :key="`monthly-${idx}`" class="standard-item">
              <el-row :gutter="12" align="middle">
                <el-col :span="10">
                  <el-input v-model="std.name" placeholder="保养标准名称" />
                </el-col>
                <el-col :span="12">
                  <el-input v-model="std.specification" placeholder="保养规范" />
                </el-col>
                <el-col :span="2">
                  <el-button type="danger" :icon="Delete" circle size="small" @click="removeStandard('monthly', idx)" />
                </el-col>
              </el-row>
            </div>
            <el-button type="primary" link @click="addStandard('monthly')">
              <el-icon><Plus /></el-icon>添加月保养标准
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="年保养标准">
          <div class="standards-container">
            <div class="cycle-schedule-row">
              <span class="schedule-label">每年</span>
              <el-input-number v-model="planForm.yearlyMonth" :min="1" :max="12" placeholder="月" style="width: 90px;" controls-position="right" />
              <span class="schedule-label">月</span>
              <el-input-number v-model="planForm.yearlyDay" :min="1" :max="31" placeholder="日" style="width: 90px;" controls-position="right" />
              <span class="schedule-label">日完成</span>
            </div>
            <div v-for="(std, idx) in planForm.cycleStandards.yearly" :key="`yearly-${idx}`" class="standard-item">
              <el-row :gutter="12" align="middle">
                <el-col :span="10">
                  <el-input v-model="std.name" placeholder="保养标准名称" />
                </el-col>
                <el-col :span="12">
                  <el-input v-model="std.specification" placeholder="保养规范" />
                </el-col>
                <el-col :span="2">
                  <el-button type="danger" :icon="Delete" circle size="small" @click="removeStandard('yearly', idx)" />
                </el-col>
              </el-row>
            </div>
            <el-button type="primary" link @click="addStandard('yearly')">
              <el-icon><Plus /></el-icon>添加年保养标准
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="planDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePlan" :loading="planSaving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 任务详情对话框 -->
    <el-dialog v-model="assignDetailVisible" title="设备保养任务详情" width="820px" destroy-on-close>
      <div v-if="currentAssignment" class="status-steps">
        <el-steps :active="getMaintainFlowActive(currentAssignment)" finish-status="success" align-center>
          <el-step v-for="step in getMaintainFlowSteps(currentAssignment)" :key="step" :title="step" />
        </el-steps>
      </div>
      <el-form v-if="currentAssignment" :model="currentAssignment" label-width="120px">
        <el-divider content-position="left">任务信息</el-divider>
        <div class="section-grid">
          <el-form-item label="场站">
            <el-input v-model="currentAssignment.stationName" disabled />
          </el-form-item>
          <el-form-item label="设备编号">
            <el-input v-model="currentAssignment.equipmentCode" disabled />
          </el-form-item>
          <el-form-item label="设备名称">
            <el-input v-model="currentAssignment.equipmentName" disabled />
          </el-form-item>
          <el-form-item label="安装位置">
            <el-input v-model="currentAssignment.installLocation" disabled />
          </el-form-item>
          <el-form-item label="保养周期">
            <el-input :model-value="getCycleLabel(currentAssignment.cycleType || '')" disabled />
          </el-form-item>
          <el-form-item label="执行人">
            <el-input v-model="currentAssignment.executorName" disabled />
          </el-form-item>
          <el-form-item label="计划日期">
            <el-input
              :model-value="`${currentAssignment.planStartDate || '-'} ${currentAssignment.planStartTime || ''} ~ ${currentAssignment.planEndDate || '-'} ${currentAssignment.planEndTime || ''}`"
              disabled
            />
          </el-form-item>
          <el-form-item label="状态">
            <el-tag :type="getAssignStatusType(currentAssignment.status)">
              {{ getAssignStatusLabel(currentAssignment.status) }}
            </el-tag>
          </el-form-item>
        </div>

        <el-divider content-position="left">保养标准确认</el-divider>
        <el-table :data="currentAssignment.maintenanceItems || []" border size="small">
          <el-table-column prop="name" label="项目" min-width="180" />
          <el-table-column prop="specification" label="标准" min-width="220" />
          <el-table-column label="确认" width="140" align="center">
            <template #default="{ row: item }">
              <el-radio-group v-model="item.result" :disabled="!canEditAssignment(currentAssignment)">
                <el-radio label="yes">是</el-radio>
                <el-radio label="no">否</el-radio>
              </el-radio-group>
            </template>
          </el-table-column>
          <el-table-column label="备注" min-width="180">
            <template #default="{ row: item }">
              <el-input v-model="item.remark" :disabled="!canEditAssignment(currentAssignment)" />
            </template>
          </el-table-column>
        </el-table>

        <el-divider content-position="left">设备保养信息</el-divider>
        <div class="section-grid">
          <el-form-item label="开始日期">
            <el-date-picker
              v-model="currentAssignment.actualStartDate"
              type="date"
              value-format="YYYY-MM-DD"
              :disabled="!canEditAssignment(currentAssignment)"
            />
          </el-form-item>
          <el-form-item label="开始时间">
            <el-time-picker
              v-model="currentAssignment.actualStartTime"
              value-format="HH:mm"
              format="HH:mm"
              :disabled="!canEditAssignment(currentAssignment)"
            />
          </el-form-item>
          <el-form-item label="结束日期">
            <el-date-picker
              v-model="currentAssignment.actualEndDate"
              type="date"
              value-format="YYYY-MM-DD"
              :disabled="!canEditAssignment(currentAssignment)"
            />
          </el-form-item>
          <el-form-item label="结束时间">
            <el-time-picker
              v-model="currentAssignment.actualEndTime"
              value-format="HH:mm"
              format="HH:mm"
              :disabled="!canEditAssignment(currentAssignment)"
            />
          </el-form-item>
          <el-form-item label="保养工具">
            <el-input v-model="currentAssignment.maintenanceTools" :disabled="!canEditAssignment(currentAssignment)" />
          </el-form-item>
          <el-form-item label="保养时长">
            <el-input-number v-model="currentAssignment.workHours" :min="0" :disabled="!canEditAssignment(currentAssignment)" />
          </el-form-item>
          <el-form-item label="耗材" class="full-row">
            <div class="list-block">
              <div class="list-actions">
                <el-button
                  size="small"
                  type="primary"
                  :disabled="!canEditAssignment(currentAssignment)"
                  @click="addConsumable(currentAssignment)"
                >
                  新增
                </el-button>
              </div>
              <div class="table-scroll">
                <el-table
                  :data="currentAssignment.consumablesList || []"
                  border
                  size="small"
                  class="inner-table"
                  :row-class-name="consumableRowClass"
                >
                  <el-table-column label="名称">
                    <template #default="{ row: item }">
                      <el-input v-model="item.name" :disabled="!canEditAssignment(currentAssignment) || item._locked" />
                    </template>
                  </el-table-column>
                  <el-table-column label="型号">
                    <template #default="{ row: item }">
                      <el-input v-model="item.model" :disabled="!canEditAssignment(currentAssignment) || item._locked" />
                    </template>
                  </el-table-column>
                  <el-table-column label="规格">
                    <template #default="{ row: item }">
                      <el-input v-model="item.spec" :disabled="!canEditAssignment(currentAssignment) || item._locked" />
                    </template>
                  </el-table-column>
                  <el-table-column label="数量">
                    <template #default="{ row: item }">
                      <el-input-number v-model="item.quantity" :disabled="!canEditAssignment(currentAssignment) || item._locked" :min="0" />
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="140">
                    <template #default="{ $index }">
                      <el-button
                        v-if="!currentAssignment.consumablesList[$index]?._locked"
                        link
                        type="primary"
                        :disabled="!canEditAssignment(currentAssignment)"
                        @click="lockConsumable(currentAssignment, $index)"
                      >
                        保存
                      </el-button>
                      <el-button
                        v-else
                        link
                        type="warning"
                        :disabled="!canEditAssignment(currentAssignment)"
                        @click="unlockConsumable(currentAssignment, $index)"
                      >
                        编辑
                      </el-button>
                      <el-button
                        link
                        type="danger"
                        :disabled="!canEditAssignment(currentAssignment) || currentAssignment.consumablesList[$index]?._locked"
                        @click="removeConsumable(currentAssignment, $index)"
                      >
                        删除
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </el-form-item>

          <el-form-item label="配件" class="full-row">
            <div class="list-block">
              <div class="list-actions">
                <el-button
                  size="small"
                  type="primary"
                  :disabled="!canEditAssignment(currentAssignment)"
                  @click="addPart(currentAssignment)"
                >
                  新增
                </el-button>
              </div>
              <div class="table-scroll">
                <el-table
                  :data="currentAssignment.partsList || []"
                  border
                  size="small"
                  class="inner-table"
                  :row-class-name="partRowClass"
                >
                  <el-table-column label="名称">
                    <template #default="{ row: item }">
                      <el-input v-model="item.name" :disabled="!canEditAssignment(currentAssignment) || item._locked" />
                    </template>
                  </el-table-column>
                  <el-table-column label="型号">
                    <template #default="{ row: item }">
                      <el-input v-model="item.model" :disabled="!canEditAssignment(currentAssignment) || item._locked" />
                    </template>
                  </el-table-column>
                  <el-table-column label="规格">
                    <template #default="{ row: item }">
                      <el-input v-model="item.spec" :disabled="!canEditAssignment(currentAssignment) || item._locked" />
                    </template>
                  </el-table-column>
                  <el-table-column label="数量">
                    <template #default="{ row: item }">
                      <el-input-number v-model="item.quantity" :disabled="!canEditAssignment(currentAssignment) || item._locked" :min="0" />
                    </template>
                  </el-table-column>
                  <el-table-column label="更换原因">
                    <template #default="{ row: item }">
                      <el-input v-model="item.reason" :disabled="!canEditAssignment(currentAssignment) || item._locked" />
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="140">
                    <template #default="{ $index }">
                      <el-button
                        v-if="!currentAssignment.partsList[$index]?._locked"
                        link
                        type="primary"
                        :disabled="!canEditAssignment(currentAssignment)"
                        @click="lockPart(currentAssignment, $index)"
                      >
                        保存
                      </el-button>
                      <el-button
                        v-else
                        link
                        type="warning"
                        :disabled="!canEditAssignment(currentAssignment)"
                        @click="unlockPart(currentAssignment, $index)"
                      >
                        编辑
                      </el-button>
                      <el-button
                        link
                        type="danger"
                        :disabled="!canEditAssignment(currentAssignment) || currentAssignment.partsList[$index]?._locked"
                        @click="removePart(currentAssignment, $index)"
                      >
                        删除
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </el-form-item>
          <el-form-item label="保养备注">
            <el-input v-model="currentAssignment.completionNote" :disabled="!canEditAssignment(currentAssignment)" />
          </el-form-item>
        </div>

        <el-divider content-position="left">验收信息</el-divider>
        <div class="section-grid">
          <el-form-item label="验收人">
            <el-input v-model="currentAssignment.verifyByName" disabled />
          </el-form-item>
          <el-form-item label="验收时间">
            <el-input
              :model-value="`${currentAssignment.verifyDate || '-'} ${currentAssignment.verifyTime || ''}`"
              disabled
            />
          </el-form-item>
          <el-form-item label="安全评分">
            <el-rate v-model="currentAssignment.verifySafety" :disabled="!canVerifyAssignment(currentAssignment)" />
          </el-form-item>
          <el-form-item label="质量评分">
            <el-rate v-model="currentAssignment.verifyQuality" :disabled="!canVerifyAssignment(currentAssignment)" />
          </el-form-item>
          <el-form-item label="进度评分">
            <el-rate v-model="currentAssignment.verifyProgress" :disabled="!canVerifyAssignment(currentAssignment)" />
          </el-form-item>
          <el-form-item label="卫生评分">
            <el-rate v-model="currentAssignment.verifyHygiene" :disabled="!canVerifyAssignment(currentAssignment)" />
          </el-form-item>
          <el-form-item label="验收意见" class="full-row">
            <el-input
              v-model="currentAssignment.verifyComment"
              type="textarea"
              :rows="2"
              :disabled="!canVerifyAssignment(currentAssignment)"
            />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="assignDetailVisible = false">关闭</el-button>
        <el-button
          v-if="currentAssignment && currentAssignment.status === 'pending' && canStartAssignment(currentAssignment)"
          type="primary"
          @click="startAssignment(currentAssignment)"
          :loading="assignmentSaving"
        >
          开始保养
        </el-button>
        <el-button
          v-if="currentAssignment && ['pending', 'in_progress'].includes(currentAssignment.status) && canEditAssignment(currentAssignment)"
          @click="saveAssignment(currentAssignment)"
          :loading="assignmentSaving"
        >
          保存
        </el-button>
        <el-button
          v-if="currentAssignment && currentAssignment.status === 'in_progress' && canEditAssignment(currentAssignment)"
          type="success"
          @click="completeAssignment(currentAssignment)"
          :loading="assignmentSaving"
        >
          提交保养
        </el-button>
        <el-button
          v-if="currentAssignment && canVerifyAssignment(currentAssignment)"
          type="warning"
          @click="verifyAssignment(currentAssignment, 'reject')"
          :loading="assignmentSaving"
        >
          退回重做
        </el-button>
        <el-button
          v-if="currentAssignment && canVerifyAssignment(currentAssignment)"
          type="success"
          @click="verifyAssignment(currentAssignment, 'pass')"
          :loading="assignmentSaving"
        >
          验收通过
        </el-button>
      </template>
    </el-dialog>

    <!-- 岗位计划分配对话框 -->
    <el-dialog v-model="positionAssignDialogVisible" title="分配岗位保养计划" width="700px" destroy-on-close>
      <el-form :model="positionAssignForm" ref="positionAssignFormRef" label-width="100px">
        <el-form-item label="场站" prop="stationId" :rules="[{ required: true, message: '请选择场站', trigger: 'change' }]">
          <el-select v-model="positionAssignForm.stationId" placeholder="请选择场站" style="width: 100%;" @change="onPositionStationChange">
            <el-option v-for="s in formStationOptions" :key="s.id" :label="s.stationName" :value="s.id" />
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
    </el-dialog>

    <!-- 保养工作记录详情对话框 -->
    <el-dialog v-model="recordDetailVisible" title="保养工作记录详情" width="800px" destroy-on-close>
      <el-form v-if="currentRecord" :model="currentRecord" label-width="120px">
        <el-divider content-position="left">基本信息</el-divider>
        <div class="section-grid">
          <el-form-item label="记录编号">
            <el-input v-model="currentRecord.recordCode" disabled />
          </el-form-item>
          <el-form-item label="场站">
            <el-input v-model="currentRecord.stationName" disabled />
          </el-form-item>
          <el-form-item label="岗位">
            <el-input v-model="currentRecord.positionName" disabled />
          </el-form-item>
          <el-form-item label="设备编号">
            <el-input v-model="currentRecord.equipmentCode" disabled />
          </el-form-item>
          <el-form-item label="设备名称">
            <el-input v-model="currentRecord.equipmentName" disabled />
          </el-form-item>
          <el-form-item label="安装位置">
            <el-input v-model="currentRecord.installLocation" disabled />
          </el-form-item>
          <el-form-item label="保养周期">
            <el-input :model-value="getCycleLabel(currentRecord.cycleType)" disabled />
          </el-form-item>
          <el-form-item label="工作日期">
            <el-input v-model="currentRecord.workDate" disabled />
          </el-form-item>
          <el-form-item label="执行人">
            <el-input v-model="currentRecord.executorName" disabled />
          </el-form-item>
          <el-form-item label="提交时间">
            <el-input v-model="currentRecord.submitTime" disabled />
          </el-form-item>
        </div>

        <el-divider content-position="left">保养标准确认</el-divider>
        <el-table :data="currentRecord.maintenanceItems || []" border size="small">
          <el-table-column prop="name" label="项目" min-width="150" />
          <el-table-column prop="specification" label="标准" min-width="200" />
          <el-table-column label="确认" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.confirmed ? 'success' : 'info'" size="small">
                {{ row.confirmed ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>

        <el-divider content-position="left">保养信息</el-divider>
        <div class="section-grid">
          <el-form-item label="保养工具">
            <el-input v-model="currentRecord.maintenanceTools" disabled />
          </el-form-item>
          <el-form-item label="保养时长">
            <el-input :model-value="currentRecord.workHours ? `${currentRecord.workHours} 小时` : '-'" disabled />
          </el-form-item>
        </div>

        <el-form-item label="耗材清单" v-if="currentRecord.consumablesList?.length">
          <el-table :data="currentRecord.consumablesList" border size="small">
            <el-table-column prop="name" label="名称" />
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column prop="unit" label="单位" width="80" />
          </el-table>
        </el-form-item>

        <el-form-item label="配件清单" v-if="currentRecord.partsList?.length">
          <el-table :data="currentRecord.partsList" border size="small">
            <el-table-column prop="name" label="名称" />
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column prop="unit" label="单位" width="80" />
          </el-table>
        </el-form-item>

        <el-form-item label="保养备注">
          <el-input v-model="currentRecord.remark" type="textarea" :rows="2" disabled />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="recordDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useUserStore } from '@/store/user';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Delete, Plus, Download, Search } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import request from '@/api/request';

const userStore = useUserStore();

// Tab 
const activeTab = ref('assignment');
const canManagePlans = computed(() => userStore.hasRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']));

// 监听标签页切换
watch(activeTab, (tab) => {
  if (tab === 'assignment') {
    loadAssignments();
  } else if (tab === 'plan') {
    if (!canManagePlans.value) {
      activeTab.value = 'assignment';
      return;
    }
    loadPlanList();
  } else if (tab === 'position') {
    if (!canManagePlans.value) {
      activeTab.value = 'assignment';
      return;
    }
    loadPositionPlans();
  } else if (tab === 'records') {
    if (!canManagePlans.value) {
      activeTab.value = 'assignment';
      return;
    }
    loadWorkRecords();
  }
});

const assignForm = ref({
  stationId: null,
  planId: null,
  equipmentCode: '',
  equipmentName: '',
  installLocation: '',
  cycleType: '',
  executorId: null,
  assignerName: '',
  planDate: '',
  planTimeRange: []
});

const planForm = ref({
  stationId: null,
  equipmentCode: '',
  equipmentName: '',
  installLocation: '',
  weeklyDay: null,
  monthlyDay: null,
  yearlyMonth: null,
  yearlyDay: null,
  cycleStandards: {
    daily: [],
    weekly: [],
    monthly: [],
    yearly: []
  },
  cyclePlanIds: {
    daily: [],
    weekly: [],
    monthly: [],
    yearly: []
  }
});

// ========== 公共 ==========
const stationList = ref([]);
const stationUserList = ref([]);
const stationPlanGroups = ref([]);
const selectedPlanStandards = ref([]);
const isActiveStatus = (status) => status === undefined || status === null || status === '' || status === 'active' || status === 1 || status === '1' || status === true;
const activeStationList = computed(() => stationList.value.filter(station => isActiveStatus(station.status)));
const formStationOptions = computed(() => {
  const selectedIds = new Set([
    assignForm.value.stationId,
    planForm.value.stationId
  ].filter(Boolean));
  if (selectedIds.size === 0) return activeStationList.value;
  const inactiveSelected = stationList.value.filter(
    station => selectedIds.has(station.id) && !isActiveStatus(station.status)
  );
  const active = activeStationList.value.filter(station => !selectedIds.has(station.id));
  return [...inactiveSelected, ...active];
});
const stationEquipmentList = computed(() => {
  return stationPlanGroups.value.map(group => ({
    key: group.groupKey,
    equipmentCode: group.equipmentCode,
    equipmentName: group.equipmentName,
    installLocation: group.installLocation,
    cycles: group.cycles
  }));
});

// ========== 保养工作分配相关 ==========
const assignmentList = ref([]);
const assignLoading = ref(false);
const assignDialogVisible = ref(false);
const assignSubmitting = ref(false);
const assignFormRef = ref(null);
const assignDetailVisible = ref(false);
const currentAssignment = ref(null);
const assignmentSaving = ref(false);

const assignFilters = ref({
  stationId: null,
  status: '',
  dateRange: []
});

const assignPagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
});

watch(
  () => [assignDialogVisible.value, assignForm.value.stationId, assignForm.value.planDate],
  ([visible, stationId, planDate]) => {
    if (!visible) return;
    loadStationUsers(stationId, planDate);
  }
);

const assignRules = {
  stationId: [{ required: true, message: '请选择场站', trigger: 'change' }],
  equipmentCode: [{ required: true, message: '请选择设备编号', trigger: 'change' }],
  cycleType: [{ required: true, message: '请选择保养周期', trigger: 'change' }],
  executorId: [{ required: true, message: '请选择执行人', trigger: 'change' }],
  planDate: [{ required: true, message: '请选择日期', trigger: 'change' }],
  planTimeRange: [{ required: true, message: '请选择时间段', trigger: 'change' }]
};

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
    // 更新调度字段
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

  groups.forEach((group) => {
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

const planSpanMethod = ({ row, columnIndex }) => {
  const groupColumns = [0, 1, 2, 3];
  if (groupColumns.includes(columnIndex)) {
    if (row._groupRowspan > 0) {
      return { rowspan: row._groupRowspan, colspan: 1 };
    }
    return { rowspan: 0, colspan: 0 };
  }
  const cycleColumns = [4, 6];
  if (cycleColumns.includes(columnIndex)) {
    if (row._cycleRowspan > 0) {
      return { rowspan: row._cycleRowspan, colspan: 1 };
    }
    return { rowspan: 0, colspan: 0 };
  }
};
const planLoading = ref(false);
const planDialogVisible = ref(false);
const planIsEdit = ref(false);
const planSaving = ref(false);
const planFormRef = ref(null);
const planFileInputRef = ref(null);

const planFilters = ref({
  stationId: null,
  cycleType: '',
  keyword: ''
});

const planPagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
});

const planRules = {
  stationId: [{ required: true, message: '请选择场站', trigger: 'change' }],
  equipmentCode: [{ required: true, message: '请输入设备编号', trigger: 'blur' }],
  equipmentName: [{ required: true, message: '请输入设备名称', trigger: 'blur' }]
};

// ========== 保养计划岗位分配相关 ==========
const positionPlanList = ref([]);
const positionLoading = ref(false);
const positionFilters = ref({
  stationId: null,
  positionName: ''
});
const positionPagination = ref({
  page: 1,
  pageSize: 10,
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

// 所有岗位列表
const allPositions = computed(() => {
  const positions = new Set();
  positionPlanList.value.forEach(item => {
    if (item.positionName) positions.add(item.positionName);
  });
  // 添加常用岗位
  ['操作1', '操作2', '操作3', '控制室', '机修'].forEach(p => positions.add(p));
  return Array.from(positions);
});

// ========== 保养工作记录相关 ==========
const workRecordList = ref([]);
const recordLoading = ref(false);
const recordFilters = ref({
  stationId: null,
  cycleType: '',
  dateRange: []
});
const recordPagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
});
const recordDetailVisible = ref(false);
const currentRecord = ref(null);

// ========== 辅助函数 ==========
const getAssignStatusType = (status) => {
  const types = {
    pending: 'info',
    in_progress: 'warning',
    pending_verify: 'warning',
    completed: 'warning',
    accepted: 'success'
  };
  return types[status] || 'info';
};

const getAssignStatusLabel = (status) => {
  const labels = {
    pending: '待执行',
    in_progress: '进行中',
    pending_verify: '待验收',
    completed: '待验收',
    accepted: '已验收'
  };
  return labels[status] || status;
};

const getMaintainFlowSteps = () => ['待执行', '进行中', '待验收', '已验收'];

const getMaintainFlowActive = (row) => {
  const status = row?.status;
  if (status === 'pending') return 0;
  if (status === 'in_progress') return 1;
  if (status === 'pending_verify' || status === 'completed') return 2;
  if (status === 'accepted') return getMaintainFlowSteps(row).length;
  return 0;
};

const getCycleLabel = (cycle) => {
  const labels = { daily: '日保养', weekly: '周保养', monthly: '月保养', yearly: '年保养' };
  return labels[cycle] || cycle;
};

const getMaintenanceTimeText = (row) => {
  const cycleType = row.cycleType;
  // 从 planGroupMap 中获取完整的周期时间信息
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

const normalizeStandards = (standards) => {
  if (!Array.isArray(standards)) return [];
  return standards
    .map((std) => {
      if (typeof std === 'string') {
        return { name: std, specification: '' };
      }
      return {
        name: std?.name || '',
        specification: std?.specification || ''
      };
    })
    .filter((std) => std.name || std.specification);
};

const normalizeAssignmentItems = (items) => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (typeof item === 'string') {
        return { name: item, specification: '', result: null, remark: '' };
      }
      const result = item?.result || (item?.checked === true ? 'yes' : null);
      return {
        name: item?.name || '',
        specification: item?.specification || '',
        remark: item?.remark || '',
        result
      };
    })
    .filter((item) => item.name || item.specification);
};

const mergeAssignmentStandards = (assignmentStandards, planStandards) => {
  if (planStandards.length === 0) return assignmentStandards;
  if (assignmentStandards.length === 0) return planStandards;
  const buildKey = (item) => `${item.name}||${item.specification}`;
  const existingKeys = new Set(assignmentStandards.map(buildKey));
  const merged = [...assignmentStandards];
  planStandards.forEach((std) => {
    if (!existingKeys.has(buildKey(std))) {
      merged.push({ ...std, result: null, remark: '' });
    }
  });
  return merged;
};

// ========== ???? ==========
const loadStations = async () => {
  try {
    const res = await request.get('/stations');
    stationList.value = (res.list || res || []).map(s => ({
      id: s.id,
      stationName: s.station_name || s.stationName,
      status: s.status
    }));
  } catch (e) {
    console.error('加载场站失败', e);
  }
};

const loadAssignments = async () => {
  assignLoading.value = true;
  try {
    const params = {
      page: assignPagination.value.page,
      pageSize: assignPagination.value.pageSize,
      stationId: assignFilters.value.stationId || undefined,
      status: assignFilters.value.status || undefined,
      startDate: assignFilters.value.dateRange?.[0],
      endDate: assignFilters.value.dateRange?.[1]
    };
    const res = await request.get('/maintenance-assignments', { params });
    assignmentList.value = (res.list || []).map((item) => {
      const planStandards = normalizeStandards(item.plan?.maintenance_standards || []).map(std => ({
        ...std,
        result: null,
        remark: ''
      }));
      const assignmentStandards = normalizeAssignmentItems(item.maintenance_items || []);
      return {
        id: item.id,
        planId: item.plan_id,
        executorId: item.executor_id,
        station: { stationName: item.station?.station_name || '-' },
        equipmentCode: item.equipment_code,
        equipmentName: item.equipment_name,
        installLocation: item.install_location,
        cycleType: item.cycle_type || item.plan?.cycle_type || '',
        executorName: item.executor_name,
        assignerName: item.assigner_name,
        planStartDate: item.plan_start_date,
        planEndDate: item.plan_end_date,
        planStartTime: item.plan_start_time,
        planEndTime: item.plan_end_time,
        actualStartDate: item.actual_start_date,
        actualStartTime: item.actual_start_time,
        actualEndDate: item.actual_end_date,
        actualEndTime: item.actual_end_time,
        maintenanceItems: mergeAssignmentStandards(assignmentStandards, planStandards),
        maintenanceTools: item.maintenance_tools || '',
        consumablesList: Array.isArray(item.consumables_list) ? item.consumables_list : [],
        partsList: Array.isArray(item.parts_list) ? item.parts_list : [],
        verifyByName: item.verify_by_name || '',
        verifyDate: item.verify_date || '',
        verifyTime: item.verify_time || '',
        verifyComment: item.verify_comment || '',
        verifySafety: item.verify_safety ?? 0,
        verifyQuality: item.verify_quality ?? 0,
        verifyProgress: item.verify_progress ?? 0,
        verifyHygiene: item.verify_hygiene ?? 0,
        completionNote: item.completion_note || '',
        workHours: item.work_hours ?? 0,
        status: item.status
      };
    });
    assignPagination.value.total = res.total || 0;
  } catch (e) {
    console.error('保养分配列表失败', e);
  } finally {
    assignLoading.value = false;
  }
};

const loadPlanList = async () => {
  planLoading.value = true;
  try {
    const params = {
      page: planPagination.value.page,
      pageSize: planPagination.value.pageSize,
      stationId: planFilters.value.stationId || undefined,
      cycleType: planFilters.value.cycleType || undefined,
      keyword: planFilters.value.keyword || undefined
    };
    const res = await request.get('/maintenance-plan-library', { params });
    planList.value = (res.list || []).map(item => ({
      id: item.id,
      station: { stationName: item.station?.station_name || '-' },
      stationId: item.station_id,
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
    planPagination.value.total = res.total || 0;
  } catch (e) {
    console.error('保养计划列表失败', e);
  } finally {
    planLoading.value = false;
  }
};

const loadStationUsers = async (stationId, planDate) => {
  if (!stationId || !planDate) {
    stationUserList.value = [];
    return;
  }
  try {
    const targetDate = dayjs(planDate);
    const res = await request.get('/schedules', {
      params: {
        stationId,
        year: targetDate.year(),
        month: targetDate.month() + 1
      }
    });
    const dateKey = targetDate.format('YYYY-MM-DD');
    const scheduledUsers = (res.schedules || [])
      .filter(item => item.schedules?.[dateKey] && item.schedules?.[dateKey] !== '休')
      .map(item => ({
        id: item.user?.id || item.user_id,
        realName: item.user?.real_name || item.user_name || item.user?.username || ''
      }))
      .filter(user => user.id);
    const uniqueMap = new Map();
    scheduledUsers.forEach(user => {
      if (!uniqueMap.has(user.id)) {
        uniqueMap.set(user.id, user);
      }
    });
    stationUserList.value = Array.from(uniqueMap.values());
  } catch (e) {
    console.error('加载当日排班人员失败', e);
  }
};

const loadStationPlans = async (stationId) => {
  if (!stationId) {
    stationPlanGroups.value = [];
    return;
  }
  try {
    const res = await request.get('/maintenance-plan-library', { params: { stationId, pageSize: 200 } });
    const rawPlans = (res.list || []).map(p => ({
      id: p.id,
      stationId: p.station_id,
      equipmentCode: p.equipment_code,
      equipmentName: p.equipment_name,
      installLocation: p.install_location,
      cycleType: p.cycle_type,
      maintenanceStandards: normalizeStandards(p.maintenance_standards || [])
    }));
    const grouped = new Map();
    rawPlans.forEach((plan) => {
      const key = [
        plan.stationId || '',
        plan.equipmentCode || '',
        plan.equipmentName || '',
        plan.installLocation || ''
      ].join('||');
      if (!grouped.has(key)) {
        grouped.set(key, {
          groupKey: key,
          stationId: plan.stationId,
          equipmentCode: plan.equipmentCode,
          equipmentName: plan.equipmentName,
          installLocation: plan.installLocation,
          cycles: {}
        });
      }
      const group = grouped.get(key);
      const cycleKey = plan.cycleType || 'monthly';
      if (!group.cycles[cycleKey]) {
        group.cycles[cycleKey] = { cycleType: cycleKey, planIds: [], standards: [] };
      }
      group.cycles[cycleKey].planIds.push(plan.id);
      group.cycles[cycleKey].standards.push(...plan.maintenanceStandards);
    });
    stationPlanGroups.value = Array.from(grouped.values());
  } catch (e) {
    console.error('加载保养计划失败', e);
  }
};

// ========== ?????? ==========
const showAssignDialog = () => {
  assignForm.value = {
    stationId: null,
    planId: null,
    equipmentCode: '',
    equipmentName: '',
    installLocation: '',
    cycleType: '',
    executorId: null,
    assignerName: userStore.realName || userStore.username,
    planDate: dayjs().format('YYYY-MM-DD'),
    planTimeRange: []
  };
  stationUserList.value = [];
  stationPlanGroups.value = [];
  selectedPlanStandards.value = [];
  assignDialogVisible.value = true;
};

const onAssignStationChange = (stationId) => {
  assignForm.value.planId = null;
  assignForm.value.equipmentCode = '';
  assignForm.value.equipmentName = '';
  assignForm.value.installLocation = '';
  assignForm.value.cycleType = '';
  assignForm.value.planId = null;
  assignForm.value.executorId = null;
  selectedPlanStandards.value = [];
  loadStationUsers(stationId, assignForm.value.planDate);
  loadStationPlans(stationId);
};

const onEquipmentCodeSelect = (equipmentCode) => {
  const group = stationEquipmentList.value.find(item => item.equipmentCode === equipmentCode);
  if (!group) return;
  assignForm.value.equipmentName = group.equipmentName;
  assignForm.value.installLocation = group.installLocation;
  assignForm.value.cycleType = '';
  assignForm.value.planId = null;
  selectedPlanStandards.value = [];
};

const onEquipmentNameSelect = (equipmentName) => {
  const group = stationEquipmentList.value.find(item => item.equipmentName === equipmentName);
  if (!group) return;
  assignForm.value.equipmentCode = group.equipmentCode;
  assignForm.value.installLocation = group.installLocation;
  assignForm.value.cycleType = '';
  assignForm.value.planId = null;
  selectedPlanStandards.value = [];
};

const onPlanDateChange = () => {
  assignForm.value.executorId = null;
  loadStationUsers(assignForm.value.stationId, assignForm.value.planDate);
};

const onCycleSelect = async (cycleType) => {
  const group = stationEquipmentList.value.find(item => item.equipmentCode === assignForm.value.equipmentCode);
  if (!group) return;
  const cycle = group.cycles?.[cycleType];
  if (!cycle) {
    assignForm.value.cycleType = '';
    assignForm.value.planId = null;
    selectedPlanStandards.value = [];
    await ElMessageBox.alert('请管理员配置周期计划后再行分配', '提示', { type: 'warning' });
    return;
  }
  assignForm.value.planId = cycle.planIds?.[0] || null;
  selectedPlanStandards.value = cycle.standards || [];
};
const submitAssignment = async () => {
  try {
    await assignFormRef.value.validate();
  } catch {
    return;
  }

  assignSubmitting.value = true;
  try {
    const executor = stationUserList.value.find(u => u.id === assignForm.value.executorId);
    const planTimeRange = Array.isArray(assignForm.value.planTimeRange) ? assignForm.value.planTimeRange : [];
    await request.post('/maintenance-assignments', {
      stationId: assignForm.value.stationId,
      planId: assignForm.value.planId,
      cycleType: assignForm.value.cycleType,
      equipmentCode: assignForm.value.equipmentCode,
      equipmentName: assignForm.value.equipmentName,
      installLocation: assignForm.value.installLocation,
      executorId: assignForm.value.executorId,
      executorName: executor?.realName || '',
      assignerName: assignForm.value.assignerName,
      planStartDate: assignForm.value.planDate || null,
      planEndDate: assignForm.value.planDate || null,
      planStartTime: planTimeRange[0] || null,
      planEndTime: planTimeRange[1] || null
    });
    ElMessage.success('保养任务分配成功');
    assignDialogVisible.value = false;
    loadAssignments();
  } catch (e) {
    ElMessage.error(e.message || '分配失败');
  } finally {
    assignSubmitting.value = false;
  }
};

const viewAssignDetail = (row) => {
  currentAssignment.value = JSON.parse(JSON.stringify({
    ...row,
    stationName: row.station?.stationName || row.stationName || '-',
    cycleType: row.cycleType || ''
  }));
  assignDetailVisible.value = true;
};

const deleteAssignment = async (row) => {
  await ElMessageBox.confirm('确认删除该任务？', '提示', { type: 'warning' });
  try {
    await request.delete(`/maintenance-assignments/${row.id}`);
    ElMessage.success('删除成功');
    loadAssignments();
  } catch (e) {
    ElMessage.error('删除失败');
  }
};

const canEditAssignment = (row) => {
  return row && row.executorId === userStore.userId && ['pending', 'in_progress'].includes(row.status);
};

const canStartAssignment = (row) => {
  return row && row.executorId === userStore.userId && row.status === 'pending';
};

const canVerifyAssignment = (row) => {
  if (!row) return false;
  if (!['pending_verify', 'completed'].includes(row.status)) return false;
  return userStore.hasRole(['station_manager', 'deputy_manager', 'department_manager']);
};

const ensureConsumablesList = (row) => {
  if (!Array.isArray(row.consumablesList)) {
    row.consumablesList = [];
  }
};

const ensurePartsList = (row) => {
  if (!Array.isArray(row.partsList)) {
    row.partsList = [];
  }
};

const addConsumable = (row) => {
  ensureConsumablesList(row);
  row.consumablesList.push({ name: '', model: '', spec: '', quantity: 0, _locked: false });
};

const removeConsumable = (row, index) => {
  ensureConsumablesList(row);
  row.consumablesList.splice(index, 1);
};

const lockConsumable = (row, index) => {
  ensureConsumablesList(row);
  if (row.consumablesList[index]) {
    row.consumablesList[index]._locked = true;
  }
};

const unlockConsumable = (row, index) => {
  ensureConsumablesList(row);
  if (row.consumablesList[index]) {
    row.consumablesList[index]._locked = false;
  }
};

const addPart = (row) => {
  ensurePartsList(row);
  row.partsList.push({ name: '', model: '', spec: '', quantity: 0, reason: '', _locked: false });
};

const removePart = (row, index) => {
  ensurePartsList(row);
  row.partsList.splice(index, 1);
};

const lockPart = (row, index) => {
  ensurePartsList(row);
  if (row.partsList[index]) {
    row.partsList[index]._locked = true;
  }
};

const unlockPart = (row, index) => {
  ensurePartsList(row);
  if (row.partsList[index]) {
    row.partsList[index]._locked = false;
  }
};

const consumableRowClass = ({ row }) => (row?._locked ? 'row-locked' : '');
const partRowClass = ({ row }) => (row?._locked ? 'row-locked' : '');

const startAssignment = async (row) => {
  assignmentSaving.value = true;
  try {
    await request.put(`/maintenance-assignments/${row.id}/start`);
    ElMessage.success('已开始保养');
    assignDetailVisible.value = false;
    loadAssignments();
  } catch (e) {
    ElMessage.error(e.message || '开始失败');
  } finally {
    assignmentSaving.value = false;
  }
};

const saveAssignment = async (row) => {
  assignmentSaving.value = true;
  try {
    await request.put(`/maintenance-assignments/${row.id}`, {
      status: row.status,
      actualStartDate: row.actualStartDate,
      actualStartTime: row.actualStartTime,
      actualEndDate: row.actualEndDate,
      actualEndTime: row.actualEndTime,
      completionNote: row.completionNote,
      workHours: row.workHours,
      maintenanceItems: row.maintenanceItems,
      maintenanceTools: row.maintenanceTools,
      consumablesList: row.consumablesList || [],
      partsList: row.partsList || []
    });
    ElMessage.success('保存成功');
    loadAssignments();
  } catch (e) {
    ElMessage.error(e.message || '保存失败');
  } finally {
    assignmentSaving.value = false;
  }
};

const completeAssignment = async (row) => {
  assignmentSaving.value = true;
  try {
    await request.put(`/maintenance-assignments/${row.id}/complete`, {
      actualEndDate: row.actualEndDate,
      actualEndTime: row.actualEndTime,
      completionNote: row.completionNote,
      workHours: row.workHours,
      maintenanceItems: row.maintenanceItems,
      maintenanceTools: row.maintenanceTools,
      consumablesList: row.consumablesList || [],
      partsList: row.partsList || []
    });
    ElMessage.success('提交成功');
    assignDetailVisible.value = false;
    loadAssignments();
  } catch (e) {
    ElMessage.error(e.message || '提交失败');
  } finally {
    assignmentSaving.value = false;
  }
};

const verifyAssignment = async (row, result) => {
  if (!canVerifyAssignment(row)) return;
  const requiredRatings = [row.verifySafety, row.verifyQuality, row.verifyProgress, row.verifyHygiene];
  if (requiredRatings.some(score => !score)) {
    ElMessage.warning('请完成四项评分');
    return;
  }
  assignmentSaving.value = true;
  try {
    await request.post(`/maintenance-assignments/${row.id}/verify`, {
      result,
      verifyComment: row.verifyComment,
      verifySafety: row.verifySafety,
      verifyQuality: row.verifyQuality,
      verifyProgress: row.verifyProgress,
      verifyHygiene: row.verifyHygiene
    });
    ElMessage.success(result === 'pass' ? '验收通过' : '已退回');
    assignDetailVisible.value = false;
    loadAssignments();
  } catch (e) {
    ElMessage.error(e.message || '验收失败');
  } finally {
    assignmentSaving.value = false;
  }
};

// 从保养计划快速分配任务
const quickAssignFromPlan = (row) => {
  const group = planGroupMap.value.get(row.groupKey);
  const cycle = group?.cycles?.[row.cycleType];
  assignForm.value = {
    stationId: row.stationId,
    planId: cycle?.planIds?.[0] || null,
    equipmentCode: row.equipmentCode,
    equipmentName: row.equipmentName,
    installLocation: row.installLocation,
    cycleType: row.cycleType,
    executorId: null,
    assignerName: userStore.realName || userStore.username,
    planDate: dayjs().format('YYYY-MM-DD'),
    planTimeRange: []
  };
  selectedPlanStandards.value = cycle?.standards || [];
  loadStationUsers(row.stationId);
  loadStationPlans(row.stationId);
  activeTab.value = 'assignment';
  assignDialogVisible.value = true;
};

// ========== 保养计划 ========== 
const showPlanDialog = (row = null) => {
  if (row) {
    const group = planGroupMap.value.get(row.groupKey);
    planIsEdit.value = true;
    planForm.value = {
      stationId: group?.stationId || null,
      equipmentCode: group?.equipmentCode || '',
      equipmentName: group?.equipmentName || '',
      installLocation: group?.installLocation || '',
      weeklyDay: group?.weeklyDay || null,
      monthlyDay: group?.monthlyDay || null,
      yearlyMonth: group?.yearlyMonth || null,
      yearlyDay: group?.yearlyDay || null,
      cycleStandards: {
        daily: group?.cycles?.daily?.standards?.map(std => ({ ...std })) || [],
        weekly: group?.cycles?.weekly?.standards?.map(std => ({ ...std })) || [],
        monthly: group?.cycles?.monthly?.standards?.map(std => ({ ...std })) || [],
        yearly: group?.cycles?.yearly?.standards?.map(std => ({ ...std })) || []
      },
      cyclePlanIds: {
        daily: group?.cycles?.daily?.planIds || [],
        weekly: group?.cycles?.weekly?.planIds || [],
        monthly: group?.cycles?.monthly?.planIds || [],
        yearly: group?.cycles?.yearly?.planIds || []
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

const addStandard = (cycle) => {
  if (!planForm.value.cycleStandards[cycle]) return;
  planForm.value.cycleStandards[cycle].push({ name: '', specification: '' });
};

const removeStandard = (cycle, idx) => {
  if (!planForm.value.cycleStandards[cycle]) return;
  planForm.value.cycleStandards[cycle].splice(idx, 1);
};

const getValidStandards = (list) => {
  return (list || []).filter(
    item => (item?.name && item.name.trim()) || (item?.specification && item.specification.trim())
  );
};

const savePlan = async () => {
  try {
    await planFormRef.value.validate();
  } catch {
    return;
  }

  const cycleData = [
    { cycleType: 'daily' },
    { cycleType: 'weekly' },
    { cycleType: 'monthly' },
    { cycleType: 'yearly' }
  ];
  const cyclePayloads = cycleData.map(({ cycleType }) => ({
    cycleType,
    standards: getValidStandards(planForm.value.cycleStandards[cycleType])
  }));
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
        // 如果没有标准，删除所有该周期的计划
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
        // 更新第一个计划
        await request.put(`/maintenance-plan-library/${planIds[0]}`, data);
        // 删除多余的计划（如果存在多个同周期类型的计划）
        for (let i = 1; i < planIds.length; i++) {
          await request.delete(`/maintenance-plan-library/${planIds[i]}`);
        }
      } else {
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

const deletePlan = async (row) => {
  try {
    await ElMessageBox.confirm(`确认删除设备 "${row.equipmentName}" 的${getCycleLabel(row.cycleType)}计划？`, '删除确认', { type: 'warning' });
    const planIds = row.planIds || [];
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

// ========== 模板和导入 ========== 
const downloadPlanTemplate = () => {
  import('xlsx').then((XLSX) => {
    const templateData = [
      {
        '场站': '示例场站',
        '设备编号': 'EQ001',
        '设备名称': '压缩机',
        '安装位置': '1号站',
        '保养周期': '月保养',
        '保养标准': '润滑检查',
        '保养规范': '检查润滑油位'
      },
      {
        '场站': '示例场站',
        '设备编号': 'EQ001',
        '设备名称': '压缩机',
        '安装位置': '1号站',
        '保养周期': '月保养',
        '保养标准': '滤网清洁',
        '保养规范': '清理过滤网'
      },
      {
        '场站': '示例场站',
        '设备编号': 'EQ002',
        '设备名称': '风机',
        '安装位置': '2号站',
        '保养周期': '周保养',
        '保养标准': '运行检查',
        '保养规范': '检查运行状态'
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);

    ws['!cols'] = [
      { wch: 12 }, // 场站
      { wch: 14 }, // 设备编号
      { wch: 16 }, // 设备名称
      { wch: 16 }, // 安装位置
      { wch: 12 }, // 保养周期
      { wch: 18 }, // 保养标准
      { wch: 30 }, // 保养规范
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '保养计划');
    XLSX.writeFile(wb, '保养计划模板.xlsx');
    ElMessage.success('模板已下载');
  });
};
const triggerPlanImport = () => {
  planFileInputRef.value?.click();
};

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
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;
      const stationName = String(row[0] || '').trim();
      if (!stationName) continue;
      const equipmentCode = String(row[1] || '').trim();
      const equipmentName = String(row[2] || '').trim();
      const installLocation = String(row[3] || '').trim();
      const cycleType = parseCycleType(String(row[4] || '').trim());
      if (!equipmentCode || !equipmentName) continue;

      const standardName = String(row[5] || '').trim();
      const standardSpec = String(row[6] || '').trim();
      const key = `${stationName}||${equipmentCode}||${equipmentName}||${installLocation}||${cycleType}`;
      if (!planMap.has(key)) {
        planMap.set(key, {
          stationName,
          equipmentCode,
          equipmentName,
          installLocation,
          cycleType,
          maintenanceStandards: []
        });
      }
      if (standardName || standardSpec) {
        planMap.get(key).maintenanceStandards.push({
          name: standardName || '保养标准',
          specification: standardSpec
        });
      }
    }

    const plans = Array.from(planMap.values());
    if (plans.length === 0) {
      ElMessage.warning('未找到有效数据，请检查文件格式');
      return;
    }

    const res = await request.post('/maintenance-plan-library/batch-import', { plans });
    const successCount = res.success || res.successCount || plans.length;
    ElMessage.success(`导入完成: 成功${successCount}条`);
    loadPlanList();
  } catch (err) {
    console.error('导入失败', err);
    ElMessage.error(err.message || '导入失败，请检查文件格式');
  } finally {
    if (planFileInputRef.value) {
      planFileInputRef.value.value = '';
    }
  }
};

const parseCycleType = (label) => {
  const map = { '日保养': 'daily', '周保养': 'weekly', '月保养': 'monthly', '年保养': 'yearly' };
  return map[label] || 'monthly';
};

// ========== 保养计划岗位分配方法 ==========
const loadPositionPlans = async () => {
  positionLoading.value = true;
  try {
    const params = {
      page: positionPagination.value.page,
      pageSize: positionPagination.value.pageSize,
      stationId: positionFilters.value.stationId || undefined,
      positionName: positionFilters.value.positionName || undefined
    };
    const res = await request.get('/maintenance-position-plans', { params });
    positionPlanList.value = (res.list || []).map(item => ({
      id: item.id,
      stationId: item.station_id,
      stationName: item.station?.station_name || '-',
      positionName: item.position_name,
      planId: item.plan_id,
      equipmentCode: item.plan?.equipment_code || '-',
      equipmentName: item.plan?.equipment_name || '-',
      installLocation: item.plan?.install_location || '-',
      hasDailyCycle: item.plan?.cycle_type === 'daily' || item.hasDailyCycle,
      hasWeeklyCycle: item.plan?.cycle_type === 'weekly' || item.hasWeeklyCycle,
      hasMonthlyCycle: item.plan?.cycle_type === 'monthly' || item.hasMonthlyCycle,
      hasYearlyCycle: item.plan?.cycle_type === 'yearly' || item.hasYearlyCycle
    }));
    positionPagination.value.total = res.total || 0;
  } catch (e) {
    console.error('加载岗位分配失败', e);
  } finally {
    positionLoading.value = false;
  }
};

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
    const res = await request.get('/hygiene-position-areas', { params: { stationId } });
    const positions = new Set();
    (res.list || res || []).forEach(item => {
      if (item.position_name) positions.add(item.position_name);
    });
    stationPositions.value = Array.from(positions);
  } catch (e) {
    console.error('加载岗位失败', e);
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
      if (item.cycle_type === 'daily') plan.hasDailyCycle = true;
      if (item.cycle_type === 'weekly') plan.hasWeeklyCycle = true;
      if (item.cycle_type === 'monthly') plan.hasMonthlyCycle = true;
      if (item.cycle_type === 'yearly') plan.hasYearlyCycle = true;
    });
    stationPlanOptions.value = Array.from(planMap.values());
  } catch (e) {
    console.error('加载保养计划失败', e);
    stationPlanOptions.value = [];
  }
};

const onPlanSelectionChange = (selection) => {
  selectedPlanIds.value = selection.map(item => item.planId);
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

// ========== 保养工作记录方法 ==========
const loadWorkRecords = async () => {
  recordLoading.value = true;
  try {
    const params = {
      page: recordPagination.value.page,
      pageSize: recordPagination.value.pageSize,
      stationId: recordFilters.value.stationId || undefined,
      cycleType: recordFilters.value.cycleType || undefined,
      startDate: recordFilters.value.dateRange?.[0],
      endDate: recordFilters.value.dateRange?.[1]
    };
    const res = await request.get('/maintenance-work-records', { params });
    workRecordList.value = (res.list || []).map(item => ({
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
      executorName: item.executor_name,
      maintenanceItems: item.maintenance_items || [],
      maintenanceTools: item.maintenance_tools,
      workHours: item.work_hours,
      consumablesList: item.consumables_list || [],
      partsList: item.parts_list || [],
      remark: item.remark,
      status: item.status,
      submitTime: item.submit_time ? dayjs(item.submit_time).format('YYYY-MM-DD HH:mm:ss') : '-'
    }));
    recordPagination.value.total = res.total || 0;
  } catch (e) {
    console.error('加载保养工作记录失败', e);
  } finally {
    recordLoading.value = false;
  }
};

const viewWorkRecord = (row) => {
  currentRecord.value = { ...row };
  recordDetailVisible.value = true;
};

// ========== 初始化 ==========
onMounted(() => {
  loadStations();
  loadAssignments();
  loadPlanList();
});
</script>

<style lang="scss" scoped>
.equipment-maintenance-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h2 {
      margin: 0;
      font-size: 20px;
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }

  .filter-bar {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
  }

  .table-wrapper {
    background: #fff;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
    background: #fff;
    padding: 12px 16px;
    border-radius: 8px;
  }

  .text-muted {
    color: #909399;
  }

  .plan-standards-empty {
    color: #909399;
  }

  .standards-container {
    .standard-item {
      margin-bottom: 12px;
    }
  }

  .section-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px 16px;
  }

  .status-steps {
    margin-bottom: 16px;
  }

  .full-row {
    grid-column: 1 / -1;
  }

  .list-block {
    width: 100%;
  }

  .list-actions {
    margin-bottom: 8px;
  }

  .table-scroll {
    overflow-x: auto;
    overflow-y: hidden;
    width: 100%;
  }

  .inner-table {
    min-width: 900px;
  }

  :deep(.row-locked td) {
    background: #f5f7fa;
  }

  .cycle-tags {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
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
</style>
