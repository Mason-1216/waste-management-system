import { Op } from 'sequelize';
import dayjs from 'dayjs';
import { MaintenancePlanLibrary, MaintenanceAssignment, Station, User } from '../models/index.js';
import { createError } from '../middlewares/error.js';
import { getPagination, formatPaginationResponse, getOrderBy, generateRecordCode } from '../utils/helpers.js';

// ============================================
// 保养计划库
// ============================================

/**
 * 获取保养计划库列表
 * GET /api/maintenance-plan-library
 */
export const getMaintenancePlanLibrary = async (ctx) => {
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const order = getOrderBy(ctx.query);
  const { stationId, cycleType, keyword } = ctx.query;

  const where = {};

  if (stationId) {
    where.station_id = stationId;
  }

  if (cycleType) {
    where.cycle_type = cycleType;
  }

  if (keyword) {
    where[Op.or] = [
      { equipment_name: { [Op.like]: `%${keyword}%` } },
      { equipment_code: { [Op.like]: `%${keyword}%` } }
    ];
  }

  const result = await MaintenancePlanLibrary.findAndCountAll({
    where,
    include: [
      { model: Station, as: 'station', attributes: ['id', 'station_name'] },
      { model: User, as: 'creator', attributes: ['id', 'real_name'] }
    ],
    offset,
    limit,
    order: order.length ? order : [['created_at', 'DESC']],
    distinct: true
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: formatPaginationResponse(result, page, pageSize)
  };
};

/**
 * 新建保养计划
 * POST /api/maintenance-plan-library
 */
export const createMaintenancePlanLibrary = async (ctx) => {
  const { stationId, equipmentCode, equipmentName, installLocation, cycleType, maintenanceStandards, weeklyDay, monthlyDay, yearlyMonth, yearlyDay } = ctx.request.body;
  const user = ctx.state.user;

  if (!equipmentCode || !equipmentName) {
    throw createError(400, '设备编号和设备名称不能为空');
  }

  if (!cycleType) {
    throw createError(400, '保养周期不能为空');
  }

  const record = await MaintenancePlanLibrary.create({
    station_id: stationId ? parseInt(stationId) : null,
    equipment_code: equipmentCode,
    equipment_name: equipmentName,
    install_location: installLocation,
    cycle_type: cycleType,
    weekly_day: weeklyDay || null,
    monthly_day: monthlyDay || null,
    yearly_month: yearlyMonth || null,
    yearly_day: yearlyDay || null,
    maintenance_standards: maintenanceStandards || [],
    created_by: user.id,
    created_by_name: user.realName
  });

  ctx.body = {
    code: 200,
    message: '创建成功',
    data: { id: record.id }
  };
};

/**
 * 更新保养计划
 * PUT /api/maintenance-plan-library/:id
 */
export const updateMaintenancePlanLibrary = async (ctx) => {
  const { id } = ctx.params;
  const { stationId, equipmentCode, equipmentName, installLocation, cycleType, maintenanceStandards, weeklyDay, monthlyDay, yearlyMonth, yearlyDay } = ctx.request.body;

  const record = await MaintenancePlanLibrary.findByPk(id);
  if (!record) {
    throw createError(404, '保养计划不存在');
  }

  await record.update({
    station_id: stationId !== undefined ? (stationId ? parseInt(stationId) : null) : record.station_id,
    equipment_code: equipmentCode ?? record.equipment_code,
    equipment_name: equipmentName ?? record.equipment_name,
    install_location: installLocation ?? record.install_location,
    cycle_type: cycleType ?? record.cycle_type,
    weekly_day: weeklyDay !== undefined ? (weeklyDay || null) : record.weekly_day,
    monthly_day: monthlyDay !== undefined ? (monthlyDay || null) : record.monthly_day,
    yearly_month: yearlyMonth !== undefined ? (yearlyMonth || null) : record.yearly_month,
    yearly_day: yearlyDay !== undefined ? (yearlyDay || null) : record.yearly_day,
    maintenance_standards: maintenanceStandards ?? record.maintenance_standards
  });

  ctx.body = {
    code: 200,
    message: '更新成功',
    data: null
  };
};

/**
 * 删除保养计划
 * DELETE /api/maintenance-plan-library/:id
 */
export const deleteMaintenancePlanLibrary = async (ctx) => {
  const { id } = ctx.params;

  const record = await MaintenancePlanLibrary.findByPk(id);
  if (!record) {
    throw createError(404, '保养计划不存在');
  }

  await record.destroy();

  ctx.body = {
    code: 200,
    message: '删除成功',
    data: null
  };
};

/**
 * 批量导入保养计划
 * POST /api/maintenance-plan-library/batch-import
 */
export const batchImportMaintenancePlanLibrary = async (ctx) => {
  const { plans } = ctx.request.body;
  const user = ctx.state.user;

  if (!plans || !Array.isArray(plans) || plans.length === 0) {
    throw createError(400, '导入数据不能为空');
  }

  // 获取所有场站用于名称匹配
  const stations = await Station.findAll({ attributes: ['id', 'station_name'] });
  const stationMap = new Map(stations.map(s => [s.station_name, s.id]));

  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  for (let i = 0; i < plans.length; i++) {
    const plan = plans[i];
    const rowNum = i + 2;

    try {
      if (!plan.equipmentCode || !plan.equipmentCode.trim()) {
        results.failed++;
        results.errors.push(`第${rowNum}行: 设备编号不能为空`);
        continue;
      }

      if (!plan.equipmentName || !plan.equipmentName.trim()) {
        results.failed++;
        results.errors.push(`第${rowNum}行: 设备名称不能为空`);
        continue;
      }

      // 查找场站ID
      let stationId = null;
      if (plan.stationName && plan.stationName.trim()) {
        stationId = stationMap.get(plan.stationName.trim()) || null;
      }

      await MaintenancePlanLibrary.create({
        station_id: stationId,
        equipment_code: plan.equipmentCode.trim(),
        equipment_name: plan.equipmentName.trim(),
        install_location: (plan.installLocation || '').trim(),
        cycle_type: plan.cycleType || 'monthly',
        maintenance_standards: plan.maintenanceStandards || [],
        created_by: user.id,
        created_by_name: user.realName
      });

      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push(`第${rowNum}行: ${err.message}`);
    }
  }

  ctx.body = {
    code: 200,
    message: `导入完成: 成功${results.success}条, 失败${results.failed}条`,
    data: results
  };
};

// ============================================
// 保养工作分配
// ============================================

/**
 * 获取保养工作分配列表
 * GET /api/maintenance-assignments
 */
export const getMaintenanceAssignments = async (ctx) => {
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const order = getOrderBy(ctx.query);
  const { stationId, status, startDate, endDate, executorId } = ctx.query;
  const dataFilter = ctx.state.dataFilter;

  const where = {};

  if (stationId) {
    where.station_id = stationId;
  }

  if (status) {
    where.status = status;
  }

  if (executorId) {
    where.executor_id = executorId;
  }

  if (startDate && endDate) {
    where.plan_start_date = { [Op.between]: [startDate, endDate] };
  }

  // 数据权限过滤
  if (!dataFilter.all) {
    if (dataFilter.stationIds?.length > 0) {
      where.station_id = { [Op.in]: dataFilter.stationIds };
    }
    if (dataFilter.userId) {
      where[Op.or] = [
        { executor_id: dataFilter.userId },
        { assigner_id: dataFilter.userId }
      ];
    }
  }

  const result = await MaintenanceAssignment.findAndCountAll({
    where,
    include: [
      { model: Station, as: 'station', attributes: ['id', 'station_name'] },
      { model: User, as: 'executor', attributes: ['id', 'real_name'] },
      { model: User, as: 'assigner', attributes: ['id', 'real_name'] },
      { model: MaintenancePlanLibrary, as: 'plan', attributes: ['id', 'cycle_type', 'maintenance_standards'] }
    ],
    offset,
    limit,
    order: order.length ? order : [['created_at', 'DESC']],
    distinct: true
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: formatPaginationResponse(result, page, pageSize)
  };
};

/**
 * 创建保养工作分配
 * POST /api/maintenance-assignments
 */
export const createMaintenanceAssignment = async (ctx) => {
  const { stationId, planId, cycleType, equipmentCode, equipmentName, installLocation, executorId, executorName, assignerName, planStartDate, planEndDate, planStartTime, planEndTime } = ctx.request.body;
  const user = ctx.state.user;

  if (!stationId || !equipmentCode || !equipmentName || !executorId) {
    throw createError(400, '场站、设备信息和执行人不能为空');
  }

  let maintenanceItems = [];
  let resolvedCycleType = cycleType || null;
  let resolvedPlanId = planId || null;
  if (planId) {
    const plan = await MaintenancePlanLibrary.findByPk(planId);
    resolvedCycleType = plan?.cycle_type || resolvedCycleType;
    if (!resolvedCycleType) {
      const standards = Array.isArray(plan?.maintenance_standards) ? plan.maintenance_standards : [];
      maintenanceItems = standards.map(item => ({
        name: item?.name || '',
        specification: item?.specification || '',
        checked: false,
        remark: ''
      }));
    } else {
      const relatedPlans = await MaintenancePlanLibrary.findAll({
        where: {
          station_id: stationId,
          equipment_code: equipmentCode,
          equipment_name: equipmentName,
          install_location: installLocation,
          cycle_type: resolvedCycleType
        }
      });
      const standards = relatedPlans.flatMap(planItem => (
        Array.isArray(planItem?.maintenance_standards) ? planItem.maintenance_standards : []
      ));
      maintenanceItems = standards.map(item => ({
        name: item?.name || '',
        specification: item?.specification || '',
        checked: false,
        remark: ''
      }));
      if (relatedPlans.length > 0) {
        resolvedPlanId = relatedPlans[0].id;
      }
    }
  }

  const assignment = await MaintenanceAssignment.create({
    assignment_code: generateRecordCode('MA'),
    station_id: stationId,
    plan_id: resolvedPlanId,
    cycle_type: resolvedCycleType,
    equipment_code: equipmentCode,
    equipment_name: equipmentName,
    install_location: installLocation,
    executor_id: executorId,
    executor_name: executorName,
    assigner_id: user.id,
    assigner_name: assignerName || user.realName,
    plan_start_date: planStartDate,
    plan_start_time: planStartTime,
    plan_end_date: planEndDate,
    plan_end_time: planEndTime,
    maintenance_items: maintenanceItems,
    consumables_list: [],
    parts_list: [],
    status: 'pending'
  });

  ctx.body = {
    code: 200,
    message: '保养任务分配成功',
    data: { id: assignment.id, assignmentCode: assignment.assignment_code }
  };
};

/**
 * 更新保养工作分配
 * PUT /api/maintenance-assignments/:id
 */
export const updateMaintenanceAssignment = async (ctx) => {
  const { id } = ctx.params;
  const {
    status,
    actualStartDate,
    actualStartTime,
    actualEndDate,
    actualEndTime,
    completionNote,
    workHours,
    maintenanceItems,
    maintenanceContent,
    maintenanceTools,
    maintenanceResult,
    observeDays,
    unsolvedReason,
    consumablesList,
    partsList
  } = ctx.request.body;

  const assignment = await MaintenanceAssignment.findByPk(id);
  if (!assignment) {
    throw createError(404, '保养分配记录不存在');
  }

  const updateData = {
    status: status ?? assignment.status,
    actual_start_date: actualStartDate ?? assignment.actual_start_date,
    actual_start_time: actualStartTime ?? assignment.actual_start_time,
    actual_end_date: actualEndDate ?? assignment.actual_end_date,
    actual_end_time: actualEndTime ?? assignment.actual_end_time,
    completion_note: completionNote ?? assignment.completion_note,
    work_hours: workHours ?? assignment.work_hours,
    maintenance_items: maintenanceItems ?? assignment.maintenance_items,
    maintenance_content: maintenanceContent ?? assignment.maintenance_content,
    maintenance_tools: maintenanceTools ?? assignment.maintenance_tools,
    maintenance_result: maintenanceResult ?? assignment.maintenance_result,
    observe_days: observeDays ?? assignment.observe_days,
    unsolved_reason: unsolvedReason ?? assignment.unsolved_reason,
    consumables_list: consumablesList ?? assignment.consumables_list,
    parts_list: partsList ?? assignment.parts_list
  };

  if (status === 'completed') {
    if (!updateData.actual_end_date) updateData.actual_end_date = new Date();
    if (!updateData.actual_end_time) updateData.actual_end_time = new Date();
  }

  await assignment.update(updateData);

  ctx.body = {
    code: 200,
    message: '更新成功',
    data: null
  };
};

/**
 * 删除保养工作分配
 * DELETE /api/maintenance-assignments/:id
 */
export const deleteMaintenanceAssignment = async (ctx) => {
  const { id } = ctx.params;

  const assignment = await MaintenanceAssignment.findByPk(id);
  if (!assignment) {
    throw createError(404, '保养分配记录不存在');
  }

  await assignment.destroy();

  ctx.body = {
    code: 200,
    message: '删除成功',
    data: null
  };
};

/**
 * 开始保养任务
 * PUT /api/maintenance-assignments/:id/start
 */
export const startMaintenanceAssignment = async (ctx) => {
  const { id } = ctx.params;

  const assignment = await MaintenanceAssignment.findByPk(id);
  if (!assignment) {
    throw createError(404, '保养分配记录不存在');
  }

  const now = new Date();
  await assignment.update({
    status: 'in_progress',
    actual_start_date: assignment.actual_start_date || now,
    actual_start_time: assignment.actual_start_time || now
  });

  ctx.body = {
    code: 200,
    message: '任务已开始',
    data: null
  };
};

/**
 * 完成保养任务
 * PUT /api/maintenance-assignments/:id/complete
 */
export const completeMaintenanceAssignment = async (ctx) => {
  const { id } = ctx.params;
  const {
    completionNote,
    workHours,
    actualEndDate,
    actualEndTime,
    maintenanceContent,
    maintenanceTools,
    consumablesList,
    partsList
  } = ctx.request.body;

  const assignment = await MaintenanceAssignment.findByPk(id);
  if (!assignment) {
    throw createError(404, '保养分配记录不存在');
  }

  const now = new Date();
  await assignment.update({
    status: 'pending_verify',
    actual_end_date: actualEndDate || now,
    actual_end_time: actualEndTime || now,
    completion_note: completionNote ?? assignment.completion_note,
    work_hours: workHours ?? assignment.work_hours,
    maintenance_content: maintenanceContent ?? assignment.maintenance_content,
    maintenance_tools: maintenanceTools ?? assignment.maintenance_tools,
    consumables_list: consumablesList ?? assignment.consumables_list,
    parts_list: partsList ?? assignment.parts_list
  });

  ctx.body = {
    code: 200,
    message: '任务已完成',
    data: null
  };
};


/**
 * Verify maintenance assignment
 * POST /api/maintenance-assignments/:id/verify
 */
export const verifyMaintenanceAssignment = async (ctx) => {
  const { id } = ctx.params;
  const {
    result,
    verifyComment,
    verifySafety,
    verifyQuality,
    verifyProgress,
    verifyHygiene
  } = ctx.request.body;
  const user = ctx.state.user;

  const assignment = await MaintenanceAssignment.findByPk(id);
  if (!assignment) {
    throw createError(404, 'maintenance assignment not found');
  }

  if (!['pending_verify', 'completed'].includes(assignment.status)) {
    throw createError(400, 'only pending verify can be verified');
  }

  await assignment.update({
    status: result == 'pass' ? 'accepted' : 'in_progress',
    verify_by_id: user.id,
    verify_by_name: user.realName || user.username,
    verify_date: dayjs().format('YYYY-MM-DD'),
    verify_time: dayjs().format('HH:mm'),
    verify_comment: verifyComment ?? assignment.verify_comment,
    verify_safety: verifySafety ?? assignment.verify_safety,
    verify_quality: verifyQuality ?? assignment.verify_quality,
    verify_progress: verifyProgress ?? assignment.verify_progress,
    verify_hygiene: verifyHygiene ?? assignment.verify_hygiene
  });

  ctx.body = {
    code: 200,
    message: result == 'pass' ? 'verify passed' : 'verify rejected',
    data: null
  };
};

export default {
  getMaintenancePlanLibrary,
  createMaintenancePlanLibrary,
  updateMaintenancePlanLibrary,
  deleteMaintenancePlanLibrary,
  batchImportMaintenancePlanLibrary,
  getMaintenanceAssignments,
  createMaintenanceAssignment,
  updateMaintenanceAssignment,
  deleteMaintenanceAssignment,
  startMaintenanceAssignment,
  completeMaintenanceAssignment,
  verifyMaintenanceAssignment
};
