import { Op, literal } from 'sequelize';
import { SafetySelfInspection, SafetyOtherInspection, SafetyHazardInspection, SafetyRectification, User, Role, Station, Notification, Schedule } from '../models/index.js';
import { createError } from '../middlewares/error.js';
import { getPagination, formatPaginationResponse, generateRecordCode, calculateOverdueMinutes } from '../utils/helpers.js';
import logger from '../config/logger.js';
import dayjs from 'dayjs';
import sequelize from '../config/database.js';

const parseSchedulesData = (data) => {
  if (!data) return null;
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }
  return data;
};

const hasScheduleForDate = (schedulesData, dateKey, dayKey) => {
  if (!schedulesData) return false;
  const restValue = '\u4f11';
  const value = schedulesData[dateKey] ?? schedulesData[dayKey];
  return !!value && value !== restValue;
};

// ============================================
// 安全/卫生自检
// ============================================

/**
 * 查询自检表列表
 * GET /api/self-inspections
 */
export const getSelfInspections = async (ctx) => {
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const { stationId, inspectionType, startDate, endDate, fillerId, positionName, fillerName, hasAbnormal, hasUnqualified, workTypeId } = ctx.query;
  const dataFilter = ctx.state.dataFilter;

  const where = {};
  const fillerWhere = {};

  const user = ctx.state.user;
  const privilegedRoles = ['safety_inspector', 'station_manager', 'deputy_manager', 'department_manager', 'admin'];
  const rectificationInclude = { model: SafetyRectification, as: 'rectification' };
  if (!privilegedRoles.includes(user.roleCode)) {
    rectificationInclude.where = { punished_person_id: user.id };
    rectificationInclude.required = true;
  }
  if (stationId) where.station_id = stationId;
  if (inspectionType) where.inspection_type = inspectionType;
  if (fillerId) where.filler_id = fillerId;
  if (startDate && endDate) where.inspection_date = { [Op.between]: [startDate, endDate] };
  // 工作性质筛选：work_type_ids 是 JSON 数组，使用 LIKE 模糊匹配
  if (workTypeId !== undefined && workTypeId !== null && workTypeId !== '') {
    const parsedWorkTypeId = Number(workTypeId);
    if (!Number.isNaN(parsedWorkTypeId)) {
      where[Op.and] = where[Op.and] || [];
      where[Op.and].push(
        literal(`JSON_CONTAINS(work_type_ids, CAST(${parsedWorkTypeId} AS JSON))`)
      );
    }
  }

  // 岗位筛选：需要先查询排班表获取符合岗位的用户ID
  if (positionName) {
    // 查询今天该岗位的排班人员
    const today = dayjs();
    const currentYear = today.year();
    const currentMonth = today.month() + 1;
    const currentDay = today.date();

    const scheduleWhere = {
      position_name: positionName,
      year: currentYear,
      month: currentMonth
    };

    const schedules = await Schedule.findAll({
      where: scheduleWhere,
      attributes: ['user_id', 'schedules']
    });

    // 筛选出今天有排班的用户ID
    const userIds = [];
    schedules.forEach(schedule => {
      const schedulesData = typeof schedule.schedules === 'string'
        ? JSON.parse(schedule.schedules)
        : schedule.schedules;
      if (schedulesData && schedulesData[currentDay]) {
        userIds.push(schedule.user_id);
      }
    });

    if (userIds.length > 0) {
      where.filler_id = { [Op.in]: userIds };
    } else {
      // 如果没有找到符合岗位的用户，返回空结果
      where.filler_id = -1;
    }
  }

  // 姓名筛选
  if (fillerName) {
    fillerWhere.real_name = { [Op.like]: `%${fillerName}%` };
  }

  // 检查是否筛选"未填写"
  const isNotFilledFilter = (hasAbnormal === '2' || hasAbnormal === 2) || (hasUnqualified === '2' || hasUnqualified === 2);

  // 如果筛选"未填写"，需要特殊处理
  if (isNotFilledFilter) {
    // 查询今日排班人员
    const today = dayjs().format('YYYY-MM-DD');
    const currentYear = dayjs().year();
    const currentMonth = dayjs().month() + 1;
    const currentDay = dayjs().date();

    // 构建场站筛选条件
    const scheduleStationWhere = {};
    if (stationId) {
      scheduleStationWhere.station_id = stationId;
    } else if (!dataFilter.all && dataFilter.stationIds?.length > 0) {
      scheduleStationWhere.station_id = { [Op.in]: dataFilter.stationIds };
    }

    // 查询今日排班
    const schedules = await Schedule.findAll({
      where: {
        ...scheduleStationWhere,
        year: currentYear,
        month: currentMonth
      },
      include: [
        { model: User, as: 'user', attributes: ['id', 'real_name', 'position_name'] },
        { model: Station, as: 'station', attributes: ['id', 'station_name'] }
      ]
    });

    // 提取今日有排班的用户
    const todayScheduledUsers = [];
    schedules.forEach(schedule => {
      const schedulesData = typeof schedule.schedules === 'string'
        ? JSON.parse(schedule.schedules)
        : schedule.schedules;

      if (schedulesData && schedulesData[currentDay]) {
        // 岗位筛选
        if (positionName && schedule.position_name !== positionName) {
          return;
        }
        // 姓名筛选
        if (fillerName && !schedule.user?.real_name?.includes(fillerName)) {
          return;
        }

        todayScheduledUsers.push({
          userId: schedule.user_id,
          stationId: schedule.station_id,
          positionName: schedule.position_name,
          realName: schedule.user?.real_name,
          stationName: schedule.station?.station_name
        });
      }
    });

    // 查询今日已提交自检的用户
    const submittedInspections = await SafetySelfInspection.findAll({
      where: {
        inspection_type: inspectionType,
        inspection_date: today
      },
      attributes: ['filler_id', 'station_id']
    });

    const submittedUserSet = new Set(
      submittedInspections.map(i => `${i.filler_id}-${i.station_id}`)
    );

    // 找出未提交自检的用户
    const notFilledUsers = todayScheduledUsers.filter(user =>
      !submittedUserSet.has(`${user.userId}-${user.stationId}`)
    );

    // 构造未填写的记录
    const notFilledRecords = notFilledUsers.map(user => ({
      id: null,
      recordCode: null,
      inspectionType: inspectionType,
      inspectionDate: today,
      filler: {
        id: user.userId,
        realName: user.realName,
        positionName: user.positionName
      },
      station: {
        id: user.stationId,
        stationName: user.stationName
      },
      submitTime: null,
      inspectionItems: [],
      hasAbnormal: null,
      hasUnqualified: null,
      isNotFilled: true // 标记为未填写
    }));

    // 分页处理
    const total = notFilledRecords.length;
    const startIndex = offset;
    const endIndex = Math.min(offset + limit, total);
    const paginatedRecords = notFilledRecords.slice(startIndex, endIndex);

    ctx.body = {
      code: 200,
      message: 'success',
      data: {
        list: paginatedRecords,
        total,
        page,
        pageSize
      }
    };
    return;
  }

  // 自检情况筛选
  if (hasAbnormal !== undefined && hasAbnormal !== null && hasAbnormal !== '') {
    // 通过检查 inspection_items 字段中是否有 status: 0 的项来判断是否有异常
    const hasAbnormalValue = parseInt(hasAbnormal);
    if (hasAbnormalValue === 1) {
      // 有异常：查找 inspection_items 中包含 "status":0 的记录
      where[Op.and] = where[Op.and] || [];
      where[Op.and].push(
        literal(`inspection_items REGEXP '"status"[[:space:]]*:[[:space:]]*0'`)
      );
    } else if (hasAbnormalValue === 0) {
      // 正常：查找 inspection_items 中不包含 "status":0 的记录
      where[Op.and] = where[Op.and] || [];
      where[Op.and].push(
        literal(`inspection_items NOT REGEXP '"status"[[:space:]]*:[[:space:]]*0'`)
      );
    }
  }

  // 卫生自检的不合格情况筛选
  if (hasUnqualified !== undefined && hasUnqualified !== null && hasUnqualified !== '') {
    const hasUnqualifiedValue = parseInt(hasUnqualified);
    if (hasUnqualifiedValue === 1) {
      // 有不合格：查找 inspection_items 中包含 "status":0 的记录
      where[Op.and] = where[Op.and] || [];
      where[Op.and].push(
        literal(`inspection_items REGEXP '"status"[[:space:]]*:[[:space:]]*0'`)
      );
    } else if (hasUnqualifiedValue === 0) {
      // 全部合格：查找 inspection_items 中不包含 "status":0 的记录
      where[Op.and] = where[Op.and] || [];
      where[Op.and].push(
        literal(`inspection_items NOT REGEXP '"status"[[:space:]]*:[[:space:]]*0'`)
      );
    }
  }

  // 数据权限过滤
  if (!dataFilter.all) {
    if (dataFilter.none) {
      where.filler_id = -1;
    } else {
      if (dataFilter.userId) {
        // 操作岗/维修岗：只能看自己的记录
        where.filler_id = dataFilter.userId;
      }

      if (!dataFilter.userId && dataFilter.stationIds?.length > 0) {
        const allowedStationIds = dataFilter.stationIds;
        if (stationId) {
          const parsedStationId = Number(stationId);
          if (!allowedStationIds.includes(parsedStationId)) {
            where.station_id = -1;
          } else {
            where.station_id = parsedStationId;
          }
        } else {
          where.station_id = { [Op.in]: allowedStationIds };
        }
      }

      if (dataFilter.departmentName) {
        fillerWhere.department_name = dataFilter.departmentName;
      }
    }
  }

  // 调试日志
  logger.info('getSelfInspections查询条件', {
    user: { id: user.id, roleCode: user.roleCode },
    dataFilter,
    where,
    queryParams: { stationId, inspectionType, fillerId, positionName, fillerName }
  });

  const result = await SafetySelfInspection.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'filler',
        attributes: ['id', 'real_name'],
        where: Object.keys(fillerWhere).length > 0 ? fillerWhere : undefined
      },
      { model: Station, as: 'station', attributes: ['id', 'station_name'] }
    ],
    offset, limit,
    order: [['inspection_date', 'DESC'], ['submit_time', 'DESC']]
  });

  // 为每条记录补充岗位信息（从排班表查询）
  if (result.rows.length > 0) {
    // 收集所有需要查询的年月和用户ID
    const yearMonthMap = new Map(); // key: 'year-month', value: Set of userIds
    result.rows.forEach(row => {
      if (row.inspection_date && row.filler_id) {
        const inspectionDay = dayjs(row.inspection_date);
        const year = inspectionDay.year();
        const month = inspectionDay.month() + 1;
        const key = `${year}-${month}`;
        if (!yearMonthMap.has(key)) {
          yearMonthMap.set(key, { year, month, userIds: new Set() });
        }
        yearMonthMap.get(key).userIds.add(row.filler_id);
      }
    });

    // 查询所有需要的排班数据
    const allSchedules = [];
    for (const [key, data] of yearMonthMap) {
      const schedules = await Schedule.findAll({
        where: {
          user_id: { [Op.in]: Array.from(data.userIds) },
          year: data.year,
          month: data.month
        },
        attributes: ['user_id', 'position_name', 'schedules', 'year', 'month']
      });
      allSchedules.push(...schedules);
    }

    // 为每条记录添加岗位信息
    result.rows.forEach(row => {
      if (row.filler && row.inspection_date) {
        const inspectionDay = dayjs(row.inspection_date);
        const year = inspectionDay.year();
        const month = inspectionDay.month() + 1;
        const dateKey = inspectionDay.format('YYYY-MM-DD');

        let positionName = '-';

        // 遍历所有排班记录，找到匹配日期的排班
        for (const schedule of allSchedules) {
          if (schedule.user_id === row.filler_id &&
              schedule.year === year &&
              schedule.month === month) {
            const schedulesData = typeof schedule.schedules === 'string'
              ? JSON.parse(schedule.schedules)
              : schedule.schedules;

            // 使用完整日期字符串作为key查找
            if (schedulesData && schedulesData[dateKey]) {
              positionName = schedule.position_name;
              break; // 找到后立即退出循环
            }
          }
        }

        // 使用 setDataValue 方法确保字段正确设置
        row.filler.setDataValue('positionName', positionName);
      }
    });
  }

  // 手动序列化数据，确保 positionName 字段包含在返回结果中
  const serializedRows = result.rows.map(row => {
    const rowData = row.toJSON();
    // 确保filler对象存在并添加positionName
    if (rowData.filler) {
      const positionName = row.filler.dataValues?.positionName ||
                          row.filler.getDataValue?.('positionName') ||
                          '-';
      rowData.filler.positionName = positionName;
    }
    return rowData;
  });

  // 调试日志：检查序列化后的filler数据
  if (serializedRows.length > 0 && serializedRows[0].filler) {
    logger.info('序列化后的filler数据示例', {
      fillerId: serializedRows[0].filler.id,
      fillerData: serializedRows[0].filler
    });
  }

  ctx.body = {
    code: 200,
    message: 'success',
    data: {
      list: serializedRows,
      total: result.count,
      page,
      pageSize
    }
  };
};

