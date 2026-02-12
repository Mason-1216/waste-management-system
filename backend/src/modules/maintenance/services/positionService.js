import { MaintenancePositionPlan, MaintenancePlanLibrary, MaintenanceWorkRecord, Station, User, Schedule } from '../../../models/index.js';
import { Op } from 'sequelize';
import { createError } from '../../../middlewares/error.js';
import { getPagination, formatPaginationResponse } from '../../../utils/helpers.js';
import sequelize from '../../../config/database.js';
	import dayjs from 'dayjs';
	import { validateBody, validateParams, validateQuery } from '../../core/validators/validate.js'; 
	import { 
	  createMaintenancePositionPlanBodySchema, 
	  batchImportMaintenancePositionPlansBodySchema,
	  getMaintenancePositionPlansQuerySchema, 
	  getMaintenanceWorkRecordsQuerySchema, 
	  getTodayMaintenanceTasksQuerySchema, 
	  idParamSchema, 
	  submitMaintenanceWorkRecordBodySchema, 
	  verifyMaintenanceWorkRecordBodySchema
	} from '../validators/positionSchemas.js'; 

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

const normalizeImportText = (value) => String(value ?? '').replace(/\uFEFF/g, '').trim();
const normalizeStationKey = (value) => normalizeImportText(value).replace(/\s+/g, '').replace(/\u3000/g, '');
const parseOptionalInt = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number.parseInt(String(value).trim(), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const buildStationLookup = async () => {
  const stations = await Station.findAll({ attributes: ['id', 'station_name'] });
  const stationNameToId = new Map();
  const stationNormalizedNameToId = new Map();
  const stationIdToName = new Map();

  stations.forEach((station) => {
    const name = normalizeImportText(station.station_name);
    if (!name) return;
    stationNameToId.set(name, station.id);
    stationNormalizedNameToId.set(normalizeStationKey(name), station.id);
    stationIdToName.set(station.id, station.station_name);
  });

  return { stationNameToId, stationNormalizedNameToId, stationIdToName };
};

const resolveImportStationId = ({ row, scopedStationId, stationNameToId, stationNormalizedNameToId }) => {
  const stationId = parseOptionalInt(row.stationId);
  if (stationId) return stationId;

  const stationName = normalizeImportText(row.stationName);
  if (stationName) {
    return stationNameToId.get(stationName) ?? stationNormalizedNameToId.get(normalizeStationKey(stationName)) ?? null;
  }
  return scopedStationId ?? null;
};

const loadPlanIdsByEquipment = async ({ stationId, equipmentCode }) => {
  const plans = await MaintenancePlanLibrary.findAll({
    where: {
      equipment_code: equipmentCode,
      is_deleted: false,
      [Op.or]: [
        { station_id: stationId },
        { station_id: null }
      ]
    },
    attributes: ['id']
  });
  return plans.map((plan) => plan.id).filter(Boolean);
};

const inspectPositionAssignmentState = async ({ stationId, planIds, positionName }) => {
  const existingAssignments = await MaintenancePositionPlan.findAll({
    where: {
      station_id: stationId,
      plan_id: { [Op.in]: planIds }
    },
    attributes: ['plan_id', 'position_name']
  });

  if (existingAssignments.length === 0) {
    return {
      action: 'create',
      existingPositions: []
    };
  }

  const existingPositions = Array.from(
    new Set(existingAssignments.map((item) => normalizeImportText(item.position_name)).filter(Boolean))
  );
  const targetPlanIdSet = new Set(
    existingAssignments
      .filter((item) => normalizeImportText(item.position_name) === positionName)
      .map((item) => item.plan_id)
  );
  const allPlanIdsAssignedToTarget = planIds.every((planId) => targetPlanIdSet.has(planId));
  const onlyTargetPosition = existingPositions.length === 1 && existingPositions[0] === positionName;

  if (onlyTargetPosition && allPlanIdsAssignedToTarget) {
    return {
      action: 'skip',
      existingPositions
    };
  }

  return {
    action: 'update',
    existingPositions
  };
};

const normalizePointsValue = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
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

const formatDate = (value) => dayjs(value).format('YYYY-MM-DD');

const getWeekStart = (date) => {
  const day = date.day() || 7;
  return date.subtract(day - 1, 'day').startOf('day');
};

const getPeriodRange = (date, cycleType) => {
  const base = dayjs(date).startOf('day');
  switch (cycleType) {
    case 'daily':
      return { start: base, end: base };
    case 'weekly': {
      const start = getWeekStart(base);
      return { start, end: start.add(6, 'day') };
    }
    case 'monthly': {
      const start = base.startOf('month');
      const end = base.endOf('month').startOf('day');
      return { start, end };
    }
    case 'yearly': {
      const start = base.startOf('year');
      const end = base.endOf('year').startOf('day');
      return { start, end };
    }
    default:
      return { start: base, end: base };
  }
};

const getPeriodKey = (date, cycleType) => {
  const base = dayjs(date);
  switch (cycleType) {
    case 'daily':
      return base.format('YYYY-MM-DD');
    case 'weekly':
      return getWeekStart(base).format('YYYY-MM-DD');
    case 'monthly':
      return base.format('YYYY-MM');
    case 'yearly':
      return base.format('YYYY');
    default:
      return base.format('YYYY-MM-DD');
  }
};

const getDueDateForPlan = (periodStart, cycleType, plan) => {
  if (!plan) return null;
  switch (cycleType) {
    case 'daily':
      return periodStart;
    case 'weekly': {
      const weeklyDay = Number.parseInt(plan.weekly_day, 10);
      if (!weeklyDay || weeklyDay < 1 || weeklyDay > 7) return null;
      return periodStart.add(weeklyDay - 1, 'day');
    }
    case 'monthly': {
      const monthlyDay = Number.parseInt(plan.monthly_day, 10);
      if (!monthlyDay || monthlyDay < 1) return null;
      const daysInMonth = periodStart.daysInMonth();
      if (monthlyDay > daysInMonth) return null;
      return periodStart.date(monthlyDay);
    }
    case 'yearly': {
      const yearlyMonth = Number.parseInt(plan.yearly_month, 10);
      const yearlyDay = Number.parseInt(plan.yearly_day, 10);
      if (!yearlyMonth || !yearlyDay) return null;
      const monthStart = dayjs(`${periodStart.year()}-${String(yearlyMonth).padStart(2, '0')}-01`);
      const daysInMonth = monthStart.isValid() ? monthStart.daysInMonth() : 0;
      if (yearlyDay < 1 || yearlyDay > daysInMonth) return null;
      return dayjs(`${periodStart.year()}-${String(yearlyMonth).padStart(2, '0')}-${String(yearlyDay).padStart(2, '0')}`).startOf('day');
    }
    default:
      return null;
  }
};

/**
 * 鑾峰彇浠婂ぉ闇€瑕佹墽琛岀殑淇濆吇鍛ㄦ湡绫诲瀷鍒楄〃
 * @param {Object} plan - 淇濆吇璁″垝瀵硅薄
 * @returns {Array} 闇€瑕佹墽琛岀殑鍛ㄦ湡绫诲瀷鍒楄〃
 */
const getTodayCycleTypes = (plan) => {
  const today = dayjs();
  const dayOfWeek = today.day() || 7; // dayjs鐨刣ay()杩斿洖0-6(鍛ㄦ棩-鍛ㄥ叚)锛岃浆鎹负1-7(鍛ㄤ竴-鍛ㄦ棩)
  const dayOfMonth = today.date();
  const monthOfYear = today.month() + 1;

  const cycleTypes = [];

  // 妫€鏌ユ棩淇濆吇
  if (plan.daily_enabled) {
    cycleTypes.push('daily');
  }

  // 妫€鏌ュ懆淇濆吇
  if (plan.weekly_enabled && plan.weekly_day === dayOfWeek) {
    cycleTypes.push('weekly');
  }

  // 妫€鏌ユ湀淇濆吇
  if (plan.monthly_enabled && plan.monthly_day === dayOfMonth) {
    cycleTypes.push('monthly');
  }

  // 妫€鏌ュ勾淇濆吇
  if (plan.yearly_enabled && plan.yearly_month === monthOfYear && plan.yearly_day === dayOfMonth) {
    cycleTypes.push('yearly');
  }

  return cycleTypes;
};

/**
 * 鍒ゆ柇浠婂ぉ鏄惁闇€瑕佹墽琛岃淇濆吇璁″垝锛堝吋瀹规棫鐗堝崟鍛ㄦ湡锛?
 * @param {Object} plan - 淇濆吇璁″垝瀵硅薄
 * @returns {boolean}
 */
const shouldExecuteToday = (plan) => {
  // 鏂扮増澶氬懆鏈?
  if (plan.daily_enabled !== undefined) {
    return getTodayCycleTypes(plan).length > 0;
  }

  // 鏃х増鍗曞懆鏈熷吋瀹?
  const today = dayjs();
  const dayOfWeek = today.day() || 7;
  const dayOfMonth = today.date();
  const monthOfYear = today.month() + 1;

  switch (plan.cycle_type) {
    case 'daily':
      return true;
    case 'weekly':
      return plan.weekly_day === dayOfWeek;
    case 'monthly':
      return plan.monthly_day === dayOfMonth;
    case 'yearly':
      return plan.yearly_month === monthOfYear && plan.yearly_day === dayOfMonth;
    default:
      return false;
  }
};

/**
 * 鑾峰彇宀椾綅-淇濆吇璁″垝鍒嗛厤鍒楄〃
 * GET /api/maintenance-position-plans
 */
export const getMaintenancePositionPlans = async (ctx) => { 
  await validateQuery(ctx, getMaintenancePositionPlansQuerySchema); 
  const { stationId, positionName, equipmentCode, equipmentName, installLocation, cycleType } = ctx.query; 
  const user = ctx.state.user; 
  const scopedStationId = resolveScopedStationId(user, ctx.headers['x-station-id']); 
  const { page, pageSize, offset, limit } = getPagination(ctx.query); 
 
  const clauses = []; 
  const replacements = []; 
 
  if (scopedStationId) { 
    clauses.push('mpp.station_id = ?'); 
    replacements.push(scopedStationId); 
  } else if (stationId) { 
    clauses.push('mpp.station_id = ?'); 
    replacements.push(Number.parseInt(stationId, 10)); 
  } 
  if (positionName) { 
    clauses.push('mpp.position_name = ?'); 
    replacements.push(positionName); 
  } 
 
  clauses.push('mpl.is_deleted = 0'); 
 
  if (equipmentCode) { 
    clauses.push('mpl.equipment_code LIKE ?'); 
    replacements.push(`%${equipmentCode}%`); 
  } 
  if (equipmentName) { 
    clauses.push('mpl.equipment_name LIKE ?'); 
    replacements.push(`%${equipmentName}%`); 
  } 
  if (installLocation) { 
    clauses.push('mpl.install_location LIKE ?'); 
    replacements.push(`%${installLocation}%`); 
  } 
  // 兼容旧客户端：保留 cycleType 过滤，但岗位分配维度不再按周期拆分展示 
  if (cycleType) { 
    clauses.push('mpl.cycle_type = ?'); 
    replacements.push(cycleType); 
  } 
 
  const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : ''; 
 
  const countSql = ` 
    SELECT COUNT(1) AS count 
    FROM ( 
      SELECT mpp.station_id, mpp.position_name, mpl.equipment_code 
      FROM maintenance_position_plans mpp 
      INNER JOIN maintenance_plan_library mpl ON mpl.id = mpp.plan_id 
      ${whereSql} 
      GROUP BY mpp.station_id, mpp.position_name, mpl.equipment_code 
    ) t 
  `; 
 
  const listSql = ` 
    SELECT 
      MIN(mpp.id) AS id, 
      mpp.station_id, 
      st.station_name, 
      mpp.position_name, 
      mpl.equipment_code, 
      MIN(mpl.equipment_name) AS equipment_name, 
      MIN(mpl.install_location) AS install_location, 
      MAX(mpp.created_at) AS last_created_at 
    FROM maintenance_position_plans mpp 
    INNER JOIN maintenance_plan_library mpl ON mpl.id = mpp.plan_id 
    LEFT JOIN stations st ON st.id = mpp.station_id 
    ${whereSql} 
    GROUP BY mpp.station_id, st.station_name, mpp.position_name, mpl.equipment_code 
    ORDER BY last_created_at DESC 
    LIMIT ? OFFSET ? 
  `; 
 
  const [countRows] = await sequelize.query(countSql, { replacements }); 
  const total = Number.parseInt(countRows?.[0]?.count, 10); 
  const resolvedTotal = Number.isNaN(total) ? 0 : total; 
 
  const [groupRows] = await sequelize.query(listSql, { replacements: [...replacements, limit, offset] }); 
  const rows = (Array.isArray(groupRows) ? groupRows : []).map((row) => ({ 
    id: row.id, 
    station_id: row.station_id, 
    position_name: row.position_name, 
    station: { station_name: row.station_name }, 
    plan: { 
      equipment_code: row.equipment_code, 
      equipment_name: row.equipment_name, 
      install_location: row.install_location 
    } 
  })); 
 
  ctx.body = { 
    code: 200, 
    message: 'success', 
    data: formatPaginationResponse({ rows, count: resolvedTotal }, page, pageSize) 
  }; 
}; 

/**
 * 鍒涘缓宀椾綅-淇濆吇璁″垝鍒嗛厤
 * POST /api/maintenance-position-plans
 */
export const createMaintenancePositionPlan = async (ctx) => { 
  const { stationId, positionName, planIds } = await validateBody(ctx, createMaintenancePositionPlanBodySchema); 
 
  if (!stationId || !positionName || !planIds || !planIds.length) { 
    throw createError(400, '鍦虹珯銆佸矖浣嶅拰淇濆吇璁″垝涓嶈兘涓虹┖'); 
  }

  const selectedPlans = await MaintenancePlanLibrary.findAll({ 
    where: { 
      id: { [Op.in]: planIds }, 
      is_deleted: false 
    }, 
    attributes: ['id', 'equipment_code'] 
  }); 

  const equipmentCodeSet = new Set(); 
  selectedPlans.forEach((plan) => { 
    if (plan?.equipment_code) equipmentCodeSet.add(plan.equipment_code); 
  }); 
  const equipmentCodes = Array.from(equipmentCodeSet); 

  let expandedPlanIds = planIds; 
  if (equipmentCodes.length > 0) { 
    const allPlans = await MaintenancePlanLibrary.findAll({ 
      where: { 
        equipment_code: { [Op.in]: equipmentCodes }, 
        is_deleted: false, 
        [Op.or]: [ 
          { station_id: stationId }, 
          { station_id: null } 
        ] 
      }, 
      attributes: ['id'] 
    }); 
    const allPlanIds = allPlans.map((plan) => plan.id).filter(Boolean); 
    if (allPlanIds.length > 0) { 
      expandedPlanIds = allPlanIds; 
    } 
  } 
 
  // 鎵归噺鍒涘缓鍒嗛厤璁板綍 
  const results = []; 
  const uniquePlanIds = Array.from(new Set(expandedPlanIds)); 
  for (const planId of uniquePlanIds) { 
    // 妫€鏌ユ槸鍚﹀凡瀛樺湪 
    const existing = await MaintenancePositionPlan.findOne({ 
      where: { station_id: stationId, position_name: positionName, plan_id: planId } 
    }); 
    if (!existing) {
      const record = await MaintenancePositionPlan.create({
        station_id: stationId,
        position_name: positionName,
        plan_id: planId
      });
      results.push(record);
    }
  }

  ctx.body = {
    code: 200,
    message: `Saved ${results.length} records`,
    data: results
  }; 
}; 

export const batchImportMaintenancePositionPlans = async (ctx) => {
  const { rows } = await validateBody(ctx, batchImportMaintenancePositionPlansBodySchema);
  const user = ctx.state.user;
  const scopedStationId = resolveScopedStationId(user, ctx.headers['x-station-id']);
  const { stationNameToId, stationNormalizedNameToId } = await buildStationLookup();

  const results = {
    success: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: []
  };
  const seen = new Set();

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i] ?? {};
    const rowNum = parseOptionalInt(row.rowNum) ?? (i + 2);

    try {
      const positionName = normalizeImportText(row.positionName);
      const equipmentCode = normalizeImportText(row.equipmentCode);

      if (!positionName) {
        results.failed += 1;
        results.errors.push(`第${rowNum}行 岗位不能为空`);
        continue;
      }
      if (!equipmentCode) {
        results.failed += 1;
        results.errors.push(`第${rowNum}行 设备编号不能为空`);
        continue;
      }

      const resolvedStationId = resolveImportStationId({
        row,
        scopedStationId,
        stationNameToId,
        stationNormalizedNameToId
      });
      if (!resolvedStationId) {
        results.failed += 1;
        results.errors.push(`第${rowNum}行 场站不能为空或无法识别`);
        continue;
      }

      const rowKey = `${resolvedStationId}::${equipmentCode}`;
      if (seen.has(rowKey)) {
        results.skipped += 1;
        continue;
      }
      seen.add(rowKey);

      const planIds = await loadPlanIdsByEquipment({ stationId: resolvedStationId, equipmentCode });
      if (planIds.length === 0) {
        results.failed += 1;
        results.errors.push(`第${rowNum}行 设备编号不存在或未配置保养计划（${equipmentCode}）`);
        continue;
      }

      const assignmentState = await inspectPositionAssignmentState({
        stationId: resolvedStationId,
        planIds,
        positionName
      });

      if (assignmentState.action === 'create') {
        await MaintenancePositionPlan.bulkCreate(
          planIds.map((planId) => ({
            station_id: resolvedStationId,
            position_name: positionName,
            plan_id: planId
          })),
          { ignoreDuplicates: true }
        );
        results.success += 1;
        continue;
      }

      if (assignmentState.action === 'skip') {
        results.skipped += 1;
        continue;
      }

      await sequelize.transaction(async (transaction) => {
        await MaintenancePositionPlan.destroy({
          where: {
            station_id: resolvedStationId,
            plan_id: { [Op.in]: planIds },
            position_name: { [Op.ne]: positionName }
          },
          transaction
        });

        await MaintenancePositionPlan.bulkCreate(
          planIds.map((planId) => ({
            station_id: resolvedStationId,
            position_name: positionName,
            plan_id: planId
          })),
          { ignoreDuplicates: true, transaction }
        );
      });
      results.updated += 1;
    } catch (err) {
      results.failed += 1;
      results.errors.push(`第${rowNum}行 ${err.message}`);
    }
  }

  ctx.body = {
    code: 200,
    message: `导入完成：新增${results.success}行，更新${results.updated}行，跳过${results.skipped}行，失败${results.failed}行`,
    data: results
  };
};

