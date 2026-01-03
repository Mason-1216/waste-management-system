import { Op } from 'sequelize';
import { PriceManagement } from '../models/index.js';
import { createError } from '../middlewares/error.js';
import { getPagination, formatPaginationResponse } from '../utils/helpers.js';

/**
 * 查询单价列表
 * GET /api/prices
 */
export const getPrices = async (ctx) => {
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const { keyword, itemCategory, status } = ctx.query;

  const where = {};

  if (keyword) {
    where.item_name = { [Op.like]: `%${keyword}%` };
  }

  if (itemCategory) {
    where.item_category = itemCategory;
  }

  if (status) {
    where.status = status;
  }

  const result = await PriceManagement.findAndCountAll({
    where,
    offset,
    limit,
    order: [['item_category', 'ASC'], ['item_name', 'ASC']]
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: formatPaginationResponse(result, page, pageSize)
  };
};

/**
 * 新增单价
 * POST /api/prices
 */
export const createPrice = async (ctx) => {
  const { itemName, itemCategory, specification, unit, unitPrice, effectiveDate } = ctx.request.body;

  if (!itemName || !unitPrice) {
    throw createError(400, '项目名称和单价不能为空');
  }

  const price = await PriceManagement.create({
    item_name: itemName,
    item_category: itemCategory,
    specification,
    unit,
    unit_price: unitPrice,
    effective_date: effectiveDate,
    status: 'active',
    created_by: ctx.state.user.id
  });

  ctx.body = {
    code: 200,
    message: '单价创建成功',
    data: { id: price.id }
  };
};

/**
 * 编辑单价
 * PUT /api/prices/:id
 */
export const updatePrice = async (ctx) => {
  const { id } = ctx.params;
  const { itemName, itemCategory, specification, unit, unitPrice, effectiveDate, status } = ctx.request.body;

  const price = await PriceManagement.findByPk(id);
  if (!price) {
    throw createError(404, '单价不存在');
  }

  await price.update({
    item_name: itemName,
    item_category: itemCategory,
    specification,
    unit,
    unit_price: unitPrice,
    effective_date: effectiveDate,
    status
  });

  ctx.body = { code: 200, message: '单价更新成功', data: null };
};

/**
 * 删除单价
 * DELETE /api/prices/:id
 */
export const deletePrice = async (ctx) => {
  const { id } = ctx.params;

  const price = await PriceManagement.findByPk(id);
  if (!price) {
    throw createError(404, '单价不存在');
  }

  await price.destroy();

  ctx.body = { code: 200, message: '单价删除成功', data: null };
};

/**
 * 获取所有有效单价
 * GET /api/prices/all
 */
export const getAllPrices = async (ctx) => {
  const { itemCategory } = ctx.query;

  const where = { status: 'active' };
  if (itemCategory) {
    where.item_category = itemCategory;
  }

  const prices = await PriceManagement.findAll({
    where,
    order: [['item_name', 'ASC']]
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: prices
  };
};

/**
 * 获取单价分类列表
 * GET /api/prices/categories
 */
export const getPriceCategories = async (ctx) => {
  const categories = await PriceManagement.findAll({
    attributes: ['item_category'],
    where: { item_category: { [Op.ne]: null } },
    group: ['item_category']
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: categories.map(c => c.item_category)
  };
};

export default {
  getPrices,
  createPrice,
  updatePrice,
  deletePrice,
  getAllPrices,
  getPriceCategories
};
