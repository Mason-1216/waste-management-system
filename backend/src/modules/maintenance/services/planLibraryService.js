import { Op } from 'sequelize';
import dayjs from 'dayjs';
import { MaintenancePlanLibrary, MaintenanceAssignment, Station, User } from '../../../models/index.js';
import { createError } from '../../../middlewares/error.js';
import { getPagination, formatPaginationResponse, getOrderBy, generateRecordCode } from '../../../utils/helpers.js';

const resolveScopedStationId = (user, headerStationId) => {
  if (!user) return null;
  const roleCode = user.baseRoleCode ? user.baseRoleCode : user.roleCode;
  if (roleCode === 'client') {
    const stations = Array.isArray(user.stations) ? user.stations : [];
    if (stations.length > 0) return stations[0].id;
    return null;
  }
  if (roleCode === 'operator' || roleCode === 'station_manager') {
    const stations = Array.isArray(user.stations) ? user.stations : [];
    const parsedHeaderId = headerStationId ? parseInt(headerStationId, 10) : null;
    if (parsedHeaderId && stations.some(station => station.id === parsedHeaderId)) {
      return parsedHeaderId;
    }
    if (user.lastStationId && stations.some(station => station.id === user.lastStationId)) {
      return user.lastStationId;
    }
    if (stations.length > 0) return stations[0].id;
    return null;
  }
  return null;
};

const parseOptionalInt = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const normalizePointsValue = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const normalizeText = (value) => {
  return String(value ?? '').replace(/\uFEFF/g, '').trim();
};

const normalizeStationKey = (value) => {
  return normalizeText(value).replace(/\s+/g, '').replace(/\u3000/g, '');
};

const normalizeCycleType = (value) => {
  const text = normalizeText(value);
  const map = {
    daily: 'daily',
    weekly: 'weekly',
    monthly: 'monthly',
    yearly: 'yearly',
    '日保养': 'daily',
    '周保养': 'weekly',
    '月保养': 'monthly',
    '年保养': 'yearly',
    '每日': 'daily',
    '每周': 'weekly',
    '每月': 'monthly',
    '每年': 'yearly'
  };
  return map[text] || '';
};

