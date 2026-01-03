import { MaintenancePositionPlan, MaintenancePlanLibrary, MaintenanceWorkRecord, Station, User, Schedule } from '../models/index.js';
import { Op } from 'sequelize';
import { createError } from '../middlewares/error.js';
import { getPagination, formatPaginationResponse } from '../utils/helpers.js';
import dayjs from 'dayjs';

/**
 * 获取今天需要执行的保养周期类型列表
 * @param {Object} plan - 保养计划对象
 * @returns {Array} 需要执行的周期类型列表
 */
const getTodayCycleTypes = (plan) => {
  const today = dayjs();
  const dayOfWeek = today.day() || 7; // dayjs的day()返回0-6(周日-周六)，转换为1-7(周一-周日)
  const dayOfMonth = today.date();
  const monthOfYear = today.month() + 1;

  const cycleTypes = [];

  // 检查日保养
  if (plan.daily_enabled) {
    cycleTypes.push('daily');
  }

  // 检查周保养
  if (plan.weekly_enabled && plan.weekly_day === dayOfWeek) {
    cycleTypes.push('weekly');
  }

  // 检查月保养
  if (plan.monthly_enabled && plan.monthly_day === dayOfMonth) {
    cycleTypes.push('monthly');
  }

  // 检查年保养
  if (plan.yearly_enabled && plan.yearly_month === monthOfYear && plan.yearly_day === dayOfMonth) {
    cycleTypes.push('yearly');
  }

  return cycleTypes;
};

/**
 * 判断今天是否需要执行该保养计划（兼容旧版单周期）
 * @param {Object} plan - 保养计划对象
 * @returns {boolean}
 */
