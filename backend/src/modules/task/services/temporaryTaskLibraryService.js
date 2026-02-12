import { Op } from 'sequelize';
import { TemporaryTaskLibrary, Station, User } from '../../../models/index.js';
import { createError } from '../../../middlewares/error.js';
import { getPagination, formatPaginationResponse, getOrderBy } from '../../../utils/helpers.js';
import { normalizeTaskCategory } from '../../../utils/taskCategory.js';
import { validateBody, validateParams, validateQuery } from '../../core/validators/validate.js';
import {
  batchImportTemporaryTaskLibraryBodySchema,
  createTemporaryTaskLibraryBodySchema,
  getTemporaryTaskLibraryQuerySchema,
  idParamSchema,
  updateTemporaryTaskLibraryBodySchema
} from '../validators/temporaryTaskLibrarySchemas.js';

/**
 * 获取临时工作任务汇总表列表（共享，所有站长/部门经理/部门副经理可见）
 * GET /api/temporary-task-library
 */
export const getTemporaryTaskLibrary = async (ctx) => {
  await validateQuery(ctx, getTemporaryTaskLibraryQuerySchema);
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const order = getOrderBy(ctx.query);
  const {
    keyword,
    stationId,
    taskCategory,
    scoreMethod,
    quantityEditable,
    dispatchReviewRequired
  } = ctx.query;

  const where = {};

  // 只按关键字过滤，不按场站过滤（共享任务汇总表）
  if (keyword) {
    where.task_name = { [Op.like]: `%${keyword}%` };
  }
  if (taskCategory) {
    where.task_category = { [Op.like]: `%${taskCategory}%` };
  }
  if (scoreMethod) {
    where.score_method = scoreMethod;
  }
  if (quantityEditable !== undefined) {
    where.quantity_editable = Number(quantityEditable);
  }
  if (dispatchReviewRequired !== undefined) {
    where.dispatch_review_required = Number(dispatchReviewRequired);
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
 * 新建临时工作任务汇总表（共享任务汇总表，场站ID可选）
 * POST /api/temporary-task-library
 */
export const createTemporaryTaskLibrary = async (ctx) => {
  const {
    taskName,
    taskContent,
    taskCategory,
    scoreMethod,
    standardHours,
    unitPoints,
    quantity,
    pointsRule,
    unitPointsEditable,
    quantityEditable,
    dispatchReviewRequired,
    stationId
  } = await validateBody(ctx, createTemporaryTaskLibraryBodySchema);
  const user = ctx.state.user;

  if (!taskName || !taskContent) {
    throw createError(400, '工作名称和具体工作内容不能为空');
  }

  if (standardHours === undefined || standardHours === null) {
    throw createError(400, '工时不能为空');
  }

  if (unitPoints === undefined || unitPoints === null) {
    throw createError(400, '单位积分不能为空');
  }

  const normalizedQuantity = Number.parseInt(quantity ?? 1, 10);
  if (!Number.isInteger(normalizedQuantity) || normalizedQuantity < 1 || normalizedQuantity > 1000) {
    throw createError(400, '数量必须是 1-1000 的整数');
  }

  const record = await TemporaryTaskLibrary.create({
    task_name: taskName,
    task_content: taskContent,
    task_category: normalizeTaskCategory(taskCategory),
    score_method: scoreMethod ?? null,
    standard_hours: standardHours,
    unit_points: unitPoints,
    quantity: normalizedQuantity,
    points_rule: pointsRule ?? null,
    unit_points_editable: Number(unitPointsEditable) === 1 ? 1 : 0,
    quantity_editable: Number(quantityEditable) === 1 ? 1 : 0,
    dispatch_review_required: Number(dispatchReviewRequired) === 1 ? 1 : 0,
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
 * 更新临时工作任务汇总表
 * PUT /api/temporary-task-library/:id
 */
export const updateTemporaryTaskLibrary = async (ctx) => {
  const { id } = await validateParams(ctx, idParamSchema);
  const {
    taskName,
    taskContent,
    taskCategory,
    scoreMethod,
    standardHours,
    unitPoints,
    quantity,
    pointsRule,
    unitPointsEditable,
    quantityEditable,
    dispatchReviewRequired,
    stationId
  } = await validateBody(ctx, updateTemporaryTaskLibraryBodySchema);

  const record = await TemporaryTaskLibrary.findByPk(id);
  if (!record) {
    throw createError(404, '任务不存在');
  }

  const updateData = {
    task_name: taskName ?? record.task_name,
    task_content: taskContent ?? record.task_content,
    task_category: taskCategory !== undefined ? normalizeTaskCategory(taskCategory) : record.task_category,
    score_method: scoreMethod ?? record.score_method,
    standard_hours: standardHours ?? record.standard_hours,
    unit_points: unitPoints ?? record.unit_points,
    points_rule: pointsRule ?? record.points_rule,
    unit_points_editable: unitPointsEditable !== undefined
      ? (Number(unitPointsEditable) === 1 ? 1 : 0)
      : record.unit_points_editable,
    quantity_editable: quantityEditable !== undefined
      ? (Number(quantityEditable) === 1 ? 1 : 0)
      : record.quantity_editable,
    dispatch_review_required: dispatchReviewRequired !== undefined
      ? (Number(dispatchReviewRequired) === 1 ? 1 : 0)
      : record.dispatch_review_required,
    station_id: stationId !== undefined ? (stationId ? parseInt(stationId) : null) : record.station_id
  };

  if (quantity !== undefined) {
    const normalizedQuantity = Number.parseInt(quantity ?? 1, 10);
    if (!Number.isInteger(normalizedQuantity) || normalizedQuantity < 1 || normalizedQuantity > 1000) {
      throw createError(400, '数量必须是 1-1000 的整数');
    }
    updateData.quantity = normalizedQuantity;
  } else {
    updateData.quantity = record.quantity;
  }

  await record.update(updateData);

  ctx.body = {
    code: 200,
    message: '更新成功',
    data: null
  };
};

/**
 * 删除临时工作任务汇总表
 * DELETE /api/temporary-task-library/:id
 */
export const deleteTemporaryTaskLibrary = async (ctx) => {
  const { id } = await validateParams(ctx, idParamSchema);

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
 * 批量导入临时工作任务汇总表（共享任务汇总表，无需场站ID）
 * POST /api/temporary-task-library/batch-import
 */
export const batchImportTemporaryTaskLibrary = async (ctx) => {
  const { tasks } = await validateBody(ctx, batchImportTemporaryTaskLibraryBodySchema);
  const user = ctx.state.user;

  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    throw createError(400, '导入数据不能为空');
  }

  const results = {
    success: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: []
  };

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const rowNum = i + 2; // Excel第2行开始是数据

    try {
      if (!task.taskName || !task.taskName.trim()) {
        results.failed++;
        results.errors.push(`第${rowNum}行: 任务名称不能为空`);
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

      const unitPoints = Number.isFinite(Number(task.unitPoints)) ? Number.parseInt(task.unitPoints, 10) : 0;
      const normalizedQuantity = Number.parseInt(task.quantity ?? 1, 10);
      if (!Number.isInteger(normalizedQuantity) || normalizedQuantity < 1 || normalizedQuantity > 1000) {
        results.failed++;
        results.errors.push(`第${rowNum}行: 数量必须是 1-1000 的整数`);
        continue;
      }

      const taskName = task.taskName.trim();
      const taskContent = task.taskContent.trim();
      const taskCategory = normalizeTaskCategory(task.taskCategory);
      const stationId = task.stationId ? parseInt(task.stationId) : null;

      const existing = await TemporaryTaskLibrary.findOne({
        where: {
          station_id: stationId,
          task_name: taskName,
          task_category: taskCategory
        }
      });

      const nextPayload = {
        task_name: taskName,
        task_content: taskContent,
        task_category: taskCategory,
        score_method: task.scoreMethod ? String(task.scoreMethod).trim() : null,
        standard_hours: standardHours,
        unit_points: unitPoints,
        quantity: normalizedQuantity,
        points_rule: task.pointsRule ? String(task.pointsRule).trim() : null,
        unit_points_editable: Number(task.unitPointsEditable) === 1 ? 1 : 0,
        quantity_editable: Number(task.quantityEditable) === 1 ? 1 : 0,
        dispatch_review_required: Number(task.dispatchReviewRequired) === 1 ? 1 : 0,
        station_id: stationId
      };

      if (!existing) {
        await TemporaryTaskLibrary.create({
          ...nextPayload,
          created_by: user.id,
          created_by_name: user.realName
        });
        results.success++;
        continue;
      }

      const patch = buildTemporaryTaskUpsertPatch({ existing, payload: nextPayload });
      if (Object.keys(patch).length === 0) {
        results.skipped++;
        continue;
      }

      await existing.update(patch);
      results.updated++;
    } catch (err) {
      results.failed++;
      results.errors.push(`第${rowNum}行: ${err.message}`);
    }
  }

  ctx.body = {
    code: 200,
    message: `导入完成：新增${results.success}条，更新${results.updated}条，跳过${results.skipped}条，失败${results.failed}条`,
    data: results
  };
};

export const previewBatchImportTemporaryTaskLibrary = async (ctx) => {
  const { tasks } = await validateBody(ctx, batchImportTemporaryTaskLibraryBodySchema);

  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    throw createError(400, '导入数据不能为空');
  }

  const summary = { total: tasks.length, create: 0, update: 0, skip: 0, error: 0 };
  const rows = [];

  for (let i = 0; i < tasks.length; i += 1) {
    const task = tasks[i];
    const rowNum = i + 2;

    const taskName = typeof task.taskName === 'string' ? task.taskName.trim() : '';
    const taskContent = typeof task.taskContent === 'string' ? task.taskContent.trim() : '';
    const standardHours = parseFloat(task.standardHours);
    const unitPoints = Number.isFinite(Number(task.unitPoints)) ? Number.parseInt(task.unitPoints, 10) : 0;
    const normalizedQuantity = Number.parseInt(task.quantity ?? 1, 10);
    const stationId = task.stationId ? parseInt(task.stationId) : null;
    const taskCategory = normalizeTaskCategory(task.taskCategory);

    const previewRow = {
      rowNum,
      action: 'error',
      message: '',
      diff: {},
      stationId,
      taskName,
      taskContent,
      taskCategory: taskCategory ?? '',
      scoreMethod: task.scoreMethod ? String(task.scoreMethod).trim() : '',
      standardHours,
      unitPoints,
      quantity: normalizedQuantity,
      pointsRule: task.pointsRule ? String(task.pointsRule).trim() : '',
      unitPointsEditable: Number(task.unitPointsEditable) === 1 ? 1 : 0,
      quantityEditable: Number(task.quantityEditable) === 1 ? 1 : 0,
      dispatchReviewRequired: Number(task.dispatchReviewRequired) === 1 ? 1 : 0
    };

    if (!taskName) {
      previewRow.message = '任务名称不能为空';
      summary.error += 1;
      rows.push(previewRow);
      continue;
    }
    if (!taskContent) {
      previewRow.message = '具体工作内容不能为空';
      summary.error += 1;
      rows.push(previewRow);
      continue;
    }
    if (Number.isNaN(standardHours) || standardHours <= 0) {
      previewRow.message = '标准工时必须大于0';
      summary.error += 1;
      rows.push(previewRow);
      continue;
    }
    if (!Number.isInteger(normalizedQuantity) || normalizedQuantity < 1 || normalizedQuantity > 1000) {
      previewRow.message = '数量必须是 1-1000 的整数';
      summary.error += 1;
      rows.push(previewRow);
      continue;
    }

    const existing = await TemporaryTaskLibrary.findOne({
      where: {
        station_id: stationId,
        task_name: taskName,
        task_category: taskCategory
      }
    });

    const nextPayload = {
      task_name: taskName,
      task_content: taskContent,
      task_category: taskCategory,
      score_method: task.scoreMethod ? String(task.scoreMethod).trim() : null,
      standard_hours: standardHours,
      unit_points: unitPoints,
      quantity: normalizedQuantity,
      points_rule: task.pointsRule ? String(task.pointsRule).trim() : null,
      unit_points_editable: Number(task.unitPointsEditable) === 1 ? 1 : 0,
      quantity_editable: Number(task.quantityEditable) === 1 ? 1 : 0,
      dispatch_review_required: Number(task.dispatchReviewRequired) === 1 ? 1 : 0,
      station_id: stationId
    };

    if (!existing) {
      previewRow.action = 'create';
      previewRow.message = '将新增';
      summary.create += 1;
      rows.push(previewRow);
      continue;
    }

    const { patch, diff } = buildTemporaryTaskUpsertPatchWithDiff({ existing, payload: nextPayload });
    previewRow.diff = diff;

    if (Object.keys(patch).length === 0) {
      previewRow.action = 'skip';
      previewRow.message = '无变更，跳过';
      summary.skip += 1;
      rows.push(previewRow);
      continue;
    }

    previewRow.action = 'update';
    previewRow.message = '将更新';
    summary.update += 1;
    rows.push(previewRow);
  }

  ctx.body = {
    code: 200,
    message: 'success',
    data: { summary, rows }
  };
};

const buildTemporaryTaskUpsertPatch = ({ existing, payload }) => {
  const patch = {};

  const setIfProvidedAndChanged = (key, nextValue) => {
    if (nextValue === undefined || nextValue === null || nextValue === '') return;
    if (existing[key] === nextValue) return;
    patch[key] = nextValue;
  };

  setIfProvidedAndChanged('task_content', payload.task_content);
  setIfProvidedAndChanged('score_method', payload.score_method);
  if (payload.standard_hours !== undefined && payload.standard_hours !== null && existing.standard_hours !== payload.standard_hours) {
    patch.standard_hours = payload.standard_hours;
  }
  if (payload.unit_points !== undefined && payload.unit_points !== null && existing.unit_points !== payload.unit_points) {
    patch.unit_points = payload.unit_points;
  }
  if (payload.quantity !== undefined && payload.quantity !== null && existing.quantity !== payload.quantity) {
    patch.quantity = payload.quantity;
  }
  setIfProvidedAndChanged('points_rule', payload.points_rule);

  if (payload.unit_points_editable !== undefined && payload.unit_points_editable !== null && existing.unit_points_editable !== payload.unit_points_editable) {
    patch.unit_points_editable = payload.unit_points_editable;
  }
  if (payload.quantity_editable !== undefined && payload.quantity_editable !== null && existing.quantity_editable !== payload.quantity_editable) {
    patch.quantity_editable = payload.quantity_editable;
  }
  if (payload.dispatch_review_required !== undefined && payload.dispatch_review_required !== null && existing.dispatch_review_required !== payload.dispatch_review_required) {
    patch.dispatch_review_required = payload.dispatch_review_required;
  }

  return patch;
};

const buildTemporaryTaskUpsertPatchWithDiff = ({ existing, payload }) => {
  const patch = buildTemporaryTaskUpsertPatch({ existing, payload });
  const diff = {};
  Object.keys(patch).forEach((key) => {
    diff[key] = { from: existing[key], to: patch[key] };
  });
  return { patch, diff };
};

export default {
  getTemporaryTaskLibrary,
  createTemporaryTaskLibrary,
  updateTemporaryTaskLibrary,
  deleteTemporaryTaskLibrary,
  batchImportTemporaryTaskLibrary,
  previewBatchImportTemporaryTaskLibrary
};
