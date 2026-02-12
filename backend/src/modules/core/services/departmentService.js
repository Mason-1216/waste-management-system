import { Op } from 'sequelize';
import { Department, User } from '../../../models/index.js';
import { getPagination, formatPaginationResponse, getOrderBy } from '../../../utils/helpers.js';

/**
 * 查询部门列表
 * GET /api/departments
 */
export const getDepartments = async (ctx) => {
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const order = getOrderBy(ctx.query, { field: 'created_at', order: 'DESC' });
  const { keyword, status } = ctx.query;

  const where = {};
  if (keyword) {
    where.dept_name = { [Op.like]: `%${keyword}%` };
  }
  if (status) {
    where.status = status;
  }

  const result = await Department.findAndCountAll({
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
 * 创建部门
 * POST /api/departments
 */
export const createDepartment = async (ctx) => {
  const { dept_name, dept_code, description, status } = ctx.request.body;

  if (!dept_name) {
    ctx.status = 400;
    ctx.body = { code: 400, message: '部门名称不能为空' };
    return;
  }

  // 检查部门名称是否已存在
  const existingName = await Department.findOne({ where: { dept_name } });
  if (existingName) {
    ctx.status = 400;
    ctx.body = { code: 400, message: '部门名称已存在' };
    return;
  }

  // 检查部门编码是否已存在（如果提供了编码）
  if (dept_code) {
    const existingCode = await Department.findOne({ where: { dept_code } });
    if (existingCode) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '部门编码已存在' };
      return;
    }
  }

  const department = await Department.create({
    dept_name,
    dept_code,
    description,
    status: status || 'active'
  });

  ctx.body = {
    code: 200,
    message: '部门创建成功',
    data: department
  };
};

/**
 * 更新部门
 * PUT /api/departments/:id
 */
export const updateDepartment = async (ctx) => {
  const { id } = ctx.params;
  const { dept_name, dept_code, description, status } = ctx.request.body;

  const department = await Department.findByPk(id);
  if (!department) {
    ctx.status = 404;
    ctx.body = { code: 404, message: '部门不存在' };
    return;
  }

  // 检查部门名称是否与其他部门重复
  if (dept_name && dept_name !== department.dept_name) {
    const existingName = await Department.findOne({
      where: { dept_name, id: { [Op.ne]: id } }
    });
    if (existingName) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '部门名称已存在' };
      return;
    }
  }

  // 检查部门编码是否与其他部门重复
  if (dept_code && dept_code !== department.dept_code) {
    const existingCode = await Department.findOne({
      where: { dept_code, id: { [Op.ne]: id } }
    });
    if (existingCode) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '部门编码已存在' };
      return;
    }
  }

  await department.update({
    dept_name: dept_name || department.dept_name,
    dept_code: dept_code !== undefined ? dept_code : department.dept_code,
    description: description !== undefined ? description : department.description,
    status: status || department.status
  });

  ctx.body = {
    code: 200,
    message: '部门更新成功',
    data: department
  };
};

/**
 * 删除部门
 * DELETE /api/departments/:id
 */
export const deleteDepartment = async (ctx) => {
  const { id } = ctx.params;

  const department = await Department.findByPk(id);
  if (!department) {
    ctx.status = 404;
    ctx.body = { code: 404, message: '部门不存在' };
    return;
  }

  // 检查是否有用户属于该部门
  // User model stores department as department_name text, not department_id.
  const usersInDept = await User.count({ where: { department_name: department.dept_name } });
  if (usersInDept > 0) {
    ctx.status = 400;
    ctx.body = { code: 400, message: `无法删除，该部门下还有 ${usersInDept} 名用户` };
    return;
  }

  await department.destroy();

  ctx.body = {
    code: 200,
    message: '部门删除成功'
  };
};

export default {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
