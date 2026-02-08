<template>
  <div class="schedule-page">
    <div class="page-header">
      <h2 v-if="showScheduleTable">排班管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showAddDialog" v-if="showScheduleTable">
          <el-icon><Plus /></el-icon>新增排班
        </el-button>
        <el-button type="success" @click="handleImport" v-if="showScheduleTable">
          <el-icon><Download /></el-icon>批量导入
        </el-button>
        <el-button type="info" @click="downloadTemplate" v-if="showScheduleTable">
          <el-icon><Download /></el-icon>下载模板
        </el-button>
        <el-button
          v-if="showScheduleTable && canAddSchedule && selectedSchedules.length > 0"
          type="danger"
          @click="batchDelete"
        >
          <el-icon><Delete /></el-icon>
          批量删除 ({{ selectedSchedules.length }})
        </el-button>
      </div>
    </div>

    <!-- 我的排班日历视图（操作工/站长看自己） -->
    <div v-if="showMyCalendar" class="my-schedule-section">
      <h3>我的排班</h3>
      <div class="calendar-view">
        <div class="calendar-header">
          <span>{{ currentYear }}年{{ currentMonthNum }}月</span>
        </div>
        <div class="calendar-weekdays">
          <div v-for="day in weekDays" :key="day" class="weekday">{{ day }}</div>
        </div>
        <div class="calendar-days">
          <div
            v-for="(day, index) in calendarDays"
            :key="index"
            class="calendar-day"
            :class="{
              'other-month': !day.currentMonth,
              'today': day.isToday,
              'has-schedule': day.hasSchedule,
              'clickable': day.hasSchedule && day.currentMonth
            }"
            :style="getDayColorStyle(day)"
            @click="day.hasSchedule && day.currentMonth ? showMyDayWork(day) : null"
          >
            <div class="day-number">{{ day.date }}</div>
            <div v-if="day.hasSchedule" class="schedule-info">
              <div
                v-for="(item, itemIndex) in day.schedules"
                :key="`my-schedule-${day.date}-${itemIndex}`"
                class="schedule-line"
              >
                {{ formatScheduleLabel(item) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 排班表格视图（管理人员查看） -->
    <div v-if="showScheduleTable" class="schedule-table-section">
      <h3 v-if="showMyCalendar">{{ viewTitle }}</h3>

      <!-- 筛选栏 -->
      <el-card class="filter-card">
      <FilterBar>
        <div class="filter-item">
          <span class="filter-label">排班月份</span>
          <el-date-picker
            v-model="currentMonth"
            type="month"
            placeholder="全部"
            format="YYYY年MM月"
            value-format="YYYY-MM"
            @change="loadSchedule"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">场站</span>
          <FilterSelect
            v-model="filters.stationId"
            placeholder="全部"
            clearable
            filterable
            style="width: 200px"
            @change="applyFilters"
            @clear="applyFilters"
          >
            <el-option label="全部" value="all" />
            <el-option
              v-for="station in stationList"
              :key="station.id"
              :label="station.station_name"
              :value="station.id"
            />
          </FilterSelect>
        </div>
        <div class="filter-item">
          <span class="filter-label">岗位</span>
          <FilterSelect
            v-model="filters.positionName"
            placeholder="全部"
            clearable
            filterable
            style="width: 200px"
            @change="applyFilters"
            @clear="applyFilters"
          >
            <el-option label="全部" value="all" />
            <el-option
              v-for="position in allPositionList"
              :key="position"
              :label="position"
              :value="position"
            />
          </FilterSelect>
        </div>
        <div class="filter-item">
          <span class="filter-label">姓名</span>
          <FilterAutocomplete
            v-model="filters.userName"
            :fetch-suggestions="fetchUserNameSuggestions"
            trigger-on-focus
            placeholder="全部"
            clearable
            style="width: 200px"
            @select="applyFilters"
            @input="applyFilters"
            @keyup.enter="applyFilters"
            @clear="applyFilters"
          />
        </div>
      </FilterBar>
      </el-card>

      <!-- 批量操作按钮 -->
      <TableWrapper>
        <el-table ref="scheduleTableRef" :data="scheduleData" border stripe style="width: 100%" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" v-if="canAddSchedule" />
          <el-table-column prop="stationName" label="场站名称" width="120" />
          <el-table-column prop="positionName" label="岗位" width="100" />
          <el-table-column prop="userName" label="姓名" width="80" >
            <template #default="{ row }">
              <el-button link type="primary" @click="showUserCalendar(row)">
                {{ row.userName }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column
            v-for="day in daysInMonth"
            :key="day"
            :label="formatDayLabel(day)"
            width="60"
            align="center"
          >
            <template #header>
              <div class="day-header">
                <div>{{ day }}</div>
                <div class="weekday-label">{{ getWeekDay(day) }}</div>
              </div>
            </template>
            <template #default="{ row }">
              <div
                class="schedule-cell"
                :class="getCellClass(row, day)"
              >
                {{ getCellDisplay(row, day).text }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" v-if="canAddSchedule">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="editUserSchedule(row)">
                编辑
              </el-button>
              <el-button link type="danger" size="small" @click="deleteOne(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </TableWrapper>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="schedulePagination.page"
          v-model:page-size="schedulePagination.pageSize"
          :total="schedulePagination.total"
          :page-sizes="[5, 10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @current-change="handlePageChange"
          @size-change="handlePageSizeChange"
        />
      </div>
    </div>

    <!-- 新增/编辑排班对话框 -->
    <FormDialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑排班' : '新增排班'"
      width="700px"
      destroy-on-close
    >
      <el-form :model="scheduleForm" label-width="100px" :rules="formRules" ref="formRef">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="场站" prop="stationId">
              <el-select
                v-model="scheduleForm.stationId"
                placeholder="请选择场站"
                style="width: 100%"
                @change="handleStationChange"
              >
                <el-option
                  v-for="station in formStationOptions"
                  :key="station.id"
                  :label="station.station_name"
                  :value="station.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="岗位" prop="positionName">
              <el-select v-model="scheduleForm.positionName" placeholder="请选择岗位" style="width: 100%">
                <el-option
                  v-for="position in positionList"
                  :key="position"
                  :label="position"
                  :value="position"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="选择员工" prop="userId" v-if="!isEdit">
          <el-select
            v-model="scheduleForm.userId"
            placeholder="请输入员工姓名或工号搜索"
            style="width: 100%"
            filterable
            clearable
            reserve-keyword
          >
            <el-option
              v-for="user in userList"
              :key="user.id"
              :label="`${user.real_name} (${user.username})`"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="scheduleDateLabel">
          <div class="schedule-date-body">
            <div class="schedule-year-row">
              <el-select v-model="dialogYear" class="schedule-year-select" style="width: 100%;">
                <el-option
                  v-for="year in yearOptions"
                  :key="year"
                  :label="year"
                  :value="year"
                />
              </el-select>
            </div>
            <div class="month-select">
              <div
                v-for="month in monthOptions"
                :key="month"
                class="month-option"
                :class="{ selected: isDialogMonth(month) }"
                @click="selectDialogMonth(month)"
              >
                {{ month }}{{ monthSuffix }}
              </div>
            </div>
            <div class="weekday-row">
              <div v-for="day in weekDays" :key="day" class="weekday">{{ day }}</div>
            </div>
            <div class="schedule-days-grid">
              <div
                v-for="(item, index) in dialogCalendarDays"
                :key="`day-${index}`"
                class="day-checkbox"
                :class="{
                  placeholder: item.isPlaceholder,
                  selected: !item.isPlaceholder && scheduleForm.selectedDays.includes(item.day),
                  weekend: !item.isPlaceholder && isWeekend(item.day, dialogMonthValue)
                }"
                @click="item.isPlaceholder ? null : toggleDay(item.day)"
              >
                <div v-if="!item.isPlaceholder" class="day-num">{{ item.day }}</div>
              </div>
            </div>
            <div class="quick-select">
              <el-button class="quick-select-button" @click="selectAllWorkdays">{{ selectWorkdaysText }}</el-button>
              <el-button class="quick-select-button" @click="selectAll">{{ selectAllText }}</el-button>
              <el-button class="quick-select-button" @click="clearAll">{{ clearAllText }}</el-button>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button class="schedule-dialog-footer-button" @click="dialogVisible = false">取消</el-button>
        <el-button class="schedule-dialog-footer-button" type="primary" @click="saveSchedule" :loading="saving">
          保存
        </el-button>
      </template>
    </FormDialog>

    <!-- 导入对话框 -->
    <FormDialog
      v-model="importDialogVisible"
      title="导入排班"
      width="500px"
      :confirm-text="'确认导入'"
      :cancel-text="'取消'"
      :confirm-loading="importing"
      @confirm="confirmImport"
    >
      <BaseUpload
        ref="uploadRef"
        :auto-upload="false"
        :limit="1"
        accept=".xlsx,.xls"
        :on-change="handleFileChange"
      >
        <template #trigger>
          <el-button type="primary">选择文件</el-button>
        </template>
        <template #tip>
          <div class="el-upload__tip">
            请上传 .xlsx 或 .xls 格式的排班表文件
          </div>
        </template>
      </BaseUpload>
    </FormDialog>

    <!-- 员工月历对话框 -->
    <FormDialog
      v-model="calendarDialogVisible"
      :title="`${selectedUser?.userName || ''} - ${calendarYear}年${calendarMonthNum}月排班`"
      width="900px"
      destroy-on-close
      :show-confirm="false"
      :show-cancel="false"
    >
      <div v-loading="loadingUserSchedule" class="user-calendar">
        <div class="calendar-header">
          <el-button @click="changeMonth(-1)" :icon="ArrowLeft">上月</el-button>
          <span class="month-title">{{ calendarYear }}年{{ calendarMonthNum }}月</span>
          <el-button @click="changeMonth(1)">
            下月<el-icon class="el-icon--right"><ArrowRight /></el-icon>
          </el-button>
        </div>
        <div class="calendar-weekdays">
          <div v-for="day in weekDays" :key="day" class="weekday">{{ day }}</div>
        </div>
        <div class="calendar-days">
          <div
            v-for="(day, index) in userCalendarDays"
            :key="index"
            class="calendar-day"
            :class="{
              'other-month': !day.currentMonth,
              'today': day.isToday,
              'has-schedule': day.hasSchedule,
              'clickable': day.hasSchedule && day.currentMonth
            }"
            :style="getUserDayColorStyle(day)"
            @click="day.hasSchedule && day.currentMonth ? showDayWork(day) : null"
          >
            <div class="day-number">{{ day.date }}</div>
            <div v-if="day.hasSchedule" class="schedule-badge">
              <div
                v-for="(item, itemIndex) in day.schedules"
                :key="`user-schedule-${day.date}-${itemIndex}`"
                class="schedule-line"
              >
                {{ formatScheduleLabel(item) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </FormDialog>

    <!-- 工作项目侧边栏 -->
    <el-drawer
      v-model="workDrawerVisible"
      :title="`${selectedUser?.userName || ''} - ${selectedDate} 工作概况`"
      size="550px"
      destroy-on-close
    >
      <div v-loading="loadingDayWork" class="work-items">
        <!-- 岗位工作 -->
        <el-collapse v-model="activeCollapseItems">
          <el-collapse-item title="岗位工作" name="positionWork">
            <template #title>
              <div class="collapse-title">
                <el-icon><Briefcase /></el-icon>
                <span>岗位工作</span>
                <el-tag size="small" type="primary" class="count-tag">{{ dayWorkItems.length }}</el-tag>
              </div>
            </template>
            <div v-if="dayWorkItems.length === 0" class="empty-section">暂无岗位工作</div>
            <el-card v-for="item in dayWorkItems" :key="item.jobId" class="work-item-card" shadow="hover">
              <div class="work-item-header">
                <div class="work-name">{{ item.workName }}</div>
                <el-tag :type="item.isCompleted ? 'success' : 'info'" size="small">
                  {{ item.isCompleted ? '已完成' : '未完成' }}
                </el-tag>
              </div>
              <div class="work-item-content">
                <div class="info-row">
                  <span class="label">场站：</span>
                  <span>{{ item.stationName }}</span>
                </div>
                <div class="info-row">
                  <span class="label">岗位：</span>
                  <span>{{ item.positionName }}</span>
                </div>
                <div class="info-row">
                  <span class="label">标准工时：</span>
                  <span>{{ item.standardHours }} 小时</span>
                </div>
                <div class="info-row">
                  <span class="label">实际工时：</span>
                  <span :class="{ 'overtime': item.isOvertime }">
                    {{ item.actualHours }} 小时
                    <el-tag v-if="item.isOvertime" type="danger" size="small">超时</el-tag>
                  </span>
                </div>
                <div class="info-row" v-if="item.progress > 0">
                  <span class="label">进度：</span>
                  <el-progress :percentage="item.progress" :status="item.progress === 100 ? 'success' : ''" />
                </div>
                <div class="info-row" v-if="item.remark">
                  <span class="label">备注：</span>
                  <span>{{ item.remark }}</span>
                </div>
                <div class="info-row" v-if="item.appealStatus">
                  <span class="label">申诉状态：</span>
                  <el-tag :type="item.appealStatus === 'approved' ? 'success' : item.appealStatus === 'rejected' ? 'danger' : 'warning'" size="small">
                    {{ item.appealStatus === 'approved' ? '已批准' : item.appealStatus === 'rejected' ? '已拒绝' : '待审批' }}
                  </el-tag>
                </div>
              </div>
            </el-card>
          </el-collapse-item>

          <!-- 安全自检 -->
          <el-collapse-item title="安全自检" name="safetyInspection">
            <template #title>
              <div class="collapse-title">
                <el-icon><Warning /></el-icon>
                <span>安全自检</span>
                <el-tag size="small" :type="safetyInspectionSummary.total > 0 ? 'success' : 'info'" class="count-tag">
                  {{ safetyInspectionSummary.completed }}/{{ safetyInspectionSummary.total }}
                </el-tag>
              </div>
            </template>
            <div v-if="safetyInspectionGroups.length === 0" class="empty-section">暂无安全自检项目</div>
            <el-card
              v-for="group in safetyInspectionGroups"
              :key="group.name"
              class="inspection-card inspection-group-card"
              shadow="hover"
              @click="openSafetyGroup(group)"
            >
              <div class="inspection-header">
                <div class="inspection-name">{{ group.name }}</div>
                <el-tag :type="group.abnormalCount > 0 ? 'danger' : 'success'" size="small">
                  {{ completedText }} {{ group.completedCount }} / {{ abnormalText }} {{ group.abnormalCount }}
                </el-tag>
              </div>
              <div class="inspection-time" v-if="group.completedTime">完成时间：{{ group.completedTime }}</div>
            </el-card>
          </el-collapse-item>

          <!-- 卫生自检 -->
          <el-collapse-item title="卫生自检" name="hygieneInspection">
            <template #title>
              <div class="collapse-title">
                <el-icon><Brush /></el-icon>
                <span>卫生自检</span>
                <el-tag size="small" :type="hygieneInspectionSummary.total > 0 ? 'success' : 'info'" class="count-tag">
                  {{ hygieneInspectionSummary.completed }}/{{ hygieneInspectionSummary.total }}
                </el-tag>
              </div>
            </template>
            <div v-if="hygieneInspectionGroups.length === 0" class="empty-section">暂无卫生自检项目</div>
            <el-card
              v-for="group in hygieneInspectionGroups"
              :key="group.name"
              class="inspection-card inspection-group-card"
              shadow="hover"
              @click="openHygieneGroup(group)"
            >
              <div class="inspection-header">
                <div class="inspection-name">{{ group.name }}</div>
                <el-tag :type="group.abnormalCount > 0 ? 'danger' : 'success'" size="small">
                  {{ completedText }} {{ group.completedCount }} / {{ abnormalText }} {{ group.abnormalCount }}
                </el-tag>
              </div>
              <div class="inspection-time" v-if="group.completedTime">完成时间：{{ group.completedTime }}</div>
            </el-card>
          </el-collapse-item>

          <!-- 临时任务 -->
          <el-collapse-item title="临时任务" name="temporaryTasks">
            <template #title>
              <div class="collapse-title">
                <el-icon><Operation /></el-icon>
                <span>临时任务</span>
                <el-tag size="small" type="warning" class="count-tag">{{ temporaryTaskItems.length }}</el-tag>
              </div>
            </template>
            <div v-if="temporaryTaskItems.length === 0" class="empty-section">暂无临时任务</div>
            <el-card v-for="item in temporaryTaskItems" :key="item.id" class="task-card" shadow="hover">
              <div class="task-header">
                <div class="task-name">{{ item.taskName }}</div>
                <el-tag :type="getTaskStatusType(item.status)" size="small">
                  {{ getTaskStatusText(item.status) }}
                </el-tag>
              </div>
              <div class="task-content">
                <div class="info-row" v-if="item.description">
                  <span class="label">任务描述：</span>
                  <span>{{ item.description }}</span>
                </div>
                <div class="info-row" v-if="item.assignerName">
                  <span class="label">指派人：</span>
                  <span>{{ item.assignerName }}</span>
                </div>
                <div class="info-row" v-if="item.completedTime">
                  <span class="label">完成时间：</span>
                  <span>{{ item.completedTime }}</span>
                </div>
              </div>
            </el-card>
          </el-collapse-item>

          <!-- 保养计划 -->
          <el-collapse-item title="保养计划" name="maintenanceTasks">
            <template #title>
              <div class="collapse-title">
                <el-icon><Tools /></el-icon>
                <span>保养计划</span>
                <el-tag size="small" :type="maintenanceTaskItems.filter(i => i.isCompleted).length === maintenanceTaskItems.length && maintenanceTaskItems.length > 0 ? 'success' : 'info'" class="count-tag">
                  {{ maintenanceTaskItems.filter(i => i.isCompleted).length }}/{{ maintenanceTaskItems.length }}
                </el-tag>
              </div>
            </template>
            <div v-if="maintenanceTaskItems.length === 0" class="empty-section">暂无保养任务</div>
            <el-card v-for="item in maintenanceTaskItems" :key="item.id" class="maintenance-card" shadow="hover">
              <div class="maintenance-header">
                <div class="maintenance-name">{{ item.equipmentName }}</div>
                <el-tag :type="item.isCompleted ? 'success' : 'info'" size="small">
                  {{ item.isCompleted ? '已完成' : '未完成' }}
                </el-tag>
              </div>
              <div class="maintenance-content">
                <div class="info-row">
                  <span class="label">保养项目：</span>
                  <span>{{ item.maintenanceItem }}</span>
                </div>
                <div class="info-row" v-if="item.cycleType">
                  <span class="label">保养周期：</span>
                  <span>{{ getCycleTypeText(item.cycleType) }}</span>
                </div>
                <div class="info-row" v-if="item.completedTime">
                  <span class="label">完成时间：</span>
                  <span>{{ item.completedTime }}</span>
                </div>
                <div class="info-row" v-if="item.remark">
                  <span class="label">备注：</span>
                  <span>{{ item.remark }}</span>
                </div>
              </div>
            </el-card>
          </el-collapse-item>
        </el-collapse>
      </div>
      </el-drawer>

      <FormDialog
        v-model="safetyDetailVisible"
        :title="safetyDialogTitle"
        width="520px"
        class="inspection-detail-dialog"
        :show-confirm="false"
        :show-cancel="false"
      >
        <div v-if="selectedSafetyGroup">
          <div class="inspection-dialog-title">{{ selectedSafetyGroup.name }}</div>
          <el-card
            v-for="item in selectedSafetyGroup.items"
            :key="item.id"
            class="inspection-card"
            shadow="never"
          >
            <div class="inspection-header">
              <el-tag :type="item.status === 1 ? 'success' : 'danger'" size="small">
                {{ item.status === 1 ? normalText : abnormalText }}
              </el-tag>
            </div>
            <div class="inspection-content">
              <div class="info-row">
                <span class="inspection-line">{{ item.itemName }}：{{ item.itemStandard || '-' }}</span>
              </div>
              <div class="info-row" v-if="item.remark">
                <span class="label">{{ remarkText }}</span>
                <span>{{ item.remark }}</span>
              </div>
            </div>
          </el-card>
        </div>
      </FormDialog>

      <FormDialog
        v-model="hygieneDetailVisible"
        :title="hygieneDialogTitle"
        width="520px"
        class="inspection-detail-dialog"
        :show-confirm="false"
        :show-cancel="false"
      >
        <div v-if="selectedHygieneGroup">
          <div class="inspection-dialog-title">{{ selectedHygieneGroup.name }}</div>
          <el-card
            v-for="item in selectedHygieneGroup.items"
            :key="item.id"
            class="inspection-card"
            shadow="never"
          >
            <div class="inspection-header">
              <el-tag :type="item.status === 1 ? 'success' : 'danger'" size="small">
                {{ item.status === 1 ? normalText : abnormalText }}
              </el-tag>
            </div>
            <div class="inspection-content">
              <div class="info-row">
                <span class="inspection-line">{{ item.itemName }}：{{ item.workRequirements || '-' }}</span>
              </div>
              <div class="info-row" v-if="item.remark">
                <span class="label">{{ remarkText }}</span>
                <span>{{ item.remark }}</span>
              </div>
            </div>
          </el-card>
        </div>
      </FormDialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft, ArrowRight, Briefcase, Warning, Brush, Operation, Tools } from '@element-plus/icons-vue';
import dayjs from 'dayjs';

import { addTemplateInstructionSheet, applyTemplateHeaderStyle } from '@/utils/excelTemplate';
import { createListSuggestionFetcher } from '@/utils/filterAutocomplete';
import request from '@/api/request';
import { getPositionNames } from '@/api/positionJob';
import { useUserStore } from '@/store/modules/user';
import FormDialog from '@/components/system/FormDialog.vue';

const userStore = useUserStore();
const route = useRoute();

const currentMonth = ref(dayjs().format('YYYY-MM'));
const scheduleTableRef = ref(null);
const scheduleData = ref([]);
const fetchUserNameSuggestions = createListSuggestionFetcher(
  () => filteredScheduleData.value,
  (row) => row.userName
);
const filteredScheduleData = ref([]);
const allScheduleData = ref([]); // 存储未筛选的完整数据
const mySchedule = ref(null);
const userList = ref([]);
const stationList = ref([]);
const positionList = ref([]);
const allPositionList = ref([]); // 存储所有岗位列表用于筛选
const isActiveStatus = (status) => status === undefined || status === null || status === '' || status === 'active' || status === 1 || status === '1' || status === true;
const activeStationList = computed(() => stationList.value.filter(station => isActiveStatus(station.status)));
const formStationOptions = computed(() => {
  const selectedId = scheduleForm.value.stationId;
  if (!selectedId) return activeStationList.value;
  const selected = stationList.value.find(station => station.id === selectedId);
  if (selected && !isActiveStatus(selected.status)) {
    return [selected, ...activeStationList.value.filter(station => station.id !== selectedId)];
  }
  return activeStationList.value;
});
const dialogVisible = ref(false);
const importDialogVisible = ref(false);
const isEdit = ref(false);
const saving = ref(false);
const importing = ref(false);
const formRef = ref(null);
const uploadRef = ref(null);
const importFile = ref(null);
const selectedSchedules = ref([]);
const filters = ref({
  stationId: 'all',
  positionName: 'all',
  userName: ''
});
const schedulePagination = ref({
  page: 1,
  pageSize: 5,
  total: 0
});

// 员工月历相关
const calendarDialogVisible = ref(false);
const selectedUser = ref(null);
const calendarMonth = ref(dayjs().format('YYYY-MM'));
const userScheduleData = ref([]);
const loadingUserSchedule = ref(false);

// 工作项目抽屉相关
const workDrawerVisible = ref(false);
const selectedDate = ref('');
const dayWorkItems = ref([]);
const loadingDayWork = ref(false);
const activeCollapseItems = ref(['positionWork', 'safetyInspection', 'hygieneInspection', 'temporaryTasks', 'maintenanceTasks']);
const safetyInspectionItems = ref([]);
const hygieneInspectionItems = ref([]);
const safetyInspectionGroups = ref([]);
const hygieneInspectionGroups = ref([]);
const safetyDetailVisible = ref(false);
const hygieneDetailVisible = ref(false);
const selectedSafetyGroup = ref(null);
const selectedHygieneGroup = ref(null);
const temporaryTaskItems = ref([]);
const maintenanceTaskItems = ref([]);

const scheduleForm = ref({
  stationId: null,
  positionName: '',
  userId: null,
  selectedDays: [],
  month: ''
});

const formRules = {
  stationId: [{ required: true, message: '请选择场站', trigger: 'change' }],
  positionName: [{ required: true, message: '请选择岗位', trigger: 'change' }],
  userId: [{ required: true, message: '请选择员工', trigger: 'change' }]
};

const scheduleDateLabel = '\u6392\u73ed\u65e5\u671f';
const monthSuffix = '\u6708';
const selectWorkdaysText = '\u9009\u62e9\u6240\u6709\u5de5\u4f5c\u65e5';
const selectAllText = '\u5168\u9009';
const clearAllText = '\u6e05\u7a7a';
const weekDays = ['\u4e00', '\u4e8c', '\u4e09', '\u56db', '\u4e94', '\u516d', '\u65e5'];
const completedText = '\u5b8c\u6210';
const abnormalText = '\u5f02\u5e38';
const normalText = '\u6b63\u5e38';
const remarkText = '\u5907\u6ce8\uff1a';
const safetyDialogTitle = '\u5b89\u5168\u81ea\u68c0\u8be6\u60c5';
const hygieneDialogTitle = '\u536b\u751f\u81ea\u68c0\u8be6\u60c5';
const unknownWorkTypeText = '\u672a\u5206\u7c7b\u5de5\u4f5c\u6027\u8d28';
const unknownAreaText = '\u672a\u5206\u7c7b\u8d23\u4efb\u533a';

// 当前年月
const currentYear = computed(() => dayjs(currentMonth.value).year());
const currentMonthNum = computed(() => dayjs(currentMonth.value).month() + 1);

// 员工月历的年月
const calendarYear = computed(() => dayjs(calendarMonth.value).year());
const calendarMonthNum = computed(() => dayjs(calendarMonth.value).month() + 1);

// 当前月份的天数
const monthOptions = Array.from({ length: 12 }, (_, index) => index + 1);

const daysInMonth = computed(() => {
  return dayjs(currentMonth.value).daysInMonth();
});

const dialogMonthValue = computed(() => scheduleForm.value.month || currentMonth.value);
const dialogDaysInMonth = computed(() => dayjs(dialogMonthValue.value).daysInMonth());
const dialogYear = computed({
  get: () => dayjs(dialogMonthValue.value).year(),
  set: (year) => {
    const monthIndex = dayjs(dialogMonthValue.value).month();
    scheduleForm.value.month = dayjs().year(year).month(monthIndex).format('YYYY-MM');
  }
});
const yearOptions = computed(() => {
  const baseYear = dayjs(dialogMonthValue.value).year();
  return Array.from({ length: 7 }, (_, index) => baseYear - 3 + index);
});
const dialogCalendarDays = computed(() => {
  const days = [];
  const firstDay = dayjs(dialogMonthValue.value).startOf('month');
  const dayOfWeek = firstDay.day();
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  for (let i = 0; i < offset; i += 1) {
    days.push({ isPlaceholder: true });
  }
  for (let day = 1; day <= dialogDaysInMonth.value; day += 1) {
    days.push({ day, isPlaceholder: false });
  }
  const remainder = days.length % 7;
  if (remainder) {
    const fill = 7 - remainder;
    for (let i = 0; i < fill; i += 1) {
      days.push({ isPlaceholder: true });
    }
  }
  return days;
});

// 是否可以新增排班（站长、部门经理和部门副经理可以）
const effectiveRole = computed(() => userStore.baseRoleCode || userStore.roleCode || '');
const isManagerRole = computed(() => {
  const role = effectiveRole.value;
  const roleName = userStore.roleName || '';
  return ['admin', 'dev_test', 'station_manager', 'department_manager', 'deputy_manager', 'senior_management'].includes(role)
    || roleName.includes('经理');
});

const canAddSchedule = computed(() => {
  return isManagerRole.value;
});

const viewMode = computed(() => route.meta?.scheduleView || 'my');

// 是否显示我的排班日历（操作岗可能是 operator_1, operator_2 等）
const showMyCalendar = computed(() => viewMode.value === 'my');

const showScheduleTable = computed(() => viewMode.value === 'manage' && canAddSchedule.value);

// 视图标题
const viewTitle = computed(() => {
  return '所有人员排班';
});

// 排班段颜色列表（循环使用）
const scheduleColors = [
  { bg: '#e8f5e9', border: '#4caf50', text: '#2e7d32' },  // 绿色
  { bg: '#e3f2fd', border: '#2196f3', text: '#1565c0' },  // 蓝色
  { bg: '#fff3e0', border: '#ff9800', text: '#e65100' },  // 橙色
  { bg: '#f3e5f5', border: '#9c27b0', text: '#6a1b9a' },  // 紫色
  { bg: '#e0f7fa', border: '#00bcd4', text: '#00838f' },  // 青色
  { bg: '#fce4ec', border: '#e91e63', text: '#c2185b' },  // 粉色
  { bg: '#fffde7', border: '#ffeb3b', text: '#f9a825' },  // 黄色
  { bg: '#efebe9', border: '#795548', text: '#4e342e' },  // 棕色
];

const buildInspectionGroups = (items, getGroupName) => {
  const groupMap = new Map();
  items.forEach(item => {
    const groupName = getGroupName(item);
    if (!groupMap.has(groupName)) {
      groupMap.set(groupName, []);
    }
    groupMap.get(groupName).push(item);
  });

  return Array.from(groupMap.entries()).map(([name, groupItems]) => {
    const completedCount = groupItems.filter(i => i.status === 1).length;
    const abnormalCount = groupItems.filter(i => i.status === 0).length;
    let latestTime = '';
    const times = groupItems
      .map(i => i.checkTime)
      .filter(Boolean)
      .map(time => dayjs(time))
      .filter(time => time.isValid());
    if (times.length > 0) {
      let latest = times[0];
      for (let i = 1; i < times.length; i += 1) {
        if (times[i].isAfter(latest)) {
          latest = times[i];
        }
      }
      latestTime = latest.format('HH:mm');
    }
    return {
      name,
      items: groupItems,
      completedCount,
      abnormalCount,
      completedTime: latestTime
    };
  });
};

const safetyInspectionSummary = computed(() => {
  const total = safetyInspectionItems.value.length;
  const completed = safetyInspectionItems.value.filter(item => item.status === 1).length;
  return { total, completed };
});

const hygieneInspectionSummary = computed(() => {
  const total = hygieneInspectionItems.value.length;
  const completed = hygieneInspectionItems.value.filter(item => item.status === 1).length;
  return { total, completed };
});

// 获取排班的唯一标识（场站+岗位组合）
const getScheduleKey = (schedule) => {
  if (!schedule) return null;
  return `${schedule.stationName ?? ''}_${schedule.positionName ?? ''}`;
};

const normalizeScheduleList = (scheduleInfo) => {
  if (!scheduleInfo) return [];
  const list = Array.isArray(scheduleInfo) ? scheduleInfo : [scheduleInfo];
  return list.map(item => ({
    stationId: item?.stationId ?? item?.station_id ?? item?.station?.id ?? null,
    stationName: item?.stationName ?? item?.station_name ?? item?.station?.station_name ?? '',
    positionName: item?.positionName ?? item?.position_name ?? ''
  }));
};

const buildScheduleListKey = (scheduleInfo) => {
  const list = normalizeScheduleList(scheduleInfo);
  if (list.length === 0) return null;
  const parts = list
    .map(item => getScheduleKey(item))
    .filter(Boolean)
    .sort();
  if (parts.length === 0) return null;
  return parts.join('|');
};

const formatScheduleLabel = (schedule) => {
  if (!schedule) return '';
  const stationName = schedule.stationName ?? '';
  const positionName = schedule.positionName ?? '';
  if (!stationName && !positionName) return '';
  if (!stationName) return positionName;
  if (!positionName) return stationName;
  return `${stationName}-${positionName}`;
};

const openSafetyGroup = (group) => {
  selectedSafetyGroup.value = group;
  safetyDetailVisible.value = true;
};

const openHygieneGroup = (group) => {
  selectedHygieneGroup.value = group;
  hygieneDetailVisible.value = true;
};

// 日历天数计算（周一开始）
const calendarDays = computed(() => {
  const days = [];
  const firstDay = dayjs(currentMonth.value).startOf('month');
  const lastDay = dayjs(currentMonth.value).endOf('month');
  // 周一开始：周一=0, 周二=1, ..., 周日=6
  const startDayOfWeek = firstDay.day() === 0 ? 6 : firstDay.day() - 1;

  // 上月的天
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = firstDay.subtract(i + 1, 'day');
    days.push({
      date: date.date(),
      currentMonth: false,
      isToday: false,
      schedules: [],
      hasSchedule: false,
      colorIndex: -1
    });
  }

  // 先收集本月所有排班信息
  const monthSchedules = [];
  for (let i = 1; i <= lastDay.date(); i++) {
    const dateStr = dayjs(currentMonth.value).date(i).format('YYYY-MM-DD');
    const scheduleInfo = mySchedule.value?.schedules?.[dateStr] ?? null;
    const scheduleList = normalizeScheduleList(scheduleInfo);
    monthSchedules.push(scheduleList);
  }

  // 为每天分配颜色索引
  let currentColorIndex = 0;
  let prevKey = null;

  for (let i = 1; i <= lastDay.date(); i++) {
    const dateStr = dayjs(currentMonth.value).date(i).format('YYYY-MM-DD');
    const isToday = dayjs().format('YYYY-MM-DD') === dateStr;
    const schedules = monthSchedules[i - 1];
    const currentKey = buildScheduleListKey(schedules);

    // 如果当天有排班
    let colorIndex = -1;
    if (schedules.length > 0) {
      // 如果与前一天的场站+岗位不同，切换颜色
      if (prevKey !== null && currentKey !== prevKey) {
        currentColorIndex = (currentColorIndex + 1) % scheduleColors.length;
      }
      colorIndex = currentColorIndex;
      prevKey = currentKey;
    } else {
      // 没有排班时重置，下次有排班可能是新的段
      prevKey = null;
    }

    days.push({
      date: i,
      currentMonth: true,
      isToday,
      schedules,
      hasSchedule: schedules.length > 0,
      colorIndex
    });
  }

  return days;
});

// 员工月历的日历天数（周一开始）
const userCalendarDays = computed(() => {
  const days = [];
  const firstDay = dayjs(calendarMonth.value).startOf('month');
  const lastDay = dayjs(calendarMonth.value).endOf('month');
  // 周一开始：周一=0, 周二=1, ..., 周日=6
  const startDayOfWeek = firstDay.day() === 0 ? 6 : firstDay.day() - 1;

  // 上月的天
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = firstDay.subtract(i + 1, 'day');
    days.push({
      date: date.date(),
      currentMonth: false,
      isToday: false,
      schedules: [],
      hasSchedule: false,
      colorIndex: -1
    });
  }

  // 先收集本月所有排班信息
  const monthSchedules = [];
  for (let i = 1; i <= lastDay.date(); i++) {
    const dateStr = dayjs(calendarMonth.value).date(i).format('YYYY-MM-DD');
    const scheduleList = [];

    if (userScheduleData.value.length > 0) {
      for (const schedule of userScheduleData.value) {
        if (schedule.schedules && schedule.schedules[dateStr]) {
          scheduleList.push({
            stationName: schedule.stationName ?? '',
            positionName: schedule.positionName ?? ''
          });
        }
      }
    }

    monthSchedules.push(scheduleList);
  }

  // 为每天分配颜色索引
  let currentColorIndex = 0;
  let prevKey = null;

  for (let i = 1; i <= lastDay.date(); i++) {
    const dateStr = dayjs(calendarMonth.value).date(i).format('YYYY-MM-DD');
    const isToday = dayjs().format('YYYY-MM-DD') === dateStr;
    const schedules = monthSchedules[i - 1];
    const currentKey = buildScheduleListKey(schedules);

    // 如果当天有排班
    let colorIndex = -1;
    if (schedules.length > 0) {
      // 如果与前一天的场站+岗位不同，切换颜色
      if (prevKey !== null && currentKey !== prevKey) {
        currentColorIndex = (currentColorIndex + 1) % scheduleColors.length;
      }
      colorIndex = currentColorIndex;
      prevKey = currentKey;
    } else {
      // 没有排班时重置，下次有排班可能是新的段
      prevKey = null;
    }

    days.push({
      date: i,
      dateStr,
      currentMonth: true,
      isToday,
      schedules,
      hasSchedule: schedules.length > 0,
      colorIndex
    });
  }

  return days;
});

// 获取日期的颜色样式
const getDayColorStyle = (day) => {
  if (day.colorIndex < 0 || !day.hasSchedule) return {};
  const color = scheduleColors[day.colorIndex];
  return {
    backgroundColor: color.bg,
    borderColor: color.border,
    '--schedule-text-color': color.text
  };
};

// 获取员工月历日期的颜色样式
const getUserDayColorStyle = (day) => {
  if (day.colorIndex < 0 || !day.hasSchedule) return {};
  const color = scheduleColors[day.colorIndex];
  return {
    backgroundColor: color.bg,
    borderColor: color.border,
    '--schedule-text-color': color.text
  };
};

// 构建用户每天排班情况的映射（用于判断某用户当天是否在任何场站/岗位有排班）
const userDayScheduleCountMap = computed(() => {
  const map = new Map(); // Map<userId, Map<dateKey, number>>

  for (const item of allScheduleData.value) {
    if (!item.userId || !item.schedules) continue;

    if (!map.has(item.userId)) {
      map.set(item.userId, new Map());
    }

    const userMap = map.get(item.userId);
    for (const dateKey in item.schedules) {
      if (item.schedules[dateKey]) {
        const currentCount = userMap.get(dateKey) ?? 0;
        userMap.set(dateKey, currentCount + 1);
      }
    }
  }

  return map;
});

const getUserScheduleCount = (userId, dateKey) => {
  const userMap = userDayScheduleCountMap.value.get(userId);
  return userMap?.get(dateKey) ?? 0;
};

// 检查用户当天是否在任何场站/岗位有排班
const hasAnySchedule = (userId, dateKey) => {
  return getUserScheduleCount(userId, dateKey) > 0;
};

// 获取单元格显示内容和样式
const getCellDisplay = (row, day) => {
  const dateKey = formatDateKey(day);
  const hasCurrentSchedule = row.schedules && row.schedules[dateKey];

  if (hasCurrentSchedule) {
    const scheduleCount = getUserScheduleCount(row.userId, dateKey);
    if (scheduleCount > 1) {
      return { text: '班', type: 'multi-work' };
    }
    return { text: '班', type: 'work' };
  }

  // 当前场站/岗位没有排班，检查是否在其他地方有排班
  const hasOtherSchedule = hasAnySchedule(row.userId, dateKey);

  if (hasOtherSchedule) {
    // 在其他场站/岗位有排班
    return { text: '/', type: 'other' };
  }

  // 当天完全没有排班
  return { text: '休', type: 'rest' };
};

const getCellClass = (row, day) => {
  const display = getCellDisplay(row, day);
  return {
    'has-work': display.type === 'work',
    'multi-work': display.type === 'multi-work',
    'rest': display.type === 'rest',
    'other': display.type === 'other'
  };
};

// 格式化日期标签
const formatDayLabel = (day) => String(day);

// 格式化日期键
const formatDateKey = (day, monthValue = currentMonth.value) => {
  return dayjs(monthValue).date(day).format('YYYY-MM-DD');
};

// 获取星期几（周一开始）
const getWeekDay = (day, monthValue = currentMonth.value) => {
  const date = dayjs(monthValue).date(day);
  const dayOfWeek = date.day(); // 0=周日, 1=周一, ..., 6=周六
  // 转换为周一开始的索引：周一=0, 周二=1, ..., 周日=6
  const mondayStartIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  return weekDays[mondayStartIndex];
};

// 是否周末
const isWeekend = (day, monthValue = currentMonth.value) => {
  const date = dayjs(monthValue).date(day);
  return date.day() === 0 || date.day() === 6;
};

const isDialogMonth = (month) => {
  return dayjs(dialogMonthValue.value).month() + 1 === month;
};

const selectDialogMonth = (month) => {
  const year = dayjs(dialogMonthValue.value).year();
  const nextMonth = dayjs().year(year).month(month - 1).format('YYYY-MM');
  if (currentMonth.value !== nextMonth) {
    currentMonth.value = nextMonth;
  }
  scheduleForm.value.month = nextMonth;
  scheduleForm.value.selectedDays = [];
};

// 加载排班数据
const loadSchedule = async () => {
  try {
    const [year, month] = currentMonth.value.split('-');
    const params = { year, month };
    const roleCode = effectiveRole.value;
    if (['operator', 'maintenance', 'station_manager'].includes(roleCode) && userStore.currentStationId && !isManagerRole.value) {
      params.stationId = userStore.currentStationId;
    }

    const res = await request.get('/schedules', { params });

    // 处理为表格数据格式
    const list = res.schedules || [];
    allScheduleData.value = list.map(item => ({
      id: item.id,
      userId: item.user_id,
      userName: item.user_name || item.user?.real_name || '',
      stationId: item.station_id || item.station?.id || null,
      stationName: item.station?.station_name || '',
      positionName: item.position_name || '',
      schedules: item.schedules || {}
    }));

    // 应用筛选
    applyFilters();

    // 加载所有岗位列表用于筛选
    loadAllPositions();
  } catch (e) {
    
  }
};

// 加载我的排班
const loadMySchedule = async () => {
  if (!showMyCalendar.value) return;

  try {
    const [year, month] = currentMonth.value.split('-');
    const res = await request.get('/schedules/my', { params: { year, month } });
    mySchedule.value = res;
  } catch (e) {
    
  }
};

// 加载用户列表（只加载站长和操作岗）
const loadUsers = async () => {
  try {
    const params = {
      pageSize: 200,
      roleCode: 'station_manager,operator' // 只显示站长和操作岗
    };


    const res = await request.get('/users', { params });
    userList.value = res.list || [];
  } catch (e) {
    
  }
};

// 加载场站列表
const loadStations = async () => {
  try {
    const res = await request.get('/stations/all');
    stationList.value = res.list || res || [];
  } catch (e) {
    
  }
};

// 加载岗位列表
const loadPositions = async (stationId) => {
  try {
    const params = stationId ? { stationId } : {};
    const res = await getPositionNames(params);
    // 响应拦截器已经返回了data，不需要再访问res.data
    const positions = res || [];
    // 在岗位列表最前面添加"站长"选项（如果还没有的话）
    if (!positions.includes('站长')) {
      positionList.value = ['站长', ...positions];
    } else {
      positionList.value = positions;
    }
  } catch (e) {
    
    positionList.value = ['站长']; // 即使加载失败，也保留"站长"选项
  }
};

// 加载所有岗位列表用于筛选
const loadAllPositions = async () => {
  try {
    const res = await getPositionNames();
    const positions = res || [];
    // 收集所有已有的岗位，并添加"站长"
    const allPositions = new Set(['站长', ...positions]);
    // 从当前排班数据中提取岗位
    allScheduleData.value.forEach(item => {
      if (item.positionName) {
        allPositions.add(item.positionName);
      }
    });
    allPositionList.value = Array.from(allPositions).sort();
  } catch (e) {
    
    // 即使加载失败，也从当前数据中提取岗位
    const positions = new Set(['站长']);
    allScheduleData.value.forEach(item => {
      if (item.positionName) {
        positions.add(item.positionName);
      }
    });
    allPositionList.value = Array.from(positions).sort();
  }
};

const clearScheduleSelection = () => {
  selectedSchedules.value = [];
  scheduleTableRef.value?.clearSelection?.();
};

const updateSchedulePage = () => {
  const total = filteredScheduleData.value.length;
  schedulePagination.value.total = total;
  const pageSize = schedulePagination.value.pageSize;
  const maxPage = Math.max(1, Math.ceil(total / pageSize));
  if (schedulePagination.value.page > maxPage) {
    schedulePagination.value.page = maxPage;
  }
  const start = (schedulePagination.value.page - 1) * pageSize;
  const end = start + pageSize;
  scheduleData.value = filteredScheduleData.value.slice(start, end);
  clearScheduleSelection();
};

const shouldResetPage = (value) => {
  if (value === false) return false;
  return true;
};

// 应用筛选
const applyFilters = (resetPage = true) => {
  let filtered = [...allScheduleData.value];

  // 按场站筛选
  if (filters.value.stationId && filters.value.stationId !== 'all') {
    filtered = filtered.filter(item => item.stationId === filters.value.stationId);
  }

  // 按岗位筛选
  if (filters.value.positionName && filters.value.positionName !== 'all') {
    filtered = filtered.filter(item => item.positionName === filters.value.positionName);
  }

  // 按姓名筛选
  if (filters.value.userName) {
    const keyword = filters.value.userName.toLowerCase();
    filtered = filtered.filter(item =>
      item.userName?.toLowerCase().includes(keyword)
    );
  }

  filteredScheduleData.value = filtered;
  if (shouldResetPage(resetPage)) {
    schedulePagination.value.page = 1;
  }
  updateSchedulePage();
};

const handlePageChange = (page) => {
  schedulePagination.value.page = page;
  updateSchedulePage();
};

const handlePageSizeChange = (size) => {
  schedulePagination.value.pageSize = size;
  schedulePagination.value.page = 1;
  updateSchedulePage();
};

// 重置筛选
const resetFilters = () => {
  filters.value = {
    stationId: 'all',
    positionName: 'all',
    userName: ''
  };
  applyFilters();
};

// 处理场站改变事件
const handleStationChange = (stationId) => {
  // 清空岗位选择
  scheduleForm.value.positionName = '';
  // 重新加载该场站的岗位列表
  if (stationId) {
    loadPositions(stationId);
  } else {
    positionList.value = [];
  }
};

// 显示新增对话框
const showAddDialog = () => {
  isEdit.value = false;
  scheduleForm.value = {
    stationId: userStore.currentStationId,
    positionName: '',
    userId: null,
    selectedDays: [],
    month: currentMonth.value
  };
  dialogVisible.value = true;
  // 清空岗位列表，等待用户选择场站后再加载
  positionList.value = [];
  // 如果有默认场站，立即加载该场站的岗位列表
  if (userStore.currentStationId) {
    loadPositions(userStore.currentStationId);
  }
};

// 编辑用户排班
const editUserSchedule = (row) => {
  isEdit.value = true;
  const selectedDays = [];
  if (row.schedules) {
    Object.keys(row.schedules).forEach(dateStr => {
      if (row.schedules[dateStr]) {
        const day = dayjs(dateStr).date();
        selectedDays.push(day);
      }
    });
  }
  scheduleForm.value = {
    id: row.id,
    stationId: row.stationId,
    positionName: row.positionName,
    userId: row.userId,
    userName: row.userName,
    selectedDays,
    month: currentMonth.value
  };
  dialogVisible.value = true;
  // 清空岗位列表
  positionList.value = [];
  // 立即加载该场站的岗位列表
  if (row.stationId) {
    loadPositions(row.stationId);
  }
};

// 切换日期选择
const toggleDay = (day) => {
  const index = scheduleForm.value.selectedDays.indexOf(day);
  if (index > -1) {
    scheduleForm.value.selectedDays.splice(index, 1);
  } else {
    scheduleForm.value.selectedDays.push(day);
  }
};

// 选择所有工作日
const selectAllWorkdays = () => {
  scheduleForm.value.selectedDays = [];
  for (let day = 1; day <= dialogDaysInMonth.value; day++) {
    if (!isWeekend(day, dialogMonthValue.value)) {
      scheduleForm.value.selectedDays.push(day);
    }
  }
};

// 全选
const selectAll = () => {
  scheduleForm.value.selectedDays = [];
  for (let day = 1; day <= dialogDaysInMonth.value; day++) {
    scheduleForm.value.selectedDays.push(day);
  }
};

// 清空
const clearAll = () => {
  scheduleForm.value.selectedDays = [];
};

// 保存排班
const saveSchedule = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    if (scheduleForm.value.selectedDays.length === 0) {
      ElMessage.warning('请至少选择一个排班日期');
      return;
    }

    saving.value = true;
    try {
      const [year, month] = dialogMonthValue.value.split('-');

      // 构建排班数据
      const schedules = {};
      scheduleForm.value.selectedDays.forEach(day => {
        const dateStr = formatDateKey(day, dialogMonthValue.value);
        schedules[dateStr] = true;
      });

      // 获取用户信息
      const user = userList.value.find(u => u.id === scheduleForm.value.userId);

      await request.post('/schedules', {
        stationId: scheduleForm.value.stationId,
        userId: scheduleForm.value.userId,
        userName: user?.real_name || scheduleForm.value.userName,
        positionName: scheduleForm.value.positionName,
        year: parseInt(year),
        month: parseInt(month),
        schedules
      });

      ElMessage.success('保存成功');
      dialogVisible.value = false;
      loadSchedule();
    } catch (e) {
      
      ElMessage.error('保存失败');
    } finally {
      saving.value = false;
    }
  });
};

