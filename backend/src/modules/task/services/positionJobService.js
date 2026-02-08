import { PositionJob, Station, Schedule, sequelize } from '../../../models/index.js';
import { Op } from 'sequelize';
import { createError } from '../../../middlewares/error.js';
import { getPagination, formatPaginationResponse, getOrderBy } from '../../../utils/helpers.js';
import ExcelJS from 'exceljs';
import { addTemplateInstructionSheet, applyTemplateHeaderStyle } from '../../import_export/utils/excelTemplate.js';
import { validateBody, validateParams, validateQuery } from '../../core/validators/validate.js';
import {
  createPositionJobBodySchema,
  deletePositionJobQuerySchema,
  getPositionJobsByPositionQuerySchema,
  getPositionJobsQuerySchema,
  getPositionNamesQuerySchema,
  idParamSchema,
  updatePositionJobBodySchema
} from '../validators/positionJobSchemas.js';

/**
 * 查询岗位任务列表
 * GET /api/position-jobs
 */
export const getPositionJobs = async (ctx) => {
  await validateQuery(ctx, getPositionJobsQuerySchema);
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const order = ctx.query.sortBy
    ? getOrderBy(ctx.query)
    : [
      ['position_name', 'ASC'],
      ['sort_order', 'ASC'],
      ['created_at', 'ASC']
    ];
  const {
    positionName,
    stationId,
    jobName,
    taskCategory,
    scoreMethod,
    standardHours,
    points,
    quantity,
    pointsRule,
    quantityEditable,
    pointsEditable,
    dispatchReviewRequired,
    keyword,
    isActive
  } = ctx.query;
  const dataFilter = ctx.state.dataFilter;

  const where = {};
  const hasValue = (value) => value !== undefined && value !== null && value !== '';
  const resolveText = (value) => (typeof value === 'string' ? value.trim() : '');

  const positionNameText = resolveText(positionName);
  if (positionNameText) {
    where.position_name = { [Op.like]: `%${positionNameText}%` };
  }

  if (hasValue(stationId)) {
    const normalizedStationId = Number(stationId);
    if (!Number.isNaN(normalizedStationId)) {
      where.station_id = normalizedStationId;
    }
  }

  const jobNameText = resolveText(jobName);
  if (jobNameText) {
    where.job_name = { [Op.like]: `%${jobNameText}%` };
  }

  const taskCategoryText = resolveText(taskCategory);
  if (taskCategoryText) {
    where.task_category = { [Op.like]: `%${taskCategoryText}%` };
  }

  const scoreMethodText = resolveText(scoreMethod);
  if (scoreMethodText) {
    where.score_method = scoreMethodText;
  }

  const pointsRuleText = resolveText(pointsRule);
  if (pointsRuleText) {
    where.points_rule = { [Op.like]: `%${pointsRuleText}%` };
  }

  if (hasValue(standardHours)) {
    const normalized = Number(standardHours);
    if (!Number.isNaN(normalized)) {
      where.standard_hours = normalized;
    }
  }

  if (hasValue(points)) {
    const normalized = Number(points);
    if (!Number.isNaN(normalized)) {
      where.points = normalized;
    }
  }

  if (hasValue(quantity)) {
    const normalized = Number.parseInt(quantity, 10);
    if (!Number.isNaN(normalized)) {
      where.quantity = normalized;
    }
  }

  if (hasValue(quantityEditable)) {
    const normalized = Number(quantityEditable);
    if (normalized === 0 || normalized === 1) {
      where.quantity_editable = normalized;
    }
  }

  if (hasValue(pointsEditable)) {
    const normalized = Number(pointsEditable);
    if (normalized === 0 || normalized === 1) {
      where.points_editable = normalized;
    }
  }

  if (hasValue(dispatchReviewRequired)) {
    const normalized = Number(dispatchReviewRequired);
    if (normalized === 0 || normalized === 1) {
      where.dispatch_review_required = normalized;
    }
  }

  if (isActive !== undefined) {
    where.is_active = isActive;
  } else {
    where.is_active = 1;
  }

  if (keyword) {
    where[Op.or] = [
      { position_name: { [Op.like]: `%${keyword}%` } },
      { job_name: { [Op.like]: `%${keyword}%` } },
      { task_category: { [Op.like]: `%${keyword}%` } },
      { score_method: { [Op.like]: `%${keyword}%` } },
      { points_rule: { [Op.like]: `%${keyword}%` } },
      { '$station.station_name$': { [Op.like]: `%${keyword}%` } }
    ];
    const numericKeyword = Number(keyword);
    if (!Number.isNaN(numericKeyword)) {
      where[Op.or].push(
        { points: numericKeyword },
        { quantity: numericKeyword },
        { standard_hours: numericKeyword }
      );
    }
  }

  if (!dataFilter.all && dataFilter.stationIds?.length > 0) {
    if (where.station_id) {
      const normalizedStationId = Number(where.station_id);
      if (!dataFilter.stationIds.includes(normalizedStationId)) {
        where.station_id = -1;
      }
    } else {
      where.station_id = { [Op.in]: dataFilter.stationIds };
    }
  }

  const result = await PositionJob.findAndCountAll({
    where,
    include: [
      { model: Station, as: 'station', attributes: ['id', 'station_name'] }
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
 * 新增岗位任务
 * POST /api/position-jobs
 */
export const createPositionJob = async (ctx) => {
  const {
    positionName,
    jobName,
    taskCategory,
    scoreMethod,
    standardHours,
    points,
    quantity,
    pointsRule,
    quantityEditable,
    pointsEditable,
    dispatchReviewRequired,
    sortOrder,
    stationId
  } = await validateBody(ctx, createPositionJobBodySchema);
  const { roleCode, stations } = ctx.state.user;

  if (!positionName || !jobName) {
    throw createError(400, '请填写岗位和任务名称');
  }

  if (points === undefined || points === null || points === '') {
    throw createError(400, '单位积分不能为空');
  }

  const normalizedPoints = Number(points);
  if (Number.isNaN(normalizedPoints)) {
    throw createError(400, '单位积分必须为数字');
  }

  if (!stationId) {
    throw createError(400, '场站不能为空');
  }

  if (roleCode === 'station_manager') {
    const stationIds = stations?.map(s => s.id) ?? [];
    if (!stationIds.includes(Number(stationId))) {
      throw createError(403, '只能管理所属场站的岗位任务');
    }
  }

  const normalizedQuantity = quantity !== undefined && quantity !== null && quantity !== ''
    ? Number.parseInt(quantity, 10)
    : 1;
  if (!Number.isInteger(normalizedQuantity) || normalizedQuantity < 1 || normalizedQuantity > 1000) {
    throw createError(400, '数量必须是 1-1000 的整数');
  }


  const normalizedSortOrder = sortOrder !== undefined && sortOrder !== null && sortOrder !== ''
    ? Number.parseInt(sortOrder, 10)
    : 1;
  if (!Number.isInteger(normalizedSortOrder) || normalizedSortOrder < 1 || normalizedSortOrder > 9999) {
    throw createError(400, '排序必须是 1-9999 的整数');
  }

  const existing = await PositionJob.findOne({
    where: {
      position_name: positionName.trim(),
      job_name: jobName.trim(),
      station_id: Number(stationId)
    }
  });

  if (existing) {
    throw createError(400, '该岗位任务已存在');
  }

  const positionJob = await PositionJob.create({
    position_name: positionName.trim(),
    job_name: jobName.trim(),
    task_category: taskCategory ? taskCategory.trim() : null,
    score_method: scoreMethod ?? null,
    standard_hours: standardHours ?? null,
    points: normalizedPoints,
    quantity: normalizedQuantity,
    points_rule: pointsRule ?? null,
    quantity_editable: Number(quantityEditable) === 1 ? 1 : 0,
    points_editable: Number(pointsEditable) === 1 ? 1 : 0,
    dispatch_review_required: Number(dispatchReviewRequired) === 1 ? 1 : 0,
    sort_order: normalizedSortOrder,
    station_id: Number(stationId),
    is_active: 1
  });

  ctx.body = {
    code: 200,
    message: '新增成功',
    data: { id: positionJob.id }
  };
};

/**
 * 更新岗位任务
 * PUT /api/position-jobs/:id
 */
export const updatePositionJob = async (ctx) => {
  const { id } = await validateParams(ctx, idParamSchema);
  const {
    positionName,
    jobName,
    taskCategory,
    scoreMethod,
    standardHours,
    points,
    quantity,
    pointsRule,
    quantityEditable,
    pointsEditable,
    dispatchReviewRequired,
    sortOrder,
    stationId,
    isActive,
    renamePosition
  } = await validateBody(ctx, updatePositionJobBodySchema);
  const { roleCode, stations } = ctx.state.user;

  const positionJob = await PositionJob.findByPk(id);
  if (!positionJob) {
    throw createError(404, '岗位任务不存在');
  }

  const stationIdValue = stationId !== undefined && stationId !== null
    ? Number(stationId)
    : positionJob.station_id;
  const stationChanged = stationId !== undefined && stationId !== null
    && stationIdValue !== positionJob.station_id;
  const positionNameValue = typeof positionName === 'string' ? positionName.trim() : positionName;
  const shouldRenamePosition = renamePosition === true
    && positionNameValue
    && positionNameValue !== positionJob.position_name
    && !stationChanged;

  if (roleCode === 'station_manager') {
    const stationIds = stations?.map(s => s.id) ?? [];
    if (!stationIds.includes(positionJob.station_id)) {
      throw createError(403, '只能管理所属场站的岗位任务');
    }
    if (stationId !== undefined && stationId !== null && !stationIds.includes(stationIdValue)) {
      throw createError(403, '只能管理所属场站的岗位任务');
    }
  }

  if (positionNameValue && jobName) {
    const existing = await PositionJob.findOne({
      where: {
        id: { [Op.ne]: id },
        position_name: positionNameValue,
        job_name: jobName,
        station_id: stationIdValue
      }
    });

    if (existing) {
      throw createError(400, '该岗位任务已存在');
    }
  }

  const updateData = {
    position_name: positionNameValue !== undefined ? positionNameValue : positionJob.position_name,
    job_name: jobName !== undefined ? jobName : positionJob.job_name,
    station_id: stationIdValue,
    is_active: isActive !== undefined ? isActive : positionJob.is_active
  };

  if (taskCategory !== undefined) {
    updateData.task_category = taskCategory ? taskCategory.trim() : null;
  }

  if (scoreMethod !== undefined) {
    updateData.score_method = scoreMethod ?? null;
  }

  if (standardHours !== undefined) {
    updateData.standard_hours = standardHours;
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
    const normalizedQuantity = Number.parseInt(quantity, 10);
    if (!Number.isInteger(normalizedQuantity) || normalizedQuantity < 1 || normalizedQuantity > 1000) {
      throw createError(400, '数量必须是 1-1000 的整数');
    }
    updateData.quantity = normalizedQuantity;
  }

  if (sortOrder !== undefined) {
    const normalizedSortOrder = sortOrder === null || sortOrder === ''
      ? 1
      : Number.parseInt(sortOrder, 10);
    if (!Number.isInteger(normalizedSortOrder) || normalizedSortOrder < 1 || normalizedSortOrder > 9999) {
      throw createError(400, '排序必须是 1-9999 的整数');
    }
    updateData.sort_order = normalizedSortOrder;
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

  if (dispatchReviewRequired !== undefined) {
    updateData.dispatch_review_required = Number(dispatchReviewRequired) === 1 ? 1 : 0;
  }

  if (shouldRenamePosition) {
    const transaction = await sequelize.transaction();
    try {
      const jobsToRename = await PositionJob.findAll({
        where: {
          station_id: stationIdValue,
          position_name: positionJob.position_name
        },
        attributes: ['job_name'],
        transaction
      });
      const jobNames = jobsToRename
        .map(item => item.job_name)
        .filter(name => name);

      if (jobNames.length > 0) {
        const conflict = await PositionJob.findOne({
          where: {
            station_id: stationIdValue,
            position_name: positionNameValue,
            job_name: { [Op.in]: jobNames },
            id: { [Op.ne]: id }
          },
          transaction
        });
        if (conflict) {
          throw createError(400, '目标岗位已存在相同任务，无法重命名');
        }
      }

      await PositionJob.update(
        { position_name: positionNameValue },
        {
          where: {
            station_id: stationIdValue,
            position_name: positionJob.position_name
          },
          transaction
        }
      );

      await Schedule.update(
        { position_name: positionNameValue },
        {
          where: {
            station_id: stationIdValue,
            position_name: positionJob.position_name
          },
          transaction
        }
      );

      await positionJob.update(updateData, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw createError(400, '重命名失败：排班记录存在重复项');
      }
      throw error;
    }

    ctx.body = {
      code: 200,
      message: '岗位任务更新成功',
      data: null
    };
    return;
  }

  await positionJob.update(updateData);

  ctx.body = {
    code: 200,
    message: '岗位任务更新成功',
    data: null
  };
};

/**
 * 删除岗位任务
 * DELETE /api/position-jobs/:id
 * Query 参数: confirmed=true 表示用户已确认删除
 */
export const deletePositionJob = async (ctx) => {
  const { id } = await validateParams(ctx, idParamSchema);
  await validateQuery(ctx, deletePositionJobQuerySchema);
  const { confirmed } = ctx.query;
  const { roleCode, stations } = ctx.state.user;

  const positionJob = await PositionJob.findByPk(id);
  if (!positionJob) {
    throw createError(404, '岗位任务不存在');
  }

  if (roleCode === 'station_manager') {
    const stationIds = stations?.map(s => s.id) ?? [];
    if (!stationIds.includes(positionJob.station_id)) {
      throw createError(403, '只能管理所属场站的岗位任务');
    }
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const today = now.getDate();

  const futureSchedules = await Schedule.findAll({
    where: {
      station_id: positionJob.station_id,
      position_name: positionJob.position_name,
      [Op.or]: [
        sequelize.where(
          sequelize.literal('year * 100 + month'),
          Op.gt,
          currentYear * 100 + currentMonth
        ),
        {
          year: currentYear,
          month: currentMonth
        }
      ]
    }
  });

  let hasFutureSchedule = false;
  let scheduleCount = 0;

  for (const schedule of futureSchedules) {
    if (schedule.year > currentYear || schedule.month > currentMonth) {
      hasFutureSchedule = true;
      scheduleCount++;
    } else if (schedule.year === currentYear && schedule.month === currentMonth) {
      const schedules = schedule.schedules ?? {};
      for (const date in schedules) {
        const day = Number.parseInt(date.split('-')[2], 10);
        if (day >= today) {
          hasFutureSchedule = true;
          scheduleCount++;
          break;
        }
      }
    }
  }

  if (hasFutureSchedule && confirmed !== 'true') {
    ctx.body = {
      code: 200,
      message: `该岗位当前有 ${scheduleCount} 个排班，删除后将移除未来排班记录，是否继续？`,
      data: {
        needConfirm: true,
        scheduleCount
      }
    };
    return;
  }

  try {
    await positionJob.update({ is_active: 0 });

    await deleteFutureSchedules(
      positionJob.station_id,
      positionJob.position_name,
      currentYear,
      currentMonth,
      today
    );

    const remainingJobs = await PositionJob.count({
      where: {
        station_id: positionJob.station_id,
        position_name: positionJob.position_name,
        is_active: 1
      }
    });

    if (remainingJobs === 0) {
      await deleteFutureSchedules(
        positionJob.station_id,
        positionJob.position_name,
        currentYear,
        currentMonth,
        today
      );
    }

    ctx.body = {
      code: 200,
      message: '岗位任务删除成功',
      data: null
    };
  } catch (error) {
    throw createError(500, `删除失败: ${error.message}`);
  }
};

/**
 * 删除未来排班记录
 */
async function deleteFutureSchedules(stationId, positionName, currentYear, currentMonth, today) {
  await Schedule.destroy({
    where: {
      station_id: stationId,
      position_name: positionName,
      [Op.or]: [
        sequelize.where(
          sequelize.literal('year * 100 + month'),
          Op.gt,
          currentYear * 100 + currentMonth
        )
      ]
    }
  });

  const currentMonthSchedules = await Schedule.findAll({
    where: {
      station_id: stationId,
      position_name: positionName,
      year: currentYear,
      month: currentMonth
    }
  });

  for (const schedule of currentMonthSchedules) {
    const schedules = schedule.schedules ?? {};
    let modified = false;

    for (const date in schedules) {
      const day = Number.parseInt(date.split('-')[2], 10);
      if (day >= today) {
        delete schedules[date];
        modified = true;
      }
    }

    if (modified) {
      if (Object.keys(schedules).length === 0) {
        await schedule.destroy();
      } else {
        schedule.schedules = schedules;
        schedule.changed('schedules', true);
        await schedule.save();
      }
    }
  }
}

/**
 * 批量导入岗位任务
 * POST /api/position-jobs/import
 */
export const importPositionJobs = async (ctx) => {
  const { file } = ctx.request;

  if (!file) {
    throw createError(400, '请上传Excel文件');
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer);

    const worksheet = workbook.getWorksheet(1);
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
    const parseNumber = (value, parser) => {
      const normalized = normalizeCellValue(value);
      if (normalized === undefined || normalized === null || normalized === '') return null;
      const parsed = parser(normalized);
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

    const stations = await Station.findAll({
      attributes: ['id', 'station_name']
    });

    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      if (!row.hasValues) continue;

      const stationName = row.getCell(1).value?.toString().trim();
      const positionName = row.getCell(2).value?.toString().trim();
      const sortOrder = parseNumber(row.getCell(3).value, Number.parseInt);
      const jobName = row.getCell(4).value?.toString().trim();
      const taskCategory = row.getCell(5).value?.toString().trim();
      const scoreMethod = row.getCell(6).value?.toString().trim();
      const standardHours = parseNumber(row.getCell(7).value, Number.parseFloat);

      // 单位积分允许为空：为空时按 0 导入；非空但非数字时仍报错。
      const rawPointsValue = normalizeCellValue(row.getCell(8).value);
      let points = 0;
      if (rawPointsValue !== undefined && rawPointsValue !== null && rawPointsValue !== '') {
        const parsedPoints = Number.parseFloat(rawPointsValue);
        if (Number.isNaN(parsedPoints)) {
          results.push({
            row: i,
            stationName,
            positionName,
            jobName,
            status: 'error',
            message: '单位积分必须为数字'
          });
          continue;
        }
        points = parsedPoints;
      }

      const quantity = parseNumber(row.getCell(9).value, Number.parseInt) ?? 1;
      const pointsRule = row.getCell(10).value?.toString().trim();
      const quantityEditable = parseBoolean(row.getCell(11).value);
      const pointsEditable = parseBoolean(row.getCell(12).value);
      const dispatchReviewRequired = parseBoolean(row.getCell(13).value);

      if (!positionName || !jobName) {
        results.push({
          row: i,
          stationName,
          positionName,
          jobName,
          status: 'error',
          message: '岗位和任务名称不能为空'
        });
        continue;
      }

      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) {
        results.push({
          row: i,
          stationName,
          positionName,
          jobName,
          status: 'error',
          message: '数量必须是 1-1000 的整数'
        });
        continue;
      }

      const normalizedSortOrder = sortOrder ?? 1;
      if (!Number.isInteger(normalizedSortOrder) || normalizedSortOrder < 1 || normalizedSortOrder > 9999) {
        results.push({
          row: i,
          stationName,
          positionName,
          jobName,
          status: 'error',
          message: '排序必须是 1-9999 的整数'
        });
        continue;
      }

      let stationId = null;
      if (stationName) {
        const station = stations.find(s => s.station_name === stationName);
        if (!station) {
          results.push({
            row: i,
            stationName,
            positionName,
            jobName,
            status: 'error',
            message: `找不到场站 "${stationName}"`
          });
          continue;
        }
        stationId = station.id;
      }

      const existing = await PositionJob.findOne({
        where: {
          position_name: positionName,
          job_name: jobName,
          station_id: stationId
        }
      });

      if (!existing) {
        await PositionJob.create({
          position_name: positionName,
          job_name: jobName,
          task_category: taskCategory ?? null,
          score_method: scoreMethod ?? null,
          standard_hours: standardHours ?? null,
          points: points,
          quantity: quantity,
          points_rule: pointsRule ?? null,
          quantity_editable: quantityEditable === 1 ? 1 : 0,
          points_editable: pointsEditable === 1 ? 1 : 0,
          dispatch_review_required: dispatchReviewRequired === 1 ? 1 : 0,
          sort_order: normalizedSortOrder,
          station_id: stationId,
          is_active: 1
        });

        results.push({
          row: i,
          stationName,
          positionName,
          jobName,
          status: 'success'
        });
      } else {
        await existing.update({
          task_category: taskCategory ?? existing.task_category,
          score_method: scoreMethod ?? existing.score_method,
          standard_hours: standardHours ?? existing.standard_hours,
          points: points,
          quantity: quantity,
          points_rule: pointsRule ?? existing.points_rule,
          quantity_editable: quantityEditable === null ? existing.quantity_editable : quantityEditable,
          points_editable: pointsEditable === null ? existing.points_editable : pointsEditable,
          dispatch_review_required: dispatchReviewRequired === null ? existing.dispatch_review_required : dispatchReviewRequired,
          sort_order: normalizedSortOrder
        });

        results.push({
          row: i,
          stationName,
          positionName,
          jobName,
          status: 'updated',
          message: '已更新'
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const updatedCount = results.filter(r => r.status === 'updated').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const duplicateCount = results.filter(r => r.status === 'duplicate').length;

    ctx.body = {
      code: 200,
      message: `导入完成：新增${successCount}条，更新${updatedCount}条，重复${duplicateCount}条，失败${errorCount}条`,
      data: results
    };
  } catch (error) {
    ctx.body = {
      code: 500,
      message: `导入失败: ${error.message}`,
      data: null
    };
  }
};

/**
 * 获取岗位任务模板
 * GET /api/position-jobs/template
 */
export const getPositionJobsTemplate = async (ctx) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('岗位任务模板');

            worksheet.columns = [
      { header: '场站', key: 'stationName', width: 15 },
      { header: '岗位', key: 'positionName', width: 15 },
      { header: '排序', key: 'sortOrder', width: 10 },
      { header: '任务名称', key: 'jobName', width: 25 },
      { header: '任务类别', key: 'taskCategory', width: 15 },
      { header: '给分方式', key: 'scoreMethod', width: 15 },
      { header: '标准工时(h/d)', key: 'standardHours', width: 15 },
      { header: '单位积分', key: 'points', width: 12 },
      { header: '数量', key: 'quantity', width: 10 },
      { header: '积分规则', key: 'pointsRule', width: 20 },
      { header: '数量是否可修改', key: 'quantityEditable', width: 15 },
      { header: '积分是否可修改', key: 'pointsEditable', width: 15 },
      { header: '派发任务是否强制审核', key: 'dispatchReviewRequired', width: 20 }
    ];

            worksheet.addRow({
      stationName: '示例场站',
      positionName: '示例岗位',
      sortOrder: 1,
      jobName: '示例任务',
      taskCategory: '自由文本',
      scoreMethod: '奖扣结合式',
      standardHours: 8,
      points: 10,
      quantity: 1,
      pointsRule: '备注说明',
      quantityEditable: '是',
      pointsEditable: '否',
      dispatchReviewRequired: '否'
    });

    applyTemplateHeaderStyle(worksheet, 1);
            addTemplateInstructionSheet(workbook, [
      ['场站', '填写场站名称，可留空表示通用任务'],
      ['岗位', '岗位名称必填'],
      ['排序', '可不填，默认 1，整数 1-9999'],
      ['任务名称', '任务名称必填'],
      ['任务类别', '自由文本，用于筛选区'],
      ['给分方式', '奖扣结合式/ 扣分项/ 奖分项'],
      ['标准工时(h/d)', '标准工时，可不填'],
      ['单位积分', '可不填，默认 0；可为正数/负数/0'],
      ['数量', '整数 1-1000，默认 1'],
      ['积分规则', '备注说明'],
      ['数量是否可修改', '填写 是/否'],
      ['积分是否可修改', '填写 是/否'],
      ['派发任务是否强制审核', '填写 是/否']
    ]);

    const buffer = await workbook.xlsx.writeBuffer();

    ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    ctx.set('Content-Disposition', `attachment; filename="template.xlsx"; filename*=UTF-8''${encodeURIComponent('岗位任务模板.xlsx')}`);
    ctx.body = buffer;
  } catch (error) {
    throw createError(500, '模板生成失败');
  }
};

/**
 * 根据岗位查询任务
 * GET /api/position-jobs/by-position
 */
export const getPositionJobsByPosition = async (ctx) => {
  await validateQuery(ctx, getPositionJobsByPositionQuerySchema);
  const { positionName, stationId } = ctx.query;
  const dataFilter = ctx.state.dataFilter;

  const where = {
    position_name: positionName,
    is_active: 1
  };

  if (stationId) {
    where.station_id = Number(stationId);
  } else if (!dataFilter.all && dataFilter.stationIds?.length > 0) {
    where.station_id = { [Op.in]: dataFilter.stationIds };
  }

  const positionJobs = await PositionJob.findAll({
    where,
    include: [
      { model: Station, as: 'station', attributes: ['id', 'station_name'] }
    ],
    order: [
      ['sort_order', 'ASC'],
      ['created_at', 'ASC']
    ]
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: positionJobs
  };
};

/**
 * 获取所有岗位名称（去重）
 * GET /api/position-jobs/positions
 * Query 参数: stationId - 可选，指定场站
 */
export const getPositionNames = async (ctx) => {
  const dataFilter = ctx.state.dataFilter;
  await validateQuery(ctx, getPositionNamesQuerySchema);
  const { stationId } = ctx.query;

  const where = {
    is_active: 1
  };

  if (stationId !== undefined && stationId !== null && stationId !== '') {
    const parsedStationId = Number(stationId);
    if (Number.isNaN(parsedStationId)) {
      throw createError(400, '场站无效');
    }
    where.station_id = parsedStationId;
  } else if (!dataFilter.all && dataFilter.stationIds?.length > 0) {
    where.station_id = { [Op.in]: dataFilter.stationIds };
  }

  const positions = await PositionJob.findAll({
    where,
    attributes: [[sequelize.fn('DISTINCT', sequelize.col('position_name')), 'position_name']],
    raw: true
  });

  const positionNames = positions.map(p => p.position_name).filter(Boolean);

  if (!positionNames.includes('站长')) {
    positionNames.unshift('站长');
  }

  ctx.body = {
    code: 200,
    message: 'success',
    data: positionNames
  };
};

export default {
  getPositionJobs,
  createPositionJob,
  updatePositionJob,
  deletePositionJob,
  importPositionJobs,
  getPositionJobsTemplate,
  getPositionJobsByPosition,
  getPositionNames
};
