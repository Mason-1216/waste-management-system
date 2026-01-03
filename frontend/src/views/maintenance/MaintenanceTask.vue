<template>
  <div class="maintenance-task-page">
    <!-- 管理者视图：显示Tab -->
    <el-tabs v-if="canManage" v-model="activeTab" type="border-card">
      <!-- Tab 1: 保养工作 -->
      <el-tab-pane label="保养工作" name="work">
        <MaintenanceWorkContent />
      </el-tab-pane>

      <!-- Tab 2: 保养计划 -->
      <el-tab-pane label="保养计划" name="plan">
        <div class="page-header">
          <h2>保养计划管理</h2>
          <div class="actions">
            <el-button type="primary" @click="showPlanDialog()">
              <el-icon><Plus /></el-icon>新增计划
            </el-button>
            <el-button @click="downloadPlanTemplate">下载模板</el-button>
            <el-button @click="triggerPlanImport">导入</el-button>
            <input ref="planFileInputRef" type="file" accept=".xlsx,.xls" style="display:none" @change="handlePlanImport" />
            <el-button @click="loadPlanList">刷新</el-button>
          </div>
        </div>

        <div class="filter-bar">
          <el-select v-model="planFilters.stationId" placeholder="场站" clearable style="width: 150px;" @change="loadPlanList">
            <el-option v-for="s in stationList" :key="s.id" :label="s.stationName" :value="s.id" />
          </el-select>
          <el-input v-model="planFilters.equipmentName" placeholder="设备名称" clearable style="width: 150px;" @clear="loadPlanList" @keyup.enter="loadPlanList" />
          <el-button type="primary" @click="loadPlanList">搜索</el-button>
        </div>

        <div class="table-wrapper" v-loading="planLoading">
          <el-table :data="planList" stripe border>
            <el-table-column prop="stationName" label="场站" width="100" />
            <el-table-column prop="equipmentCode" label="设备编号" width="110" />
            <el-table-column prop="equipmentName" label="设备名称" min-width="130" />
            <el-table-column prop="installLocation" label="安装位置" width="130" />
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
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="showPlanDialog(row)">编辑</el-button>
                <el-button link type="danger" size="small" @click="deletePlan(row)">删除</el-button>
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
      <el-tab-pane label="保养计划岗位分配" name="position">
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

      <!-- Tab 3: 保养工作记录 -->
      <el-tab-pane label="保养工作记录" name="records">
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
          <el-select v-model="recordFilters.status" placeholder="状态" clearable style="width: 120px;" @change="loadWorkRecords">
            <el-option label="待完成" value="pending" />
            <el-option label="已完成" value="completed" />
            <el-option label="已验收" value="verified" />
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
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="getRecordStatusType(row.status)" size="small">
                  {{ getRecordStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="submitTime" label="提交时间" width="160" />
            <el-table-column label="操作" width="140" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="viewWorkRecord(row)">查看</el-button>
                <el-button
                  v-if="row.status === 'completed'"
                  link type="success" size="small"
                  @click="showVerifyDialog(row)"
                >验收</el-button>
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

    <!-- 普通员工视图：只显示保养工作 -->
    <MaintenanceWorkContent v-else />

    <!-- 岗位计划分配对话框 -->
    <el-dialog v-model="positionAssignDialogVisible" title="分配岗位保养计划" width="700px" destroy-on-close>
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

        <!-- 验收信息 -->
        <template v-if="currentRecord.status === 'verified'">
          <el-divider content-position="left">验收信息</el-divider>
          <div class="section-grid">
            <el-form-item label="验收结果">
              <el-tag :type="currentRecord.verifyResult === 'pass' ? 'success' : 'danger'">
                {{ currentRecord.verifyResult === 'pass' ? '验收通过' : '验收不通过' }}
              </el-tag>
            </el-form-item>
            <el-form-item label="验收人">
              <span>{{ currentRecord.verifierName }}</span>
            </el-form-item>
            <el-form-item label="验收时间">
              <span>{{ currentRecord.verifyTime }}</span>
            </el-form-item>
            <el-form-item v-if="currentRecord.verifyRemark" label="验收备注">
              <span>{{ currentRecord.verifyRemark }}</span>
            </el-form-item>
          </div>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="recordDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 验收对话框 -->
    <el-dialog v-model="verifyDialogVisible" title="验收保养记录" width="500px" destroy-on-close>
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
        <el-form-item label="验收备注">
          <el-input v-model="verifyForm.remark" type="textarea" :rows="3" placeholder="请输入验收备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="verifyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitVerify" :loading="verifySubmitting">确认验收</el-button>
      </template>
    </el-dialog>

    <!-- 保养计划编辑对话框 -->
    <el-dialog v-model="planDialogVisible" :title="planIsEdit ? '编辑保养计划' : '新增保养计划'" width="750px" destroy-on-close>
      <el-form :model="planForm" ref="planFormRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="场站" prop="stationId" :rules="[{ required: true, message: '请选择场站' }]">
              <el-select v-model="planForm.stationId" placeholder="请选择场站" style="width: 100%;">
                <el-option v-for="s in stationList" :key="s.id" :label="s.stationName" :value="s.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备编号" prop="equipmentCode" :rules="[{ required: true, message: '请输入设备编号' }]">
              <el-input v-model="planForm.equipmentCode" placeholder="请输入设备编号" maxlength="50" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备名称" prop="equipmentName" :rules="[{ required: true, message: '请输入设备名称' }]">
              <el-input v-model="planForm.equipmentName" placeholder="请输入设备名称" maxlength="100" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="安装位置">
              <el-input v-model="planForm.installLocation" placeholder="请输入安装位置" maxlength="200" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="日保养标准">
          <div class="standards-container">
            <div v-for="(std, idx) in planForm.cycleStandards.daily" :key="`daily-${idx}`" class="standard-item">
              <el-row :gutter="12" align="middle">
                <el-col :span="10"><el-input v-model="std.name" placeholder="保养标准名称" /></el-col>
                <el-col :span="12"><el-input v-model="std.specification" placeholder="保养规范" /></el-col>
                <el-col :span="2"><el-button type="danger" :icon="Delete" circle size="small" @click="removeStandard('daily', idx)" /></el-col>
              </el-row>
            </div>
            <el-button type="primary" link @click="addStandard('daily')"><el-icon><Plus /></el-icon>添加日保养标准</el-button>
          </div>
        </el-form-item>
        <el-form-item label="周保养标准">
          <div class="standards-container">
            <div class="cycle-schedule-row">
              <span class="schedule-label">每周</span>
              <el-select v-model="planForm.weeklyDay" placeholder="周几" style="width: 100px;">
                <el-option label="周一" :value="1" /><el-option label="周二" :value="2" /><el-option label="周三" :value="3" />
                <el-option label="周四" :value="4" /><el-option label="周五" :value="5" /><el-option label="周六" :value="6" /><el-option label="周日" :value="7" />
              </el-select>
              <span class="schedule-label">完成</span>
            </div>
            <div v-for="(std, idx) in planForm.cycleStandards.weekly" :key="`weekly-${idx}`" class="standard-item">
              <el-row :gutter="12" align="middle">
                <el-col :span="10"><el-input v-model="std.name" placeholder="保养标准名称" /></el-col>
                <el-col :span="12"><el-input v-model="std.specification" placeholder="保养规范" /></el-col>
                <el-col :span="2"><el-button type="danger" :icon="Delete" circle size="small" @click="removeStandard('weekly', idx)" /></el-col>
              </el-row>
            </div>
            <el-button type="primary" link @click="addStandard('weekly')"><el-icon><Plus /></el-icon>添加周保养标准</el-button>
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
                <el-col :span="10"><el-input v-model="std.name" placeholder="保养标准名称" /></el-col>
                <el-col :span="12"><el-input v-model="std.specification" placeholder="保养规范" /></el-col>
                <el-col :span="2"><el-button type="danger" :icon="Delete" circle size="small" @click="removeStandard('monthly', idx)" /></el-col>
              </el-row>
            </div>
            <el-button type="primary" link @click="addStandard('monthly')"><el-icon><Plus /></el-icon>添加月保养标准</el-button>
          </div>
        </el-form-item>
        <el-form-item label="年保养标准">
          <div class="standards-container">
            <div class="cycle-schedule-row">
              <span class="schedule-label">每年</span>
              <el-input-number v-model="planForm.yearlyMonth" :min="1" :max="12" placeholder="月" style="width: 90px;" />
              <span class="schedule-label">月</span>
              <el-input-number v-model="planForm.yearlyDay" :min="1" :max="31" placeholder="日" style="width: 90px;" />
              <span class="schedule-label">日完成</span>
            </div>
            <div v-for="(std, idx) in planForm.cycleStandards.yearly" :key="`yearly-${idx}`" class="standard-item">
              <el-row :gutter="12" align="middle">
                <el-col :span="10"><el-input v-model="std.name" placeholder="保养标准名称" /></el-col>
                <el-col :span="12"><el-input v-model="std.specification" placeholder="保养规范" /></el-col>
                <el-col :span="2"><el-button type="danger" :icon="Delete" circle size="small" @click="removeStandard('yearly', idx)" /></el-col>
              </el-row>
            </div>
            <el-button type="primary" link @click="addStandard('yearly')"><el-icon><Plus /></el-icon>添加年保养标准</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="planDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePlan" :loading="planSaving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, defineComponent, h, resolveComponent } from 'vue';
import { useUserStore } from '@/store/user';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh, Delete, Sunny, Calendar, DataLine, TrendCharts, Plus } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import request from '@/api/request';

const userStore = useUserStore();

// 权限控制：只有站长、部门经理、副经理可以看到管理功能
const canManage = computed(() => userStore.hasRole(['station_manager', 'department_manager', 'deputy_manager']));

// Tab控制
const activeTab = ref('work');

// 监听标签页切换
watch(activeTab, (tab) => {
  if (tab === 'plan') {
    loadPlanList();
  } else if (tab === 'position') {
    loadPositionPlans();
  } else if (tab === 'records') {
    loadWorkRecords();
  }
});

// ========== 保养工作状态 ==========
const workLoading = ref(false);
const workTaskList = ref([]);
const workDetailDialogVisible = ref(false);
const workFormDialogVisible = ref(false);
const workCurrentCycleType = ref('');
const workCurrentTask = ref(null);
const workSubmitting = ref(false);
const workTaskForm = ref({
  maintenanceItems: [],
  maintenanceTools: '',
  workHours: 0,
  consumablesList: [],
  partsList: [],
  remark: ''
});

const currentDate = computed(() => dayjs().format('YYYY年MM月DD日'));

const dailyTasks = computed(() => workTaskList.value.filter(t => t.cycleType === 'daily'));
const weeklyTasks = computed(() => workTaskList.value.filter(t => t.cycleType === 'weekly'));
const monthlyTasks = computed(() => workTaskList.value.filter(t => t.cycleType === 'monthly'));
const yearlyTasks = computed(() => workTaskList.value.filter(t => t.cycleType === 'yearly'));

const currentCycleTasks = computed(() => {
  switch (workCurrentCycleType.value) {
    case 'daily': return dailyTasks.value;
    case 'weekly': return weeklyTasks.value;
    case 'monthly': return monthlyTasks.value;
    case 'yearly': return yearlyTasks.value;
    default: return [];
  }
});

const getCycleConfig = (cycleType) => {
  const configs = {
    daily: { title: '日保养', color: '#67c23a', bgColor: 'linear-gradient(135deg, #67c23a 0%, #95d475 100%)', icon: Sunny },
    weekly: { title: '周保养', color: '#e6a23c', bgColor: 'linear-gradient(135deg, #e6a23c 0%, #f0c78a 100%)', icon: Calendar },
    monthly: { title: '月保养', color: '#409eff', bgColor: 'linear-gradient(135deg, #409eff 0%, #79bbff 100%)', icon: DataLine },
    yearly: { title: '年保养', color: '#f56c6c', bgColor: 'linear-gradient(135deg, #f56c6c 0%, #fab6b6 100%)', icon: TrendCharts }
  };
  return configs[cycleType] || configs.daily;
};

const getTasksForCycle = (cycleType) => {
  switch (cycleType) {
    case 'daily': return dailyTasks.value;
    case 'weekly': return weeklyTasks.value;
    case 'monthly': return monthlyTasks.value;
    case 'yearly': return yearlyTasks.value;
    default: return [];
  }
};

const getCycleStatusInfo = (cycleType) => {
  const tasks = getTasksForCycle(cycleType);
  if (tasks.length === 0) return { text: '今日无任务', type: 'info' };
  const pending = tasks.filter(t => t.status === 'pending').length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const verified = tasks.filter(t => t.status === 'verified').length;
  if (verified === tasks.length) return { text: '已全部验收', type: 'success' };
  if (pending === 0) return { text: '已全部完成', type: 'warning' };
  return { text: `${pending}项待完成`, type: 'danger' };
};

const getWorkStatusText = (status) => {
  const texts = { pending: '待完成', completed: '已完成', verified: '已验收' };
  return texts[status] || status;
};

const getWorkStatusTagType = (status) => {
  const types = { pending: 'info', completed: 'warning', verified: 'success' };
  return types[status] || 'info';
};

const formatTime = (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-';

const loadTodayTasks = async () => {
  workLoading.value = true;
  try {
    const res = await request.get('/maintenance-work-records/today-tasks');
    const data = res.data || res.tasks || res.list || res || [];
    workTaskList.value = (Array.isArray(data) ? data : []).map(item => ({
      planId: item.plan_id || item.planId,
      stationId: item.station_id || item.stationId,
      positionName: item.position_name || item.positionName,
      equipmentCode: item.equipment_code || item.equipmentCode,
      equipmentName: item.equipment_name || item.equipmentName,
      installLocation: item.install_location || item.installLocation,
      cycleType: item.cycle_type || item.cycleType,
      maintenanceStandards: item.maintenance_standards || item.maintenanceStandards || [],
      standardCount: (item.maintenance_standards || item.maintenanceStandards || []).length,
      status: item.existingRecord?.status || 'pending',
      recordId: item.existingRecord?.id,
      existingRecord: item.existingRecord || null,
      verifyResult: item.existingRecord?.verifyResult,
      verifierName: item.existingRecord?.verifierName,
      verifyTime: item.existingRecord?.verifyTime,
      verifyRemark: item.existingRecord?.verifyRemark
    }));
  } catch (e) {
    console.error('加载今日任务失败', e);
    ElMessage.error('加载任务失败');
  } finally {
    workLoading.value = false;
  }
};

const openCycleDetail = (cycleType) => {
  workCurrentCycleType.value = cycleType;
  workDetailDialogVisible.value = true;
};

const openWorkTaskForm = (task) => {
  workCurrentTask.value = { ...task };

  if (task.existingRecord) {
    const record = task.existingRecord;
    workTaskForm.value = {
      maintenanceItems: (record.maintenanceItems || record.maintenance_items || []).map(item => ({
        name: item.name,
        specification: item.specification,
        qualified: item.qualified || null
      })),
      maintenanceTools: record.maintenanceTools || record.maintenance_tools || '',
      workHours: record.workHours || record.work_hours || 0,
      consumablesList: (record.consumablesList || record.consumables_list || []).map(item => ({
        name: item.name || '',
        model: item.model || '',
        spec: item.spec || '',
        quantity: item.quantity || 0
      })),
      partsList: (record.partsList || record.parts_list || []).map(item => ({
        name: item.name || '',
        model: item.model || '',
        spec: item.spec || '',
        quantity: item.quantity || 0,
        reason: item.reason || ''
      })),
      remark: record.remark || ''
    };
  } else {
    workTaskForm.value = {
      maintenanceItems: (task.maintenanceStandards || []).map(std => ({
        name: std.name || std,
        specification: std.specification || '',
        qualified: null
      })),
      maintenanceTools: '',
      workHours: 0,
      consumablesList: [],
      partsList: [],
      remark: ''
    };
  }

  workFormDialogVisible.value = true;
};

const addWorkConsumable = () => {
  workTaskForm.value.consumablesList.push({ name: '', model: '', spec: '', quantity: 0 });
};

const removeWorkConsumable = (idx) => {
  workTaskForm.value.consumablesList.splice(idx, 1);
};

const addWorkPart = () => {
  workTaskForm.value.partsList.push({ name: '', model: '', spec: '', quantity: 0, reason: '' });
};

const removeWorkPart = (idx) => {
  workTaskForm.value.partsList.splice(idx, 1);
};

const submitWorkTask = async () => {
  const uncheckedItems = workTaskForm.value.maintenanceItems.filter(item => item.qualified === null);
  if (uncheckedItems.length > 0) {
    try {
      await ElMessageBox.confirm(
        `还有 ${uncheckedItems.length} 项保养标准未填写是否合格，确定要提交吗？`,
        '提示',
        { type: 'warning' }
      );
    } catch {
      return;
    }
  }

  workSubmitting.value = true;
  try {
    await request.post('/maintenance-work-records', {
      planId: workCurrentTask.value.planId,
      stationId: workCurrentTask.value.stationId,
      positionName: workCurrentTask.value.positionName,
      equipmentCode: workCurrentTask.value.equipmentCode,
      equipmentName: workCurrentTask.value.equipmentName,
      installLocation: workCurrentTask.value.installLocation,
      cycleType: workCurrentTask.value.cycleType,
      workDate: dayjs().format('YYYY-MM-DD'),
      maintenanceItems: workTaskForm.value.maintenanceItems,
      maintenanceTools: workTaskForm.value.maintenanceTools,
      workHours: workTaskForm.value.workHours,
      consumablesList: workTaskForm.value.consumablesList.filter(c => c.name),
      partsList: workTaskForm.value.partsList.filter(p => p.name),
      remark: workTaskForm.value.remark
    });
    ElMessage.success('提交成功');
    workFormDialogVisible.value = false;
    workDetailDialogVisible.value = false;
    loadTodayTasks();
  } catch (e) {
    ElMessage.error(e.message || '提交失败');
  } finally {
    workSubmitting.value = false;
  }
};

// 页面挂载时加载数据
onMounted(() => {
  loadTodayTasks();
});

// ========== 保养工作内容组件（卡片式布局）==========
const MaintenanceWorkContent = defineComponent({
  name: 'MaintenanceWorkContent',
  setup() {
    const cycleTypes = ['daily', 'weekly', 'monthly', 'yearly'];

    return () => h('div', { class: 'maintenance-work-content' }, [
      // 页面头部
      h('div', { class: 'work-page-header' }, [
        h('h2', '设备保养工作'),
        h('div', { class: 'header-right' }, [
          h('span', { class: 'current-date' }, currentDate.value),
          h(resolveComponent('el-button'), { onClick: loadTodayTasks, loading: workLoading.value, size: 'small' }, () => '刷新')
        ])
      ]),

      // 四个卡片
      h('div', { class: 'cycle-cards-container' },
        cycleTypes.map(cycleType => {
          const config = getCycleConfig(cycleType);
          const tasks = getTasksForCycle(cycleType);
          const statusInfo = getCycleStatusInfo(cycleType);
          const hasTasks = tasks.length > 0;
          const pendingCount = tasks.filter(t => t.status === 'pending').length;

          return h('div', {
            key: cycleType,
            class: ['cycle-card', { 'has-tasks': hasTasks, 'no-tasks': !hasTasks }],
            onClick: () => hasTasks && openCycleDetail(cycleType)
          }, [
            // 卡片左侧颜色条
            h('div', { class: 'card-color-bar', style: { background: config.bgColor } }),
            // 卡片主体
            h('div', { class: 'card-body' }, [
              // 左侧图标和标题
              h('div', { class: 'card-left' }, [
                h('div', { class: 'card-icon', style: { background: config.bgColor } }, [
                  h(resolveComponent('el-icon'), { size: 28 }, () => h(config.icon))
                ]),
                h('div', { class: 'card-info' }, [
                  h('div', { class: 'card-title' }, config.title),
                  h('div', { class: 'card-desc' }, hasTasks ? `${tasks.length}项设备保养` : '今日无保养任务')
                ])
              ]),
              // 中间状态
              h('div', { class: 'card-center' }, [
                h(resolveComponent('el-tag'), { type: statusInfo.type, size: 'default' }, () => statusInfo.text)
              ]),
              // 右侧按钮
              h('div', { class: 'card-right' }, [
                hasTasks && pendingCount > 0 ?
                  h(resolveComponent('el-button'), {
                    type: 'primary',
                    size: 'default',
                    onClick: (e) => {
                      e.stopPropagation();
                      const firstPending = tasks.find(t => t.status === 'pending');
                      if (firstPending) openWorkTaskForm(firstPending);
                    }
                  }, () => '保养') :
                  hasTasks ?
                    h(resolveComponent('el-button'), {
                      type: 'info',
                      size: 'default',
                      plain: true,
                      onClick: (e) => {
                        e.stopPropagation();
                        openCycleDetail(cycleType);
                      }
                    }, () => '查看') :
                    h('span', { class: 'no-task-hint' }, '-')
              ])
            ])
          ]);
        })
      ),

      // 周期详情对话框
      h(resolveComponent('el-dialog'), {
        modelValue: workDetailDialogVisible.value,
        'onUpdate:modelValue': (v) => workDetailDialogVisible.value = v,
        title: getCycleConfig(workCurrentCycleType.value).title + '任务列表',
        width: '700px',
        destroyOnClose: true
      }, {
        default: () => h('div', { class: 'cycle-detail-content' },
          currentCycleTasks.value.map((task, idx) =>
            h('div', { key: idx, class: 'task-item' }, [
              h('div', { class: 'task-info' }, [
                h('div', { class: 'task-name' }, [
                  h('span', { class: 'equipment-code' }, task.equipmentCode),
                  h('span', { class: 'equipment-name' }, task.equipmentName)
                ]),
                h('div', { class: 'task-location' }, task.installLocation || '-'),
                h('div', { class: 'task-standards' }, `${task.standardCount || 0}项保养标准`)
              ]),
              h('div', { class: 'task-status' }, [
                h(resolveComponent('el-tag'), { type: getWorkStatusTagType(task.status), size: 'small' }, () => getWorkStatusText(task.status))
              ]),
              h('div', { class: 'task-action' }, [
                task.status === 'pending' ?
                  h(resolveComponent('el-button'), { type: 'primary', size: 'small', onClick: () => openWorkTaskForm(task) }, () => '填写') :
                  h(resolveComponent('el-button'), { size: 'small', onClick: () => openWorkTaskForm(task) }, () => '查看')
              ])
            ])
          )
        ),
        footer: () => h(resolveComponent('el-button'), { onClick: () => workDetailDialogVisible.value = false }, () => '关闭')
      }),

      // 保养任务填写对话框
      h(resolveComponent('el-dialog'), {
        modelValue: workFormDialogVisible.value,
        'onUpdate:modelValue': (v) => workFormDialogVisible.value = v,
        title: workCurrentTask.value ? `${workCurrentTask.value.equipmentName} - ${getCycleConfig(workCurrentTask.value.cycleType).title}` : '保养任务',
        width: '800px',
        destroyOnClose: true
      }, {
        default: () => workCurrentTask.value ? h(resolveComponent('el-form'), { model: workTaskForm.value, labelWidth: '100px', class: 'work-task-form' }, () => [
          h(resolveComponent('el-divider'), { contentPosition: 'left' }, () => '任务信息'),
          h('div', { class: 'info-grid' }, [
            h(resolveComponent('el-form-item'), { label: '设备编号' }, () => h(resolveComponent('el-input'), { modelValue: workCurrentTask.value.equipmentCode, disabled: true })),
            h(resolveComponent('el-form-item'), { label: '设备名称' }, () => h(resolveComponent('el-input'), { modelValue: workCurrentTask.value.equipmentName, disabled: true })),
            h(resolveComponent('el-form-item'), { label: '安装位置' }, () => h(resolveComponent('el-input'), { modelValue: workCurrentTask.value.installLocation, disabled: true })),
            h(resolveComponent('el-form-item'), { label: '保养周期' }, () => h(resolveComponent('el-input'), { modelValue: getCycleConfig(workCurrentTask.value.cycleType).title, disabled: true }))
          ]),
          h(resolveComponent('el-divider'), { contentPosition: 'left' }, () => '保养标准确认'),
          h(resolveComponent('el-table'), { data: workTaskForm.value.maintenanceItems, border: true, size: 'small', class: 'standards-table' }, () => [
            h(resolveComponent('el-table-column'), { label: '保养标准名称', prop: 'name', minWidth: 150 }),
            h(resolveComponent('el-table-column'), { label: '保养规范', prop: 'specification', minWidth: 200 }),
            h(resolveComponent('el-table-column'), { label: '是否合格', width: 150, align: 'center' }, {
              default: ({ row }) => h(resolveComponent('el-radio-group'), {
                modelValue: row.qualified,
                'onUpdate:modelValue': (v) => row.qualified = v,
                disabled: workCurrentTask.value.status !== 'pending'
              }, () => [
                h(resolveComponent('el-radio'), { value: 'yes' }, () => '是'),
                h(resolveComponent('el-radio'), { value: 'no' }, () => '否')
              ])
            })
          ]),
          h(resolveComponent('el-divider'), { contentPosition: 'left' }, () => '保养信息'),
          h(resolveComponent('el-form-item'), { label: '保养工具' }, () =>
            h(resolveComponent('el-input'), {
              modelValue: workTaskForm.value.maintenanceTools,
              'onUpdate:modelValue': (v) => workTaskForm.value.maintenanceTools = v,
              placeholder: '使用的保养工具',
              disabled: workCurrentTask.value.status !== 'pending'
            })
          ),
          h(resolveComponent('el-form-item'), { label: '保养时长' }, () => [
            h(resolveComponent('el-input-number'), {
              modelValue: workTaskForm.value.workHours,
              'onUpdate:modelValue': (v) => workTaskForm.value.workHours = v,
              min: 0,
              max: 24,
              step: 0.5,
              disabled: workCurrentTask.value.status !== 'pending'
            }),
            h('span', { class: 'unit' }, '小时')
          ]),
          h(resolveComponent('el-divider'), { contentPosition: 'left' }, () => '耗材使用'),
          h('div', { class: 'list-block' }, [
            workCurrentTask.value.status === 'pending' ?
              h('div', { class: 'list-actions', style: { display: 'flex', justifyContent: 'flex-end', width: '100%' } }, [
                h(resolveComponent('el-button'), { type: 'primary', size: 'small', onClick: addWorkConsumable }, () => '新增')
              ]) : null,
            h('div', { class: 'list-table-wrapper', style: { overflowX: 'auto' } }, [
              h(resolveComponent('el-table'), { data: workTaskForm.value.consumablesList, border: true, size: 'small', class: 'list-table', style: { minWidth: '820px' } }, () => [
                h(resolveComponent('el-table-column'), { label: '名称', minWidth: 120 }, {
                  default: ({ row }) => h(resolveComponent('el-input'), { modelValue: row.name, 'onUpdate:modelValue': (v) => row.name = v, placeholder: '名称', disabled: workCurrentTask.value.status !== 'pending' })
                }),
                h(resolveComponent('el-table-column'), { label: '型号', minWidth: 100 }, {
                  default: ({ row }) => h(resolveComponent('el-input'), { modelValue: row.model, 'onUpdate:modelValue': (v) => row.model = v, placeholder: '型号', disabled: workCurrentTask.value.status !== 'pending' })
                }),
                h(resolveComponent('el-table-column'), { label: '规格', minWidth: 100 }, {
                  default: ({ row }) => h(resolveComponent('el-input'), { modelValue: row.spec, 'onUpdate:modelValue': (v) => row.spec = v, placeholder: '规格', disabled: workCurrentTask.value.status !== 'pending' })
                }),
                h(resolveComponent('el-table-column'), { label: '数量', width: 100 }, {
                  default: ({ row }) => h(resolveComponent('el-input-number'), { modelValue: row.quantity, 'onUpdate:modelValue': (v) => row.quantity = v, min: 0, size: 'small', disabled: workCurrentTask.value.status !== 'pending' })
                }),
                h(resolveComponent('el-table-column'), { label: '操作', width: 80, align: 'center' }, {
                  default: ({ $index }) => workCurrentTask.value.status === 'pending' ?
                    h(resolveComponent('el-button'), { link: true, type: 'danger', onClick: () => removeWorkConsumable($index) }, () => '删除') : null
                })
              ])
            ])
          ]),
          h(resolveComponent('el-divider'), { contentPosition: 'left' }, () => '配件更换'),
          h('div', { class: 'list-block' }, [
            workCurrentTask.value.status === 'pending' ?
              h('div', { class: 'list-actions', style: { display: 'flex', justifyContent: 'flex-end', width: '100%' } }, [
                h(resolveComponent('el-button'), { type: 'primary', size: 'small', onClick: addWorkPart }, () => '新增')
              ]) : null,
            h('div', { class: 'list-table-wrapper', style: { overflowX: 'auto' } }, [
              h(resolveComponent('el-table'), { data: workTaskForm.value.partsList, border: true, size: 'small', class: 'list-table', style: { minWidth: '900px' } }, () => [
                h(resolveComponent('el-table-column'), { label: '名称', minWidth: 120 }, {
                  default: ({ row }) => h(resolveComponent('el-input'), { modelValue: row.name, 'onUpdate:modelValue': (v) => row.name = v, placeholder: '名称', disabled: workCurrentTask.value.status !== 'pending' })
                }),
                h(resolveComponent('el-table-column'), { label: '型号', minWidth: 100 }, {
                  default: ({ row }) => h(resolveComponent('el-input'), { modelValue: row.model, 'onUpdate:modelValue': (v) => row.model = v, placeholder: '型号', disabled: workCurrentTask.value.status !== 'pending' })
                }),
                h(resolveComponent('el-table-column'), { label: '规格', minWidth: 100 }, {
                  default: ({ row }) => h(resolveComponent('el-input'), { modelValue: row.spec, 'onUpdate:modelValue': (v) => row.spec = v, placeholder: '规格', disabled: workCurrentTask.value.status !== 'pending' })
                }),
                h(resolveComponent('el-table-column'), { label: '数量', width: 100 }, {
                  default: ({ row }) => h(resolveComponent('el-input-number'), { modelValue: row.quantity, 'onUpdate:modelValue': (v) => row.quantity = v, min: 0, size: 'small', disabled: workCurrentTask.value.status !== 'pending' })
                }),
                h(resolveComponent('el-table-column'), { label: '更换原因', minWidth: 120 }, {
                  default: ({ row }) => h(resolveComponent('el-input'), { modelValue: row.reason, 'onUpdate:modelValue': (v) => row.reason = v, placeholder: '更换原因', disabled: workCurrentTask.value.status !== 'pending' })
                }),
                h(resolveComponent('el-table-column'), { label: '操作', width: 80, align: 'center' }, {
                  default: ({ $index }) => workCurrentTask.value.status === 'pending' ?
                    h(resolveComponent('el-button'), { link: true, type: 'danger', onClick: () => removeWorkPart($index) }, () => '删除') : null
                })
              ])
            ])
          ]),
          h(resolveComponent('el-form-item'), { label: '备注' }, () =>
            h(resolveComponent('el-input'), {
              modelValue: workTaskForm.value.remark,
              'onUpdate:modelValue': (v) => workTaskForm.value.remark = v,
              type: 'textarea',
              rows: 2,
              placeholder: '其他需要说明的情况',
              disabled: workCurrentTask.value.status !== 'pending'
            })
          ),
          // 验收信息
          workCurrentTask.value.status === 'completed' || workCurrentTask.value.status === 'verified' ? [
            h(resolveComponent('el-divider'), { contentPosition: 'left' }, () => '验收信息'),
            workCurrentTask.value.status === 'verified' ?
              h('div', { class: 'verify-info' }, [
                h(resolveComponent('el-form-item'), { label: '验收结果' }, () =>
                  h(resolveComponent('el-tag'), { type: workCurrentTask.value.verifyResult === 'pass' ? 'success' : 'danger' }, () =>
                    workCurrentTask.value.verifyResult === 'pass' ? '验收通过' : '验收不通过')
                ),
                h(resolveComponent('el-form-item'), { label: '验收人' }, () => h('span', workCurrentTask.value.verifierName)),
                h(resolveComponent('el-form-item'), { label: '验收时间' }, () => h('span', formatTime(workCurrentTask.value.verifyTime))),
                workCurrentTask.value.verifyRemark ?
                  h(resolveComponent('el-form-item'), { label: '验收备注' }, () => h('span', workCurrentTask.value.verifyRemark)) : null
              ]) :
              h('div', { class: 'verify-pending' }, h(resolveComponent('el-tag'), { type: 'info' }, () => '等待管理员验收'))
          ] : null
        ]) : null,
        footer: () => [
          h(resolveComponent('el-button'), { onClick: () => workFormDialogVisible.value = false }, () => '关闭'),
          workCurrentTask.value && workCurrentTask.value.status === 'pending' ?
            h(resolveComponent('el-button'), { type: 'primary', onClick: submitWorkTask, loading: workSubmitting.value }, () => '提交完成') : null
        ]
      })
    ]);
  }
});

// ========== 保养计划相关 ==========
const planList = ref([]);
const planLoading = ref(false);
const planFilters = ref({
  stationId: null,
  equipmentName: ''
});
const planPagination = ref({
  page: 1,
  pageSize: 10,
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
const planFileInputRef = ref(null);
const planGroupMap = ref(new Map());

// ========== 保养计划岗位分配相关 ==========
const stationList = ref([]);
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
const recordLoading = ref(false);
const recordFilters = ref({
  stationId: null,
  cycleType: '',
  status: '',
  dateRange: []
});
const recordPagination = ref({
  page: 1,
  pageSize: 10,
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
  remark: ''
});

// ========== 辅助函数 ==========
const getCycleLabel = (cycle) => {
  const labels = { daily: '日保养', weekly: '周保养', monthly: '月保养', yearly: '年保养' };
  return labels[cycle] || cycle;
};

const getRecordStatusType = (status) => {
  const types = { pending: 'info', completed: 'warning', verified: 'success' };
  return types[status] || 'info';
};

const getRecordStatusText = (status) => {
  const texts = { pending: '待完成', completed: '已完成', verified: '已验收' };
  return texts[status] || status;
};

// ========== 数据加载 ==========
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

// 加载保养计划列表
const loadPlanList = async () => {
  planLoading.value = true;
  try {
    const params = {
      page: planPagination.value.page,
      pageSize: planPagination.value.pageSize,
      stationId: planFilters.value.stationId || undefined,
      equipmentName: planFilters.value.equipmentName || undefined
    };
    const res = await request.get('/maintenance-plan-library', { params });

    // 按设备分组
    const groupMap = new Map();
    (res.list || []).forEach(item => {
      const key = `${item.station_id}||${item.equipment_code}||${item.equipment_name}||${item.install_location}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          groupKey: key,
          stationId: item.station_id,
          stationName: item.station?.station_name || '-',
          equipmentCode: item.equipment_code,
          equipmentName: item.equipment_name,
          installLocation: item.install_location,
          hasDailyCycle: false,
          hasWeeklyCycle: false,
          hasMonthlyCycle: false,
          hasYearlyCycle: false,
          weeklyDay: null,
          monthlyDay: null,
          yearlyMonth: null,
          yearlyDay: null,
          cycles: {}
        });
      }
      const group = groupMap.get(key);
      if (item.cycle_type === 'daily') {
        group.hasDailyCycle = true;
        group.cycles.daily = { planIds: [item.id], standards: item.maintenance_standards || [] };
      }
      if (item.cycle_type === 'weekly') {
        group.hasWeeklyCycle = true;
        group.weeklyDay = item.weekly_day;
        group.cycles.weekly = { planIds: [item.id], standards: item.maintenance_standards || [] };
      }
      if (item.cycle_type === 'monthly') {
        group.hasMonthlyCycle = true;
        group.monthlyDay = item.monthly_day;
        group.cycles.monthly = { planIds: [item.id], standards: item.maintenance_standards || [] };
      }
      if (item.cycle_type === 'yearly') {
        group.hasYearlyCycle = true;
        group.yearlyMonth = item.yearly_month;
        group.yearlyDay = item.yearly_day;
        group.cycles.yearly = { planIds: [item.id], standards: item.maintenance_standards || [] };
      }
    });

    planGroupMap.value = groupMap;
    planList.value = Array.from(groupMap.values());
    planPagination.value.total = res.total || 0;
  } catch (e) {
    console.error('加载保养计划失败', e);
  } finally {
    planLoading.value = false;
  }
};

// 显示保养计划对话框
const showPlanDialog = (row = null) => {
  if (row) {
    planIsEdit.value = true;
    planForm.value = {
      stationId: row.stationId,
      equipmentCode: row.equipmentCode,
      equipmentName: row.equipmentName,
      installLocation: row.installLocation,
      weeklyDay: row.weeklyDay,
      monthlyDay: row.monthlyDay,
      yearlyMonth: row.yearlyMonth,
      yearlyDay: row.yearlyDay,
      cycleStandards: {
        daily: row.cycles?.daily?.standards?.map(std => ({ ...std })) || [],
        weekly: row.cycles?.weekly?.standards?.map(std => ({ ...std })) || [],
        monthly: row.cycles?.monthly?.standards?.map(std => ({ ...std })) || [],
        yearly: row.cycles?.yearly?.standards?.map(std => ({ ...std })) || []
      },
      cyclePlanIds: {
        daily: row.cycles?.daily?.planIds || [],
        weekly: row.cycles?.weekly?.planIds || [],
        monthly: row.cycles?.monthly?.planIds || [],
        yearly: row.cycles?.yearly?.planIds || []
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
  planForm.value.cycleStandards[cycle].push({ name: '', specification: '' });
};

// 移除保养标准
const removeStandard = (cycle, idx) => {
  if (!planForm.value.cycleStandards[cycle]) return;
  planForm.value.cycleStandards[cycle].splice(idx, 1);
};

// 获取有效标准
const getValidStandards = (list) => {
  return (list || []).filter(
    item => (item?.name && item.name.trim()) || (item?.specification && item.specification.trim())
  );
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
  try {
    await ElMessageBox.confirm(`确认删除设备"${row.equipmentName}"的所有保养计划？`, '删除确认', { type: 'warning' });
    const allPlanIds = [
      ...(row.cycles?.daily?.planIds || []),
      ...(row.cycles?.weekly?.planIds || []),
      ...(row.cycles?.monthly?.planIds || []),
      ...(row.cycles?.yearly?.planIds || [])
    ];
    for (const id of allPlanIds) {
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
      { '场站': '示例场站', '设备编号': 'EQ001', '设备名称': '压缩机', '安装位置': '1号站', '保养周期': '月保养', '保养标准': '润滑检查', '保养规范': '检查润滑油位' }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    ws['!cols'] = [{ wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 18 }, { wch: 30 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '保养计划');
    XLSX.writeFile(wb, '保养计划模板.xlsx');
    ElMessage.success('模板已下载');
  });
};

// 触发导入
const triggerPlanImport = () => {
  planFileInputRef.value?.click();
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

    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;
      const stationName = String(row[0] || '').trim();
      const equipmentCode = String(row[1] || '').trim();
      const equipmentName = String(row[2] || '').trim();
      const installLocation = String(row[3] || '').trim();
      const cycleType = cycleMap[String(row[4] || '').trim()] || 'monthly';
      if (!stationName || !equipmentCode || !equipmentName) continue;

      const key = `${stationName}||${equipmentCode}||${cycleType}`;
      if (!planMap.has(key)) {
        planMap.set(key, { stationName, equipmentCode, equipmentName, installLocation, cycleType, maintenanceStandards: [] });
      }
      const standardName = String(row[5] || '').trim();
      const standardSpec = String(row[6] || '').trim();
      if (standardName || standardSpec) {
        planMap.get(key).maintenanceStandards.push({ name: standardName || '保养标准', specification: standardSpec });
      }
    }

    const plans = Array.from(planMap.values());
    if (plans.length === 0) {
      ElMessage.warning('未找到有效数据');
      return;
    }

    const res = await request.post('/maintenance-plan-library/batch-import', { plans });
    ElMessage.success(`导入完成: 成功${res.success || plans.length}条`);
    loadPlanList();
  } catch (err) {
    ElMessage.error(err.message || '导入失败');
  } finally {
    if (planFileInputRef.value) planFileInputRef.value.value = '';
  }
};

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

const loadWorkRecords = async () => {
  recordLoading.value = true;
  try {
    const params = {
      page: recordPagination.value.page,
      pageSize: recordPagination.value.pageSize,
      stationId: recordFilters.value.stationId || undefined,
      cycleType: recordFilters.value.cycleType || undefined,
      status: recordFilters.value.status || undefined,
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
      submitTime: item.submit_time ? dayjs(item.submit_time).format('YYYY-MM-DD HH:mm:ss') : '-',
      verifierId: item.verifier_id,
      verifierName: item.verifier_name,
      verifyTime: item.verify_time ? dayjs(item.verify_time).format('YYYY-MM-DD HH:mm:ss') : '-',
      verifyResult: item.verify_result,
      verifyRemark: item.verify_remark
    }));
    recordPagination.value.total = res.total || 0;
  } catch (e) {
    console.error('加载保养工作记录失败', e);
  } finally {
    recordLoading.value = false;
  }
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
    remark: ''
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
    await request.put(`/maintenance-work-records/${verifyForm.value.id}/verify`, {
      verifyResult: verifyForm.value.result,
      verifyRemark: verifyForm.value.remark
    });
    ElMessage.success('验收成功');
    verifyDialogVisible.value = false;
    loadWorkRecords();
  } catch (e) {
    ElMessage.error(e.message || '验收失败');
  } finally {
    verifySubmitting.value = false;
  }
};

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
    flex-wrap: wrap;
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

  .cycle-tags {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
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
  .work-page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 0 4px;

    h2 {
      margin: 0;
      font-size: 22px;
      font-weight: 600;
      color: #303133;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;

      .current-date {
        font-size: 14px;
        color: #909399;
      }
    }
  }

  .cycle-cards-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
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
</style>
