<template>
  <div class="hygiene-work-arrangement">
    <div class="page-header">
      <h2>卫生工作安排</h2>
      <div class="header-actions" v-if="activeTab === 'areas'">
        <el-button type="info" @click="downloadTemplate">
          <el-icon><Download /></el-icon>下载模板
        </el-button>
        <el-button type="success" @click="handleImport">
          <el-icon><Download /></el-icon>批量导入
        </el-button>
        <el-button type="primary" @click="handleAddArea">新增责任区</el-button>
        <el-button type="danger" :disabled="selectedAreaItems.length === 0" @click="handleBatchDeleteAreas">
          <el-icon><Delete /></el-icon>批量删除
        </el-button>
        <el-button type="primary" @click="openExportDialog">
          <el-icon><Upload /></el-icon>批量导出
        </el-button>
      </div>
      <div class="header-actions" v-else-if="activeTab === 'assignments'">
        <el-button type="primary" @click="handleAddAssignment">新增分配</el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="卫生区域划分" name="areas">
        <el-card class="filter-card">
          <FilterBar>
            <div class="filter-item">
              <span class="filter-label">场站</span>
              <FilterSelect v-model="areaFilters.station" placeholder="全部" clearable style="width: 200px;" @change="handleAreaSearch" @clear="handleAreaSearch">
                <el-option label="全部" value="all" />
                <el-option v-for="station in stations" :key="station.id" :label="station.name" :value="station.id" />
              </FilterSelect>
            </div>
            <div class="filter-item">
              <span class="filter-label">责任区</span>
              <el-input v-model="areaFilters.areaName" placeholder="全部" clearable style="width: 200px;" @input="handleAreaSearch" @clear="handleAreaSearch" />
            </div>
          </FilterBar>
        </el-card>
        <div class="table-section">
          <el-table ref="areaTableRef" :data="areaTableRows" :span-method="areaSpanMethod" border @selection-change="handleAreaSelectionChange">
          <el-table-column type="selection" width="55" />
          <el-table-column prop="stationName" label="场站" />
          <el-table-column prop="areaName" label="责任区" />
          <el-table-column prop="pointName" label="卫生点" />
          <el-table-column prop="workRequirements" label="工作要求及标准" />
          <el-table-column prop="areaPoints" label="积分" />
          <el-table-column prop="actions" label="操作" width="150">
            <template #default="{ row }">
              <el-button link type="primary" @click="handleEditArea(row.area)">编辑</el-button>
              <el-button link type="danger" @click="handleDeleteArea(row.area?.id ?? row.areaId)">删除</el-button>
            </template>
          </el-table-column>
          </el-table>
        </div>
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="areaPagination.currentPage"
            v-model:page-size="areaPagination.pageSize"
            :page-sizes="areaPagination.pageSizes"
            :total="areaGroups.length"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleAreaPageSizeChange"
            @current-change="handleAreaPageChange"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane label="卫生任务分配" name="assignments">
        <el-card class="filter-card">
          <FilterBar>
            <div class="filter-item">
              <span class="filter-label">场站</span>
              <FilterSelect v-model="assignmentFilters.station" placeholder="全部" clearable style="width: 200px;" @change="loadAssignments" @clear="loadAssignments">
                <el-option label="全部" value="all" />
                <el-option v-for="station in stations" :key="station.id" :label="station.name" :value="station.id" />
              </FilterSelect>
            </div>
            <div class="filter-item">
              <span class="filter-label">岗位</span>
              <FilterSelect v-model="assignmentFilters.position" placeholder="全部" clearable style="width: 200px;" @change="loadAssignments" @clear="loadAssignments">
                <el-option label="全部" value="all" />
                <el-option v-for="position in assignmentFilterPositions" :key="position" :label="position" :value="position" />
              </FilterSelect>
            </div>
            <div class="filter-item">
              <span class="filter-label">责任区</span>
              <FilterSelect v-model="assignmentFilters.area" placeholder="全部" clearable style="width: 200px;" @change="loadAssignments" @clear="loadAssignments">
                <el-option label="全部" value="all" />
                <el-option v-for="area in assignmentFilterAreas" :key="area.id" :label="area.areaName" :value="area.id" />
              </FilterSelect>
            </div>
          </FilterBar>
        </el-card>
        <div class="table-section">
          <el-table :data="assignmentTableRows" border>
          <el-table-column prop="stationName" label="场站" />
          <el-table-column prop="positionName" label="岗位" />
          <el-table-column prop="areaName" label="责任区" />
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button link type="danger" @click="handleDeleteAssignment(row.id)">删除</el-button>
            </template>
          </el-table-column>
          </el-table>
        </div>
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="assignmentPagination.page"
            v-model:page-size="assignmentPagination.pageSize"
            :page-sizes="assignmentPagination.pageSizes"
            :total="assignmentPagination.total"
            layout="total, sizes, prev, pager, next"
            @size-change="handleAssignmentPageSizeChange"
            @current-change="handleAssignmentPageChange"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <FormDialog
      v-model="areaDialogVisible"
      :title="areaForm.id ? '编辑责任区' : '新增责任区'"
      width="600px"
      :confirm-text="'保存'"
      :cancel-text="'取消'"
      @confirm="handleSaveArea"
    >
      <el-form :model="areaForm" label-width="100px">
        <el-form-item label="场站">
          <el-select v-model="areaForm.stationId" placeholder="选择场站">
            <el-option v-for="station in stations" :key="station.id" :label="station.name" :value="station.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="责任区">
          <el-input v-model="areaForm.areaName" placeholder="请输入责任区名称" />
        </el-form-item>
        <el-form-item label="积分">
          <el-input-number v-model="areaForm.areaPoints" :min="0" placeholder="请输入积分" />
        </el-form-item>
        <el-form-item label="卫生点">
          <el-button type="primary" size="small" @click="handleAddPoint">添加点位</el-button>
          <el-table :data="areaForm.points" border style="margin-top: 10px;">
            <el-table-column prop="pointName" label="卫生点" />
            <el-table-column prop="workRequirements" label="工作要求及标准" />
            <el-table-column label="操作" width="150">
              <template #default="{ row, $index }">
                <el-button link type="primary" @click="handleEditPoint(row, $index)">编辑</el-button>
                <el-button link type="danger" @click="handleDeletePoint($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>
      </el-form>
    </FormDialog>

    <FormDialog
      v-model="pointDialogVisible"
      title="卫生点配置"
      width="500px"
      :confirm-text="'保存'"
      :cancel-text="'取消'"
      @confirm="handleSavePoint"
    >
      <el-form :model="pointForm" label-width="100px">
        <el-form-item label="卫生点">
          <el-input v-model="pointForm.pointName" placeholder="请输入卫生点名称" />
        </el-form-item>
        <el-form-item label="工作要求及标准">
          <el-input v-model="pointForm.workRequirements" type="textarea" :rows="3" placeholder="请输入工作要求及标准" />
        </el-form-item>
      </el-form>
    </FormDialog>

    <FormDialog
      v-model="assignmentDialogVisible"
      title="新增分配"
      width="500px"
      :confirm-text="'保存'"
      :cancel-text="'取消'"
      @confirm="handleSaveAssignment"
    >
      <el-form :model="assignmentForm" label-width="100px">
        <el-form-item label="场站">
          <el-select v-model="assignmentForm.stationId" placeholder="选择场站">
            <el-option v-for="station in stations" :key="station.id" :label="station.name" :value="station.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="岗位">
          <el-select v-model="assignmentForm.positionName" placeholder="选择岗位">
            <el-option v-for="position in assignmentFormPositions" :key="position" :label="position" :value="position" />
          </el-select>
        </el-form-item>
        <el-form-item label="责任区">
          <el-select v-model="assignmentForm.areaId" placeholder="选择责任区">
            <el-option v-for="area in assignmentFormAreas" :key="area.id" :label="area.areaName" :value="area.id" />
          </el-select>
        </el-form-item>
      </el-form>
    </FormDialog>

    <FormDialog
      v-model="exportDialogVisible"
      title="批量导出"
      width="720px"
      :confirm-text="'导出'"
      :cancel-text="'取消'"
      :confirm-loading="exportLoading"
      :close-on-click-modal="false"
      @confirm="handleBatchExport"
    >
      <div class="export-dialog">
        <div class="export-hint">选择场站后勾选责任区，导出时一个责任区一行。</div>
        <el-form :inline="true" class="export-form">
          <el-form-item label="场站">
            <el-select
              v-model="exportStationId"
              placeholder="请选择场站"
              filterable
              style="width: 220px"
              @change="handleExportStationChange"
            >
              <el-option v-for="station in stations" :key="station.id" :label="station.name" :value="station.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="责任区">
            <div class="export-area-list" v-loading="exportAreaLoading">
              <div v-if="!exportStationId" class="export-placeholder">请先选择场站</div>
              <el-checkbox-group v-else v-model="exportAreaIds">
                <el-checkbox v-for="area in exportAreaOptions" :key="area.id" :label="area.id">
                  {{ area.areaName }}
                </el-checkbox>
              </el-checkbox-group>
            </div>
          </el-form-item>
        </el-form>
        <el-table
          v-if="exportPreviewRows.length"
          :data="exportPreviewRows"
          :span-method="exportPreviewSpanMethod"
          border
          size="small"
          style="margin-top: 12px;"
        >
          <el-table-column prop="stationName" label="场站" width="160" />
          <el-table-column prop="areaName" label="责任区" min-width="200" />
          <el-table-column prop="areaPoints" label="积分" width="80" />
        </el-table>
      </div>
    </FormDialog>

    <input ref="fileInput" type="file" accept=".xlsx,.xls" style="display: none;" @change="handleFileChange" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'