export const previewBatchImportMaintenancePositionPlans = async (ctx) => {
  const { rows } = await validateBody(ctx, batchImportMaintenancePositionPlansBodySchema);
  const user = ctx.state.user;
  const scopedStationId = resolveScopedStationId(user, ctx.headers['x-station-id']);
  const { stationNameToId, stationNormalizedNameToId, stationIdToName } = await buildStationLookup();

  const summary = { total: 0, create: 0, update: 0, skip: 0, error: 0 };
  const previewRows = [];
  const seen = new Set();

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i] ?? {};
    const rowNum = parseOptionalInt(row.rowNum) ?? (i + 2);
    const positionName = normalizeImportText(row.positionName);
    const equipmentCode = normalizeImportText(row.equipmentCode);
    const resolvedStationId = resolveImportStationId({
      row,
      scopedStationId,
      stationNameToId,
      stationNormalizedNameToId
    });
    const resolvedStationName = resolvedStationId ? (stationIdToName.get(resolvedStationId) ?? '') : normalizeImportText(row.stationName);

    const previewRow = {
      rowNum,
      action: 'error',
      message: '',
      diff: {},
      stationName: resolvedStationName,
      equipmentCode,
      positionName
    };
    summary.total += 1;

    if (!positionName) {
      previewRow.message = '岗位不能为空';
      summary.error += 1;
      previewRows.push(previewRow);
      continue;
    }
    if (!equipmentCode) {
      previewRow.message = '设备编号不能为空';
      summary.error += 1;
      previewRows.push(previewRow);
      continue;
    }
    if (!resolvedStationId) {
      previewRow.message = '场站不能为空或无法识别';
      summary.error += 1;
      previewRows.push(previewRow);
      continue;
    }

    const rowKey = `${resolvedStationId}::${equipmentCode}`;
    if (seen.has(rowKey)) {
      previewRow.action = 'skip';
      previewRow.message = '重复行，跳过';
      summary.skip += 1;
      previewRows.push(previewRow);
      continue;
    }
    seen.add(rowKey);

    const planIds = await loadPlanIdsByEquipment({ stationId: resolvedStationId, equipmentCode });
    if (planIds.length === 0) {
      previewRow.message = `设备编号不存在或未配置保养计划（${equipmentCode}）`;
      summary.error += 1;
      previewRows.push(previewRow);
      continue;
    }

    const assignmentState = await inspectPositionAssignmentState({
      stationId: resolvedStationId,
      planIds,
      positionName
    });

    if (assignmentState.action === 'create') {
      previewRow.action = 'create';
      previewRow.message = '将新增';
      summary.create += 1;
      previewRows.push(previewRow);
      continue;
    }

    if (assignmentState.action === 'skip') {
      previewRow.action = 'skip';
      previewRow.message = '无变更，跳过';
      summary.skip += 1;
      previewRows.push(previewRow);
      continue;
    }

    const beforePositions = assignmentState.existingPositions.filter((value) => value && value !== positionName);
    if (beforePositions.length > 0) {
      previewRow.diff.position_name = {
        from: beforePositions.join(' / '),
        to: positionName
      };
    }
    previewRow.action = 'update';
    previewRow.message = beforePositions.length > 0 ? '将更新' : '将更新（补齐计划关联）';
    summary.update += 1;
    previewRows.push(previewRow);
  }

  ctx.body = {
    code: 200,
    message: 'success',
    data: {
      summary,
      rows: previewRows
    }
  };
};

