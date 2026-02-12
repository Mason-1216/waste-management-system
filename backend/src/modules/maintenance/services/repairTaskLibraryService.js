import { Op } from 'sequelize';
import ExcelJS from 'exceljs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { RepairTaskLibrary } from '../../../models/index.js';
import { createError } from '../../../middlewares/error.js';
import { formatPaginationResponse, getOrderBy, getPagination } from '../../../utils/helpers.js';
import { normalizeTaskCategory } from '../../../utils/taskCategory.js';
import { validateBody, validateParams, validateQuery } from '../../core/validators/validate.js';
import {
  batchDeleteRepairTaskLibraryBodySchema,
  createRepairTaskLibraryBodySchema,
  getRepairTaskLibraryQuerySchema,
  idParamSchema,
  updateRepairTaskLibraryBodySchema
} from '../validators/repairTaskLibrarySchemas.js';

const hasValue = (value) => value !== undefined && value !== null && value !== '';
const resolveText = (value) => (typeof value === 'string' ? value.trim() : '');
const parseInteger = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed)) return null;
  return parsed;
};
const ensureQuantity = (value) => {
  const parsed = parseInteger(value);
  if (parsed === null) return null;
  if (parsed < 1 || parsed > 1000) return null;
  return parsed;
};

export const getRepairTaskLibrary = async (ctx) => {
  await validateQuery(ctx, getRepairTaskLibraryQuerySchema);
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const order = getOrderBy(ctx.query);
  const {
    taskName,
    taskCategory,
    scoreMethod,
    quantityEditable,
    pointsEditable,
    keyword,
    isActive
  } = ctx.query;

  const where = {};

  const taskNameText = resolveText(taskName);
  if (taskNameText) {
    where.task_name = { [Op.like]: `%${taskNameText}%` };
  }

  const taskCategoryText = resolveText(taskCategory);
  if (taskCategoryText) {
    where.task_category = { [Op.like]: `%${taskCategoryText}%` };
  }

  const scoreMethodText = resolveText(scoreMethod);
  if (scoreMethodText) {
    where.score_method = scoreMethodText;
  }

  if (hasValue(pointsEditable)) {
    const normalized = Number(pointsEditable);
    if (normalized === 0 || normalized === 1) {
      where.points_editable = normalized;
    }
  }

  if (hasValue(quantityEditable)) {
    const normalized = Number(quantityEditable);
    if (normalized === 0 || normalized === 1) {
      where.quantity_editable = normalized;
    }
  }

  if (isActive !== undefined) {
    where.is_active = isActive;
  } else {
    where.is_active = 1;
  }

  if (keyword) {
    where[Op.or] = [
      { task_name: { [Op.like]: `%${keyword}%` } },
      { task_category: { [Op.like]: `%${keyword}%` } },
      { score_method: { [Op.like]: `%${keyword}%` } },
      { points_rule: { [Op.like]: `%${keyword}%` } }
    ];
    const numericKeyword = Number(keyword);
    if (!Number.isNaN(numericKeyword)) {
      where[Op.or].push({ points: numericKeyword });
      where[Op.or].push({ quantity: numericKeyword });
    }
  }

  const result = await RepairTaskLibrary.findAndCountAll({
    where,
    offset,
    limit,
    order: order.length ? order : [['created_at', 'DESC']]
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: formatPaginationResponse(result, page, pageSize)
  };
};

export const createRepairTaskLibrary = async (ctx) => {
  const {
    taskName,
    taskCategory,
    scoreMethod,
    quantity,
    points,
    pointsRule,
    quantityEditable,
    pointsEditable
  } = await validateBody(ctx, createRepairTaskLibraryBodySchema);

  if (!taskName || !resolveText(taskName)) {
    throw createError(400, '任务名称不能为空');
  }

  if (points === undefined || points === null || points === '') {
    throw createError(400, '单位积分不能为空');
  }

  const normalizedPoints = Number(points);
  if (Number.isNaN(normalizedPoints)) {
    throw createError(400, '单位积分必须为数字');
  }

  const quantityValue = quantity === undefined ? 1 : ensureQuantity(quantity);
  if (quantityValue === null) {
    throw createError(400, '数量必须是 1-1000 的整数');
  }

  const taskNameValue = resolveText(taskName);
  const taskCategoryValue = normalizeTaskCategory(taskCategory);

  const existing = await RepairTaskLibrary.findOne({
    where: {
      task_name: taskNameValue,
      task_category: taskCategoryValue
    }
  });

  if (existing) {
    throw createError(400, '任务名称已存在');
  }

  const record = await RepairTaskLibrary.create({
    task_name: taskNameValue,
    task_category: taskCategoryValue,
    score_method: scoreMethod ?? null,
    points: normalizedPoints,
    quantity: quantityValue,
    points_rule: pointsRule ?? null,
    quantity_editable: Number(quantityEditable) === 1 ? 1 : 0,
    points_editable: Number(pointsEditable) === 1 ? 1 : 0,
    is_active: 1
  });

  ctx.body = {
    code: 200,
    message: '新增成功',
    data: { id: record.id }
  };
};

export const updateRepairTaskLibrary = async (ctx) => {
  const { id } = await validateParams(ctx, idParamSchema);
  const {
    taskName,
    taskCategory,
    scoreMethod,
    quantity,
    points,
    pointsRule,
    quantityEditable,
    pointsEditable,
    isActive
  } = await validateBody(ctx, updateRepairTaskLibraryBodySchema);

  const record = await RepairTaskLibrary.findByPk(id);
  if (!record) {
    throw createError(404, '任务不存在');
  }

  const taskNameValue = taskName !== undefined ? resolveText(taskName) : undefined;
  const taskCategoryValue = taskCategory !== undefined ? normalizeTaskCategory(taskCategory) : undefined;

  if (taskNameValue) {
    const existing = await RepairTaskLibrary.findOne({
      where: {
        id: { [Op.ne]: id },
        task_name: taskNameValue,
        task_category: taskCategoryValue !== undefined ? taskCategoryValue : record.task_category
      }
    });
    if (existing) {
      throw createError(400, '任务名称已存在');
    }
  }

  const updateData = {
    task_name: taskNameValue !== undefined ? taskNameValue : record.task_name,
    task_category: taskCategoryValue !== undefined ? taskCategoryValue : record.task_category
  };

  if (scoreMethod !== undefined) {
    updateData.score_method = scoreMethod ?? null;
  }

  if (points !== undefined) {
    if (points === null || points === '') {
      throw createError(400, '单位积分不能为空');
    }
    const normalizedPoints = Number(points);
    if (Number.isNaN(normalizedPoints)) {
      throw createError(400, '单位积分必须为数字');
    }
    updateData.points = normalizedPoints;
  }

  if (quantity !== undefined) {
    const quantityValue = ensureQuantity(quantity);
    if (quantityValue === null) {
      throw createError(400, '数量必须是 1-1000 的整数');
    }
    updateData.quantity = quantityValue;
  }

  if (pointsRule !== undefined) {
    updateData.points_rule = pointsRule ?? null;
  }

  if (quantityEditable !== undefined) {
    updateData.quantity_editable = Number(quantityEditable) === 1 ? 1 : 0;
  }

  if (pointsEditable !== undefined) {
    updateData.points_editable = Number(pointsEditable) === 1 ? 1 : 0;
  }

  if (isActive !== undefined) {
    updateData.is_active = isActive;
  }

  await record.update(updateData);

  ctx.body = {
    code: 200,
    message: '更新成功'
  };
};

export const deleteRepairTaskLibrary = async (ctx) => {
  const { id } = await validateParams(ctx, idParamSchema);
  const record = await RepairTaskLibrary.findByPk(id);
  if (!record) {
    throw createError(404, '任务不存在');
  }
  await record.destroy();
  ctx.body = {
    code: 200,
    message: '删除成功'
  };
};

export const batchDeleteRepairTaskLibrary = async (ctx) => {
  const { ids } = await validateBody(ctx, batchDeleteRepairTaskLibraryBodySchema);
  if (!Array.isArray(ids) || ids.length === 0) {
    throw createError(400, '请选择要删除的任务');
  }

  const normalizedIds = ids
    .map(id => Number(id))
    .filter(id => Number.isInteger(id) && id > 0);

  const uniqueIds = Array.from(new Set(normalizedIds));
  if (uniqueIds.length === 0) {
    throw createError(400, '请选择要删除的任务');
  }

  const tasks = await RepairTaskLibrary.findAll({
    where: { id: { [Op.in]: uniqueIds } }
  });

  if (tasks.length === 0) {
    throw createError(404, '未找到要删除的任务');
  }

  await RepairTaskLibrary.destroy({
    where: { id: { [Op.in]: uniqueIds } }
  });

  ctx.body = {
    code: 200,
    message: `成功删除${tasks.length}条任务`,
    data: null
  };
};

export const importRepairTaskLibrary = async (ctx) => {
  const file = ctx.file;
  if (!file) {
    throw createError(400, '请上传文件');
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file.buffer);
  const worksheet = workbook.worksheets[0];
  const results = [];

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

  const parseNumber = (value) => {
    const normalized = normalizeCellValue(value);
    if (normalized === undefined || normalized === null || normalized === '') return null;
    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const parseBoolean = (value) => {
    const normalized = normalizeCellValue(value);
    if (normalized === undefined || normalized === null || normalized === '') return null;
    const text = String(normalized).trim();
    if (text === '是') return 1;
    if (text === '否') return 0;
    return null;
  };

  for (let i = 2; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i);
    if (!row.hasValues) continue;

    const taskName = row.getCell(1).value?.toString().trim();
    const taskCategory = normalizeTaskCategory(row.getCell(2).value?.toString().trim());
    const scoreMethod = row.getCell(3).value?.toString().trim();
    const points = parseNumber(row.getCell(4).value);
    const quantityCell = normalizeCellValue(row.getCell(5).value);
    const pointsRule = row.getCell(6).value?.toString().trim();
    const quantityEditable = parseBoolean(row.getCell(7).value);
    const pointsEditable = parseBoolean(row.getCell(8).value);

    if (!taskName) {
      results.push({
        row: i,
        taskName,
        status: 'error',
        message: '任务名称不能为空'
      });
      continue;
    }

    if (points === null || points === undefined) {
      results.push({
        row: i,
        taskName,
        status: 'error',
        message: '单位积分不能为空'
      });
      continue;
    }

    const hasQuantityValue = quantityCell !== undefined && quantityCell !== null && String(quantityCell).trim() !== '';
    const quantityValue = hasQuantityValue ? ensureQuantity(quantityCell) : 1;
    if (quantityValue === null) {
      results.push({
        row: i,
        taskName,
        status: 'error',
        message: '数量必须是 1-1000 的整数'
      });
      continue;
    }

    const existing = await RepairTaskLibrary.findOne({
      where: {
        task_name: taskName,
        task_category: taskCategory
      }
    });

    if (!existing) {
      await RepairTaskLibrary.create({
        task_name: taskName,
        task_category: taskCategory,
        score_method: scoreMethod ?? null,
        points,
        quantity: quantityValue,
        points_rule: pointsRule ?? null,
        quantity_editable: quantityEditable === 1 ? 1 : 0,
        points_editable: pointsEditable === 1 ? 1 : 0,
        is_active: 1
      });

      results.push({
        row: i,
        taskName,
        status: 'success'
      });
    } else {
      const { patch } = buildRepairTaskLibraryUpdatePatchWithDiff({
        existing,
        payload: {
          score_method: scoreMethod,
          points,
          quantity: quantityValue,
          points_rule: pointsRule,
          quantity_editable: quantityEditable,
          points_editable: pointsEditable
        }
      });

      if (Object.keys(patch).length === 0) {
        results.push({
          row: i,
          taskName,
          status: 'skip',
          message: '无变更，已跳过'
        });
        continue;
      }

      await existing.update(patch);

      results.push({
        row: i,
        taskName,
        status: 'updated',
        message: '已更新'
      });
    }
  }

  const successCount = results.filter(r => r.status === 'success').length;
  const updatedCount = results.filter(r => r.status === 'updated').length;
  const skipCount = results.filter(r => r.status === 'skip').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  ctx.body = {
    code: 200,
    message: `导入完成：新增${successCount}条，更新${updatedCount}条，跳过${skipCount}条，失败${errorCount}条`,
    data: results
  };
};

export const previewImportRepairTaskLibrary = async (ctx) => {
  const file = ctx.file;
  if (!file) {
    throw createError(400, '请上传文件');
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file.buffer);
  const worksheet = workbook.worksheets[0];
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

  const parseNumber = (value) => {
    const normalized = normalizeCellValue(value);
    if (normalized === undefined || normalized === null || normalized === '') return null;
    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const parseBoolean = (value) => {
    const normalized = normalizeCellValue(value);
    if (normalized === undefined || normalized === null || normalized === '') return null;
    const text = String(normalized).trim();
    if (text === '是') return 1;
    if (text === '否') return 0;
    return null;
  };

  const parseText = (value) => {
    const normalized = normalizeCellValue(value);
    if (normalized === undefined || normalized === null) return '';
    return String(normalized).trim();
  };

  const parseOptionalText = (value) => {
    const text = parseText(value);
    return text ? text : null;
  };

  const summary = { total: 0, create: 0, update: 0, skip: 0, error: 0 };
  const rows = [];

  for (let i = 2; i <= worksheet.rowCount; i += 1) {
    const row = worksheet.getRow(i);
    if (!row.hasValues) continue;

    summary.total += 1;

    const taskName = parseText(row.getCell(1).value);
    const taskCategory = normalizeTaskCategory(parseText(row.getCell(2).value));
    const scoreMethod = parseOptionalText(row.getCell(3).value);
    const points = parseNumber(row.getCell(4).value);
    const quantityCell = normalizeCellValue(row.getCell(5).value);
    const pointsRule = parseOptionalText(row.getCell(6).value);
    const quantityEditable = parseBoolean(row.getCell(7).value);
    const pointsEditable = parseBoolean(row.getCell(8).value);

    const previewRow = {
      rowNum: i,
      action: 'error',
      message: '',
      diff: {},
      taskName,
      taskCategory: taskCategory ?? '',
      scoreMethod: scoreMethod ?? '',
      points,
      quantity: quantityCell ?? '',
      pointsRule: pointsRule ?? '',
      quantityEditable,
      pointsEditable
    };

    if (!taskName) {
      previewRow.message = '任务名称不能为空';
      summary.error += 1;
      rows.push(previewRow);
      continue;
    }

    if (points === null || points === undefined) {
      previewRow.message = '单位积分不能为空';
      summary.error += 1;
      rows.push(previewRow);
      continue;
    }

    const hasQuantityValue = quantityCell !== undefined && quantityCell !== null && String(quantityCell).trim() !== '';
    const quantityValue = hasQuantityValue ? ensureQuantity(quantityCell) : 1;
    if (quantityValue === null) {
      previewRow.message = '数量必须是 1-1000 的整数';
      summary.error += 1;
      rows.push(previewRow);
      continue;
    }
    previewRow.quantity = quantityValue;

    const existing = await RepairTaskLibrary.findOne({
      where: {
        task_name: taskName,
        task_category: taskCategory
      }
    });

    if (!existing) {
      previewRow.action = 'create';
      previewRow.message = '将新增';
      summary.create += 1;
      rows.push(previewRow);
      continue;
    }

    const { patch, diff } = buildRepairTaskLibraryUpdatePatchWithDiff({
      existing,
      payload: {
        score_method: scoreMethod,
        points,
        quantity: quantityValue,
        points_rule: pointsRule,
        quantity_editable: quantityEditable,
        points_editable: pointsEditable
      }
    });

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

const buildRepairTaskLibraryUpdatePatchWithDiff = ({ existing, payload }) => {
  const patch = {};
  const diff = {};

  const setIfProvidedAndChanged = (key, nextValue) => {
    if (nextValue === undefined || nextValue === null || nextValue === '') return;
    if (existing[key] === nextValue) return;
    patch[key] = nextValue;
    diff[key] = { from: existing[key], to: nextValue };
  };

  setIfProvidedAndChanged('score_method', payload.score_method);
  if (payload.points !== undefined && payload.points !== null && existing.points !== payload.points) {
    patch.points = payload.points;
    diff.points = { from: existing.points, to: payload.points };
  }
  if (payload.quantity !== undefined && payload.quantity !== null && existing.quantity !== payload.quantity) {
    patch.quantity = payload.quantity;
    diff.quantity = { from: existing.quantity, to: payload.quantity };
  }
  setIfProvidedAndChanged('points_rule', payload.points_rule);

  if (payload.quantity_editable !== null && payload.quantity_editable !== undefined && existing.quantity_editable !== payload.quantity_editable) {
    patch.quantity_editable = payload.quantity_editable;
    diff.quantity_editable = { from: existing.quantity_editable, to: payload.quantity_editable };
  }
  if (payload.points_editable !== null && payload.points_editable !== undefined && existing.points_editable !== payload.points_editable) {
    patch.points_editable = payload.points_editable;
    diff.points_editable = { from: existing.points_editable, to: payload.points_editable };
  }

  return { patch, diff };
};

export const getRepairTaskLibraryTemplate = async (ctx) => {
  try {
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const templatePath = path.resolve(
      currentDir,
      '../templates/repair_task_library_import_template.xlsx'
    );
    const buffer = await fs.readFile(templatePath);
    ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    ctx.set('Content-Disposition', `attachment; filename="template.xlsx"; filename*=UTF-8''${encodeURIComponent('维修任务模板.xlsx')}`);
    ctx.body = buffer;
  } catch (error) {
    throw createError(500, '模板生成失败');
  }
};

export default {
  getRepairTaskLibrary,
  createRepairTaskLibrary,
  updateRepairTaskLibrary,
  deleteRepairTaskLibrary,
  batchDeleteRepairTaskLibrary,
  importRepairTaskLibrary,
  getRepairTaskLibraryTemplate
};