import { addTemplateInstructionSheet, applyTemplateHeaderStyle } from '@/utils/excelTemplate'
import FilterBar from '@/components/common/FilterBar.vue'
import FormDialog from '@/components/system/FormDialog.vue'
import {
  getHygieneAreas,
  createHygieneArea,
  updateHygieneArea,
  deleteHygieneArea,
  getHygienePoints,
  createHygienePoint,
  updateHygienePoint,
  deleteHygienePoint,
  getHygienePositionAreas,
  createHygienePositionArea,
  deleteHygienePositionArea
} from '@/api/hygieneManagement'
import { getPositionNames } from '@/api/positionJob'
import { getAllStations } from '@/api/station'

const activeTab = ref('areas')
const areas = ref([])
const assignments = ref([])
const stations = ref([])
const assignmentFilterPositions = ref([])
const assignmentFormPositions = ref([])
const assignmentFilterAreas = ref([])
const assignmentFormAreas = ref([])
const fileInput = ref(null)
const areaTableRef = ref(null)
const selectedAreaItems = ref([])
const exportDialogVisible = ref(false)
const exportStationId = ref('')
const exportAreaIds = ref([])
const exportAreaLoading = ref(false)
const exportLoading = ref(false)
const assignmentPagination = reactive({
  page: 1,
  pageSize: 5,
  pageSizes: [5, 10, 20, 50],
  total: 0
})
const exportAreasMap = ref({})

