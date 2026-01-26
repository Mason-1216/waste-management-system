import { Op } from 'sequelize';
import dayjs from 'dayjs';
import { FaultReport, RepairRecord, User } from '../../../models/index.js';
import { createError } from '../../../middlewares/error.js';
import { formatPaginationResponse, generateRecordCode, getOrderBy, getPagination } from '../../../utils/helpers.js';

export const getFaultReports = async ({ query, dataFilter }) => {
  const { page, pageSize, offset, limit } = getPagination(query);
  const order = getOrderBy(query);
  const { stationId, status } = query;

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
    offset,
    limit,
    order
  });

  return formatPaginationResponse(result, page, pageSize);
};

export const createFaultReport = async ({ body, user }) => {
  const { equipmentCode, equipmentName, installationLocation, faultDate, faultTime, faultDescription, stationId } = body;

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
    project_id: user.lastProjectId || 0,
    station_id: stationId,
    status: 'pending'
  });

  return { id: report.id, reportCode: report.report_code };
};

export const assignFaultReport = async ({ id, body, user }) => {
  const { maintenanceUserId } = body;

  const report = await FaultReport.findByPk(id);
  if (!report) throw createError(404, '故障上报单不存在');

  await report.update({
    status: 'assigned',
    assigned_to: maintenanceUserId,
    assigned_by: user.id,
    assigned_at: new Date()
  });
};
