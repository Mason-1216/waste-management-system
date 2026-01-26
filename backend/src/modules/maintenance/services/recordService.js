import { Op } from 'sequelize';
import { MaintenancePlan, MaintenanceRecord, User } from '../../../models/index.js';
import { formatPaginationResponse, generateRecordCode, getOrderBy, getPagination } from '../../../utils/helpers.js';
import { calculateNextMaintenanceDate } from './planService.js';

export const getMaintenanceRecords = async ({ query, dataFilter }) => {
  const { page, pageSize, offset, limit } = getPagination(query);
  const order = getOrderBy(query);
  const { stationId, status, startDate, endDate } = query;

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
    offset,
    limit,
    order
  });

  return formatPaginationResponse(result, page, pageSize);
};

export const createMaintenanceRecord = async ({ body, user }) => {
  const {
    planId,
    stationId,
    equipmentName,
    equipmentCode,
    maintenanceDate,
    maintenanceContent,
    result,
    issueDescription,
    handlingMeasures,
    photoUrls,
    workHours
  } = body;

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

  return { id: record.id };
};
