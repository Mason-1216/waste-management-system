import { Op } from 'sequelize';
import { TemporaryTaskLibrary, Station, User } from '../models/index.js';
import { createError } from '../middlewares/error.js';
import { getPagination, formatPaginationResponse, getOrderBy } from '../utils/helpers.js';

/**
 * 获取临时工作任务库列表（共享，所有站长/部门经理/部门副经理可见）
 * GET /api/temporary-task-library
 */
export const getTemporaryTaskLibrary = async (ctx) => {
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const order = getOrderBy(ctx.query);
  const { keyword, stationId } = ctx.query;

  const where = {};

  // 只按关键字过滤，不按场站过滤（共享任务库）
  if (keyword) {
    where.task_name = { [Op.like]: `%${keyword}%` };
  }
  if (stationId) {
    where.station_id = Number(stationId);
  }

  const result = await TemporaryTaskLibrary.findAndCountAll({
    where,
    include: [
      { model: Station, as: 'station', attributes: ['id', 'station_name'] },
      { model: User, as: 'creator', attributes: ['id', 'real_name'] }
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
 * 新建临时工作任务库（共享任务库，场站ID可选）
 * POST /api/temporary-task-library
 */
export const createTemporaryTaskLibrary = async (ctx) => {
  const { taskName, taskContent, standardHours, points, stationId } = ctx.request.body;
  const user = ctx.state.user;

  if (!taskName || !taskContent) {
    throw createError(400, '工作名称和具体工作内容不能为空');
  }

  if (standardHours === undefined || standardHours === null) {
    throw createError(400, '工时不能为空');
  }

  if (points === undefined || points === null) {
    throw createError(400, '积分不能为空');
  }

  const record = await TemporaryTaskLibrary.create({
    task_name: taskName,
    task_content: taskContent,
    standard_hours: standardHours,
    points,
    station_id: stationId ? parseInt(stationId) : null,
    created_by: user.id,
    created_by_name: user.realName
  });

  ctx.body = {
    code: 200,
    message: '创建成功',
    data: { id: record.id }
  };
};

/**
 * 更新临时工作任务库
 * PUT /api/temporary-task-library/:id
 */
export const updateTemporaryTaskLibrary = async (ctx) => {
  const { id } = ctx.params;
  const { taskName, taskContent, standardHours, points, stationId } = ctx.request.body;

  const record = await TemporaryTaskLibrary.findByPk(id);
  if (!record) {
    throw createError(404, '任务不存在');
  }

  await record.update({
    task_name: taskName ?? record.task_name,
    task_content: taskContent ?? record.task_content,
    standard_hours: standardHours ?? record.standard_hours,
    points: points ?? record.points,
    station_id: stationId ? parseInt(stationId) : record.station_id
  });

  ctx.body = {
    code: 200,
    message: '更新成功',
    data: null
  };
};

/**
 * 删除临时工作任务库
 * DELETE /api/temporary-task-library/:id
 */
export const deleteTemporaryTaskLibrary = async (ctx) => {
  const { id } = ctx.params;

  const record = await TemporaryTaskLibrary.findByPk(id);
  if (!record) {
    throw createError(404, '任务不存在');
  }

  await record.destroy();

  ctx.body = {
    code: 200,
    message: '删除成功',
    data: null
  };
};

/**
 * 批量导入临时工作任务库（共享任务库，无需场站ID）
 * POST /api/temporary-task-library/batch-import
 */
export const batchImportTemporaryTaskLibrary = async (ctx) => {
  const { tasks } = ctx.request.body;
  const user = ctx.state.user;

  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    throw createError(400, '导入数据不能为空');
  }

  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const rowNum = i + 2; // Excel第2行开始是数据

    try {
      if (!task.taskName || !task.taskName.trim()) {
        results.failed++;
        results.errors.push(`第${rowNum}行: 工作名称不能为空`);
        continue;
      }

      if (!task.taskContent || !task.taskContent.trim()) {
        results.failed++;
        results.errors.push(`第${rowNum}行: 具体工作内容不能为空`);
        continue;
      }

      const standardHours = parseFloat(task.standardHours);
      if (isNaN(standardHours) || standardHours <= 0) {
        results.failed++;
        results.errors.push(`第${rowNum}行: 标准工时必须大于0`);
        continue;
      }

      const points = parseInt(task.points) || 0;

      await TemporaryTaskLibrary.create({
        task_name: task.taskName.trim(),
        task_content: task.taskContent.trim(),
        standard_hours: standardHours,
        points,
        station_id: null,
        created_by: user.id,
        created_by_name: user.realName
      });

      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push(`第${rowNum}行: ${err.message}`);
    }
  }

  ctx.body = {
    code: 200,
    message: `导入完成: 成功${results.success}条, 失败${results.failed}条`,
    data: results
  };
};

export default {
  getTemporaryTaskLibrary,
  createTemporaryTaskLibrary,
  updateTemporaryTaskLibrary,
  deleteTemporaryTaskLibrary,
  batchImportTemporaryTaskLibrary
};
