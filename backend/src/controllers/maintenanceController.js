import { Op } from 'sequelize';
import { MaintenancePlan, MaintenanceRecord, FaultReport, RepairRecord, MaterialRequisition, User, Station, Notification } from '../models/index.js';
import { createError } from '../middlewares/error.js';
import { getPagination, formatPaginationResponse, getOrderBy, generateRecordCode } from '../utils/helpers.js';
import dayjs from 'dayjs';

/**
 * 根据周期类型计算下次保养日期
 */
const calculateNextMaintenanceDate = (baseDate, cycleType, cycleValue = 1) => {
  let nextDate = dayjs(baseDate);
  switch (cycleType) {
    case 'daily':
      nextDate = nextDate.add(cycleValue, 'day');
      break;
    case 'weekly':
      nextDate = nextDate.add(cycleValue, 'week');
      break;
    case 'monthly':
      nextDate = nextDate.add(cycleValue, 'month');
      break;
    case 'quarterly':
      nextDate = nextDate.add(cycleValue * 3, 'month');
      break;
    case 'yearly':
      nextDate = nextDate.add(cycleValue, 'year');
      break;
    default:
      nextDate = nextDate.add(cycleValue || 30, 'day');
  }
  return nextDate.format('YYYY-MM-DD');
};

const fillDispatchByNames = async (records) => {
  const list = Array.isArray(records) ? records : [records];
  const ids = new Set();

  list.forEach((record) => {
    const dispatchBy = record.dispatch_by;
    const dispatchName = record.dispatch_by_name;
    const needsFill = !dispatchName || dispatchName === dispatchBy || dispatchName === String(dispatchBy);
    if (dispatchBy && needsFill) {
      ids.add(dispatchBy);
    }
  });

  if (!ids.size) return;

  const users = await User.findAll({
    where: { id: { [Op.in]: Array.from(ids) } },
    attributes: ['id', 'real_name', 'username']
  });
  const nameMap = new Map(
    users.map(user => [user.id, user.real_name || user.username || ''])
  );

  list.forEach((record) => {
    const dispatchBy = record.dispatch_by;
    const dispatchName = record.dispatch_by_name;
    const needsFill = !dispatchName || dispatchName === dispatchBy || dispatchName === String(dispatchBy);
    if (!dispatchBy || !needsFill) return;
    const resolved = nameMap.get(dispatchBy);
    if (resolved) {
      record.dispatch_by_name = resolved;
    }
  });
};

// ============================================
// 保养计划
// ============================================

/**
 * 查询保养计划列表
 * GET /api/maintenance-plans
 */