const areaFilters = reactive({
  station: 'all',
  areaName: ''
})

const assignmentFilters = reactive({
  station: 'all',
  position: 'all',
  area: 'all'
})

const areaDialogVisible = ref(false)
const areaForm = reactive({
  id: null,
  stationId: '',
  areaName: '',
  areaPoints: 0,
  points: []
})
const originalAreaPoints = ref([])

const pointDialogVisible = ref(false)
const pointForm = reactive({
  pointName: '',
  workRequirements: ''
})
const editingPointIndex = ref(-1)

const assignmentDialogVisible = ref(false)
const assignmentForm = reactive({
  stationId: '',
  positionName: '',
  areaId: ''
})

const resetExportSelection = () => {
  exportStationId.value = ''
  exportAreaIds.value = []
  exportAreaLoading.value = false
}

const areaPagination = reactive({
  currentPage: 1,
  pageSize: 5,
  pageSizes: [5, 10, 20]
})

const importHeaders = {
  station: '场站',
  area: '责任区',
  point: '卫生点',
  requirements: '工作要求及标准',
  points: '积分'
}

const loadAreas = async (resetPage = false) => {
  try {
    if (resetPage) {
      areaPagination.currentPage = 1
    }
    const params = {}
    if (areaFilters.station && areaFilters.station !== 'all') params.stationId = areaFilters.station
    if (areaFilters.areaName) params.areaName = areaFilters.areaName
    const res = await getHygieneAreas(params)
    const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
    areas.value = data
  } catch (error) {
    ElMessage.error('加载区域失败')
  }
}

const loadAssignments = async () => {
  try {
    const params = {}
    if (assignmentFilters.station && assignmentFilters.station !== 'all') params.stationId = assignmentFilters.station
    if (assignmentFilters.position && assignmentFilters.position !== 'all') params.positionName = assignmentFilters.position
    if (assignmentFilters.area && assignmentFilters.area !== 'all') params.areaId = assignmentFilters.area
    const res = await getHygienePositionAreas(params)
    const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
    assignments.value = data
    assignmentPagination.page = 1
  } catch (error) {
    ElMessage.error('加载分配失败')
  }
}

