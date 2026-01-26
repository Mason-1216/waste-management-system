import { Op } from 'sequelize';
import { DailyTask, MaintenanceRecord, RepairRecord, MaterialRequisition, SafetyRectification, SafetyHazardInspection, Notification, User } from '../../../models/index.js';
import { createError } from '../../../middlewares/error.js';
import { getPagination, formatPaginationResponse, getOrderBy } from '../../../utils/helpers.js';

const approveRecord = async (Model, id, action, rejectReason, user, typeName) => {
  const record = await Model.findByPk(id);
  if (!record) throw createError(404, '记录不存在');

  const updateData = {
    status: action === 'approve' ? 'approved' : 'rejected',
    reviewer_id: user.id,
    reviewer_name: user.realName,
    review_time: new Date()
  };

  if (action === 'reject') {
    updateData.reject_reason = rejectReason;
  }

  await record.update(updateData);

  const receiverId = record.user_id || record.applicant_id || record.maintainer_id || record.responsible_person_id;
  if (receiverId) {
    await Notification.create({
      notify_type: 'approval_request',
      title: action === 'approve' ? '审核通过' : '审核驳回',
      content: `您的${typeName}${action === 'approve' ? '已通过' : '已驳回'}`,
      receiver_id: receiverId,
      related_id: id,
      related_type: typeName
    });
  }

  return record;
};

const mapApprovalRecord = (record) => {
  const item = record.get({ plain: true });
  return {
    id: item.id,
    taskDate: item.work_date,
    taskName: item.task_name,
    workHours: item.total_hours,
    actualHours: item.total_hours,
    approvalStatus: item.status,
    createdAt: item.created_at,
    positionName: item.position_name || null,
    workDescription: item.work_description || null,
    photos: item.photos || null,
    user: item.user ? { realName: item.user.real_name } : { realName: item.user_name || '' },
    approver: item.reviewer_name ? { realName: item.reviewer_name } : null,
    approvedAt: item.review_time,
    rejectReason: item.reject_reason
  };
};

const safeCount = async (Model, options) => {
  try {
    return await Model.count(options);
  } catch (error) {
    return 0;
  }
};

// GET /api/approvals
export const getApprovals = async (ctx) => {
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const order = getOrderBy(ctx.query, { field: 'created_at', order: 'DESC' });
  const { status, stationId, keyword, startDate, endDate, type } = ctx.query;
  const dataFilter = ctx.state.dataFilter;

  if (type && type !== 'work_hours') {
    ctx.body = {
      code: 200,
      message: 'success',
      data: formatPaginationResponse({ rows: [], count: 0 }, page, pageSize)
    };
    return;
  }

  const where = {};
  if (status) where.status = status;
  if (stationId) where.station_id = stationId;
  if (startDate && endDate) {
    where.work_date = { [Op.between]: [startDate, endDate] };
  }
  if (keyword) {
    where[Op.or] = [
      { user_name: { [Op.like]: `%${keyword}%` } },
      { task_name: { [Op.like]: `%${keyword}%` } }
    ];
  }

  if (!dataFilter.all) {
    if (dataFilter.userId) where.user_id = dataFilter.userId;
    if (dataFilter.stationIds?.length > 0) {
      where.station_id = { [Op.in]: dataFilter.stationIds };
    }
  }

  const include = [
    {
      model: User,
      as: 'user',
      attributes: ['id', 'real_name'],
      required: Boolean(keyword),
      where: keyword ? { real_name: { [Op.like]: `%${keyword}%` } } : undefined
    }
  ];

  const result = await DailyTask.findAndCountAll({
    where,
    include,
    offset,
    limit,
    order,
    distinct: true
  });

  const mapped = result.rows.map(mapApprovalRecord);
  ctx.body = {
    code: 200,
    message: 'success',
    data: formatPaginationResponse({ rows: mapped, count: result.count }, page, pageSize)
  };
};

// PUT /api/approvals/:id/approve
export const approveApproval = async (ctx) => {
  const { id } = ctx.params;
  await approveRecord(DailyTask, id, 'approve', null, ctx.state.user, '工时记录');
  ctx.body = { code: 200, message: '操作成功', data: null };
};

// PUT /api/approvals/:id/reject
export const rejectApproval = async (ctx) => {
  const { id } = ctx.params;
  const rejectReason = ctx.request.body?.reason || ctx.request.body?.rejectReason || '';
  await approveRecord(DailyTask, id, 'reject', rejectReason, ctx.state.user, '工时记录');
  ctx.body = { code: 200, message: '操作成功', data: null };
};

// PUT /api/approvals/batch-approve
export const batchApproveApprovals = async (ctx) => {
  const { ids } = ctx.request.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    throw createError(400, '参数不能为空');
  }
  for (const id of ids) {
    await approveRecord(DailyTask, id, 'approve', null, ctx.state.user, '工时记录');
  }
  ctx.body = { code: 200, message: '操作成功', data: null };
};