export const getMaintenancePlans = async (ctx) => {
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const order = getOrderBy(ctx.query);
  const { stationId, status, equipmentName } = ctx.query;
  const dataFilter = ctx.state.dataFilter;

  const where = {};

  if (stationId) where.station_id = stationId;
  if (status) where.status = status;
  if (equipmentName) where.equipment_name = { [Op.like]: `%${equipmentName}%` };

  if (!dataFilter.all && dataFilter.stationIds?.length > 0) {
    where.station_id = { [Op.in]: dataFilter.stationIds };
  }

  const result = await MaintenancePlan.findAndCountAll({
    where,
    include: [
      { model: Station, as: 'station', attributes: ['id', 'station_name'] }
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
 * 新增保养计划
 * POST /api/maintenance-plans
 */
export const createMaintenancePlan = async (ctx) => {
  const { stationId, equipmentName, equipmentCode, cycleType, cycleValue, maintenanceContent, assignedUserId, assignedUserName, startDate } = ctx.request.body;

  if (!equipmentName || !cycleType) {
    throw createError(400, '参数不完整');
  }

  const nextMaintenanceDate = calculateNextMaintenanceDate(startDate, cycleType, cycleValue || 1);

  const plan = await MaintenancePlan.create({
    plan_code: generateRecordCode('MP'),
    station_id: stationId,
    equipment_name: equipmentName,
    equipment_code: equipmentCode,
    cycle_type: cycleType,
    cycle_value: cycleValue || 1,
    maintenance_content: maintenanceContent,
    assigned_user_id: assignedUserId,
    assigned_user_name: assignedUserName,
    start_date: startDate,
    next_maintenance_date: nextMaintenanceDate,
    status: 'active',
    created_by: ctx.state.user.id
  });

  ctx.body = {
    code: 200,
    message: '保养计划创建成功',
    data: { id: plan.id }
  };
};

/**
 * 编辑保养计划
 * PUT /api/maintenance-plans/:id
 */
export const updateMaintenancePlan = async (ctx) => {
  const { id } = ctx.params;
  const updateData = ctx.request.body;

  const plan = await MaintenancePlan.findByPk(id);
  if (!plan) throw createError(404, '保养计划不存在');

  await plan.update(updateData);

  ctx.body = { code: 200, message: '更新成功', data: null };
};

/**
 * 删除保养计划
 * DELETE /api/maintenance-plans/:id
 */
export const deleteMaintenancePlan = async (ctx) => {
  const { id } = ctx.params;
  const plan = await MaintenancePlan.findByPk(id);
  if (!plan) throw createError(404, '保养计划不存在');
  await plan.destroy();
  ctx.body = { code: 200, message: '删除成功', data: null };
};

// ============================================
// 保养记录
// ============================================

/**
 * 查询保养记录列表
 * GET /api/maintenance-records
 */
export const getMaintenanceRecords = async (ctx) => {
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const order = getOrderBy(ctx.query);
  const { stationId, status, startDate, endDate } = ctx.query;
  const dataFilter = ctx.state.dataFilter;

  const where = {};
  if (stationId) where.station_id = stationId;
  if (status) where.status = status;
  if (startDate && endDate) where.maintenance_date = { [Op.between]: [startDate, endDate] };

  if (!dataFilter.all && dataFilter.stationIds?.length > 0) {
    where.station_id = { [Op.in]: dataFilter.stationIds };
  }

  const result = await MaintenanceRecord.findAndCountAll({
    where,
    include: [
      { model: MaintenancePlan, as: 'plan' },
      { model: User, as: 'maintainer', attributes: ['id', 'real_name'] }
    ],
    offset, limit, order
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: formatPaginationResponse(result, page, pageSize)
  };
};

/**
 * 填写保养记录
 * POST /api/maintenance-records
 */
export const createMaintenanceRecord = async (ctx) => {
  const { planId, stationId, equipmentName, equipmentCode, maintenanceDate, maintenanceContent, result, issueDescription, handlingMeasures, photoUrls, workHours } = ctx.request.body;
  const user = ctx.state.user;

  const record = await MaintenanceRecord.create({
    record_code: generateRecordCode('MR'),
    plan_id: planId,
    station_id: stationId,
    equipment_name: equipmentName,
    equipment_code: equipmentCode,
    maintenance_date: maintenanceDate,
    maintainer_id: user.id,
    maintainer_name: user.realName,
    maintenance_content: maintenanceContent,
    result: result || 'normal',
    issue_description: issueDescription,
    handling_measures: handlingMeasures,
    photo_urls: JSON.stringify(photoUrls || []),
    work_hours: workHours,
    status: 'pending'
  });

  // 更新保养计划的最后保养日期和下次保养日期
  if (planId) {
    const plan = await MaintenancePlan.findByPk(planId);
    if (plan) {
      const nextMaintenanceDate = calculateNextMaintenanceDate(maintenanceDate, plan.cycle_type, plan.cycle_value);
      await plan.update({
        last_maintenance_date: maintenanceDate,
        next_maintenance_date: nextMaintenanceDate
      });
    }
  }

  ctx.body = {
    code: 200,
    message: '保养记录提交成功',
    data: { id: record.id }
  };
};

// ============================================
// 故障上报
// ============================================

/**
 * 查询故障上报单列表
 * GET /api/fault-reports
 */
export const getFaultReports = async (ctx) => {
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const order = getOrderBy(ctx.query);
  const { stationId, status } = ctx.query;
  const dataFilter = ctx.state.dataFilter;

  const where = {};
  if (stationId) where.station_id = stationId;
  if (status) where.status = status;

  if (!dataFilter.all && dataFilter.stationIds?.length > 0) {
    where.station_id = { [Op.in]: dataFilter.stationIds };
  }

  const result = await FaultReport.findAndCountAll({
    where,
    include: [
      { model: User, as: 'reporter', attributes: ['id', 'real_name'] },
      { model: User, as: 'assignee', attributes: ['id', 'real_name'] },
      { model: RepairRecord, as: 'repairRecord' }
    ],
    offset, limit, order
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: formatPaginationResponse(result, page, pageSize)
  };
};

/**
 * 上报故障
 * POST /api/fault-reports
 */
export const createFaultReport = async (ctx) => {
  const { equipmentCode, equipmentName, installationLocation, faultDate, faultTime, faultDescription, stationId } = ctx.request.body;
  const user = ctx.state.user;

  if (!equipmentName || !faultDescription) {
    throw createError(400, '设备名称和故障描述不能为空');
  }

  const report = await FaultReport.create({
    report_code: generateRecordCode('FR'),
    equipment_code: equipmentCode,
    equipment_name: equipmentName,
    installation_location: installationLocation,
    fault_date: faultDate || dayjs().format('YYYY-MM-DD'),
    fault_time: faultTime || dayjs().format('HH:mm:ss'),
    reporter_id: user.id,
    reporter_name: user.realName,
    fault_description: faultDescription,
    station_id: stationId,
    status: 'pending'
  });

  ctx.body = {
    code: 200,
    message: '故障上报成功',
    data: { id: report.id, reportCode: report.report_code }
  };
};

/**
 * 站长派发维修
 * POST /api/fault-reports/:id/assign
 */
export const assignFaultReport = async (ctx) => {
  const { id } = ctx.params;
  const { maintenanceUserId, maintenanceUserName } = ctx.request.body;
  const user = ctx.state.user;

  const report = await FaultReport.findByPk(id);
  if (!report) throw createError(404, '故障上报单不存在');

  await report.update({
    status: 'assigned',
    assigned_to: maintenanceUserId,
    assigned_by: user.id,
    assigned_at: new Date()
  });

  ctx.body = { code: 200, message: '派发成功', data: null };
};

// ============================================
// 维修记录单 - 完整工作流
// ============================================

/**
 * 查询维修记录列表
 * GET /api/repair-records
 */
export const getRepairRecords = async (ctx) => {
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const order = getOrderBy(ctx.query);
  const { status, stationId, repairPersonId, reporterId, equipmentName, urgencyLevel, repairPersonName } = ctx.query;
  const dataFilter = ctx.state.dataFilter;
  const user = ctx.state.user;

  const where = {};
  if (status) {
    if (status.includes(',')) {
      where.status = { [Op.in]: status.split(',') };
    } else {
      where.status = status;
    }
  }
  if (stationId) where.station_id = stationId;
  if (repairPersonId) where.repair_person_id = repairPersonId;
  if (reporterId) where.reporter_id = reporterId;
  if (equipmentName) where.equipment_name = { [Op.like]: `%${equipmentName}%` };
  if (urgencyLevel) where.urgency_level = urgencyLevel;
  if (repairPersonName) {
    where[Op.and] = where[Op.and] || [];
    where[Op.and].push({
      [Op.or]: [
        { repair_person_name: { [Op.like]: `%${repairPersonName}%` } },
        { repair_assistant_name: { [Op.like]: `%${repairPersonName}%` } }
      ]
    });
  }

  if (user?.roleCode === 'maintenance') {
    const allowedStatuses = ['dispatched', 'repairing', 'repaired_submitted', 'accepted', 'archived'];
    if (status) {
      const statusList = status.includes(',') ? status.split(',') : [status];
      where.status = { [Op.in]: statusList.filter(s => allowedStatuses.includes(s)) };
    } else {
      where.status = { [Op.in]: allowedStatuses };
    }
    where[Op.or] = [
      { repair_person_id: user.id },
      { repair_assistant_name: user.realName }
    ];
  }

  if (!dataFilter.all && dataFilter.stationIds?.length > 0) {
    where.station_id = { [Op.in]: dataFilter.stationIds };
  }

  const result = await RepairRecord.findAndCountAll({
    where,
    include: [
      { model: FaultReport, as: 'faultReport' },
      { model: User, as: 'repairPerson', attributes: ['id', 'real_name', 'phone'] },
      { model: Station, as: 'station', attributes: ['id', 'station_name'] }
    ],
    offset, limit,
    order: order.length ? order : [['created_at', 'DESC']]
  });

  await fillDispatchByNames(result.rows);

  ctx.body = {
    code: 200,
    message: 'success',
    data: formatPaginationResponse(result, page, pageSize)
  };
};

/**
 * 获取单个维修记录详情
 * GET /api/repair-records/:id
 */
export const getRepairRecordById = async (ctx) => {
  const { id } = ctx.params;

  const record = await RepairRecord.findByPk(id, {
    include: [
      { model: FaultReport, as: 'faultReport' },
      { model: User, as: 'repairPerson', attributes: ['id', 'real_name', 'phone'] },
      { model: Station, as: 'station', attributes: ['id', 'station_name'] }
    ]
  });

  if (!record) throw createError(404, '维修记录不存在');

  await fillDispatchByNames(record);

  ctx.body = {
    code: 200,
    message: 'success',
    data: record
  };
};

/**
 * 创建维修记录单（上报人草稿）
 * POST /api/repair-records
 */
export const createRepairRecord = async (ctx) => {
  const {
    faultReportId, stationId,
    equipmentCode, equipmentName, equipmentLocation, equipmentModel,
    faultDate, faultTime, faultDescription, preliminaryJudgment,
    reportDate, reportTime, urgencyLevel,
    isDraft
  } = ctx.request.body;
  const user = ctx.state.user;
  const reportDateValue = reportDate || dayjs().format('YYYY-MM-DD');
  const reportTimeValue = reportTime || dayjs().format('HH:mm:ss');

  const record = await RepairRecord.create({
    record_code: generateRecordCode('RR'),
    fault_report_id: faultReportId || 0,
    project_id: user.lastProjectId || 0,
    station_id: stationId,
    equipment_code: equipmentCode,
    equipment_name: equipmentName,
    equipment_location: equipmentLocation,
    equipment_model: equipmentModel,
    fault_date: faultDate || reportDateValue,
    fault_time: faultTime || reportTimeValue,
    fault_description: faultDescription,
    preliminary_judgment: preliminaryJudgment,
    reporter_id: user.id,
    reporter_name: user.realName,
    report_date: reportDateValue,
    report_time: reportTimeValue,
    urgency_level: urgencyLevel,
    status: isDraft ? 'draft_report' : 'submitted_report',
    created_by: user.id
  });

  if (!isDraft) {
    try {
      await Notification.create({
        notify_type: 'system',
        title: '设备故障提醒',
        content: [
          `维修单号：${record.record_code}`,
          `设备名称：${equipmentName || ''}`
        ].join('\n'),
        receiver_id: user.id,
        receiver_name: user.realName || user.username || '',
        related_id: record.id,
        related_type: 'repair_record'
      });
    } catch (e) {
      // ignore notification failure
    }
  }

  ctx.body = {
    code: 200,
    message: isDraft ? '草稿保存成功' : '维修单提交成功',
    data: { id: record.id, recordCode: record.record_code }
  };
};

/**
 * 更新维修记录单
 * PUT /api/repair-records/:id
 */
export const updateRepairRecord = async (ctx) => {
  const { id } = ctx.params;
  const updateData = ctx.request.body;
  const user = ctx.state.user;

  const record = await RepairRecord.findByPk(id);
  if (!record) throw createError(404, '维修记录不存在');

  // 根据当前状态限制可更新的字段
  const roleCode = user.roleCode;
  const currentStatus = record.status;

  // 上报人只能在草稿状态更新
  if (['draft_report'].includes(currentStatus) && record.reporter_id === user.id) {
    await record.update(updateData);
  }
  // 站长可以派发
  else if (currentStatus === 'submitted_report' && ['station_manager', 'deputy_manager', 'department_manager', 'admin'].includes(roleCode)) {
    await record.update(updateData);
  }
  // 维修人员可以在维修状态更新
  else if (['dispatched', 'repairing'].includes(currentStatus) && record.repair_person_id === user.id) {
    await record.update(updateData);
  }
  else {
    throw createError(403, '无权更新此记录');
  }

  ctx.body = { code: 200, message: '更新成功', data: null };
};

/**
 * 上报人提交维修单
 * POST /api/repair-records/:id/submit
 */
export const submitRepairRecord = async (ctx) => {
  const { id } = ctx.params;
  const user = ctx.state.user;

  const record = await RepairRecord.findByPk(id);
  if (!record) throw createError(404, '维修记录不存在');
  if (record.reporter_id !== user.id) throw createError(403, '只有上报人可以提交');
  if (record.status !== 'draft_report') throw createError(400, '只有草稿状态可以提交');

  await record.update({
    status: 'submitted_report',
    report_date: dayjs().format('YYYY-MM-DD'),
    report_time: dayjs().format('HH:mm:ss')
  });

  ctx.body = { code: 200, message: '提交成功', data: null };
};

/**
 * 站长派发维修单
 * POST /api/repair-records/:id/dispatch
 */
export const dispatchRepairRecord = async (ctx) => {
  const { id } = ctx.params;
  const { repairPersonId, repairPersonName, repairAssistantName, planRepairDate, planRepairTime, planRepairEndDate, planRepairEndTime, dispatchDate, dispatchTime, dispatchRemark } = ctx.request.body;
  const user = ctx.state.user;

  const record = await RepairRecord.findByPk(id);
  if (!record) throw createError(404, '维修记录不存在');
  if (record.status !== 'submitted_report') throw createError(400, '只有已提交状态可以派发');

  await record.update({
    status: 'dispatched',
    repair_person_id: repairPersonId,
    repair_person_name: repairPersonName,
    dispatch_by: user.id,
    dispatch_by_name: user.realName,
    dispatch_date: dispatchDate || dayjs().format('YYYY-MM-DD'),
    dispatch_time: dispatchTime || dayjs().format('HH:mm:ss'),
    plan_repair_date: planRepairDate,
    plan_repair_time: planRepairTime,
    plan_repair_end_date: planRepairEndDate,
    plan_repair_end_time: planRepairEndTime,
    repair_assistant_name: repairAssistantName,
    dispatch_remark: dispatchRemark
  });

  try {
    const receivers = [
      { id: repairPersonId, name: repairPersonName },
      { id: user.id, name: user.realName || user.username }
    ].filter(item => item.id);

    if (receivers.length > 0) {
      await Notification.bulkCreate(
        receivers.map(receiver => ({
          notify_type: 'system',
          title: '设备故障派单提醒',
          content: [
            `维修单号：${record.record_code}`,
            `设备名称：${record.equipment_name || ''}`
          ].join('\n'),
          receiver_id: receiver.id,
          receiver_name: receiver.name || '',
          related_id: record.id,
          related_type: 'repair_record'
        }))
      );
    }
  } catch (e) {
    // ignore notification failure
  }

  ctx.body = { code: 200, message: '派发成功', data: null };
};

/**
 * 维修人员开始维修
 * POST /api/repair-records/:id/start
 */
export const startRepair = async (ctx) => {
  const { id } = ctx.params;
  const user = ctx.state.user;
  const { repairStartDate, repairStartTime } = ctx.request.body;

  const record = await RepairRecord.findByPk(id);
  if (!record) throw createError(404, '维修记录不存在');
  if (record.repair_person_id !== user.id) throw createError(403, '只有指定维修人员可以操作');
  if (record.status !== 'dispatched') throw createError(400, '只有已派发状态可以开始维修');

  await record.update({
    status: 'repairing',
    repair_start_date: repairStartDate || dayjs().format('YYYY-MM-DD'),
    repair_start_time: repairStartTime || dayjs().format('HH:mm:ss')
  });

  ctx.body = { code: 200, message: '已开始维修', data: null };
};

/**
 * 维修人员提交维修完成
 * POST /api/repair-records/:id/complete
 */
export const completeRepair = async (ctx) => {
  const { id } = ctx.params;
  const {
    repairContent, repairTools,
    consumablesList, consumablesTotal,
    partsList, partsTotal,
    repairResult, observeDays, unsolvedReason,
    workHours, repairStartDate, repairStartTime, repairEndDate, repairEndTime, preliminaryJudgment
  } = ctx.request.body;
  const user = ctx.state.user;

  const record = await RepairRecord.findByPk(id);
  if (!record) throw createError(404, '维修记录不存在');
  if (record.repair_person_id !== user.id) throw createError(403, '只有指定维修人员可以操作');
  if (!['dispatched', 'repairing'].includes(record.status)) throw createError(400, '当前状态不可提交');

  await record.update({
    status: 'repaired_submitted',
    repair_content: repairContent,
    repair_tools: repairTools,
    consumables_list: consumablesList || [],
    consumables_total: consumablesTotal || 0,
    parts_list: partsList || [],
    parts_total: partsTotal || 0,
    preliminary_judgment: preliminaryJudgment,
    repair_result: repairResult,
    observe_days: observeDays,
    unsolved_reason: unsolvedReason,
    work_hours: workHours,
    repair_start_date: repairStartDate || record.repair_start_date || dayjs().format('YYYY-MM-DD'),
    repair_start_time: repairStartTime || record.repair_start_time || dayjs().format('HH:mm:ss'),
    repair_end_date: repairEndDate || dayjs().format('YYYY-MM-DD'),
    repair_end_time: repairEndTime || dayjs().format('HH:mm:ss')
  });

  ctx.body = { code: 200, message: '维修完成已提交，等待验收', data: null };
};

/**
 * 站长验收
 * POST /api/repair-records/:id/verify
 */
export const verifyRepairRecord = async (ctx) => {
  const { id } = ctx.params;
  const { verifyResult, verifyComment, rating, ratingComment, verifyAttitude, verifyQuality, verifyDate, verifyTime } = ctx.request.body;
  const user = ctx.state.user;

  const record = await RepairRecord.findByPk(id, {
    include: [{ model: FaultReport, as: 'faultReport' }]
  });
  if (!record) throw createError(404, '维修记录不存在');
  if (record.status !== 'repaired_submitted') throw createError(400, '只有待验收状态可以验收');

  const isPass = verifyResult === 'pass';
  await record.update({
    status: isPass ? 'accepted' : 'repairing',
    verifier_id: user.id,
    verifier_name: user.realName,
    verify_date: verifyDate || dayjs().format('YYYY-MM-DD'),
    verify_time: verifyTime || dayjs().format('HH:mm:ss'),
    verify_result: verifyResult,
    verify_attitude: verifyAttitude,
    verify_quality: verifyQuality,
    verify_comment: verifyComment,
    rating,
    rating_comment: ratingComment
  });

  // 更新故障上报单状态
  if (record.faultReport) {
    await record.faultReport.update({
      status: isPass ? 'closed' : 'repairing'
    });
  }

  ctx.body = { code: 200, message: isPass ? '验收完成' : '已退回重新维修', data: null };
};

/**
 * 删除维修记录（仅草稿状态）
 * DELETE /api/repair-records/:id
 */
export const deleteRepairRecord = async (ctx) => {
  const { id } = ctx.params;
  const user = ctx.state.user;

  const record = await RepairRecord.findByPk(id);
  if (!record) throw createError(404, '维修记录不存在');
  const isManagerRole = ['admin', 'station_manager', 'deputy_manager', 'department_manager'].includes(user.roleCode);
  if (['accepted', 'archived'].includes(record.status)) {
    throw createError(400, '已验收/已归档不可删除');
  }
  if (!isManagerRole) {
    if (record.status !== 'draft_report') throw createError(400, '只有草稿状态可以删除');
    if (record.reporter_id !== user.id) throw createError(403, '只有上报人可以删除');
  }

  await record.destroy();
  ctx.body = { code: 200, message: '删除成功', data: null };
};

// ============================================
// 领料申请
// ============================================

/**
 * 提交领料申请
 * POST /api/material-requisitions
 */
export const createMaterialRequisition = async (ctx) => {
  const { repairRecordId, materialList, stationId } = ctx.request.body;
  const user = ctx.state.user;

  const totalAmount = materialList.reduce((sum, m) => sum + (m.quantity * m.unitPrice), 0);

  const requisition = await MaterialRequisition.create({
    requisition_code: generateRecordCode('MQ'),
    repair_record_id: repairRecordId,
    applicant_id: user.id,
    applicant_name: user.realName,
    material_list: materialList,
    total_amount: totalAmount,
    station_id: stationId,
    status: 'pending'
  });

  ctx.body = {
    code: 200,
    message: '领料申请提交成功',
    data: { id: requisition.id }
  };
};

/**
 * 查询领料申请列表
 * GET /api/material-requisitions
 */
export const getMaterialRequisitions = async (ctx) => {
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const { status } = ctx.query;

  const where = {};
  if (status) where.status = status;

  const result = await MaterialRequisition.findAndCountAll({
    where,
    include: [
      { model: User, as: 'applicant', attributes: ['id', 'real_name'] },
      { model: RepairRecord, as: 'repairRecord' }
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

export default {
  getMaintenancePlans, createMaintenancePlan, updateMaintenancePlan, deleteMaintenancePlan,
  getMaintenanceRecords, createMaintenanceRecord,
  getFaultReports, createFaultReport, assignFaultReport,
  getRepairRecords, getRepairRecordById, createRepairRecord, updateRepairRecord,
  submitRepairRecord, dispatchRepairRecord, startRepair, completeRepair,
  verifyRepairRecord, deleteRepairRecord,
  createMaterialRequisition, getMaterialRequisitions
};



