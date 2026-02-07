import { Op } from 'sequelize';
import { PositionWorkLog, Schedule, PositionJob, User, Station, sequelize } from '../../../models/index.js';
import { createError } from '../../../middlewares/error.js';
import { getPagination, formatPaginationResponse, getOrderBy } from '../../../utils/helpers.js';
import dayjs from 'dayjs';

const resolveWorkDate = (value) => {
  const dateValue = value ? dayjs(value) : dayjs();
  if (!dateValue.isValid()) {
    throw createError(400, '日期格式不正确');
  }
  return dateValue.format('YYYY-MM-DD');
};

const normalizeQuantity = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return null;
  return parsed;
};

const normalizeUnitPointsValue = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return null;
  return parsed;
};

const resolveTextValue = (value) => (typeof value === 'string' ? value.trim() : '');

const hasValue = (value) => value !== undefined && value !== null && value !== '';

const buildDateRange = (startDate, endDate) => {
  const startValue = resolveTextValue(startDate);
  const endValue = resolveTextValue(endDate);
  if (!startValue && !endValue) return null;
  if (startValue && endValue) {
    return { [Op.between]: [`${startValue} 00:00:00`, `${endValue} 23:59:59`] };
  }
  if (startValue) {
    return { [Op.gte]: `${startValue} 00:00:00` };
  }
  return { [Op.lte]: `${endValue} 23:59:59` };
};

const validateQuantity = (value) => {
  if (!Number.isInteger(value)) {
    throw createError(400, '数量必须为整数');
  }
  if (value < 1 || value > 1000) {
    throw createError(400, '数量必须是 1-1000 的整数');
  }
};

const validateUnitPointsValue = (value) => {
  if (!Number.isInteger(value)) {
    throw createError(400, '单位积分必须为整数');
  }
  if (value < 0 || value > 9999) {
    throw createError(400, '单位积分必须是 0-9999 的整数');
  }
};

const resolveReviewStatus = (taskSource, positionJob) => {
  if (taskSource === 'self_apply') return 'pending';
  if (taskSource === 'dispatch') {
    return Number(positionJob?.dispatch_review_required) === 1 ? 'pending' : 'auto_approved';
  }
  return 'auto_approved';
};

const resolveStationInfo = async (stationId, stationName) => {
  const normalizedId = stationId !== undefined && stationId !== null ? Number(stationId) : null;
  if (normalizedId && !stationName) {
    const station = await Station.findByPk(normalizedId);
    return {
      stationId: normalizedId,
      stationName: station?.station_name ?? ''
    };
  }
  return {
    stationId: normalizedId,
    stationName: stationName ?? ''
  };
};

/**
 * 获取今日任务列表 + 派发任务
 * GET /api/position-work-logs/today-tasks
 */
