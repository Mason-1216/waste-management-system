import { Op } from 'sequelize';
import { Schedule, User, Station, UserStation, PositionWorkLog, MaintenanceWorkRecord, FaultReport, SafetySelfInspection, SafetyOtherInspection } from '../../../models/index.js';
import { createError } from '../../../middlewares/error.js';
import { getDaysInMonth } from '../../../utils/helpers.js';
import sequelize from '../../../config/database.js';

const resolveProjectId = async (projectId, stationId, user) => {
  if (projectId) return projectId;
  if (stationId) {
    const [rows] = await sequelize.query(
      'SELECT project_id FROM project_stations WHERE station_id = ? LIMIT 1',
      { replacements: [stationId] }
    );
    const stationProjectId = rows?.[0]?.project_id;
    if (stationProjectId) return stationProjectId;
  }
  if (user?.lastProjectId) return user.lastProjectId;
  const [projects] = await sequelize.query(
    'SELECT id FROM projects ORDER BY id ASC LIMIT 1'
  );
  return projects?.[0]?.id || null;
};

const ensureUserStationBinding = async (userId, stationId) => {
  if (!userId || !stationId) return;
  await UserStation.findOrCreate({
    where: { user_id: userId, station_id: stationId },
    defaults: { user_id: userId, station_id: stationId }
  });
};

/**
 * 根据当月排班更新用户的所属场站绑定
 * 规则：清除旧绑定，根据当月所有排班重新绑定场站
 */
const updateUserStationFromSchedule = async (userId, year, month) => {
  if (!userId) return;

  // 查询该用户当月所有排班记录
  const userSchedules = await Schedule.findAll({
    where: {
      user_id: userId,
      year,
      month
    }
  });

  // 收集所有有实际排班的场站ID
  const stationIds = new Set();
  let lastStationId = null;

  for (const schedule of userSchedules) {
    if (!schedule.schedules || !schedule.station_id) continue;

    // 检查是否有实际排班（非休息）
    for (const dateKey in schedule.schedules) {
      if (schedule.schedules[dateKey] && schedule.schedules[dateKey] !== '休') {
        stationIds.add(schedule.station_id);
        lastStationId = schedule.station_id;
        break;
      }
    }
  }

  // 清除该用户的所有场站绑定
  await UserStation.destroy({ where: { user_id: userId } });

  // 重新绑定当月有排班的场站
  if (stationIds.size > 0) {
    const bindings = Array.from(stationIds).map(stationId => ({
      user_id: userId,
      station_id: stationId
    }));
    await UserStation.bulkCreate(bindings);

    // 更新用户的最后所属场站
    if (lastStationId) {
      await User.update(
        { last_station_id: lastStationId },
        { where: { id: userId } }
      );
    }
  }
};

/**
 * 查询排班表（按月）
 * GET /api/schedules
 */
