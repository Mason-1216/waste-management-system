import { Op, fn, col, literal } from 'sequelize';
import { DailyTask, MaintenanceRecord, RepairRecord, SafetySelfInspection, SafetyOtherInspection, SafetyWorkType, HygieneArea, Schedule, TemporaryTask, User, MaintenanceWorkRecord, PositionWorkLog, ManualPointsEntry, ManualWorkHour, AdjustedHourlyPoints } from '../../../models/index.js';
import dayjs from 'dayjs';
import { createError } from '../../../middlewares/error.js';
import { normalizeTaskCategory, TASK_CATEGORY_OPTIONS } from '../../../utils/taskCategory.js';
import { validateQuery } from '../../core/validators/validate.js';
import { appliedHourlyPointsQuerySchema, byMonthQuerySchema, dateRangeStationQuerySchema, manualWorkHourUpdateSchema, manualWorkHoursListQuerySchema, pointsDetailsReportQuerySchema, pointsSummaryDrilldownQuerySchema, pointsSummaryReportQuerySchema, pointsTaskCategorySummaryQuerySchema, scheduleReportQuerySchema, temporaryTasksReportQuerySchema, workHoursReportQuerySchema } from '../validators/schemas.js';
import { addTemplateInstructionSheet } from '../../import_export/utils/excelTemplate.js';

const resolveText = (value) => (typeof value === 'string' ? value.trim() : '');

const isSameNumber = (a, b) => {
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isFinite(na) || !Number.isFinite(nb)) return false;
  return na === nb;
};

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

const POINTS_DATA_SOURCE_SUMMARY = '汇总表统计';
const POINTS_DATA_SOURCE_MANUAL = '人工录入';

const POINTS_CATEGORY_CODES = [
  'safety',
  'hygiene',
  'repair',
  'maintenance',
  'fixed',
  'dispatch',
  'selfApply',
  'deduction'
];

const POINTS_CATEGORY_LABEL_MAP = new Map([
  ['安全', 'safety'],
  ['卫生', 'hygiene'],
  ['维修', 'repair'],
  ['保养', 'maintenance'],
  ['固定工作', 'fixed'],
  ['派发任务', 'dispatch'],
  ['自行申请', 'selfApply'],
  ['扣分', 'deduction'],
  ['临时任务', 'dispatch']
]);

const POINTS_CATEGORY_CODE_LABEL_MAP = new Map(
  Array.from(POINTS_CATEGORY_LABEL_MAP.entries()).map(([label, code]) => [code, label])
);

const normalizePointsCategoryCode = (value) => {
  const text = resolveText(value);
  if (!text) return '';
  if (POINTS_CATEGORY_CODES.includes(text)) return text;
  return POINTS_CATEGORY_LABEL_MAP.get(text) ?? '';
};

const resolveTaskCategoryName = (value) => {
  return normalizeTaskCategory(value);
};

const resolvePointsCategoryLabel = (code) => {
  const text = resolveText(code);
  return POINTS_CATEGORY_CODE_LABEL_MAP.get(text) ?? '';
};

const resolveCycleLabel = (cycleType) => {
  const text = resolveText(cycleType);
  if (text === 'daily') return '日';
  if (text === 'weekly') return '周';
  if (text === 'monthly') return '月';
  if (text === 'yearly') return '年';
  return text;
};

const buildDrilldownRow = ({ itemName, unitPoints, quantity, totalPoints, dataSource }) => {
  const nameText = resolveText(itemName);
  const unit = toNumber(unitPoints, 0);
  const qty = toNumber(quantity, 0);
  const total = totalPoints !== undefined && totalPoints !== null ? toNumber(totalPoints, unit * qty) : (unit * qty);
  return {
    itemName: nameText,
    unitPoints: unit,
    quantity: qty,
    times: 1,  // 每条记录算1次
    totalPoints: total,
    dataSource
  };
};

const paginateList = ({ rows, page, pageSize }) => {
  const resolvedPage = resolvePageValue(page, 1);
  const resolvedSize = resolvePageSize(pageSize, 20);
  const total = rows.length;
  const startIndex = (resolvedPage - 1) * resolvedSize;
  return {
    list: rows.slice(startIndex, startIndex + resolvedSize),
    total,
    page: resolvedPage,
    pageSize: resolvedSize
  };
};

const groupDrilldownRows = ({ rows, groupKey }) => {
  const map = new Map();
  rows.forEach((row) => {
    const key = groupKey(row);
    if (!key) return;
    if (!map.has(key)) {
      map.set(key, { ...row });
      return;
    }
    const existing = map.get(key);
    existing.quantity += toNumber(row.quantity, 0);
    existing.times += toNumber(row.times, 1);  // 累加次数
    existing.totalPoints += toNumber(row.totalPoints, 0);
    map.set(key, existing);
  });
  return Array.from(map.values()).map((row) => {
    const qty = toNumber(row.quantity, 0);
    const total = toNumber(row.totalPoints, 0);
    const unit = qty > 0 ? total / qty : toNumber(row.unitPoints, 0);
    return {
      ...row,
      unitPoints: unit,
      quantity: qty,
      times: toNumber(row.times, 1),
      totalPoints: total
    };
  });
};

/**
 * 积分统计表行下钻（粗略查看：项目/单位积分/次数/得分/来源）
 * GET /api/reports/points-summary-drilldown
 */
export const getPointsSummaryDrilldownReport = async (ctx) => {
  await validateQuery(ctx, pointsSummaryDrilldownQuerySchema);
  const { startDate, endDate, userId, category, page, pageSize } = ctx.query;
  const dataFilter = ctx.state.dataFilter ?? {};
  const range = resolveDateRange(startDate, endDate);
  const categoryCode = normalizePointsCategoryCode(category);
  if (!categoryCode) {
    throw createError(400, '类别不正确');
  }

  const uid = Number(userId);
  if (!Number.isInteger(uid) || uid < 1) {
    throw createError(400, '人员不正确');
  }

  const manualRows = await ManualPointsEntry.findAll({
    where: {
      entry_date: { [Op.between]: [range.startDate, range.endDate] },
      user_id: uid,
      category_code: categoryCode
    },
    attributes: ['task_name', 'unit_points', 'quantity']
  });

  const manualItems = manualRows
    .map((row) => buildDrilldownRow({
      itemName: row.task_name,
      unitPoints: row.unit_points,
      quantity: row.quantity,
      dataSource: POINTS_DATA_SOURCE_MANUAL
    }));

  const autoItems = [];

  if (categoryCode === 'fixed' || categoryCode === 'dispatch' || categoryCode === 'selfApply' || categoryCode === 'deduction') {
    const workLogWhere = {
      work_date: { [Op.between]: [range.startDate, range.endDate] },
      user_id: uid,
      submit_time: { [Op.not]: null },
      review_status: { [Op.in]: ['approved', 'auto_approved'] }
    };

    if (!dataFilter.all && dataFilter.stationIds?.length > 0) {
      workLogWhere.station_id = { [Op.in]: dataFilter.stationIds };
    }

    if (categoryCode === 'fixed') {
      workLogWhere.task_source = 'fixed';
    } else if (categoryCode === 'dispatch') {
      workLogWhere.task_source = 'dispatch';
    } else if (categoryCode === 'selfApply') {
      workLogWhere.task_source = 'self_apply';
    }

    const workLogs = await PositionWorkLog.findAll({
      where: workLogWhere,
      attributes: ['task_source', 'work_name', 'unit_points', 'quantity', 'deduction_reason', 'deduction_points']
    });

    workLogs.forEach((log) => {
      if (categoryCode === 'deduction') {
        const deductionValue = toNumber(log.deduction_points, 0);
        if (deductionValue === 0) return;
        const reasonText = resolveText(log.deduction_reason);
        const workName = resolveText(log.work_name);
        const itemName = reasonText ? reasonText : (workName ? workName : '扣分');
        autoItems.push(buildDrilldownRow({
          itemName,
          unitPoints: deductionValue,
          quantity: 1,
          dataSource: POINTS_DATA_SOURCE_SUMMARY
        }));
        return;
      }

      const workName = resolveText(log.work_name);
      if (!workName) return;
      const unitPoints = toNumber(log.unit_points, 0);
      const quantityValue = toNumber(log.quantity, 0);
      if (quantityValue <= 0) return;
      autoItems.push(buildDrilldownRow({
        itemName: workName,
        unitPoints,
        quantity: quantityValue,
        dataSource: POINTS_DATA_SOURCE_SUMMARY
      }));
    });

    if (categoryCode === 'deduction') {
      const maintenanceDeductionWhere = {
        work_date: { [Op.between]: [range.startDate, range.endDate] },
        executor_id: uid,
        verify_result: 'fail'
      };

      if (!dataFilter.all && dataFilter.stationIds?.length > 0) {
        maintenanceDeductionWhere.station_id = { [Op.in]: dataFilter.stationIds };
      }

      const failRecords = await MaintenanceWorkRecord.findAll({
        where: maintenanceDeductionWhere,
        attributes: ['deduction_points', 'deduction_remark']
      });

      failRecords.forEach((record) => {
        const deductionPoints = record.deduction_points !== undefined && record.deduction_points !== null ? Number(record.deduction_points) : 0;
        const safeDeduction = Number.isNaN(deductionPoints) ? 0 : deductionPoints;
        if (safeDeduction === 0) return;
        const remarkText = resolveText(record.deduction_remark);
        const itemName = remarkText ? `验收不通过：${remarkText}` : '验收不通过';
        autoItems.push(buildDrilldownRow({
          itemName,
          unitPoints: safeDeduction,
          quantity: 1,
          dataSource: POINTS_DATA_SOURCE_SUMMARY
        }));
      });
    }
  } else if (categoryCode === 'safety') {
    const selfWhere = {
      inspection_date: { [Op.between]: [range.startDate, range.endDate] },
      inspection_type: 'safety',
      submit_time: { [Op.not]: null },
      filler_id: uid
    };

    if (!dataFilter.all && dataFilter.stationIds?.length > 0) {
      selfWhere.station_id = { [Op.in]: dataFilter.stationIds };
    }

    const inspections = await SafetySelfInspection.findAll({
      where: selfWhere,
      attributes: ['work_type_ids']
    });

    const workTypes = await SafetyWorkType.findAll({ attributes: ['id', 'points', 'work_type_name'] });
    const workTypeInfoMap = new Map();
    workTypes.forEach((wt) => {
      workTypeInfoMap.set(wt.id, {
        name: wt.work_type_name ?? '',
        points: toNumber(wt.points, 0)
      });
    });

    inspections.forEach((inspection) => {
      const workTypeIds = Array.isArray(inspection.work_type_ids) ? inspection.work_type_ids : [];
      workTypeIds.forEach((wtId) => {
        const info = workTypeInfoMap.get(wtId);
        if (!info) return;
        const nameText = resolveText(info.name);
        if (!nameText) return;
        autoItems.push(buildDrilldownRow({
          itemName: nameText,
          unitPoints: info.points,
          quantity: 1,
          dataSource: POINTS_DATA_SOURCE_SUMMARY
        }));
      });
    });

    const otherWhere = {
      inspection_date: { [Op.between]: [range.startDate, range.endDate] },
      inspection_type: 'safety',
      inspected_user_id: uid
    };

    if (!dataFilter.all && dataFilter.stationIds?.length > 0) {
      otherWhere.station_id = { [Op.in]: dataFilter.stationIds };
    }

    const otherInspections = await SafetyOtherInspection.findAll({
      where: otherWhere,
      attributes: ['points']
    });

    otherInspections.forEach((inspection) => {
      autoItems.push(buildDrilldownRow({
        itemName: '安全他检',
        unitPoints: toNumber(inspection.points, 0),
        quantity: 1,
        dataSource: POINTS_DATA_SOURCE_SUMMARY
      }));
    });
  } else if (categoryCode === 'hygiene') {
    const selfWhere = {
      inspection_date: { [Op.between]: [range.startDate, range.endDate] },
      inspection_type: 'hygiene',
      submit_time: { [Op.not]: null },
      filler_id: uid
    };

    if (!dataFilter.all && dataFilter.stationIds?.length > 0) {
      selfWhere.station_id = { [Op.in]: dataFilter.stationIds };
    }

    const inspections = await SafetySelfInspection.findAll({
      where: selfWhere,
      attributes: ['inspection_items']
    });

    const hygieneAreas = await HygieneArea.findAll({ attributes: ['id', 'points', 'area_name'] });
    const hygieneAreaInfoMap = new Map();
    hygieneAreas.forEach((ha) => {
      hygieneAreaInfoMap.set(ha.id, {
        name: ha.area_name ?? '',
        points: toNumber(ha.points, 0)
      });
    });

    inspections.forEach((inspection) => {
      const inspectionItems = Array.isArray(inspection.inspection_items) ? inspection.inspection_items : [];
      const areaIds = new Set();
      inspectionItems.forEach((item) => {
        if (item?.areaId) {
          areaIds.add(item.areaId);
        }
      });
      areaIds.forEach((areaId) => {
        const info = hygieneAreaInfoMap.get(areaId);
        if (!info) return;
        const nameText = resolveText(info.name);
        if (!nameText) return;
        autoItems.push(buildDrilldownRow({
          itemName: nameText,
          unitPoints: info.points,
          quantity: 1,
          dataSource: POINTS_DATA_SOURCE_SUMMARY
        }));
      });
    });

    const otherWhere = {
      inspection_date: { [Op.between]: [range.startDate, range.endDate] },
      inspection_type: 'hygiene',
      inspected_user_id: uid
    };

    if (!dataFilter.all && dataFilter.stationIds?.length > 0) {
      otherWhere.station_id = { [Op.in]: dataFilter.stationIds };
    }

    const otherInspections = await SafetyOtherInspection.findAll({
      where: otherWhere,
      attributes: ['points']
    });

    otherInspections.forEach((inspection) => {
      autoItems.push(buildDrilldownRow({
        itemName: '卫生他检',
        unitPoints: toNumber(inspection.points, 0),
        quantity: 1,
        dataSource: POINTS_DATA_SOURCE_SUMMARY
      }));
    });
  } else if (categoryCode === 'repair') {
    const user = await User.findByPk(uid, { attributes: ['id', 'real_name', 'username'] });
    const nameCandidates = new Set();
    const realName = resolveText(user?.real_name);
    const username = resolveText(user?.username);
    if (realName) nameCandidates.add(realName);
    if (username) nameCandidates.add(username);

    const where = {
      status: { [Op.in]: ['accepted', 'archived'] }
    };

    if (!dataFilter.all && dataFilter.stationIds?.length > 0) {
      where.station_id = { [Op.in]: dataFilter.stationIds };
    }

    const records = await RepairRecord.findAll({
      where,
      attributes: [
        'repair_end_date',
        'verify_date',
        'repair_person_id',
        'repair_assistant_name',
        'repair_tasks'
      ]
    });

    records.forEach((record) => {
      const date = record.verify_date || record.repair_end_date;
      if (!date) return;
      const dateStr = dayjs(date).format('YYYY-MM-DD');
      if (dateStr < range.startDate || dateStr > range.endDate) return;

      const isLeader = record.repair_person_id === uid;
      let isAssistant = false;
      if (!isLeader && nameCandidates.size > 0) {
        const assistantNames = resolveAssistantNames(record.repair_assistant_name);
        assistantNames.forEach((name) => {
          const nameText = resolveText(name);
          if (!nameText) return;
          if (nameCandidates.has(nameText)) isAssistant = true;
        });
      }

      if (!isLeader && !isAssistant) return;

      const repairTasks = Array.isArray(record.repair_tasks) ? record.repair_tasks : [];
      repairTasks.forEach((task) => {
        const taskName = resolveText(task?.task_name ?? task?.job_name);
        if (!taskName) return;
        const unitPoints = toNumber(task?.points, 0);
        const quantityValue = toNumber(task?.quantity, 1);
        if (quantityValue <= 0) return;
        autoItems.push(buildDrilldownRow({
          itemName: taskName,
          unitPoints,
          quantity: quantityValue,
          dataSource: POINTS_DATA_SOURCE_SUMMARY
        }));
      });
    });
  } else if (categoryCode === 'maintenance') {
    const where = {
      work_date: { [Op.between]: [range.startDate, range.endDate] },
      executor_id: uid,
      status: { [Op.in]: ['completed', 'verified'] }
    };

    if (!dataFilter.all && dataFilter.stationIds?.length > 0) {
      where.station_id = { [Op.in]: dataFilter.stationIds };
    }

    const records = await MaintenanceWorkRecord.findAll({
      where,
      attributes: ['equipment_name', 'cycle_type', 'maintenance_items']
    });

    records.forEach((record) => {
      const equipmentName = resolveText(record.equipment_name);
      if (!equipmentName) return;
      const cycleLabel = resolveCycleLabel(record.cycle_type);
      const itemName = cycleLabel ? `${equipmentName}（${cycleLabel}）` : equipmentName;

      const items = Array.isArray(record.maintenance_items) ? record.maintenance_items : [];
      let totalPoints = 0;
      items.forEach((item) => {
        const confirmed = item?.confirmed === true || item?.confirmed === 1;
        if (!confirmed) return;
        const rawPoints = item?.points;
        const parsedPoints = rawPoints === undefined || rawPoints === null || rawPoints === '' ? 0 : Number(rawPoints);
        const points = Number.isNaN(parsedPoints) ? 0 : parsedPoints;
        totalPoints += points;
      });

      autoItems.push(buildDrilldownRow({
        itemName,
        unitPoints: totalPoints,
        quantity: 1,
        totalPoints,
        dataSource: POINTS_DATA_SOURCE_SUMMARY
      }));
    });
  }

  const combined = [...autoItems, ...manualItems].filter(item => resolveText(item.itemName));

  let grouped = [];
  if (categoryCode === 'maintenance') {
    grouped = groupDrilldownRows({
      rows: combined,
      groupKey: (row) => `${row.itemName}::${row.dataSource}`
    });
  } else {
    grouped = groupDrilldownRows({
      rows: combined,
      groupKey: (row) => `${row.itemName}::${row.unitPoints}::${row.dataSource}`
    });
  }

  grouped.sort((a, b) => {
    const right = toNumber(b.totalPoints, 0);
    const left = toNumber(a.totalPoints, 0);
    if (right !== left) return right - left;
    return (a.itemName ?? '').localeCompare(b.itemName ?? '');
  });

  const paged = paginateList({ rows: grouped, page, pageSize });
  ctx.body = { code: 200, message: 'success', data: paged };
};