export const getTodayTasks = async (ctx) => {
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const user = ctx.state.user;
  const workDate = resolveWorkDate(ctx.query?.workDate);
  const dateValue = dayjs(workDate);
  const year = dateValue.year();
  const month = dateValue.month() + 1;

  const allSchedules = await Schedule.findAll({
    where: {
      user_id: user.id,
      year,
      month
    },
    include: [{ model: Station, as: 'station', attributes: ['id', 'station_name'] }]
  });

  const schedules = allSchedules.filter(schedule => {
    const schedulesData = schedule.schedules ?? {};
    return schedulesData[workDate] === true || Boolean(schedulesData[workDate]);
  });

  const jobEntries = [];
  for (const schedule of schedules) {
    const positionJobs = await PositionJob.findAll({
      where: {
        station_id: schedule.station_id,
        position_name: schedule.position_name,
        is_active: 1
      },
      order: [
        ['sort_order', 'ASC'],
        ['created_at', 'ASC']
      ]
    });

    positionJobs.forEach(job => {
      jobEntries.push({ schedule, job });
    });
  }

  const jobIds = jobEntries.map(entry => entry.job.id);
  const fixedLogs = jobIds.length > 0
    ? await PositionWorkLog.findAll({
      where: {
        user_id: user.id,
        position_job_id: { [Op.in]: jobIds },
        work_date: workDate,
        task_source: 'fixed'
      }
    })
    : [];
  const fixedLogMap = new Map(fixedLogs.map(log => [log.position_job_id, log]));

  const tasks = jobEntries.map(({ schedule, job }) => {
    const existingLog = fixedLogMap.get(job.id);
    const quantityEditable = Number(job.quantity_editable) === 1;
    const defaultQuantity = job.quantity ?? 1;
    const quantityValue = existingLog?.quantity ?? defaultQuantity;

    return {
      taskSource: 'fixed',
      stationId: schedule.station_id,
      stationName: schedule.station?.station_name ?? '',
      positionName: schedule.position_name,
      jobId: job.id,
      workName: job.job_name,
      taskCategory: job.task_category ?? '',
      scoreMethod: job.score_method ?? '',
      unitPoints: job.points,
      quantity: quantityValue,
      quantityEditable,
      standardHours: job.standard_hours ?? 0,
      logId: existingLog?.id ?? null,
      submitTime: existingLog?.submit_time ?? null,
      isSubmitted: Boolean(existingLog?.submit_time),
      actualHours: existingLog?.actual_hours ?? 0,
      isCompleted: existingLog?.is_completed ?? 0,
      progress: existingLog?.progress ?? 0,
      remark: existingLog?.remark ?? '',
      isOvertime: existingLog?.is_overtime ?? 0,
      reviewStatus: existingLog?.review_status ?? null
    };
  });

  const dispatchLogs = await PositionWorkLog.findAll({
    where: {
      user_id: user.id,
      work_date: workDate,
      task_source: 'dispatch'
    }
  });

  dispatchLogs.forEach(log => {
    tasks.push({
      taskSource: 'dispatch',
      stationId: log.station_id,
      stationName: log.station_name ?? '',
      positionName: log.position_name ?? '',
      jobId: log.position_job_id,
      workName: log.work_name,
      taskCategory: log.task_category ?? '',
      scoreMethod: log.score_method ?? '',
      unitPoints: log.unit_points,
      quantity: log.quantity ?? 1,
      quantityEditable: Number(log.quantity_editable) === 1,
      standardHours: log.standard_hours ?? 0,
      logId: log.id,
      submitTime: log.submit_time ?? null,
      isSubmitted: Boolean(log.submit_time),
      actualHours: log.actual_hours ?? 0,
      isCompleted: log.is_completed ?? 0,
      progress: log.progress ?? 0,
      remark: log.remark ?? '',
      isOvertime: log.is_overtime ?? 0,
      reviewStatus: log.review_status ?? null
    });
  });

  const total = tasks.length;
  const pagedTasks = tasks.slice(offset, offset + limit);

  ctx.body = {
    code: 200,
    message: 'success',
    data: formatPaginationResponse({ rows: pagedTasks, count: total }, page, pageSize)
  };
};

/**
 * 固定任务/派发任务提交完成
 * POST /api/position-work-logs
 */
