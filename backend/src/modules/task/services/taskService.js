import { Op } from 'sequelize';
import { TaskConfig, PositionTask, DailyTask, TemporaryTask, PositionWorkLog, User, Role } from '../../../models/index.js';
import { createError } from '../../../middlewares/error.js';
import { getPagination, formatPaginationResponse, getOrderBy, generateRecordCode } from '../../../utils/helpers.js';
import { publishNotification } from '../../notification/services/notificationPublisher.js';
import { validateBody, validateParams, validateQuery } from '../../core/validators/validate.js';
import { createTaskConfigBodySchema, createTemporaryTaskBodySchema, getDailyTaskSummaryQuerySchema, getDailyTasksQuerySchema, getMyDailyTasksQuerySchema, getPositionTasksQuerySchema, getTaskConfigsQuerySchema, getTemporaryTasksQuerySchema, idParamSchema, reviewTemporaryTaskBodySchema, savePositionTasksBodySchema, submitDailyTasksBodySchema, submitTemporaryTaskBodySchema, updateTaskConfigBodySchema, updateTemporaryTaskBodySchema } from '../validators/taskServiceSchemas.js';

const mapDispatchTaskStatus = (workLog) => {
  if (!workLog?.submit_time) return 'pending';
  if (workLog.review_status === 'rejected') return 'rejected';
  if (workLog.review_status === 'approved' || workLog.review_status === 'auto_approved') return 'completed';
  return 'processing';
};