export const getSchedules = async (ctx) => {
  const { year, month, stationId, userId } = ctx.query;
  const dataFilter = ctx.state.dataFilter;
  const roleCode = ctx.state.user?.baseRoleCode || ctx.state.user?.roleCode;
  const roleName = ctx.state.user?.roleName || '';
  const managerAll = ['department_manager', 'deputy_manager'].includes(roleCode) || roleName.includes('经理');

  const now = new Date();
  const hasYear = year !== undefined && year !== null && year !== '';
  const hasMonth = month !== undefined && month !== null && month !== '';
  const resolvedYear = hasYear ? parseInt(year, 10) : now.getFullYear();
  const resolvedMonth = hasMonth ? parseInt(month, 10) : now.getMonth() + 1;

  if (Number.isNaN(resolvedYear) || Number.isNaN(resolvedMonth)) {
    throw createError(400, '年份和月份格式错误');
  }
  if (resolvedMonth < 1 || resolvedMonth > 12) {
    throw createError(400, '月份必须在1-12之间');
  }

  const where = {
    year: resolvedYear,
    month: resolvedMonth
  };

  if (stationId) {
    where.station_id = stationId;
  }

  // 如果指定了 userId，则查询该用户的排班（管理员查看员工排班）
  if (userId) {
    where.user_id = parseInt(userId);
  }

  // 数据权限过滤
  if (!dataFilter.all && !managerAll) {
    if (dataFilter.stationIds?.length > 0 && !userId) {
      // 如果指定了 userId，就不再限制场站（允许查看该用户在所有场站的排班）
      where.station_id = { [Op.in]: dataFilter.stationIds };
    }
    if (dataFilter.userId && !userId) {
      // 如果指定了 userId 参数，优先使用参数值
      where.user_id = dataFilter.userId;
    }
  }

  const schedules = await Schedule.findAll({
    where,
    include: [
      { model: User, as: 'user', attributes: ['id', 'username', 'real_name', 'phone'] },
      { model: Station, as: 'station', attributes: ['id', 'station_name'] }
    ],
    order: [['user_name', 'ASC']]
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: {
      year: resolvedYear,
      month: resolvedMonth,
      daysInMonth: getDaysInMonth(resolvedYear, resolvedMonth),
      schedules
    }
  };
};

/**
 * GET /api/schedules/overview
 */
export const getSchedulesOverview = async (ctx) => {
  const { startDate, endDate, stationId, userId, includeTasks } = ctx.query;
  const dataFilter = ctx.state.dataFilter;
  const roleCode = ctx.state.user?.baseRoleCode ?? ctx.state.user?.roleCode;
  const roleName = ctx.state.user?.roleName ?? '';
  const managerAll = ['department_manager', 'deputy_manager'].includes(roleCode) || roleName.includes('经理');

  if (!startDate || !endDate) {
    throw createError(400, 'startDate/endDate required');
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw createError(400, 'Invalid date range');
  }

  if (start > end) {
    throw createError(400, 'startDate must be <= endDate');
  }

  const monthPairs = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const endCursor = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= endCursor) {
    monthPairs.push({ year: cursor.getFullYear(), month: cursor.getMonth() + 1 });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const where = { [Op.or]: monthPairs };

  if (stationId) {
    where.station_id = stationId;
  }

  if (userId) {
    where.user_id = parseInt(userId);
  }

  if (!dataFilter.all && !managerAll) {
    if (dataFilter.stationIds?.length > 0 && !userId) {
      where.station_id = { [Op.in]: dataFilter.stationIds };
    }
    if (dataFilter.userId && !userId) {
      where.user_id = dataFilter.userId;
    }
  }

  const schedules = await Schedule.findAll({
    where,
    include: [
      { model: User, as: 'user', attributes: ['id', 'username', 'real_name', 'phone'] },
      { model: Station, as: 'station', attributes: ['id', 'station_name'] }
    ],
    order: [['user_name', 'ASC']]
  });

  let taskSummary = null;
  const shouldIncludeTasks = includeTasks !== 'false';

  if (shouldIncludeTasks) {
    let stationFilterValue;
    if (stationId) {
      stationFilterValue = stationId;
    } else if (!dataFilter.all && !managerAll && dataFilter.stationIds?.length > 0 && !userId) {
      stationFilterValue = { [Op.in]: dataFilter.stationIds };
    }

    let userFilterValue;
    if (userId) {
      userFilterValue = parseInt(userId);
    } else if (!dataFilter.all && !managerAll && dataFilter.userId) {
      userFilterValue = dataFilter.userId;
    }

    const dateRange = { [Op.between]: [startDate, endDate] };

    const buildTaskWhere = (dateField, userField) => {
      const filter = { [dateField]: dateRange };
      if (stationFilterValue) {
        filter.station_id = stationFilterValue;
      }
      if (userFilterValue && userField) {
        filter[userField] = userFilterValue;
      }
      return filter;
    };

    const positionWhere = buildTaskWhere('work_date', 'user_id');
    const maintenanceWhere = buildTaskWhere('work_date', 'executor_id');
    const faultWhere = buildTaskWhere('fault_date', 'reporter_id');
    const safetySelfWhere = buildTaskWhere('inspection_date', 'filler_id');
    const safetyOtherWhere = buildTaskWhere('inspection_date', 'inspector_id');

    const [
      positionTotal,
      positionCompleted,
      maintenanceTotal,
      maintenanceCompleted,
      faultTotal,
      faultCompleted,
      safetySelfTotal,
      safetyOtherTotal,
      hygieneSelfTotal,
      hygieneOtherTotal
    ] = await Promise.all([
      PositionWorkLog.count({ where: positionWhere }),
      PositionWorkLog.count({ where: { ...positionWhere, is_completed: 1 } }),
      MaintenanceWorkRecord.count({ where: maintenanceWhere }),
      MaintenanceWorkRecord.count({ where: { ...maintenanceWhere, status: { [Op.in]: ['completed', 'verified'] } } }),
      FaultReport.count({ where: faultWhere }),
      FaultReport.count({ where: { ...faultWhere, status: { [Op.in]: ['completed', 'closed'] } } }),
      SafetySelfInspection.count({ where: { ...safetySelfWhere, inspection_type: 'safety' } }),
      SafetyOtherInspection.count({ where: { ...safetyOtherWhere, inspection_type: 'safety' } }),
      SafetySelfInspection.count({ where: { ...safetySelfWhere, inspection_type: 'hygiene' } }),
      SafetyOtherInspection.count({ where: { ...safetyOtherWhere, inspection_type: 'hygiene' } })
    ]);

    const safetyTotal = safetySelfTotal + safetyOtherTotal;
    const hygieneTotal = hygieneSelfTotal + hygieneOtherTotal;

    taskSummary = {
      positionWork: {
        total: positionTotal,
        completed: positionCompleted,
        pending: positionTotal - positionCompleted
      },
      maintenance: {
        total: maintenanceTotal,
        completed: maintenanceCompleted,
        pending: maintenanceTotal - maintenanceCompleted
      },
      fault: {
        total: faultTotal,
        completed: faultCompleted,
        pending: faultTotal - faultCompleted
      },
      safety: {
        total: safetyTotal,
        completed: safetyTotal,
        pending: 0
      },
      hygiene: {
        total: hygieneTotal,
        completed: hygieneTotal,
        pending: 0
      }
    };
  }

  ctx.body = {
    code: 200,
    message: 'success',
    data: {
      startDate,
      endDate,
      schedules,
      taskSummary
    }
  };
};

/**
 * 创建/更新排班
 * POST /api/schedules
 */
export const saveSchedule = async (ctx) => {
  const { stationId, userId, userName, positionName, year, month, schedules, projectId } = ctx.request.body;
  const resolvedProjectId = await resolveProjectId(projectId, stationId, ctx.state.user);

  if (!resolvedProjectId || !userId || !year || !month) {
    throw createError(400, '项目、用户、年份和月份不能为空');
  }

  await ensureUserStationBinding(userId, stationId);

  // 查找是否已存在排班记录
  const existSchedule = await Schedule.findOne({
    where: {
      user_id: userId,
      station_id: stationId,
      position_name: positionName,
      year,
      month
    }
  });

  if (existSchedule) {
    // 更新
    await existSchedule.update({
      project_id: resolvedProjectId,
      station_id: stationId,
      user_name: userName,
      position_name: positionName,
      schedules
    });
  } else {
    // 创建
    await Schedule.create({
      project_id: resolvedProjectId,
      station_id: stationId,
      user_id: userId,
      user_name: userName,
      position_name: positionName,
      year,
      month,
      schedules,
      created_by: ctx.state.user.id
    });
  }

  // 根据当月排班更新用户的所属场站绑定
  await updateUserStationFromSchedule(userId, year, month);

  ctx.body = {
    code: 200,
    message: '排班保存成功',
    data: null
  };
};

/**
 * 批量保存排班
 * POST /api/schedules/batch
 */
export const batchSaveSchedules = async (ctx) => {
  const { stationId, year, month, scheduleList, projectId } = ctx.request.body;
  const resolvedProjectId = await resolveProjectId(projectId, stationId, ctx.state.user);

  if (!resolvedProjectId || !year || !month || !scheduleList?.length) {
    throw createError(400, '参数不完整');
  }

  for (const item of scheduleList) {
    await ensureUserStationBinding(item.userId, stationId);
    const existSchedule = await Schedule.findOne({
      where: {
        user_id: item.userId,
        station_id: stationId,
        position_name: item.positionName,
        year,
        month
      }
    });

    if (existSchedule) {
      await existSchedule.update({
        project_id: resolvedProjectId,
        station_id: stationId,
        user_name: item.userName,
        position_name: item.positionName,
        schedules: item.schedules
      });
    } else {
      await Schedule.create({
        project_id: resolvedProjectId,
        station_id: stationId,
        user_id: item.userId,
        user_name: item.userName,
        position_name: item.positionName,
        year,
        month,
        schedules: item.schedules,
        created_by: ctx.state.user.id
      });
    }

    // 根据当月排班更新用户的所属场站绑定
    await updateUserStationFromSchedule(item.userId, year, month);
  }

  ctx.body = {
    code: 200,
    message: '批量保存成功',
    data: null
  };
};

/**
 * 查询我的排班
 * GET /api/schedules/my
 */
export const getMySchedule = async (ctx) => {
  const { year, month } = ctx.query;
  const userId = ctx.state.user.id;

  if (!year || !month) {
    throw createError(400, '年份和月份不能为空');
  }

  const schedules = await Schedule.findAll({
    where: {
      user_id: userId,
      year: parseInt(year),
      month: parseInt(month)
    },
    include: [
      { model: Station, as: 'station', attributes: ['id', 'station_name'] }
    ]
  });

  const merged = {};
  schedules.forEach((item) => {
    if (!item.schedules) return;
    Object.keys(item.schedules).forEach((dateKey) => {
      if (!item.schedules[dateKey]) return;
      if (!merged[dateKey]) {
        merged[dateKey] = [];
      }
      merged[dateKey].push({
        stationId: item.station_id,
        stationName: item.station?.station_name ?? '',
        positionName: item.position_name ?? ''
      });
    });
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: schedules.length ? { year: parseInt(year), month: parseInt(month), schedules: merged } : null
  };
};

/**
 * 获取今日排班人员
 * GET /api/schedules/today
 */
export const getTodayScheduledUsers = async (ctx) => {
  const { stationId } = ctx.query;
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const dateKey = today.toISOString().split('T')[0];

  const where = { year, month };

  if (stationId) {
    where.station_id = stationId;
  }

  const schedules = await Schedule.findAll({
    where,
    include: [
      { model: User, as: 'user', attributes: ['id', 'username', 'real_name', 'phone'] }
    ]
  });

  // 过滤出今日有排班的人员
  const todayUsers = schedules
    .filter(s => s.schedules && s.schedules[dateKey] && s.schedules[dateKey] !== '休')
    .map(s => ({
      userId: s.user_id,
      userName: s.user_name,
      positionName: s.position_name,
      scheduleTime: s.schedules[dateKey],
      user: s.user
    }));

  ctx.body = {
    code: 200,
    message: 'success',
    data: todayUsers
  };
};

/**
 * 删除排班
 * DELETE /api/schedules/:id
 */
export const deleteSchedule = async (ctx) => {
  const { id } = ctx.params;
  const dataFilter = ctx.state.dataFilter;
  const roleCode = ctx.state.user?.baseRoleCode || ctx.state.user?.roleCode;
  const roleName = ctx.state.user?.roleName || '';
  const managerAll = ['department_manager', 'deputy_manager'].includes(roleCode) || roleName.includes('经理');

  const schedule = await Schedule.findByPk(id);
  if (!schedule) {
    throw createError(404, '排班记录不存在');
  }

  // 数据权限检查
  if (!dataFilter.all && !managerAll) {
    if (dataFilter.stationIds?.length > 0 && !dataFilter.stationIds.includes(schedule.station_id)) {
      throw createError(403, '无权限删除该排班记录');
    }
    if (dataFilter.userId && schedule.user_id !== dataFilter.userId) {
      throw createError(403, '无权限删除该排班记录');
    }
  }

  await schedule.destroy();

  ctx.body = {
    code: 200,
    message: '删除成功',
    data: null
  };
};

/**
 * 批量删除排班
 * POST /api/schedules/batch-delete
 */
export const batchDeleteSchedules = async (ctx) => {
  const { ids } = ctx.request.body;
  const dataFilter = ctx.state.dataFilter;
  const roleCode = ctx.state.user?.baseRoleCode || ctx.state.user?.roleCode;
  const roleName = ctx.state.user?.roleName || '';
  const managerAll = ['department_manager', 'deputy_manager'].includes(roleCode) || roleName.includes('经理');

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw createError(400, '请选择要删除的排班记录');
  }

  // 查询所有要删除的排班记录
  const schedules = await Schedule.findAll({
    where: { id: { [Op.in]: ids } }
  });

  if (schedules.length === 0) {
    throw createError(404, '未找到要删除的排班记录');
  }

  // 数据权限检查
  if (!dataFilter.all && !managerAll) {
    for (const schedule of schedules) {
      if (dataFilter.stationIds?.length > 0 && !dataFilter.stationIds.includes(schedule.station_id)) {
        throw createError(403, '无权限删除部分排班记录');
      }
      if (dataFilter.userId && schedule.user_id !== dataFilter.userId) {
        throw createError(403, '无权限删除部分排班记录');
      }
    }
  }

  await Schedule.destroy({
    where: { id: { [Op.in]: ids } }
  });

  ctx.body = {
    code: 200,
    message: `成功删除${schedules.length}条排班记录`,
    data: null
  };
};

/**
 * 导出我的排班表
 * GET /api/schedules/export-my
 */
export const exportMySchedule = async (ctx) => {
  const { year, month } = ctx.query;
  const userId = ctx.state.user.id;
  const userName = ctx.state.user.realName || ctx.state.user.username;

  if (!year || !month) {
    throw createError(400, '年份和月份不能为空');
  }

  try {
    const ExcelJS = (await import('exceljs')).default;

    // 查询用户排班
    const schedules = await Schedule.findAll({
      where: {
        user_id: userId,
        year: parseInt(year),
        month: parseInt(month)
      },
      include: [
        { model: Station, as: 'station', attributes: ['id', 'station_name'] }
      ]
    });

    // 创建工作簿
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('我的排班');

    // 获取当月天数
    const daysInMonth = getDaysInMonth(year, month);
    const totalColumns = 2 + daysInMonth; // 场站 + 岗位 + 日期列数

    // 第1行：年月标题
    const titleRow = worksheet.addRow([`${year}年${month}月`]);
    worksheet.mergeCells(1, 1, 1, totalColumns);
    titleRow.height = 30;
    titleRow.font = { bold: true, size: 16 };
    titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
    titleRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    titleRow.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };

    // 第2行：日期数字
    const dateRow = ['', '']; // 场站和岗位列为空
    for (let day = 1; day <= daysInMonth; day++) {
      dateRow.push(day);
    }
    const dateRowObj = worksheet.addRow(dateRow);
    dateRowObj.height = 20;
    dateRowObj.font = { bold: true };
    dateRowObj.alignment = { horizontal: 'center', vertical: 'middle' };
    dateRowObj.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // 第3行：星期和列标题
    const weekdayRow = ['场站', '岗位'];
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

    for (let day = 1; day <= daysInMonth; day++) {
      // 计算该日期是星期几
      const date = new Date(parseInt(year), parseInt(month) - 1, day);
      const weekdayIndex = date.getDay();
      weekdayRow.push(weekdays[weekdayIndex]);
    }

    const weekdayRowObj = worksheet.addRow(weekdayRow);
    weekdayRowObj.height = 20;
    weekdayRowObj.font = { bold: true };
    weekdayRowObj.alignment = { horizontal: 'center', vertical: 'middle' };
    weekdayRowObj.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9D9D9' }
    };

    // 设置列宽
    worksheet.getColumn(1).width = 15; // 场站
    worksheet.getColumn(2).width = 15; // 岗位
    for (let i = 3; i <= totalColumns; i++) {
      worksheet.getColumn(i).width = 5; // 日期列
    }

    // 添加数据行
    schedules.forEach(schedule => {
      const rowData = [
        schedule.station?.station_name || '',
        schedule.position_name || ''
      ];

      // 填充每日排班
      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        rowData.push(schedule.schedules?.[dateKey] ? '班' : '休');
      }

      const dataRow = worksheet.addRow(rowData);
      dataRow.alignment = { horizontal: 'center', vertical: 'middle' };

      // 为"班"和"休"设置不同颜色
      dataRow.eachCell((cell, colNumber) => {
        if (colNumber > 2) { // 跳过场站和岗位列
          if (cell.value === '班') {
            cell.font = { color: { argb: 'FF00AA00' }, bold: true };
          } else if (cell.value === '休') {
            cell.font = { color: { argb: 'FF999999' } };
          }
        }
      });
    });

    // 生成 buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // 设置响应头
    ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    ctx.set('Content-Disposition', `attachment; filename="schedule.xlsx"; filename*=UTF-8''${encodeURIComponent(`${userName}_${year}年${month}月排班表.xlsx`)}`);

    // 设置响应体
    ctx.body = buffer;
  } catch (error) {
    
    throw createError(500, '导出排班失败');
  }
};

export default {
  getSchedules,
  getSchedulesOverview,
  saveSchedule,
  batchSaveSchedules,
  getMySchedule,
  getTodayScheduledUsers,
  deleteSchedule,
  batchDeleteSchedules,
  exportMySchedule
};