const shouldExecuteToday = (plan) => {
  // 新版多周期
  if (plan.daily_enabled !== undefined) {
    return getTodayCycleTypes(plan).length > 0;
  }

  // 旧版单周期兼容
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
 * 获取岗位-保养计划分配列表
 * GET /api/maintenance-position-plans
 */
export const getMaintenancePositionPlans = async (ctx) => {
  const { stationId, positionName } = ctx.query;
  const { page, pageSize, offset, limit } = getPagination(ctx.query);

  const where = {};
  if (stationId) {
    where.station_id = parseInt(stationId);
  }
  if (positionName) {
    where.position_name = positionName;
  }

  const result = await MaintenancePositionPlan.findAndCountAll({
    where,
    include: [
      { model: Station, as: 'station', attributes: ['id', 'station_name'] },
      {
        model: MaintenancePlanLibrary,
        as: 'plan',
        attributes: ['id', 'equipment_code', 'equipment_name', 'install_location', 'cycle_type',
                     'weekly_day', 'monthly_day', 'yearly_month', 'yearly_day', 'maintenance_standards']
      }
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
 * 创建岗位-保养计划分配
 * POST /api/maintenance-position-plans
 */
export const createMaintenancePositionPlan = async (ctx) => {
  const { stationId, positionName, planIds } = ctx.request.body;

  if (!stationId || !positionName || !planIds || !planIds.length) {
    throw createError(400, '场站、岗位和保养计划不能为空');
  }

  // 批量创建分配记录
  const results = [];
  for (const planId of planIds) {
    // 检查是否已存在
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
    message: `成功分配 ${results.length} 个保养计划`,
    data: results
  };
};

/**
 * 删除岗位-保养计划分配
 * DELETE /api/maintenance-position-plans/:id
 */
export const deleteMaintenancePositionPlan = async (ctx) => {
  const { id } = ctx.params;

  const record = await MaintenancePositionPlan.findByPk(id);
  if (!record) {
    throw createError(404, '分配记录不存在');
  }

  await record.destroy();

  ctx.body = {
    code: 200,
    message: '删除成功'
  };
};

/**
 * 获取员工今日保养任务
 * GET /api/maintenance-work-records/today-tasks
 */
export const getTodayMaintenanceTasks = async (ctx) => {
  const { id: userId, realName } = ctx.state.user;
  const today = dayjs().format('YYYY-MM-DD');
  const year = dayjs().year();
  const month = dayjs().month() + 1;
  const day = dayjs().date();

  // 1. 查询用户今日排班
  const schedules = await Schedule.findAll({
    where: {
      user_id: userId,
      year,
      month
    }
  });

  // 筛选出今天有排班的记录
  const todaySchedules = [];
  for (const schedule of schedules) {
    const scheduleData = schedule.schedules || {};
    const dateKey = today;
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

  // 2. 根据排班的岗位，查询关联的保养计划
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

      // 检查今天是否需要执行该保养
      if (!shouldExecuteToday(plan)) continue;

      // 检查今天是否已经提交过
      const existingRecord = await MaintenanceWorkRecord.findOne({
        where: {
          plan_id: plan.id,
          executor_id: userId,
          work_date: today,
          cycle_type: plan.cycle_type
        }
      });

      const taskObj = {
        positionPlanId: positionPlan.id,
        stationId: positionPlan.station_id,
        stationName: positionPlan.station?.station_name || '',
        positionName: positionPlan.position_name,
        planId: plan.id,
        equipmentCode: plan.equipment_code,
        equipmentName: plan.equipment_name,
        installLocation: plan.install_location,
        cycleType: plan.cycle_type,
        weeklyDay: plan.weekly_day,
        monthlyDay: plan.monthly_day,
        yearlyMonth: plan.yearly_month,
        yearlyDay: plan.yearly_day,
        maintenanceStandards: plan.maintenance_standards || [],
        workDate: today,
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
 * 提交/更新保养工作记录
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
    throw createError(400, '保养计划、场站、周期类型和工作日期不能为空');
  }

  // 查找是否已有记录
  let record = await MaintenanceWorkRecord.findOne({
    where: {
      plan_id: planId,
      executor_id: userId,
      work_date: workDate,
      cycle_type: cycleType
    }
  });

  if (record) {
    // 更新现有记录
    await record.update({
      maintenance_items: maintenanceItems,
      maintenance_tools: maintenanceTools,
      work_hours: workHours,
      consumables_list: consumablesList,
      parts_list: partsList,
      remark,
      status: 'completed',
      submit_time: new Date()
    });
  } else {
    // 创建新记录
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
    message: '保养记录提交成功',
    data: record
  };
};

/**
 * 获取保养工作记录列表（管理者查看）
 * GET /api/maintenance-work-records
 */
export const getMaintenanceWorkRecords = async (ctx) => {
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const { stationId, positionName, executorName, cycleType, startDate, endDate, status } = ctx.query;
  const dataFilter = ctx.state.dataFilter;

  const where = {};

  // 场站过滤
  if (stationId) {
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

  if (cycleType) {
    where.cycle_type = cycleType;
  }

  if (status) {
    where.status = status;
  }

  if (startDate && endDate) {
    where.work_date = { [Op.between]: [startDate, endDate] };
  } else if (startDate) {
    where.work_date = { [Op.gte]: startDate };
  } else if (endDate) {
    where.work_date = { [Op.lte]: endDate };
  }

  const result = await MaintenanceWorkRecord.findAndCountAll({
    where,
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
};

/**
 * 获取单条保养工作记录详情
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
    throw createError(404, '保养记录不存在');
  }

  ctx.body = {
    code: 200,
    message: 'success',
    data: record
  };
};

/**
 * 验收保养工作记录
 * PUT /api/maintenance-work-records/:id/verify
 */
export const verifyMaintenanceWorkRecord = async (ctx) => {
  const { id } = ctx.params;
  const { id: verifierId, realName: verifierName } = ctx.state.user;
  const { verifyResult, verifyRemark } = ctx.request.body;

  if (!verifyResult || !['pass', 'fail'].includes(verifyResult)) {
    throw createError(400, '验收结果无效');
  }

  const record = await MaintenanceWorkRecord.findByPk(id);
  if (!record) {
    throw createError(404, '保养记录不存在');
  }

  if (record.status !== 'completed') {
    throw createError(400, '只能验收已完成的保养记录');
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
    message: '验收成功',
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