const normalizeQuantityValue = (value, fallback) => {
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

const validateQuantityValue = (value) => {
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
// ============================================
// 任务配置管理
// ============================================

/**
 * 查询任务配置列表
 * GET /api/task-configs
 */
export const getTaskConfigs = async (ctx) => {
  await validateQuery(ctx, getTaskConfigsQuerySchema);
  const { status } = ctx.query;

  const where = {};

  if (status) {
    where.status = status === 'in_progress' ? 'processing' : status;
  }

  const configs = await TaskConfig.findAll({
    where,
    order: [['is_system_default', 'DESC'], ['task_name', 'ASC']]
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: configs
  };
};

/**
 * 新增任务配置
 * POST /api/task-configs
 */
export const createTaskConfig = async (ctx) => {
  const { taskName, standardHours } = await validateBody(ctx, createTaskConfigBodySchema);

  if (!taskName || !standardHours) {
    throw createError(400, '任务名称和标准工时不能为空');
  }

  const config = await TaskConfig.create({
    task_name: taskName,
    standard_hours: standardHours,
    is_system_default: 0,
    status: 'active',
    created_by: ctx.state.user.id
  });

  ctx.body = {
    code: 200,
    message: '任务配置创建成功',
    data: { id: config.id }
  };
};

/**
 * 编辑任务配置
 * PUT /api/task-configs/:id
 */
export const updateTaskConfig = async (ctx) => {
  const { id } = await validateParams(ctx, idParamSchema);
  const { taskName, standardHours, status } = await validateBody(ctx, updateTaskConfigBodySchema);

  const config = await TaskConfig.findByPk(id);
  if (!config) {
    throw createError(404, '任务配置不存在');
  }

  await config.update({
    task_name: taskName,
    standard_hours: standardHours,
    status
  });

  ctx.body = {
    code: 200,
    message: '任务配置更新成功',
    data: null
  };
};

/**
 * 删除任务配置
 * DELETE /api/task-configs/:id
 */
export const deleteTaskConfig = async (ctx) => {
  const { id } = await validateParams(ctx, idParamSchema);

  const config = await TaskConfig.findByPk(id);
  if (!config) {
    throw createError(404, '任务配置不存在');
  }

  if (config.is_system_default) {
    throw createError(400, '系统预设任务不能删除');
  }

  await config.destroy();

  ctx.body = {
    code: 200,
    message: '任务配置删除成功',
    data: null
  };
};

// ============================================
// 岗位固定任务配置
// ============================================

/**
 * 查询岗位固定任务
 * GET /api/position-tasks
 */
export const getPositionTasks = async (ctx) => {
  await validateQuery(ctx, getPositionTasksQuerySchema);
  const { positionName } = ctx.query;

  const where = {};

  if (positionName) {
    where.position_name = positionName;
  }

  const tasks = await PositionTask.findAll({
    where,
    include: [
      { model: TaskConfig, as: 'taskConfig' }
    ],
    order: [['sort_order', 'ASC']]
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: tasks
  };
};

/**
 * 配置岗位固定任务
 * POST /api/position-tasks
 */
export const savePositionTasks = async (ctx) => {
  const { positionName, tasks } = await validateBody(ctx, savePositionTasksBodySchema);

  if (!positionName || !tasks) {
    throw createError(400, '参数不完整');
  }

  // 删除旧配置
  await PositionTask.destroy({
    where: { position_name: positionName }
  });

  // 创建新配置
  if (tasks.length > 0) {
    await PositionTask.bulkCreate(
      tasks.map((t, index) => ({
        position_name: positionName,
        task_config_id: t.taskConfigId,
        is_required: t.isRequired ? 1 : 0,
        sort_order: index
      }))
    );
  }

  ctx.body = {
    code: 200,
    message: '岗位任务配置成功',
    data: null
  };
};

// ============================================
// 每日任务记录
// ============================================

/**
 * 查询任务记录列表
 * GET /api/daily-tasks
 */
export const getDailyTasks = async (ctx) => {
  await validateQuery(ctx, getDailyTasksQuerySchema);
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const order = getOrderBy(ctx.query);
  const { userId, stationId, workDate, startDate, endDate, status } = ctx.query;
  const dataFilter = ctx.state.dataFilter;

  const where = {};

  if (userId) {
    where.user_id = userId;
  }

  if (stationId) {
    where.station_id = stationId;
  }

  if (workDate) {
    where.work_date = workDate;
  }

  if (startDate && endDate) {
    where.work_date = { [Op.between]: [startDate, endDate] };
  }

  if (status) {
    where.status = status;
  }

  // 数据权限过滤
  if (!dataFilter.all) {
    if (dataFilter.userId) {
      where.user_id = dataFilter.userId;
    }
    if (dataFilter.stationIds?.length > 0) {
      where.station_id = { [Op.in]: dataFilter.stationIds };
    }
  }

  const result = await DailyTask.findAndCountAll({
    where,
    include: [
      { model: User, as: 'user', attributes: ['id', 'real_name'] },
      { model: TaskConfig, as: 'taskConfig' }
    ],
    offset,
    limit,
    order,
    distinct: true
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: formatPaginationResponse(result, page, pageSize)
  };
};

/**
 * 查询我的任务记录
 * GET /api/daily-tasks/my
 */
export const getMyDailyTasks = async (ctx) => {
  await validateQuery(ctx, getMyDailyTasksQuerySchema);
  const { workDate, startDate, endDate } = ctx.query;
  const userId = ctx.state.user.id;

  const where = { user_id: userId };

  if (workDate) {
    where.work_date = workDate;
  }

  if (startDate && endDate) {
    where.work_date = { [Op.between]: [startDate, endDate] };
  }

  const tasks = await DailyTask.findAll({
    where,
    include: [{ model: TaskConfig, as: 'taskConfig' }],
    order: [['work_date', 'DESC'], ['created_at', 'DESC']]
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: tasks
  };
};

/**
 * 提交今日任务
 * POST /api/daily-tasks/submit
 */
export const submitDailyTasks = async (ctx) => {
  const { stationId, workDate, tasks } = await validateBody(ctx, submitDailyTasksBodySchema);
  const user = ctx.state.user;

  if (!workDate || !tasks?.length) {
    throw createError(400, '参数不完整');
  }

  const records = [];

  for (const task of tasks) {
    const taskConfig = await TaskConfig.findByPk(task.taskConfigId);
    if (!taskConfig) continue;

    const totalHours = parseFloat(taskConfig.standard_hours) * (task.times || 1);

    const record = await DailyTask.create({
      record_code: generateRecordCode('TASK'),
      user_id: user.id,
      user_name: user.realName,
      station_id: stationId,
      work_date: workDate,
      task_config_id: task.taskConfigId,
      task_name: taskConfig.task_name,
      times: task.times || 1,
      hours_per_time: taskConfig.standard_hours,
      total_hours: totalHours,
      is_fixed_task: task.isFixedTask ? 1 : 0,
      status: 'pending'
    });

    records.push(record);
  }

  const totalDailyHours = records.reduce((sum, r) => sum + parseFloat(r.total_hours), 0);

  ctx.body = {
    code: 200,
    message: '任务提交成功',
    data: {
      records,
      totalHours: totalDailyHours
    }
  };
};

/**
 * 工时汇总
 * GET /api/daily-tasks/summary
 */
export const getDailyTaskSummary = async (ctx) => {
  await validateQuery(ctx, getDailyTaskSummaryQuerySchema);
  const { stationId, userId, startDate, endDate, groupBy } = ctx.query;
  const dataFilter = ctx.state.dataFilter;

  const where = { status: 'approved' };

  if (stationId) {
    where.station_id = stationId;
  }

  if (userId) {
    where.user_id = userId;
  }

  if (startDate && endDate) {
    where.work_date = { [Op.between]: [startDate, endDate] };
  }

  // 数据权限过滤
  if (!dataFilter.all) {
    if (dataFilter.stationIds?.length > 0) {
      where.station_id = { [Op.in]: dataFilter.stationIds };
    }
  }

  const tasks = await DailyTask.findAll({ where });

  // 按不同维度汇总
  const summary = {};

  if (groupBy === 'user') {
    tasks.forEach(t => {
      if (!summary[t.user_id]) {
        summary[t.user_id] = { userId: t.user_id, userName: t.user_name, totalHours: 0, taskCount: 0 };
      }
      summary[t.user_id].totalHours += parseFloat(t.total_hours);
      summary[t.user_id].taskCount += 1;
    });
  } else if (groupBy === 'task') {
    tasks.forEach(t => {
      if (!summary[t.task_config_id]) {
        summary[t.task_config_id] = { taskConfigId: t.task_config_id, taskName: t.task_name, totalHours: 0, totalTimes: 0 };
      }
      summary[t.task_config_id].totalHours += parseFloat(t.total_hours);
      summary[t.task_config_id].totalTimes += t.times;
    });
  } else {
    // 按日期汇总
    tasks.forEach(t => {
      const date = t.work_date;
      if (!summary[date]) {
        summary[date] = { date, totalHours: 0, taskCount: 0 };
      }
      summary[date].totalHours += parseFloat(t.total_hours);
      summary[date].taskCount += 1;
    });
  }

  ctx.body = {
    code: 200,
    message: 'success',
    data: Object.values(summary)
  };
};

// ============================================
// 临时任务
// ============================================

/**
 * 查询临时任务列表
 * GET /api/temporary-tasks
 */
export const getTemporaryTasks = async (ctx) => {
  await validateQuery(ctx, getTemporaryTasksQuerySchema);
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const order = getOrderBy(ctx.query);
  const {
    executorId,
    status,
    taskType,
    taskName,
    assigneeName,
    startDate,
    endDate,
    stationId
  } = ctx.query;
  const dataFilter = ctx.state.dataFilter;
  const user = ctx.state.user;
  const roleCode = user?.baseRoleCode || user?.roleCode;

  const taskNameText = typeof taskName === 'string' ? taskName.trim() : '';
  const assigneeNameText = typeof assigneeName === 'string' ? assigneeName.trim() : '';
  const normalizedStatus = status === 'in_progress' ? 'processing' : status;
  const isUnfinished = normalizedStatus === 'unfinished';
  const stationIdValue = stationId !== undefined && stationId !== null && stationId !== ''
    ? Number(stationId)
    : null;

  const applyDatetimeRange = (where, field, rangeStart, rangeEnd) => {
    if (rangeStart && rangeEnd) {
      where[field] = { [Op.between]: [`${rangeStart} 00:00:00`, `${rangeEnd} 23:59:59`] };
      return;
    }
    if (rangeStart) {
      where[field] = { [Op.gte]: `${rangeStart} 00:00:00` };
      return;
    }
    if (rangeEnd) {
      where[field] = { [Op.lte]: `${rangeEnd} 23:59:59` };
    }
  };

  const applyDateRange = (where, field, rangeStart, rangeEnd) => {
    if (rangeStart && rangeEnd) {
      where[field] = { [Op.between]: [rangeStart, rangeEnd] };
      return;
    }
    if (rangeStart) {
      where[field] = { [Op.gte]: rangeStart };
      return;
    }
    if (rangeEnd) {
      where[field] = { [Op.lte]: rangeEnd };
    }
  };

  const restrictStation = (where) => {
    if (stationIdValue !== null && !Number.isNaN(stationIdValue)) {
      if (dataFilter.stationIds?.length > 0 && !dataFilter.stationIds.includes(stationIdValue)) {
        where.station_id = -1;
        return;
      }
      where.station_id = stationIdValue;
      return;
    }
    if (!dataFilter.all && dataFilter.stationIds?.length > 0 && roleCode === 'station_manager') {
      where.station_id = { [Op.in]: dataFilter.stationIds };
    }
  };

  const temporaryWhere = {};

  if (executorId) {
    temporaryWhere.executor_id = executorId;
  }

  if (normalizedStatus) {
    if (isUnfinished) {
      temporaryWhere.status = { [Op.in]: ['pending', 'rejected'] };
    } else if (normalizedStatus === 'history') {
      temporaryWhere.status = { [Op.in]: ['processing', 'completed', 'rejected'] };
    } else {
      temporaryWhere.status = normalizedStatus;
    }
  }

  if (taskType) {
    temporaryWhere.task_type = taskType;
  }

  if (taskNameText) {
    temporaryWhere.task_name = { [Op.like]: `%${taskNameText}%` };
  }

  if (stationIdValue !== null && !Number.isNaN(stationIdValue)) {
    temporaryWhere.station_id = stationIdValue;
  }

  applyDatetimeRange(temporaryWhere, 'plan_end_time', startDate, endDate);

  // Data permission filter
  if (!dataFilter.all && dataFilter.userId && !['department_manager', 'deputy_manager'].includes(roleCode)) {
    temporaryWhere[Op.or] = [
      { executor_id: dataFilter.userId },
      { assigner_id: dataFilter.userId }
    ];
  }

  restrictStation(temporaryWhere);

  const executorInclude = {
    model: User,
    as: 'executor',
    attributes: ['id', 'real_name']
  };
  if (assigneeNameText) {
    executorInclude.where = { real_name: { [Op.like]: `%${assigneeNameText}%` } };
    executorInclude.required = true;
  }
  if (['department_manager', 'deputy_manager'].includes(roleCode)) {
    executorInclude.required = true;
    executorInclude.include = [{
      model: Role,
      as: 'role',
      attributes: ['id', 'role_code', 'base_role_code'],
      required: true,
      where: {
        [Op.or]: [
          { role_code: { [Op.in]: ['operator', 'station_manager'] } },
          { base_role_code: { [Op.in]: ['operator', 'station_manager'] } }
        ]
      }
    }];
  }

  const orderBy = Array.isArray(order) && order.length > 0 ? order[0] : ['created_at', 'DESC'];
  const sortBy = orderBy[0];
  const sortOrder = orderBy[1];
  const normalizedSortOrder = String(sortOrder ?? 'DESC').toUpperCase();
  const direction = normalizedSortOrder === 'ASC' ? 1 : -1;
  const fetchLimit = offset + limit;
  const limitedFetch = fetchLimit > 0 ? fetchLimit : limit;
  const resolvedTemporarySort = TemporaryTask.rawAttributes && TemporaryTask.rawAttributes[sortBy]
    ? sortBy
    : 'created_at';
  const temporaryOrder = [[resolvedTemporarySort, normalizedSortOrder]];

  let dispatchOrder = [['assigned_time', normalizedSortOrder], ['created_at', normalizedSortOrder]];
  if (sortBy === 'plan_end_time' || sortBy === 'work_date') {
    dispatchOrder = [['work_date', normalizedSortOrder], ['created_at', normalizedSortOrder]];
  } else if (sortBy === 'submit_time') {
    dispatchOrder = [['submit_time', normalizedSortOrder], ['created_at', normalizedSortOrder]];
  } else if (sortBy === 'approve_time') {
    dispatchOrder = [['approve_time', normalizedSortOrder], ['created_at', normalizedSortOrder]];
  } else if (sortBy === 'assigned_time') {
    dispatchOrder = [['assigned_time', normalizedSortOrder], ['created_at', normalizedSortOrder]];
  } else if (sortBy && sortBy !== 'created_at' && PositionWorkLog.rawAttributes && PositionWorkLog.rawAttributes[sortBy]) {
    dispatchOrder = [[sortBy, normalizedSortOrder], ['created_at', normalizedSortOrder]];
  }

  const temporaryResult = await TemporaryTask.findAndCountAll({
    where: temporaryWhere,
    include: [
      { model: User, as: 'assigner', attributes: ['id', 'real_name'] },
      executorInclude
    ],
    order: temporaryOrder,
    limit: limitedFetch,
    offset: 0,
    distinct: true
  });
  const temporaryRows = temporaryResult.rows;
  const temporaryCountValue = Number(temporaryResult.count);
  const temporaryTotal = Number.isFinite(temporaryCountValue) ? temporaryCountValue : 0;

  const dispatchRows = [];
  const dispatchWhere = { task_source: 'dispatch' };

  if (executorId) {
    dispatchWhere.user_id = executorId;
  }

  if (taskNameText) {
    dispatchWhere.work_name = { [Op.like]: `%${taskNameText}%` };
  }

  if (assigneeNameText) {
    dispatchWhere.user_name = { [Op.like]: `%${assigneeNameText}%` };
  }

  if (stationIdValue !== null && !Number.isNaN(stationIdValue)) {
    dispatchWhere.station_id = stationIdValue;
  }

  applyDateRange(dispatchWhere, 'work_date', startDate, endDate);

  if (isUnfinished) {
    dispatchWhere[Op.or] = [
      { submit_time: { [Op.is]: null } },
      { review_status: 'rejected' }
    ];
  }

  if (normalizedStatus === 'pending') {
    dispatchWhere.submit_time = { [Op.is]: null };
  }

  if (normalizedStatus === 'processing') {
    dispatchWhere.submit_time = { [Op.not]: null };
    dispatchWhere.review_status = 'pending';
  }

  if (normalizedStatus === 'completed') {
    dispatchWhere.review_status = { [Op.in]: ['approved', 'auto_approved'] };
  }

  if (normalizedStatus === 'rejected') {
    dispatchWhere.review_status = 'rejected';
  }

  if (normalizedStatus === 'history') {
    dispatchWhere.submit_time = { [Op.not]: null };
  }

  if (!dataFilter.all) {
    if (dataFilter.userId && !['department_manager', 'deputy_manager'].includes(roleCode)) {
      dispatchWhere.user_id = dataFilter.userId;
    }
    if (dataFilter.stationIds?.length > 0 && roleCode === 'station_manager' && !dispatchWhere.station_id) {
      dispatchWhere.station_id = { [Op.in]: dataFilter.stationIds };
    }
    if (dataFilter.stationIds?.length > 0 && dispatchWhere.station_id) {
      const normalizedStation = Number(dispatchWhere.station_id);
      if (!Number.isNaN(normalizedStation) && !dataFilter.stationIds.includes(normalizedStation)) {
        dispatchWhere.station_id = -1;
      }
    }
  }

  const dispatchCountValue = await PositionWorkLog.count({
    where: dispatchWhere
  });
  const dispatchCountNumber = Number(dispatchCountValue);
  const dispatchTotal = Number.isFinite(dispatchCountNumber) ? dispatchCountNumber : 0;

  const logs = await PositionWorkLog.findAll({
    where: dispatchWhere,
    order: dispatchOrder,
    limit: limitedFetch,
    offset: 0
  });

  logs.forEach((log) => {
    const descriptionParts = [];
    if (log.station_name) descriptionParts.push(log.station_name);
    if (log.position_name) descriptionParts.push(log.position_name);
    if (log.task_category) descriptionParts.push(log.task_category);

    const unitPoints = log.unit_points ?? 0;
    const quantityValue = log.quantity ?? 1;
    const totalPoints = Number(unitPoints) * Number(quantityValue);
    const statusValue = mapDispatchTaskStatus(log);
    const assignedTime = log.assigned_time ?? log.created_at ?? null;

    dispatchRows.push({
      id: log.id,
      task_name: log.work_name,
      task_description: descriptionParts.join(' / '),
      task_type: 'position_dispatch',
      assigner_id: log.assigned_by_id,
      assigner_name: log.assigned_by_name,
      executor_id: log.user_id,
      executor_name: log.user_name,
      station_id: log.station_id,
      station_name: log.station_name,
      position_name: log.position_name,
      position_job_id: log.position_job_id,
      work_date: log.work_date,
      work_name: log.work_name,
      plan_end_time: log.work_date,
      standard_hours: log.standard_hours ?? 0,
      points: totalPoints,
      actual_hours: log.actual_hours ?? 0,
      completion_note: log.remark ?? '',
      progress: log.progress ?? 0,
      quantity: log.quantity ?? 1,
      quantity_editable: log.quantity_editable ?? 0,
      unit_points: log.unit_points ?? 0,
      task_category: log.task_category ?? '',
      score_method: log.score_method ?? '',
      status: statusValue,
      created_at: assignedTime,
      updated_at: log.updated_at,
      source: 'position_dispatch',
      task_source: 'dispatch',
      submit_time: log.submit_time ?? null,
      review_status: log.review_status ?? null,
      approver_id: log.approver_id ?? null,
      approver_name: log.approver_name ?? null,
      approve_time: log.approve_time ?? null,
      deduction_reason: log.deduction_reason ?? null,
      deduction_points: log.deduction_points ?? null,
      executor: log.user_id ? { id: log.user_id, real_name: log.user_name } : null,
      assigner: log.assigned_by_id ? { id: log.assigned_by_id, real_name: log.assigned_by_name } : null
    });
  });
  const temporaryList = temporaryRows.map(row => ({
    ...row.get({ plain: true }),
    source: 'temporary'
  }));

  const combinedRows = [...temporaryList, ...dispatchRows];
  const resolveSortValue = (item) => {
    const value = item?.[sortBy] ?? item?.created_at ?? item?.plan_end_time ?? item?.work_date ?? 0;
    if (value instanceof Date) {
      return value.getTime();
    }
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Date.parse(value);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
      return value;
    }
    return value ?? 0;
  };

  combinedRows.sort((a, b) => {
    const aValue = resolveSortValue(a);
    const bValue = resolveSortValue(b);
    if (typeof aValue === 'string' || typeof bValue === 'string') {
      return String(aValue).localeCompare(String(bValue)) * direction;
    }
    return (aValue - bValue) * direction;
  });

  const total = temporaryTotal + dispatchTotal;
  const pagedRows = combinedRows.slice(offset, offset + limit);

  ctx.body = {
    code: 200,
    message: 'success',
    data: formatPaginationResponse({ rows: pagedRows, count: total }, page, pageSize)
  };
};

/**
 * 派发临时任务
 * POST /api/temporary-tasks
 */
export const createTemporaryTask = async (ctx) => {
  const {
    taskName,
    taskDescription,
    taskType,
    executorId,
    executorName,
    stationId,
    planStartTime,
    planEndTime,
    standardHours,
    unitPoints,
    unitPointsEditable,
    quantity,
    points
  } = await validateBody(ctx, createTemporaryTaskBodySchema);
  const user = ctx.state.user;

  if (!taskName || !executorId) {
    throw createError(400, '\u4efb\u52a1\u540d\u79f0\u548c\u6267\u884c\u4eba\u4e0d\u80fd\u4e3a\u7a7a');
  }

  const resolvedQuantity = normalizeQuantityValue(quantity, 1);
  if (resolvedQuantity === null) {
    throw createError(400, '\u6570\u91cf\u5fc5\u987b\u4e3a\u6574\u6570');
  }
  validateQuantityValue(resolvedQuantity);

  const resolvedUnitPoints = normalizeUnitPointsValue(unitPoints, points ?? 0);
  if (resolvedUnitPoints === null) {
    throw createError(400, '\u5355\u4f4d\u79ef\u5206\u5fc5\u987b\u4e3a\u6574\u6570');
  }
  validateUnitPointsValue(resolvedUnitPoints);

  const totalPoints = resolvedUnitPoints * resolvedQuantity;

  const task = await TemporaryTask.create({
    task_code: generateRecordCode('TMP'),
    task_name: taskName,
    task_description: taskDescription,
    task_type: taskType || 'temporary',
    assigner_id: user.id,
    assigner_name: user.realName,
    executor_id: executorId,
    executor_name: executorName,
    station_id: stationId,
    plan_start_time: planStartTime,
    plan_end_time: planEndTime,
    standard_hours: standardHours,
    unit_points: resolvedUnitPoints,
    quantity: resolvedQuantity,
    unit_points_editable: unitPointsEditable !== undefined
      ? (Number(unitPointsEditable) === 1 ? 1 : 0)
      : 1,
    points: totalPoints,
    status: 'pending'
  });

  try {
    await publishNotification({
      notify_type: 'system',
      title: '\u4e34\u65f6\u4efb\u52a1\u63d0\u9192',
      content: [
        `\u4efb\u52a1\u540d\u79f0\uff1a${taskName}`,
        `\u6307\u6d3e\u4eba\uff1a${user.realName ?? user.username ?? ''}`
      ].join(String.fromCharCode(10)),
      receiver_id: executorId,
      receiver_name: executorName ?? '',
      related_id: task.id,
      related_type: 'temporary_task'
    });
  } catch (e) {
    // ignore notification failure
  }

  ctx.body = {
    code: 200,
    message: '\u4efb\u52a1\u6d3e\u53d1\u6210\u529f',
    data: { id: task.id, taskCode: task.task_code }
  };
};



/**
 * 更新临时任务状态
 * PUT /api/temporary-tasks/:id
 */
export const updateTemporaryTask = async (ctx) => {
  const { id } = await validateParams(ctx, idParamSchema);
  const { status, actualHours, completionNote } = await validateBody(ctx, updateTemporaryTaskBodySchema);

  const task = await TemporaryTask.findByPk(id);
  if (!task) {
    throw createError(404, '任务不存在');
  }

  const normalizedStatus = status === 'in_progress' ? 'processing' : status;
  await task.update({
    status: normalizedStatus,
    actual_hours: actualHours,
    completion_note: completionNote
  });

  ctx.body = {
    code: 200,
    message: '任务更新成功',
    data: null
  };
};

/**
 * 提交临时任务
 * PUT /api/temporary-tasks/:id/submit
 */
export const submitTemporaryTask = async (ctx) => {
  const { id } = await validateParams(ctx, idParamSchema);
  const { actualHours, completionNote, isCompleted, unitPoints, quantity } = await validateBody(ctx, submitTemporaryTaskBodySchema);
  const user = ctx.state.user;

  const task = await TemporaryTask.findByPk(id);
  if (!task) {
    throw createError(404, '\u4efb\u52a1\u4e0d\u5b58\u5728');
  }

  if (String(task.executor_id) !== String(user.id)) {
    throw createError(403, '\u4ec5\u6267\u884c\u4eba\u53ef\u63d0\u4ea4\u4efb\u52a1');
  }
  if (!['pending', 'rejected'].includes(task.status)) {
    throw createError(400, '\u5f53\u524d\u72b6\u6001\u4e0d\u53ef\u63d0\u4ea4');
  }

  const resolvedQuantity = normalizeQuantityValue(quantity, task.quantity ?? 1);
  if (resolvedQuantity === null) {
    throw createError(400, '\u6570\u91cf\u5fc5\u987b\u4e3a\u6574\u6570');
  }
  validateQuantityValue(resolvedQuantity);

  const unitPointsEditable = Number(task.unit_points_editable) === 1;
  const resolvedUnitPoints = unitPointsEditable
    ? normalizeUnitPointsValue(unitPoints, task.unit_points ?? task.points ?? 0)
    : (task.unit_points ?? task.points ?? 0);
  if (resolvedUnitPoints === null) {
    throw createError(400, '\u5355\u4f4d\u79ef\u5206\u5fc5\u987b\u4e3a\u6574\u6570');
  }
  validateUnitPointsValue(resolvedUnitPoints);

  await task.update({
    status: 'processing',
    actual_hours: actualHours ?? task.actual_hours ?? null,
    completion_note: completionNote ?? task.completion_note ?? '',
    is_completed: Number(isCompleted) === 1 ? 1 : 0,
    submit_time: new Date(),
    unit_points: resolvedUnitPoints,
    quantity: resolvedQuantity,
    points: resolvedUnitPoints * resolvedQuantity
  });

  ctx.body = {
    code: 200,
    message: '\u4efb\u52a1\u63d0\u4ea4\u6210\u529f',
    data: null
  };
};



/**
 * 审核临时任务
 * PUT /api/temporary-tasks/:id/review
 */
export const reviewTemporaryTask = async (ctx) => {
  const { id } = await validateParams(ctx, idParamSchema);
  const { status, deductionReason, deductionPoints } = await validateBody(ctx, reviewTemporaryTaskBodySchema);
  const user = ctx.state.user;

  const task = await TemporaryTask.findByPk(id);
  if (!task) {
    throw createError(404, '任务不存在');
  }
  if (task.status !== 'processing') {
    throw createError(400, '仅可审核待审核任务');
  }
  if (!['approved', 'rejected'].includes(status)) {
    throw createError(400, '审核状态不正确');
  }

  const resolvedDeductionReason = status === 'rejected' && typeof deductionReason === 'string'
    ? deductionReason.trim()
    : null;
  const deductionPointsValue = status === 'rejected' && deductionPoints !== undefined && deductionPoints !== null && deductionPoints !== ''
    ? Number(deductionPoints)
    : null;
  const resolvedDeductionPoints = Number.isNaN(deductionPointsValue) ? null : deductionPointsValue;

  await task.update({
    status: status === 'approved' ? 'completed' : 'rejected',
    approver_id: user.id,
    approver_name: user.realName ?? '',
    approve_time: new Date(),
    deduction_reason: resolvedDeductionReason,
    deduction_points: resolvedDeductionPoints
  });

  ctx.body = {
    code: 200,
    message: '审核完成',
    data: null
  };
};

/**
 * 删除临时任务
 * DELETE /api/temporary-tasks/:id
 */
export const deleteTemporaryTask = async (ctx) => {
  const { id } = await validateParams(ctx, idParamSchema);

  const task = await TemporaryTask.findByPk(id);
  if (!task) {
    throw createError(404, '任务不存在');
  }

  await task.destroy();

  ctx.body = {
    code: 200,
    message: '任务已删除',
    data: null
  };
};

export default {
  getTaskConfigs,
  createTaskConfig,
  updateTaskConfig,
  deleteTaskConfig,
  getPositionTasks,
  savePositionTasks,
  getDailyTasks,
  getMyDailyTasks,
  submitDailyTasks,
  getDailyTaskSummary,
  getTemporaryTasks,
  createTemporaryTask,
  updateTemporaryTask,
  submitTemporaryTask,
  reviewTemporaryTask,
  deleteTemporaryTask
};

