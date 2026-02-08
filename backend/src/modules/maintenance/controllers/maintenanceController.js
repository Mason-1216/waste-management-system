import * as faultService from '../services/faultService.js';
import * as repairService from '../services/repairService.js';
import * as planService from '../services/planService.js';
import * as recordService from '../services/recordService.js';
import * as materialService from '../services/materialService.js';
import { validateBody, validateParams, validateQuery } from '../../core/validators/validate.js';
import {
  assignFaultReportBodySchema,
  completeRepairBodySchema,
  createFaultReportBodySchema,
  createMaintenancePlanBodySchema,
  createMaintenanceRecordBodySchema,
  createMaterialRequisitionBodySchema,
  createRepairRecordBodySchema,
  dispatchRepairRecordBodySchema,
  getFaultReportsQuerySchema,
  getMaintenancePlansQuerySchema,
  getMaintenanceRecordsQuerySchema,
  getMaterialRequisitionsQuerySchema,
  getRepairRecordsQuerySchema,
  idParamSchema,
  startRepairBodySchema,
  updateMaintenancePlanBodySchema,
  updateRepairRecordBodySchema,
  verifyRepairRecordBodySchema
} from '../validators/maintenanceControllerSchemas.js';

// ============================================
// 保养计划
// ============================================

/**
 * 查询保养计划列表
 * GET /api/maintenance-plans
 */
