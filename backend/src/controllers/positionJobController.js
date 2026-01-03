import { PositionJob, Station, PositionWorkLog, Schedule, sequelize } from '../models/index.js';
import { Op } from 'sequelize';
import { createError } from '../middlewares/error.js';
import { getPagination, formatPaginationResponse, getOrderBy } from '../utils/helpers.js';
import ExcelJS from 'exceljs';

/**
 * 查询岗位工作项目列表
 * GET /api/position-jobs
 */
export const getPositionJobs = async (ctx) => {
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const order = getOrderBy(ctx.query);
  const { positionName, stationId, jobName, isActive } = ctx.query;
  const dataFilter = ctx.state.dataFilter;

  const where = {};

  if (positionName) {
    where.position_name = { [Op.like]: `%${positionName}%` };
  }

  if (stationId) {
    where.station_id = parseInt(stationId);
  }

  if (jobName) {
    where.job_name = { [Op.like]: `%${jobName}%` };
  }

  // 默认只查询活跃的工作项目
  if (isActive !== undefined) {
    where.is_active = isActive;
  } else {
    where.is_active = 1;
  }

  // 数据权限过滤
  if (!dataFilter.all && dataFilter.stationIds?.length > 0) {
    where.station_id = { [Op.in]: dataFilter.stationIds };
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
 * 新增岗位工作项目
 * POST /api/position-jobs
 */
export const createPositionJob = async (ctx) => {
  const { positionName, jobName, standardHours, points, stationId } = ctx.request.body;
  const { roleCode, stations } = ctx.state.user;

  if (!positionName || !jobName) {
    throw createError(400, '岗位名称和工作项目名称不能为空');
  }

  if (!stationId) {
    throw createError(400, '场站ID不能为空');
  }

  // 权限检查：站长只能管理其所属场站的岗位
  if (roleCode === 'station_manager') {
    const stationIds = stations?.map(s => s.id) || [];
    if (!stationIds.includes(parseInt(stationId))) {
      throw createError(403, '您只能管理所属场站的岗位工作项目');
    }
    // 站长不能设置积分，积分由部门经理/副经理设置
    // 这里不做限制，允许站长创建，但积分字段将被忽略或设为null
  }

  // 检查是否已存在相同的岗位和工作项目
  const existing = await PositionJob.findOne({
    where: {
      position_name: positionName,
      job_name: jobName,
      station_id: parseInt(stationId)
    }
  });

  if (existing) {
    throw createError(400, '该岗位的工作项目已存在');
  }

  // 只有部门经理/副经理可以设置积分
  const canSetPoints = ['department_manager', 'deputy_manager', 'admin'].includes(roleCode);

  const positionJob = await PositionJob.create({
    position_name: positionName,
    job_name: jobName,
    standard_hours: standardHours || null,
    points: canSetPoints ? (points || null) : null,
    station_id: parseInt(stationId),
    is_active: 1
  });

  ctx.body = {
    code: 200,
    message: '岗位工作项目创建成功',
    data: { id: positionJob.id }
  };
};

/**
 * 更新岗位工作项目
 * PUT /api/position-jobs/:id
 */
export const updatePositionJob = async (ctx) => {
  const { id } = ctx.params;
  const { positionName, jobName, standardHours, points, stationId, isActive } = ctx.request.body;
  const { roleCode, stations } = ctx.state.user;

  const positionJob = await PositionJob.findByPk(id);
  if (!positionJob) {
    throw createError(404, '岗位工作项目不存在');
  }

  // 权限检查：站长只能管理其所属场站的岗位
  if (roleCode === 'station_manager') {
    const stationIds = stations?.map(s => s.id) || [];
    // 检查原场站权限
    if (!stationIds.includes(positionJob.station_id)) {
      throw createError(403, '您只能管理所属场站的岗位工作项目');
    }
    // 如果要修改场站，检查新场站权限
    if (stationId && !stationIds.includes(parseInt(stationId))) {
      throw createError(403, '您只能将岗位分配到所属场站');
    }
  }

  // 检查更新后是否会产生重复数据
  if (positionName && jobName) {
    const existing = await PositionJob.findOne({
      where: {
        id: { [Op.ne]: id },
        position_name: positionName,
        job_name: jobName,
        station_id: stationId ? parseInt(stationId) : positionJob.station_id
      }
    });

    if (existing) {
      throw createError(400, '该岗位的工作项目已存在');
    }
  }

  // 只有部门经理/副经理可以设置积分
  const canSetPoints = ['department_manager', 'deputy_manager', 'admin'].includes(roleCode);

  const updateData = {
    position_name: positionName,
    job_name: jobName,
    station_id: stationId ? parseInt(stationId) : positionJob.station_id,
    is_active: isActive !== undefined ? isActive : positionJob.is_active
  };

  // 标准工时所有角色都可以更新
  if (standardHours !== undefined) {
    updateData.standard_hours = standardHours;
  }

  // 只有有权限的角色才能更新积分
  if (canSetPoints && points !== undefined) {
    updateData.points = points;
  }

  await positionJob.update(updateData);

  ctx.body = {
    code: 200,
    message: '岗位工作项目更新成功',
    data: null
  };
};

/**
 * 删除岗位工作项目
 * DELETE /api/position-jobs/:id
 * Query参数: confirmed=true 表示用户已确认删除
 */
export const deletePositionJob = async (ctx) => {
  const { id } = ctx.params;
  const { confirmed } = ctx.query;
  const { roleCode, stations } = ctx.state.user;

  const positionJob = await PositionJob.findByPk(id);
  if (!positionJob) {
    throw createError(404, '岗位工作项目不存在');
  }

  // 权限检查：站长只能管理其所属场站的岗位
  if (roleCode === 'station_manager') {
    const stationIds = stations?.map(s => s.id) || [];
    if (!stationIds.includes(positionJob.station_id)) {
      throw createError(403, '您只能管理所属场站的岗位工作项目');
    }
  }

  // 获取当前日期
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const today = now.getDate();

  // 检查该岗位是否有未来的排班
  const futureSchedules = await Schedule.findAll({
    where: {
      station_id: positionJob.station_id,
      position_name: positionJob.position_name,
      [Op.or]: [
        // 未来的月份
        sequelize.where(
          sequelize.literal(`year * 100 + month`),
          Op.gt,
          currentYear * 100 + currentMonth
        ),
        // 当前月份
        {
          year: currentYear,
          month: currentMonth
        }
      ]
    }
  });

  // 检查当前月份的排班中是否有今天及以后的日期
  let hasFutureSchedule = false;
  let scheduleCount = 0;

  for (const schedule of futureSchedules) {
    if (schedule.year > currentYear || schedule.month > currentMonth) {
      hasFutureSchedule = true;
      scheduleCount++;
    } else if (schedule.year === currentYear && schedule.month === currentMonth) {
      // 检查当前月份的 schedules JSON
      const schedules = schedule.schedules || {};
      for (const date in schedules) {
        const day = parseInt(date.split('-')[2]);
        if (day >= today) {
          hasFutureSchedule = true;
          scheduleCount++;
          break;
        }
      }
    }
  }

  // 如果有未来排班且用户未确认，返回需要确认
  if (hasFutureSchedule && confirmed !== 'true') {
    ctx.body = {
      code: 200,
      message: `该岗位当前有 ${scheduleCount} 人排班，删除后将移除未来排班记录，是否继续？`,
      data: {
        needConfirm: true,
        scheduleCount
      }
    };
    return;
  }

  // 执行删除操作
  try {
    // 1. 软删除工作项目（设置 is_active = 0）
    await positionJob.update({ is_active: 0 });

    // 2. 删除该岗位的未来排班
    await deleteFutureSchedules(
      positionJob.station_id,
      positionJob.position_name,
      currentYear,
      currentMonth,
      today
    );

    // 3. 检查该岗位是否还有其他活跃的工作项目
    const remainingJobs = await PositionJob.count({
      where: {
        station_id: positionJob.station_id,
        position_name: positionJob.position_name,
        is_active: 1
      }
    });

    // 4. 如果岗位下没有工作项目了，删除该岗位的所有未来排班
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
      message: '岗位工作项目删除成功',
      data: null
    };
  } catch (error) {
    throw createError(500, `删除失败: ${error.message}`);
  }
};

/**
 * 删除未来排班的辅助函数
 * @param {number} stationId - 场站ID
 * @param {string} positionName - 岗位名称
 * @param {number} currentYear - 当前年份
 * @param {number} currentMonth - 当前月份
 * @param {number} today - 今天是几号
 */
async function deleteFutureSchedules(stationId, positionName, currentYear, currentMonth, today) {
  // 删除未来月份的整条记录
  await Schedule.destroy({
    where: {
      station_id: stationId,
      position_name: positionName,
      [Op.or]: [
        sequelize.where(
          sequelize.literal(`year * 100 + month`),
          Op.gt,
          currentYear * 100 + currentMonth
        )
      ]
    }
  });

  // 修改当前月份的记录，删除今天及以后的日期
  const currentMonthSchedules = await Schedule.findAll({
    where: {
      station_id: stationId,
      position_name: positionName,
      year: currentYear,
      month: currentMonth
    }
  });

  for (const schedule of currentMonthSchedules) {
    const schedules = schedule.schedules || {};
    let modified = false;

    // 删除今天及以后的排班
    for (const date in schedules) {
      const day = parseInt(date.split('-')[2]);
      if (day >= today) {
        delete schedules[date];
        modified = true;
      }
    }

    if (modified) {
      // 如果删除后没有排班了，删除整条记录
      if (Object.keys(schedules).length === 0) {
        await schedule.destroy();
      } else {
        // 否则更新记录
        // 重要：Sequelize 需要显式标记 JSON 字段已更改
        schedule.schedules = schedules;
        schedule.changed('schedules', true);
        await schedule.save();
      }
    }
  }
}

/**
 * 批量导入岗位工作项目
 * POST /api/position-jobs/import
 */
export const importPositionJobs = async (ctx) => {
  const { file } = ctx.request; // 文件通过中间件处理后在request对象中

  if (!file) {
    throw createError(400, '请上传Excel文件');
  }

  const { roleCode } = ctx.state.user;
  // 只有部门经理/副经理可以导入积分
  const canSetPoints = ['department_manager', 'deputy_manager', 'admin'].includes(roleCode);

  try {
    const workbook = new ExcelJS.Workbook();
    // 使用buffer而不是文件路径，因为Docker中路径处理可能不同
    await workbook.xlsx.load(file.buffer);

    const worksheet = workbook.getWorksheet(1); // 获取第一个工作表
    const results = [];

    // 获取所有场站
    const stations = await Station.findAll({
      attributes: ['id', 'station_name']
    });

    // 从第二行开始读取数据（跳过标题行）
    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);

      // 检查是否是空行
      if (!row.hasValues) continue;

      const stationName = row.getCell(1).value?.toString().trim();
      const positionName = row.getCell(2).value?.toString().trim();
      const jobName = row.getCell(3).value?.toString().trim();
      const standardHours = row.getCell(4).value;
      const points = row.getCell(5).value;

      if (!positionName || !jobName) {
        results.push({
          row: i,
          stationName,
          positionName,
          jobName,
          status: 'error',
          message: '岗位名称和工作项目名称不能为空'
        });
        continue;
      }

      // 根据场站名称查找场站ID
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
            message: `未找到场站"${stationName}"`
          });
          continue;
        }
        stationId = station.id;
      }

      // 检查是否已存在相同的岗位和工作项目
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
          standard_hours: standardHours ? parseFloat(standardHours) : null,
          points: (canSetPoints && points) ? parseInt(points) : null,
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
        results.push({
          row: i,
          stationName,
          positionName,
          jobName,
          status: 'duplicate',
          message: '该岗位的工作项目已存在'
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const duplicateCount = results.filter(r => r.status === 'duplicate').length;

    ctx.body = {
      code: 200,
      message: `导入完成：成功${successCount}条，重复${duplicateCount}条，失败${errorCount}条`,
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
 * 获取岗位工作项目模板
 * GET /api/position-jobs/template
 */
export const getPositionJobsTemplate = async (ctx) => {
  try {
    // 创建工作簿
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('岗位工作项目');

    // 设置列标题
    worksheet.columns = [
      { header: '场站', key: 'stationName', width: 15 },
      { header: '岗位名称', key: 'positionName', width: 15 },
      { header: '工作项目', key: 'jobName', width: 20 },
      { header: '标准工时(h/d)', key: 'standardHours', width: 15 },
      { header: '积分', key: 'points', width: 12 }
    ];

    // 添加示例数据
    worksheet.addRow({
      stationName: '示例场站',
      positionName: '示例岗位',
      jobName: '示例工作项目',
      standardHours: 8,
      points: 10
    });

    // 设置标题行样式
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // 生成 buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // 设置响应头
    ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    ctx.set('Content-Disposition', `attachment; filename="template.xlsx"; filename*=UTF-8''${encodeURIComponent('岗位工作项目模板.xlsx')}`);

    // 设置响应体为 buffer
    ctx.body = buffer;
  } catch (error) {
    
    throw createError(500, '生成模板失败');
  }
};

/**
 * 根据岗位查询工作项目
 * GET /api/position-jobs/by-position
 */
export const getPositionJobsByPosition = async (ctx) => {
  const { positionName, stationId } = ctx.query;
  const dataFilter = ctx.state.dataFilter;

  const where = {
    position_name: positionName,
    is_active: 1
  };

  if (stationId) {
    where.station_id = parseInt(stationId);
  } else if (!dataFilter.all && dataFilter.stationIds?.length > 0) {
    where.station_id = { [Op.in]: dataFilter.stationIds };
  }

  const positionJobs = await PositionJob.findAll({
    where,
    include: [
      { model: Station, as: 'station', attributes: ['id', 'station_name'] }
    ],
    order: [['job_name', 'ASC']]
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: positionJobs
  };
};

/**
 * 获取所有岗位名称列表（去重）
 * GET /api/position-jobs/positions
 * Query参数: stationId - 可选，指定场站ID
 */
export const getPositionNames = async (ctx) => {
  const dataFilter = ctx.state.dataFilter;
  const { stationId } = ctx.query;

  const where = {};

  // 优先使用传入的场站ID过滤
  if (stationId) {
    where.station_id = parseInt(stationId);
  } else if (!dataFilter.all && dataFilter.stationIds?.length > 0) {
    // 如果没有传入场站ID，则按用户权限过滤
    where.station_id = { [Op.in]: dataFilter.stationIds };
  }

  // 查询所有不重复的岗位名称
  const positions = await PositionJob.findAll({
    where,
    attributes: [[sequelize.fn('DISTINCT', sequelize.col('position_name')), 'position_name']],
    raw: true
  });

  const positionNames = positions.map(p => p.position_name).filter(Boolean);

  // 添加"站长"到岗位列表（站长也可以被分配卫生任务）
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