/**
 * 提交自检表
 * POST /api/self-inspections
 */
export const createSelfInspection = async (ctx) => {
  const { inspectionType, stationId, inspectionDate, inspectionItems, photoUrls, workTypeIds } = ctx.request.body;
  const user = ctx.state.user;
  const resolvedStationId = stationId || user?.lastStationId || user?.stations?.[0]?.id || null;

  if (!inspectionType) {
    throw createError(400, '参数不完整');
  }

  // 获取场站的截止时间
  const station = await Station.findByPk(resolvedStationId);
  const deadline = station?.check_in_time || '08:10:00';

  const submitTime = new Date();
  const overdueMinutes = calculateOverdueMinutes(deadline, submitTime);
  const isOverdue = overdueMinutes > 0;

  const inspection = await SafetySelfInspection.create({
    record_code: generateRecordCode('SI'),
    inspection_type: inspectionType,
    project_id: 0, // 默认项目ID，系统已移除项目概念
    station_id: resolvedStationId,
    filler_id: user.id,
    filler_name: user.realName,
    inspection_date: inspectionDate || dayjs().format('YYYY-MM-DD'),
    work_type_ids: workTypeIds || [],
    inspection_items: inspectionItems,
    photo_urls: JSON.stringify(photoUrls || []),
    submit_time: submitTime,
    is_overdue: isOverdue ? 1 : 0,
    overdue_minutes: isOverdue ? overdueMinutes : 0
  });

  ctx.body = {
    code: 200,
    message: '自检表提交成功',
    data: {
      id: inspection.id,
      isOverdue,
      overdueMinutes: isOverdue ? overdueMinutes : 0
    }
  };
};