// 导入处理
const handleImport = () => {
  importDialogVisible.value = true;
};

const handleFileChange = (file) => {
  importFile.value = file.raw;
};

const normalizeText = (value) => (value || '').toString().trim();

const parseMonthValue = (value) => {
  if (!value) return currentMonth.value;
  if (value instanceof Date) {
    return dayjs(value).format('YYYY-MM');
  }
  const text = normalizeText(value);
  if (/^\d{4}-\d{1,2}$/.test(text)) {
    return dayjs(text).format('YYYY-MM');
  }
  if (/^\d{1,2}$/.test(text)) {
    const year = dayjs(currentMonth.value).year();
    return dayjs().year(year).month(parseInt(text, 10) - 1).format('YYYY-MM');
  }
  const parsed = dayjs(text);
  return parsed.isValid() ? parsed.format('YYYY-MM') : currentMonth.value;
};

const isWorkCell = (value) => {
  if (value === null || value === undefined) return false;
  const text = normalizeText(value);
  if (!text) return false;
  return ['班', '上班', '是', '1', '√', 'Y', 'y', 'true', 'TRUE'].includes(text);
};

const loadXlsx = async () => {
  const mod = await import('xlsx');
  return mod;
};

const downloadTemplate = async () => {
  const header = ['月份(YYYY-MM)', '场站', '岗位', '员工(姓名或账号)'];
  const dayHeaders = Array.from({ length: 31 }, (_, index) => (index + 1).toString());
  const templateData = [
    header.concat(dayHeaders),
    ['2025-01', '示例场站', '操作岗', '张三', '班', '班', '休', '班', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']
  ];

  const XLSX = await loadXlsx();
  const ws = XLSX.utils.aoa_to_sheet(templateData);
  if (ws['A2']) {
    ws['A2'].t = 's';
    ws['A2'].z = '@';
  }
  applyTemplateHeaderStyle(XLSX, ws, 1);
  if (ws['!cols']?.[0]) {
    ws['!cols'][0].z = '@';
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '排班模板');

  const instructionData = [
    ['月份(YYYY-MM)', '必填，格式 YYYY-MM；也可填 1-12 表示当年月份。'],
    ['场站', '必填，场站名称，与系统一致。'],
    ['岗位', '必填，岗位名称。'],
    ['员工(姓名或账号)', '必填，姓名或登录账号。'],
    ['日期列(1-31)', '填“班/上班/是/1/√”表示上班，空或“休”表示休息。']
  ];
  addTemplateInstructionSheet(XLSX, wb, instructionData);

  XLSX.writeFile(wb, '排班表导入模板.xlsx');
  ElMessage.success('模板已下载');
};

const confirmImport = async () => {
  if (!importFile.value) {
    ElMessage.warning('请选择文件');
    return;
  }

  importing.value = true;
  try {
    const data = await importFile.value.arrayBuffer();
    const XLSX = await loadXlsx();
    const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
    const dataRows = rows.slice(1).filter(row => row.length > 0 && normalizeText(row[1]));

    if (dataRows.length === 0) {
      ElMessage.warning('没有找到有效数据');
      return;
    }

    const stationMap = new Map(
      activeStationList.value.map(s => [normalizeText(s.station_name || s.stationName), s])
    );
    const userMap = new Map(
      userList.value.map(u => [
        normalizeText(u.real_name),
        u
      ])
    );
    userList.value.forEach(u => {
      userMap.set(normalizeText(u.username), u);
    });

    const importedMonths = [];
    const importedMonthSet = new Set();
    const grouped = new Map();
    const errors = [];

    dataRows.forEach((row, index) => {
      const rowIndex = index + 2;
      const monthValue = parseMonthValue(row[0]);

      if (!importedMonthSet.has(monthValue)) {
        importedMonthSet.add(monthValue);
        importedMonths.push(monthValue);
      }
      const stationName = normalizeText(row[1]);
      const positionName = normalizeText(row[2]);
      const userText = normalizeText(row[3]);

      const station = stationMap.get(stationName);
      const user = userMap.get(userText);

      if (!station) {
        errors.push(`第 ${rowIndex} 行：场站不存在（${stationName}）`);
        return;
      }
      if (!positionName) {
        errors.push(`第 ${rowIndex} 行：岗位不能为空`);
        return;
      }
      if (!user) {
        errors.push(`第 ${rowIndex} 行：员工不存在（${userText}）`);
        return;
      }

      const schedules = {};
      const maxDay = dayjs(monthValue).daysInMonth();
      for (let day = 1; day <= 31; day++) {
        if (day > maxDay) continue;
        const cellValue = row[3 + day];
        if (isWorkCell(cellValue)) {
          const dateKey = formatDateKey(day, monthValue);
          schedules[dateKey] = true;
        }
      }

      const groupKey = `${station.id}-${monthValue}`;
      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, {
          stationId: station.id,
          year: parseInt(monthValue.split('-')[0], 10),
          month: parseInt(monthValue.split('-')[1], 10),
          scheduleList: []
        });
      }
      grouped.get(groupKey).scheduleList.push({
        userId: user.id,
        userName: user.real_name,
        positionName,
        schedules
      });
    });

    if (errors.length > 0) {
      ElMessage.error(errors.slice(0, 3).join('；') + (errors.length > 3 ? '...' : ''));
      return;
    }

    for (const batch of grouped.values()) {
      await request.post('/schedules/batch', batch);
    }

    let message = `导入成功：${dataRows.length} 条`;
    if (importedMonths.length > 1) {
      message = `${message}（月份：${importedMonths.join('、')}）`;
    }

    const hasCurrentMonth = importedMonthSet.has(currentMonth.value);
    if (!hasCurrentMonth && importedMonths.length > 0) {
      currentMonth.value = importedMonths[0];
      message = `${message}，已切换到 ${importedMonths[0]}`;
    } else {
      loadSchedule();
    }

    ElMessage.success(message);
    importDialogVisible.value = false;
    importFile.value = null;
  } catch (e) {
    
    ElMessage.error('导入失败');
  } finally {
    importing.value = false;
  }
};

