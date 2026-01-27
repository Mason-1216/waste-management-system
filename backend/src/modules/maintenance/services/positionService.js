import { MaintenancePositionPlan, MaintenancePlanLibrary, MaintenanceWorkRecord, Station, User, Schedule } from '../../../models/index.js';
import { Op } from 'sequelize';
import { createError } from '../../../middlewares/error.js';
import { getPagination, formatPaginationResponse } from '../../../utils/helpers.js';
import dayjs from 'dayjs';

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
  const { stationId, positionName, equipmentCode, equipmentName, installLocation, cycleType } = ctx.query;
  const user = ctx.state.user;
  const scopedStationId = resolveScopedStationId(user, ctx.headers['x-station-id']);
  const { page, pageSize, offset, limit } = getPagination(ctx.query);

  const where = {};
  if (scopedStationId) {
    where.station_id = scopedStationId;
  } else if (stationId) {
    where.station_id = parseInt(stationId);
  }
  if (positionName) {
    where.position_name = positionName;
  }

  const planWhere = {};
  if (equipmentCode) {
    planWhere.equipment_code = { [Op.like]: `%${equipmentCode}%` };
  }
  if (equipmentName) {
    planWhere.equipment_name = { [Op.like]: `%${equipmentName}%` };
  }
  if (installLocation) {
    planWhere.install_location = { [Op.like]: `%${installLocation}%` };
  }
  if (cycleType) {
    planWhere.cycle_type = cycleType;
  }

  const planInclude = {
    model: MaintenancePlanLibrary,
    as: 'plan',
    attributes: ['id', 'equipment_code', 'equipment_name', 'install_location', 'cycle_type',
                 'weekly_day', 'monthly_day', 'yearly_month', 'yearly_day', 'maintenance_standards']
  };
  if (Object.keys(planWhere).length > 0) {
    planInclude.where = planWhere;
    planInclude.required = true;
  }

  const result = await MaintenancePositionPlan.findAndCountAll({
    where,
    include: [
      { model: Station, as: 'station', attributes: ['id', 'station_name'] },
      planInclude
    ],
    offset,
    limit,
    order: [['created_at', 'DESC']],
    distinct: true
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: formatPaginationResponse(result, page, pageSize)
  };
};

/**
 * 鍒涘缓宀椾綅-淇濆吇璁″垝鍒嗛厤
 * POST /api/maintenance-position-plans
 */
export const createMaintenancePositionPlan = async (ctx) => {
  const { stationId, positionName, planIds } = ctx.request.body;

  if (!stationId || !positionName || !planIds || !planIds.length) {
    throw createError(400, '鍦虹珯銆佸矖浣嶅拰淇濆吇璁″垝涓嶈兘涓虹┖');
  }

  // 鎵归噺鍒涘缓鍒嗛厤璁板綍
  const results = [];
  for (const planId of planIds) {
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

/**
 * 鍒犻櫎宀椾綅-淇濆吇璁″垝鍒嗛厤
 * DELETE /api/maintenance-position-plans/:id
 */
export const deleteMaintenancePositionPlan = async (ctx) => {
  const { id } = ctx.params;

  const record = await MaintenancePositionPlan.findByPk(id);
  if (!record) {
    throw createError(404, 'Not found');
  }

  await record.destroy();

  ctx.body = {
    code: 200,
    message: '鍒犻櫎鎴愬姛'
  };
};

/**
 * 鑾峰彇鍛樺伐浠婃棩淇濆吇浠诲姟
 * GET /api/maintenance-work-records/today-tasks
 */
export const getTodayMaintenanceTasks = async (ctx) => {
  const { id: userId, realName } = ctx.state.user;
  const today = dayjs();
  const todayText = today.format('YYYY-MM-DD');
  const todayStart = today.startOf('day');
  const year = today.year();
  const month = today.month() + 1;
  const day = today.date();

  // 1. 鏌ヨ鐢ㄦ埛浠婃棩鎺掔彮
  const schedules = await Schedule.findAll({
    where: {
      user_id: userId,
      year,
      month
    }
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
                       'weekly_day', 'monthly_day', 'yearly_month', 'yearly_day', 'maintenance_standards']
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
          executor_id: userId,
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
  } = ctx.request.body;

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
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const { stationId, positionName, executorName, cycleType, startDate, endDate, status, equipmentCode, equipmentName } = ctx.query;
  const dataFilter = ctx.state.dataFilter;
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

  const planWhere = {};
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
  const { id } = ctx.params;

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
  const { id } = ctx.params;
  const { id: verifierId, realName: verifierName } = ctx.state.user;
  const { verifyResult, verifyRemark } = ctx.request.body;

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

  await record.update({
    status: 'verified',
    verifier_id: verifierId,
    verifier_name: verifierName,
    verify_time: new Date(),
    verify_result: verifyResult,
    verify_remark: verifyRemark || null
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
  deleteMaintenancePositionPlan,
  getTodayMaintenanceTasks,
  submitMaintenanceWorkRecord,
  getMaintenanceWorkRecords,
  getMaintenanceWorkRecordDetail,
  verifyMaintenanceWorkRecord
};