/**
 * 查询我的自检表
 * GET /api/self-inspections/my
 */
export const getMySelfInspections = async (ctx) => {
  const { inspectionType, startDate, endDate } = ctx.query;
  const userId = ctx.state.user.id;

  const where = { filler_id: userId };
  if (inspectionType) where.inspection_type = inspectionType;
  if (startDate && endDate) where.inspection_date = { [Op.between]: [startDate, endDate] };

  const inspections = await SafetySelfInspection.findAll({
    where,
    include: [
      { model: Station, as: 'station', attributes: ['id', 'station_name'] }
    ],
    order: [['inspection_date', 'DESC']]
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: inspections
  };
};

/**
 * 获取今日未填写人员
 * GET /api/self-inspections/overdue
 */
export const getOverdueUsers = async (ctx) => {
  const { stationId, inspectionType } = ctx.query;
  const today = dayjs().format('YYYY-MM-DD');

  // 获取今日已填写的人员
  const where = { inspection_date: today };
  if (stationId) where.station_id = stationId;
  if (inspectionType) where.inspection_type = inspectionType;

  const completedInspections = await SafetySelfInspection.findAll({
    where,
    attributes: ['filler_id']
  });
  const completedUserIds = completedInspections.map(i => i.filler_id);

  // 获取该场站的所有人员（需要结合排班表查询）
  // 这里简化处理，返回已完成的数量
  ctx.body = {
    code: 200,
    message: 'success',
    data: {
      completedCount: completedUserIds.length,
      completedUserIds
    }
  };
};

// ============================================
// 安全/卫生他检
// ============================================

/**
 * 查询他检表列表
 * GET /api/other-inspections
 */
export const getOtherInspections = async (ctx) => {
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const { stationId, inspectionType, startDate, endDate, workTypeIds } = ctx.query;
  const dataFilter = ctx.state.dataFilter;

  const where = {};

  const user = ctx.state.user;
  const privilegedRoles = ['safety_inspector', 'station_manager', 'deputy_manager', 'department_manager', 'admin'];
  const rectificationInclude = { model: SafetyRectification, as: 'rectification' };
  if (!privilegedRoles.includes(user.roleCode)) {
    rectificationInclude.where = { punished_person_id: user.id };
    rectificationInclude.required = true;
  }
  if (stationId) where.station_id = stationId;
  if (inspectionType) where.inspection_type = inspectionType;
  if (startDate && endDate) where.inspection_date = { [Op.between]: [startDate, endDate] };
  if (workTypeIds) {
    const ids = String(workTypeIds)
      .split(',')
      .map(id => Number(id))
      .filter(id => !Number.isNaN(id));
    if (ids.length > 0) {
      const orConditions = ids
        .map(id => `JSON_CONTAINS(work_type_ids, CAST(${id} AS JSON))`)
        .join(' OR ');
      where[Op.and] = where[Op.and] || [];
      where[Op.and].push(literal(`(${orConditions})`));
    }
  }

  const isSafetyInspector = user?.roleCode === 'safety_inspector' || user?.baseRoleCode === 'safety_inspector';
  if (!dataFilter.all && !isSafetyInspector && dataFilter.stationIds?.length > 0) {
    const allowedStationIds = dataFilter.stationIds;
    if (stationId) {
      const parsedStationId = Number(stationId);
      if (!allowedStationIds.includes(parsedStationId)) {
        where.station_id = -1;
      } else {
        where.station_id = parsedStationId;
      }
    } else {
      where.station_id = { [Op.in]: allowedStationIds };
    }
  }

  const result = await SafetyOtherInspection.findAndCountAll({
    where,
    include: [
      { model: User, as: 'inspector', attributes: ['id', 'real_name'] },
      { model: Station, as: 'station', attributes: ['id', 'station_name'] }
    ],
    offset, limit,
    order: [['inspection_date', 'DESC']]
  });

  if (result.rows.length > 0) {
    const missingRows = result.rows.filter(row =>
      !row.station_id && row.inspected_user_id && row.inspection_date
    );
    if (missingRows.length > 0) {
      const yearMonthMap = new Map();
      missingRows.forEach(row => {
        const inspectionDay = dayjs(row.inspection_date);
        const year = inspectionDay.year();
        const month = inspectionDay.month() + 1;
        const key = `${year}-${month}`;
        if (!yearMonthMap.has(key)) {
          yearMonthMap.set(key, { year, month, userIds: new Set() });
        }
        yearMonthMap.get(key).userIds.add(row.inspected_user_id);
      });

      const scheduleBuckets = new Map();
      for (const [key, data] of yearMonthMap) {
        const schedules = await Schedule.findAll({
          where: {
            user_id: { [Op.in]: Array.from(data.userIds) },
            year: data.year,
            month: data.month
          },
          attributes: ['user_id', 'station_id', 'schedules', 'year', 'month']
        });
        scheduleBuckets.set(key, schedules);
      }

      const resolvedStationIds = new Set();
      missingRows.forEach(row => {
        const inspectionDay = dayjs(row.inspection_date);
        const year = inspectionDay.year();
        const month = inspectionDay.month() + 1;
        const dateKey = inspectionDay.format('YYYY-MM-DD');
        const dayKey = String(inspectionDay.date());
        const key = `${year}-${month}`;
        const schedules = scheduleBuckets.get(key) || [];
        for (const schedule of schedules) {
          if (schedule.user_id !== row.inspected_user_id) continue;
          const schedulesData = parseSchedulesData(schedule.schedules);
          if (hasScheduleForDate(schedulesData, dateKey, dayKey)) {
            row.setDataValue('station_id', schedule.station_id);
            resolvedStationIds.add(schedule.station_id);
            break;
          }
        }
      });

      if (resolvedStationIds.size > 0) {
        const stations = await Station.findAll({
          where: { id: { [Op.in]: Array.from(resolvedStationIds) } },
          attributes: ['id', 'station_name']
        });
        const stationMap = new Map(stations.map(s => [s.id, s]));
        missingRows.forEach(row => {
          const resolvedId = row.getDataValue('station_id');
          if (resolvedId && stationMap.has(resolvedId)) {
            row.setDataValue('station', stationMap.get(resolvedId));
          }
        });
      }
    }
  }

  ctx.body = {
    code: 200,
    message: 'success',
    data: formatPaginationResponse(result, page, pageSize)
  };
};

/**
 * 填写他检表
 * POST /api/other-inspections
 */
export const createOtherInspection = async (ctx) => {
  const { inspectionType, stationId, inspectionDate, inspectedUserId, inspectedUserName, violationDescription, isQualified, unqualifiedItems, photoUrls, projectId, workTypeIds, inspectionItems, remark } = ctx.request.body;
  const user = ctx.state.user;

  // 如果是安全他检，inspectionType 默认为 'safety'
  const resolvedInspectionType = inspectionType || 'safety';

  let resolvedStationId = stationId;
  if (!resolvedStationId && inspectedUserId) {
    const inspectionDay = dayjs(inspectionDate || dayjs().format('YYYY-MM-DD'));
    const year = inspectionDay.year();
    const month = inspectionDay.month() + 1;
    const dateKey = inspectionDay.format('YYYY-MM-DD');
    const dayKey = String(inspectionDay.date());
    const schedules = await Schedule.findAll({
      where: { user_id: inspectedUserId, year, month },
      attributes: ['station_id', 'schedules']
    });
    for (const schedule of schedules) {
      const schedulesData = parseSchedulesData(schedule.schedules);
      if (hasScheduleForDate(schedulesData, dateKey, dayKey)) {
        resolvedStationId = schedule.station_id;
        break;
      }
    }
  }

  // 解析 projectId，兼容移除项目后的场景
  const resolvedProjectId = projectId || user.lastProjectId || 0;

  const inspection = await SafetyOtherInspection.create({
    record_code: generateRecordCode('OI'),
    inspection_type: resolvedInspectionType,
    project_id: resolvedProjectId,
    station_id: resolvedStationId,
    inspector_id: user.id,
    inspector_name: user.realName,
    inspection_date: inspectionDate || dayjs().format('YYYY-MM-DD'),
    inspected_user_id: inspectedUserId,
    inspected_user_name: inspectedUserName,
    work_type_ids: workTypeIds || [],
    inspection_items: inspectionItems || [],
    violation_description: violationDescription,
    remark: remark,
    is_qualified: isQualified ? 1 : 0,
    unqualified_items: unqualifiedItems,
    photo_urls: JSON.stringify(photoUrls || [])
  });

  // 通知相关人员（安全他检/卫生他检）
  try {
    const recipients = new Map();
    const inspectedUser = inspectedUserId
      ? await User.findByPk(inspectedUserId, {
        include: [{ model: Role, as: 'role', attributes: ['role_code'] }],
        attributes: ['id', 'real_name', 'username']
      })
      : null;
    const inspectedRole = inspectedUser?.role?.role_code || '';

    if (['operator', 'maintenance'].includes(inspectedRole)) {
      recipients.set(inspectedUser.id, inspectedUser);
    }

    if (resolvedStationId) {
      const stationManagers = await User.findAll({
        include: [
          { model: Role, as: 'role', where: { role_code: 'station_manager' }, attributes: [] },
          { model: Station, as: 'stations', where: { id: resolvedStationId }, attributes: ['id'], through: { attributes: [] }, required: true }
        ],
        attributes: ['id', 'real_name', 'username']
      });
      stationManagers.forEach(manager => {
        recipients.set(manager.id, manager);
      });
    }

    const departmentManagers = await User.findAll({
      include: [
        { model: Role, as: 'role', where: { role_code: { [Op.in]: ['department_manager', 'deputy_manager'] } }, attributes: [] }
      ],
      attributes: ['id', 'real_name', 'username']
    });
    departmentManagers.forEach(manager => {
      recipients.set(manager.id, manager);
    });

    if (recipients.size > 0) {
      const stationRecord = resolvedStationId ? await Station.findByPk(resolvedStationId) : null;
      const stationNameText = stationRecord?.station_name || '';
      const isHygiene = resolvedInspectionType === 'hygiene';
      const title = isHygiene ? '卫生他检提醒' : '安全他检提醒';
      const relatedType = isHygiene ? 'hygiene_other_inspection' : 'safety_other_inspection';
      const content = [
        `表单编号：${inspection.record_code}`,
        stationNameText ? `场站：${stationNameText}` : null,
        inspectedUserName ? `被检人员：${inspectedUserName}` : null
      ].filter(Boolean).join('\n');

      await Notification.bulkCreate(
        Array.from(recipients.values()).map(receiver => ({
          notify_type: 'system',
          title,
          content,
          receiver_id: receiver.id,
          receiver_name: receiver.real_name || receiver.username,
          related_id: inspection.id,
          related_type: relatedType
        }))
      );
    }
  } catch (e) {
    logger.error('发送他检通知失败', e);
  }

  ctx.body = {
    code: 200,
    message: '他检表提交成功',
    data: { id: inspection.id }
  };
};

// ============================================
// 安全隐患检查（公司级安全员）
// ============================================

/**
 * 查询安全隐患检查记录
 * GET /api/hazard-inspections
 */
export const getHazardInspections = async (ctx) => {
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const { stationName, hazardCategory, status, startDate, endDate } = ctx.query;
  const dataFilter = ctx.state.dataFilter;

  const where = {};

  const user = ctx.state.user;
  const privilegedRoles = ['safety_inspector', 'station_manager', 'deputy_manager', 'department_manager', 'admin'];
  const allAccessRoles = ['safety_inspector', 'deputy_manager', 'department_manager', 'senior_management', 'admin'];
  const roleCode = user?.baseRoleCode || user?.roleCode;
  const rectificationInclude = { model: SafetyRectification, as: 'rectification' };
  if (!privilegedRoles.includes(user.roleCode)) {
    rectificationInclude.where = { punished_person_id: user.id };
    rectificationInclude.required = true;
  }
  if (stationName) where.station_name = { [Op.like]: `%${stationName}%` };
  if (hazardCategory) where.hazard_category = hazardCategory;
  if (status) where.status = status;
  if (startDate && endDate) where.inspection_date = { [Op.between]: [startDate, endDate] };
  if (!allAccessRoles.includes(roleCode) && dataFilter?.stationIds?.length > 0) {
    where.station_id = { [Op.in]: dataFilter.stationIds };
  }

  const result = await SafetyHazardInspection.findAndCountAll({
    where,
    include: [
      { model: User, as: 'inspector', attributes: ['id', 'real_name'] },
      { model: User, as: 'handler', attributes: ['id', 'real_name'] },
      rectificationInclude
    ],
    offset, limit,
    order: [['inspection_date', 'DESC']]
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: formatPaginationResponse(result, page, pageSize)
  };
};

/**
 * 填写安全隐患检查记录（安全员发起）
 * POST /api/hazard-inspections
 */
export const createHazardInspection = async (ctx) => {
  const { stationId, stationName, hazardCategory, hazardDescription, photoUrls, location } = ctx.request.body;
  const user = ctx.state.user;

  let resolvedStationId = stationId || user?.lastStationId || user?.stations?.[0]?.id || null;
  let stationRecord = null;
  if (!resolvedStationId && stationName) {
    stationRecord = await Station.findOne({ where: { station_name: stationName } });
    resolvedStationId = stationRecord?.id || null;
  }
  if (resolvedStationId && !stationRecord) {
    stationRecord = await Station.findByPk(resolvedStationId);
  }
  if (!resolvedStationId) {
    throw createError(400, '场站不能为空');
  }
  const resolvedStationName = stationName || stationRecord?.station_name || '';

  const localNow = dayjs().utcOffset(8);
  const inspection = await SafetyHazardInspection.create({
    record_code: generateRecordCode('HI'),
    inspection_date: localNow.format('YYYY-MM-DD'),
    submit_time: localNow.format('HH:mm:ss'),
    station_id: resolvedStationId,
    station_name: resolvedStationName,
    hazard_category: hazardCategory,
    hazard_description: hazardDescription,
    photo_urls: JSON.stringify(photoUrls || []),
    location,
    inspector_id: user.id,
    inspector_name: user.realName,
    status: 'pending'  // 待整改
  });
  // 通知场站对应站长 & 部门经理/副经理
  try {
    const receivers = new Map();

    if (resolvedStationId) {
      const stationManagers = await User.findAll({
        include: [
          { model: Role, as: 'role', where: { role_code: 'station_manager' }, attributes: [] },
          { model: Station, as: 'stations', where: { id: resolvedStationId }, attributes: ['id'], through: { attributes: [] }, required: true }
        ],
        attributes: ['id', 'real_name', 'username']
      });
      stationManagers.forEach(manager => {
        receivers.set(manager.id, manager);
      });
    }

    const departmentManagers = await User.findAll({
      include: [
        { model: Role, as: 'role', where: { role_code: { [Op.in]: ['department_manager', 'deputy_manager'] } }, attributes: [] }
      ],
      attributes: ['id', 'real_name', 'username']
    });
    departmentManagers.forEach(manager => {
      receivers.set(manager.id, manager);
    });

    const content = [
      `表单编号：${inspection.record_code}`,
      `场站：${resolvedStationName}`,
      `隐患类别：${hazardCategory}`,
      `隐患描述：${hazardDescription || ''}`
    ].join('\n');

    if (receivers.size > 0) {
      await Notification.bulkCreate(
        Array.from(receivers.values()).map(manager => ({
          notify_type: 'system',
          title: '安全隐患待整改',
          content,
          receiver_id: manager.id,
          receiver_name: manager.real_name || manager.username,
          related_id: inspection.id,
          related_type: 'hazard_inspection'
        }))
      );
    }
  } catch (e) {
    logger.error('发送站长通知失败', e);
  }

  ctx.body = {
    code: 200,
    message: '安全隐患检查记录提交成功',
    data: { id: inspection.id }
  };
};

// ============================================
// 安全隐患整改审批单
// ============================================

/**
 * 查询整改审批单列表
 * GET /api/safety-rectifications
 */
/**
 * 更新安全隐患检查记录
 * PUT /api/hazard-inspections/:id
 */
export const updateHazardInspection = async (ctx) => {
  const { id } = ctx.params;
  const { inspectionDate, stationName, stationType, hazardCategory, hazardDescription, photoUrls, location } = ctx.request.body;

  const inspection = await SafetyHazardInspection.findByPk(id);
  if (!inspection) throw createError(404, '安全隐患检查记录不存在');

  await inspection.update({
    inspection_date: inspectionDate || inspection.inspection_date,
    station_name: stationName || inspection.station_name,
    station_type: stationType ?? inspection.station_type,
    hazard_category: hazardCategory || inspection.hazard_category,
    hazard_description: hazardDescription ?? inspection.hazard_description,
    photo_urls: JSON.stringify(photoUrls || []),
    location: location ?? inspection.location
  });

  ctx.body = { code: 200, message: '更新成功', data: null };
};

/**
 * 删除安全隐患检查记录
 * DELETE /api/hazard-inspections/:id
 */
export const deleteHazardInspection = async (ctx) => {
  const { id } = ctx.params;

  const inspection = await SafetyHazardInspection.findByPk(id, {
    include: [{ model: SafetyRectification, as: 'rectification' }]
  });
  if (!inspection) throw createError(404, '安全隐患检查记录不存在');
  if (inspection.rectification) {
    throw createError(400, '已填写整改信息的隐患不可删除');
  }

  await inspection.destroy();
  ctx.body = { code: 200, message: '删除成功', data: null };
};
export const getSafetyRectifications = async (ctx) => {
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const { status } = ctx.query;

  const where = {};

  const user = ctx.state.user;
  const privilegedRoles = ['safety_inspector', 'station_manager', 'deputy_manager', 'department_manager', 'admin'];
  // 非特权角色只能看到自己被处罚的记录
  if (!privilegedRoles.includes(user.roleCode)) {
    where.punished_person_id = user.id;
  }
  if (status) where.status = status;

  const result = await SafetyRectification.findAndCountAll({
    where,
    include: [
      { model: SafetyHazardInspection, as: 'inspection' },
      { model: User, as: 'handler', attributes: ['id', 'real_name'] },
      { model: User, as: 'punishedPerson', attributes: ['id', 'real_name'] }
    ],
    offset, limit,
    order: [['created_at', 'DESC']]
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: formatPaginationResponse(result, page, pageSize)
  };
};

/**
 * 创建整改审批单（站长填写整改信息）
 * POST /api/safety-rectifications
 */
export const createSafetyRectification = async (ctx) => {
  const { inspectionId, rootCause, rootCauseCategory, rectificationMeasures, punishedPersonId, punishedPersonName, punishmentResult, isCompleted, completionPhotos } = ctx.request.body;
  const user = ctx.state.user;

  const inspection = await SafetyHazardInspection.findByPk(inspectionId);
  if (!inspection) throw createError(404, '安全隐患检查记录不存在');

  const rectification = await SafetyRectification.create({
    record_code: generateRecordCode('SR'),
    inspection_id: inspectionId,
    handler_id: user.id,          // 办理人为当前站长
    handler_name: user.realName,
    responsible_person_id: user.id,
    responsible_person_name: user.realName,
    root_cause: rootCause,
    rectification_measures: rectificationMeasures,
    punished_person_id: punishedPersonId,
    punished_person_name: punishedPersonName,
    punishment_result: punishmentResult,
    is_completed: isCompleted,
    completion_photos: JSON.stringify(completionPhotos || []),
    root_cause_category: rootCauseCategory || null,
    status: 'pending'  // 待复核
  });

  // 通知被处罚人查看表单
  if (punishedPersonId) {
    try {
      const punishedUser = await User.findByPk(punishedPersonId, { attributes: ['id', 'real_name', 'username'] });
      if (punishedUser) {
        const content = [
          `表单编号：${inspection.record_code}`,
          `场站：${inspection.station_name}`,
          '站长已提交整改信息，请查看表单情况。'
        ].join('\n');

        await Notification.create({
          notify_type: 'system',
          title: '安全隐患整改通知',
          content,
          receiver_id: punishedUser.id,
          receiver_name: punishedUser.real_name || punishedUser.username,
          related_id: rectification.id,
          related_type: 'safety_rectification'
        });
      }
    } catch (e) {
      logger.error('发送被处罚人通知失败', e);
    }
  }

  // 更新检查记录状态为"已整改"
  await inspection.update({ status: 'rectified' });

  ctx.body = {
    code: 200,
    message: '整改信息提交成功',
    data: { id: rectification.id }
  };
};

/**
 * 编辑整改审批单
 * PUT /api/safety-rectifications/:id
 */
export const updateSafetyRectification = async (ctx) => {
  const { id } = ctx.params;
  const {
    rootCause,
    rootCauseCategory,
    rectificationMeasures,
    punishedPersonId,
    punishedPersonName,
    punishmentResult,
    isCompleted,
    completionPhotos
  } = ctx.request.body;

  const rectification = await SafetyRectification.findByPk(id);
  if (!rectification) throw createError(404, '整改审批单不存在');

  const updateData = {};
  if (rootCause !== undefined) updateData.root_cause = rootCause;
  if (rootCauseCategory !== undefined) updateData.root_cause_category = rootCauseCategory;
  if (rectificationMeasures !== undefined) updateData.rectification_measures = rectificationMeasures;
  if (punishedPersonId !== undefined) updateData.punished_person_id = punishedPersonId;
  if (punishedPersonName !== undefined) updateData.punished_person_name = punishedPersonName;
  if (punishmentResult !== undefined) updateData.punishment_result = punishmentResult;
  if (isCompleted !== undefined) updateData.is_completed = isCompleted;
  if (completionPhotos !== undefined) updateData.completion_photos = JSON.stringify(completionPhotos || []);

  await rectification.update(updateData);

  ctx.body = { code: 200, message: '更新成功', data: null };
};

/**
 * 安全员复核
 * PUT /api/safety-rectifications/:id/review
 */
export const reviewSafetyRectification = async (ctx) => {
  const { id } = ctx.params;
  const user = ctx.state.user;
  const { reviewConfirmed, completionScore } = ctx.request.body || {};

  const rectification = await SafetyRectification.findByPk(id);
  if (!rectification) throw createError(404, '整改单不存在');

  if (reviewConfirmed !== '是') throw createError(400, '请确认复核');
  const score = Number(completionScore);
  if (!Number.isFinite(score) || score <= 0) throw createError(400, '请填写整改完成评分');

  await rectification.update({
    status: 'approved',
    approver_id: user.id,
    approver_name: user.realName,
    approve_time: new Date(),
    completion_score: score
  });

  // 更新检查记录状态为"已复核"
  const inspection = await SafetyHazardInspection.findByPk(rectification.inspection_id);
  if (inspection) {
    await inspection.update({ status: 'reviewed' });
  }

  ctx.body = { code: 200, message: '复核通过', data: null };
};

export default {
  getSelfInspections, createSelfInspection, getMySelfInspections, getOverdueUsers,
  getOtherInspections, createOtherInspection,
  getHazardInspections, createHazardInspection, updateHazardInspection,
  deleteHazardInspection,
  getSafetyRectifications, createSafetyRectification, updateSafetyRectification, reviewSafetyRectification
};