export const saveWorkLog = async (ctx) => {
  const user = ctx.state.user;
  const {
    logId,
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
    remark,
    quantity,
    unitPoints,
    taskSource
  } = ctx.request.body;

  if (!positionJobId || !workDate || !workName) {
    throw createError(400, '任务参数不完整');
  }

  const positionJob = await PositionJob.findByPk(positionJobId);
  if (!positionJob) {
    throw createError(404, '岗位任务不存在');
  }

  if (positionJob.points === null || positionJob.points === undefined) {
    throw createError(400, '该任务未设置单位积分，无法提交');
  }

  const normalizedDate = resolveWorkDate(workDate);
  const quantityEditable = Number(positionJob.quantity_editable) === 1;
  const defaultQuantity = positionJob.quantity ?? 1;
  const resolveSubmitQuantity = (inputQuantity, fallbackQuantity) => {
    const normalized = quantityEditable
      ? normalizeQuantity(inputQuantity, fallbackQuantity)
      : fallbackQuantity;
    if (normalized === null) {
      throw createError(400, '数量必须为整数');
    }
    validateQuantity(normalized);
    return normalized;
  };


  const completedValue = Number(isCompleted) === 1 ? 1 : 0;
  const actualHoursValue = actualHours ?? 0;
  const standardHoursValue = standardHours ?? positionJob.standard_hours ?? 0;
  const isOvertime = actualHoursValue > standardHoursValue ? 1 : 0;
  const nowTime = dayjs().format('YYYY-MM-DD HH:mm:ss');

  if (logId) {
    const workLog = await PositionWorkLog.findByPk(logId);
    if (!workLog) {
      throw createError(404, '工作记录不存在');
    }
    if (workLog.user_id !== user.id) {
      throw createError(403, '无权限提交该任务');
    }
    if (workLog.submit_time && workLog.review_status !== 'rejected') {
      throw createError(400, '任务已提交');
    }
    if (workLog.task_source !== 'dispatch') {
      throw createError(400, '仅派发任务支持此提交方式');
    }

    const normalizedQuantity = resolveSubmitQuantity(quantity, workLog.quantity ?? defaultQuantity);
    const resolvedUnitPoints = normalizeUnitPointsValue(unitPoints, positionJob.points);
    if (resolvedUnitPoints === null) {
      throw createError(400, '单位积分必须为整数');
    }
    validateUnitPointsValue(resolvedUnitPoints);
    await workLog.update({
      actual_hours: actualHoursValue,
      is_completed: completedValue,
      progress: progress ?? 0,
      remark: remark ?? '',
      is_overtime: isOvertime,
      submit_time: nowTime,
      review_status: resolveReviewStatus('dispatch', positionJob),
      approver_id: null,
      approver_name: null,
      approve_time: null,
      deduction_reason: null,
      deduction_points: null,
      unit_points: resolvedUnitPoints,
      quantity: normalizedQuantity,
      quantity_editable: quantityEditable ? 1 : 0,
      task_category: positionJob.task_category ?? null,
      score_method: positionJob.score_method ?? null,
      standard_hours: standardHoursValue
    });

    ctx.body = {
      code: 200,
      message: '提交成功',
      data: { id: workLog.id }
    };
    return;
  }

  const normalizedTaskSource = taskSource ?? 'fixed';
  if (normalizedTaskSource !== 'fixed') {
    throw createError(400, '仅支持固定任务提交');
  }

  const existingLog = await PositionWorkLog.findOne({
    where: {
      user_id: user.id,
      position_job_id: positionJobId,
      work_date: normalizedDate,
      task_source: 'fixed'
    }
  });

  if (existingLog) {
    throw createError(400, '任务已提交');
  }

  const normalizedQuantity = resolveSubmitQuantity(quantity, defaultQuantity);
  const resolvedStation = await resolveStationInfo(stationId ?? positionJob.station_id, stationName);

  const workLog = await PositionWorkLog.create({
    user_id: user.id,
    user_name: user.realName,
    station_id: resolvedStation.stationId,
    station_name: resolvedStation.stationName,
    position_name: positionName ?? positionJob.position_name,
    position_job_id: positionJobId,
    task_source: 'fixed',
    work_date: normalizedDate,
    work_name: workName,
    task_category: positionJob.task_category ?? null,
    score_method: positionJob.score_method ?? null,
    unit_points: positionJob.points,
    quantity: normalizedQuantity,
    quantity_editable: quantityEditable ? 1 : 0,
    standard_hours: standardHoursValue,
    actual_hours: actualHoursValue,
    is_completed: completedValue,
    progress: progress ?? 0,
    remark: remark ?? '',
    is_overtime: isOvertime,
    submit_time: nowTime,
    review_status: resolveReviewStatus('fixed', positionJob)
  });

  ctx.body = {
    code: 200,
    message: '提交成功',
    data: { id: workLog.id }
  };
};

/**
 * 员工申请任务
 * POST /api/position-work-logs/apply
 */
export const applyWorkLog = async (ctx) => {
  const user = ctx.state.user;
  const {
    positionJobId,
    workDate,
    stationId,
    stationName,
    positionName,
    quantity,
    remark
  } = ctx.request.body;

  if (!positionJobId || !workDate) {
    throw createError(400, '任务参数不完整');
  }

  const positionJob = await PositionJob.findByPk(positionJobId);
  if (!positionJob) {
    throw createError(404, '岗位任务不存在');
  }

  if (positionJob.points === null || positionJob.points === undefined) {
    throw createError(400, '该任务未设置单位积分，无法提交');
  }

  const normalizedDate = resolveWorkDate(workDate);
  const quantityEditable = Number(positionJob.quantity_editable) === 1;
  const defaultQuantity = positionJob.quantity ?? 1;
  const normalizedQuantity = quantityEditable
    ? normalizeQuantity(quantity, defaultQuantity)
    : defaultQuantity;

  if (normalizedQuantity === null) {
    throw createError(400, '数量必须为整数');
  }
  validateQuantity(normalizedQuantity);

  const resolvedStation = await resolveStationInfo(stationId ?? positionJob.station_id, stationName);

  if (!resolvedStation.stationId) {
    throw createError(400, '场站不能为空');
  }

  const nowTime = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const workLog = await PositionWorkLog.create({
    user_id: user.id,
    user_name: user.realName,
    station_id: resolvedStation.stationId,
    station_name: resolvedStation.stationName,
    position_name: positionName ?? positionJob.position_name,
    position_job_id: positionJobId,
    task_source: 'self_apply',
    work_date: normalizedDate,
    work_name: positionJob.job_name,
    task_category: positionJob.task_category ?? null,
    score_method: positionJob.score_method ?? null,
    unit_points: positionJob.points,
    quantity: normalizedQuantity,
    quantity_editable: quantityEditable ? 1 : 0,
    standard_hours: positionJob.standard_hours ?? 0,
    actual_hours: 0,
    is_completed: 1,
    progress: 100,
    remark: remark ?? '',
    is_overtime: 0,
    submit_time: nowTime,
    review_status: resolveReviewStatus('self_apply', positionJob)
  });

  ctx.body = {
    code: 200,
    message: '申请成功',
    data: { id: workLog.id }
  };
};