/** 
 * 鍒犻櫎宀椾綅-淇濆吇璁″垝鍒嗛厤 
 * DELETE /api/maintenance-position-plans/:id 
 */ 
export const deleteMaintenancePositionPlan = async (ctx) => { 
  const { id } = await validateParams(ctx, idParamSchema); 
 
  const record = await MaintenancePositionPlan.findByPk(id, { 
    include: [ 
      { model: MaintenancePlanLibrary, as: 'plan', attributes: ['id', 'equipment_code'] } 
    ] 
  }); 
  if (!record) { 
    throw createError(404, 'Not found'); 
  } 
 
  const equipmentCode = record.plan?.equipment_code; 
  if (!equipmentCode) { 
    await record.destroy(); 
    ctx.body = { 
      code: 200, 
      message: '删除成功' 
    }; 
    return; 
  } 
 
  const planIdRows = await MaintenancePlanLibrary.findAll({ 
    where: { 
      equipment_code: equipmentCode, 
      [Op.or]: [ 
        { station_id: record.station_id }, 
        { station_id: null } 
      ] 
    }, 
    attributes: ['id'] 
  }); 
 
  const planIds = planIdRows.map((item) => item.id).filter(Boolean); 
  const resolvedPlanIds = planIds.length > 0 ? planIds : [record.plan_id]; 
 
  await MaintenancePositionPlan.destroy({ 
    where: { 
      station_id: record.station_id, 
      position_name: record.position_name, 
      plan_id: { [Op.in]: resolvedPlanIds } 
    } 
  }); 
 
  ctx.body = { 
    code: 200, 
    message: '删除成功' 
  }; 
}; 

