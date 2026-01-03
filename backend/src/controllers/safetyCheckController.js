import { Op } from 'sequelize';
import { SafetyWorkType, SafetyCheckItem, sequelize } from '../models/index.js';
import { createError } from '../middlewares/error.js';
import ExcelJS from 'exceljs';

/**
 * ============================================
 * 安全工作性质管理
 * ============================================
 */

/**
 * 查询工作性质列表
 * GET /api/safety-work-types
 */
export const getWorkTypes = async (ctx) => {
  const { status, includeItems } = ctx.query;

  const where = {};
  if (status) {
    where.status = status;
  }

  const include = [];
  if (includeItems === 'true') {
    include.push({
      model: SafetyCheckItem,
      as: 'checkItems',
      where: { status: 'active' },
      required: false,
      order: [['sort_order', 'ASC']]
    });
  }

  const workTypes = await SafetyWorkType.findAll({
    where,
    include,
    order: [['is_default', 'DESC'], ['sort_order', 'ASC'], ['created_at', 'ASC']]
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: workTypes
  };
};

/**
 * 创建工作性质
 * POST /api/safety-work-types
 */
export const createWorkType = async (ctx) => {
  const { workTypeName, isDefault, sortOrder } = ctx.request.body;

  if (!workTypeName) {
    throw createError(400, '工作性质名称不能为空');
  }

  // 检查是否已存在同名工作性质
  const existing = await SafetyWorkType.findOne({
    where: { work_type_name: workTypeName }
  });

  if (existing) {
    throw createError(400, '已存在同名工作性质');
  }

  const workType = await SafetyWorkType.create({
    work_type_name: workTypeName,
    is_default: isDefault ? 1 : 0,
    sort_order: sortOrder || 0
  });

  ctx.body = {
    code: 200,
    message: '工作性质创建成功',
    data: { id: workType.id }
  };
};

/**
 * 更新工作性质
 * PUT /api/safety-work-types/:id
 */
export const updateWorkType = async (ctx) => {
  const { id } = ctx.params;
  const { workTypeName, isDefault, sortOrder, status } = ctx.request.body;

  const workType = await SafetyWorkType.findByPk(id);
  if (!workType) {
    throw createError(404, '工作性质不存在');
  }

  // 检查是否有同名工作性质
  if (workTypeName && workTypeName !== workType.work_type_name) {
    const existing = await SafetyWorkType.findOne({
      where: {
        work_type_name: workTypeName,
        id: { [Op.ne]: id }
      }
    });

    if (existing) {
      throw createError(400, '已存在同名工作性质');
    }
  }

  await workType.update({
    work_type_name: workTypeName !== undefined ? workTypeName : workType.work_type_name,
    is_default: isDefault !== undefined ? (isDefault ? 1 : 0) : workType.is_default,
    sort_order: sortOrder !== undefined ? sortOrder : workType.sort_order,
    status: status !== undefined ? status : workType.status
  });

  ctx.body = {
    code: 200,
    message: '工作性质更新成功',
    data: null
  };
};

/**
 * 删除工作性质
 * DELETE /api/safety-work-types/:id
 */
export const deleteWorkType = async (ctx) => {
  const { id } = ctx.params;

  const workType = await SafetyWorkType.findByPk(id);
  if (!workType) {
    throw createError(404, '工作性质不存在');
  }

  // 检查是否有关联的检查项目
  const itemCount = await SafetyCheckItem.count({
    where: { work_type_id: id }
  });

  if (itemCount > 0) {
    throw createError(400, '该工作性质下还有检查项目，无法删除');
  }

  await workType.destroy();

  ctx.body = {
    code: 200,
    message: '工作性质删除成功',
    data: null
  };
};

/**
 * ============================================
 * 安全检查项目管理
 * ============================================
 */

/**
 * 查询检查项目列表
 * GET /api/safety-check-items
 */
export const getCheckItems = async (ctx) => {
  const { workTypeId, status } = ctx.query;

  const where = {};
  if (workTypeId) {
    where.work_type_id = parseInt(workTypeId);
  }
  if (status) {
    where.status = status;
  }

  const items = await SafetyCheckItem.findAll({
    where,
    include: [
      { model: SafetyWorkType, as: 'workType', attributes: ['id', 'work_type_name', 'is_default'] }
    ],
    order: [['work_type_id', 'ASC'], ['sort_order', 'ASC'], ['created_at', 'ASC']]
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: items
  };
};

/**
 * 创建检查项目
 * POST /api/safety-check-items
 */
export const createCheckItem = async (ctx) => {
  const { workTypeId, itemName, itemStandard, sortOrder } = ctx.request.body;

  if (!workTypeId || !itemName) {
    throw createError(400, '工作性质和检查项目名称不能为空');
  }

  // 检查工作性质是否存在
  const workType = await SafetyWorkType.findByPk(workTypeId);
  if (!workType) {
    throw createError(404, '工作性质不存在');
  }

  // 检查是否已存在同名检查项目
  const existing = await SafetyCheckItem.findOne({
    where: {
      work_type_id: workTypeId,
      item_name: itemName
    }
  });

  if (existing) {
    throw createError(400, '该工作性质下已存在同名检查项目');
  }

  const item = await SafetyCheckItem.create({
    work_type_id: workTypeId,
    item_name: itemName,
    item_standard: itemStandard || null,
    sort_order: sortOrder || 0
  });

  ctx.body = {
    code: 200,
    message: '检查项目创建成功',
    data: { id: item.id }
  };
};

/**
 * 批量创建检查项目
 * POST /api/safety-check-items/batch
 */
export const batchCreateCheckItems = async (ctx) => {
  const { workTypeId, items } = ctx.request.body;

  if (!workTypeId || !items || !Array.isArray(items) || items.length === 0) {
    throw createError(400, '工作性质和检查项目列表不能为空');
  }

  // 检查工作性质是否存在
  const workType = await SafetyWorkType.findByPk(workTypeId);
  if (!workType) {
    throw createError(404, '工作性质不存在');
  }

  const t = await sequelize.transaction();

  try {
    const createdItems = await SafetyCheckItem.bulkCreate(
      items.map((item, index) => ({
        work_type_id: workTypeId,
        item_name: item.itemName,
        item_standard: item.itemStandard || null,
        sort_order: item.sortOrder !== undefined ? item.sortOrder : index
      })),
      { transaction: t }
    );

    await t.commit();

    ctx.body = {
      code: 200,
      message: `成功创建 ${createdItems.length} 个检查项目`,
      data: { count: createdItems.length }
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

/**
 * 更新检查项目
 * PUT /api/safety-check-items/:id
 */
export const updateCheckItem = async (ctx) => {
  const { id } = ctx.params;
  const { itemName, itemStandard, sortOrder, status } = ctx.request.body;

  const item = await SafetyCheckItem.findByPk(id);
  if (!item) {
    throw createError(404, '检查项目不存在');
  }

  // 检查是否有同名检查项目
  if (itemName && itemName !== item.item_name) {
    const existing = await SafetyCheckItem.findOne({
      where: {
        work_type_id: item.work_type_id,
        item_name: itemName,
        id: { [Op.ne]: id }
      }
    });

    if (existing) {
      throw createError(400, '该工作性质下已存在同名检查项目');
    }
  }

  await item.update({
    item_name: itemName !== undefined ? itemName : item.item_name,
    item_standard: itemStandard !== undefined ? itemStandard : item.item_standard,
    sort_order: sortOrder !== undefined ? sortOrder : item.sort_order,
    status: status !== undefined ? status : item.status
  });

  ctx.body = {
    code: 200,
    message: '检查项目更新成功',
    data: null
  };
};

/**
 * 删除检查项目
 * DELETE /api/safety-check-items/:id
 */
export const deleteCheckItem = async (ctx) => {
  const { id } = ctx.params;

  const item = await SafetyCheckItem.findByPk(id);
  if (!item) {
    throw createError(404, '检查项目不存在');
  }

  await item.destroy();

  ctx.body = {
    code: 200,
    message: '检查项目删除成功',
    data: null
  };
};

/**
 * 根据工作性质IDs查询检查项目（用于自检页面）
 * GET /api/safety-check-items/by-work-types
 */
export const getCheckItemsByWorkTypes = async (ctx) => {
  const { workTypeIds } = ctx.query;

  if (!workTypeIds) {
    throw createError(400, '工作性质ID列表不能为空');
  }

  const ids = workTypeIds.split(',').map(id => parseInt(id));

  const items = await SafetyCheckItem.findAll({
    where: {
      work_type_id: { [Op.in]: ids },
      status: 'active'
    },
    include: [
      { model: SafetyWorkType, as: 'workType', attributes: ['id', 'work_type_name', 'is_default'] }
    ],
    order: [['work_type_id', 'ASC'], ['sort_order', 'ASC']]
  });

  // 按工作性质分组
  const grouped = {};
  items.forEach(item => {
    const workTypeId = item.work_type_id;
    if (!grouped[workTypeId]) {
      grouped[workTypeId] = {
        workType: item.workType,
        items: []
      };
    }
    grouped[workTypeId].items.push(item);
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: Object.values(grouped)
  };
};

/**
 * 获取安全检查项目导入模板
 * GET /api/safety-check-items/template
 */
export const getCheckItemsTemplate = async (ctx) => {
  try {
    // 创建工作簿
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('安全检查项目');

    // 设置列标题
    worksheet.columns = [
      { header: '工作性质', key: 'workTypeName', width: 20 },
      { header: '检查项目', key: 'itemName', width: 30 },
      { header: '检查标准', key: 'itemStandard', width: 50 },
      { header: '是否默认必选(是/否)', key: 'isDefault', width: 20 }
    ];

    // 添加示例数据
    worksheet.addRow({
      workTypeName: '基本工作',
      itemName: '佩戴安全帽',
      itemStandard: '进入作业区域必须佩戴安全帽',
      isDefault: '是'
    });
    worksheet.addRow({
      workTypeName: '基本工作',
      itemName: '穿戴反光背心',
      itemStandard: '作业期间必须穿戴反光背心',
      isDefault: '是'
    });
    worksheet.addRow({
      workTypeName: '焊接',
      itemName: '佩戴防护眼镜',
      itemStandard: '焊接作业时必须佩戴防护眼镜',
      isDefault: '否'
    });
    worksheet.addRow({
      workTypeName: '焊接',
      itemName: '配备灭火器',
      itemStandard: '焊接作业区域需配备灭火器',
      isDefault: '否'
    });

    // 设置标题行样式
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // 添加说明sheet
    const instructionSheet = workbook.addWorksheet('填写说明');
    instructionSheet.columns = [
      { header: '说明', key: 'instruction', width: 80 }
    ];

    const instructions = [
      '1. 工作性质：如"基本工作"、"焊接"、"高空作业"等，相同工作性质的检查项目会归为一组',
      '2. 检查项目：具体的检查内容名称',
      '3. 检查标准：该检查项目的具体要求或标准',
      '4. 是否默认必选：填"是"表示该工作性质在自检时会自动勾选，填"否"表示需要手动选择',
      '',
      '注意事项：',
      '- 同一工作性质下的检查项目名称不能重复',
      '- 工作性质名称相同的行会自动归为同一组',
      '- 首次出现的工作性质会根据"是否默认必选"列设置默认属性',
      '- 导入时会自动创建不存在的工作性质'
    ];

    instructions.forEach(text => {
      instructionSheet.addRow({ instruction: text });
    });

    // 设置响应头
    ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    ctx.set('Content-Disposition', 'attachment; filename=safety-check-items-template.xlsx');

    // 生成buffer并返回
    ctx.body = await workbook.xlsx.writeBuffer();
  } catch (error) {
    
    throw createError(500, '生成模板失败');
  }
};

/**
 * 导入安全检查项目
 * POST /api/safety-check-items/import
 */
export const importCheckItems = async (ctx) => {
  try {
    const file = ctx.file || ctx.request.file || ctx.request.files?.file;
    if (!file) {
      throw createError(400, '请上传文件');
    }

    const workbook = new ExcelJS.Workbook();
    if (file.buffer) {
      await workbook.xlsx.load(file.buffer);
    } else {
      const filePath = file.path || file.filepath;
      if (!filePath) {
        throw createError(400, '读取文件失败');
      }
      await workbook.xlsx.readFile(filePath);
    }

    const worksheet = workbook.getWorksheet('安全检查项目') || workbook.worksheets[0];
    if (!worksheet) {
      throw createError(400, '无法读取工作表');
    }

    const results = [];
    const workTypeCache = {}; // 缓存工作性质
    const t = await sequelize.transaction();

    try {
      // 遍历行（跳过标题行）
      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);
        const workTypeName = row.getCell(1).value?.toString().trim();
        const itemName = row.getCell(2).value?.toString().trim();
        const itemStandard = row.getCell(3).value?.toString().trim() || null;
        const isDefaultStr = row.getCell(4).value?.toString().trim();

        // 跳过空行
        if (!workTypeName || !itemName) {
          continue;
        }

        // 获取或创建工作性质
        let workType = workTypeCache[workTypeName];
        if (!workType) {
          workType = await SafetyWorkType.findOne({
            where: { work_type_name: workTypeName },
            transaction: t
          });

          if (!workType) {
            // 创建新工作性质
            const isDefault = isDefaultStr === '是' ? 1 : 0;
            workType = await SafetyWorkType.create({
              work_type_name: workTypeName,
              is_default: isDefault,
              sort_order: Object.keys(workTypeCache).length,
              status: 'active'
            }, { transaction: t });
          }
          workTypeCache[workTypeName] = workType;
        }

        // 检查是否已存在同名检查项目
        const existingItem = await SafetyCheckItem.findOne({
          where: {
            work_type_id: workType.id,
            item_name: itemName
          },
          transaction: t
        });

        if (existingItem) {
          results.push({
            row: rowNumber,
            workTypeName,
            itemName,
            status: 'duplicate',
            message: '该工作性质下已存在同名检查项目'
          });
          continue;
        }

        // 创建检查项目
        await SafetyCheckItem.create({
          work_type_id: workType.id,
          item_name: itemName,
          item_standard: itemStandard,
          sort_order: 0,
          status: 'active'
        }, { transaction: t });

        results.push({
          row: rowNumber,
          workTypeName,
          itemName,
          status: 'success',
          message: '导入成功'
        });
      }

      await t.commit();

      const successCount = results.filter(r => r.status === 'success').length;
      const duplicateCount = results.filter(r => r.status === 'duplicate').length;

      ctx.body = {
        code: 200,
        message: `导入完成：成功${successCount}条，重复跳过${duplicateCount}条`,
        data: {
          success: successCount,
          duplicate: duplicateCount,
          details: results
        }
      };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  } catch (error) {
    
    if (error.status) {
      throw error;
    }
    throw createError(500, `导入失败: ${error.message}`);
  }
};

export default {
  getWorkTypes,
  createWorkType,
  updateWorkType,
  deleteWorkType,
  getCheckItems,
  createCheckItem,
  batchCreateCheckItems,
  updateCheckItem,
  deleteCheckItem,
  getCheckItemsByWorkTypes,
  getCheckItemsTemplate,
  importCheckItems
};