// PUT /api/approvals/batch-reject
export const batchRejectApprovals = async (ctx) => {
  const { ids, reason, rejectReason } = ctx.request.body || {};
  const finalReason = reason || rejectReason || '';
  if (!Array.isArray(ids) || ids.length === 0) {
    throw createError(400, '参数不能为空');
  }
  for (const id of ids) {
    await approveRecord(DailyTask, id, 'reject', finalReason, ctx.state.user, '工时记录');
  }
  ctx.body = { code: 200, message: '操作成功', data: null };
};

// POST /api/approval/task-hours/:id
export const approveTaskHours = async (ctx) => {
  const { id } = ctx.params;
  const { action, rejectReason } = ctx.request.body;

  await approveRecord(DailyTask, id, action, rejectReason, ctx.state.user, '工时记录');
  ctx.body = { code: 200, message: '操作成功', data: null };
};

// POST /api/approval/task-hours/batch
export const batchApproveTaskHours = async (ctx) => {
  const { ids, action, rejectReason } = ctx.request.body;

  for (const id of ids) {
    await approveRecord(DailyTask, id, action, rejectReason, ctx.state.user, '工时记录');
  }

  ctx.body = { code: 200, message: `批量${action === 'approve' ? '通过' : '驳回'}成功`, data: null };
};

// POST /api/approval/maintenance/:id
export const approveMaintenance = async (ctx) => {
  const { id } = ctx.params;
  const { action, rejectReason } = ctx.request.body;

  await approveRecord(MaintenanceRecord, id, action, rejectReason, ctx.state.user, '保养记录');
  ctx.body = { code: 200, message: '操作成功', data: null };
};

// POST /api/approval/repair/:id
export const approveRepair = async (ctx) => {
  const { id } = ctx.params;
  const { action, rejectReason } = ctx.request.body;

  await approveRecord(RepairRecord, id, action, rejectReason, ctx.state.user, '维修记录');
  ctx.body = { code: 200, message: '操作成功', data: null };
};

// POST /api/approval/requisition/:id
export const approveRequisition = async (ctx) => {
  const { id } = ctx.params;
  const { action, rejectReason } = ctx.request.body;

  const requisition = await MaterialRequisition.findByPk(id);
  if (!requisition) throw createError(404, '领料申请不存在');

  await requisition.update({
    status: action === 'approve' ? 'approved' : 'rejected',
    approver_id: ctx.state.user.id,
    approver_name: ctx.state.user.realName,
    approve_time: new Date(),
    reject_reason: action === 'reject' ? rejectReason : null
  });

  ctx.body = { code: 200, message: '操作成功', data: null };
};

// POST /api/approval/rectification/:id
export const approveRectification = async (ctx) => {
  const { id } = ctx.params;
  const { action, rejectReason, rootCauseCategory, approveComment } = ctx.request.body;

  const rectification = await SafetyRectification.findByPk(id, {
    include: [{ model: SafetyHazardInspection, as: 'inspection' }]
  });
  if (!rectification) throw createError(404, '整改审批单不存在');

  await rectification.update({
    status: action === 'approve' ? 'approved' : 'rejected',
    approver_id: ctx.state.user.id,
    approver_name: ctx.state.user.realName,
    approve_time: new Date(),
    approve_comment: approveComment,
    reject_reason: action === 'reject' ? rejectReason : null,
    root_cause_category: rootCauseCategory
  });

  if (action === 'approve' && rectification.inspection) {
    await rectification.inspection.update({ status: 'completed' });
  }

  ctx.body = { code: 200, message: '操作成功', data: null };
};

// GET /api/approval/pending
export const getPendingApprovals = async (ctx) => {
  const dataFilter = ctx.state.dataFilter;
  const baseWhere = { status: 'pending' };

  if (!dataFilter.all && dataFilter.stationIds?.length > 0) {
    baseWhere.station_id = { [Op.in]: dataFilter.stationIds };
  }

  const [taskHours, maintenanceRecords, repairRecords, requisitions, rectifications, pendingDispatch, pendingVerify] = await Promise.all([
    safeCount(DailyTask, { where: baseWhere }),
    safeCount(MaintenanceRecord, { where: baseWhere }),
    safeCount(RepairRecord, { where: { status: 'pending' } }),
    safeCount(MaterialRequisition, { where: baseWhere }),
    safeCount(SafetyRectification, { where: { status: 'pending' } }),
    safeCount(RepairRecord, { where: { status: 'submitted_report' } }),
    safeCount(RepairRecord, { where: { status: 'repaired_submitted' } })
  ]);

  ctx.body = {
    code: 200,
    message: 'success',
    data: {
      taskHours,
      maintenanceRecords,
      repairRecords,
      pendingDispatch,
      pendingVerify,
      requisitions,
      rectifications,
      total: taskHours + maintenanceRecords + repairRecords + requisitions + rectifications
    }
  };
};

export default {
  getApprovals,
  approveApproval,
  rejectApproval,
  batchApproveApprovals,
  batchRejectApprovals,
  approveTaskHours,
  batchApproveTaskHours,
  approveMaintenance,
  approveRepair,
  approveRequisition,
  approveRectification,
  getPendingApprovals
};
