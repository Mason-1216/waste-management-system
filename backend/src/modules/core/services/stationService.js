import { Op } from 'sequelize';
import { Station, User } from '../../../models/index.js';
import { createError } from '../../../middlewares/error.js';
import { getPagination, formatPaginationResponse, getOrderBy } from '../../../utils/helpers.js';

/**
 * 查询场站列表
 * GET /api/stations
 */
export const getStations = async (ctx) => {
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const order = getOrderBy(ctx.query);
  const { keyword, stationType, status } = ctx.query;
  const dataFilter = ctx.state.dataFilter;

  const where = {};

  if (keyword) {
    where.station_name = { [Op.like]: `%${keyword}%` };
  }

  if (stationType) {
    where.station_type = stationType;
  }

  if (status) {
    where.status = status;
  }

  // 数据权限过滤
  if (!dataFilter.all && dataFilter.stationIds) {
    where.id = { [Op.in]: dataFilter.stationIds };
  }

  const result = await Station.findAndCountAll({
    where,
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
 * 获取场站详情
 * GET /api/stations/:id
 */
export const getStationById = async (ctx) => {
  const { id } = ctx.params;

  const station = await Station.findByPk(id, {
    include: [
      { model: User, as: 'users', attributes: ['id', 'username', 'real_name', 'phone'] }
    ]
  });

  if (!station) {
    throw createError(404, '场站不存在');
  }

  ctx.body = {
    code: 200,
    message: 'success',
    data: station
  };
};

/**
 * 新增场站
 * POST /api/stations
 */
export const createStation = async (ctx) => {
  const { stationName, stationType, checkInTime, location, status } = ctx.request.body;

  if (!stationName) {
    throw createError(400, '场站名称不能为空');
  }

  const resolvedStatus = status === 'inactive' ? 'inactive' : 'active';

  const station = await Station.create({
    station_name: stationName,
    station_type: stationType,
    check_in_time: checkInTime || '08:10:00',
    location,
    status: resolvedStatus
  });

  ctx.body = {
    code: 200,
    message: '场站创建成功',
    data: { id: station.id }
  };
};

/**
 * 编辑场站
 * PUT /api/stations/:id
 */
export const updateStation = async (ctx) => {
  const { id } = ctx.params;
  const { stationName, stationType, checkInTime, location, status } = ctx.request.body;

  const station = await Station.findByPk(id);
  if (!station) {
    throw createError(404, '场站不存在');
  }

  await station.update({
    station_name: stationName,
    station_type: stationType,
    check_in_time: checkInTime,
    location,
    status
  });

  ctx.body = {
    code: 200,
    message: '场站更新成功',
    data: null
  };
};

/**
 * 删除场站
 * DELETE /api/stations/:id
 */
export const deleteStation = async (ctx) => {
  const { id } = ctx.params;

  const station = await Station.findByPk(id);
  if (!station) {
    throw createError(404, '场站不存在');
  }

  await station.destroy();

  ctx.body = {
    code: 200,
    message: '场站删除成功',
    data: null
  };
};

/**
 * 获取场站人员列表
 * GET /api/stations/:id/users
 */
export const getStationUsers = async (ctx) => {
  const { id } = ctx.params;

  const station = await Station.findByPk(id, {
    include: [{
      model: User,
      as: 'users',
      attributes: ['id', 'username', 'real_name', 'phone', 'role_id', 'status']
    }]
  });

  if (!station) {
    throw createError(404, '场站不存在');
  }

  ctx.body = {
    code: 200,
    message: 'success',
    data: station.users
  };
};

/**
 * 获取所有场站（下拉选择用）
 * GET /api/stations/all
 */
export const getAllStations = async (ctx) => {
  const dataFilter = ctx.state.dataFilter;

  const where = { status: 'active' };

  if (!dataFilter.all && dataFilter.stationIds) {
    where.id = { [Op.in]: dataFilter.stationIds };
  }

  const stations = await Station.findAll({
    where,
    attributes: ['id', 'station_name', 'station_type'],
    order: [['station_name', 'ASC']]
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: stations
  };
};

export default {
  getStations,
  getStationById,
  createStation,
  updateStation,
  deleteStation,
  getStationUsers,
  getAllStations
};