/**
 * 积分统计（按任务类别聚合到人员维度）
 * GET /api/reports/points-summary-task-category
 */
export const getPointsSummaryTaskCategoryPeriodReport = async (ctx) => {
  await validateQuery(ctx, pointsTaskCategorySummaryQuerySchema);
  const { startDate, endDate, keyword, cycle } = ctx.query;
  const dataFilter = ctx.state.dataFilter ?? {};
  const range = resolveDateRange(startDate, endDate);
  const keywordText = resolveText(keyword);
  const periodLabel = resolvePointsPeriodLabel({ cycle, startDate: range.startDate, endDate: range.endDate });

  const events = [];

  // 岗位工作：固定/临时/自行申请（按 task_category）
  const workLogWhere = {
    work_date: { [Op.between]: [range.startDate, range.endDate] },
    submit_time: { [Op.not]: null },
    review_status: { [Op.in]: ['approved', 'auto_approved'] },
    task_source: { [Op.in]: ['fixed', 'dispatch', 'self_apply'] }
  };

  if (keywordText) {
    workLogWhere.user_name = { [Op.like]: `%${keywordText}%` };
  }

  if (!dataFilter.all) {
    if (dataFilter.userId) {
      workLogWhere.user_id = dataFilter.userId;
    }
    if (dataFilter.stationIds?.length > 0) {
      workLogWhere.station_id = { [Op.in]: dataFilter.stationIds };
    }
  }

  const workLogs = await PositionWorkLog.findAll({
    where: workLogWhere,
    attributes: ['user_id', 'user_name', 'task_category', 'unit_points', 'quantity']
  });

  workLogs.forEach((log) => {
    events.push(buildPointsEvent({
      userId: log.user_id,
      userName: log.user_name ?? '',
      categoryCode: 'fixed',
      taskName: '',
      taskCategory: resolveTaskCategoryName(log.task_category),
      unitPoints: log.unit_points,
      quantity: log.quantity,
      dataSource: POINTS_DATA_SOURCE_SUMMARY
    }));
  });

  // 维修任务（RepairRecord.repair_tasks 里的 task_category）
  const repairWhere = {
    status: { [Op.in]: ['accepted', 'archived'] }
  };
  if (!dataFilter.all && dataFilter.stationIds?.length > 0) {
    repairWhere.station_id = { [Op.in]: dataFilter.stationIds };
  }

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
    const assistantNames = Array.from(assistantNameSet).map(name => resolveText(name)).filter(Boolean);
    if (assistantNames.length > 0) {
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
  }

  const shouldIncludeUser = (userId, userName) => {
    if (!dataFilter.all && dataFilter.userId) {
      if (userId !== dataFilter.userId) return false;
    }
    if (keywordText) {
      const nameText = resolveText(userName);
      if (!nameText.includes(keywordText)) return false;
    }
    return true;
  };

  const pushRepairTasks = ({ userId, userName, repairTasks }) => {
    repairTasks.forEach((task) => {
      events.push(buildPointsEvent({
        userId,
        userName,
        categoryCode: 'repair',
        taskName: '',
        taskCategory: resolveTaskCategoryName(task?.task_category),
        unitPoints: task?.points,
        quantity: task?.quantity,
        dataSource: POINTS_DATA_SOURCE_SUMMARY
      }));
    });
  };

  repairRecords.forEach((record) => {
    const date = record.verify_date || record.repair_end_date;
    if (!date) return;
    const dateStr = dayjs(date).format('YYYY-MM-DD');
    if (dateStr < range.startDate || dateStr > range.endDate) return;

    const leaderId = record.repair_person_id;
    const leaderName = record.repair_person_name ?? '';
    const repairTasks = Array.isArray(record.repair_tasks) ? record.repair_tasks : [];

    if (shouldIncludeUser(leaderId, leaderName)) {
      pushRepairTasks({ userId: leaderId, userName: leaderName, repairTasks });
    }

    const assistantNames = resolveAssistantNames(record.repair_assistant_name);
    if (assistantNames.length === 0) return;
    const uniqueAssistants = new Set(assistantNames);
    uniqueAssistants.forEach((assistantName) => {
      const nameText = resolveText(assistantName);
      if (!nameText) return;
      if (nameText === leaderName) return;
      const assistantId = assistantIdMap.get(nameText);
      if (!shouldIncludeUser(assistantId, nameText)) return;
      pushRepairTasks({ userId: assistantId, userName: nameText, repairTasks });
    });
  });

  // 人工导入（按 task_category）
  const manualWhere = {
    entry_date: { [Op.between]: [range.startDate, range.endDate] }
  };
  if (keywordText) {
    manualWhere.user_name = { [Op.like]: `%${keywordText}%` };
  }
  if (!dataFilter.all && dataFilter.userId) {
    manualWhere.user_id = dataFilter.userId;
  }

  const manualRows = await ManualPointsEntry.findAll({
    where: manualWhere,
    attributes: ['user_id', 'user_name', 'task_category', 'unit_points', 'quantity']
  });

  manualRows.forEach((row) => {
    events.push(buildPointsEvent({
      userId: row.user_id,
      userName: row.user_name ?? '',
      categoryCode: 'fixed',
      taskName: '',
      taskCategory: resolveTaskCategoryName(row.task_category),
      unitPoints: row.unit_points,
      quantity: row.quantity,
      dataSource: POINTS_DATA_SOURCE_MANUAL
    }));
  });

  const summaryMap = new Map();

  const buildUserKey = (uid, name) => {
    const hasId = uid !== undefined && uid !== null && uid !== '';
    if (hasId) return String(uid);
    const nameText = resolveText(name);
    return nameText ? `name::${nameText}` : 'unknown';
  };

  const ensureRow = (uid, name) => {
    const key = buildUserKey(uid, name);
    if (!summaryMap.has(key)) {
      summaryMap.set(key, {
        date: periodLabel,
        userId: uid,
        userName: resolveText(name),
        total: 0,
        breakdown: {}
      });
    }
    return summaryMap.get(key);
  };

  events.forEach((event) => {
    const taskCategory = resolveTaskCategoryName(event.taskCategory);
    const row = ensureRow(event.userId, event.userName);
    row.total += toNumber(event.points, 0);
    row.breakdown[taskCategory] = toNumber(row.breakdown[taskCategory], 0) + toNumber(event.points, 0);
  });

  const rows = Array.from(summaryMap.values());
  rows.sort((a, b) => {
    const right = toNumber(b.total, 0);
    const left = toNumber(a.total, 0);
    if (right !== left) return right - left;
    return (a.userName ?? '').localeCompare(b.userName ?? '');
  });

  const shouldPaginate = ctx.query.page !== undefined || ctx.query.pageSize !== undefined;
  const total = rows.length;
  if (!shouldPaginate) {
    ctx.body = { code: 200, message: 'success', data: rows };
    return;
  }

  const resolvedPage = resolvePageValue(ctx.query.page, 1);
  const resolvedSize = resolvePageSize(ctx.query.pageSize, 10);
  const startIndex = (resolvedPage - 1) * resolvedSize;
  const list = rows.slice(startIndex, startIndex + resolvedSize);
  ctx.body = { code: 200, message: 'success', data: { list, total, page: resolvedPage, pageSize: resolvedSize } };
};

const resolvePointsPeriodLabel = ({ cycle, startDate, endDate }) => {
  const cycleText = resolveText(cycle);
  if (cycleText === 'month') {
    return dayjs(startDate).format('YYYY年M月');
  }
  if (cycleText === 'year') {
    return dayjs(startDate).format('YYYY年');
  }
  if (cycleText === 'week') {
    return `${startDate}~${endDate}`;
  }
  if (startDate === endDate) return startDate;
  return `${startDate}~${endDate}`;
};

const buildPointsEvent = ({ userId, userName, categoryCode, taskName, unitPoints, quantity, dataSource, taskCategory, deductionReason }) => {
  const unit = toNumber(unitPoints, 0);
  const qty = toNumber(quantity, 1);
  return {
    userId,
    userName: resolveText(userName),
    categoryCode,
    taskName: resolveText(taskName),
    taskCategory: resolveText(taskCategory),
    unitPoints: unit,
    quantity: qty,
    points: unit * qty,
    dataSource,
    deductionReason: resolveText(deductionReason)
  };
};

