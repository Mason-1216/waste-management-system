import { Op } from 'sequelize';
import { Company } from '../models/index.js';
import { getPagination, formatPaginationResponse, getOrderBy } from '../utils/helpers.js';

/**
 * 查询公司列表
 * GET /api/companies
 */
export const getCompanies = async (ctx) => {
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const order = getOrderBy(ctx.query, { field: 'created_at', order: 'DESC' });
  const { keyword, status } = ctx.query;

  const where = {};
  if (keyword) {
    where.company_name = { [Op.like]: `%${keyword}%` };
  }
  if (status) {
    where.status = status;
  }

  const result = await Company.findAndCountAll({
    where,
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
 * 获取所有公司（不分页）
 * GET /api/companies/all
 */
export const getAllCompanies = async (ctx) => {
  const companies = await Company.findAll({
    where: { status: 'active' },
    order: [['company_name', 'ASC']]
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: companies
  };
};

/**
 * 创建公司
 * POST /api/companies
 */
export const createCompany = async (ctx) => {
  const { company_name, company_code, description, status } = ctx.request.body;

  if (!company_name) {
    ctx.status = 400;
    ctx.body = { code: 400, message: '公司名称不能为空' };
    return;
  }

  // 检查公司名称是否已存在
  const existingName = await Company.findOne({ where: { company_name } });
  if (existingName) {
    ctx.status = 400;
    ctx.body = { code: 400, message: '公司名称已存在' };
    return;
  }

  // 检查公司编码是否已存在（如果提供了编码）
  if (company_code) {
    const existingCode = await Company.findOne({ where: { company_code } });
    if (existingCode) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '公司编码已存在' };
      return;
    }
  }

  const company = await Company.create({
    company_name,
    company_code,
    description,
    status: status || 'active'
  });

  ctx.body = {
    code: 200,
    message: '公司创建成功',
    data: company
  };
};

/**
 * 更新公司
 * PUT /api/companies/:id
 */
export const updateCompany = async (ctx) => {
  const { id } = ctx.params;
  const { company_name, company_code, description, status } = ctx.request.body;

  const company = await Company.findByPk(id);
  if (!company) {
    ctx.status = 404;
    ctx.body = { code: 404, message: '公司不存在' };
    return;
  }

  // 检查公司名称是否与其他公司重复
  if (company_name && company_name !== company.company_name) {
    const existingName = await Company.findOne({
      where: { company_name, id: { [Op.ne]: id } }
    });
    if (existingName) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '公司名称已存在' };
      return;
    }
  }

  // 检查公司编码是否与其他公司重复
  if (company_code && company_code !== company.company_code) {
    const existingCode = await Company.findOne({
      where: { company_code, id: { [Op.ne]: id } }
    });
    if (existingCode) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '公司编码已存在' };
      return;
    }
  }

  await company.update({
    company_name: company_name || company.company_name,
    company_code: company_code !== undefined ? company_code : company.company_code,
    description: description !== undefined ? description : company.description,
    status: status || company.status
  });

  ctx.body = {
    code: 200,
    message: '公司更新成功',
    data: company
  };
};

/**
 * 删除公司
 * DELETE /api/companies/:id
 */
export const deleteCompany = async (ctx) => {
  const { id } = ctx.params;

  const company = await Company.findByPk(id);
  if (!company) {
    ctx.status = 404;
    ctx.body = { code: 404, message: '公司不存在' };
    return;
  }

  await company.destroy();

  ctx.body = {
    code: 200,
    message: '公司删除成功'
  };
};

export default {
  getCompanies,
  getAllCompanies,
  createCompany,
  updateCompany,
  deleteCompany
};