export const getMaintenancePlans = async (ctx) => {
  await validateQuery(ctx, getMaintenancePlansQuerySchema);
  const data = await planService.getMaintenancePlans({
    query: ctx.query,
    dataFilter: ctx.state.dataFilter,
    user: ctx.state.user
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data
  };
};

/**
 * 新增保养计划
 * POST /api/maintenance-plans
 */
export const createMaintenancePlan = async (ctx) => {
  await validateBody(ctx, createMaintenancePlanBodySchema);
  const data = await planService.createMaintenancePlan({
    body: ctx.request.body,
    user: ctx.state.user
  });

  ctx.body = {
    code: 200,
    message: '保养计划创建成功',
    data
  };
};

/**
 * 编辑保养计划
 * PUT /api/maintenance-plans/:id
 */
export const updateMaintenancePlan = async (ctx) => {
  const { id } = await validateParams(ctx, idParamSchema);
  await validateBody(ctx, updateMaintenancePlanBodySchema);
  await planService.updateMaintenancePlan({
    id,
    body: ctx.request.body
  });

  ctx.body = { code: 200, message: '更新成功', data: null };
};

/**
 * 删除保养计划
 * DELETE /api/maintenance-plans/:id
 */
export const deleteMaintenancePlan = async (ctx) => {
  const { id } = await validateParams(ctx, idParamSchema);
  await planService.deleteMaintenancePlan({ id });
  ctx.body = { code: 200, message: '删除成功', data: null };
};

// ============================================
// 保养记录
// ============================================

/**
 * 查询保养记录列表
 * GET /api/maintenance-records
 */
export const getMaintenanceRecords = async (ctx) => {
  await validateQuery(ctx, getMaintenanceRecordsQuerySchema);
  const data = await recordService.getMaintenanceRecords({
    query: ctx.query,
    dataFilter: ctx.state.dataFilter,
    user: ctx.state.user
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data
  };
};

/**
 * 填写保养记录
 * POST /api/maintenance-records
 */
export const createMaintenanceRecord = async (ctx) => {
  await validateBody(ctx, createMaintenanceRecordBodySchema);
  const data = await recordService.createMaintenanceRecord({
    body: ctx.request.body,
    user: ctx.state.user
  });

  ctx.body = {
    code: 200,
    message: '保养记录提交成功',
    data
  };
};

// ============================================
// 故障上报
// ============================================

/**
 * 查询故障上报单列表
 * GET /api/fault-reports
 */
export const getFaultReports = async (ctx) => {
  await validateQuery(ctx, getFaultReportsQuerySchema);
  const data = await faultService.getFaultReports({
    query: ctx.query,
    dataFilter: ctx.state.dataFilter,
    user: ctx.state.user
  });
  ctx.body = {
    code: 200,
    message: 'success',
    data
  };
};

/**
 * 上报故障
 * POST /api/fault-reports
 */
export const createFaultReport = async (ctx) => {
  await validateBody(ctx, createFaultReportBodySchema);
  const data = await faultService.createFaultReport({
    body: ctx.request.body,
    user: ctx.state.user
  });
  ctx.body = {
    code: 200,
    message: '故障上报成功',
    data
  };
};

/**
 * 站长派发维修
 * POST /api/fault-reports/:id/assign
 */
export const assignFaultReport = async (ctx) => {
  const { id } = await validateParams(ctx, idParamSchema);
  await validateBody(ctx, assignFaultReportBodySchema);
  await faultService.assignFaultReport({
    id,
    body: ctx.request.body,
    user: ctx.state.user
  });

  ctx.body = { code: 200, message: '派发成功', data: null };
};

// ============================================
// 维修记录单 - 完整工作流
// ============================================

/**
 * 查询维修记录列表
 * GET /api/repair-records
 */
export const getRepairRecords = async (ctx) => {
  await validateQuery(ctx, getRepairRecordsQuerySchema);
  const data = await repairService.getRepairRecords({
    query: ctx.query,
    dataFilter: ctx.state.dataFilter,
    user: ctx.state.user
  });
  ctx.body = {
    code: 200,
    message: 'success',
    data
  };
};

/**
 * 获取单个维修记录详情
 * GET /api/repair-records/:id
 */
export const getRepairRecordById = async (ctx) => {
  const { id } = await validateParams(ctx, idParamSchema);
  const record = await repairService.getRepairRecordById(id);
  ctx.body = {
    code: 200,
    message: 'success',
    data: record
  };
};

/**
 * 创建维修记录单（上报人草稿）
 * POST /api/repair-records
 */
export const createRepairRecord = async (ctx) => {
  await validateBody(ctx, createRepairRecordBodySchema);
  const result = await repairService.createRepairRecord({
    body: ctx.request.body,
    user: ctx.state.user
  });
  ctx.body = {
    code: 200,
    message: result.isDraft ? '草稿保存成功' : '维修单提交成功',
    data: { id: result.id, recordCode: result.recordCode }
  };
};

/**
 * 更新维修记录单
 * PUT /api/repair-records/:id
 */
export const updateRepairRecord = async (ctx) => {
  const { id } = await validateParams(ctx, idParamSchema);
  await validateBody(ctx, updateRepairRecordBodySchema);
  await repairService.updateRepairRecord({
    id,
    body: ctx.request.body,
    user: ctx.state.user
  });
  ctx.body = { code: 200, message: '更新成功', data: null };
};

/**
 * 上报人提交维修单
 * POST /api/repair-records/:id/submit
 */
export const submitRepairRecord = async (ctx) => {
  const { id } = await validateParams(ctx, idParamSchema);
  await repairService.submitRepairRecord({
    id,
    user: ctx.state.user
  });

  ctx.body = { code: 200, message: '提交成功', data: null };
};

/**
 * 站长派发维修单
 * POST /api/repair-records/:id/dispatch
 */
export const dispatchRepairRecord = async (ctx) => {
  const { id } = await validateParams(ctx, idParamSchema);
  await validateBody(ctx, dispatchRepairRecordBodySchema);
  await repairService.dispatchRepairRecord({
    id,
    body: ctx.request.body,
    user: ctx.state.user
  });

  ctx.body = { code: 200, message: '派发成功', data: null };
};

/**
 * 维修人员开始维修
 * POST /api/repair-records/:id/start
 */
export const startRepair = async (ctx) => {
  const { id } = await validateParams(ctx, idParamSchema);
  await validateBody(ctx, startRepairBodySchema);
  await repairService.startRepair({
    id,
    body: ctx.request.body,
    user: ctx.state.user
  });

  ctx.body = { code: 200, message: '已开始维修', data: null };
};

/**
 * 维修人员提交维修完成
 * POST /api/repair-records/:id/complete
 */
export const completeRepair = async (ctx) => {
  const { id } = await validateParams(ctx, idParamSchema);
  await validateBody(ctx, completeRepairBodySchema);
  await repairService.completeRepair({
    id,
    body: ctx.request.body,
    user: ctx.state.user
  });

  ctx.body = { code: 200, message: '维修完成已提交，等待验收', data: null };
};

/**
 * 站长验收
 * POST /api/repair-records/:id/verify
 */
export const verifyRepairRecord = async (ctx) => {
  const { id } = await validateParams(ctx, idParamSchema);
  await validateBody(ctx, verifyRepairRecordBodySchema);
  const isPass = ctx.request.body?.verifyResult === 'pass';
  await repairService.verifyRepairRecord({
    id,
    body: ctx.request.body,
    user: ctx.state.user
  });

  ctx.body = { code: 200, message: isPass ? '验收完成' : '已退回重新维修', data: null };
};

/**
 * 删除维修记录（仅草稿状态）
 * DELETE /api/repair-records/:id
 */
export const deleteRepairRecord = async (ctx) => {
  const { id } = await validateParams(ctx, idParamSchema);
  await repairService.deleteRepairRecord({
    id,
    user: ctx.state.user
  });
  ctx.body = { code: 200, message: '删除成功', data: null };
};

// ============================================
// 领料申请
// ============================================

/**
 * 提交领料申请
 * POST /api/material-requisitions
 */
export const createMaterialRequisition = async (ctx) => {
  await validateBody(ctx, createMaterialRequisitionBodySchema);
  const data = await materialService.createMaterialRequisition({
    body: ctx.request.body,
    user: ctx.state.user
  });

  ctx.body = {
    code: 200,
    message: '领料申请提交成功',
    data
  };
};

/**
 * 查询领料申请列表
 * GET /api/material-requisitions
 */
export const getMaterialRequisitions = async (ctx) => {
  await validateQuery(ctx, getMaterialRequisitionsQuerySchema);
  const data = await materialService.getMaterialRequisitions({ query: ctx.query });

  ctx.body = {
    code: 200,
    message: 'success',
    data
  };
};

export default {
  getMaintenancePlans, createMaintenancePlan, updateMaintenancePlan, deleteMaintenancePlan,
  getMaintenanceRecords, createMaintenanceRecord,
  getFaultReports, createFaultReport, assignFaultReport,
  getRepairRecords, getRepairRecordById, createRepairRecord, updateRepairRecord,
  submitRepairRecord, dispatchRepairRecord, startRepair, completeRepair,
  verifyRepairRecord, deleteRepairRecord,
  createMaterialRequisition, getMaterialRequisitions
};