const normalizeMaintenanceStandards = (value) => {
  let normalized = value;
  if (typeof normalized === 'string') {
    try {
      normalized = JSON.parse(normalized);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(normalized)) return [];
  return normalized
    .map((item) => {
      if (typeof item === 'string') {
        return { name: item, specification: '', points: 0 };
      }
      return {
        name: String(item?.name ?? '').trim(),
        specification: String(item?.specification ?? '').trim(),
        points: normalizePointsValue(item?.points)
      };
    })
    .filter((item) => item.name || item.specification);
};

const inferCycleTypeFromSchedule = (record) => {
  if (record?.weekly_day !== null && record?.weekly_day !== undefined) return 'weekly';
  if (record?.monthly_day !== null && record?.monthly_day !== undefined) return 'monthly';
  if (record?.yearly_month !== null && record?.yearly_month !== undefined) return 'yearly';
  if (record?.yearly_day !== null && record?.yearly_day !== undefined) return 'yearly';
  return 'monthly';
};

// ============================================
// 淇濆吇璁″垝搴?
// ============================================

/**
 * 鑾峰彇淇濆吇璁″垝搴撳垪琛?
 * GET /api/maintenance-plan-library
 */
export const getMaintenancePlanLibrary = async (ctx) => {
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const order = getOrderBy(ctx.query);
  const { stationId, cycleType, keyword } = ctx.query;
  const user = ctx.state.user;
  const scopedStationId = resolveScopedStationId(user, ctx.headers['x-station-id']);

  const where = {};
  if (scopedStationId) {
    where.station_id = scopedStationId;
  } else if (stationId) {
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

  (result.rows || []).forEach((row) => {
    if (!row.cycle_type) {
      row.setDataValue('cycle_type', inferCycleTypeFromSchedule(row));
    }
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: formatPaginationResponse(result, page, pageSize)
  };
};

/**
 * 鏂板缓淇濆吇璁″垝
 * POST /api/maintenance-plan-library
 */
export const createMaintenancePlanLibrary = async (ctx) => {
  const { stationId, equipmentCode, equipmentName, installLocation, cycleType, maintenanceStandards, weeklyDay, monthlyDay, yearlyMonth, yearlyDay } = ctx.request.body;
  const user = ctx.state.user;

  if (!equipmentCode || !equipmentName) {
    throw createError(400, 'Equipment code and name are required');
  }

  if (!cycleType) {
    throw createError(400, '淇濆吇鍛ㄦ湡涓嶈兘涓虹┖');
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
    maintenance_standards: normalizeMaintenanceStandards(maintenanceStandards),
    created_by: user.id,
    created_by_name: user.realName
  });

  ctx.body = {
    code: 200,
    message: '鍒涘缓鎴愬姛',
    data: { id: record.id }
  };
};

/**
 * 鏇存柊淇濆吇璁″垝
 * PUT /api/maintenance-plan-library/:id
 */
export const updateMaintenancePlanLibrary = async (ctx) => {
  const { id } = ctx.params;
  const { stationId, equipmentCode, equipmentName, installLocation, cycleType, maintenanceStandards, weeklyDay, monthlyDay, yearlyMonth, yearlyDay } = ctx.request.body;

  const record = await MaintenancePlanLibrary.findByPk(id);
  if (!record) {
    throw createError(404, 'Not found');
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
    maintenance_standards: maintenanceStandards !== undefined ? normalizeMaintenanceStandards(maintenanceStandards) : record.maintenance_standards
  });

  ctx.body = {
    code: 200,
    message: '鏇存柊鎴愬姛',
    data: null
  };
};

/**
 * 鍒犻櫎淇濆吇璁″垝
 * DELETE /api/maintenance-plan-library/:id
 */
export const deleteMaintenancePlanLibrary = async (ctx) => {
  const { id } = ctx.params;

  const record = await MaintenancePlanLibrary.findByPk(id);
  if (!record) {
    throw createError(404, 'Not found');
  }

  await record.destroy();

  ctx.body = {
    code: 200,
    message: '鍒犻櫎鎴愬姛',
    data: null
  };
};

/**
 * 鎵归噺瀵煎叆淇濆吇璁″垝
 * POST /api/maintenance-plan-library/batch-import
 */
export const batchImportMaintenancePlanLibrary = async (ctx) => {
  const { plans } = ctx.request.body;
  const user = ctx.state.user;
  const scopedStationId = resolveScopedStationId(user, ctx.headers['x-station-id']);

  if (!plans || !Array.isArray(plans) || plans.length === 0) {
    throw createError(400, '瀵煎叆鏁版嵁涓嶈兘涓虹┖');
  }

  // 鑾峰彇鎵€鏈夊満绔欑敤浜庡悕绉板尮閰?
  const stations = await Station.findAll({ attributes: ['id', 'station_name'] });
  const stationMap = new Map();
  const stationNormalizedMap = new Map();
  stations.forEach((station) => {
    const name = normalizeText(station.station_name);
    if (!name) return;
    stationMap.set(name, station.id);
    stationNormalizedMap.set(normalizeStationKey(name), station.id);
  });

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
        results.errors.push(`绗?{rowNum}琛? 璁惧缂栧彿涓嶈兘涓虹┖`);
        continue;
      }

      if (!plan.equipmentName || !plan.equipmentName.trim()) {
        results.failed++;
        results.errors.push(`绗?{rowNum}琛? 璁惧鍚嶇О涓嶈兘涓虹┖`);
        continue;
      }

      // 鏌ユ壘鍦虹珯ID
      let stationId = parseOptionalInt(plan.stationId ?? plan.station_id);
      const stationName = normalizeText(plan.stationName ?? plan.station_name ?? plan.station);
      if (!stationId && stationName) {
        let resolvedStationId = stationMap.get(stationName);
        if (!resolvedStationId) {
          resolvedStationId = stationNormalizedMap.get(normalizeStationKey(stationName));
        }
        stationId = resolvedStationId ? resolvedStationId : null;
      }
      if (!stationId && scopedStationId) {
        stationId = scopedStationId;
      }
      if (!stationId) {
        results.failed++;
        results.errors.push(`Row ${rowNum}: station not found or not bound`);
        continue;
      }

      let resolvedCycleType = normalizeCycleType(plan.cycleType ?? plan.cycle_type ?? plan.cycle ?? plan.cycleLabel ?? plan.cycle_label);
      const parsedWeeklyDay = parseOptionalInt(plan.weeklyDay ?? plan.weekly_day);
      const parsedMonthlyDay = parseOptionalInt(plan.monthlyDay ?? plan.monthly_day);
      const parsedYearlyMonth = parseOptionalInt(plan.yearlyMonth ?? plan.yearly_month);
      const parsedYearlyDay = parseOptionalInt(plan.yearlyDay ?? plan.yearly_day);
      if (!resolvedCycleType && parsedWeeklyDay !== null) {
        resolvedCycleType = 'weekly';
      }
      if (!resolvedCycleType && parsedMonthlyDay !== null) {
        resolvedCycleType = 'monthly';
      }
      if (!resolvedCycleType && (parsedYearlyMonth !== null || parsedYearlyDay !== null)) {
        resolvedCycleType = 'yearly';
      }
      const finalCycleType = resolvedCycleType ? resolvedCycleType : 'monthly';
      const weeklyDay = finalCycleType === 'weekly' ? parsedWeeklyDay : null;
      const monthlyDay = finalCycleType === 'monthly' ? parsedMonthlyDay : null;
      const yearlyMonth = finalCycleType === 'yearly' ? parsedYearlyMonth : null;
      const yearlyDay = finalCycleType === 'yearly' ? parsedYearlyDay : null;

      await MaintenancePlanLibrary.create({
        station_id: stationId,
        equipment_code: plan.equipmentCode.trim(),
        equipment_name: plan.equipmentName.trim(),
        install_location: (plan.installLocation || '').trim(),
        cycle_type: finalCycleType,
        weekly_day: weeklyDay,
        monthly_day: monthlyDay,
        yearly_month: yearlyMonth,
        yearly_day: yearlyDay,
        maintenance_standards: normalizeMaintenanceStandards(plan.maintenanceStandards ?? plan.maintenance_standards),
        created_by: user.id,
        created_by_name: user.realName
      });

      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push(`绗?{rowNum}琛? ${err.message}`);
    }
  }

  ctx.body = {
    code: 200,
    message: `Import done: success ${results.success}, failed ${results.failed}`,
    data: results
  };
};