export const loadManualPointsEvents = async ({ range, keywordText, dataFilter }) => {
  const where = {
    entry_date: { [Op.between]: [range.startDate, range.endDate] }
  };

  if (keywordText) {
    where.user_name = { [Op.like]: `%${keywordText}%` };
  }

  if (!dataFilter.all && dataFilter.userId) {
    where.user_id = dataFilter.userId;
  }

  const rows = await ManualPointsEntry.findAll({
    where,
    attributes: ['entry_date', 'user_id', 'user_name', 'category_code', 'task_category', 'task_name', 'unit_points', 'quantity']
  });

  return rows
    .map((row) => buildPointsEvent({
      userId: row.user_id,
      userName: row.user_name,
      categoryCode: normalizePointsCategoryCode(row.category_code),
      taskCategory: row.task_category,
      taskName: row.task_name,
      unitPoints: row.unit_points,
      quantity: row.quantity,
      dataSource: POINTS_DATA_SOURCE_MANUAL
    }))
    .filter(item => item.categoryCode);
};

export const loadAutoPointsEvents = async ({ range, keywordText, dataFilter }) => {
  const events = [];

  // 固定/派发/申请/扣分（岗位工作汇总）
  const workLogWhere = {
    work_date: { [Op.between]: [range.startDate, range.endDate] },
    submit_time: { [Op.not]: null },
    review_status: { [Op.in]: ['approved', 'auto_approved'] }
  };

  if (keywordText) {
    workLogWhere.user_name = { [Op.like]: `%${keywordText}%` };
  }

  if (!dataFilter.all) {
    if (dataFilter.userId) {
      workLogWhere.user_id = dataFilter.userId;
    }
    if (dataFilter.stationIds?.length > 0) {
      workLogWhere.station_id = { [Op.in]: dataFilter.stationIds };
    }
  }

  const workLogs = await PositionWorkLog.findAll({
    where: workLogWhere,
    attributes: [
      'user_id',
      'user_name',
      'task_source',
      'task_category',
      'work_name',
      'unit_points',
      'quantity',
      'deduction_reason',
      'deduction_points'
    ]
  });

  workLogs.forEach((log) => {
    const userId = log.user_id;
    const userName = log.user_name ?? '';
    const taskSource = resolveText(log.task_source);
    const workName = resolveText(log.work_name);
    const taskCategory = resolveText(log.task_category);
    const unitPoints = toNumber(log.unit_points, 0);
    const quantityValue = toNumber(log.quantity, 1);

    if (taskSource === 'fixed') {
      events.push(buildPointsEvent({
        userId,
        userName,
        categoryCode: 'fixed',
        taskName: workName,
        taskCategory,
        unitPoints,
        quantity: quantityValue,
        dataSource: POINTS_DATA_SOURCE_SUMMARY
      }));
    } else if (taskSource === 'dispatch') {
      events.push(buildPointsEvent({
        userId,
        userName,
        categoryCode: 'dispatch',
        taskName: workName,
        taskCategory,
        unitPoints,
        quantity: quantityValue,
        dataSource: POINTS_DATA_SOURCE_SUMMARY
      }));
    } else if (taskSource === 'self_apply') {
      events.push(buildPointsEvent({
        userId,
        userName,
        categoryCode: 'selfApply',
        taskName: workName,
        taskCategory,
        unitPoints,
        quantity: quantityValue,
        dataSource: POINTS_DATA_SOURCE_SUMMARY
      }));
    }

    const deductionValue = toNumber(log.deduction_points, 0);
    if (deductionValue !== 0) {
      const reasonText = resolveText(log.deduction_reason);
      events.push(buildPointsEvent({
        userId,
        userName,
        categoryCode: 'deduction',
        taskName: workName ? workName : '扣分',
        deductionReason: reasonText,
        unitPoints: deductionValue,
        quantity: 1,
        dataSource: POINTS_DATA_SOURCE_SUMMARY
      }));
    }
  });

  // 安全自检
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

  const workTypes = await SafetyWorkType.findAll({ attributes: ['id', 'points', 'work_type_name'] });
  const workTypeInfoMap = new Map();
  workTypes.forEach((wt) => {
    workTypeInfoMap.set(wt.id, {
      name: wt.work_type_name ?? '',
      points: toNumber(wt.points, 0)
    });
  });

  safetySelfInspections.forEach((inspection) => {
    const userId = inspection.filler_id;
    const userName = inspection.filler_name ?? '';
    const workTypeIds = Array.isArray(inspection.work_type_ids) ? inspection.work_type_ids : [];
    workTypeIds.forEach((wtId) => {
      const info = workTypeInfoMap.get(wtId) ?? { name: '', points: 0 };
      events.push(buildPointsEvent({
        userId,
        userName,
        categoryCode: 'safety',
        taskName: info.name,
        unitPoints: info.points,
        quantity: 1,
        dataSource: POINTS_DATA_SOURCE_SUMMARY
      }));
    });
  });

  // 安全他检
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

  safetyOtherInspections.forEach((inspection) => {
    events.push(buildPointsEvent({
      userId: inspection.inspected_user_id,
      userName: inspection.inspected_user_name ?? '',
      categoryCode: 'safety',
      taskName: '安全他检',
      unitPoints: toNumber(inspection.points, 0),
      quantity: 1,
      dataSource: POINTS_DATA_SOURCE_SUMMARY
    }));
  });

  // 卫生自检
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

  const hygieneAreas = await HygieneArea.findAll({ attributes: ['id', 'points', 'area_name'] });
  const hygieneAreaInfoMap = new Map();
  hygieneAreas.forEach((ha) => {
    hygieneAreaInfoMap.set(ha.id, {
      name: ha.area_name ?? '',
      points: toNumber(ha.points, 0)
    });
  });

  hygieneSelfInspections.forEach((inspection) => {
    const userId = inspection.filler_id;
    const userName = inspection.filler_name ?? '';
    const inspectionItems = Array.isArray(inspection.inspection_items) ? inspection.inspection_items : [];
    const areaIds = new Set();

    inspectionItems.forEach((item) => {
      if (item?.areaId) {
        areaIds.add(item.areaId);
      }
    });

    areaIds.forEach((areaId) => {
      const info = hygieneAreaInfoMap.get(areaId) ?? { name: '', points: 0 };
      events.push(buildPointsEvent({
        userId,
        userName,
        categoryCode: 'hygiene',
        taskName: info.name,
        unitPoints: info.points,
        quantity: 1,
        dataSource: POINTS_DATA_SOURCE_SUMMARY
      }));
    });
  });

  // 卫生他检
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

  hygieneOtherInspections.forEach((inspection) => {
    events.push(buildPointsEvent({
      userId: inspection.inspected_user_id,
      userName: inspection.inspected_user_name ?? '',
      categoryCode: 'hygiene',
      taskName: '卫生他检',
      unitPoints: toNumber(inspection.points, 0),
      quantity: 1,
      dataSource: POINTS_DATA_SOURCE_SUMMARY
    }));
  });

  // 维修积分
  const repairWhere = {
    status: { [Op.in]: ['accepted', 'archived'] }
  };

  if (!dataFilter.all && dataFilter.stationIds?.length > 0) {
    repairWhere.station_id = { [Op.in]: dataFilter.stationIds };
  }

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

  const shouldIncludeUser = (userId, userName) => {
    if (!dataFilter.all && dataFilter.userId) {
      if (userId !== dataFilter.userId) return false;
    }
    if (keywordText) {
      const nameText = resolveText(userName);
      if (!nameText.includes(keywordText)) return false;
    }
    return true;
  };

  const pushRepairTasks = ({ userId, userName, repairTasks }) => {
    repairTasks.forEach((task) => {
      const taskPoints = toNumber(task?.points, 0);
      const taskQuantity = toNumber(task?.quantity, 1);
      events.push(buildPointsEvent({
        userId,
        userName,
        categoryCode: 'repair',
        taskName: task?.task_name ?? task?.job_name ?? '',
        taskCategory: task?.task_category ?? '',
        unitPoints: taskPoints,
        quantity: taskQuantity,
        dataSource: POINTS_DATA_SOURCE_SUMMARY
      }));
    });
  };

  repairRecords.forEach((record) => {
    const date = record.verify_date || record.repair_end_date;
    if (!date) return;

    const dateStr = dayjs(date).format('YYYY-MM-DD');
    if (dateStr < range.startDate || dateStr > range.endDate) return;

    const leaderId = record.repair_person_id;
    const leaderName = record.repair_person_name ?? '';
    const repairTasks = Array.isArray(record.repair_tasks) ? record.repair_tasks : [];

    if (shouldIncludeUser(leaderId, leaderName)) {
      pushRepairTasks({ userId: leaderId, userName: leaderName, repairTasks });
    }

    const assistantNames = resolveAssistantNames(record.repair_assistant_name);
    if (assistantNames.length === 0) return;

    const uniqueAssistants = new Set(assistantNames);
    uniqueAssistants.forEach((assistantName) => {
      const nameText = resolveText(assistantName);
      if (!nameText) return;
      if (nameText === leaderName) return;
      const assistantId = assistantIdMap.get(nameText);

      if (!shouldIncludeUser(assistantId, nameText)) return;
      pushRepairTasks({ userId: assistantId, userName: nameText, repairTasks });
    });
  });

  // 保养积分（合格项计分；验收不通过扣分归入扣分列）
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

  maintenanceRecords.forEach((record) => {
    const userId = record.executor_id;
    const userName = record.executor_name ?? '';
    const maintenanceItems = Array.isArray(record.maintenance_items) ? record.maintenance_items : [];
    const verifyResult = resolveText(record.verify_result);

    maintenanceItems.forEach((item) => {
      const confirmed = item?.confirmed === true || item?.confirmed === 1;
      if (!confirmed) return;
      const rawPoints = item?.points;
      const parsedPoints = rawPoints === undefined || rawPoints === null || rawPoints === '' ? 0 : Number(rawPoints);
      const points = Number.isNaN(parsedPoints) ? 0 : parsedPoints;
      events.push(buildPointsEvent({
        userId,
        userName,
        categoryCode: 'maintenance',
        taskName: item?.name ?? item?.item_name ?? '',
        unitPoints: points,
        quantity: 1,
        dataSource: POINTS_DATA_SOURCE_SUMMARY
      }));
    });

    if (verifyResult === 'fail') {
      const deductionPoints = record.deduction_points !== undefined && record.deduction_points !== null ? Number(record.deduction_points) : 0;
      const safeDeduction = Number.isNaN(deductionPoints) ? 0 : deductionPoints;
      if (safeDeduction !== 0) {
        const remarkText = resolveText(record.deduction_remark);
        const taskName = remarkText ? `验收不通过扣分：${remarkText}` : '验收不通过扣分';
        events.push(buildPointsEvent({
          userId,
          userName,
          categoryCode: 'deduction',
          taskName,
          unitPoints: safeDeduction,
          quantity: 1,
          dataSource: POINTS_DATA_SOURCE_SUMMARY
        }));
      }
    }
  });

  return events.filter(item => item.categoryCode);
};

/**
 * 积分汇总（按周期聚合到人员维度）
 * GET /api/reports/points-summary-period
 */
export const getPointsSummaryPeriodReport = async (ctx) => {
  await validateQuery(ctx, pointsSummaryReportQuerySchema);
  const { startDate, endDate, keyword, userName, cycle } = ctx.query;
  const dataFilter = ctx.state.dataFilter ?? {};
  const range = resolveDateRange(startDate, endDate);
  const keywordText = resolveText(keyword) ? resolveText(keyword) : resolveText(userName);
  const periodLabel = resolvePointsPeriodLabel({ cycle, startDate: range.startDate, endDate: range.endDate });

  const [autoEvents, manualEvents] = await Promise.all([
    loadAutoPointsEvents({ range, keywordText, dataFilter }),
    loadManualPointsEvents({ range, keywordText, dataFilter })
  ]);

  const events = [...autoEvents, ...manualEvents];
  const summaryMap = new Map();

  const buildUserKey = (uid, name) => {
    const hasId = uid !== undefined && uid !== null && uid !== '';
    if (hasId) return String(uid);
    const nameText = resolveText(name);
    return nameText ? `name::${nameText}` : 'unknown';
  };

  const ensureRow = (uid, name) => {
    const key = buildUserKey(uid, name);
    if (!summaryMap.has(key)) {
      summaryMap.set(key, {
        date: periodLabel,
        userId: uid,
        userName: resolveText(name),
        safety: 0,
        hygiene: 0,
        repair: 0,
        maintenance: 0,
        fixed: 0,
        dispatch: 0,
        selfApply: 0,
        deduction: 0,
        deductions: []
      });
    }
    return summaryMap.get(key);
  };

  events.forEach((event) => {
    const row = ensureRow(event.userId, event.userName);
    if (POINTS_CATEGORY_CODES.includes(event.categoryCode)) {
      row[event.categoryCode] += event.points;
    }
    // 收集扣分明细
    if (event.categoryCode === 'deduction' && event.points < 0) {
      row.deductions.push({
        taskName: event.taskName ?? '',
        reason: event.deductionReason ?? event.taskName ?? '',
        points: event.points
      });
    }
  });

  const rows = Array.from(summaryMap.values()).map((row) => {
    const total = row.safety
      + row.hygiene
      + row.repair
      + row.maintenance
      + row.fixed
      + row.dispatch
      + row.selfApply
      + row.deduction;
    return { ...row, total };
  });

  rows.sort((a, b) => {
    const leftName = a.userName ?? '';
    const rightName = b.userName ?? '';
    return leftName.localeCompare(rightName);
  });

  const shouldPaginate = ctx.query.page !== undefined || ctx.query.pageSize !== undefined;
  const total = rows.length;

  if (!shouldPaginate) {
    ctx.body = { code: 200, message: 'success', data: rows };
    return;
  }

  const page = resolvePageValue(ctx.query.page, 1);
  const pageSize = resolvePageSize(ctx.query.pageSize, 10);
  const startIndex = (page - 1) * pageSize;
  const list = rows.slice(startIndex, startIndex + pageSize);

  ctx.body = { code: 200, message: 'success', data: { list, total, page, pageSize } };
};

