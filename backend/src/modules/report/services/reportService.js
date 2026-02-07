import { Op, fn, col, literal } from 'sequelize';
import { DailyTask, MaintenanceRecord, RepairRecord, SafetySelfInspection, SafetyOtherInspection, SafetyWorkType, HygieneArea, Schedule, TemporaryTask, User, MaintenanceWorkRecord, PositionWorkLog } from '../../../models/index.js';
import dayjs from 'dayjs';

const resolveText = (value) => (typeof value === 'string' ? value.trim() : '');

const resolveDateRange = (startDate, endDate) => {
  const startText = resolveText(startDate);
  const endText = resolveText(endDate);

  if (startText && endText) {
    return { startDate: startText, endDate: endText };
  }

  if (startText && !endText) {
    return { startDate: startText, endDate: startText };
  }

  if (!startText && endText) {
    return { startDate: endText, endDate: endText };
  }

  const end = dayjs();
  const start = end.subtract(6, 'day');
  return { startDate: start.format('YYYY-MM-DD'), endDate: end.format('YYYY-MM-DD') };
};

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const buildPointsSummary = ({ date, userId, userName }) => ({
  date,
  userId,
  userName,
  safety: 0,
  hygiene: 0,
  repair: 0,
  maintenance: 0,
  fixed: 0,
  dispatch: 0,
  selfApply: 0,
  deduction: 0,
  total: 0,
  safetyDetails: [],
  hygieneDetails: [],
  repairDetails: [],
  maintenanceDetails: [],
  fixedDetails: [],
  dispatchDetails: [],
  selfApplyDetails: [],
  deductionDetails: []
});

const buildPointsDetail = ({
  itemName,
  category,
  method,
  unitPoints,
  quantity,
  points,
  source
}) => ({
  itemName: resolveText(itemName),
  category: resolveText(category),
  method: resolveText(method),
  unitPoints: toNumber(unitPoints, 0),
  quantity: toNumber(quantity, 1),
  points: toNumber(points, 0),
  source: resolveText(source)
});

const resolveAssistantNames = (value) => {
  const text = resolveText(value);
  if (!text) return [];
  return text
    .split(/[，,、;；/]+/)
    .map(name => name.trim())
    .filter(name => name.length > 0);
};

const buildSummaryKey = (date, userId, userName, tag) => {
  const hasUserId = userId !== undefined && userId !== null && userId !== '';
  if (hasUserId) return `${date}::${userId}`;
  const nameText = resolveText(userName);
  const keyTag = tag ?? 'user';
  return `${date}::${keyTag}::${nameText}`;
};

const resolvePageValue = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
};

const resolvePageSize = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.min(parsed, 200);
};

/**
 * 工时统计报表
 * GET /api/reports/work-hours
 */
export const getWorkHoursReport = async (ctx) => {
  const { stationId, startDate, endDate, groupBy } = ctx.query;
  const dataFilter = ctx.state.dataFilter;

  const where = { status: 'approved' };

  if (stationId) where.station_id = stationId;
  if (startDate && endDate) where.work_date = { [Op.between]: [startDate, endDate] };

  if (!dataFilter.all && dataFilter.stationIds?.length > 0) {
    where.station_id = { [Op.in]: dataFilter.stationIds };
  }

  const tasks = await DailyTask.findAll({ where });

  let result = [];

  if (groupBy === 'user') {
    const summary = {};
    tasks.forEach(t => {
      if (!summary[t.user_id]) {
        summary[t.user_id] = { userId: t.user_id, userName: t.user_name, totalHours: 0, taskCount: 0 };
      }
      summary[t.user_id].totalHours += parseFloat(t.total_hours);
      summary[t.user_id].taskCount += 1;
    });
    result = Object.values(summary);
  } else if (groupBy === 'task') {
    const summary = {};
    tasks.forEach(t => {
      if (!summary[t.task_config_id]) {
        summary[t.task_config_id] = { taskName: t.task_name, totalHours: 0, totalTimes: 0 };
      }
      summary[t.task_config_id].totalHours += parseFloat(t.total_hours);
      summary[t.task_config_id].totalTimes += t.times;
    });
    result = Object.values(summary);
  } else {
    // 按日期
    const summary = {};
    tasks.forEach(t => {
      const date = t.work_date;
      if (!summary[date]) {
        summary[date] = { date, totalHours: 0, userCount: new Set(), taskCount: 0 };
      }
      summary[date].totalHours += parseFloat(t.total_hours);
      summary[date].userCount.add(t.user_id);
      summary[date].taskCount += 1;
    });
    result = Object.values(summary).map(s => ({
      ...s,
      userCount: s.userCount.size
    }));
  }

  ctx.body = {
    code: 200,
    message: 'success',
    data: result
  };
};