/**
 * 派发任务
 * POST /api/position-work-logs/dispatch
 */
export const dispatchWorkLog = async (ctx) => {
  const user = ctx.state.user;
  const {
    positionJobId,
    executorId,
    executorName,
    workDate,
    stationId,
    stationName,
    positionName,
    quantity
  } = ctx.request.body;

  if (!positionJobId || !executorId || !workDate) {
    throw createError(400, '任务参数不完整');
  }

  const positionJob = await PositionJob.findByPk(positionJobId);
  if (!positionJob) {
    throw createError(404, '岗位任务不存在');
  }

  if (positionJob.points === null || positionJob.points === undefined) {
    throw createError(400, '该任务未设置单位积分，无法派发');
  }

  const normalizedDate = resolveWorkDate(workDate);
  const quantityEditable = Number(positionJob.quantity_editable) === 1;
  const defaultQuantity = positionJob.quantity ?? 1;
  const normalizedQuantity = normalizeQuantity(quantity, defaultQuantity);

  if (normalizedQuantity === null) {
    throw createError(400, '数量必须为整数');
  }
  validateQuantity(normalizedQuantity);

  const resolvedStation = await resolveStationInfo(stationId ?? positionJob.station_id, stationName);

  if (!resolvedStation.stationId) {
    throw createError(400, '场站不能为空');
  }

  const nowTime = dayjs().format('YYYY-MM-DD HH:mm:ss');

  let resolvedExecutorName = executorName ?? '';
  if (!resolvedExecutorName) {
    const executor = await User.findByPk(executorId);
    resolvedExecutorName = executor?.real_name ?? '';
  }

  const workLog = await PositionWorkLog.create({
    user_id: executorId,
    user_name: resolvedExecutorName,
    station_id: resolvedStation.stationId,
    station_name: resolvedStation.stationName,
    position_name: positionName ?? positionJob.position_name,
    position_job_id: positionJobId,
    task_source: 'dispatch',
    work_date: normalizedDate,
    work_name: positionJob.job_name,
    task_category: positionJob.task_category ?? null,
    score_method: positionJob.score_method ?? null,
    unit_points: positionJob.points,
    quantity: normalizedQuantity,
    quantity_editable: quantityEditable ? 1 : 0,
    standard_hours: positionJob.standard_hours ?? 0,
    actual_hours: 0,
    is_completed: 0,
    progress: 0,
    remark: '',
    is_overtime: 0,
    submit_time: null,
    review_status: null,
    assigned_by_id: user.id,
    assigned_by_name: user.realName ?? '',
    assigned_time: nowTime
  });

  ctx.body = {
    code: 200,
    message: '派发成功',
    data: { id: workLog.id }
  };
};

/**
 * 查询本人工作记录
 * GET /api/position-work-logs
 */