export const downloadManualPointsTemplate = async (ctx) => {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();

  const sheet = workbook.addWorksheet('人工积分导入');
  sheet.columns = [
    { header: '人员姓名', key: 'userName', width: 18 },
    { header: '日期', key: 'date', width: 14 },
    { header: '得分大类', key: 'scoreCategory', width: 14 },
    { header: '任务类别', key: 'taskCategory', width: 14 },
    { header: '任务名称', key: 'taskName', width: 28 },
    { header: '单位积分', key: 'unitPoints', width: 12 },
    { header: '数量', key: 'quantity', width: 12 },
    { header: '备注', key: 'remark', width: 24 }
  ];

  sheet.addRow({
    userName: '示例员工',
    date: dayjs().format('YYYY-MM-DD'),
    scoreCategory: '固定工作',
    taskCategory: 'Ⅰ类',
    taskName: '人工录入示例',
    unitPoints: 1,
    quantity: 1,
    remark: ''
  });

  addTemplateInstructionSheet(workbook, [
    ['人员姓名', '必填，必须能匹配系统用户姓名/账号。'],
    ['日期', '必填，格式 YYYY-MM-DD。'],
    ['得分大类', `必填，可选：${Array.from(POINTS_CATEGORY_LABEL_MAP.keys()).filter(k => k !== '派发任务').join(' / ')}。`],
    ['任务类别', `选填（不填默认“Ⅰ类”），可选：${TASK_CATEGORY_OPTIONS.join(' / ')}；用于“按任务类别”可视化。`],
    ['任务名称', '必填。'],
    ['单位积分', '必填，数字，可为负数（扣分）。'],
    ['完成次数', '必填，整数 >= 1。'],
    ['备注', '选填。']
  ]);

  const buffer = await workbook.xlsx.writeBuffer();
  ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  ctx.set('Content-Disposition', `attachment; filename=\"template.xlsx\"; filename*=UTF-8''${encodeURIComponent('人工积分导入模板.xlsx')}`);
  ctx.body = buffer;
};

export const previewImportManualPoints = async (ctx) => {
  const file = ctx.file || ctx.request?.file || ctx.request?.files?.file;
  if (!file) {
    throw createError(400, '请上传Excel文件');
  }

  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file.buffer);
  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) {
    throw createError(400, 'Excel内容为空');
  }

  const normalizeCellValue = (value) => {
    if (value && typeof value === 'object') {
      if (value.text !== undefined) return value.text;
      if (value.result !== undefined) return value.result;
      if (Array.isArray(value.richText)) {
        return value.richText.map(item => item.text ?? '').join('');
      }
    }
    return value;
  };

  const parseText = (value) => {
    const normalized = normalizeCellValue(value);
    if (normalized === undefined || normalized === null) return '';
    return String(normalized).trim();
  };

  const parseNumber = (value) => {
    const normalized = normalizeCellValue(value);
    if (normalized === undefined || normalized === null || normalized === '') return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const parseInteger = (value) => {
    const normalized = normalizeCellValue(value);
    if (normalized === undefined || normalized === null || normalized === '') return null;
    const parsed = Number.parseInt(normalized, 10);
    return Number.isInteger(parsed) ? parsed : null;
  };

  const parseDate = (value) => {
    const normalized = normalizeCellValue(value);
    if (!normalized) return '';
    if (normalized instanceof Date) {
      return dayjs(normalized).format('YYYY-MM-DD');
    }
    const text = String(normalized).trim();
    const parsed = dayjs(text);
    return parsed.isValid() ? parsed.format('YYYY-MM-DD') : '';
  };

  const headerMap = new Map();
  const headerRow = worksheet.getRow(1);
  if (headerRow?.hasValues) {
    headerRow.eachCell((cell, colNumber) => {
      const headerText = parseText(cell.value);
      if (headerText) headerMap.set(headerText, colNumber);
    });
  }

  const colIndex = {
    userName: headerMap.get('人员姓名') ?? 1,
    date: headerMap.get('日期') ?? 2,
    category: headerMap.get('得分大类') ?? headerMap.get('类别') ?? 3,
    taskCategory: headerMap.get('任务类别') ?? 4,
    taskName: headerMap.get('任务名称') ?? 5,
    unitPoints: headerMap.get('单位积分') ?? 6,
    quantity: headerMap.get('完成次数') ?? 7,
    remark: headerMap.get('备注') ?? 8
  };

  const candidates = [];
  const summary = { total: 0, create: 0, update: 0, skip: 0, error: 0 };

  for (let i = 2; i <= worksheet.rowCount; i += 1) {
    const row = worksheet.getRow(i);
    if (!row.hasValues) continue;

    summary.total += 1;

    const userName = parseText(row.getCell(colIndex.userName).value);
    const date = parseDate(row.getCell(colIndex.date).value);
    const categoryText = parseText(row.getCell(colIndex.category).value);
    const categoryCode = normalizePointsCategoryCode(categoryText);
    const taskCategoryText = parseText(row.getCell(colIndex.taskCategory).value);
    const taskName = parseText(row.getCell(colIndex.taskName).value);
    const unitPoints = parseNumber(row.getCell(colIndex.unitPoints).value);
    const quantity = parseInteger(row.getCell(colIndex.quantity).value);
    const remark = parseText(row.getCell(colIndex.remark).value);

    const item = {
      rowNum: i,
      userName,
      date,
      categoryCode,
      categoryText,
      taskCategory: normalizeTaskCategory(taskCategoryText),
      taskCategoryText,
      taskName,
      unitPoints,
      quantity,
      remark: remark ? remark : ''
    };

    const errorMessages = [];
    if (!userName) errorMessages.push('人员姓名不能为空');
    if (!date) errorMessages.push('日期格式不正确');
    if (!categoryCode) errorMessages.push('得分大类不正确');
    if (!taskName) errorMessages.push('任务名称不能为空');
    if (unitPoints === null) errorMessages.push('单位积分必须为数字');
    if (!quantity || quantity < 1) errorMessages.push('完成次数必须为整数且>=1');

    candidates.push({ ...item, error: errorMessages.length ? errorMessages.join('；') : '' });
  }

  const uniqueNames = Array.from(
    new Set(candidates.map(item => resolveText(item.userName)).filter(Boolean))
  );
  const users = uniqueNames.length > 0
    ? await User.findAll({
      where: {
        [Op.or]: [
          { real_name: { [Op.in]: uniqueNames } },
          { username: { [Op.in]: uniqueNames } }
        ]
      },
      attributes: ['id', 'real_name', 'username']
    })
    : [];

  const userIdMap = new Map();
  users.forEach((u) => {
    const realName = resolveText(u.real_name);
    const username = resolveText(u.username);
    if (realName) userIdMap.set(realName, u.id);
    if (username) userIdMap.set(username, u.id);
  });

  const rows = [];
  for (const item of candidates) {
    const previewRow = {
      rowNum: item.rowNum,
      action: 'error',
      message: '',
      diff: {},
      userName: item.userName,
      date: item.date,
      category: item.categoryText,
      taskCategory: item.taskCategoryText,
      taskName: item.taskName,
      unitPoints: item.unitPoints,
      quantity: item.quantity,
      remark: item.remark
    };

    if (item.error) {
      previewRow.message = item.error;
      summary.error += 1;
      rows.push(previewRow);
      continue;
    }

    const uid = userIdMap.get(resolveText(item.userName)) ?? null;
    if (!uid) {
      previewRow.message = `未找到用户：${item.userName}`;
      summary.error += 1;
      rows.push(previewRow);
      continue;
    }

    const where = {
      user_id: uid,
      entry_date: item.date,
      category_code: item.categoryCode,
      task_category: item.taskCategory ?? null,
      task_name: item.taskName
    };

    const existing = await ManualPointsEntry.findOne({ where });
    if (!existing) {
      previewRow.action = 'create';
      previewRow.message = '将新增';
      summary.create += 1;
      rows.push(previewRow);
      continue;
    }

    const diff = {};
    if (!isSameNumber(existing.unit_points, item.unitPoints)) {
      diff.unitPoints = { from: existing.unit_points, to: item.unitPoints };
    }
    if (existing.quantity !== item.quantity) {
      diff.quantity = { from: existing.quantity, to: item.quantity };
    }
    if (item.remark && item.remark !== existing.remark) {
      diff.remark = { from: existing.remark ?? '', to: item.remark };
    }

    previewRow.diff = diff;
    if (Object.keys(diff).length === 0) {
      previewRow.action = 'skip';
      previewRow.message = '无变更，跳过';
      summary.skip += 1;
    } else {
      previewRow.action = 'update';
      previewRow.message = '将更新';
      summary.update += 1;
    }

    rows.push(previewRow);
  }

  ctx.body = {
    code: 200,
    message: 'success',
    data: { summary, rows }
  };
};

export const importManualPoints = async (ctx) => {
  const file = ctx.file || ctx.request?.file || ctx.request?.files?.file;
  if (!file) {
    throw createError(400, '请上传Excel文件');
  }

  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file.buffer);
  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) {
    throw createError(400, 'Excel内容为空');
  }

  const normalizeCellValue = (value) => {
    if (value && typeof value === 'object') {
      if (value.text !== undefined) return value.text;
      if (value.result !== undefined) return value.result;
      if (Array.isArray(value.richText)) {
        return value.richText.map(item => item.text ?? '').join('');
      }
    }
    return value;
  };

  const parseText = (value) => {
    const normalized = normalizeCellValue(value);
    if (normalized === undefined || normalized === null) return '';
    return String(normalized).trim();
  };

  const parseNumber = (value) => {
    const normalized = normalizeCellValue(value);
    if (normalized === undefined || normalized === null || normalized === '') return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const parseInteger = (value) => {
    const normalized = normalizeCellValue(value);
    if (normalized === undefined || normalized === null || normalized === '') return null;
    const parsed = Number.parseInt(normalized, 10);
    return Number.isInteger(parsed) ? parsed : null;
  };

  const parseDate = (value) => {
    const normalized = normalizeCellValue(value);
    if (!normalized) return '';
    if (normalized instanceof Date) {
      return dayjs(normalized).format('YYYY-MM-DD');
    }
    const text = String(normalized).trim();
    const parsed = dayjs(text);
    return parsed.isValid() ? parsed.format('YYYY-MM-DD') : '';
  };

  const headerMap = new Map();
  const headerRow = worksheet.getRow(1);
  if (headerRow?.hasValues) {
    headerRow.eachCell((cell, colNumber) => {
      const headerText = parseText(cell.value);
      if (headerText) headerMap.set(headerText, colNumber);
    });
  }

  const colIndex = {
    userName: headerMap.get('人员姓名') ?? 1,
    date: headerMap.get('日期') ?? 2,
    category: headerMap.get('得分大类') ?? headerMap.get('类别') ?? 3,
    taskCategory: headerMap.get('任务类别') ?? 4,
    taskName: headerMap.get('任务名称') ?? 5,
    unitPoints: headerMap.get('单位积分') ?? 6,
    quantity: headerMap.get('完成次数') ?? 7,
    remark: headerMap.get('备注') ?? 8
  };

  const pendingRows = [];
  const userNames = [];
  const errors = [];

  for (let i = 2; i <= worksheet.rowCount; i += 1) {
    const row = worksheet.getRow(i);
    if (!row.hasValues) continue;

    const userName = parseText(row.getCell(colIndex.userName).value);
    const date = parseDate(row.getCell(colIndex.date).value);
    const categoryText = parseText(row.getCell(colIndex.category).value);
    const categoryCode = normalizePointsCategoryCode(categoryText);
    const taskCategoryText = parseText(row.getCell(colIndex.taskCategory).value);
    const taskName = parseText(row.getCell(colIndex.taskName).value);
    const unitPoints = parseNumber(row.getCell(colIndex.unitPoints).value);
    const quantity = parseInteger(row.getCell(colIndex.quantity).value);
    const remark = parseText(row.getCell(colIndex.remark).value);

    if (!userName) {
      errors.push(`第${i}行：人员姓名不能为空`);
      continue;
    }
    if (!date) {
      errors.push(`第${i}行：日期格式不正确`);
      continue;
    }
    if (!categoryCode) {
      errors.push(`第${i}行：得分大类不正确`);
      continue;
    }
    if (!taskName) {
      errors.push(`第${i}行：任务名称不能为空`);
      continue;
    }
    if (unitPoints === null) {
      errors.push(`第${i}行：单位积分必须为数字`);
      continue;
    }
    if (!quantity || quantity < 1) {
      errors.push(`第${i}行：完成次数必须为整数且>=1`);
      continue;
    }

    pendingRows.push({
      entry_date: date,
      user_name: userName,
      category_code: categoryCode,
      task_category: normalizeTaskCategory(taskCategoryText),
      task_name: taskName,
      unit_points: unitPoints,
      quantity,
      remark: remark ? remark : null
    });
    userNames.push(userName);
  }

  if (pendingRows.length === 0) {
    throw createError(400, errors.length > 0 ? errors[0] : '导入数据为空');
  }

  const uniqueNames = Array.from(new Set(userNames.map(name => resolveText(name)).filter(Boolean)));
  const users = await User.findAll({
    where: {
      [Op.or]: [
        { real_name: { [Op.in]: uniqueNames } },
        { username: { [Op.in]: uniqueNames } }
      ]
    },
    attributes: ['id', 'real_name', 'username']
  });

  const userIdMap = new Map();
  users.forEach((u) => {
    const realName = resolveText(u.real_name);
    const username = resolveText(u.username);
    if (realName) userIdMap.set(realName, u.id);
    if (username) userIdMap.set(username, u.id);
  });

  const creator = ctx.state.user ?? {};
  const createdById = creator.id;
  const createdByName = creator.realName ? creator.realName : (creator.username ? creator.username : '');

  const toCreate = [];
  pendingRows.forEach((row, idx) => {
    const nameText = resolveText(row.user_name);
    const uid = userIdMap.get(nameText);
    if (!uid) {
      errors.push(`第${idx + 2}行：未找到用户：${nameText}`);
      return;
    }
    toCreate.push({
      ...row,
      user_id: uid,
      created_by_id: createdById,
      created_by_name: createdByName
    });
  });

  if (toCreate.length === 0) {
    throw createError(400, errors.length > 0 ? errors[0] : '导入失败');
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of toCreate) {
    const where = {
      user_id: row.user_id,
      entry_date: row.entry_date,
      category_code: row.category_code,
      task_category: row.task_category ?? null,
      task_name: row.task_name
    };

    const existing = await ManualPointsEntry.findOne({ where });
    if (!existing) {
      await ManualPointsEntry.create(row);
      created += 1;
      continue;
    }

    const patch = {};
    if (!isSameNumber(existing.unit_points, row.unit_points)) {
      patch.unit_points = row.unit_points;
    }
    if (existing.quantity !== row.quantity) {
      patch.quantity = row.quantity;
    }
    if (row.remark && row.remark !== existing.remark) {
      patch.remark = row.remark;
    }
    if (row.user_name && row.user_name !== existing.user_name) {
      patch.user_name = row.user_name;
    }

    if (Object.keys(patch).length === 0) {
      skipped += 1;
      continue;
    }

    await existing.update(patch);
    updated += 1;
  }

  ctx.body = {
    code: 200,
    message: 'success',
    data: { created, updated, skipped, errors }
  };
};