const loadStations = async () => {
  try {
    const res = await getAllStations()
    const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
    stations.value = data.map((station) => ({
      id: station.id,
      name: station.station_name ?? station.name ?? ''
    }))
  } catch (error) {
    ElMessage.error('加载场站失败')
  }
}

const loadAssignmentFilterPositions = async (stationId) => {
  try {
    const params = {}
    if (stationId) params.stationId = stationId
    const res = await getPositionNames(params)
    const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
    assignmentFilterPositions.value = data
  } catch (error) {
    ElMessage.error('加载岗位失败')
  }
}

const loadAssignmentFormPositions = async (stationId) => {
  if (!stationId) {
    assignmentFormPositions.value = []
    return
  }
  try {
    const res = await getPositionNames({ stationId })
    const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
    assignmentFormPositions.value = data
  } catch (error) {
    ElMessage.error('加载岗位失败')
  }
}

const loadAssignmentFilterAreas = async (stationId) => {
  try {
    const params = {}
    if (stationId) params.stationId = stationId
    const res = await getHygieneAreas(params)
    const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
    assignmentFilterAreas.value = data
  } catch (error) {
    ElMessage.error('加载责任区失败')
  }
}

const loadAssignmentFormAreas = async (stationId) => {
  if (!stationId) {
    assignmentFormAreas.value = []
    return
  }
  try {
    const res = await getHygieneAreas({ stationId })
    const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
    assignmentFormAreas.value = data
  } catch (error) {
    ElMessage.error('加载责任区失败')
  }
}

const loadExportAreas = async (stationId) => {
  if (!stationId) return
  const stationKey = String(stationId)
  if (exportAreasMap.value[stationKey]) return
  exportAreaLoading.value = true
  try {
    const res = await getHygieneAreas({ stationId })
    const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
    exportAreasMap.value = {
      ...exportAreasMap.value,
      [stationKey]: data
    }
  } catch (error) {
    ElMessage.error('加载责任区失败')
  } finally {
    exportAreaLoading.value = false
  }
}

const exportAreaOptions = computed(() => {
  const stationKey = String(exportStationId.value ?? '')
  const options = exportAreasMap.value[stationKey]
  return Array.isArray(options) ? options : []
})

const exportPreviewRows = computed(() => {
  const stationKey = String(exportStationId.value ?? '')
  const stationName = stations.value.find(station => String(station.id) === stationKey)?.name ?? ''
  const areaMap = new Map(exportAreaOptions.value.map(area => [String(area.id), area]))
  const orderedAreas = exportAreaIds.value
    .map(id => areaMap.get(String(id)))
    .filter(Boolean)
  const rowSpan = orderedAreas.length
  return orderedAreas.map((area, index) => ({
    id: `${stationKey}-${area.id}`,
    stationName,
    areaName: area.areaName ?? '',
    areaPoints: area.areaPoints ?? 0,
    rowSpan,
    isFirst: index === 0
  }))
})

const exportPreviewSpanMethod = ({ row, column }) => {
  if (column.property === 'stationName') {
    return row.isFirst ? [row.rowSpan, 1] : [0, 0]
  }
  return [1, 1]
}

const areaGroups = computed(() => {
  const areaList = Array.isArray(areas.value) ? areas.value : []
  return areaList.map((area) => {
    const pointList = Array.isArray(area.points) && area.points.length > 0 ? area.points : [null]
    const areaKey = area.id ?? `${area.stationName ?? ''}__${area.areaName ?? ''}`
    return {
      area,
      areaId: area.id,
      areaKey,
      stationName: area.stationName,
      areaName: area.areaName,
      areaPoints: area.areaPoints ?? 0,
      points: pointList
    }
  })
})

const areaTableRows = computed(() => {
  const startIndex = (areaPagination.currentPage - 1) * areaPagination.pageSize
  const endIndex = startIndex + areaPagination.pageSize
  const pageGroups = areaGroups.value.slice(startIndex, endIndex)
  const rows = []

  pageGroups.forEach((group) => {
    group.points.forEach((point, index) => {
      rows.push({
        id: `${group.areaKey}-${index}`,
        areaId: group.areaId,
        areaKey: group.areaKey,
        area: group.area,
        stationName: group.stationName,
        areaName: group.areaName,
        areaPoints: group.areaPoints,
        pointName: point?.pointName ?? '',
        workRequirements: point?.workRequirements ?? ''
      })
    })
  })

  const spanMap = new Map()

  rows.forEach((row, index) => {
    const key = row.areaKey
    const record = spanMap.get(key)
    if (record) {
      record.count += 1
      return
    }
    spanMap.set(key, { count: 1, firstIndex: index })
  })

  rows.forEach((row, index) => {
    const record = spanMap.get(row.areaKey)
    if (record) {
      row.rowSpan = record.count
      row.isFirst = record.firstIndex === index
      return
    }
    row.rowSpan = 1
    row.isFirst = true
  })

  return rows
})

