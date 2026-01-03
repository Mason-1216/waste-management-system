import { Op } from 'sequelize';
import { PositionWorkLog, Schedule, PositionJob, User, Station } from '../models/index.js';
import { createError } from '../middlewares/error.js';
import { getPagination, formatPaginationResponse } from '../utils/helpers.js';
import dayjs from 'dayjs';

/**
 * 获取我的今日工作项目（根据排班）
 * GET /api/position-work-logs/today-tasks
 */
export const getTodayTasks = async (ctx) => {
  const user = ctx.state.user;
  const today = dayjs().format('YYYY-MM-DD');
  const year = dayjs().year();
  const month = dayjs().month() + 1;

  // 查询本月排班记录
  const allSchedules = await Schedule.findAll({
    where: {
      user_id: user.id,
      year: year,
      month: month
    },
    include: [
      { model: Station, as: 'station', attributes: ['id', 'station_name'] }
    ]
  });

  // 过滤出今天有排班的记录
  const schedules = allSchedules.filter(schedule => {
    const schedulesData = schedule.schedules || {};
    return schedulesData[today] === true;
  });

  if (!schedules || schedules.length === 0) {
    ctx.body = {
      code: 200,
      message: '今日无排班',
      data: []
    };
    return;
  }

  // 根据排班获取对应的工作项目
  const tasks = [];
  for (const schedule of schedules) {
    const stationId = schedule.station_id;
    const positionName = schedule.position_name;

    // 查询该岗位的工作项目
    const positionJobs = await PositionJob.findAll({
      where: {
        station_id: stationId,
        position_name: positionName
      }
    });

    // 查询今日是否已登记
    for (const job of positionJobs) {
      const existingLog = await PositionWorkLog.findOne({
        where: {
          user_id: user.id,
          position_job_id: job.id,
          work_date: today
        }
      });

      tasks.push({
        scheduleId: schedule.id,
        stationId: schedule.station_id,
        stationName: schedule.station?.station_name || '',
        positionName: schedule.position_name,
        jobId: job.id,
        workName: job.job_name, // PositionJob 模型使用 job_name
        standardHours: job.standard_hours,
        // 如果已登记，返回登记信息
        logId: existingLog?.id,
        actualHours: existingLog?.actual_hours || 0,
        isCompleted: existingLog?.is_completed || 0,
        progress: existingLog?.progress || 0,
        remark: existingLog?.remark || '',
        isOvertime: existingLog?.is_overtime || 0,
        appealStatus: existingLog?.appeal_status || null
      });
    }
  }

  ctx.body = {
    code: 200,
    message: 'success',
    data: tasks
  };
};

/**
 * 保存/更新工作登记
 * POST /api/position-work-logs
 */
export const saveWorkLog = async (ctx) => {
  const user = ctx.state.user;
  const {
    positionJobId,
    workDate,
    stationId,
    stationName,
    positionName,
    workName,
    standardHours,
    actualHours,
    isCompleted,
    progress,
    remark
  } = ctx.request.body;

  if (!positionJobId || !workDate || !workName) {
    throw createError(400, '参数不完整');
  }

  const isOvertime = actualHours > standardHours ? 1 : 0;

  // 检查是否已存在
  const existingLog = await PositionWorkLog.findOne({
    where: {
      user_id: user.id,
      position_job_id: positionJobId,
      work_date: workDate
    }
  });

  let workLog;
  if (existingLog) {
    // 更新
    await existingLog.update({
      actual_hours: actualHours,
      is_completed: isCompleted,
      progress: progress,
      remark: remark,
      is_overtime: isOvertime
    });
    workLog = existingLog;
  } else {
    // 新建
    workLog = await PositionWorkLog.create({
      user_id: user.id,
      user_name: user.realName,
      station_id: stationId,
      station_name: stationName,
      position_name: positionName,
      position_job_id: positionJobId,
      work_date: workDate,
      work_name: workName,
      standard_hours: standardHours,
      actual_hours: actualHours,
      is_completed: isCompleted,
      progress: progress,
      remark: remark,
      is_overtime: isOvertime
    });
  }

  ctx.body = {
    code: 200,
    message: '保存成功',
    data: { id: workLog.id }
  };
};

/**
 * 查询工作登记历史
 * GET /api/position-work-logs
 */
export const getWorkLogs = async (ctx) => {
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const { startDate, endDate, stationId, positionName } = ctx.query;
  const user = ctx.state.user;

  const where = { user_id: user.id };

  if (startDate && endDate) {
    where.work_date = { [Op.between]: [startDate, endDate] };
  }
  if (stationId) where.station_id = stationId;
  if (positionName) where.position_name = positionName;

  const result = await PositionWorkLog.findAndCountAll({
    where,
    include: [
      { model: Station, as: 'station', attributes: ['id', 'station_name'] }
    ],
    offset,
    limit,
    order: [['work_date', 'DESC'], ['created_at', 'DESC']]
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: formatPaginationResponse(result, page, pageSize)
  };
};

/**
 * 查询用户工作登记（管理员查看其他用户）
 * GET /api/position-work-logs/user
 */
export const getUserWorkLogs = async (ctx) => {
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const { userId, startDate, endDate, stationId, positionName } = ctx.query;
  const dataFilter = ctx.state.dataFilter;

  if (!userId) {
    throw createError(400, '用户ID不能为空');
  }

  const where = { user_id: userId };

  if (startDate && endDate) {
    where.work_date = { [Op.between]: [startDate, endDate] };
  } else if (startDate) {
    where.work_date = { [Op.gte]: startDate };
  } else if (endDate) {
    where.work_date = { [Op.lte]: endDate };
  }

  if (stationId) where.station_id = stationId;
  if (positionName) where.position_name = positionName;

  // 根据权限过滤
  if (!dataFilter.all && dataFilter.stationIds?.length > 0) {
    where.station_id = { [Op.in]: dataFilter.stationIds };
  }

  const result = await PositionWorkLog.findAndCountAll({
    where,
    include: [
      { model: Station, as: 'station', attributes: ['id', 'station_name'] },
      { model: PositionJob, as: 'positionJob', attributes: ['id', 'job_name', 'standard_hours'] }
    ],
    offset,
    limit,
    order: [['work_date', 'DESC'], ['created_at', 'DESC']]
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: formatPaginationResponse(result, page, pageSize)
  };
};

export default {
  getTodayTasks,
  saveWorkLog,
  getWorkLogs,
  getUserWorkLogs
};