/**
 * 保养统计报表
 * GET /api/reports/maintenance
 */
export const getMaintenanceReport = async (ctx) => {
  const { stationId, startDate, endDate } = ctx.query;

  const where = {};
  if (stationId) where.station_id = stationId;
  if (startDate && endDate) where.maintenance_date = { [Op.between]: [startDate, endDate] };

  const records = await MaintenanceRecord.findAll({ where });

  const totalCount = records.length;
  const normalCount = records.filter(r => r.result === 'normal').length;
  const issueCount = records.filter(r => r.result === 'found_issue').length;
  const approvedCount = records.filter(r => r.status === 'approved').length;
  const pendingCount = records.filter(r => r.status === 'pending').length;

  // 按设备统计
  const byEquipment = {};
  records.forEach(r => {
    if (!byEquipment[r.equipment_name]) {
      byEquipment[r.equipment_name] = { count: 0, normalCount: 0, issueCount: 0 };
    }
    byEquipment[r.equipment_name].count += 1;
    if (r.result === 'normal') byEquipment[r.equipment_name].normalCount += 1;
    if (r.result === 'found_issue') byEquipment[r.equipment_name].issueCount += 1;
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: {
      summary: { totalCount, normalCount, issueCount, approvedCount, pendingCount },
      byEquipment: Object.entries(byEquipment).map(([name, data]) => ({ equipmentName: name, ...data }))
    }
  };
};

/**
 * 维修统计报表
 * GET /api/reports/repair
 */
export const getRepairReport = async (ctx) => {
  const { startDate, endDate } = ctx.query;

  const where = {};
  if (startDate && endDate) {
    where.repair_start_date = { [Op.between]: [startDate, endDate] };
  }

  const records = await RepairRecord.findAll({ where });

  const totalCount = records.length;
  const normalCount = records.filter(r => r.repair_result === 'normal').length;
  const observeCount = records.filter(r => r.repair_result === 'observe').length;
  const unsolvedCount = records.filter(r => r.repair_result === 'unsolved').length;
  const partsReplacedCount = records.filter(r => r.parts_replaced).length;

  // 按维修人员统计
  const byPerson = {};
  records.forEach(r => {
    if (!byPerson[r.repair_person_id]) {
      byPerson[r.repair_person_id] = { personName: r.repair_person_name, count: 0, successCount: 0 };
    }
    byPerson[r.repair_person_id].count += 1;
    if (r.repair_result === 'normal') byPerson[r.repair_person_id].successCount += 1;
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: {
      summary: { totalCount, normalCount, observeCount, unsolvedCount, partsReplacedCount },
      byPerson: Object.values(byPerson)
    }
  };
};

/**
 * 安全检查报表
 * GET /api/reports/safety
 */
export const getSafetyReport = async (ctx) => {
  const { stationId, startDate, endDate } = ctx.query;

  const where = {};
  if (stationId) where.station_id = stationId;
  if (startDate && endDate) where.inspection_date = { [Op.between]: [startDate, endDate] };

  const selfInspections = await SafetySelfInspection.findAll({ where });
  const otherInspections = await SafetyOtherInspection.findAll({ where });

  const selfTotal = selfInspections.length;
  const selfOverdue = selfInspections.filter(s => s.is_overdue).length;
  const selfSafety = selfInspections.filter(s => s.inspection_type === 'safety').length;
  const selfHygiene = selfInspections.filter(s => s.inspection_type === 'hygiene').length;

  const otherTotal = otherInspections.length;
  const otherQualified = otherInspections.filter(o => o.is_qualified).length;

  ctx.body = {
    code: 200,
    message: 'success',
    data: {
      selfInspection: {
        total: selfTotal,
        overdueCount: selfOverdue,
        overdueRate: selfTotal > 0 ? (selfOverdue / selfTotal * 100).toFixed(2) + '%' : '0%',
        safetyCount: selfSafety,
        hygieneCount: selfHygiene
      },
      otherInspection: {
        total: otherTotal,
        qualifiedCount: otherQualified,
        qualifiedRate: otherTotal > 0 ? (otherQualified / otherTotal * 100).toFixed(2) + '%' : '0%'
      }
    }
  };
};

/**
 * 排班统计报表
 * GET /api/reports/schedule
 */
export const getScheduleReport = async (ctx) => {
  const { stationId, year, month } = ctx.query;

  const where = {};
  if (stationId) where.station_id = stationId;
  if (year) where.year = parseInt(year);
  if (month) where.month = parseInt(month);

  const schedules = await Schedule.findAll({ where });

  const totalUsers = schedules.length;
  let totalWorkDays = 0;
  let totalRestDays = 0;

  schedules.forEach(s => {
    if (s.schedules) {
      Object.values(s.schedules).forEach(v => {
        if (v === '休') totalRestDays++;
        else totalWorkDays++;
      });
    }
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: {
      totalUsers,
      totalWorkDays,
      totalRestDays,
      avgWorkDays: totalUsers > 0 ? (totalWorkDays / totalUsers).toFixed(1) : 0
    }
  };
};

/**
 * 临时工作报表
 * GET /api/reports/temporary-tasks
 */
export const getTemporaryTasksReport = async (ctx) => {
  const { startDate, endDate, status } = ctx.query;

  const where = {};
  if (startDate && endDate) {
    where.created_at = { [Op.between]: [new Date(startDate), new Date(endDate + ' 23:59:59')] };
  }
  if (status) where.status = status;

  const tasks = await TemporaryTask.findAll({ where });

  const totalCount = tasks.length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const totalHours = tasks.reduce((sum, t) => sum + (parseFloat(t.actual_hours) || 0), 0);

  // 按执行人统计
  const byExecutor = {};
  tasks.forEach(t => {
    if (!byExecutor[t.executor_id]) {
      byExecutor[t.executor_id] = { executorName: t.executor_name, count: 0, completedCount: 0, totalHours: 0 };
    }
    byExecutor[t.executor_id].count += 1;
    if (t.status === 'completed') byExecutor[t.executor_id].completedCount += 1;
    byExecutor[t.executor_id].totalHours += parseFloat(t.actual_hours) || 0;
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: {
      summary: { totalCount, completedCount, completionRate: totalCount > 0 ? (completedCount / totalCount * 100).toFixed(2) + '%' : '0%', totalHours },
      byExecutor: Object.values(byExecutor)
    }
  };
};

/**
 * 绉垎缁熻鎶ヨ〃
 * GET /api/reports/points-summary
 */
export const getPointsSummaryReport = async (ctx) => {
  const { startDate, endDate, keyword } = ctx.query;
  const dataFilter = ctx.state.dataFilter ?? {};
  const range = resolveDateRange(startDate, endDate);

  const where = {
    work_date: { [Op.between]: [range.startDate, range.endDate] },
    submit_time: { [Op.not]: null },
    review_status: { [Op.in]: ['approved', 'auto_approved'] }
  };

  const keywordText = resolveText(keyword);
  if (keywordText) {
    where.user_name = { [Op.like]: `%${keywordText}%` };
  }

  if (!dataFilter.all) {
    if (dataFilter.userId) {
      where.user_id = dataFilter.userId;
    }
    if (dataFilter.stationIds?.length > 0) {
      where.station_id = { [Op.in]: dataFilter.stationIds };
    }
  }

  const logs = await PositionWorkLog.findAll({
    where,
    attributes: [
      'work_date',
      'user_id',
      'user_name',
      'task_source',
      'work_name',
      'task_category',
      'score_method',
      'unit_points',
      'quantity',
      'deduction_points'
    ]
  });

  const summaryMap = new Map();

  logs.forEach((log) => {
    const date = log.work_date;
    const userId = log.user_id;
    const userName = log.user_name ?? '';
    const key = `${date}::${userId}`;

    if (!summaryMap.has(key)) {
      summaryMap.set(key, buildPointsSummary({ date, userId, userName }));
    }

    const summary = summaryMap.get(key);
    const unitPoints = toNumber(log.unit_points, 0);
    const quantityValue = toNumber(log.quantity, 1);
    const points = unitPoints * quantityValue;

    if (log.task_source === 'fixed') {
      summary.fixed += points;
      summary.fixedDetails.push(buildPointsDetail({
        itemName: log.work_name,
        category: log.task_category,
        method: log.score_method,
        unitPoints,
        quantity: quantityValue,
        points,
        source: '固定工作'
      }));
    } else if (log.task_source === 'dispatch') {
      summary.dispatch += points;
      summary.dispatchDetails.push(buildPointsDetail({
        itemName: log.work_name,
        category: log.task_category,
        method: log.score_method,
        unitPoints,
        quantity: quantityValue,
        points,
        source: '派发任务'
      }));
    } else if (log.task_source === 'self_apply') {
      summary.selfApply += points;
      summary.selfApplyDetails.push(buildPointsDetail({
        itemName: log.work_name,
        category: log.task_category,
        method: log.score_method,
        unitPoints,
        quantity: quantityValue,
        points,
        source: '自行申请'
      }));
    }

    const deductionValue = toNumber(log.deduction_points, 0);
    if (deductionValue !== 0) {
      summary.deduction += deductionValue;
      summary.deductionDetails.push(buildPointsDetail({
        itemName: log.work_name ?? '扣分',
        category: log.task_category,
        method: '扣分',
        unitPoints: deductionValue,
        quantity: 1,
        points: deductionValue,
        source: '扣分'
      }));
    }
  });

  // 集成安全自检积分
  const safetySelfWhere = {
    inspection_date: { [Op.between]: [range.startDate, range.endDate] },
    inspection_type: 'safety',
    submit_time: { [Op.not]: null }
  };

  if (keywordText) {
    safetySelfWhere.filler_name = { [Op.like]: `%${keywordText}%` };
  }

  if (!dataFilter.all) {
    if (dataFilter.userId) {
      safetySelfWhere.filler_id = dataFilter.userId;
    }
    if (dataFilter.stationIds?.length > 0) {
      safetySelfWhere.station_id = { [Op.in]: dataFilter.stationIds };
    }
  }

  const safetySelfInspections = await SafetySelfInspection.findAll({
    where: safetySelfWhere,
    attributes: ['inspection_date', 'filler_id', 'filler_name', 'work_type_ids']
  });

  // 获取所有工作性质的积分
  const workTypes = await SafetyWorkType.findAll({
    attributes: ['id', 'points', 'work_type_name']
  });
  const workTypeInfoMap = new Map();
  workTypes.forEach((wt) => {
    workTypeInfoMap.set(wt.id, {
      name: wt.work_type_name ?? '',
      points: toNumber(wt.points, 0)
    });
  });

  // 汇总安全自检积分
  safetySelfInspections.forEach((inspection) => {
    const date = inspection.inspection_date;
    const userId = inspection.filler_id;
    const userName = inspection.filler_name ?? '';
    const key = `${date}::${userId}`;

    if (!summaryMap.has(key)) {
      summaryMap.set(key, buildPointsSummary({ date, userId, userName }));
    }

    const summary = summaryMap.get(key);
    const workTypeIds = Array.isArray(inspection.work_type_ids) ? inspection.work_type_ids : [];
    workTypeIds.forEach((wtId) => {
      const info = workTypeInfoMap.get(wtId) ?? { name: '', points: 0 };
      const points = toNumber(info.points, 0);
      summary.safety += points;
      summary.safetyDetails.push(buildPointsDetail({
        itemName: info.name,
        category: '工作性质',
        method: '',
        unitPoints: points,
        quantity: 1,
        points,
        source: '安全自检'
      }));
    });
  });

  // 集成安全他检积分
  const safetyOtherWhere = {
    inspection_date: { [Op.between]: [range.startDate, range.endDate] },
    inspection_type: 'safety'
  };

  if (keywordText) {
    safetyOtherWhere.inspected_user_name = { [Op.like]: `%${keywordText}%` };
  }

  if (!dataFilter.all) {
    if (dataFilter.userId) {
      safetyOtherWhere.inspected_user_id = dataFilter.userId;
    }
    if (dataFilter.stationIds?.length > 0) {
      safetyOtherWhere.station_id = { [Op.in]: dataFilter.stationIds };
    }
  }

  const safetyOtherInspections = await SafetyOtherInspection.findAll({
    where: safetyOtherWhere,
    attributes: ['inspection_date', 'inspected_user_id', 'inspected_user_name', 'points']
  });

  // 汇总安全他检积分
  safetyOtherInspections.forEach((inspection) => {
    const date = inspection.inspection_date;
    const userId = inspection.inspected_user_id;
    const userName = inspection.inspected_user_name ?? '';
    const key = `${date}::${userId}`;

    if (!summaryMap.has(key)) {
      summaryMap.set(key, buildPointsSummary({ date, userId, userName }));
    }

    const summary = summaryMap.get(key);
    const points = toNumber(inspection.points, 0);
    summary.safety += points;
    summary.safetyDetails.push(buildPointsDetail({
      itemName: '安全他检',
      category: '',
      method: '',
      unitPoints: points,
      quantity: 1,
      points,
      source: '安全他检'
    }));
  });

  // 集成卫生自检积分
  const hygieneSelfWhere = {
    inspection_date: { [Op.between]: [range.startDate, range.endDate] },
    inspection_type: 'hygiene',
    submit_time: { [Op.not]: null }
  };

  if (keywordText) {
    hygieneSelfWhere.filler_name = { [Op.like]: `%${keywordText}%` };
  }

  if (!dataFilter.all) {
    if (dataFilter.userId) {
      hygieneSelfWhere.filler_id = dataFilter.userId;
    }
    if (dataFilter.stationIds?.length > 0) {
      hygieneSelfWhere.station_id = { [Op.in]: dataFilter.stationIds };
    }
  }

  const hygieneSelfInspections = await SafetySelfInspection.findAll({
    where: hygieneSelfWhere,
    attributes: ['inspection_date', 'filler_id', 'filler_name', 'inspection_items']
  });

  // 获取所有卫生责任区的积分
  const hygieneAreas = await HygieneArea.findAll({
    attributes: ['id', 'points', 'area_name']
  });
  const hygieneAreaInfoMap = new Map();
  hygieneAreas.forEach((ha) => {
    hygieneAreaInfoMap.set(ha.id, {
      name: ha.area_name ?? '',
      points: toNumber(ha.points, 0)
    });
  });

  // 汇总卫生自检积分
  hygieneSelfInspections.forEach((inspection) => {
    const date = inspection.inspection_date;
    const userId = inspection.filler_id;
    const userName = inspection.filler_name ?? '';
    const key = `${date}::${userId}`;

    if (!summaryMap.has(key)) {
      summaryMap.set(key, buildPointsSummary({ date, userId, userName }));
    }

    const summary = summaryMap.get(key);
    const inspectionItems = Array.isArray(inspection.inspection_items) ? inspection.inspection_items : [];
    const areaIds = new Set();
    inspectionItems.forEach(item => {
      if (item.areaId) {
        areaIds.add(item.areaId);
      }
    });
    areaIds.forEach((areaId) => {
      const info = hygieneAreaInfoMap.get(areaId) ?? { name: '', points: 0 };
      const points = toNumber(info.points, 0);
      summary.hygiene += points;
      summary.hygieneDetails.push(buildPointsDetail({
        itemName: info.name,
        category: '责任区',
        method: '',
        unitPoints: points,
        quantity: 1,
        points,
        source: '卫生自检'
      }));
    });
  });

  // 集成卫生他检积分
  const hygieneOtherWhere = {
    inspection_date: { [Op.between]: [range.startDate, range.endDate] },
    inspection_type: 'hygiene'
  };

  if (keywordText) {
    hygieneOtherWhere.inspected_user_name = { [Op.like]: `%${keywordText}%` };
  }

  if (!dataFilter.all) {
    if (dataFilter.userId) {
      hygieneOtherWhere.inspected_user_id = dataFilter.userId;
    }
    if (dataFilter.stationIds?.length > 0) {
      hygieneOtherWhere.station_id = { [Op.in]: dataFilter.stationIds };
    }
  }

  const hygieneOtherInspections = await SafetyOtherInspection.findAll({
    where: hygieneOtherWhere,
    attributes: ['inspection_date', 'inspected_user_id', 'inspected_user_name', 'points']
  });

  // 汇总卫生他检积分
  hygieneOtherInspections.forEach((inspection) => {
    const date = inspection.inspection_date;
    const userId = inspection.inspected_user_id;
    const userName = inspection.inspected_user_name ?? '';
    const key = `${date}::${userId}`;

    if (!summaryMap.has(key)) {
      summaryMap.set(key, buildPointsSummary({ date, userId, userName }));
    }

    const summary = summaryMap.get(key);
    const points = toNumber(inspection.points, 0);
    summary.hygiene += points;
    summary.hygieneDetails.push(buildPointsDetail({
      itemName: '卫生他检',
      category: '',
      method: '',
      unitPoints: points,
      quantity: 1,
      points,
      source: '卫生他检'
    }));
  });

  // 集成维修积分
  const repairWhere = {
    status: { [Op.in]: ['accepted', 'archived'] }
  };

  if (!dataFilter.all && dataFilter.stationIds?.length > 0) {
    repairWhere.station_id = { [Op.in]: dataFilter.stationIds };
  }

  // 使用 repair_end_date 或 verify_date 作为日期筛选
  const repairRecords = await RepairRecord.findAll({
    where: repairWhere,
    attributes: [
      'repair_end_date',
      'verify_date',
      'repair_person_id',
      'repair_person_name',
      'repair_assistant_name',
      'repair_tasks'
    ]
  });

  const assistantNameSet = new Set();
  repairRecords.forEach((record) => {
    resolveAssistantNames(record.repair_assistant_name)
      .forEach(name => assistantNameSet.add(name));
  });

  const assistantIdMap = new Map();
  if (assistantNameSet.size > 0) {
    const assistantNames = Array.from(assistantNameSet);
    const assistants = await User.findAll({
      where: {
        [Op.or]: [
          { real_name: { [Op.in]: assistantNames } },
          { username: { [Op.in]: assistantNames } }
        ]
      },
      attributes: ['id', 'real_name', 'username']
    });
    assistants.forEach((assistant) => {
      const realName = resolveText(assistant.real_name);
      const username = resolveText(assistant.username);
      if (realName) assistantIdMap.set(realName, assistant.id);
      if (username) assistantIdMap.set(username, assistant.id);
    });
  }

  // 汇总维修积分
  repairRecords.forEach((record) => {
    const date = record.verify_date || record.repair_end_date;
    if (!date) return;

    const dateStr = dayjs(date).format('YYYY-MM-DD');
    if (dateStr < range.startDate || dateStr > range.endDate) return;

    const userId = record.repair_person_id;
    const userName = record.repair_person_name ?? '';
    const repairTasks = Array.isArray(record.repair_tasks) ? record.repair_tasks : [];

    let leaderMatchesKeyword = true;
    if (keywordText) {
      leaderMatchesKeyword = userName.includes(keywordText);
    }

    let leaderMatchesUser = true;
    if (!dataFilter.all && dataFilter.userId) {
      leaderMatchesUser = userId === dataFilter.userId;
    }

    const key = buildSummaryKey(dateStr, userId, userName, 'repair');

    const appendRepairTasks = (summary) => {
      repairTasks.forEach((task) => {
        const taskPoints = toNumber(task?.points, 0);
        const taskQuantity = toNumber(task?.quantity, 1);
        const taskTotal = taskPoints * taskQuantity;
        summary.repair += taskTotal;
        summary.repairDetails.push(buildPointsDetail({
          itemName: task?.task_name ?? task?.job_name ?? '',
          category: task?.task_category,
          method: task?.score_method,
          unitPoints: taskPoints,
          quantity: taskQuantity,
          points: taskTotal,
          source: '维修任务'
        }));
      });
    };

    if (leaderMatchesKeyword && leaderMatchesUser) {
      if (!summaryMap.has(key)) {
        summaryMap.set(key, buildPointsSummary({ date: dateStr, userId, userName }));
      }
      const summary = summaryMap.get(key);
      appendRepairTasks(summary);
    }

    const assistantNames = resolveAssistantNames(record.repair_assistant_name);
    if (assistantNames.length === 0) return;

    const uniqueAssistants = new Set(assistantNames);
    uniqueAssistants.forEach((assistantName) => {
      const nameText = resolveText(assistantName);
      if (!nameText) return;
      if (nameText === userName) return;
      const assistantId = assistantIdMap.get(nameText);

      let assistantMatchesKeyword = true;
      if (keywordText) {
        assistantMatchesKeyword = nameText.includes(keywordText);
      }

      let assistantMatchesUser = true;
      if (!dataFilter.all && dataFilter.userId) {
        assistantMatchesUser = assistantId === dataFilter.userId;
      }

      if (!assistantMatchesKeyword || !assistantMatchesUser) return;

      const assistantKey = buildSummaryKey(dateStr, assistantId, nameText, 'assistant');
      if (!summaryMap.has(assistantKey)) {
        summaryMap.set(assistantKey, buildPointsSummary({ date: dateStr, userId: assistantId, userName: nameText }));
      }
      const assistantSummary = summaryMap.get(assistantKey);
      appendRepairTasks(assistantSummary);
    });
  });

  // 集成保养积分
  const maintenanceWhere = {
    work_date: { [Op.between]: [range.startDate, range.endDate] },
    status: { [Op.in]: ['completed', 'verified'] }
  };

  if (keywordText) {
    maintenanceWhere.executor_name = { [Op.like]: `%${keywordText}%` };
  }

  if (!dataFilter.all) {
    if (dataFilter.userId) {
      maintenanceWhere.executor_id = dataFilter.userId;
    }
    if (dataFilter.stationIds?.length > 0) {
      maintenanceWhere.station_id = { [Op.in]: dataFilter.stationIds };
    }
  }

  const maintenanceRecords = await MaintenanceWorkRecord.findAll({
    where: maintenanceWhere,
    attributes: ['work_date', 'executor_id', 'executor_name', 'maintenance_items', 'verify_result', 'deduction_points', 'deduction_remark']
  });

  // 汇总保养积分（按合格项标准积分求和，验收不通过按扣分处理）
  maintenanceRecords.forEach((record) => {
    const date = record.work_date;
    const userId = record.executor_id;
    const userName = record.executor_name ?? '';
    const key = `${date}::${userId}`;

    if (!summaryMap.has(key)) {
      summaryMap.set(key, buildPointsSummary({ date, userId, userName }));
    }

    const summary = summaryMap.get(key);
    const maintenanceItems = Array.isArray(record.maintenance_items) ? record.maintenance_items : [];
    const verifyResult = record.verify_result;

    maintenanceItems.forEach((item) => {
      const confirmed = item?.confirmed === true || item?.confirmed === 1;
      if (!confirmed) return;
      const rawPoints = item?.points;
      const parsedPoints = rawPoints === undefined || rawPoints === null || rawPoints === ''
        ? 0
        : Number(rawPoints);
      const points = Number.isNaN(parsedPoints) ? 0 : parsedPoints;
      summary.maintenance += points;
      summary.maintenanceDetails.push(buildPointsDetail({
        itemName: item?.name ?? item?.item_name ?? '',
        category: '',
        method: '合格',
        unitPoints: points,
        quantity: 1,
        points,
        source: '保养工作'
      }));
    });

    if (verifyResult === 'fail') {
      const deductionPoints = record.deduction_points !== undefined && record.deduction_points !== null
        ? Number(record.deduction_points)
        : 0;
      const safeDeduction = Number.isNaN(deductionPoints) ? 0 : deductionPoints;
      if (safeDeduction !== 0) {
        summary.maintenance += safeDeduction;
        summary.maintenanceDetails.push(buildPointsDetail({
          itemName: record.deduction_remark ? `验收不通过扣分（${record.deduction_remark}）` : '验收不通过扣分',
          category: '',
          method: '扣分',
          unitPoints: safeDeduction,
          quantity: 1,
          points: safeDeduction,
          source: '保养工作'
        }));
      }
    }
  });

  const result = Array.from(summaryMap.values()).map((item) => {
    const total = item.safety
      + item.hygiene
      + item.repair
      + item.maintenance
      + item.fixed
      + item.dispatch
      + item.selfApply
      + item.deduction;
    return { ...item, total };
  });

  result.sort((a, b) => {
    if (a.date === b.date) {
      const leftName = a.userName ?? '';
      const rightName = b.userName ?? '';
      return leftName.localeCompare(rightName);
    }
    return b.date.localeCompare(a.date);
  });

  const shouldPaginate = ctx.query.page !== undefined || ctx.query.pageSize !== undefined;
  const total = result.length;

  if (!shouldPaginate) {
    ctx.body = {
      code: 200,
      message: 'success',
      data: result
    };
    return;
  }

  const page = resolvePageValue(ctx.query.page, 1);
  const pageSize = resolvePageSize(ctx.query.pageSize, 10);
  const startIndex = (page - 1) * pageSize;
  const list = result.slice(startIndex, startIndex + pageSize);

  ctx.body = {
    code: 200,
    message: 'success',
    data: {
      list,
      total,
      page,
      pageSize
    }
  };
};

/**
 * 淇濆吇鏈堣川缁熻
 * GET /api/reports/maintenance-by-month
 */
export const getMaintenanceByMonth = async (ctx) => {
  const { stationId, equipmentCode, year } = ctx.query;
  const targetYear = Number(year) || dayjs().year();

  const where = {};
  if (stationId) where.station_id = stationId;
  if (equipmentCode) where.equipment_code = equipmentCode;

  const startDate = dayjs(`${targetYear}-01-01`).format('YYYY-MM-DD');
  const endDate = dayjs(`${targetYear}-12-31`).format('YYYY-MM-DD');
  where.work_date = { [Op.between]: [startDate, endDate] };

  const records = await MaintenanceWorkRecord.findAll({ where, attributes: ['work_date'] });

  const counts = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, count: 0 }));
  records.forEach(record => {
    if (!record.work_date) return;
    const monthIndex = dayjs(record.work_date).month(); // 0-11
    if (monthIndex >= 0 && monthIndex < 12) {
      counts[monthIndex].count += 1;
    }
  });

  ctx.body = { code: 200, message: 'success', data: counts };
};

/**
 * 缁翠慨鏈堣川缁熻
 * GET /api/reports/repair-by-month
 */
export const getRepairByMonth = async (ctx) => {
  const { stationId, equipmentCode, year } = ctx.query;
  const targetYear = Number(year) || dayjs().year();

  const where = {};
  if (stationId) where.station_id = stationId;
  if (equipmentCode) where.equipment_code = equipmentCode;

  const startDate = dayjs(`${targetYear}-01-01`).format('YYYY-MM-DD');
  const endDate = dayjs(`${targetYear}-12-31`).format('YYYY-MM-DD');
  where.report_date = { [Op.between]: [startDate, endDate] };

  const records = await RepairRecord.findAll({ where, attributes: ['report_date'] });

  const counts = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, count: 0 }));
  records.forEach(record => {
    if (!record.report_date) return;
    const monthIndex = dayjs(record.report_date).month(); // 0-11
    if (monthIndex >= 0 && monthIndex < 12) {
      counts[monthIndex].count += 1;
    }
  });

  ctx.body = { code: 200, message: 'success', data: counts };
};

export default {
  getWorkHoursReport,
  getMaintenanceReport,
  getMaintenanceByMonth,
  getRepairReport,
  getRepairByMonth,
  getSafetyReport,
  getScheduleReport,
  getTemporaryTasksReport,
  getPointsSummaryReport
};
