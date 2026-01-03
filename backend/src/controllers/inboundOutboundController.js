import { Op } from 'sequelize';
import { Warehouse, IcCard, InboundRecord, OutboundRecord, User, Station } from '../models/index.js';
import { createError } from '../middlewares/error.js';
import { getPagination, formatPaginationResponse, generateRecordCode } from '../utils/helpers.js';

// ============================================
// 仓库管理
// ============================================

/**
 * 查询仓库列表
 * GET /api/warehouses
 */
export const getWarehouses = async (ctx) => {
  const { stationId, status } = ctx.query;

  const where = {};
  if (stationId) where.station_id = stationId;
  if (status) where.status = status;

  const warehouses = await Warehouse.findAll({
    where,
    include: [
      { model: Station, as: 'station', attributes: ['id', 'station_name'] }
    ],
    order: [['warehouse_name', 'ASC']]
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: warehouses
  };
};

/**
 * 新增仓库
 * POST /api/warehouses
 */
export const createWarehouse = async (ctx) => {
  const { warehouseCode, warehouseName, stationId, location, capacity, gateNumber, gateType } = ctx.request.body;

  if (!warehouseCode || !warehouseName) {
    throw createError(400, '参数不完整');
  }

  const warehouse = await Warehouse.create({
    warehouse_code: warehouseCode,
    warehouse_name: warehouseName,
    station_id: stationId,
    location,
    capacity,
    gate_number: gateNumber,
    gate_type: gateType || 'manual',
    status: 'active'
  });

  ctx.body = {
    code: 200,
    message: '仓库创建成功',
    data: { id: warehouse.id }
  };
};

/**
 * 编辑仓库
 * PUT /api/warehouses/:id
 */
export const updateWarehouse = async (ctx) => {
  const { id } = ctx.params;
  const updateData = ctx.request.body;

  const warehouse = await Warehouse.findByPk(id);
  if (!warehouse) throw createError(404, '仓库不存在');

  await warehouse.update(updateData);

  ctx.body = { code: 200, message: '更新成功', data: null };
};

// ============================================
// IC卡管理
// ============================================

/**
 * 查询IC卡列表
 * GET /api/ic-cards
 */
export const getIcCards = async (ctx) => {
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const { cardType, status, warehouseId } = ctx.query;

  const where = {};
  if (cardType) where.card_type = cardType;
  if (status) where.status = status;
  if (warehouseId) where.warehouse_id = warehouseId;

  const result = await IcCard.findAndCountAll({
    where,
    include: [
      { model: Warehouse, as: 'warehouse', attributes: ['id', 'warehouse_name'] },
      { model: User, as: 'user', attributes: ['id', 'real_name'] }
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
 * 发卡
 * POST /api/ic-cards
 */
export const createIcCard = async (ctx) => {
  const { cardId, cardType, warehouseId, warehouseName, userId, materialType } = ctx.request.body;

  if (!cardId || !cardType) {
    throw createError(400, '卡号和类型不能为空');
  }

  const existCard = await IcCard.findOne({ where: { card_id: cardId } });
  if (existCard) throw createError(400, 'IC卡号已存在');

  const card = await IcCard.create({
    card_id: cardId,
    card_type: cardType,
    warehouse_id: warehouseId,
    warehouse_name: warehouseName,
    user_id: userId,
    material_type: materialType,
    status: 'active'
  });

  ctx.body = {
    code: 200,
    message: '发卡成功',
    data: { id: card.id }
  };
};

/**
 * 禁用卡片
 * PUT /api/ic-cards/:id/disable
 */
export const disableIcCard = async (ctx) => {
  const { id } = ctx.params;

  const card = await IcCard.findByPk(id);
  if (!card) throw createError(404, 'IC卡不存在');

  await card.update({ status: 'disabled' });

  ctx.body = { code: 200, message: '卡片已禁用', data: null };
};

/**
 * 验证卡片（刷卡时调用）
 * GET /api/ic-cards/verify/:cardId
 */
export const verifyIcCard = async (ctx) => {
  const { cardId } = ctx.params;

  const card = await IcCard.findOne({
    where: { card_id: cardId },
    include: [{ model: Warehouse, as: 'warehouse' }]
  });

  if (!card) {
    ctx.body = { code: 404, message: 'IC卡未注册', data: null };
    return;
  }

  if (card.status !== 'active') {
    ctx.body = { code: 400, message: 'IC卡已禁用或挂失', data: null };
    return;
  }

  // 更新最后使用时间
  await card.update({ last_used_at: new Date() });

  ctx.body = {
    code: 200,
    message: '验证成功',
    data: {
      cardId: card.card_id,
      cardType: card.card_type,
      warehouseId: card.warehouse_id,
      warehouseName: card.warehouse_name,
      materialType: card.material_type,
      warehouse: card.warehouse
    }
  };
};

// ============================================
// 进料记录
// ============================================

/**
 * 查询进料记录
 * GET /api/inbound
 */
export const getInboundRecords = async (ctx) => {
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const { stationId, wasteCategory, startDate, endDate } = ctx.query;
  const dataFilter = ctx.state.dataFilter;

  const where = {};
  if (stationId) where.station_id = stationId;
  if (wasteCategory) where.waste_category = wasteCategory;
  if (startDate && endDate) where.created_at = { [Op.between]: [new Date(startDate), new Date(endDate + ' 23:59:59')] };

  if (!dataFilter.all && dataFilter.stationIds?.length > 0) {
    where.station_id = { [Op.in]: dataFilter.stationIds };
  }

  const result = await InboundRecord.findAndCountAll({
    where,
    include: [
      { model: User, as: 'operator', attributes: ['id', 'real_name'] },
      { model: Station, as: 'station', attributes: ['id', 'station_name'] }
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
 * 创建进料记录
 * POST /api/inbound
 */
export const createInboundRecord = async (ctx) => {
  const { sourceWarehouseId, sourceWarehouseName, materialName, wasteCategory, weight, dataSource, stationId, photoUrls, remark } = ctx.request.body;
  const user = ctx.state.user;

  if (!materialName || !wasteCategory || !weight) {
    throw createError(400, '物料名称、分类和重量不能为空');
  }

  // 校验重量范围
  if (weight < 100 || weight > 10000) {
    throw createError(400, '重量超出合理范围(100-10000kg)');
  }

  // 根据垃圾分类自动匹配仓门
  const gateMapping = {
    'waste_fruit': 1,
    'crushed_perishable': 2,
    'uncrushed_perishable': 3
  };
  const targetGate = gateMapping[wasteCategory] || 1;

  const record = await InboundRecord.create({
    record_code: generateRecordCode('IN'),
    source_warehouse_id: sourceWarehouseId,
    source_warehouse_name: sourceWarehouseName,
    material_name: materialName,
    waste_category: wasteCategory,
    weight,
    target_gate: targetGate,
    data_source: dataSource || 'manual',
    operator_id: user.id,
    operator_name: user.realName,
    station_id: stationId,
    photo_urls: JSON.stringify(photoUrls || []),
    remark
  });

  ctx.body = {
    code: 200,
    message: '进料记录创建成功',
    data: { id: record.id, recordCode: record.record_code, targetGate }
  };
};

// ============================================
// 出料记录
// ============================================

/**
 * 查询出料记录
 * GET /api/outbound
 */
export const getOutboundRecords = async (ctx) => {
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const { stationId, outboundCategory, startDate, endDate } = ctx.query;
  const dataFilter = ctx.state.dataFilter;

  const where = {};
  if (stationId) where.station_id = stationId;
  if (outboundCategory) where.outbound_category = outboundCategory;
  if (startDate && endDate) where.created_at = { [Op.between]: [new Date(startDate), new Date(endDate + ' 23:59:59')] };

  if (!dataFilter.all && dataFilter.stationIds?.length > 0) {
    where.station_id = { [Op.in]: dataFilter.stationIds };
  }

  const result = await OutboundRecord.findAndCountAll({
    where,
    include: [
      { model: User, as: 'operator', attributes: ['id', 'real_name'] },
      { model: Station, as: 'station', attributes: ['id', 'station_name'] }
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
 * 创建出料记录
 * POST /api/outbound
 */
export const createOutboundRecord = async (ctx) => {
  const { outboundCategory, inboundWarehouseId, inboundWarehouseName, outboundWarehouseId, outboundWarehouseName, materialSpec, weight, stationId, photoUrls, remark } = ctx.request.body;
  const user = ctx.state.user;

  if (!outboundCategory || !inboundWarehouseId || !weight) {
    throw createError(400, '出料类型、进料仓库和重量不能为空');
  }

  const record = await OutboundRecord.create({
    record_code: generateRecordCode('OUT'),
    outbound_category: outboundCategory,
    inbound_warehouse_id: inboundWarehouseId,
    inbound_warehouse_name: inboundWarehouseName,
    outbound_warehouse_id: outboundWarehouseId,
    outbound_warehouse_name: outboundWarehouseName,
    material_spec: materialSpec,
    weight,
    operator_id: user.id,
    operator_name: user.realName,
    station_id: stationId,
    photo_urls: JSON.stringify(photoUrls || []),
    remark
  });

  ctx.body = {
    code: 200,
    message: '出料记录创建成功',
    data: { id: record.id, recordCode: record.record_code }
  };
};

/**
 * 库存统计
 * GET /api/inventory
 */
export const getInventory = async (ctx) => {
  const { stationId, startDate, endDate } = ctx.query;

  const inboundWhere = {};
  const outboundWhere = {};

  if (stationId) {
    inboundWhere.station_id = stationId;
    outboundWhere.station_id = stationId;
  }
  if (startDate && endDate) {
    inboundWhere.created_at = { [Op.between]: [new Date(startDate), new Date(endDate + ' 23:59:59')] };
    outboundWhere.created_at = { [Op.between]: [new Date(startDate), new Date(endDate + ' 23:59:59')] };
  }

  const inboundRecords = await InboundRecord.findAll({ where: inboundWhere });
  const outboundRecords = await OutboundRecord.findAll({ where: outboundWhere });

  const totalInbound = inboundRecords.reduce((sum, r) => sum + parseFloat(r.weight), 0);
  const totalOutbound = outboundRecords.reduce((sum, r) => sum + parseFloat(r.weight), 0);

  // 按分类统计
  const inboundByCategory = {};
  inboundRecords.forEach(r => {
    if (!inboundByCategory[r.waste_category]) {
      inboundByCategory[r.waste_category] = 0;
    }
    inboundByCategory[r.waste_category] += parseFloat(r.weight);
  });

  const outboundByCategory = {};
  outboundRecords.forEach(r => {
    if (!outboundByCategory[r.outbound_category]) {
      outboundByCategory[r.outbound_category] = 0;
    }
    outboundByCategory[r.outbound_category] += parseFloat(r.weight);
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: {
      totalInbound,
      totalOutbound,
      inventory: totalInbound - totalOutbound,
      inboundByCategory,
      outboundByCategory
    }
  };
};

export default {
  getWarehouses, createWarehouse, updateWarehouse,
  getIcCards, createIcCard, disableIcCard, verifyIcCard,
  getInboundRecords, createInboundRecord,
  getOutboundRecords, createOutboundRecord,
  getInventory
};
