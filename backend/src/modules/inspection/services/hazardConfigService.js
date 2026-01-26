import { HazardCategory, HazardRootCause } from '../../../models/index.js';
import { Op } from 'sequelize';

// =============== 隐患类别管理 ===============

// 获取隐患类别列表
export const getHazardCategories = async (ctx) => {
  try {
    const { status } = ctx.query;
    const where = {};

    if (status !== undefined) {
      where.status = status;
    }

    const categories = await HazardCategory.findAll({
      where,
      order: [['sort_order', 'ASC'], ['id', 'ASC']]
    });

    ctx.body = {
      code: 200,
      data: categories,
      message: '获取成功'
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { code: 500, message: error.message };
  }
};

// 创建隐患类别
export const createHazardCategory = async (ctx) => {
  try {
    const { categoryName } = ctx.request.body;

    if (!categoryName) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '类别名称不能为空' };
      return;
    }

    // 检查是否已存在
    const existing = await HazardCategory.findOne({
      where: { category_name: categoryName }
    });

    if (existing) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '该类别已存在' };
      return;
    }

    // 获取最大排序值
    const maxSort = await HazardCategory.max('sort_order') || 0;

    const category = await HazardCategory.create({
      category_name: categoryName,
      sort_order: maxSort + 1,
      is_system: 0,
      status: 1
    });

    ctx.body = {
      code: 200,
      data: category,
      message: '创建成功'
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { code: 500, message: error.message };
  }
};

// 更新隐患类别
export const updateHazardCategory = async (ctx) => {
  try {
    const { id } = ctx.params;
    const { categoryName, sortOrder, status } = ctx.request.body;

    const category = await HazardCategory.findByPk(id);
    if (!category) {
      ctx.status = 404;
      ctx.body = { code: 404, message: '类别不存在' };
      return;
    }

    // 检查名称是否重复
    if (categoryName && categoryName !== category.category_name) {
      const existing = await HazardCategory.findOne({
        where: {
          category_name: categoryName,
          id: { [Op.ne]: id }
        }
      });
      if (existing) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '该类别名称已存在' };
        return;
      }
    }

    await category.update({
      category_name: categoryName !== undefined ? categoryName : category.category_name,
      sort_order: sortOrder !== undefined ? sortOrder : category.sort_order,
      status: status !== undefined ? status : category.status
    });

    ctx.body = {
      code: 200,
      data: category,
      message: '更新成功'
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { code: 500, message: error.message };
  }
};

// 删除隐患类别
export const deleteHazardCategory = async (ctx) => {
  try {
    const { id } = ctx.params;

    const category = await HazardCategory.findByPk(id);
    if (!category) {
      ctx.status = 404;
      ctx.body = { code: 404, message: '类别不存在' };
      return;
    }

    // 系统预置类别不允许删除
    if (category.is_system === 1) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '系统预置类别不允许删除' };
      return;
    }

    await category.destroy();

    ctx.body = {
      code: 200,
      message: '删除成功'
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { code: 500, message: error.message };
  }
};

// =============== 根本原因管理 ===============

// 获取根本原因列表
export const getHazardRootCauses = async (ctx) => {
  try {
    const { status } = ctx.query;
    const where = {};

    if (status !== undefined) {
      where.status = status;
    }

    const causes = await HazardRootCause.findAll({
      where,
      order: [['sort_order', 'ASC'], ['id', 'ASC']]
    });

    const decodeMojibake = (value) => {
      if (!value) return value;
      const text = String(value);
      if (/[\u4E00-\u9FFF]/.test(text)) return text;
      if (/[\u00C0-\u00FF]/.test(text)) {
        try {
          return Buffer.from(text, 'latin1').toString('utf8');
        } catch {
          return text;
        }
      }
      return text;
    };

    ctx.body = {
      code: 200,
      data: causes.map(cause => ({
        ...cause.toJSON(),
        cause_name: decodeMojibake(cause.cause_name)
      })),
      message: '获取成功'
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { code: 500, message: error.message };
  }
};

// 创建根本原因
export const createHazardRootCause = async (ctx) => {
  try {
    const { causeName } = ctx.request.body;

    if (!causeName) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '原因名称不能为空' };
      return;
    }

    // 检查是否已存在
    const existing = await HazardRootCause.findOne({
      where: { cause_name: causeName }
    });

    if (existing) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '该原因已存在' };
      return;
    }

    // 获取最大排序值
    const maxSort = await HazardRootCause.max('sort_order') || 0;

    const cause = await HazardRootCause.create({
      cause_name: causeName,
      sort_order: maxSort + 1,
      is_system: 0,
      status: 1
    });

    ctx.body = {
      code: 200,
      data: cause,
      message: '创建成功'
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { code: 500, message: error.message };
  }
};

// 更新根本原因
export const updateHazardRootCause = async (ctx) => {
  try {
    const { id } = ctx.params;
    const { causeName, sortOrder, status } = ctx.request.body;

    const cause = await HazardRootCause.findByPk(id);
    if (!cause) {
      ctx.status = 404;
      ctx.body = { code: 404, message: '原因不存在' };
      return;
    }

    // 检查名称是否重复
    if (causeName && causeName !== cause.cause_name) {
      const existing = await HazardRootCause.findOne({
        where: {
          cause_name: causeName,
          id: { [Op.ne]: id }
        }
      });
      if (existing) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '该原因名称已存在' };
        return;
      }
    }

    await cause.update({
      cause_name: causeName !== undefined ? causeName : cause.cause_name,
      sort_order: sortOrder !== undefined ? sortOrder : cause.sort_order,
      status: status !== undefined ? status : cause.status
    });

    ctx.body = {
      code: 200,
      data: cause,
      message: '更新成功'
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { code: 500, message: error.message };
  }
};

// 删除根本原因
export const deleteHazardRootCause = async (ctx) => {
  try {
    const { id } = ctx.params;

    const cause = await HazardRootCause.findByPk(id);
    if (!cause) {
      ctx.status = 404;
      ctx.body = { code: 404, message: '原因不存在' };
      return;
    }

    // 系统预置原因不允许删除
    if (cause.is_system === 1) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '系统预置原因不允许删除' };
      return;
    }

    await cause.destroy();

    ctx.body = {
      code: 200,
      message: '删除成功'
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { code: 500, message: error.message };
  }
};

export default {
  getHazardCategories,
  createHazardCategory,
  updateHazardCategory,
  deleteHazardCategory,
  getHazardRootCauses,
  createHazardRootCause,
  updateHazardRootCause,
  deleteHazardRootCause
};