/**
 * 应用小时积分（滚动窗口：记录月往前6个整月的累计积分 / 累计工时）
 * GET /api/reports/applied-hourly-points
 */
const buildRecentMonths = (endMonthBase, count) => {
  const resolved = endMonthBase && endMonthBase.isValid ? endMonthBase : dayjs().startOf('month');
  const total = Number.isInteger(count) && count > 0 ? count : 12;
  const months = [];
  for (let i = total - 1; i >= 0; i -= 1) {
    months.push(resolved.subtract(i, 'month').format('YYYY-MM'));
  }
  return months;
};

const buildMonthSequence = (startMonth, endMonth) => {
  const startText = resolveText(startMonth);
  const endText = resolveText(endMonth);
  if (!startText || !endText) return [];

  const startBase = dayjs(`${startText}-01`);
  const endBase = dayjs(`${endText}-01`);
  if (!startBase.isValid() || !endBase.isValid()) return [];
  if (startBase.isAfter(endBase)) return [];

  const months = [];
  let cursor = startBase.startOf('month');
  const end = endBase.startOf('month');
  while (cursor.isSame(end) || cursor.isBefore(end)) {
    months.push(cursor.format('YYYY-MM'));
    cursor = cursor.add(1, 'month');
  }
  return months;
};

const resolveAppliedHourlyRangeByRecordMonth = (recordMonthBase) => {
  const base = recordMonthBase.startOf('month');
  const rangeStartBase = base.subtract(6, 'month').startOf('month');
  const rangeEndBase = base.subtract(1, 'month').endOf('month');

  return {
    recordMonth: base.format('YYYY-MM'),
    rangeStartMonth: rangeStartBase.format('YYYY-MM'),
    rangeEndMonth: base.subtract(1, 'month').format('YYYY-MM'),
    startDate: rangeStartBase.format('YYYY-MM-DD'),
    endDate: rangeEndBase.format('YYYY-MM-DD')
  };
};

export const getAppliedHourlyPointsReport = async (ctx) => {
  await validateQuery(ctx, appliedHourlyPointsQuerySchema);
  const dataFilter = ctx.state.dataFilter ?? {};

  const recordMonthText = resolveText(ctx.query.endMonth);
  const recordMonthBase = recordMonthText ? dayjs(`${recordMonthText}-01`) : dayjs().startOf('month');
  if (!recordMonthBase.isValid()) {
    throw createError(400, '记录月份格式不正确（YYYY-MM）');
  }

  const resolvedRange = resolveAppliedHourlyRangeByRecordMonth(recordMonthBase);
  const recordMonth = resolvedRange.recordMonth;
  const range = { startDate: resolvedRange.startDate, endDate: resolvedRange.endDate };

  const [autoEvents, manualEvents] = await Promise.all([
    loadAutoPointsEvents({ range, keywordText: '', dataFilter }),
    loadManualPointsEvents({ range, keywordText: '', dataFilter })
  ]);

  const pointsByUser = new Map();
  const ensureUserRow = (event) => {
    const uid = event.userId;
    if (uid === undefined || uid === null || uid === '') return null;
    const key = String(uid);
    if (!pointsByUser.has(key)) {
      pointsByUser.set(key, {
        userId: uid,
        userName: resolveText(event.userName),
        totalPoints: 0
      });
    }
    return pointsByUser.get(key);
  };

  [...autoEvents, ...manualEvents].forEach((event) => {
    const row = ensureUserRow(event);
    if (!row) return;
    row.totalPoints += toNumber(event.points, 0);
  });

  const hoursWhere = {
    work_date: { [Op.between]: [range.startDate, range.endDate] }
  };
  if (!dataFilter.all && dataFilter.userId) {
    hoursWhere.user_id = dataFilter.userId;
  }

  const hoursRows = await ManualWorkHour.findAll({
    where: hoursWhere,
    attributes: [
      'user_id',
      'user_name',
      [fn('SUM', col('work_hours')), 'total_hours']
    ],
    group: ['user_id', 'user_name']
  });

  const hoursByUser = new Map();
  hoursRows.forEach((row) => {
    const uid = row.user_id;
    if (uid === undefined || uid === null || uid === '') return;
    const key = String(uid);
    const hours = toNumber(row.get('total_hours'), 0);
    hoursByUser.set(key, {
      userId: uid,
      userName: resolveText(row.user_name),
      totalHours: hours
    });
  });

  const allUserKeys = new Set([...pointsByUser.keys(), ...hoursByUser.keys()]);

  // 查询已保存的修正值
  const adjustedRecords = await AdjustedHourlyPoints.findAll({
    where: { end_month: recordMonth }
  });
  const adjustedMap = new Map();
  adjustedRecords.forEach((rec) => {
    adjustedMap.set(String(rec.user_id), Number(rec.adjusted_points));
  });

  const rows = Array.from(allUserKeys).map((key) => {
    const pointsRow = pointsByUser.get(key);
    const hoursRow = hoursByUser.get(key);
    const userId = pointsRow ? pointsRow.userId : (hoursRow ? hoursRow.userId : null);
    const userName = resolveText(pointsRow?.userName) ? pointsRow.userName : (hoursRow ? hoursRow.userName : '');
    const totalPoints = toNumber(pointsRow?.totalPoints, 0);
    const totalHours = toNumber(hoursRow?.totalHours, 0);
    const appliedHourlyPoints = totalHours > 0 ? totalPoints / totalHours : null;
    // 如果有保存的修正值则使用，否则返回 null（前端会根据规则计算默认值）
    const adjustedPoints = adjustedMap.has(key) ? adjustedMap.get(key) : null;
    return {
      recordMonth,
      rangeStartMonth: resolvedRange.rangeStartMonth,
      rangeEndMonth: resolvedRange.rangeEndMonth,
      userId,
      userName,
      totalPoints,
      totalHours,
      appliedHourlyPoints,
      adjustedPoints
    };
  });

  rows.sort((a, b) => {
    const left = a.appliedHourlyPoints;
    const right = b.appliedHourlyPoints;
    const leftHas = left !== null && left !== undefined && Number.isFinite(Number(left));
    const rightHas = right !== null && right !== undefined && Number.isFinite(Number(right));
    if (leftHas && rightHas) return Number(right) - Number(left);
    if (rightHas && !leftHas) return 1;
    if (leftHas && !rightHas) return -1;
    const leftPoints = toNumber(a.totalPoints, 0);
    const rightPoints = toNumber(b.totalPoints, 0);
    if (rightPoints !== leftPoints) return rightPoints - leftPoints;
    return (a.userName ?? '').localeCompare(b.userName ?? '');
  });

  const page = resolvePageValue(ctx.query.page, 1);
  const pageSize = resolvePageSize(ctx.query.pageSize, 10);
  const total = rows.length;
  const startIndex = (page - 1) * pageSize;
  const list = rows.slice(startIndex, startIndex + pageSize);

  // 保存实际值快照（覆盖更新），修正值不在此处写入
  const snapshotRows = rows
    .filter(row => row.userId !== null && row.userId !== undefined && row.userId !== '')
    .map(row => ({
      user_id: row.userId,
      end_month: recordMonth,
      actual_points: row.appliedHourlyPoints,
      total_points: row.totalPoints,
      total_hours: row.totalHours,
      range_start_month: resolvedRange.rangeStartMonth,
      range_end_month: resolvedRange.rangeEndMonth
    }));

  if (snapshotRows.length > 0) {
    await AdjustedHourlyPoints.bulkCreate(snapshotRows, {
      updateOnDuplicate: ['actual_points', 'total_points', 'total_hours', 'range_start_month', 'range_end_month']
    });
  }

  ctx.body = {
    code: 200,
    message: 'success',
    data: {
      list,
      total,
      page,
      pageSize,
      recordMonth,
      range: {
        startDate: resolvedRange.startDate,
        endDate: resolvedRange.endDate,
        rangeStartMonth: resolvedRange.rangeStartMonth,
        rangeEndMonth: resolvedRange.rangeEndMonth
      }
    }
  };
};

/**
 * 积分明细（聚合统计行）
 * GET /api/reports/points-details
 */
export const getPointsDetailsReport = async (ctx) => {
  await validateQuery(ctx, pointsDetailsReportQuerySchema);
  const { startDate, endDate, keyword, userId, category, dataSource, cycle, taskName, taskCategory } = ctx.query;
  const dataFilter = ctx.state.dataFilter ?? {};
  const range = resolveDateRange(startDate, endDate);
  const keywordText = resolveText(keyword);
  const taskNameText = resolveText(taskName);
  const taskCategoryText = resolveText(taskCategory);
  const periodLabel = resolvePointsPeriodLabel({ cycle, startDate: range.startDate, endDate: range.endDate });

  const [autoEvents, manualEvents] = await Promise.all([
    loadAutoPointsEvents({ range, keywordText, dataFilter }),
    loadManualPointsEvents({ range, keywordText, dataFilter })
  ]);

  let events = [...autoEvents, ...manualEvents];

  if (userId) {
    events = events.filter(item => item.userId === userId);
  }

  const categoryText = resolveText(category);
  if (categoryText && categoryText !== 'all') {
    events = events.filter(item => item.categoryCode === categoryText);
  }

  const sourceText = resolveText(dataSource);
  if (sourceText === 'summary') {
    events = events.filter(item => item.dataSource === POINTS_DATA_SOURCE_SUMMARY);
  } else if (sourceText === 'manual') {
    events = events.filter(item => item.dataSource === POINTS_DATA_SOURCE_MANUAL);
  }

  const rowsMap = new Map();

  const buildKey = (event) => {
    const uid = event.userId !== undefined && event.userId !== null && event.userId !== '' ? String(event.userId) : `name::${resolveText(event.userName)}`;
    return `${uid}::${event.categoryCode}::${event.taskName}::${event.taskCategory}::${event.dataSource}`;
  };

  events.forEach((event) => {
    const key = buildKey(event);
    if (!rowsMap.has(key)) {
      rowsMap.set(key, {
        userId: event.userId,
        userName: event.userName,
        date: periodLabel,
        categoryCode: event.categoryCode,
        taskName: event.taskName,
        taskCategory: event.taskCategory,
        times: 0,
        max: null,
        min: null,
        total: 0,
        dataSource: event.dataSource
      });
    }

    const row = rowsMap.get(key);
    row.times += 1;  // 每条记录算1次
    row.total += event.points;

    const unit = toNumber(event.unitPoints, 0);
    if (row.max === null || unit > row.max) row.max = unit;
    if (row.min === null || unit < row.min) row.min = unit;
  });

  let rows = Array.from(rowsMap.values()).map((row) => {
    const avg = row.times > 0 ? row.total / row.times : 0;
    const fallbackName = resolvePointsCategoryLabel(row.categoryCode);
    const displayTaskName = resolveText(row.taskName) ? row.taskName : fallbackName;
    const scoreCategory = resolvePointsCategoryLabel(row.categoryCode);
    return {
      userId: row.userId,
      userName: row.userName,
      date: row.date,
      taskName: displayTaskName,
      scoreCategory,
      taskCategory: resolveText(row.taskCategory),
      times: row.times,
      max: row.max ?? 0,
      avg,
      min: row.min ?? 0,
      total: row.total,
      dataSource: row.dataSource
    };
  });

  if (taskNameText) {
    rows = rows.filter(row => resolveText(row.taskName).includes(taskNameText));
  }

  if (taskCategoryText && taskCategoryText !== 'all') {
    rows = rows.filter(row => resolveText(row.taskCategory) === taskCategoryText);
  }

  rows.sort((a, b) => {
    const leftName = a.userName ?? '';
    const rightName = b.userName ?? '';
    if (leftName !== rightName) return leftName.localeCompare(rightName);
    return (b.total ?? 0) - (a.total ?? 0);
  });

  const page = resolvePageValue(ctx.query.page, 1);
  const pageSize = resolvePageSize(ctx.query.pageSize, 10);
  const total = rows.length;
  const startIndex = (page - 1) * pageSize;
  const list = rows.slice(startIndex, startIndex + pageSize);

  ctx.body = { code: 200, message: 'success', data: { list, total, page, pageSize } };
};