/**
 * 鑾峰彇鍛樺伐浠婃棩淇濆吇浠诲姟
 * GET /api/maintenance-work-records/today-tasks
 */
export const getTodayMaintenanceTasks = async (ctx) => {
  await validateQuery(ctx, getTodayMaintenanceTasksQuerySchema);
  const user = ctx.state.user;
  const dataFilter = ctx.state.dataFilter ?? {};
  const queryUserId = ctx.query?.userId;
  const queryStationId = ctx.query?.stationId;
  const workDate = ctx.query?.workDate;

  let targetUserId = user.id;
  if (queryUserId !== undefined && queryUserId !== null && queryUserId !== '') {
    const parsedUserId = Number.parseInt(queryUserId, 10);
    if (Number.isNaN(parsedUserId)) {
      throw createError(400, '鐢ㄦ埛鍙傛暟鏃犳晥');
    }
    targetUserId = parsedUserId;
  }

  if (dataFilter?.userId && targetUserId !== dataFilter.userId) {
    throw createError(403, 'Access denied.');
  }
  if (dataFilter?.none) {
    throw createError(403, 'Access denied.');
  }

  const dateValue = workDate ? dayjs(workDate) : dayjs();
  if (!dateValue.isValid()) {
    throw createError(400, 'Invalid date format.');
  }

  const todayText = dateValue.format('YYYY-MM-DD');
  const todayStart = dateValue.startOf('day');
  const year = dateValue.year();
  const month = dateValue.month() + 1;
  const day = dateValue.date();

  const scheduleWhere = { user_id: targetUserId, year, month };
  const normalizedStationId = queryStationId !== undefined && queryStationId !== null && queryStationId !== ''
    ? Number.parseInt(queryStationId, 10)
    : null;
  if (normalizedStationId && !Number.isNaN(normalizedStationId)) {
    scheduleWhere.station_id = normalizedStationId;
  }
  if (!dataFilter.all && Array.isArray(dataFilter.stationIds) && dataFilter.stationIds.length > 0) {
    if (scheduleWhere.station_id) {
      if (!dataFilter.stationIds.includes(scheduleWhere.station_id)) {
        ctx.body = { code: 200, message: 'success', data: [] };
        return;
      }
    } else {
      scheduleWhere.station_id = { [Op.in]: dataFilter.stationIds };
    }
  }

  // 1. 鏌ヨ鐢ㄦ埛浠婃棩鎺掔彮
  const schedules = await Schedule.findAll({
    where: scheduleWhere
  });

  // 绛涢€夊嚭浠婂ぉ鏈夋帓鐝殑璁板綍
  const todaySchedules = [];
  for (const schedule of schedules) {
    const scheduleData = schedule.schedules || {};
    const dateKey = todayText;
    const dayKey = String(day);

    if (scheduleData[dateKey] || scheduleData[dayKey]) {
      todaySchedules.push({
        stationId: schedule.station_id,
        positionName: schedule.position_name
      });
    }
  }

  if (todaySchedules.length === 0) {
    ctx.body = {
      code: 200,
      message: 'success',
      data: []
    };
    return;
  }

  // 2. 鏍规嵁鎺掔彮鐨勫矖浣嶏紝鏌ヨ鍏宠仈鐨勪繚鍏昏鍒?
  const tasks = [];
  for (const scheduleInfo of todaySchedules) {
    const positionPlans = await MaintenancePositionPlan.findAll({
      where: {
        station_id: scheduleInfo.stationId,
        position_name: scheduleInfo.positionName
      },
      include: [
        { model: Station, as: 'station', attributes: ['id', 'station_name'] },
        {
          model: MaintenancePlanLibrary,
          as: 'plan',
          attributes: ['id', 'equipment_code', 'equipment_name', 'install_location', 'cycle_type',
                       'weekly_day', 'monthly_day', 'yearly_month', 'yearly_day', 'maintenance_standards'],
          where: { is_deleted: false },
          required: true
        }
      ]
    });

    for (const positionPlan of positionPlans) {
      const plan = positionPlan.plan;
      if (!plan) continue;

      const cycleType = plan.cycle_type;
      const periodRange = getPeriodRange(todayStart, cycleType);
      const dueDate = getDueDateForPlan(periodRange.start, cycleType, plan);
      if (!dueDate) continue;
      if (dueDate.isAfter(todayStart)) continue;

      // 妫€鏌ユ湰鍛ㄦ湡鏄惁宸茬粡鎻愪氦
      const existingRecord = await MaintenanceWorkRecord.findOne({
        where: {
          plan_id: plan.id,
          executor_id: targetUserId,
          position_name: positionPlan.position_name,
          cycle_type: cycleType,
          work_date: {
            [Op.between]: [formatDate(periodRange.start), formatDate(periodRange.end)]
          }
        }
      });
      const isOverdue = dueDate.isBefore(todayStart) && !existingRecord;

      const taskObj = {
        positionPlanId: positionPlan.id,
        stationId: positionPlan.station_id,
        stationName: positionPlan.station?.station_name || '',
        positionName: positionPlan.position_name,
        planId: plan.id,
        equipmentCode: plan.equipment_code,
        equipmentName: plan.equipment_name,
        installLocation: plan.install_location,
        cycleType,
        weeklyDay: plan.weekly_day,
        monthlyDay: plan.monthly_day,
        yearlyMonth: plan.yearly_month,
        yearlyDay: plan.yearly_day,
        maintenanceStandards: normalizeMaintenanceStandards(plan.maintenance_standards),
        workDate: todayText,
        dueDate: formatDate(dueDate),
        isOverdue,
        existingRecord: existingRecord ? {
          id: existingRecord.id,
          status: existingRecord.status,
          maintenanceItems: existingRecord.maintenance_items,
          maintenanceTools: existingRecord.maintenance_tools,
          workHours: existingRecord.work_hours,
          consumablesList: existingRecord.consumables_list,
          partsList: existingRecord.parts_list,
          remark: existingRecord.remark,
          submitTime: existingRecord.submit_time
        } : null
      };
      tasks.push(taskObj);
    }
  }

  ctx.body = {
    code: 200,
    message: 'success',
    data: tasks
  };
};