export const getWorkLogs = async (ctx) => {
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const order = getOrderBy(ctx.query);
  const { startDate, endDate, stationId, positionName, taskSource, reviewStatus } = ctx.query;
  const user = ctx.state.user;

  const where = { user_id: user.id };

  if (startDate && endDate) {
    where.work_date = { [Op.between]: [startDate, endDate] };
  } else if (startDate) {
    where.work_date = { [Op.gte]: startDate };
  } else if (endDate) {
    where.work_date = { [Op.lte]: endDate };
  }

  if (stationId) where.station_id = stationId;
  if (positionName) where.position_name = positionName;
  if (taskSource) where.task_source = taskSource;
  if (reviewStatus) where.review_status = reviewStatus;

  const result = await PositionWorkLog.findAndCountAll({
    where,
    include: [{ model: Station, as: 'station', attributes: ['id', 'station_name'] }],
    offset,
    limit,
    order
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: formatPaginationResponse(result, page, pageSize)
  };
};

/**
 * 管理员查看人员记录
 * GET /api/position-work-logs/user
 */
export const getUserWorkLogs = async (ctx) => {
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const { userId, startDate, endDate, stationId, positionName, taskSource } = ctx.query;
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
  if (taskSource) where.task_source = taskSource;

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

/**
 * 岗位工作完成情况记录
 * GET /api/position-work-logs/records
 */
export const getWorkRecords = async (ctx) => {
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const order = getOrderBy(ctx.query);
  const {
    keyword,
    taskSource,
    reviewStatus,
    startDate,
    endDate,
    submitStartDate,
    submitEndDate,
    approveStartDate,
    approveEndDate,
    stationId,
    stationName,
    positionName,
    userName,
    workName,
    taskCategory,
    scoreMethod,
    unitPoints,
    quantity,
    calculatedPoints,
    isCompleted,
    approverName,
    deductionReason,
    deductionPoints
  } = ctx.query;
  const dataFilter = ctx.state.dataFilter;

  const where = {
    submit_time: { [Op.not]: null }
  };

  if (hasValue(taskSource)) {
    where.task_source = taskSource;
  }

  if (hasValue(reviewStatus)) {
    where.review_status = reviewStatus;
  }

  if (hasValue(stationId)) {
    const normalized = Number(stationId);
    if (!Number.isNaN(normalized)) {
      where.station_id = normalized;
    }
  }

  const stationNameText = resolveTextValue(stationName);
  if (stationNameText) {
    where.station_name = { [Op.like]: `%${stationNameText}%` };
  }

  const positionNameText = resolveTextValue(positionName);
  if (positionNameText) {
    where.position_name = { [Op.like]: `%${positionNameText}%` };
  }

  const userNameText = resolveTextValue(userName);
  if (userNameText) {
    where.user_name = { [Op.like]: `%${userNameText}%` };
  }

  const workNameText = resolveTextValue(workName);
  if (workNameText) {
    where.work_name = { [Op.like]: `%${workNameText}%` };
  }

  const taskCategoryText = resolveTextValue(taskCategory);
  if (taskCategoryText) {
    where.task_category = { [Op.like]: `%${taskCategoryText}%` };
  }

  const scoreMethodText = resolveTextValue(scoreMethod);
  if (scoreMethodText) {
    where.score_method = scoreMethodText;
  }

  const approverNameText = resolveTextValue(approverName);
  if (approverNameText) {
    where.approver_name = { [Op.like]: `%${approverNameText}%` };
  }

  const deductionReasonText = resolveTextValue(deductionReason);
  if (deductionReasonText) {
    where.deduction_reason = { [Op.like]: `%${deductionReasonText}%` };
  }

  if (hasValue(unitPoints)) {
    const normalized = Number(unitPoints);
    if (!Number.isNaN(normalized)) {
      where.unit_points = normalized;
    }
  }

  if (hasValue(quantity)) {
    const normalized = Number.parseInt(quantity, 10);
    if (!Number.isNaN(normalized)) {
      where.quantity = normalized;
    }
  }

  if (hasValue(deductionPoints)) {
    const normalized = Number(deductionPoints);
    if (!Number.isNaN(normalized)) {
      where.deduction_points = normalized;
    }
  }

  if (hasValue(isCompleted)) {
    const normalized = Number(isCompleted);
    if (normalized === 0 || normalized === 1) {
      where.is_completed = normalized;
    }
  }

  if (hasValue(calculatedPoints)) {
    const normalized = Number(calculatedPoints);
    if (!Number.isNaN(normalized)) {
      const calculatedWhere = sequelize.where(
        sequelize.literal('unit_points * quantity'),
        normalized
      );
      if (!where[Op.and]) {
        where[Op.and] = [];
      }
      where[Op.and].push(calculatedWhere);
    }
  }

  const submitRange = buildDateRange(submitStartDate, submitEndDate);
  const legacyRange = buildDateRange(startDate, endDate);
  if (submitRange) {
    where.submit_time = submitRange;
  } else if (legacyRange) {
    where.submit_time = legacyRange;
  }

  const approveRange = buildDateRange(approveStartDate, approveEndDate);
  if (approveRange) {
    where.approve_time = approveRange;
  }

  if (keyword) {
    where[Op.or] = [
      { user_name: { [Op.like]: `%${keyword}%` } },
      { station_name: { [Op.like]: `%${keyword}%` } },
      { position_name: { [Op.like]: `%${keyword}%` } },
      { work_name: { [Op.like]: `%${keyword}%` } },
      { task_category: { [Op.like]: `%${keyword}%` } },
      { score_method: { [Op.like]: `%${keyword}%` } },
      { approver_name: { [Op.like]: `%${keyword}%` } },
      { deduction_reason: { [Op.like]: `%${keyword}%` } },
      { review_status: { [Op.like]: `%${keyword}%` } },
      { task_source: { [Op.like]: `%${keyword}%` } }
    ];
    const numericKeyword = Number(keyword);
    if (!Number.isNaN(numericKeyword)) {
      where[Op.or].push(
        { unit_points: numericKeyword },
        { quantity: numericKeyword },
        { deduction_points: numericKeyword }
      );
    }
  }

  if (!dataFilter.all) {
    if (dataFilter.userId) {
      where.user_id = dataFilter.userId;
    }
    if (dataFilter.stationIds?.length > 0) {
      where.station_id = { [Op.in]: dataFilter.stationIds };
    }
  }

  const result = await PositionWorkLog.findAndCountAll({
    where,
    include: [
      { model: Station, as: 'station', attributes: ['id', 'station_name'] },
      { model: User, as: 'user', attributes: ['id', 'real_name'] }
    ],
    offset,
    limit,
    order,
    distinct: true
  });

  const rows = result.rows.map(row => {
    const unitPoints = row.unit_points ?? row.points ?? 0;
    const quantityValue = row.quantity ?? 1;
    return {
      ...row.toJSON(),
      calculated_points: Number(unitPoints) * Number(quantityValue)
    };
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: formatPaginationResponse({ rows, count: result.count }, page, pageSize)
  };
};

/**
 * 审核工作记录
 * PUT /api/position-work-logs/:id/review
 */
export const reviewWorkLog = async (ctx) => {
  const user = ctx.state.user;
  const { id } = ctx.params;
  const { status, deductionReason, deductionPoints } = ctx.request.body || {};

  if (!id || !status) {
    throw createError(400, '审核参数不完整');
  }

  const workLog = await PositionWorkLog.findByPk(id);
  if (!workLog) {
    throw createError(404, '工作记录不存在');
  }

  if (!workLog.submit_time) {
    throw createError(400, '工作未提交，无法审核');
  }

  if (['approved', 'rejected'].includes(workLog.review_status)) {
    throw createError(400, '该记录已审核');
  }

  if (!['approved', 'rejected'].includes(status)) {
    throw createError(400, '审核状态不正确');
  }

  const updateData = {
    review_status: status,
    approver_id: user.id,
    approver_name: user.realName ?? '',
    approve_time: dayjs().format('YYYY-MM-DD HH:mm:ss')
  };

  if (status === 'rejected') {
    if (!deductionReason) {
      throw createError(400, '请填写扣分原因');
    }
    if (deductionPoints === undefined || deductionPoints === null || deductionPoints === '') {
      throw createError(400, '请填写扣分值');
    }
    const parsed = Number(deductionPoints);
    if (Number.isNaN(parsed) || parsed > 0) {
      throw createError(400, '扣分值必须为0或负数');
    }
    updateData.deduction_reason = deductionReason;
    updateData.deduction_points = parsed;
  } else {
    updateData.deduction_reason = null;
    updateData.deduction_points = null;
  }

  await workLog.update(updateData);

  ctx.body = {
    code: 200,
    message: '审核完成',
    data: null
  };
};

/**
 * 申诉
 * POST /api/position-work-logs/:id/appeal
 */
export const submitAppeal = async (ctx) => {
  const user = ctx.state.user;
  const { id } = ctx.params;
  const { appealReason } = ctx.request.body || {};

  if (!id || !appealReason) {
    throw createError(400, '申诉参数不完整');
  }

  const workLog = await PositionWorkLog.findByPk(id);
  if (!workLog) {
    throw createError(404, '工作记录不存在');
  }

  if (workLog.user_id !== user.id) {
    throw createError(403, '无权限提交申诉');
  }

  await workLog.update({
    appeal_status: 'pending',
    appeal_reason: appealReason,
    appeal_time: dayjs().format('YYYY-MM-DD HH:mm:ss')
  });

  ctx.body = {
    code: 200,
    message: '申诉已提交'
  };
};

export default {
  getTodayTasks,
  saveWorkLog,
  applyWorkLog,
  dispatchWorkLog,
  getWorkLogs,
  getUserWorkLogs,
  getWorkRecords,
  reviewWorkLog,
  submitAppeal
};