/**
 * 工时统计报表
 * GET /api/reports/work-hours
 */
export const getWorkHoursReport = async (ctx) => {
  await validateQuery(ctx, workHoursReportQuerySchema);
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

export const downloadManualWorkHoursTemplate = async (ctx) => {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();

  const sheet = workbook.addWorksheet('工时导入');
  sheet.columns = [
    { header: '人员姓名', key: 'userName', width: 18 },
    { header: '月份', key: 'month', width: 14 },
    { header: '工时(小时)', key: 'workHours', width: 14 },
    { header: '备注', key: 'remark', width: 24 }
  ];

  const sampleRow = sheet.addRow({
    userName: '示例员工',
    month: dayjs().format('YYYY-MM'),
    workHours: 176.0,
    remark: ''
  });
  sheet.getColumn('workHours').numFmt = '0.00';
  sampleRow.getCell('workHours').numFmt = '0.00';

  addTemplateInstructionSheet(workbook, [
    ['人员姓名', '必填，必须能匹配系统用户姓名/账号。'],
    ['月份', '必填，格式 YYYY-MM（如 2026-01）。'],
    ['工时(小时)', '必填，数字，该月总工时，保留2位小数。'],
    ['备注', '选填。']
  ]);

  const buffer = await workbook.xlsx.writeBuffer();
  ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  ctx.set('Content-Disposition', `attachment; filename=\"template.xlsx\"; filename*=UTF-8''${encodeURIComponent('工时导入模板.xlsx')}`);
  ctx.body = buffer;
};

export const previewImportManualWorkHours = async (ctx) => {
  const file = ctx.file || ctx.request?.file || ctx.request?.files?.file;
  if (!file) {
    throw createError(400, '请上传Excel文件');
  }

  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file.buffer);
  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) {
    throw createError(400, 'Excel内容为空');
  }

  const normalizeCellValue = (value) => {
    if (value && typeof value === 'object') {
      if (value.text !== undefined) return value.text;
      if (value.result !== undefined) return value.result;
      if (Array.isArray(value.richText)) {
        return value.richText.map(item => item.text ?? '').join('');
      }
    }
    return value;
  };

  const parseText = (value) => {
    const normalized = normalizeCellValue(value);
    if (normalized === undefined || normalized === null) return '';
    return String(normalized).trim();
  };

  const parseNumber = (value) => {
    const normalized = normalizeCellValue(value);
    if (normalized === undefined || normalized === null || normalized === '') return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const headerMap = new Map();
  const headerRow = worksheet.getRow(1);
  if (headerRow?.hasValues) {
    headerRow.eachCell((cell, colNumber) => {
      const headerText = parseText(cell.value);
      if (headerText) headerMap.set(headerText, colNumber);
    });
  }

  const colIndex = {
    userName: headerMap.get('人员姓名') ?? 1,
    month: headerMap.get('月份') ?? headerMap.get('记录月份') ?? 2,
    workHours: headerMap.get('工时') ?? 3,
    remark: headerMap.get('备注') ?? 4
  };

  const candidates = [];
  const summary = { total: 0, create: 0, update: 0, skip: 0, error: 0 };

  for (let i = 2; i <= worksheet.rowCount; i += 1) {
    const row = worksheet.getRow(i);
    if (!row.hasValues) continue;

    summary.total += 1;

    const userName = parseText(row.getCell(colIndex.userName).value);
    const monthText = parseText(row.getCell(colIndex.month).value);
    const month = monthText ? (monthText.length <= 2 ? `${dayjs().year()}-${String(monthText).padStart(2, '0')}` : monthText) : '';
    const workHours = parseNumber(row.getCell(colIndex.workHours).value);
    const remark = parseText(row.getCell(colIndex.remark).value);

    const errorMessages = [];
    if (!userName) errorMessages.push('人员姓名不能为空');
    if (!month || !dayjs(`${month}-01`).isValid()) errorMessages.push('月份格式不正确（应为 YYYY-MM）');
    if (workHours === null) errorMessages.push('工时必须为数字');
    if (workHours !== null && workHours < 0) errorMessages.push('工时不能为负数');

    candidates.push({
      rowNum: i,
      userName,
      month,
      workDate: month ? `${month}-01` : '',
      workHours,
      remark: remark ? remark : '',
      error: errorMessages.length ? errorMessages.join('；') : ''
    });
  }

  const uniqueNames = Array.from(
    new Set(candidates.map(item => resolveText(item.userName)).filter(Boolean))
  );
  const users = uniqueNames.length > 0
    ? await User.findAll({
      where: {
        [Op.or]: [
          { real_name: { [Op.in]: uniqueNames } },
          { username: { [Op.in]: uniqueNames } }
        ]
      },
      attributes: ['id', 'real_name', 'username']
    })
    : [];

  const userIdMap = new Map();
  users.forEach((u) => {
    const realName = resolveText(u.real_name);
    const username = resolveText(u.username);
    if (realName) userIdMap.set(realName, u.id);
    if (username) userIdMap.set(username, u.id);
  });

  const rows = [];
  for (const item of candidates) {
    const previewRow = {
      rowNum: item.rowNum,
      action: 'error',
      message: '',
      diff: {},
      userName: item.userName,
      month: item.month,
      workHours: item.workHours,
      remark: item.remark
    };

    if (item.error) {
      previewRow.message = item.error;
      summary.error += 1;
      rows.push(previewRow);
      continue;
    }

    const uid = userIdMap.get(resolveText(item.userName)) ?? null;
    if (!uid) {
      previewRow.message = `未找到用户：${item.userName}`;
      summary.error += 1;
      rows.push(previewRow);
      continue;
    }

    const existing = await ManualWorkHour.findOne({
      where: {
        user_id: uid,
        work_date: item.workDate
      }
    });

    if (!existing) {
      previewRow.action = 'create';
      previewRow.message = '将新增';
      summary.create += 1;
      rows.push(previewRow);
      continue;
    }

    const diff = {};
    if (!isSameNumber(existing.work_hours, item.workHours)) {
      diff.workHours = { from: existing.work_hours, to: item.workHours };
    }
    if (item.remark && item.remark !== existing.remark) {
      diff.remark = { from: existing.remark ?? '', to: item.remark };
    }

    previewRow.diff = diff;
    if (Object.keys(diff).length === 0) {
      previewRow.action = 'skip';
      previewRow.message = '无变更，跳过';
      summary.skip += 1;
    } else {
      previewRow.action = 'update';
      previewRow.message = '将更新';
      summary.update += 1;
    }

    rows.push(previewRow);
  }

  ctx.body = {
    code: 200,
    message: 'success',
    data: { summary, rows }
  };
};

export const importManualWorkHours = async (ctx) => {
  const file = ctx.file || ctx.request?.file || ctx.request?.files?.file;
  if (!file) {
    throw createError(400, '请上传Excel文件');
  }

  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file.buffer);
  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) {
    throw createError(400, 'Excel内容为空');
  }

  const normalizeCellValue = (value) => {
    if (value && typeof value === 'object') {
      if (value.text !== undefined) return value.text;
      if (value.result !== undefined) return value.result;
      if (Array.isArray(value.richText)) {
        return value.richText.map(item => item.text ?? '').join('');
      }
    }
    return value;
  };

  const parseText = (value) => {
    const normalized = normalizeCellValue(value);
    if (normalized === undefined || normalized === null) return '';
    return String(normalized).trim();
  };

  const parseNumber = (value) => {
    const normalized = normalizeCellValue(value);
    if (normalized === undefined || normalized === null || normalized === '') return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const parseMonth = (value) => {
    const normalized = normalizeCellValue(value);
    if (!normalized) return '';
    if (normalized instanceof Date) {
      return dayjs(normalized).format('YYYY-MM');
    }
    const text = String(normalized).trim();
    // 支持 YYYY-MM 或 YYYY/MM 格式
    const match = text.match(/^(\d{4})[-/](\d{1,2})$/);
    if (match) {
      const year = match[1];
      const month = match[2].padStart(2, '0');
      return `${year}-${month}`;
    }
    return '';
  };

  const headerMap = new Map();
  const headerRow = worksheet.getRow(1);
  if (headerRow?.hasValues) {
    headerRow.eachCell((cell, colNumber) => {
      const headerText = parseText(cell.value);
      if (headerText) headerMap.set(headerText, colNumber);
    });
  }

  const colIndex = {
    userName: headerMap.get('人员姓名') ?? 1,
    month: headerMap.get('月份') ?? 2,
    workHours: headerMap.get('工时(小时)') ?? 3,
    remark: headerMap.get('备注') ?? 4
  };

  const pendingRows = [];
  const userNames = [];
  const errors = [];

  for (let i = 2; i <= worksheet.rowCount; i += 1) {
    const row = worksheet.getRow(i);
    if (!row.hasValues) continue;

    const userName = parseText(row.getCell(colIndex.userName).value);
    const month = parseMonth(row.getCell(colIndex.month).value);
    const workHours = parseNumber(row.getCell(colIndex.workHours).value);
    const remark = parseText(row.getCell(colIndex.remark).value);

    if (!userName) {
      errors.push(`第${i}行：人员姓名不能为空`);
      continue;
    }
    if (!month) {
      errors.push(`第${i}行：月份格式不正确（应为 YYYY-MM）`);
      continue;
    }
    if (workHours === null) {
      errors.push(`第${i}行：工时必须为数字`);
      continue;
    }
    if (workHours < 0) {
      errors.push(`第${i}行：工时不能为负数`);
      continue;
    }

    // 存储为该月第一天
    pendingRows.push({
      work_date: `${month}-01`,
      user_name: userName,
      work_hours: workHours,
      remark: remark ? remark : null
    });
    userNames.push(userName);
  }

  if (pendingRows.length === 0) {
    throw createError(400, errors.length > 0 ? errors[0] : '导入数据为空');
  }

  const uniqueNames = Array.from(new Set(userNames.map(name => resolveText(name)).filter(Boolean)));
  const users = await User.findAll({
    where: {
      [Op.or]: [
        { real_name: { [Op.in]: uniqueNames } },
        { username: { [Op.in]: uniqueNames } }
      ]
    },
    attributes: ['id', 'real_name', 'username']
  });

  const userIdMap = new Map();
  users.forEach((u) => {
    const realName = resolveText(u.real_name);
    const username = resolveText(u.username);
    if (realName) userIdMap.set(realName, u.id);
    if (username) userIdMap.set(username, u.id);
  });

  const creator = ctx.state.user ?? {};
  const createdById = creator.id;
  const createdByName = creator.realName ? creator.realName : (creator.username ? creator.username : '');

  const toCreate = [];
  pendingRows.forEach((row, idx) => {
    const nameText = resolveText(row.user_name);
    const uid = userIdMap.get(nameText);
    if (!uid) {
      errors.push(`第${idx + 2}行：未找到用户：${nameText}`);
      return;
    }
    toCreate.push({
      ...row,
      user_id: uid,
      created_by_id: createdById,
      created_by_name: createdByName
    });
  });

  if (toCreate.length === 0) {
    throw createError(400, errors.length > 0 ? errors[0] : '导入失败');
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of toCreate) {
    const where = {
      user_id: row.user_id,
      work_date: row.work_date
    };

    const existing = await ManualWorkHour.findOne({ where });
    if (!existing) {
      await ManualWorkHour.create(row);
      created += 1;
      continue;
    }

    const patch = {};
    if (!isSameNumber(existing.work_hours, row.work_hours)) {
      patch.work_hours = row.work_hours;
    }
    if (row.remark && row.remark !== existing.remark) {
      patch.remark = row.remark;
    }
    if (row.user_name && row.user_name !== existing.user_name) {
      patch.user_name = row.user_name;
    }

    if (Object.keys(patch).length === 0) {
      skipped += 1;
      continue;
    }

    await existing.update(patch);
    updated += 1;
  }

  ctx.body = {
    code: 200,
    message: 'success',
    data: { created, updated, skipped, errors }
  };
};

/**
 * 保养统计报表
 * GET /api/reports/maintenance
 */
