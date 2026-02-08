import { Op } from 'sequelize';
import { SafetyWorkType, SafetyCheckItem, sequelize } from '../../../models/index.js';
import { createError } from '../../../middlewares/error.js';
import ExcelJS from 'exceljs';
import { addTemplateInstructionSheet, applyTemplateHeaderStyle } from '../../import_export/utils/excelTemplate.js';

const normalizeParentId = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const parseBooleanFlag = (value) => {
  if (value === true || value === 1 || value === '1' || value === 'true' || value === '\u662f' || value === '是') {
    return 1;
  }
  if (value === false || value === 0 || value === '0' || value === 'false' || value === '\u5426' || value === '否') {
    return 0;
  }
  return null;
};

const parseTriggerValue = (value) => {
  if (value === true || value === 1 || value === '1' || value === 'true' || value === '\u662f' || value === '是') {
    return 1;
  }
  if (value === false || value === 0 || value === '0' || value === 'false' || value === '\u5426' || value === '否') {
    return 0;
  }
  return null;
};

const parseSortOrder = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

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
  const { workTypeName, isDefault, sortOrder, points } = ctx.request.body;

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
    sort_order: sortOrder || 0,
    points: points || 0
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
  const { workTypeName, isDefault, sortOrder, status, points } = ctx.request.body;

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
    status: status !== undefined ? status : workType.status,
    points: points !== undefined ? points : workType.points
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

  const t = await sequelize.transaction();
  try {
    await SafetyCheckItem.destroy({
      where: { work_type_id: id },
      transaction: t
    });
    await workType.destroy({ transaction: t });
    await t.commit();
  } catch (error) {
    await t.rollback();
    throw error;
  }

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
    order: [['work_type_id', 'ASC'], ['parent_id', 'ASC'], ['sort_order', 'ASC'], ['created_at', 'ASC']]
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
  const {
    workTypeId,
    itemName,
    itemStandard,
    sortOrder,
    parentId,
    enableChildren,
    triggerValue,
    status
  } = ctx.request.body;

  if (!workTypeId || !itemName) {
    throw createError(400, '工作性质和检查项目名称不能为空');
  }

  // 检查工作性质是否存在
  const workType = await SafetyWorkType.findByPk(workTypeId);
  const normalizedParentId = normalizeParentId(parentId);
  const resolvedWorkTypeId = Number(workTypeId);

  let parentItem = null;
  if (workType && normalizedParentId !== null) {
    parentItem = await SafetyCheckItem.findByPk(normalizedParentId);
    if (!parentItem) {
      throw createError(400, '父级检查项不存在');
    }
    if (!Number.isNaN(resolvedWorkTypeId) && parentItem.work_type_id !== resolvedWorkTypeId) {
      throw createError(400, '父级检查项不属于当前工作性质');
    }
    if (parentItem.parent_id !== null && parentItem.parent_id !== undefined) {
      throw createError(400, '仅支持二级联动关系');
    }
  }

  if (!workType) {
    throw createError(404, '工作性质不存在');
  }

  // 检查是否已存在同名检查项目
  const existing = await SafetyCheckItem.findOne({
    where: {
      work_type_id: workTypeId,
      item_name: itemName,
      parent_id: normalizedParentId
    }
  });

  if (existing) {
    throw createError(400, '该工作性质下已存在同名检查项目');
  }

  let enableChildrenValue = 0;
  let triggerValueValue = null;
  if (normalizedParentId !== null) {
    const parsedTrigger = parseTriggerValue(triggerValue);
    triggerValueValue = parsedTrigger === null ? 1 : parsedTrigger;
  } else {
    const parsedEnable = parseBooleanFlag(enableChildren);
    enableChildrenValue = parsedEnable === null ? 0 : parsedEnable;
  }

  const item = await SafetyCheckItem.create({
    work_type_id: workTypeId,
    item_name: itemName,
    item_standard: itemStandard !== undefined ? itemStandard : null,
    sort_order: sortOrder !== undefined ? sortOrder : 0,
    status: status !== undefined ? status : 'active',
    parent_id: normalizedParentId,
    enable_children: normalizedParentId !== null ? 0 : enableChildrenValue,
    trigger_value: triggerValueValue
  });

  if (parentItem && parentItem.enable_children !== 1) {
    await parentItem.update({ enable_children: 1 });
  }

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
    const normalizedItems = items.map((item, index) => {
      const normalizedParentId = normalizeParentId(item.parentId);
      const parsedEnable = parseBooleanFlag(item.enableChildren);
      const parsedTrigger = parseTriggerValue(item.triggerValue);
      const enableChildrenValue = normalizedParentId !== null
        ? 0
        : (parsedEnable === null ? 0 : parsedEnable);
      const triggerValueValue = normalizedParentId !== null
        ? (parsedTrigger === null ? 1 : parsedTrigger)
        : null;

      return {
        work_type_id: workTypeId,
        item_name: item.itemName,
        item_standard: item.itemStandard !== undefined ? item.itemStandard : null,
        sort_order: item.sortOrder !== undefined ? item.sortOrder : index,
        status: item.status !== undefined ? item.status : 'active',
        parent_id: normalizedParentId,
        enable_children: enableChildrenValue,
        trigger_value: triggerValueValue
      };
    });

    const parentIds = Array.from(new Set(
      normalizedItems
        .map(item => item.parent_id)
        .filter(value => value !== null && value !== undefined)
    ));

    if (parentIds.length > 0) {
      const parentItems = await SafetyCheckItem.findAll({
        where: { id: { [Op.in]: parentIds }, work_type_id: workTypeId },
        transaction: t
      });
      if (parentItems.length !== parentIds.length) {
        throw createError(400, '父级检查项不存在或不属于当前工作性质');
      }
      const invalidParent = parentItems.find(parent => parent.parent_id !== null && parent.parent_id !== undefined);
      if (invalidParent) {
        throw createError(400, '仅支持二级联动关系');
      }
    }

    const createdItems = await SafetyCheckItem.bulkCreate(
      normalizedItems,
      { transaction: t }
    );

    if (parentIds.length > 0) {
      await SafetyCheckItem.update(
        { enable_children: 1 },
        { where: { id: { [Op.in]: parentIds } }, transaction: t }
      );
    }

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
  const {
    itemName,
    itemStandard,
    sortOrder,
    status,
    parentId,
    enableChildren,
    triggerValue
  } = ctx.request.body;

  const item = await SafetyCheckItem.findByPk(id);
  if (!item) {
    throw createError(404, '检查项目不存在');
  }

  const hasParentId = Object.prototype.hasOwnProperty.call(ctx.request.body, 'parentId');
  const hasEnableChildren = Object.prototype.hasOwnProperty.call(ctx.request.body, 'enableChildren');
  const hasTriggerValue = Object.prototype.hasOwnProperty.call(ctx.request.body, 'triggerValue');

  let nextParentId = item.parent_id;
  if (hasParentId) {
    nextParentId = normalizeParentId(parentId);
  }

  let parentItem = null;
  if (nextParentId !== null && nextParentId !== undefined) {
    if (Number(nextParentId) === Number(id)) {
      throw createError(400, '父级检查项不能是自身');
    }
    parentItem = await SafetyCheckItem.findByPk(nextParentId);
    if (!parentItem) {
      throw createError(400, '父级检查项不存在');
    }
    if (parentItem.work_type_id !== item.work_type_id) {
      throw createError(400, '父级检查项不属于当前工作性质');
    }
    if (parentItem.parent_id !== null && parentItem.parent_id !== undefined) {
      throw createError(400, '仅支持二级联动关系');
    }
  }

  // 检查是否有同名检查项目
  if (itemName && itemName !== item.item_name) {
    const existing = await SafetyCheckItem.findOne({
      where: {
        work_type_id: item.work_type_id,
        item_name: itemName,
        parent_id: nextParentId,
        id: { [Op.ne]: id }
      }
    });

    if (existing) {
      throw createError(400, '该工作性质下已存在同名检查项目');
    }
  }

  let nextEnableChildren = item.enable_children;
  let nextTriggerValue = item.trigger_value;

  if (nextParentId !== null && nextParentId !== undefined) {
    nextEnableChildren = 0;
    if (hasTriggerValue) {
      const parsedTrigger = parseTriggerValue(triggerValue);
      nextTriggerValue = parsedTrigger === null ? 1 : parsedTrigger;
    } else if (hasParentId && item.parent_id !== nextParentId) {
      nextTriggerValue = 1;
    }
  } else {
    nextTriggerValue = null;
    if (hasEnableChildren) {
      const parsedEnable = parseBooleanFlag(enableChildren);
      nextEnableChildren = parsedEnable === null ? 0 : parsedEnable;
    }
  }

  await item.update({
    item_name: itemName !== undefined ? itemName : item.item_name,
    item_standard: itemStandard !== undefined ? itemStandard : item.item_standard,
    sort_order: sortOrder !== undefined ? sortOrder : item.sort_order,
    status: status !== undefined ? status : item.status,
    parent_id: nextParentId,
    enable_children: nextEnableChildren,
    trigger_value: nextTriggerValue
  });

  if (parentItem && parentItem.enable_children !== 1) {
    await parentItem.update({ enable_children: 1 });
  }

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

  await SafetyCheckItem.destroy({ where: { parent_id: id } });
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
      [Op.or]: [
        { status: 'active' },
        { status: null },
        { status: '' }
      ]
    },
    include: [
      { model: SafetyWorkType, as: 'workType', attributes: ['id', 'work_type_name', 'is_default'] }
    ],
    order: [['work_type_id', 'ASC'], ['parent_id', 'ASC'], ['sort_order', 'ASC']]
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
      { header: '是否默认必选(是/否)', key: 'isDefault', width: 20 },
      { header: '父级检查项目', key: 'parentItemName', width: 30 },
      { header: '是否启用子项联动(是/否)', key: 'enableChildren', width: 24 },
      { header: '子项触发值(是/否)', key: 'triggerValue', width: 20 },
      { header: '排序', key: 'sortOrder', width: 10 }
    ];

    // 添加示例数据
    worksheet.addRow({
      workTypeName: '基本工作',
      itemName: '佩戴安全帽',
      itemStandard: '进入作业区域必须佩戴安全帽',
      isDefault: '是',
      parentItemName: '',
      enableChildren: '',
      triggerValue: '',
      sortOrder: 1
    });
    worksheet.addRow({
      workTypeName: '基本工作',
      itemName: '穿戴反光背心',
      itemStandard: '作业期间必须穿戴反光背心',
      isDefault: '是',
      parentItemName: '',
      enableChildren: '',
      triggerValue: '',
      sortOrder: 2
    });
    worksheet.addRow({
      workTypeName: '焊接',
      itemName: '佩戴防护眼镜',
      itemStandard: '焊接作业时必须佩戴防护眼镜',
      isDefault: '否',
      parentItemName: '',
      enableChildren: '',
      triggerValue: '',
      sortOrder: 3
    });
    worksheet.addRow({
      workTypeName: '焊接',
      itemName: '焊接点是否连接通电设备',
      itemStandard: '选项：是/否',
      isDefault: '否',
      parentItemName: '',
      enableChildren: '是',
      triggerValue: '',
      sortOrder: 4
    });
    worksheet.addRow({
      workTypeName: '焊接',
      itemName: '断开维修设备电源空开',
      itemStandard: '',
      isDefault: '否',
      parentItemName: '焊接点是否连接通电设备',
      enableChildren: '',
      triggerValue: '是',
      sortOrder: 5
    });
    worksheet.addRow({
      workTypeName: '焊接',
      itemName: '悬挂“设备维修禁止合闸”警示牌',
      itemStandard: '',
      isDefault: '否',
      parentItemName: '焊接点是否连接通电设备',
      enableChildren: '',
      triggerValue: '是',
      sortOrder: 6
    });
    worksheet.addRow({
      workTypeName: '焊接',
      itemName: '确认焊接点未连接通电设备',
      itemStandard: '',
      isDefault: '否',
      parentItemName: '焊接点是否连接通电设备',
      enableChildren: '',
      triggerValue: '否',
      sortOrder: 7
    });

    // 设置标题行样式
    applyTemplateHeaderStyle(worksheet, 1);
    addTemplateInstructionSheet(workbook, [
      ['工作性质', '必填，如“基本工作/焊接/高空作业”等；相同工作性质会归为一组。'],
      ['检查项目', '必填，检查内容名称。'],
      ['检查标准', '选填，具体要求或标准。'],
      ['是否默认必选(是/否)', '必填，填“是/否”。首次出现的工作性质会按该列设置默认必选。'],
      ['父级检查项目', '选填，子项必填。填写父级检查项目名称，父项留空。'],
      ['是否启用子项联动(是/否)', '选填，仅父项填写。开启后，子项会按触发值显示。'],
      ['子项触发值(是/否)', '选填，仅子项填写。父项选择为“是/否”时显示该子项。'],
      ['排序', '选填，数值越小越靠前，空白时按导入顺序自动排序。'],
      ['注意事项', '同一工作性质 + 同一父级下检查项目名称不能重复；导入时会自动创建不存在的工作性质；如存在子项且父项未开启联动，会自动开启。']
    ]);

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
      const rawRows = [];
      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);
        const workTypeCell = row.getCell(1).value;
        const itemCell = row.getCell(2).value;
        const standardCell = row.getCell(3).value;
        const isDefaultCell = row.getCell(4).value;
        const parentCell = row.getCell(5).value;
        const enableChildrenCell = row.getCell(6).value;
        const triggerValueCell = row.getCell(7).value;
        const sortOrderCell = row.getCell(8).value;

        const workTypeName = workTypeCell ? workTypeCell.toString().trim() : '';
        const itemName = itemCell ? itemCell.toString().trim() : '';
        const itemStandard = standardCell ? standardCell.toString().trim() : null;
        const isDefaultStr = isDefaultCell ? isDefaultCell.toString().trim() : '';
        const parentItemName = parentCell ? parentCell.toString().trim() : '';
        const enableChildrenStr = enableChildrenCell ? enableChildrenCell.toString().trim() : '';
        const triggerValueStr = triggerValueCell ? triggerValueCell.toString().trim() : '';
        const sortOrder = parseSortOrder(sortOrderCell);

        if (!workTypeName || !itemName) {
          continue;
        }

        rawRows.push({
          rowNumber,
          workTypeName,
          itemName,
          itemStandard,
          isDefaultStr,
          parentItemName,
          enableChildrenStr,
          triggerValueStr,
          sortOrder
        });
      }

      const rowsByWorkType = rawRows.reduce((acc, row) => {
        if (!acc[row.workTypeName]) {
          acc[row.workTypeName] = [];
        }
        acc[row.workTypeName].push(row);
        return acc;
      }, {});

      for (const [workTypeName, rows] of Object.entries(rowsByWorkType)) {
        let workType = workTypeCache[workTypeName];
        if (!workType) {
          workType = await SafetyWorkType.findOne({
            where: { work_type_name: workTypeName },
            transaction: t
          });

          if (!workType) {
            const defaultRow = rows.find(row => row.isDefaultStr);
            const parsedDefault = parseBooleanFlag(defaultRow ? defaultRow.isDefaultStr : '');
            const isDefault = parsedDefault === null ? 0 : parsedDefault;
            workType = await SafetyWorkType.create({
              work_type_name: workTypeName,
              is_default: isDefault,
              sort_order: Object.keys(workTypeCache).length,
              status: 'active'
            }, { transaction: t });
          }
          workTypeCache[workTypeName] = workType;
        }

        const existingParents = await SafetyCheckItem.findAll({
          where: { work_type_id: workType.id, parent_id: null },
          transaction: t
        });
        const parentMap = new Map(existingParents.map(item => [item.item_name, item]));

        const parentRows = rows.filter(row => !row.parentItemName);
        const childRows = rows.filter(row => row.parentItemName);
        const childCountByParent = childRows.reduce((acc, row) => {
          acc[row.parentItemName] = (acc[row.parentItemName] || 0) + 1;
          return acc;
        }, {});

        for (const row of parentRows) {
          const existingItem = await SafetyCheckItem.findOne({
            where: {
              work_type_id: workType.id,
              item_name: row.itemName,
              parent_id: null
            },
            transaction: t
          });

          if (existingItem) {
            results.push({
              row: row.rowNumber,
              workTypeName,
              itemName: row.itemName,
              status: 'duplicate',
              message: '该工作性质下已存在同名检查项目'
            });
            if (childCountByParent[row.itemName] && existingItem.enable_children !== 1) {
              await existingItem.update({ enable_children: 1 }, { transaction: t });
            }
            parentMap.set(existingItem.item_name, existingItem);
            continue;
          }

          const parsedEnable = parseBooleanFlag(row.enableChildrenStr);
          let enableChildrenValue = parsedEnable === null ? 0 : parsedEnable;
          if (childCountByParent[row.itemName] && enableChildrenValue !== 1) {
            enableChildrenValue = 1;
          }

          const createdParent = await SafetyCheckItem.create({
            work_type_id: workType.id,
            item_name: row.itemName,
            item_standard: row.itemStandard,
            sort_order: row.sortOrder ?? row.rowNumber,
            status: 'active',
            parent_id: null,
            enable_children: enableChildrenValue,
            trigger_value: null
          }, { transaction: t });

          parentMap.set(createdParent.item_name, createdParent);
          results.push({
            row: row.rowNumber,
            workTypeName,
            itemName: row.itemName,
            status: 'success',
            message: '导入成功'
          });
        }

        for (const row of childRows) {
          const parentItem = parentMap.get(row.parentItemName);
          if (!parentItem) {
            results.push({
              row: row.rowNumber,
              workTypeName,
              itemName: row.itemName,
              status: 'missing_parent',
              message: '父级检查项目不存在，已跳过'
            });
            continue;
          }

          if (parentItem.enable_children !== 1) {
            await parentItem.update({ enable_children: 1 }, { transaction: t });
          }
          const existingItem = await SafetyCheckItem.findOne({
            where: {
              work_type_id: workType.id,
              item_name: row.itemName,
              parent_id: parentItem.id
            },
            transaction: t
          });

          if (existingItem) {
            results.push({
              row: row.rowNumber,
              workTypeName,
              itemName: row.itemName,
              status: 'duplicate',
              message: '该工作性质下已存在同名检查项目'
            });
            continue;
          }

          const parsedTrigger = parseTriggerValue(row.triggerValueStr);
          const triggerValueValue = parsedTrigger === null ? 1 : parsedTrigger;

          await SafetyCheckItem.create({
            work_type_id: workType.id,
            item_name: row.itemName,
            item_standard: row.itemStandard,
            sort_order: row.sortOrder ?? row.rowNumber,
            status: 'active',
            parent_id: parentItem.id,
            enable_children: 0,
            trigger_value: triggerValueValue
          }, { transaction: t });

          results.push({
            row: row.rowNumber,
            workTypeName,
            itemName: row.itemName,
            status: 'success',
            message: '导入成功'
          });
        }
      }

      await t.commit();

      const successCount = results.filter(r => r.status === 'success').length;
      const duplicateCount = results.filter(r => r.status === 'duplicate').length;
      const missingParentCount = results.filter(r => r.status === 'missing_parent').length;
      const skippedCount = duplicateCount + missingParentCount;

      ctx.body = {
        code: 200,
        message: `导入完成：成功${successCount}条，跳过${skippedCount}条`,
        data: {
          success: successCount,
          duplicate: duplicateCount,
          missingParent: missingParentCount,
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
