import { Op, literal } from 'sequelize';
import dayjs from 'dayjs';
import { FaultReport, RepairRecord, Station, User } from '../../../models/index.js';
import { createError } from '../../../middlewares/error.js';
import { formatPaginationResponse, generateRecordCode, getOrderBy, getPagination } from '../../../utils/helpers.js';
import { normalizeTaskCategory } from '../../../utils/taskCategory.js';
import { publishNotification, publishNotifications } from '../../notification/services/notificationPublisher.js';

const normalizeRepairTasks = (value) => {
  const list = Array.isArray(value) ? value : [];
  return list
    .filter(item => item && typeof item === 'object')
    .map((item) => {
      const rawCategory = item.task_category ?? item.taskCategory;
      const category = normalizeTaskCategory(rawCategory);
      return {
        ...item,
        task_category: category,
        taskCategory: category
      };
    });
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

export const getRepairRecords = async ({ query, dataFilter, user }) => {
  const { page, pageSize, offset, limit } = getPagination(query);
  const order = getOrderBy(query);
  const { status, stationId, repairPersonId, reporterId, equipmentName, urgencyLevel, repairPersonName } = query;
  const roleCode = user?.baseRoleCode || user?.roleCode;

  const hasCustomSort = Boolean(query?.sortBy) || Boolean(query?.sortOrder);
  const prioritizedManagerRoles = ['station_manager', 'department_manager', 'deputy_manager'];

  const buildPrioritizedOrder = () => {
    // Only apply when caller didn't request an explicit sort, otherwise keep client sort behavior unchanged.
    if (hasCustomSort) return order;

    if (roleCode === 'maintenance') {
      // "退回重做" is rendered by frontend when status=repairing and verify_result=fail
      return [
        [
          literal(`CASE
            WHEN \`RepairRecord\`.\`status\` = 'repairing' AND \`RepairRecord\`.\`verify_result\` = 'fail' THEN 0
            WHEN \`RepairRecord\`.\`status\` = 'dispatched' THEN 1
            ELSE 2
          END`),
          'ASC'
        ],
        ['created_at', 'DESC']
      ];
    }

    if (prioritizedManagerRoles.includes(roleCode)) {
      // "已上报" should be above "待验收" per product requirement.
      return [
        [
          literal(`CASE
            WHEN \`RepairRecord\`.\`status\` = 'submitted_report' THEN 0
            WHEN \`RepairRecord\`.\`status\` = 'repaired_submitted' THEN 1
            ELSE 2
          END`),
          'ASC'
        ],
        ['created_at', 'DESC']
      ];
    }

    return order;
  };

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

  if (roleCode === 'maintenance') {
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

  if (roleCode === 'operator') {
    where.reporter_id = user.id;
  }

  if (roleCode !== 'maintenance' && !dataFilter?.all && Array.isArray(dataFilter?.stationIds)) {
    where.station_id = { [Op.in]: dataFilter.stationIds };
  }

  const result = await RepairRecord.findAndCountAll({
    where,
    include: [
      { model: FaultReport, as: 'faultReport' },
      { model: User, as: 'repairPerson', attributes: ['id', 'real_name', 'phone'] },
      { model: Station, as: 'station', attributes: ['id', 'station_name'] }
    ],
    offset,
    limit,
    order: buildPrioritizedOrder()
  });

  await fillDispatchByNames(result.rows);

  return formatPaginationResponse(result, page, pageSize);
};

export const getRepairRecordById = async (id) => {
  const record = await RepairRecord.findByPk(id, {
    include: [
      { model: FaultReport, as: 'faultReport' },
      { model: User, as: 'repairPerson', attributes: ['id', 'real_name', 'phone'] },
      { model: Station, as: 'station', attributes: ['id', 'station_name'] }
    ]
  });

  if (!record) throw createError(404, '维修记录不存在');

  await fillDispatchByNames(record);

  return record;
};

export const createRepairRecord = async ({ body, user }) => {
  const {
    faultReportId, stationId,
    equipmentCode, equipmentName, equipmentLocation, equipmentModel,
    faultDate, faultTime, faultDescription, preliminaryJudgment,
    reportDate, reportTime, urgencyLevel,
    isDraft
  } = body;

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
      await publishNotification({
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

  return { id: record.id, recordCode: record.record_code, isDraft: !!isDraft };
};

export const updateRepairRecord = async ({ id, body, user }) => {
  const record = await RepairRecord.findByPk(id);
  if (!record) throw createError(404, '维修记录不存在');

  const roleCode = user.roleCode;
  const currentStatus = record.status;

  if (['draft_report'].includes(currentStatus) && record.reporter_id === user.id) {
    await record.update(body);
  } else if (currentStatus === 'submitted_report' && ['station_manager', 'deputy_manager', 'department_manager', 'admin'].includes(roleCode)) {
    await record.update(body);
  } else if (['dispatched', 'repairing'].includes(currentStatus) && record.repair_person_id === user.id) {
    await record.update(body);
  } else {
    throw createError(403, '无权更新此记录');
  }
};

export const submitRepairRecord = async ({ id, user }) => {
  const record = await RepairRecord.findByPk(id);
  if (!record) throw createError(404, '维修记录不存在');
  if (record.reporter_id !== user.id) throw createError(403, '只有上报人可以提交');
  if (record.status !== 'draft_report') throw createError(400, '只有草稿状态可以提交');

  await record.update({
    status: 'submitted_report',
    report_date: dayjs().format('YYYY-MM-DD'),
    report_time: dayjs().format('HH:mm:ss')
  });
};

export const dispatchRepairRecord = async ({ id, body, user }) => {
  const {
    repairPersonId, repairPersonName, repairAssistantName,
    planRepairDate, planRepairTime, planRepairEndDate, planRepairEndTime,
    dispatchDate, dispatchTime, dispatchRemark
  } = body;

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
      await publishNotifications(
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
};

export const startRepair = async ({ id, body, user }) => {
  const { repairStartDate, repairStartTime } = body;

  const record = await RepairRecord.findByPk(id);
  if (!record) throw createError(404, '维修记录不存在');
  if (record.repair_person_id !== user.id) throw createError(403, '只有指定维修人员可以操作');
  if (record.status !== 'dispatched') throw createError(400, '只有已派发状态可以开始维修');

  await record.update({
    status: 'repairing',
    repair_start_date: repairStartDate || dayjs().format('YYYY-MM-DD'),
    repair_start_time: repairStartTime || dayjs().format('HH:mm:ss')
  });
};

export const completeRepair = async ({ id, body, user }) => {
  const {
    repairContent, repairTools,
    workContents, repairTasks,
    consumablesList, consumablesTotal,
    partsList, partsTotal,
    repairResult, observeDays, unsolvedReason,
    workHours, repairStartDate, repairStartTime, repairEndDate, repairEndTime, preliminaryJudgment
  } = body;

  const record = await RepairRecord.findByPk(id);
  if (!record) throw createError(404, '维修记录不存在');
  if (record.repair_person_id !== user.id) throw createError(403, '只有指定维修人员可以操作');
  if (!['dispatched', 'repairing'].includes(record.status)) throw createError(400, '当前状态不可提交');

  await record.update({
    status: 'repaired_submitted',
    repair_content: repairContent,
    repair_tools: repairTools,
    work_contents: Array.isArray(workContents) ? workContents : [],
    repair_tasks: normalizeRepairTasks(repairTasks),
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
};

export const verifyRepairRecord = async ({ id, body, user }) => {
  const { verifyResult, verifyComment, rating, ratingComment, verifyAttitude, verifyQuality, verifyDate, verifyTime } = body;

  const normalizedResult = verifyResult === 'reject' ? 'fail' : verifyResult;

  if (!['pass', 'fail'].includes(normalizedResult)) {
    throw createError(400, '???????');
  }

  const record = await RepairRecord.findByPk(id, {
    include: [{ model: FaultReport, as: 'faultReport' }]
  });
  if (!record) throw createError(404, '维修记录不存在');
  if (record.status !== 'repaired_submitted') throw createError(400, '只有待验收状态可以验收');

  const isPass = normalizedResult === 'pass';
  await record.update({
    status: isPass ? 'accepted' : 'repairing',
    verifier_id: user.id,
    verifier_name: user.realName,
    verify_date: verifyDate || dayjs().format('YYYY-MM-DD'),
    verify_time: verifyTime || dayjs().format('HH:mm:ss'),
    verify_result: normalizedResult,
    verify_attitude: verifyAttitude,
    verify_quality: verifyQuality,
    verify_comment: verifyComment,
    rating,
    rating_comment: ratingComment
  });

  if (record.faultReport) {
    await record.faultReport.update({
      status: isPass ? 'closed' : 'repairing'
    });
  }
};

export const deleteRepairRecord = async ({ id, user }) => {
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
};