export const getMaintenanceReport = async (ctx) => {
  await validateQuery(ctx, dateRangeStationQuerySchema);
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
  await validateQuery(ctx, dateRangeStationQuerySchema);
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
  await validateQuery(ctx, dateRangeStationQuerySchema);
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
  await validateQuery(ctx, scheduleReportQuerySchema);
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
  await validateQuery(ctx, temporaryTasksReportQuerySchema);
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
  await validateQuery(ctx, pointsSummaryReportQuerySchema);
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
  await validateQuery(ctx, byMonthQuerySchema);
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
  await validateQuery(ctx, byMonthQuerySchema);
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

// 获取手动导入的工时记录列表
export const getManualWorkHoursList = async (ctx) => {
  await validateQuery(ctx, manualWorkHoursListQuerySchema);
  const { startMonth, endMonth, userName, page = 1, pageSize = 20 } = ctx.query;

  const where = {};
  if (startMonth && endMonth) {
    // 月份筛选：startMonth 的第一天到 endMonth 的最后一天
    const startDate = `${startMonth}-01`;
    const endDate = dayjs(`${endMonth}-01`).endOf('month').format('YYYY-MM-DD');
    where.work_date = { [Op.between]: [startDate, endDate] };
  } else if (startMonth) {
    where.work_date = { [Op.gte]: `${startMonth}-01` };
  } else if (endMonth) {
    const endDate = dayjs(`${endMonth}-01`).endOf('month').format('YYYY-MM-DD');
    where.work_date = { [Op.lte]: endDate };
  }

  if (userName) {
    where.user_name = { [Op.like]: `%${userName}%` };
  }

  const offset = (Number(page) - 1) * Number(pageSize);
  const limit = Number(pageSize);

  const { count, rows } = await ManualWorkHour.findAndCountAll({
    where,
    order: [['work_date', 'DESC'], ['id', 'DESC']],
    offset,
    limit
  });

  const list = rows.map(row => ({
    id: row.id,
    workMonth: row.work_date ? dayjs(row.work_date).format('YYYY-MM') : null,
    userId: row.user_id,
    userName: row.user_name,
    workHours: Number(row.work_hours),
    remark: row.remark,
    createdById: row.created_by_id,
    createdByName: row.created_by_name,
    createdAt: row.created_at ? dayjs(row.created_at).format('YYYY-MM-DD HH:mm:ss') : null
  }));

  ctx.body = {
    code: 200,
    message: 'success',
    list,
    total: count,
    page: Number(page),
    pageSize: Number(pageSize)
  };
};

// 更新手动导入的工时记录
export const updateManualWorkHour = async (ctx) => {
  const { id } = ctx.params;
  const body = ctx.request.body;

  const { error, value } = manualWorkHourUpdateSchema.validate(body);
  if (error) {
    throw createError(400, error.details[0].message);
  }

  const record = await ManualWorkHour.findByPk(id);
  if (!record) {
    throw createError(404, '工时记录不存在');
  }

  // 支持 workMonth 参数，转换为该月第一天
  const workDate = value.workMonth ? `${value.workMonth}-01` : record.work_date;

  await record.update({
    work_date: workDate,
    work_hours: value.workHours,
    remark: value.remark ?? record.remark
  });

  ctx.body = {
    code: 200,
    message: '更新成功',
    data: {
      id: record.id,
      workMonth: record.work_date ? dayjs(record.work_date).format('YYYY-MM') : null,
      userId: record.user_id,
      userName: record.user_name,
      workHours: Number(record.work_hours),
      remark: record.remark
    }
  };
};

// 删除手动导入的工时记录
export const deleteManualWorkHour = async (ctx) => {
  const { id } = ctx.params;

  const record = await ManualWorkHour.findByPk(id);
  if (!record) {
    throw createError(404, '工时记录不存在');
  }

  await record.destroy();

  ctx.body = {
    code: 200,
    message: '删除成功'
  };
};

// 保存修正应用小时积分
export const saveAdjustedHourlyPoints = async (ctx) => {
  const body = ctx.request.body;
  const { userId, endMonth, adjustedPoints } = body;

  if (!userId) {
    throw createError(400, '用户ID不能为空');
  }
  if (!endMonth || !/^\d{4}-\d{2}$/.test(endMonth)) {
    throw createError(400, '月份格式不正确（YYYY-MM）');
  }
  if (adjustedPoints === undefined || adjustedPoints === null) {
    throw createError(400, '修正积分不能为空');
  }
  const points = Number(adjustedPoints);
  if (!Number.isFinite(points) || points < 0 || points > 10) {
    throw createError(400, '修正积分必须在 0-10 之间');
  }

  const creator = ctx.state.user ?? {};

  // 使用 upsert 更新或插入
  const [record] = await AdjustedHourlyPoints.upsert({
    user_id: userId,
    end_month: endMonth,
    adjusted_points: points,
    created_by_id: creator.id,
    created_by_name: creator.realName || creator.username || ''
  });

  ctx.body = {
    code: 200,
    message: '保存成功',
    data: {
      userId,
      endMonth,
      adjustedPoints: points
    }
  };
};

// 获取应用小时积分历史记录（实际值 + 修正值，分开展示）
export const getAdjustedHourlyPointsHistory = async (ctx) => {
  const dataFilter = ctx.state.dataFilter ?? {};

  const page = resolvePageValue(ctx.query.page, 1);
  const pageSize = resolvePageSize(ctx.query.pageSize, 20);
  const keywordText = resolveText(ctx.query.userName);

  const endMonthText = resolveText(ctx.query.endMonth);
  const endMonthBase = endMonthText ? dayjs(`${endMonthText}-01`) : dayjs().startOf('month');
  if (!endMonthBase.isValid()) {
    throw createError(400, '记录月份格式不正确（YYYY-MM）');
  }

  const months = buildRecentMonths(endMonthBase, 12);

  // userName 过滤：先定位用户ID（用于最终结果过滤与 DB 读取）
  let userIdFilter = null;
  if (keywordText) {
    const users = await User.findAll({
      where: {
        [Op.or]: [
          { real_name: { [Op.like]: `%${keywordText}%` } },
          { username: { [Op.like]: `%${keywordText}%` } }
        ]
      },
      attributes: ['id']
    });
    const ids = users.map(u => u.id).filter(Boolean);
    if (ids.length === 0) {
      ctx.body = { code: 200, message: 'success', data: { list: [], months, total: 0, page, pageSize } };
      return;
    }
    userIdFilter = ids;
  }

  if (!dataFilter.all && dataFilter.userId) {
    if (userIdFilter && !userIdFilter.includes(dataFilter.userId)) {
      ctx.body = { code: 200, message: 'success', data: { list: [], months, total: 0, page, pageSize } };
      return;
    }
    userIdFilter = [dataFilter.userId];
  }

  const firstRecordMonthBase = dayjs(`${months[0]}-01`).startOf('month');
  const lastRecordMonthBase = dayjs(`${months[months.length - 1]}-01`).startOf('month');
  const calcStartBase = firstRecordMonthBase.subtract(6, 'month').startOf('month');
  const calcEndBase = lastRecordMonthBase.subtract(1, 'month').endOf('month');
  const range = {
    startDate: calcStartBase.format('YYYY-MM-DD'),
    endDate: calcEndBase.format('YYYY-MM-DD')
  };

  const [autoEvents, manualEvents] = await Promise.all([
    loadAutoPointsEventsWithDate({ range, keywordText, dataFilter }),
    loadManualPointsEventsWithDate({ range, keywordText, dataFilter })
  ]);

  const pointsByUserMonth = new Map();
  const ensureMonthMap = (uid) => {
    const key = String(uid);
    if (!pointsByUserMonth.has(key)) pointsByUserMonth.set(key, new Map());
    return pointsByUserMonth.get(key);
  };

  const events = [...autoEvents, ...manualEvents];
  events.forEach((event) => {
    const uid = event?.userId;
    if (uid === undefined || uid === null || uid === '') return;
    if (userIdFilter && !userIdFilter.includes(uid)) return;
    const dateText = resolveText(event?.date);
    const dateBase = dateText ? dayjs(dateText) : null;
    if (!dateBase || !dateBase.isValid()) return;
    const monthKey = dateBase.format('YYYY-MM');

    const monthMap = ensureMonthMap(uid);
    const current = toNumber(monthMap.get(monthKey), 0);
    monthMap.set(monthKey, current + toNumber(event?.points, 0));
  });

  const hoursByUserMonth = new Map();
  const hoursWhere = {
    work_date: { [Op.between]: [range.startDate, range.endDate] }
  };
  if (userIdFilter) {
    hoursWhere.user_id = { [Op.in]: userIdFilter };
  }

  const hoursRows = await ManualWorkHour.findAll({
    where: hoursWhere,
    attributes: [
      'user_id',
      'user_name',
      [fn('DATE_FORMAT', col('work_date'), '%Y-%m'), 'work_month'],
      [fn('SUM', col('work_hours')), 'total_hours']
    ],
    group: ['user_id', 'user_name', 'work_month']
  });

  hoursRows.forEach((row) => {
    const uid = row.user_id;
    if (uid === undefined || uid === null || uid === '') return;
    const monthKey = resolveText(row.get('work_month'));
    if (!monthKey) return;
    const hours = toNumber(row.get('total_hours'), 0);

    const key = String(uid);
    if (!hoursByUserMonth.has(key)) hoursByUserMonth.set(key, new Map());
    hoursByUserMonth.get(key).set(monthKey, hours);
  });

  // 读取修正值（以及已存在的实际值记录）
  const adjustedWhere = { end_month: { [Op.in]: months } };
  if (userIdFilter) {
    adjustedWhere.user_id = { [Op.in]: userIdFilter };
  }
  const savedRecords = await AdjustedHourlyPoints.findAll({
    where: adjustedWhere,
    attributes: [
      'user_id',
      'end_month',
      'actual_points',
      'adjusted_points'
    ],
    order: [['user_id', 'ASC'], ['end_month', 'ASC']]
  });

  const adjustedByUserMonth = new Map();
  const userIdSet = new Set();

  const ensureAdjustedMonthMap = (uid) => {
    const key = String(uid);
    if (!adjustedByUserMonth.has(key)) adjustedByUserMonth.set(key, new Map());
    return adjustedByUserMonth.get(key);
  };

  savedRecords.forEach((rec) => {
    const uid = rec.user_id;
    if (uid === undefined || uid === null || uid === '') return;
    userIdSet.add(String(uid));
    ensureAdjustedMonthMap(uid).set(String(rec.end_month), rec.adjusted_points === null || rec.adjusted_points === undefined ? null : Number(rec.adjusted_points));
  });

  // 其他来源出现过的用户也要展示（实际值）
  pointsByUserMonth.forEach((_, uidKey) => userIdSet.add(uidKey));
  hoursByUserMonth.forEach((_, uidKey) => userIdSet.add(uidKey));

  const toFixed2 = (value) => {
    if (value === null || value === undefined) return null;
    const num = Number(value);
    if (!Number.isFinite(num)) return null;
    return Number(num.toFixed(2));
  };

  const snapshotRows = [];
  const rows = Array.from(userIdSet.values()).map((uidKey) => {
    const uid = Number(uidKey);
    const pointsMonthMap = pointsByUserMonth.get(uidKey) ?? new Map();
    const hoursMonthMap = hoursByUserMonth.get(uidKey) ?? new Map();
    const adjustedMonthMap = adjustedByUserMonth.get(uidKey) ?? new Map();

    const actualPoints = {};
    const adjustedPoints = {};

    months.forEach((recordMonth) => {
      const recordMonthBase = dayjs(`${recordMonth}-01`).startOf('month');
      const windowStartBase = recordMonthBase.subtract(6, 'month').startOf('month');
      const windowEndBase = recordMonthBase.subtract(1, 'month').startOf('month');

      let totalPoints = 0;
      let totalHours = 0;
      for (let i = 0; i < 6; i += 1) {
        const monthKey = windowStartBase.add(i, 'month').format('YYYY-MM');
        totalPoints += toNumber(pointsMonthMap.get(monthKey), 0);
        totalHours += toNumber(hoursMonthMap.get(monthKey), 0);
      }

      const actual = totalHours > 0 ? totalPoints / totalHours : null;
      actualPoints[recordMonth] = toFixed2(actual);

      const adjusted = adjustedMonthMap.has(recordMonth) ? adjustedMonthMap.get(recordMonth) : null;
      adjustedPoints[recordMonth] = adjusted === null || adjusted === undefined ? null : toFixed2(adjusted);

      snapshotRows.push({
        user_id: uid,
        end_month: recordMonth,
        actual_points: actual,
        total_points: totalPoints,
        total_hours: totalHours,
        range_start_month: windowStartBase.format('YYYY-MM'),
        range_end_month: windowEndBase.format('YYYY-MM')
      });
    });

    return { userId: uid, userName: '', actualPoints, adjustedPoints };
  });

  // 覆盖更新实际值快照（修正值保持不变）
  if (snapshotRows.length > 0) {
    await AdjustedHourlyPoints.bulkCreate(snapshotRows, {
      updateOnDuplicate: ['actual_points', 'total_points', 'total_hours', 'range_start_month', 'range_end_month']
    });
  }

  // 回填用户姓名
  const userIds = rows.map(r => r.userId).filter(Boolean);
  if (userIds.length > 0) {
    const users = await User.findAll({
      where: { id: { [Op.in]: userIds } },
      attributes: ['id', 'real_name', 'username']
    });
    const nameMap = new Map();
    users.forEach((u) => {
      const name = resolveText(u.real_name) ? u.real_name : resolveText(u.username);
      nameMap.set(Number(u.id), name);
    });
    rows.forEach((row) => {
      row.userName = nameMap.get(row.userId) ?? '';
    });
  }

  rows.sort((a, b) => (a.userName ?? '').localeCompare(b.userName ?? ''));

  const total = rows.length;
  const offset = (page - 1) * pageSize;
  const list = rows.slice(offset, offset + pageSize);

  ctx.body = {
    code: 200,
    message: 'success',
    data: { list, months, total, page, pageSize }
  };
};

/**
 * 周期性积分分析
 * GET /api/reports/points-cycle-analysis
 * 返回每个用户在选定日期范围内的每日积分数据（含分类明细）
 */
export const getPointsCycleAnalysisReport = async (ctx) => {
  const { pointsCycleAnalysisQuerySchema } = await import('../validators/schemas.js');
  await validateQuery(ctx, pointsCycleAnalysisQuerySchema);
  const { startDate, endDate, keyword } = ctx.query;
  const dataFilter = ctx.state.dataFilter ?? {};
  const range = resolveDateRange(startDate, endDate);
  const keywordText = resolveText(keyword);

  const [autoEvents, manualEvents] = await Promise.all([
    loadAutoPointsEventsWithDate({ range, keywordText, dataFilter }),
    loadManualPointsEventsWithDate({ range, keywordText, dataFilter })
  ]);

  const events = [...autoEvents, ...manualEvents];
  const userMap = new Map();

  const buildUserKey = (uid, name) => {
    const hasId = uid !== undefined && uid !== null && uid !== '';
    if (hasId) return String(uid);
    const nameText = resolveText(name);
    return nameText ? `name::${nameText}` : 'unknown';
  };

  const ensureRow = (uid, name) => {
    const key = buildUserKey(uid, name);
    if (!userMap.has(key)) {
      userMap.set(key, {
        userId: uid,
        userName: resolveText(name),
        dailyPoints: {}
      });
    }
    return userMap.get(key);
  };

  // 初始化每日数据结构
  const initDayData = () => ({
    total: 0,
    byCategory: {},
    byTaskCategory: {}
  });

  events.forEach((event) => {
    const row = ensureRow(event.userId, event.userName);
    const date = event.date;
    if (!date) return;
    if (!row.dailyPoints[date]) {
      row.dailyPoints[date] = initDayData();
    }
    const dayData = row.dailyPoints[date];
    const points = event.points;
    const category = event.category || 'fixed';
    const taskCategory = event.taskCategory || 'Ⅰ类';

    // 总积分
    dayData.total += points;

    // 按得分大类汇总
    if (!dayData.byCategory[category]) {
      dayData.byCategory[category] = 0;
    }
    dayData.byCategory[category] += points;

    // 按任务类别汇总
    if (!dayData.byTaskCategory[taskCategory]) {
      dayData.byTaskCategory[taskCategory] = 0;
    }
    dayData.byTaskCategory[taskCategory] += points;
  });

  const rows = Array.from(userMap.values());
  rows.sort((a, b) => (a.userName ?? '').localeCompare(b.userName ?? ''));

  ctx.body = { code: 200, message: 'success', data: rows };
};

// 加载自动积分事件（带日期）
const loadAutoPointsEventsWithDate = async ({ range, keywordText, dataFilter }) => {
  const events = [];

  // 固定/派发/申请/扣分（岗位工作汇总）
  const workLogWhere = {
    work_date: { [Op.between]: [range.startDate, range.endDate] },
    submit_time: { [Op.not]: null },
    review_status: { [Op.in]: ['approved', 'auto_approved'] }
  };

  if (keywordText) {
    workLogWhere.user_name = { [Op.like]: `%${keywordText}%` };
  }

  if (!dataFilter.all) {
    if (dataFilter.userId) {
      workLogWhere.user_id = dataFilter.userId;
    }
    if (dataFilter.stationIds?.length > 0) {
      workLogWhere.station_id = { [Op.in]: dataFilter.stationIds };
    }
  }

  const workLogs = await PositionWorkLog.findAll({
    where: workLogWhere,
    attributes: ['user_id', 'user_name', 'work_date', 'unit_points', 'quantity', 'deduction_points', 'task_source', 'task_category']
  });

  workLogs.forEach((log) => {
    const userId = log.user_id;
    const userName = log.user_name ?? '';
    const date = log.work_date;
    const unitPoints = toNumber(log.unit_points, 0);
    const quantity = toNumber(log.quantity, 1);
    const points = unitPoints * quantity;
    const taskCategory = normalizeTaskCategory(log.task_category);
    // 根据 task_source 确定得分大类
    const taskSource = resolveText(log.task_source);
    const category = taskSource === 'dispatch' ? 'dispatch' : (taskSource === 'selfApply' ? 'selfApply' : 'fixed');

    if (points !== 0) {
      events.push({ userId, userName, date, points, category, taskCategory });
    }

    const deductionValue = toNumber(log.deduction_points, 0);
    if (deductionValue !== 0) {
      events.push({ userId, userName, date, points: deductionValue, category: 'deduction', taskCategory });
    }
  });

  // 安全自检
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

  const workTypes = await SafetyWorkType.findAll({ attributes: ['id', 'points'] });
  const workTypePointsMap = new Map();
  workTypes.forEach((wt) => {
    workTypePointsMap.set(wt.id, toNumber(wt.points, 0));
  });

  safetySelfInspections.forEach((inspection) => {
    const userId = inspection.filler_id;
    const userName = inspection.filler_name ?? '';
    const date = inspection.inspection_date;
    const workTypeIds = Array.isArray(inspection.work_type_ids) ? inspection.work_type_ids : [];
    workTypeIds.forEach((wtId) => {
      const points = workTypePointsMap.get(wtId) ?? 0;
      if (points !== 0) {
        events.push({ userId, userName, date, points, category: 'safety', taskCategory: 'Ⅰ类' });
      }
    });
  });

  // 卫生自检
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
    attributes: ['inspection_date', 'filler_id', 'filler_name', 'work_type_ids']
  });

  const hygieneAreas = await HygieneArea.findAll({ attributes: ['id', 'points'] });
  const hygieneAreaPointsMap = new Map();
  hygieneAreas.forEach((area) => {
    hygieneAreaPointsMap.set(area.id, toNumber(area.points, 0));
  });

  hygieneSelfInspections.forEach((inspection) => {
    const userId = inspection.filler_id;
    const userName = inspection.filler_name ?? '';
    const date = inspection.inspection_date;
    const areaIds = Array.isArray(inspection.work_type_ids) ? inspection.work_type_ids : [];
    areaIds.forEach((areaId) => {
      const points = hygieneAreaPointsMap.get(areaId) ?? 0;
      if (points !== 0) {
        events.push({ userId, userName, date, points, category: 'hygiene', taskCategory: 'Ⅰ类' });
      }
    });
  });

  // 安全他检
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

  safetyOtherInspections.forEach((inspection) => {
    const userId = inspection.inspected_user_id;
    const userName = inspection.inspected_user_name ?? '';
    const date = inspection.inspection_date;
    const points = toNumber(inspection.points, 0);
    if (points !== 0) {
      events.push({ userId, userName, date, points, category: 'safety', taskCategory: 'Ⅰ类' });
    }
  });

  // 卫生他检
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

  hygieneOtherInspections.forEach((inspection) => {
    const userId = inspection.inspected_user_id;
    const userName = inspection.inspected_user_name ?? '';
    const date = inspection.inspection_date;
    const points = toNumber(inspection.points, 0);
    if (points !== 0) {
      events.push({ userId, userName, date, points, category: 'hygiene', taskCategory: 'Ⅰ类' });
    }
  });

  // 维修任务
  const repairWhere = {
    status: { [Op.in]: ['accepted', 'archived'] }
  };

  if (!dataFilter.all && dataFilter.stationIds?.length > 0) {
    repairWhere.station_id = { [Op.in]: dataFilter.stationIds };
  }

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
    resolveAssistantNames(record.repair_assistant_name).forEach(name => assistantNameSet.add(name));
  });

  const assistantIdMap = new Map();
  if (assistantNameSet.size > 0) {
    const assistantNames = Array.from(assistantNameSet).map(name => resolveText(name)).filter(Boolean);
    if (assistantNames.length > 0) {
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
  }

  const shouldIncludeUser = (userId, userName) => {
    if (!dataFilter.all && dataFilter.userId) {
      if (userId !== dataFilter.userId) return false;
    }
    if (keywordText) {
      const nameText = resolveText(userName);
      if (!nameText.includes(keywordText)) return false;
    }
    return true;
  };

  const sumRepairTaskPoints = (repairTasks) => {
    const tasks = Array.isArray(repairTasks) ? repairTasks : [];
    return tasks.reduce((sum, task) => {
      const unitPoints = toNumber(task?.points, 0);
      const quantity = toNumber(task?.quantity, 1);
      return sum + (unitPoints * quantity);
    }, 0);
  };

  // 按任务类别分组统计维修积分
  const groupRepairTasksByCategory = (repairTasks) => {
    const tasks = Array.isArray(repairTasks) ? repairTasks : [];
    const result = {};
    tasks.forEach((task) => {
      const unitPoints = toNumber(task?.points, 0);
      const quantity = toNumber(task?.quantity, 1);
      const points = unitPoints * quantity;
      if (points === 0) return;
      const taskCategory = normalizeTaskCategory(task?.task_category);
      if (!result[taskCategory]) {
        result[taskCategory] = 0;
      }
      result[taskCategory] += points;
    });
    return result;
  };

  repairRecords.forEach((record) => {
    const date = record.verify_date || record.repair_end_date;
    if (!date) return;

    const dateStr = dayjs(date).format('YYYY-MM-DD');
    if (dateStr < range.startDate || dateStr > range.endDate) return;

    const categoryPoints = groupRepairTasksByCategory(record.repair_tasks);
    if (Object.keys(categoryPoints).length === 0) return;

    const leaderId = record.repair_person_id;
    const leaderName = record.repair_person_name ?? '';
    if (shouldIncludeUser(leaderId, leaderName)) {
      Object.entries(categoryPoints).forEach(([taskCategory, points]) => {
        events.push({ userId: leaderId, userName: leaderName, date: dateStr, points, category: 'repair', taskCategory });
      });
    }

    const assistantNames = resolveAssistantNames(record.repair_assistant_name);
    if (assistantNames.length === 0) return;

    const uniqueAssistants = new Set(assistantNames);
    uniqueAssistants.forEach((assistantName) => {
      const nameText = resolveText(assistantName);
      if (!nameText) return;
      if (nameText === leaderName) return;
      const assistantId = assistantIdMap.get(nameText);
      if (!shouldIncludeUser(assistantId, nameText)) return;
      Object.entries(categoryPoints).forEach(([taskCategory, points]) => {
        events.push({ userId: assistantId, userName: nameText, date: dateStr, points, category: 'repair', taskCategory });
      });
    });
  });

  // 保养任务
  const maintenanceWhere = {
    submit_time: { [Op.between]: [range.startDate, range.endDate] },
    status: { [Op.in]: ['completed', 'verified'] }
  };

  if (!dataFilter.all) {
    if (dataFilter.stationIds?.length > 0) {
      maintenanceWhere.station_id = { [Op.in]: dataFilter.stationIds };
    }
  }

  const maintenanceRecords = await MaintenanceWorkRecord.findAll({
    where: maintenanceWhere,
    attributes: ['submit_time', 'executor_id', 'executor_name', 'maintenance_items']
  });

  maintenanceRecords.forEach((record) => {
    const date = record.submit_time ? dayjs(record.submit_time).format('YYYY-MM-DD') : null;
    if (!date) return;
    const userId = record.executor_id;
    const userName = record.executor_name ?? '';
    if (keywordText && userName && !userName.includes(keywordText)) return;

    const items = Array.isArray(record.maintenance_items) ? record.maintenance_items : [];
    let points = 0;
    items.forEach((item) => {
      if (item.result === 'qualified' || item.result === 'normal') {
        points += toNumber(item.points, 0);
      }
    });
    if (points !== 0) {
      events.push({ userId, userName, date, points, category: 'maintenance', taskCategory: 'Ⅰ类' });
    }
  });

  // 临时任务
  const tempTaskWhere = {
    approve_time: {
      [Op.between]: [
        dayjs(range.startDate).startOf('day').toDate(),
        dayjs(range.endDate).endOf('day').toDate()
      ]
    },
    status: 'completed'
  };

  if (keywordText) {
    tempTaskWhere.executor_name = { [Op.like]: `%${keywordText}%` };
  }

  if (!dataFilter.all) {
    if (dataFilter.userId) {
      tempTaskWhere.executor_id = dataFilter.userId;
    }
    if (dataFilter.stationIds?.length > 0) {
      tempTaskWhere.station_id = { [Op.in]: dataFilter.stationIds };
    }
  }

  const tempTasks = await TemporaryTask.findAll({
    where: tempTaskWhere,
    attributes: ['approve_time', 'executor_id', 'executor_name', 'points']
  });

  tempTasks.forEach((task) => {
    const date = task.approve_time ? dayjs(task.approve_time).format('YYYY-MM-DD') : null;
    if (!date) return;
    const userId = task.executor_id;
    const userName = task.executor_name ?? '';
    const points = toNumber(task.points, 0);
    if (points !== 0) {
      events.push({ userId, userName, date, points, category: 'dispatch', taskCategory: 'Ⅰ类' });
    }
  });

  return events;
};

// 加载手动导入积分事件（带日期）
const loadManualPointsEventsWithDate = async ({ range, keywordText, dataFilter }) => {
  const events = [];

  const where = {
    entry_date: { [Op.between]: [range.startDate, range.endDate] }
  };

  if (keywordText) {
    where.user_name = { [Op.like]: `%${keywordText}%` };
  }

  if (!dataFilter.all) {
    if (dataFilter.userId) {
      where.user_id = dataFilter.userId;
    }
  }

  const manualEntries = await ManualPointsEntry.findAll({
    where,
    attributes: ['user_id', 'user_name', 'entry_date', 'unit_points', 'quantity', 'category_code', 'task_category']
  });

  manualEntries.forEach((entry) => {
    const userId = entry.user_id;
    const userName = entry.user_name ?? '';
    const date = entry.entry_date;
    const unitPoints = toNumber(entry.unit_points, 0);
    const quantity = toNumber(entry.quantity, 1);
    const points = unitPoints * quantity;
    if (points !== 0) {
      const category = normalizePointsCategoryCode(entry.category_code) || 'fixed';
      const taskCategory = normalizeTaskCategory(entry.task_category);
      events.push({ userId, userName, date, points, category, taskCategory });
    }
  });

  return events;
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
