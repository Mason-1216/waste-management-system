import { Op } from 'sequelize';
import dayjs from 'dayjs';
import { MaintenancePlan, Station } from '../../../models/index.js';
import { createError } from '../../../middlewares/error.js';
import { formatPaginationResponse, generateRecordCode, getOrderBy, getPagination } from '../../../utils/helpers.js';

export const calculateNextMaintenanceDate = (baseDate, cycleType, cycleValue = 1) => {
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


const parseOptionalInt = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

export const getMaintenancePlans = async ({ query, dataFilter }) => {
  const { page, pageSize, offset, limit } = getPagination(query);
  const order = getOrderBy(query);
  const { stationId, status, equipmentName } = query;

  const safeFilter = dataFilter ?? {};
  const allowedStationIds = Array.isArray(safeFilter.stationIds) ? safeFilter.stationIds : [];
  const requestedStationId = parseOptionalInt(stationId);
  const emptyData = () => formatPaginationResponse({ rows: [], count: 0 }, page, pageSize);

  if (safeFilter.none) {
    return emptyData();
  }

  if (!safeFilter.all) {
    if (allowedStationIds.length === 0) {
      return emptyData();
    }
    if (requestedStationId && !allowedStationIds.includes(requestedStationId)) {
      return emptyData();
    }
  }

  const where = {};

  if (requestedStationId) {
    where.station_id = requestedStationId;
  } else if (!safeFilter.all && allowedStationIds.length > 0) {
    where.station_id = { [Op.in]: allowedStationIds };
  }

  if (status) where.status = status;
  if (equipmentName) where.equipment_name = { [Op.like]: `%${equipmentName}%` };

  const result = await MaintenancePlan.findAndCountAll({
    where,
    include: [
      { model: Station, as: 'station', attributes: ['id', 'station_name'] }
    ],
    offset,
    limit,
    order
  });

  return formatPaginationResponse(result, page, pageSize);
};
export const createMaintenancePlan = async ({ body, user }) => {
  const {
    stationId,
    equipmentName,
    equipmentCode,
    cycleType,
    cycleValue,
    maintenanceContent,
    assignedUserId,
    assignedUserName,
    startDate
  } = body;

  if (!equipmentName || !cycleType) {
    throw createError(400, '\u53c2\u6570\u4e0d\u5b8c\u6574');
  }

  const normalizedCycleValue = cycleValue || 1;
  const nextMaintenanceDate = calculateNextMaintenanceDate(startDate, cycleType, normalizedCycleValue);

  const plan = await MaintenancePlan.create({
    plan_code: generateRecordCode('MP'),
    station_id: stationId,
    equipment_name: equipmentName,
    equipment_code: equipmentCode,
    cycle_type: cycleType,
    cycle_value: normalizedCycleValue,
    maintenance_content: maintenanceContent,
    assigned_user_id: assignedUserId,
    assigned_user_name: assignedUserName,
    start_date: startDate,
    next_maintenance_date: nextMaintenanceDate,
    status: 'active',
    created_by: user.id
  });

  return { id: plan.id };
};

export const updateMaintenancePlan = async ({ id, body }) => {
  const plan = await MaintenancePlan.findByPk(id);
  if (!plan) {
    throw createError(404, '\u4fdd\u517b\u8ba1\u5212\u4e0d\u5b58\u5728');
  }

  await plan.update(body);
};

export const deleteMaintenancePlan = async ({ id }) => {
  const plan = await MaintenancePlan.findByPk(id);
  if (!plan) {
    throw createError(404, '\u4fdd\u517b\u8ba1\u5212\u4e0d\u5b58\u5728');
  }
  await plan.destroy();
};
