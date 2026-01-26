import { Op } from 'sequelize';
import { TaskConfig, PositionTask, DailyTask, TemporaryTask, User, Role, Notification } from '../../../models/index.js';
import { createError } from '../../../middlewares/error.js';
import { getPagination, formatPaginationResponse, getOrderBy, generateRecordCode } from '../../../utils/helpers.js';

// ============================================
// 任务配置管理
// ============================================

/**
 * 查询任务配置列表
 * GET /api/task-configs
 */
export const getTaskConfigs = async (ctx) => {
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
  const { taskName, standardHours } = ctx.request.body;

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
  const { id } = ctx.params;
  const { taskName, standardHours, status } = ctx.request.body;

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
  const { id } = ctx.params;

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
  const { positionName, tasks } = ctx.request.body;

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
  const { stationId, workDate, tasks } = ctx.request.body;
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
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const order = getOrderBy(ctx.query);
  const { executorId, status, taskType } = ctx.query;
  const dataFilter = ctx.state.dataFilter;
  const user = ctx.state.user;
  const roleCode = user?.baseRoleCode || user?.roleCode;

  const where = {};

  if (executorId) {
    where.executor_id = executorId;
  }

  if (status) {
    where.status = status;
  }

  if (taskType) {
    where.task_type = taskType;
  }

  // 数据权限过滤
  if (!dataFilter.all && dataFilter.userId && !['department_manager', 'deputy_manager'].includes(roleCode)) {
    where[Op.or] = [
      { executor_id: dataFilter.userId },
      { assigner_id: dataFilter.userId }
    ];
  }

  const executorInclude = {
    model: User,
    as: 'executor',
    attributes: ['id', 'real_name']
  };
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

  const result = await TemporaryTask.findAndCountAll({
    where,
    include: [
      { model: User, as: 'assigner', attributes: ['id', 'real_name'] },
      executorInclude
    ],
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
 * 派发临时任务
 * POST /api/temporary-tasks
 */
export const createTemporaryTask = async (ctx) => {
  const { taskName, taskDescription, taskType, executorId, executorName, stationId, planStartTime, planEndTime, standardHours, points } = ctx.request.body;
  const user = ctx.state.user;

  if (!taskName || !executorId) {
    throw createError(400, '任务名称和执行人不能为空');
  }

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
    points: points || 0,
    status: 'pending'
  });

  try {
    await Notification.create({
      notify_type: 'system',
      title: '临时任务提醒',
      content: [
        `任务名称：${taskName}`,
        `指派人：${user.realName || user.username || ''}`
      ].join('\n'),
      receiver_id: executorId,
      receiver_name: executorName || '',
      related_id: task.id,
      related_type: 'temporary_task'
    });
  } catch (e) {
    // ignore notification failure
  }

  ctx.body = {
    code: 200,
    message: '任务派发成功',
    data: { id: task.id, taskCode: task.task_code }
  };
};

/**
 * 更新临时任务状态
 * PUT /api/temporary-tasks/:id
 */
export const updateTemporaryTask = async (ctx) => {
  const { id } = ctx.params;
  const { status, actualHours, completionNote } = ctx.request.body;

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
 * 开始临时任务
 * PUT /api/temporary-tasks/:id/start
 */
export const startTemporaryTask = async (ctx) => {
  const { id } = ctx.params;

  const task = await TemporaryTask.findByPk(id);
  if (!task) {
    throw createError(404, '任务不存在');
  }

  await task.update({
    status: 'processing',
    actual_start_time: new Date()
  });

  ctx.body = {
    code: 200,
    message: '任务已开始',
    data: null
  };
};

/**
 * 完成临时任务
 * PUT /api/temporary-tasks/:id/complete
 */
export const completeTemporaryTask = async (ctx) => {
  const { id } = ctx.params;
  const { actualHours, completionNote } = ctx.request.body;

  const task = await TemporaryTask.findByPk(id);
  if (!task) {
    throw createError(404, '任务不存在');
  }

  await task.update({
    status: 'completed',
    actual_hours: actualHours,
    completion_note: completionNote,
    actual_end_time: new Date()
  });

  ctx.body = {
    code: 200,
    message: '任务已完成',
    data: null
  };
};

/**
 * 删除临时任务
 * DELETE /api/temporary-tasks/:id
 */
export const deleteTemporaryTask = async (ctx) => {
  const { id } = ctx.params;

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
  startTemporaryTask,
  completeTemporaryTask,
  deleteTemporaryTask
};