const assignmentTableRows = computed(() => {
  const startIndex = (assignmentPagination.page - 1) * assignmentPagination.pageSize
  const endIndex = startIndex + assignmentPagination.pageSize
  return assignments.value.slice(startIndex, endIndex)
})

const areaSpanMethod = ({ row, column }) => {
  if (!row?.rowSpan) return [1, 1]
  if (column.type === 'selection') {
    return row.isFirst ? [row.rowSpan, 1] : [0, 0]
  }
  const spanColumns = new Set(['stationName', 'areaName', 'areaPoints', 'actions'])
  if (spanColumns.has(column.property)) {
    return row.isFirst ? [row.rowSpan, 1] : [0, 0]
  }
  return [1, 1]
}

const handleAreaPageSizeChange = (size) => {
  areaPagination.pageSize = size
  areaPagination.currentPage = 1
}

const handleAreaPageChange = (page) => {
  areaPagination.currentPage = page
}

const handleAssignmentPageChange = (page) => {
  assignmentPagination.page = page
}

const handleAssignmentPageSizeChange = (size) => {
  assignmentPagination.pageSize = size
  assignmentPagination.page = 1
}

const handleAreaSearch = () => {
  loadAreas(true)
}

const openExportDialog = () => {
  resetExportSelection()
  exportDialogVisible.value = true
}

const handleExportStationChange = async (stationId) => {
  exportAreaIds.value = []
  exportAreaLoading.value = false
  if (!stationId) return
  await loadExportAreas(stationId)
}

const handleBatchExport = async () => {
  if (!exportStationId.value) {
    ElMessage.warning('请选择场站')
    return
  }
  const selectedIds = exportAreaIds.value.filter(Boolean)
  if (!selectedIds.length) {
    ElMessage.warning('请选择责任区')
    return
  }

  exportLoading.value = true
  try {
    await loadExportAreas(exportStationId.value)
    const stationKey = String(exportStationId.value)
    const areaList = exportAreasMap.value[stationKey]
    const areaOptions = Array.isArray(areaList) ? areaList : []
    const areaMap = new Map(areaOptions.map(area => [String(area.id), area]))
    const orderedAreas = selectedIds
      .map(id => areaMap.get(String(id)))
      .filter(Boolean)

    const exportRowsData = []
    const merges = []
    let currentRow = 1
    const stationName = stations.value.find(station => String(station.id) === stationKey)?.name ?? ''
    orderedAreas.forEach((area) => {
      const points = Array.isArray(area.points) && area.points.length > 0 ? area.points : [null]
      const startRow = currentRow
      points.forEach((point, index) => {
        exportRowsData.push({
          [importHeaders.station]: index === 0 ? stationName : '',
          [importHeaders.area]: index === 0 ? (area.areaName ?? '') : '',
          [importHeaders.point]: point?.pointName ?? point?.point_name ?? '',
          [importHeaders.requirements]: point?.workRequirements ?? point?.work_requirements ?? '',
          [importHeaders.points]: index === 0 ? (area.areaPoints ?? 0) : ''
        })
        currentRow += 1
      })
      if (points.length > 1) {
        const endRow = currentRow - 1
        merges.push({ s: { r: startRow, c: 0 }, e: { r: endRow, c: 0 } })
        merges.push({ s: { r: startRow, c: 1 }, e: { r: endRow, c: 1 } })
        merges.push({ s: { r: startRow, c: 4 }, e: { r: endRow, c: 4 } })
      }
    })

    if (!exportRowsData.length) {
      ElMessage.warning('没有可导出的数据')
      return
    }

    const headers = [importHeaders.station, importHeaders.area, importHeaders.point, importHeaders.requirements, importHeaders.points]
    const ws = XLSX.utils.json_to_sheet(exportRowsData, { header: headers })
    applyTemplateHeaderStyle(XLSX, ws, 1)
    if (merges.length > 0) {
      ws['!merges'] = merges
    }

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '卫生区域导出')
    XLSX.writeFile(wb, '卫生区域划分批量导出.xlsx')
    ElMessage.success('导出成功')
    exportDialogVisible.value = false
  } catch (error) {
    ElMessage.error('导出失败')
  } finally {
    exportLoading.value = false
  }
}