// ============================================
// 淇濆吇宸ヤ綔鍒嗛厤
// ============================================

/**
 * 鑾峰彇淇濆吇宸ヤ綔鍒嗛厤鍒楄〃
 * GET /api/maintenance-assignments
 */
export const getMaintenanceAssignments = async (ctx) => {
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const order = getOrderBy(ctx.query);
  const { stationId, status, startDate, endDate, executorId } = ctx.query;
  const dataFilter = ctx.state.dataFilter;
  const user = ctx.state.user;
  const scopedStationId = resolveScopedStationId(user, ctx.headers['x-station-id']);

  const where = {};
  if (scopedStationId) {
    where.station_id = scopedStationId;
  } else if (stationId) {
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

  // 鏁版嵁鏉冮檺杩囨护
  if (!dataFilter.all) {
    if (!scopedStationId && dataFilter.stationIds?.length > 0) {
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
 * 鍒涘缓淇濆吇宸ヤ綔鍒嗛厤
 * POST /api/maintenance-assignments
 */
export const createMaintenanceAssignment = async (ctx) => {
  const { stationId, planId, cycleType, equipmentCode, equipmentName, installLocation, executorId, executorName, assignerName, planStartDate, planEndDate, planStartTime, planEndTime } = ctx.request.body;
  const user = ctx.state.user;

  if (!stationId || !equipmentCode || !equipmentName || !executorId) {
    throw createError(400, 'Invalid request');
  }

  let maintenanceItems = [];
  let resolvedCycleType = cycleType || null;
  let resolvedPlanId = planId || null;
  if (planId) {
    const plan = await MaintenancePlanLibrary.findByPk(planId);
    resolvedCycleType = plan?.cycle_type || resolvedCycleType;
    if (!resolvedCycleType) {
      const standards = normalizeMaintenanceStandards(plan?.maintenance_standards);
      maintenanceItems = standards.map(item => ({
        name: item?.name || '',
        specification: item?.specification || '',
        points: normalizePointsValue(item?.points),
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
      const standards = relatedPlans.flatMap(planItem => normalizeMaintenanceStandards(planItem?.maintenance_standards));
      maintenanceItems = standards.map(item => ({
        name: item?.name || '',
        specification: item?.specification || '',
        points: normalizePointsValue(item?.points),
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
    message: '淇濆吇浠诲姟鍒嗛厤鎴愬姛',
    data: { id: assignment.id, assignmentCode: assignment.assignment_code }
  };
};

/**
 * 鏇存柊淇濆吇宸ヤ綔鍒嗛厤
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
    throw createError(404, 'Not found');
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
    message: '鏇存柊鎴愬姛',
    data: null
  };
};

/**
 * 鍒犻櫎淇濆吇宸ヤ綔鍒嗛厤
 * DELETE /api/maintenance-assignments/:id
 */
export const deleteMaintenanceAssignment = async (ctx) => {
  const { id } = ctx.params;

  const assignment = await MaintenanceAssignment.findByPk(id);
  if (!assignment) {
    throw createError(404, 'Not found');
  }

  await assignment.destroy();

  ctx.body = {
    code: 200,
    message: '鍒犻櫎鎴愬姛',
    data: null
  };
};

/**
 * 寮€濮嬩繚鍏讳换鍔?
 * PUT /api/maintenance-assignments/:id/start
 */
export const startMaintenanceAssignment = async (ctx) => {
  const { id } = ctx.params;

  const assignment = await MaintenanceAssignment.findByPk(id);
  if (!assignment) {
    throw createError(404, 'Not found');
  }

  const now = new Date();
  await assignment.update({
    status: 'in_progress',
    actual_start_date: assignment.actual_start_date || now,
    actual_start_time: assignment.actual_start_time || now
  });

  ctx.body = {
    code: 200,
    message: 'Task started',
    data: null
  };
};

/**
 * 瀹屾垚淇濆吇浠诲姟
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
    throw createError(404, 'Not found');
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
    message: 'Task completed',
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