const handleSelectionChange = (selection) => {
  selectedSchedules.value = selection;
};

// 删除单个排班
const deleteOne = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除该排班记录吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    });

    await request.delete(`/schedules/${row.id}`);
    ElMessage.success('删除成功');
    loadSchedule();
  } catch (e) {
    if (e !== 'cancel') {
      
      ElMessage.error('删除失败');
    }
  }
};

// 批量删除排班
const batchDelete = async () => {
  if (selectedSchedules.value.length === 0) {
    ElMessage.warning('请选择要删除的排班记录');
    return;
  }

  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedSchedules.value.length} 条排班记录吗？`, '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    });

    const ids = selectedSchedules.value.map(item => item.id);
    await request.post('/schedules/batch-delete', { ids });
    ElMessage.success('批量删除成功');
    selectedSchedules.value = [];
    loadSchedule();
  } catch (e) {
    if (e !== 'cancel') {
      
      ElMessage.error('批量删除失败');
    }
  }
};

// 显示员工月历
const showUserCalendar = async (row) => {
  selectedUser.value = row;
  calendarMonth.value = currentMonth.value;
  calendarDialogVisible.value = true;
  await loadUserSchedule();
};

// 加载员工排班数据
const loadUserSchedule = async () => {
  if (!selectedUser.value) return;

  loadingUserSchedule.value = true;
  try {
    const [year, month] = calendarMonth.value.split('-');
    // 不传 stationId，查询该用户在所有场站的排班
    const res = await request.get('/schedules', {
      params: {
        year,
        month,
        userId: selectedUser.value.userId
      }
    });

    // 筛选出该用户的排班数据
    const userSchedules = (res.schedules || []).filter(
      s => s.user_id === selectedUser.value.userId
    );

    userScheduleData.value = userSchedules.map(item => ({
      id: item.id,
      stationName: item.station?.station_name || '',
      positionName: item.position_name || '',
      schedules: item.schedules || {}
    }));
  } catch (error) {
    
    ElMessage.error('加载员工排班失败');
  } finally {
    loadingUserSchedule.value = false;
  }
};

// 切换月份
const changeMonth = async (offset) => {
  calendarMonth.value = dayjs(calendarMonth.value).add(offset, 'month').format('YYYY-MM');
  await loadUserSchedule();
};

// 显示某天的工作项目（管理员查看其他员工）
const showDayWork = async (day) => {
  selectedDate.value = day.dateStr;
  workDrawerVisible.value = true;
  await loadDayWorkItems(day.dateStr);
};

// 显示我的某天的工作项目（员工查看自己）
const showMyDayWork = async (day) => {
  const dateStr = dayjs(currentMonth.value).date(day.date).format('YYYY-MM-DD');
  selectedDate.value = dateStr;
  const scheduleList = normalizeScheduleList(day.schedules);
  const primarySchedule = scheduleList[0] ?? null;

  // 设置选中用户为当前用户
  selectedUser.value = {
    userId: userStore.userId,
    userName: userStore.realName || userStore.username,
    stationId: primarySchedule?.stationId ?? userStore.currentStationId
  };

  workDrawerVisible.value = true;
  await loadMyDayWorkItems(dateStr, scheduleList);
};

// 加载某天的工作项目
const loadDayWorkItems = async (dateStr) => {
  if (!selectedUser.value) return;

  loadingDayWork.value = true;
  // 清空所有数据
  dayWorkItems.value = [];
  safetyInspectionItems.value = [];
  hygieneInspectionItems.value = [];
  temporaryTaskItems.value = [];
  maintenanceTaskItems.value = [];
  safetyInspectionGroups.value = [];
  hygieneInspectionGroups.value = [];

  try {
    const year = dayjs(dateStr).year();
    const month = dayjs(dateStr).month() + 1;

    // 获取该月的排班（不传 stationId，查询该用户在所有场站的排班）
    const scheduleRes = await request.get('/schedules', {
      params: {
        year,
        month,
        userId: selectedUser.value.userId
      }
    });

    // 筛选出该用户该天的排班
    const userSchedules = (scheduleRes.schedules || []).filter(
      s => s.user_id === selectedUser.value.userId && s.schedules && s.schedules[dateStr]
    );

    if (userSchedules.length === 0) {
      dayWorkItems.value = [];
      return;
    }

    // 获取工作项目
    const workItems = [];
    let primaryStationId = null;

    for (const schedule of userSchedules) {
      const stationId = schedule.station_id;
      const positionName = schedule.position_name;

      // 记录第一个场站ID用于加载其他数据
      if (!primaryStationId) {
        primaryStationId = stationId;
      }

      // 获取岗位工作项目
      const positionJobsRes = await request.get('/position-jobs', {
        params: {
          stationId,
          positionName
        }
      });

      const positionJobs = positionJobsRes.list || positionJobsRes || [];

      // 获取该用户当天的工作登记
      const workLogRes = await request.get('/position-work-logs/user', {
        params: {
          userId: selectedUser.value.userId,
          startDate: dateStr,
          endDate: dateStr,
          stationId,
          positionName
        }
      });

      const workLogs = workLogRes.list || workLogRes || [];

      // 为每个岗位工作项目匹配工作登记
      for (const job of positionJobs) {
        const workLog = workLogs.find(
          log => log.position_job_id === job.id && log.work_date === dateStr
        );

        workItems.push({
          jobId: job.id,
          workName: job.job_name,
          stationName: schedule.station?.station_name || '',
          positionName: schedule.position_name,
          standardHours: job.standard_hours || 0,
          actualHours: workLog?.actual_hours || 0,
          isCompleted: workLog?.is_completed || 0,
          progress: workLog?.progress || 0,
          remark: workLog?.remark || '',
          isOvertime: workLog?.is_overtime || 0,
          appealStatus: workLog?.appeal_status || null
        });
      }
    }

    dayWorkItems.value = workItems;

    // 加载其他数据（安全自检、卫生自检、临时任务、保养任务）
    if (primaryStationId) {
      await loadAllDayWorkData(dateStr, selectedUser.value.userId, primaryStationId);
    }
  } catch (error) {
    ElMessage.error('加载工作项目失败');
    dayWorkItems.value = [];
  } finally {
    loadingDayWork.value = false;
  }
};

// 加载我的某天的工作项目
const loadMyDayWorkItems = async (dateStr, schedules) => {
  // 清空所有数据
  dayWorkItems.value = [];
  safetyInspectionItems.value = [];
  hygieneInspectionItems.value = [];
  safetyInspectionGroups.value = [];
  hygieneInspectionGroups.value = [];
  temporaryTaskItems.value = [];
  maintenanceTaskItems.value = [];

  const scheduleList = normalizeScheduleList(schedules);
  if (scheduleList.length === 0) {
    return;
  }

  loadingDayWork.value = true;
  try {
    const workGroups = await Promise.all(scheduleList.map(async (schedule) => {
      const stationId = schedule.stationId ?? userStore.currentStationId;
      const positionName = schedule.positionName;
      if (!stationId || !positionName) {
        return [];
      }

      const [positionJobsRes, workLogRes] = await Promise.all([
        request.get('/position-jobs', {
          params: {
            stationId,
            positionName
          }
        }),
        request.get('/position-work-logs', {
          params: {
            startDate: dateStr,
            endDate: dateStr,
            stationId,
            positionName
          }
        })
      ]);

      const positionJobs = positionJobsRes.list ?? positionJobsRes ?? [];
      const workLogs = workLogRes.list ?? workLogRes ?? [];

      return positionJobs.map(job => {
        const workLog = workLogs.find(
          log => log.position_job_id === job.id && log.work_date === dateStr
        );

        return {
          jobId: job.id,
          workName: job.job_name,
          stationName: schedule.stationName ?? '',
          positionName: schedule.positionName ?? '',
          standardHours: job.standard_hours ?? 0,
          actualHours: workLog?.actual_hours ?? 0,
          isCompleted: workLog?.is_completed ?? 0,
          progress: workLog?.progress ?? 0,
          remark: workLog?.remark ?? '',
          isOvertime: workLog?.is_overtime ?? 0,
          appealStatus: workLog?.appeal_status ?? null
        };
      });
    }));

    const workItems = [];
    workGroups.forEach(group => {
      if (group && group.length > 0) {
        workItems.push(...group);
      }
    });

    dayWorkItems.value = workItems;

    const primaryStationId = scheduleList.find(item => item.stationId)?.stationId
      ?? userStore.currentStationId
      ?? null;
    if (primaryStationId) {
      await loadAllDayWorkData(dateStr, userStore.userId, primaryStationId);
    }
  } catch (error) {
    ElMessage.error('加载工作项目失败');
    dayWorkItems.value = [];
  } finally {
    loadingDayWork.value = false;
  }
};

// 辅助方法：获取任务状态类型
const getTaskStatusType = (status) => {
  const statusMap = {
    'pending': 'info',
    'in_progress': 'warning',
    'completed': 'success',
    'cancelled': 'danger'
  };
  return statusMap[status] || 'info';
};

// 辅助方法：获取任务状态文本
const getTaskStatusText = (status) => {
  const statusMap = {
    'pending': '待处理',
    'in_progress': '进行中',
    'completed': '已完成',
    'cancelled': '已取消'
  };
  return statusMap[status] || '未知';
};

// 辅助方法：获取保养周期类型文本
const getCycleTypeText = (cycleType) => {
  const cycleMap = {
    'daily': '每日',
    'weekly': '每周',
    'monthly': '每月',
    'yearly': '每年'
  };
  return cycleMap[cycleType] || cycleType;
};

// 加载安全自检数据
const loadSafetyInspectionItems = async (dateStr, userId, stationId) => {
  try {
    let inspections = [];
    if (userId === userStore.userId) {
      const inspectionRes = await request.get('/self-inspections/my', {
        params: {
          inspectionType: 'safety',
          startDate: dateStr,
          endDate: dateStr
        }
      });
      inspections = inspectionRes || [];
    } else {
      const inspectionRes = await request.get('/self-inspections', {
        params: {
          inspectionType: 'safety',
          startDate: dateStr,
          endDate: dateStr,
          fillerId: userId,
          stationId
        }
      });
      inspections = inspectionRes.list || inspectionRes || [];
    }

    if (stationId) {
      const stationValue = Number(stationId);
      inspections = inspections.filter(item => {
        const itemStationId = item.station_id ?? item.station?.id ?? null;
        return itemStationId === stationValue;
      });
    }

    // 如果有自检记录，解析检查结果
    if (inspections.length > 0) {
      const inspection = inspections[0];
      // 解析检查结果JSON
      let checkResults = inspection.inspection_items
        || inspection.inspectionItems
        || inspection.check_results
        || inspection.checkResults
        || [];
      if (typeof checkResults === 'string') {
        try {
          checkResults = JSON.parse(checkResults);
        } catch (e) {
          checkResults = [];
        }
      }

      // 转换为显示格式
      safetyInspectionItems.value = checkResults.map((item, index) => {
        const statusValue = item.status ?? item.result ?? item.checked ?? item.checkStatus;
        const normalizedStatus = statusValue === 0 || statusValue === '0' ? 0 : 1;
        return {
          id: item.item_id || item.itemId || index,
          itemName: item.item_name || item.itemName || `检查项${index + 1}`,
          isChecked: statusValue !== null && statusValue !== undefined,
          status: normalizedStatus,
          result: normalizedStatus === 1 ? 'normal' : 'abnormal',
          workTypeName: item.workTypeName || item.work_type_name || item.workType || '',
          itemStandard: item.itemStandard || item.item_standard || item.workRequirements || item.work_requirements || '',
          checkTime: inspection.submit_time
            || inspection.submitTime
            || inspection.created_at
            || inspection.createdAt
            || inspection.inspection_date
            || '',
          remark: item.remark || ''
        };
      });
      safetyInspectionGroups.value = buildInspectionGroups(
        safetyInspectionItems.value,
        item => item.workTypeName || unknownWorkTypeText
      );
    } else {
      safetyInspectionItems.value = [];
      safetyInspectionGroups.value = [];
    }
  } catch (error) {
    safetyInspectionItems.value = [];
    safetyInspectionGroups.value = [];
  }
};

// 加载卫生自检数据
const loadHygieneInspectionItems = async (dateStr, userId, stationId) => {
  try {
    let inspections = [];
    if (userId === userStore.userId) {
      const inspectionRes = await request.get('/self-inspections/my', {
        params: {
          inspectionType: 'hygiene',
          startDate: dateStr,
          endDate: dateStr
        }
      });
      inspections = inspectionRes || [];
    } else {
      const inspectionRes = await request.get('/self-inspections', {
        params: {
          inspectionType: 'hygiene',
          startDate: dateStr,
          endDate: dateStr,
          fillerId: userId,
          stationId
        }
      });
      inspections = inspectionRes.list || inspectionRes || [];
    }

    if (stationId) {
      const stationValue = Number(stationId);
      inspections = inspections.filter(item => {
        const itemStationId = item.station_id ?? item.station?.id ?? null;
        return itemStationId === stationValue;
      });
    }

    // 如果有自检记录，解析检查结果
    if (inspections.length > 0) {
      const inspection = inspections[0];
      // 解析检查结果JSON
      let checkResults = inspection.inspection_items
        || inspection.inspectionItems
        || inspection.check_results
        || inspection.checkResults
        || [];
      if (typeof checkResults === 'string') {
        try {
          checkResults = JSON.parse(checkResults);
        } catch (e) {
          checkResults = [];
        }
      }

      // 转换为显示格式
      hygieneInspectionItems.value = checkResults.map((item, index) => {
        const statusValue = item.status ?? item.result ?? item.checked ?? item.checkStatus;
        const normalizedStatus = statusValue === 0 || statusValue === '0' ? 0 : 1;
        return {
          id: item.item_id || item.itemId || index,
          itemName: item.item_name || item.itemName || `检查项${index + 1}`,
          isChecked: statusValue !== null && statusValue !== undefined,
          status: normalizedStatus,
          result: normalizedStatus === 1 ? 'normal' : 'abnormal',
          areaName: item.areaName || item.area_name || '',
          workRequirements: item.workRequirements || item.work_requirements || item.itemStandard || item.item_standard || '',
          checkTime: inspection.submit_time
            || inspection.submitTime
            || inspection.created_at
            || inspection.createdAt
            || inspection.inspection_date
            || '',
          remark: item.remark || ''
        };
      });
      hygieneInspectionGroups.value = buildInspectionGroups(
        hygieneInspectionItems.value,
        item => item.areaName || unknownAreaText
      );
    } else {
      hygieneInspectionItems.value = [];
      hygieneInspectionGroups.value = [];
    }
  } catch (error) {
    hygieneInspectionItems.value = [];
    hygieneInspectionGroups.value = [];
  }
};

// 加载临时任务数据
const loadTemporaryTaskItems = async (dateStr, userId, stationId) => {
  try {
    const res = await request.get('/temporary-tasks', {
      params: {
        executorId: userId
      }
    });
    const allTasks = res.list || res || [];

    // 过滤出当天的任务（创建日期或完成日期在当天）
    const dayTasks = allTasks.filter(task => {
      const createdDate = task.created_at ? dayjs(task.created_at).format('YYYY-MM-DD') : '';
      const completedDate = task.completed_time ? dayjs(task.completed_time).format('YYYY-MM-DD') : '';
      return createdDate === dateStr || completedDate === dateStr;
    });

    temporaryTaskItems.value = dayTasks.map(task => ({
      id: task.id,
      taskName: task.task_name || task.title,
      description: task.description || task.content,
      status: task.status,
      assignerName: task.assigner?.real_name || task.assigner_name || '',
      completedTime: task.completed_time || task.completed_at || ''
    }));
  } catch (error) {
    temporaryTaskItems.value = [];
  }
};

// 加载保养任务数据
const loadMaintenanceTaskItems = async (dateStr, userId, stationId) => {
  try {
    const params = { workDate: dateStr };
    if (stationId) {
      params.stationId = stationId;
    }
    if (userId && userId !== userStore.userId) {
      params.userId = userId;
    }
    const res = await request.get('/maintenance-work-records/today-tasks', { params });
    const tasks = Array.isArray(res.list) ? res.list : (Array.isArray(res) ? res : []);

    maintenanceTaskItems.value = tasks.map(task => {
      const record = task.existingRecord || {};
      const status = record.status || task.status || '';
      const rawCompletedTime = record.submitTime || record.submit_time || task.completed_time || task.completed_at || '';
      const completedTime = rawCompletedTime ? dayjs(rawCompletedTime).format('YYYY-MM-DD HH:mm:ss') : '';
      const standardsSource = Array.isArray(task.maintenanceStandards)
        ? task.maintenanceStandards
        : Array.isArray(task.maintenance_standards)
          ? task.maintenance_standards
          : [];
      const standardTexts = standardsSource
        .map(item => {
          const name = String(item?.name ?? '').trim();
          const specification = String(item?.specification ?? '').trim();
          return [name, specification].filter(Boolean).join(' ');
        })
        .filter(Boolean);
      const maintenanceItem = standardTexts.length ? standardTexts.join('、') : '-';

      return {
        id: task.id || task.plan_id,
        equipmentName: task.equipmentName ?? task.equipment_name ?? task.plan?.equipment_name ?? '',
        maintenanceItem,
        cycleType: task.cycleType ?? task.cycle_type ?? task.plan?.cycle_type ?? '',
        isCompleted: status === 'completed' || status === 'verified',
        completedTime,
        remark: record.remark || task.remark || ''
      };
    });
  } catch (error) {
    maintenanceTaskItems.value = [];
  }
};

// 加载所有日工作数据（包含岗位工作、自检、临时任务、保养）
const loadAllDayWorkData = async (dateStr, userId, stationId) => {
  // 并行加载所有数据
  await Promise.all([
    loadSafetyInspectionItems(dateStr, userId, stationId),
    loadHygieneInspectionItems(dateStr, userId, stationId),
    loadTemporaryTaskItems(dateStr, userId, stationId),
    loadMaintenanceTaskItems(dateStr, userId, stationId)
  ]);
};

watch(currentMonth, () => {
  loadSchedule();
  loadMySchedule();
});

onMounted(() => {
  loadSchedule();
  loadMySchedule();
  if (canAddSchedule.value) {
    loadUsers();
    loadStations();
    // 不再在页面加载时预加载岗位，而是在打开对话框并选择场站后按需加载
  }
});
</script>

<style lang="scss" scoped>
.schedule-page {
  padding: 20px;

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

  h3 {
    margin: 0 0 16px;
    font-size: 16px;
    color: #303133;
  }

  .filter-card {
    margin-bottom: 16px;
  }

  .filter-bar {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
  }

  .my-schedule-section {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }

  .calendar-view {
    .calendar-header {
      text-align: center;
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 16px;
    }

    .calendar-weekdays {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: 4px;
      margin-bottom: 8px;
      width: 100%;
      box-sizing: border-box;
      width: 100%;
      box-sizing: border-box;

      .weekday {
        text-align: center;
        font-weight: bold;
        color: #606266;
        padding: 8px;
      }
    }

    .calendar-days {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: 4px;
      width: 100%;
      box-sizing: border-box;
      width: 100%;
      box-sizing: border-box;

      .calendar-day {
        min-height: 80px;
        padding: 8px;
        border: 1px solid #ebeef5;
        border-radius: 4px;
        position: relative;
        transition: all 0.2s;

        &.other-month {
          background: #f5f7fa;
          color: #c0c4cc;
        }

        &.today {
          border-color: #409EFF;
          background: #ecf5ff;
        }

        &.has-schedule {
          border-width: 2px;
        }

        &.clickable {
          cursor: pointer;

          &:hover {
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
            transform: translateY(-2px);
          }
        }

        .day-number {
          font-weight: bold;
          margin-bottom: 4px;
        }

        .schedule-info {
          font-size: 12px;

          .schedule-line {
            color: var(--schedule-text-color, #606266);
            font-weight: 500;
            line-height: 1.4;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      }
    }
  }

.schedule-table-section {
    background: transparent;
    border-radius: 0;
    padding: 0;
    box-shadow: none;

    .pagination-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }

    .day-header {
      .weekday-label {
        font-size: 10px;
        color: #909399;
      }
    }

    .schedule-cell {
      padding: 4px;
      border-radius: 2px;

      &.has-work {
        color: #67C23A;
        font-weight: bold;
      }

      &.multi-work {
        color: #E6A23C;
        font-weight: bold;
      }

      &.rest {
        color: #409EFF;
        background-color: #e6f7ff;
      }

      &.other {
        color: #909399;
      }
    }
  }

  .schedule-days-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 8px;
    margin-bottom: 16px;
    width: 100%;
    box-sizing: border-box;

    .day-checkbox {
      padding: 8px;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      height: var(--schedule-day-height);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      &:hover {
        border-color: #409EFF;
      }

      &.selected {
        border-color: #409EFF;
        background-color: #409EFF;
        color: #fff;
      }

      &.weekend {
        background-color: #ecf5ff;

        &.selected {
          background-color: #409EFF;
        }
      }

      .day-num {
        font-weight: bold;
        font-size: 16px;
      }

      .day-week {
        font-size: 12px;
        color: #909399;
      }

      &.selected .day-week {
        color: rgba(255, 255, 255, 0.8);
      }

      &.placeholder {
        border: 1px dashed #ebeef5;
        background-color: #fafafa;
        cursor: default;

        &:hover {
          border-color: #ebeef5;
        }
      }
    }
  }

  .schedule-date-body {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    --schedule-day-height: 36px;
  }

  .schedule-year-row {
    display: block;
    margin-bottom: 8px;
    width: 100%;
  }

  .schedule-year-select {
    width: 100%;
  }

  .schedule-year-select :deep(.el-input__inner) {
    font-size: 16px;
    text-align: center;
    font-weight: 600;
  }

  .weekday-row {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 8px;
    margin-bottom: 8px;
    width: 100%;
    box-sizing: border-box;
    text-align: center;
    font-size: 12px;
    color: #909399;
    width: 100%;

    .weekday {
      font-weight: 600;
    }
  }

  .month-select {
    display: grid;
    grid-template-columns: repeat(12, minmax(28px, 1fr));
    gap: 6px;
    margin-bottom: 8px;
    width: 100%;
  }

  .month-option {
    padding: 4px 0;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 12px;

    &:hover {
      border-color: #409EFF;
    }

    &.selected {
      border-color: #409EFF;
      background-color: #409EFF;
      color: #fff;
    }
  }

  .quick-select {
    display: flex;
    gap: 8px;
  }

  .quick-select-button {
    font-size: 14px;
  }

  .schedule-dialog-footer-button {
    font-size: 16px;
  }

  // 员工月历样式
  .user-calendar {
    .calendar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      .month-title {
        font-size: 18px;
        font-weight: bold;
      }
    }

    .calendar-weekdays {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: 4px;
      margin-bottom: 8px;

      .weekday {
        text-align: center;
        font-weight: bold;
        color: #606266;
        padding: 8px;
      }
    }

    .calendar-days {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: 4px;

      .calendar-day {
        min-height: 90px;
        padding: 8px;
        border: 2px solid #ebeef5;
        border-radius: 4px;
        position: relative;
        transition: all 0.2s;

        &.other-month {
          background: #f5f7fa;
          color: #c0c4cc;
        }

        &.today {
          border-color: #409EFF;
          background: #ecf5ff;
        }

        &.has-schedule {
          border-width: 2px;
        }

        &.clickable {
          cursor: pointer;

          &:hover {
            border-color: #409EFF;
            box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
            transform: translateY(-2px);
          }
        }

        .day-number {
          font-weight: bold;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .schedule-badge {
          font-size: 12px;

          .schedule-line {
            color: var(--schedule-text-color, #2e7d32);
            font-weight: 500;
            line-height: 1.4;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      }
    }
  }

  // 工作项目抽屉样式
  .work-items {
    padding: 10px;

    .collapse-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 15px;
      font-weight: 500;

      .el-icon {
        font-size: 18px;
      }

      .count-tag {
        margin-left: auto;
        margin-right: 10px;
      }
    }

    .empty-work,
    .empty-section {
      text-align: center;
      padding: 20px;
      color: #909399;
      font-size: 14px;
    }

    .work-item-card,
    .inspection-card,
    .task-card,
    .maintenance-card {
      margin-bottom: 12px;

      .work-item-header,
      .inspection-header,
      .task-header,
      .maintenance-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;

        .work-name,
        .inspection-name,
        .task-name,
        .maintenance-name {
          font-size: 15px;
          font-weight: bold;
          color: #303133;
        }
      }

      .work-item-content,
      .inspection-content,
      .task-content,
      .maintenance-content {
        .info-row {
          display: flex;
          margin-bottom: 6px;
          font-size: 13px;
          line-height: 1.5;

          .inspection-line {
            color: #303133;
          }

          .label {
            color: #909399;
            width: 80px;
            flex-shrink: 0;
          }

          .overtime {
            color: #f56c6c;
            font-weight: bold;
          }
        }
      }
    }

    .inspection-group-card {
      cursor: pointer;
    }

    .inspection-time {
      font-size: 12px;
      color: #909399;
    }

    .inspection-dialog-title {
      font-weight: 600;
      font-size: 16px;
      margin-bottom: 10px;
      color: #303133;
    }

    .inspection-detail-dialog :deep(.el-dialog__title) {
      font-size: 18px;
      font-weight: 600;
    }

    :deep(.el-collapse) {
      border: none;

      .el-collapse-item__header {
        background: #f5f7fa;
        border-radius: 4px;
        margin-bottom: 8px;
        padding: 0 12px;
        font-size: 14px;
        height: 44px;
        line-height: 44px;

        &.is-active {
          background: #ecf5ff;
        }
      }

      .el-collapse-item__wrap {
        border: none;
      }

      .el-collapse-item__content {
        padding-bottom: 10px;
      }
    }
  }
}


@media screen and (max-width: 768px) {
  .schedule-page {
    padding: 12px;

    .page-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;

      h2 {
        font-size: 18px;
      }

      .header-actions {
        flex-wrap: wrap;
        width: 100%;
        gap: 8px;

        .el-button {
          flex: 1;
          min-width: 80px;
        }

        .el-date-picker {
          width: 100% !important;
        }
      }
    }

    .filter-bar {
      flex-direction: column;
      align-items: stretch;
      padding: 12px;

      .el-select,
      .el-input {
        width: 100% !important;
      }
    }

    // 表格容器支持水平滚动
    .schedule-table-section {
      padding: 0;
      overflow-x: hidden;

      .el-table {
        min-width: 0;
      }
    }

    // 日历在小屏幕上的优化
    .calendar-view {
      .calendar-days {
        .calendar-day {
          min-height: 60px;
          padding: 4px;

          .day-number {
            font-size: 12px;
          }

          .schedule-info {
            font-size: 10px;

            .schedule-line {
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          }
        }
      }
    }

    // 员工月历移动端优化
    .user-calendar {
      .calendar-days {
        .calendar-day {
          min-height: 70px;
          padding: 4px;

          .day-number {
            font-size: 12px;
          }

          .schedule-badge {
            font-size: 10px;
          }
        }
      }
    }

    .schedule-days-grid {
      grid-template-columns: repeat(5, 1fr);
    }

    .month-select {
      grid-template-columns: repeat(6, 1fr);
    }
  }
}

@media screen and (max-width: 480px) {
  .schedule-page {
    padding: 8px;

    .calendar-view {
      .calendar-days {
        .calendar-day {
          min-height: 50px;

        }
      }
    }

    .schedule-days-grid {
      grid-template-columns: repeat(4, 1fr);
    }

    .month-select {
      grid-template-columns: repeat(4, 1fr);
    }
  }
}
</style>