const downloadTemplate = () => {
  const template = [
    {
      [importHeaders.station]: '示例场站',
      [importHeaders.area]: '办公区域',
      [importHeaders.point]: '办公室',
      [importHeaders.requirements]: '保持整洁',
      [importHeaders.points]: 10
    },
    {
      [importHeaders.station]: '示例场站',
      [importHeaders.area]: '办公区域',
      [importHeaders.point]: '会议室',
      [importHeaders.requirements]: '桌椅摆放整齐',
      [importHeaders.points]: 10
    },
    {
      [importHeaders.station]: '示例场站',
      [importHeaders.area]: '生产区域',
      [importHeaders.point]: '车间地面',
      [importHeaders.requirements]: '无油污杂物',
      [importHeaders.points]: 15
    }
  ]
  const ws = XLSX.utils.json_to_sheet(template)

  applyTemplateHeaderStyle(XLSX, ws, 1)

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '卫生区域模板')
  addTemplateInstructionSheet(XLSX, wb, [
    ['场站', '必填，系统已有场站名称。'],
    ['责任区', '必填，责任区名称，同一责任区可多行填写卫生点。'],
    ['卫生点', '必填，责任区下具体点位名称。'],
    ['工作要求及标准', '选填，卫生要求/标准说明。'],
    ['积分', '选填，数字；同一责任区可只在首行填写。']
  ])
  XLSX.writeFile(wb, '卫生区域划分导入模板.xlsx')
  ElMessage.success('模板下载成功')
}

const handleImport = () => {
  fileInput.value.click()
}

const handleFileChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      if (jsonData.length === 0) {
        ElMessage.warning('Excel文件为空')
        return
      }

      // 按场站和责任区分组
      const groupedData = {}
      // 处理合并单元格：继承上一行场站/责任区/积分
      let lastStationName = ''
      let lastAreaName = ''
      let lastAreaPoints = null
      for (const row of jsonData) {
        const normalizedRow = {}
        for (const [key, value] of Object.entries(row)) {
          normalizedRow[String(key).trim()] = value
        }

        const stationNameRaw = normalizedRow[importHeaders.station]?.toString().trim()
        const areaNameRaw = normalizedRow[importHeaders.area]?.toString().trim()
        const pointName = normalizedRow[importHeaders.point]?.toString().trim()
        const workRequirements = normalizedRow[importHeaders.requirements]?.toString().trim()
        const pointsValue = normalizedRow[importHeaders.points]
        const pointsText = pointsValue !== undefined && pointsValue !== null ? String(pointsValue).trim() : ''
        const hasPointsValue = pointsText !== ''
        const parsedPoints = hasPointsValue ? Number.parseFloat(pointsText) : null
        const hasPoints = Number.isFinite(parsedPoints)

        if (stationNameRaw) {
          if (stationNameRaw !== lastStationName) {
            lastAreaName = ''
            lastAreaPoints = null
          }
          lastStationName = stationNameRaw
        }

        if (areaNameRaw) {
          lastAreaName = areaNameRaw
          lastAreaPoints = null
        }

        if (hasPoints) {
          lastAreaPoints = parsedPoints
        }

        const stationName = stationNameRaw ? stationNameRaw : lastStationName
        const areaName = areaNameRaw ? areaNameRaw : lastAreaName
        const areaPoints = hasPoints ? parsedPoints : lastAreaPoints

        if (!stationName || !areaName || !pointName) {
          continue
        }

        const key = `${stationName}__${areaName}`
        if (!groupedData[key]) {
          groupedData[key] = {
            stationName,
            areaName,
            areaPoints,
            hasAreaPoints: hasPoints,
            points: []
          }
        } else if (hasPoints) {
          groupedData[key].areaPoints = parsedPoints
          groupedData[key].hasAreaPoints = true
        }

        groupedData[key].points.push({
          pointName,
          workRequirements: workRequirements ?? ''
        })
      }

      // 查找场站ID并创建责任区
      let successCount = 0
      let failCount = 0
      const errors = []

      for (const key in groupedData) {
        const group = groupedData[key]

        // 查找场站ID
        const station = stations.value.find((s) => s.name === group.stationName || s.station_name === group.stationName)
        if (!station) {
          errors.push(`场站"${group.stationName}"不存在`)
          failCount++
          continue
        }

        try {
          await createHygieneArea({
            stationId: station.id,
            areaName: group.areaName,
            areaPoints: group.hasAreaPoints ? group.areaPoints : null,
            points: group.points,
            mergeMode: 'merge'
          })
          successCount++
        } catch (error) {
          errors.push(`创建"${group.areaName}"失败: ${error.message}`)
          failCount++
        }
      }

      if (errors.length > 0) {
        ElMessage.warning(`导入完成：成功 ${successCount} 个，失败 ${failCount} 个。${errors.slice(0, 3).join('；')}`)
      } else {
        ElMessage.success(`导入成功：共导入 ${successCount} 个责任区`)
      }

      loadAreas(true)
    } catch (error) {
      ElMessage.error(`导入失败: ${error.message}`)
    }
  }
  reader.readAsArrayBuffer(file)
  event.target.value = ''
}