/**
 * 鎻愪氦/鏇存柊淇濆吇宸ヤ綔璁板綍
 * POST /api/maintenance-work-records
 */
export const submitMaintenanceWorkRecord = async (ctx) => {
  const { id: userId, realName } = ctx.state.user;
  const {
    planId,
    stationId,
    positionName,
    equipmentCode,
    equipmentName,
    installLocation,
    cycleType,
    workDate,
    maintenanceItems,
    maintenanceTools,
    workHours,
    consumablesList,
    partsList,
    remark
  } = await validateBody(ctx, submitMaintenanceWorkRecordBodySchema);

  if (!planId || !stationId || !cycleType || !workDate) {
    throw createError(400, '淇濆吇璁″垝銆佸満绔欍€佸懆鏈熺被鍨嬪拰宸ヤ綔鏃ユ湡涓嶈兘涓虹┖');
  }

  const plan = await MaintenancePlanLibrary.findByPk(planId);
  if (!plan) {
    throw createError(404, 'Maintenance plan not found');
  }

  const todayStart = dayjs().startOf('day');
  const periodRange = getPeriodRange(todayStart, cycleType);
  const dueDate = getDueDateForPlan(periodRange.start, cycleType, plan);
  if (!dueDate || dueDate.isAfter(todayStart)) {
    throw createError(400, 'Maintenance date not reached');
  }

  // 鏌ユ壘鏄惁宸叉湁璁板綍锛堜竴涓懆鏈熷彧鍙兘鎻愪氦涓€娆★級
  let record = await MaintenanceWorkRecord.findOne({
    where: {
      plan_id: planId,
      executor_id: userId,
      position_name: positionName,
      cycle_type: cycleType,
      work_date: {
        [Op.between]: [formatDate(periodRange.start), formatDate(periodRange.end)]
      }
    }
  });

  if (record) {
    // 鏇存柊鐜版湁璁板綍
    await record.update({
      maintenance_items: maintenanceItems,
      maintenance_tools: maintenanceTools,
      work_hours: workHours,
      consumables_list: consumablesList,
      parts_list: partsList,
      remark,
      status: 'completed',
      submit_time: new Date(),
      work_date: workDate
    });
  } else {
    // 鍒涘缓鏂拌褰?
    const recordCode = `MWR${dayjs().format('YYYYMMDDHHmmss')}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    record = await MaintenanceWorkRecord.create({
      record_code: recordCode,
      station_id: stationId,
      plan_id: planId,
      position_name: positionName,
      equipment_code: equipmentCode,
      equipment_name: equipmentName,
      install_location: installLocation,
      cycle_type: cycleType,
      work_date: workDate,
      executor_id: userId,
      executor_name: realName,
      maintenance_items: maintenanceItems,
      maintenance_tools: maintenanceTools,
      work_hours: workHours,
      consumables_list: consumablesList,
      parts_list: partsList,
      remark,
      status: 'completed',
      submit_time: new Date()
    });
  }

  ctx.body = {
    code: 200,
    message: '淇濆吇璁板綍鎻愪氦鎴愬姛',
    data: record
  };
};

/**
 * 鑾峰彇淇濆吇宸ヤ綔璁板綍鍒楄〃锛堢鐞嗚€呮煡鐪嬶級
 * GET /api/maintenance-work-records
 */
export const getMaintenanceWorkRecords = async (ctx) => {
  await validateQuery(ctx, getMaintenanceWorkRecordsQuerySchema);
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const { stationId, positionName, executorName, cycleType, startDate, endDate, status, equipmentCode, equipmentName } = ctx.query;
  const dataFilter = ctx.state.dataFilter ?? {};
  const user = ctx.state.user;
  const scopedStationId = resolveScopedStationId(user, ctx.headers['x-station-id']);
  const todayStart = dayjs().startOf('day');

  const where = {};
  // 鍦虹珯杩囨护
  if (scopedStationId) {
    where.station_id = scopedStationId;
  } else if (stationId) {
    where.station_id = parseInt(stationId);
  } else if (!dataFilter.all && dataFilter.stationIds?.length > 0) {
    where.station_id = { [Op.in]: dataFilter.stationIds };
  }

  if (positionName) {
    where.position_name = positionName;
  }

  if (dataFilter?.userId) {
    where.executor_id = dataFilter.userId;
  }

  if (executorName) {
    where.executor_name = { [Op.like]: `%${executorName}%` };
  }

  if (equipmentCode) {
    where.equipment_code = { [Op.like]: `%${equipmentCode}%` };
  }

  if (equipmentName) {
    where.equipment_name = { [Op.like]: `%${equipmentName}%` };
  }

  if (cycleType) {
    where.cycle_type = cycleType;
  }

  if (startDate && endDate) {
    where.work_date = { [Op.between]: [startDate, endDate] };
  } else if (startDate) {
    where.work_date = { [Op.gte]: startDate };
  } else if (endDate) {
    where.work_date = { [Op.lte]: endDate };
  }

  const includeMissing = !executorName && !dataFilter?.userId && (!status || status === 'missed');
  const listWhere = { ...where };
  if (status && status !== 'missed') {
    listWhere.status = status;
  }

  if (!includeMissing) {
    const result = await MaintenanceWorkRecord.findAndCountAll({
      where: listWhere,
      include: [
        { model: Station, as: 'station', attributes: ['id', 'station_name'] },
        { model: MaintenancePlanLibrary, as: 'plan', attributes: ['id', 'equipment_code', 'equipment_name', 'maintenance_standards'] },
        { model: User, as: 'executor', attributes: ['id', 'real_name'] }
      ],
      offset,
      limit,
      order: [['work_date', 'DESC'], ['created_at', 'DESC']],
      distinct: true
    });

    ctx.body = {
      code: 200,
      message: 'success',
      data: formatPaginationResponse(result, page, pageSize)
    };
    return;
  }

  const assignmentWhere = {};
  if (scopedStationId) {
    assignmentWhere.station_id = scopedStationId;
  } else if (stationId) {
    assignmentWhere.station_id = parseInt(stationId);
  } else if (!dataFilter.all && dataFilter.stationIds?.length > 0) {
    assignmentWhere.station_id = { [Op.in]: dataFilter.stationIds };
  }
  if (positionName) {
    assignmentWhere.position_name = positionName;
  }

  const planWhere = { is_deleted: false };
  if (cycleType) {
    planWhere.cycle_type = cycleType;
  }
  if (equipmentCode) {
    planWhere.equipment_code = { [Op.like]: `%${equipmentCode}%` };
  }
  if (equipmentName) {
    planWhere.equipment_name = { [Op.like]: `%${equipmentName}%` };
  }

  const positionPlans = await MaintenancePositionPlan.findAll({
    where: assignmentWhere,
    include: [
      { model: Station, as: 'station', attributes: ['id', 'station_name'] },
      {
        model: MaintenancePlanLibrary,
        as: 'plan',
        attributes: ['id', 'equipment_code', 'equipment_name', 'install_location', 'cycle_type',
                     'weekly_day', 'monthly_day', 'yearly_month', 'yearly_day'],
        where: planWhere,
        required: true
      }
    ]
  });

  const rangeStart = startDate ? dayjs(startDate).startOf('day') : null;
  const rangeEnd = endDate ? dayjs(endDate).startOf('day') : null;
  const cycleEndMap = {
    daily: todayStart.subtract(1, 'day'),
    weekly: getWeekStart(todayStart).subtract(1, 'day'),
    monthly: todayStart.startOf('month').subtract(1, 'day'),
    yearly: todayStart.startOf('year').subtract(1, 'day')
  };

  let earliestPeriodStart = null;
  let latestPeriodEnd = null;
  positionPlans.forEach((positionPlan) => {
    const plan = positionPlan.plan;
    if (!plan) return;
    const cycle = plan.cycle_type || 'monthly';
    let cycleEnd = cycleEndMap[cycle] || cycleEndMap.monthly;
    if (rangeEnd && rangeEnd.isBefore(cycleEnd)) {
      cycleEnd = rangeEnd;
    }
    const assignmentStart = dayjs(positionPlan.created_at || plan.created_at || todayStart).startOf('day');
    let startPoint = rangeStart && rangeStart.isAfter(assignmentStart) ? rangeStart : assignmentStart;
    const periodStart = getPeriodRange(startPoint, cycle).start;
    if (cycleEnd.isBefore(periodStart)) return;
    if (!earliestPeriodStart || periodStart.isBefore(earliestPeriodStart)) {
      earliestPeriodStart = periodStart;
    }
    if (!latestPeriodEnd || cycleEnd.isAfter(latestPeriodEnd)) {
      latestPeriodEnd = cycleEnd;
    }
  });

  let completionRecords = [];
  if (earliestPeriodStart && latestPeriodEnd) {
    const completionWhere = { ...where };
    completionWhere.work_date = {
      [Op.between]: [formatDate(earliestPeriodStart), formatDate(latestPeriodEnd)]
    };
    if (cycleType) {
      completionWhere.cycle_type = cycleType;
    }
    completionRecords = await MaintenanceWorkRecord.findAll({
      attributes: ['id', 'plan_id', 'position_name', 'cycle_type', 'work_date', 'station_id'],
      where: completionWhere
    });
  }

  const completedPeriodMap = new Map();
  const addCompletedPeriod = (record) => {
    const key = `${record.plan_id}||${record.position_name || ''}||${record.station_id || ''}||${record.cycle_type}`;
    const periodKey = getPeriodKey(record.work_date, record.cycle_type);
    if (!completedPeriodMap.has(key)) {
      completedPeriodMap.set(key, new Set());
    }
    completedPeriodMap.get(key).add(periodKey);
  };
  completionRecords.forEach(addCompletedPeriod);

  const missingRecords = [];
  positionPlans.forEach((positionPlan) => {
    const plan = positionPlan.plan;
    if (!plan) return;
    const cycle = plan.cycle_type || 'monthly';
    let cycleEnd = cycleEndMap[cycle] || cycleEndMap.monthly;
    if (rangeEnd && rangeEnd.isBefore(cycleEnd)) {
      cycleEnd = rangeEnd;
    }
    const assignmentStart = dayjs(positionPlan.created_at || plan.created_at || todayStart).startOf('day');
    let startPoint = rangeStart && rangeStart.isAfter(assignmentStart) ? rangeStart : assignmentStart;
    let periodStart = getPeriodRange(startPoint, cycle).start;
    const periodKeySet = completedPeriodMap.get(`${plan.id}||${positionPlan.position_name || ''}||${positionPlan.station_id || ''}||${cycle}`);

    while (!cycleEnd.isBefore(periodStart)) {
      const periodRange = getPeriodRange(periodStart, cycle);
      const periodEnd = periodRange.end;
      if (periodEnd.isBefore(startPoint)) {
        periodStart = periodStart.add(1, cycle === 'weekly' ? 'week' : cycle === 'monthly' ? 'month' : cycle === 'yearly' ? 'year' : 'day');
        continue;
      }
      if (periodEnd.isAfter(cycleEnd)) {
        break;
      }
      const dueDate = getDueDateForPlan(periodRange.start, cycle, plan);
      if (!dueDate || dueDate.isBefore(assignmentStart)) {
        periodStart = periodStart.add(1, cycle === 'weekly' ? 'week' : cycle === 'monthly' ? 'month' : cycle === 'yearly' ? 'year' : 'day');
        continue;
      }
      const periodKey = getPeriodKey(periodRange.start, cycle);
      if (!periodKeySet || !periodKeySet.has(periodKey)) {
        const missingLabelMap = {
          daily: '本日未完成',
          weekly: '本周未完成',
          monthly: '本月未完成',
          yearly: '本年未完成'
        };
        missingRecords.push({
          id: `missing-${plan.id}-${positionPlan.position_name || 'unknown'}-${periodKey}`,
          record_code: `MISSING-${plan.id}-${periodKey}`,
          station_id: positionPlan.station_id,
          station: { station_name: positionPlan.station?.station_name || '' },
          plan_id: plan.id,
          position_name: positionPlan.position_name,
          equipment_code: plan.equipment_code,
          equipment_name: plan.equipment_name,
          install_location: plan.install_location,
          cycle_type: cycle,
          work_date: formatDate(periodEnd),
          executor_id: null,
          executor_name: null,
          maintenance_items: [],
          maintenance_tools: null,
          work_hours: null,
          consumables_list: [],
          parts_list: [],
          remark: null,
          status: 'missed',
          submit_time: null,
          missed_label: missingLabelMap[cycle] || '未完成',
          is_missing: true
        });
      }
      periodStart = periodStart.add(1, cycle === 'weekly' ? 'week' : cycle === 'monthly' ? 'month' : cycle === 'yearly' ? 'year' : 'day');
    }
  });

  let listRecords = [];
  if (status !== 'missed') {
    listRecords = await MaintenanceWorkRecord.findAll({
      where: listWhere,
      include: [
        { model: Station, as: 'station', attributes: ['id', 'station_name'] },
        { model: MaintenancePlanLibrary, as: 'plan', attributes: ['id', 'equipment_code', 'equipment_name', 'maintenance_standards'] },
        { model: User, as: 'executor', attributes: ['id', 'real_name'] }
      ],
      order: [['work_date', 'DESC'], ['created_at', 'DESC']]
    });
  }

  const merged = [...listRecords, ...missingRecords];
  merged.sort((a, b) => {
    const dateA = dayjs(a.work_date || a.workDate || 0).valueOf();
    const dateB = dayjs(b.work_date || b.workDate || 0).valueOf();
    if (dateA === dateB) {
      return dayjs(b.created_at || 0).valueOf() - dayjs(a.created_at || 0).valueOf();
    }
    return dateB - dateA;
  });

  const rows = merged.slice(offset, offset + limit);
  const result = { rows, count: merged.length };

  ctx.body = {
    code: 200,
    message: 'success',
    data: formatPaginationResponse(result, page, pageSize)
  };
};

/**
 * 鑾峰彇鍗曟潯淇濆吇宸ヤ綔璁板綍璇︽儏
 * GET /api/maintenance-work-records/:id
 */
export const getMaintenanceWorkRecordDetail = async (ctx) => {
  const { id } = await validateParams(ctx, idParamSchema);
  const dataFilter = ctx.state.dataFilter;

  const record = await MaintenanceWorkRecord.findByPk(id, {
    include: [
      { model: Station, as: 'station', attributes: ['id', 'station_name'] },
      { model: MaintenancePlanLibrary, as: 'plan', attributes: ['id', 'equipment_code', 'equipment_name', 'maintenance_standards'] },
      { model: User, as: 'executor', attributes: ['id', 'real_name'] }
    ]
  });

  if (!record) {
    throw createError(404, 'Not found');
  }

  if (dataFilter?.userId && record.executor_id !== dataFilter.userId) {
    throw createError(403, '无权限访问');
  }

  ctx.body = {
    code: 200,
    message: 'success',
    data: record
  };
};

/**
 * 楠屾敹淇濆吇宸ヤ綔璁板綍
 * PUT /api/maintenance-work-records/:id/verify
 */
export const verifyMaintenanceWorkRecord = async (ctx) => {
  const { id } = await validateParams(ctx, idParamSchema);
  const { id: verifierId, realName: verifierName } = ctx.state.user;
  const { verifyResult, verifyRemark, deductionPoints, deductionRemark } = await validateBody(ctx, verifyMaintenanceWorkRecordBodySchema);

  if (!verifyResult || !['pass', 'fail'].includes(verifyResult)) {
    throw createError(400, '楠屾敹缁撴灉鏃犳晥');
  }

  const record = await MaintenanceWorkRecord.findByPk(id);
  if (!record) {
    throw createError(404, 'Not found');
  }

  if (record.status !== 'completed') {
    throw createError(400, '鍙兘楠屾敹宸插畬鎴愮殑淇濆吇璁板綍');
  }

  let normalizedDeductionPoints = null;
  let normalizedDeductionRemark = null;
  if (verifyResult === 'fail') {
    if (deductionPoints !== undefined && deductionPoints !== null && deductionPoints !== '') {
      const parsed = Number(deductionPoints);
      if (Number.isNaN(parsed)) {
        throw createError(400, '扣分必须为数字');
      }
      if (parsed > 0) {
        throw createError(400, '扣分必须为 0 或负数');
      }
      normalizedDeductionPoints = parsed;
    } else {
      normalizedDeductionPoints = 0;
    }
    if (deductionRemark !== undefined && deductionRemark !== null && deductionRemark !== '') {
      normalizedDeductionRemark = deductionRemark;
    }
  }

  await record.update({
    status: 'verified',
    verifier_id: verifierId,
    verifier_name: verifierName,
    verify_time: new Date(),
    verify_result: verifyResult,
    verify_remark: verifyRemark || null,
    deduction_points: normalizedDeductionPoints,
    deduction_remark: normalizedDeductionRemark
  });

  ctx.body = {
    code: 200,
    message: '楠屾敹鎴愬姛',
    data: record
  };
};

export default {
  getMaintenancePositionPlans,
  createMaintenancePositionPlan,
  batchImportMaintenancePositionPlans,
  previewBatchImportMaintenancePositionPlans,
  deleteMaintenancePositionPlan,
  getTodayMaintenanceTasks,
  submitMaintenanceWorkRecord,
  getMaintenanceWorkRecords,
  getMaintenanceWorkRecordDetail,
  verifyMaintenanceWorkRecord
};
