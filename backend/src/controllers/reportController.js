import { Op, fn, col, literal } from 'sequelize';
import { DailyTask, MaintenanceRecord, RepairRecord, SafetySelfInspection, SafetyOtherInspection, Schedule, TemporaryTask, InboundRecord, OutboundRecord, User } from '../models/index.js';
import dayjs from 'dayjs';

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
 * 进料统计报表
 * GET /api/reports/inbound
 */
export const getInboundReport = async (ctx) => {
  const { stationId, startDate, endDate, groupBy } = ctx.query;

  const where = {};
  if (stationId) where.station_id = stationId;
  if (startDate && endDate) {
    where.created_at = { [Op.between]: [new Date(startDate), new Date(endDate + ' 23:59:59')] };
  }

  const records = await InboundRecord.findAll({ where });

  const totalWeight = records.reduce((sum, r) => sum + parseFloat(r.weight), 0);
  const totalCount = records.length;

  // 按分类统计
  const byCategory = {};
  records.forEach(r => {
    if (!byCategory[r.waste_category]) {
      byCategory[r.waste_category] = { weight: 0, count: 0 };
    }
    byCategory[r.waste_category].weight += parseFloat(r.weight);
    byCategory[r.waste_category].count += 1;
  });

  // 按日期统计
  const byDate = {};
  records.forEach(r => {
    const date = dayjs(r.created_at).format('YYYY-MM-DD');
    if (!byDate[date]) {
      byDate[date] = { weight: 0, count: 0 };
    }
    byDate[date].weight += parseFloat(r.weight);
    byDate[date].count += 1;
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: {
      summary: { totalWeight, totalCount },
      byCategory: Object.entries(byCategory).map(([cat, data]) => ({ category: cat, ...data })),
      byDate: Object.entries(byDate).map(([date, data]) => ({ date, ...data }))
    }
  };
};

/**
 * 出料统计报表
 * GET /api/reports/outbound
 */
export const getOutboundReport = async (ctx) => {
  const { stationId, startDate, endDate } = ctx.query;

  const where = {};
  if (stationId) where.station_id = stationId;
  if (startDate && endDate) {
    where.created_at = { [Op.between]: [new Date(startDate), new Date(endDate + ' 23:59:59')] };
  }

  const records = await OutboundRecord.findAll({ where });

  const totalWeight = records.reduce((sum, r) => sum + parseFloat(r.weight), 0);
  const totalCount = records.length;

  // 按分类统计
  const byCategory = {};
  records.forEach(r => {
    if (!byCategory[r.outbound_category]) {
      byCategory[r.outbound_category] = { weight: 0, count: 0 };
    }
    byCategory[r.outbound_category].weight += parseFloat(r.weight);
    byCategory[r.outbound_category].count += 1;
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: {
      summary: { totalWeight, totalCount },
      byCategory: Object.entries(byCategory).map(([cat, data]) => ({ category: cat, ...data }))
    }
  };
};

/**
 * 库存报表
 * GET /api/reports/inventory
 */
export const getInventoryReport = async (ctx) => {
  const { stationId, startDate, endDate } = ctx.query;

  const where = {};
  if (stationId) where.station_id = stationId;
  if (startDate && endDate) {
    where.created_at = { [Op.between]: [new Date(startDate), new Date(endDate + ' 23:59:59')] };
  }

  const inboundRecords = await InboundRecord.findAll({ where });
  const outboundRecords = await OutboundRecord.findAll({ where });

  const totalInbound = inboundRecords.reduce((sum, r) => sum + parseFloat(r.weight), 0);
  const totalOutbound = outboundRecords.reduce((sum, r) => sum + parseFloat(r.weight), 0);

  ctx.body = {
    code: 200,
    message: 'success',
    data: {
      totalInbound,
      totalOutbound,
      netInventory: totalInbound - totalOutbound,
      inboundCount: inboundRecords.length,
      outboundCount: outboundRecords.length
    }
  };
};

export default {
  getWorkHoursReport,
  getMaintenanceReport,
  getRepairReport,
  getSafetyReport,
  getScheduleReport,
  getTemporaryTasksReport,
  getInboundReport,
  getOutboundReport,
  getInventoryReport
};