const handleAddArea = () => {
  Object.assign(areaForm, {
    id: null,
    stationId: '',
    areaName: '',
    areaPoints: 0,
    points: []
  })
  originalAreaPoints.value = []
  areaDialogVisible.value = true
}

const handleEditArea = (row) => {
  const points = (row.points ?? []).map((point) => ({
    id: point.id ?? null,
    pointName: point.pointName ?? '',
    workRequirements: point.workRequirements ?? ''
  }))
  Object.assign(areaForm, {
    id: row.id,
    stationId: row.stationId,
    areaName: row.areaName,
    areaPoints: row.areaPoints || 0,
    points
  })
  originalAreaPoints.value = points.map((point) => ({ ...point }))
  areaDialogVisible.value = true
}

const handleDeleteArea = async (id) => {
  try {
    await ElMessageBox.confirm('确认删除该区域？', '提示', { type: 'warning' })
    await deleteHygieneArea(id)
    ElMessage.success('删除成功')
    loadAreas()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败')
  }
}

const handleAreaSelectionChange = (selection) => {
  const deduped = new Map()
  selection.forEach((row) => {
    const areaId = row.area?.id ?? row.areaId ?? null
    if (!areaId || deduped.has(areaId)) return
    deduped.set(areaId, {
      id: areaId,
      areaName: row.areaName ?? '',
      stationName: row.stationName ?? ''
    })
  })
  selectedAreaItems.value = Array.from(deduped.values())
}

const handleBatchDeleteAreas = async () => {
  if (selectedAreaItems.value.length === 0) return
  try {
    await ElMessageBox.confirm(`\u786e\u8ba4\u5220\u9664\u9009\u4e2d\u7684 ${selectedAreaItems.value.length} \u4e2a\u8d23\u4efb\u533a\uff1f`, '\u63d0\u793a', { type: 'warning' })
    let successCount = 0
    let failCount = 0

    for (const item of selectedAreaItems.value) {
      try {
        await deleteHygieneArea(item.id)
        successCount += 1
      } catch (error) {
        failCount += 1
      }
    }

    if (failCount > 0) {
      ElMessage.warning(`\u5220\u9664\u5b8c\u6210\uff1a\u6210\u529f ${successCount} \u4e2a\uff0c\u5931\u8d25 ${failCount} \u4e2a\u3002`)
    } else {
      ElMessage.success('\u5220\u9664\u6210\u529f')
    }

    selectedAreaItems.value = []
    areaTableRef.value?.clearSelection?.()
    loadAreas(true)
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('\u5220\u9664\u5931\u8d25')
  }
}


const syncHygienePoints = async (areaId) => {
  const nextPoints = Array.isArray(areaForm.points) ? areaForm.points : []
  const previousPoints = Array.isArray(originalAreaPoints.value) ? originalAreaPoints.value : []
  const previousMap = new Map(previousPoints.filter((point) => point.id).map((point) => [String(point.id), point]))
  const nextMap = new Map(nextPoints.filter((point) => point.id).map((point) => [String(point.id), point]))

  for (const [pointId] of previousMap) {
    if (!nextMap.has(pointId)) {
      await deleteHygienePoint(pointId)
    }
  }

  for (const [pointId, point] of nextMap) {
    const previous = previousMap.get(pointId)
    if (!previous) continue
    const nameChanged = previous.pointName !== point.pointName
    const requirementChanged = previous.workRequirements !== point.workRequirements
    if (nameChanged || requirementChanged) {
      await updateHygienePoint(pointId, {
        pointName: point.pointName,
        workRequirements: point.workRequirements
      })
    }
  }

  for (const point of nextPoints) {
    if (point.id) continue
    const pointName = typeof point.pointName === 'string' ? point.pointName.trim() : ''
    if (!pointName) continue
    await createHygienePoint({
      hygieneAreaId: areaId,
      pointName,
      workRequirements: point.workRequirements ?? ''
    })
  }
}

const handleSaveArea = async () => {
  try {
    if (areaForm.id) {
      await updateHygieneArea(areaForm.id, {
        stationId: areaForm.stationId,
        areaName: areaForm.areaName,
        areaPoints: areaForm.areaPoints
      })
      await syncHygienePoints(areaForm.id)
    } else {
      await createHygieneArea(areaForm)
    }
    ElMessage.success('保存成功')
    areaDialogVisible.value = false
    loadAreas()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const handleAddPoint = () => {
  Object.assign(pointForm, {
    pointName: '',
    workRequirements: ''
  })
  editingPointIndex.value = -1
  pointDialogVisible.value = true
}

const handleEditPoint = (row, index) => {
  Object.assign(pointForm, {
    pointName: row.pointName,
    workRequirements: row.workRequirements
  })
  editingPointIndex.value = index
  pointDialogVisible.value = true
}

const handleDeletePoint = (index) => {
  areaForm.points.splice(index, 1)
}

const handleSavePoint = () => {
  if (editingPointIndex.value >= 0) {
    areaForm.points[editingPointIndex.value] = { ...pointForm }
  } else {
    areaForm.points.push({ ...pointForm })
  }
  pointDialogVisible.value = false
}

const handleAddAssignment = () => {
  Object.assign(assignmentForm, {
    stationId: '',
    positionName: '',
    areaId: ''
  })
  assignmentFormPositions.value = []
  assignmentFormAreas.value = []
  assignmentDialogVisible.value = true
}

const handleSaveAssignment = async () => {
  try {
    await createHygienePositionArea({
      stationId: assignmentForm.stationId,
      positionName: assignmentForm.positionName,
      hygieneAreaId: assignmentForm.areaId
    })
    ElMessage.success('保存成功')
    assignmentDialogVisible.value = false
    loadAssignments()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const handleDeleteAssignment = async (id) => {
  try {
    await ElMessageBox.confirm('确认删除该分配？', '提示', { type: 'warning' })
    await deleteHygienePositionArea(id)
    ElMessage.success('删除成功')
    loadAssignments()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败')
  }
}

onMounted(() => {
  loadAreas(true)
  loadAssignments()
  loadStations()
  loadAssignmentFilterPositions()
  loadAssignmentFilterAreas()
})

watch(
  () => areaGroups.value.length,
  (total) => {
    const size = areaPagination.pageSize
    const maxPage = Math.max(1, Math.ceil(total / size))
    if (areaPagination.currentPage > maxPage) {
      areaPagination.currentPage = maxPage
    }
  }
)

watch(
  () => assignments.value.length,
  (total) => {
    assignmentPagination.total = total
    const size = assignmentPagination.pageSize
    const maxPage = Math.max(1, Math.ceil(total / size))
    if (assignmentPagination.page > maxPage) {
      assignmentPagination.page = maxPage
    }
  }
)

watch(
  () => assignmentFilters.station,
  (stationId) => {
    assignmentFilters.position = 'all'
    assignmentFilters.area = 'all'
    loadAssignmentFilterPositions(stationId)
    loadAssignmentFilterAreas(stationId)
  }
)

watch(
  () => assignmentForm.stationId,
  (stationId) => {
    assignmentForm.positionName = ''
    assignmentForm.areaId = ''
    loadAssignmentFormPositions(stationId)
    loadAssignmentFormAreas(stationId)
  }
)

watch(
  () => exportDialogVisible.value,
  (visible) => {
    if (!visible) {
      resetExportSelection()
    }
  }
)
</script>

<style scoped lang="scss">
.hygiene-work-arrangement {
  padding: 20px;

  .actions-bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 12px;
  }

  .table-section {
    margin-top: 16px;
  }

  .export-dialog {
    .export-hint {
      margin-bottom: 12px;
      font-size: 12px;
      color: #909399;
    }

    .export-form {
      align-items: flex-start;
    }

    .export-area-list {
      min-height: 36px;
      max-height: 200px;
      overflow: auto;
      padding: 6px 8px;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      background: #fff;
      min-width: 260px;
    }

    .export-placeholder {
      color: #c0c4cc;
      font-size: 12px;
    }
  }
}
</style>




