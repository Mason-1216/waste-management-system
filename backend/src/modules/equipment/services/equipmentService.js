import { Op } from 'sequelize';
import { Equipment, Station, sequelize } from '../../../models/index.js';
import { createError } from '../../../middlewares/error.js';
import { addTemplateInstructionSheet, applyTemplateHeaderStyle } from '../../import_export/utils/excelTemplate.js';
import { validateBody, validateParams, validateQuery } from '../../core/validators/validate.js';
import { batchCreateEquipmentBodySchema, createEquipmentBodySchema, equipmentIdParamSchema, getEquipmentByCodeQuerySchema, getEquipmentQuerySchema, updateEquipmentBodySchema } from '../validators/schemas.js';

/**
 * 查询设备列表
 * GET /api/equipment
 */
export const getEquipment = async (ctx) => {
  await validateQuery(ctx, getEquipmentQuerySchema);
  const { stationId, equipmentCode, equipmentName, installationLocation } = ctx.query;
  const dataFilter = ctx.state.dataFilter;

  const where = {};

  // 场站过滤
  if (stationId) {
    where.station_id = parseInt(stationId);
  } else if (!dataFilter.all && dataFilter.stationIds?.length > 0) {
    where.station_id = { [Op.in]: dataFilter.stationIds };
  }

  // 设备编号过滤
  if (equipmentCode) {
    where.equipment_code = { [Op.like]: `%${equipmentCode}%` };
  }

  // 设备名称过滤
  if (equipmentName) {
    where.equipment_name = { [Op.like]: `%${equipmentName}%` };
  }

  // 安装地点过滤
  if (installationLocation) {
    where.installation_location = { [Op.like]: `%${installationLocation}%` };
  }

  const equipmentList = await Equipment.findAll({
    where,
    include: [
      { model: Station, as: 'station', attributes: ['id', 'station_name'] }
    ],
    order: [['created_at', 'DESC']]
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: equipmentList
  };
};

/**
 * 根据设备编号查询设备详情
 * GET /api/equipment/by-code
 */
export const getEquipmentByCode = async (ctx) => {
  await validateQuery(ctx, getEquipmentByCodeQuerySchema);
  const { stationId, equipmentCode } = ctx.query;

  if (!stationId || !equipmentCode) {
    throw createError(400, '场站和设备编号不能为空');
  }

  const equipment = await Equipment.findOne({
    where: {
      station_id: parseInt(stationId),
      equipment_code: equipmentCode
    }
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: equipment
  };
};

/**
 * 创建设备
 * POST /api/equipment
 */
export const createEquipment = async (ctx) => {
  const { stationId, equipmentCode, equipmentName, installationLocation, specification, model, material } = await validateBody(ctx, createEquipmentBodySchema);

  if (!stationId || !equipmentCode || !equipmentName) {
    throw createError(400, '场站、设备编号和设备名称不能为空');
  }

  const normalizedInstallationLocation = typeof installationLocation === 'string' ? installationLocation.trim() : '';
  if (!normalizedInstallationLocation) {
    throw createError(400, '安装地点不能为空');
  }

  const normalizedCode = String(equipmentCode).trim();
  const normalizedName = String(equipmentName).trim();

  const existing = await Equipment.findOne({
    where: {
      station_id: stationId,
      equipment_code: normalizedCode
    }
  });

  if (existing) {
    throw createError(400, '该场站已存在相同编号的设备');
  }

  const equipment = await Equipment.create({
    station_id: stationId,
    equipment_code: normalizedCode,
    equipment_name: normalizedName,
    installation_location: normalizedInstallationLocation,
    specification: (typeof specification === 'string' && specification.trim() ? specification.trim() : null),
    model: (typeof model === 'string' && model.trim() ? model.trim() : null),
    material: (typeof material === 'string' && material.trim() ? material.trim() : null)
  });

  ctx.body = {
    code: 200,
    message: '设备创建成功',
    data: { id: equipment.id }
  };
};



/**
 * 批量创建设备
 * POST /api/equipment/batch
 */
export const batchCreateEquipment = async (ctx) => {
  const { equipmentList } = ctx.request.body;

  if (!equipmentList || !Array.isArray(equipmentList) || equipmentList.length === 0) {
    throw createError(400, '设备列表不能为空');
  }

  const t = await sequelize.transaction();

  try {
    const results = [];

    for (const item of equipmentList) {
      const { stationId, equipmentCode, equipmentName, installationLocation, specification, model, material } = item;

      const normalizedInstallationLocation = typeof installationLocation === 'string' ? installationLocation.trim() : '';
      if (!stationId || !equipmentCode || !equipmentName || !normalizedInstallationLocation) {
        continue;
      }

      const normalizedCode = String(equipmentCode).trim();
      const normalizedName = String(equipmentName).trim();

      const existing = await Equipment.findOne({
        where: {
          station_id: stationId,
          equipment_code: normalizedCode
        },
        transaction: t
      });

      if (existing) {
        continue;
      }

      const equipment = await Equipment.create(
        {
          station_id: stationId,
          equipment_code: normalizedCode,
          equipment_name: normalizedName,
          installation_location: normalizedInstallationLocation,
          specification: (typeof specification === 'string' && specification.trim() ? specification.trim() : null),
          model: (typeof model === 'string' && model.trim() ? model.trim() : null),
          material: (typeof material === 'string' && material.trim() ? material.trim() : null)
        },
        { transaction: t }
      );

      results.push(equipment);
    }

    await t.commit();

    ctx.body = {
      code: 200,
      message: '批量创建成功',
      data: { count: results.length }
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};



/**
 * 更新设备
 * PUT /api/equipment/:id
 */
export const updateEquipment = async (ctx) => {
  const { id } = await validateParams(ctx, equipmentIdParamSchema);
  const { equipmentCode, equipmentName, installationLocation, specification, model, material } = await validateBody(ctx, updateEquipmentBodySchema);

  const equipment = await Equipment.findByPk(id);
  if (!equipment) {
    throw createError(404, '设备不存在');
  }

  const normalizedCode = equipmentCode !== undefined ? String(equipmentCode).trim() : null;
  const normalizedName = equipmentName !== undefined ? String(equipmentName).trim() : null;
  const normalizedInstallationLocation = installationLocation !== undefined
    ? (typeof installationLocation === 'string' ? installationLocation.trim() : '')
    : null;

  if (installationLocation !== undefined && !normalizedInstallationLocation) {
    throw createError(400, '安装地点不能为空');
  }

  if (equipmentCode !== undefined && normalizedCode && normalizedCode !== equipment.equipment_code) {
    const existing = await Equipment.findOne({
      where: {
        station_id: equipment.station_id,
        equipment_code: normalizedCode,
        id: { [Op.ne]: id }
      }
    });

    if (existing) {
      throw createError(400, '该场站已存在相同编号的设备');
    }
  }

  await equipment.update({
    equipment_code: normalizedCode || equipment.equipment_code,
    equipment_name: normalizedName || equipment.equipment_name,
    installation_location: installationLocation !== undefined ? normalizedInstallationLocation : equipment.installation_location,
    specification: specification !== undefined ? (typeof specification === 'string' && specification.trim() ? specification.trim() : null) : equipment.specification,
    model: model !== undefined ? (typeof model === 'string' && model.trim() ? model.trim() : null) : equipment.model,
    material: material !== undefined ? (typeof material === 'string' && material.trim() ? material.trim() : null) : equipment.material
  });

  ctx.body = {
    code: 200,
    message: '设备更新成功',
    data: null
  };
};



/**
 * 删除设备
 * DELETE /api/equipment/:id
 */
export const deleteEquipment = async (ctx) => {
  const { id } = await validateParams(ctx, equipmentIdParamSchema);

  const equipment = await Equipment.findByPk(id);
  if (!equipment) {
    throw createError(404, '设备不存在');
  }

  await equipment.destroy();

  ctx.body = {
    code: 200,
    message: '设备删除成功',
    data: null
  };
};

/**
 * 批量导入设备
 * POST /api/equipment/import
 */
export const importEquipment = async (ctx) => {
  const { file } = ctx.request;

  if (!file) {
    throw createError(400, '请上传Excel文件');
  }

  try {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer);

    const worksheet = workbook.getWorksheet(1);
    const results = [];

    const stations = await Station.findAll({
      attributes: ['id', 'station_name']
    });

    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      if (!row.hasValues) continue;

      const stationName = normalizeCellText(row.getCell(1).value);
      const installationLocation = normalizeCellText(row.getCell(2).value);
      const equipmentCode = normalizeCellText(row.getCell(3).value);
      const equipmentName = normalizeCellText(row.getCell(4).value);
      const specification = normalizeCellText(row.getCell(5).value);
      const model = normalizeCellText(row.getCell(6).value);
      const material = normalizeCellText(row.getCell(7).value);

      if (!stationName) {
        results.push({ row: i, stationName, equipmentCode, equipmentName, status: 'error', message: '场站不能为空' });
        continue;
      }

      if (!installationLocation) {
        results.push({ row: i, stationName, equipmentCode, equipmentName, status: 'error', message: '安装地点不能为空' });
        continue;
      }

      if (!equipmentCode || !equipmentName) {
        results.push({ row: i, stationName, equipmentCode, equipmentName, status: 'error', message: '设备编号和设备名称不能为空' });
        continue;
      }

      const station = stations.find((s) => s.station_name === stationName);
      if (!station) {
        results.push({ row: i, stationName, equipmentCode, equipmentName, status: 'error', message: `未找到场站：${stationName}` });
        continue;
      }

      const stationId = station.id;

      const existing = await Equipment.findOne({
        where: {
          station_id: stationId,
          equipment_code: equipmentCode
        }
      });

      if (!existing) {
        await Equipment.create({
          station_id: stationId,
          equipment_code: equipmentCode,
          equipment_name: equipmentName,
          installation_location: installationLocation,
          specification: resolveOptionalText(specification),
          model: resolveOptionalText(model),
          material: resolveOptionalText(material)
        });

        results.push({ row: i, stationName, equipmentCode, equipmentName, status: 'success' });
        continue;
      }

      const nextPatch = buildEquipmentUpdatePatch({
        existing,
        payload: {
          equipment_name: equipmentName,
          installation_location: installationLocation,
          specification,
          model,
          material
        }
      });

      if (Object.keys(nextPatch).length === 0) {
        results.push({ row: i, stationName, equipmentCode, equipmentName, status: 'skip', message: '无变更，已跳过' });
        continue;
      }

      await existing.update(nextPatch);
      results.push({ row: i, stationName, equipmentCode, equipmentName, status: 'updated', message: '已更新' });
    }

    const successCount = results.filter((r) => r.status === 'success').length;
    const errorCount = results.filter((r) => r.status === 'error').length;
    const updatedCount = results.filter((r) => r.status === 'updated').length;
    const skipCount = results.filter((r) => r.status === 'skip').length;

    ctx.body = {
      code: 200,
      message: `导入完成：新增${successCount}条，更新${updatedCount}条，跳过${skipCount}条，失败${errorCount}条`,
      data: results
    };
  } catch (error) {
    ctx.body = {
      code: 500,
      message: `导入失败: ${error.message}`,
      data: null
    };
  }
};

export const previewImportEquipment = async (ctx) => {
  const { file } = ctx.request;
  if (!file) {
    throw createError(400, '请上传Excel文件');
  }

  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file.buffer);

  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) {
    throw createError(400, 'Excel 内容为空');
  }

  const stations = await Station.findAll({
    attributes: ['id', 'station_name']
  });

  const stationIdByName = new Map(stations.map(s => [s.station_name, s.id]));

  const rows = [];
  const summary = { total: 0, create: 0, update: 0, skip: 0, error: 0 };

  for (let i = 2; i <= worksheet.rowCount; i += 1) {
    const row = worksheet.getRow(i);
    if (!row.hasValues) continue;

    summary.total += 1;

    const stationName = normalizeCellText(row.getCell(1).value);
    const installationLocation = normalizeCellText(row.getCell(2).value);
    const equipmentCode = normalizeCellText(row.getCell(3).value);
    const equipmentName = normalizeCellText(row.getCell(4).value);
    const specification = normalizeCellText(row.getCell(5).value);
    const model = normalizeCellText(row.getCell(6).value);
    const material = normalizeCellText(row.getCell(7).value);

    const previewRow = {
      rowNum: i,
      action: 'error',
      message: '',
      diff: {},
      stationName,
      installationLocation,
      equipmentCode,
      equipmentName,
      specification,
      model,
      material
    };

    if (!stationName) {
      previewRow.message = '场站不能为空';
      summary.error += 1;
      rows.push(previewRow);
      continue;
    }

    const stationId = stationIdByName.get(stationName) ?? null;
    if (!stationId) {
      previewRow.message = `未找到场站：${stationName}`;
      summary.error += 1;
      rows.push(previewRow);
      continue;
    }

    if (!equipmentCode) {
      previewRow.message = '设备编号不能为空';
      summary.error += 1;
      rows.push(previewRow);
      continue;
    }

    const existing = await Equipment.findOne({
      where: {
        station_id: stationId,
        equipment_code: equipmentCode
      }
    });

    if (!existing) {
      if (!installationLocation || !equipmentName) {
        previewRow.message = '新增时：设备名称/安装地点不能为空';
        summary.error += 1;
        rows.push(previewRow);
        continue;
      }
      previewRow.action = 'create';
      summary.create += 1;
      rows.push(previewRow);
      continue;
    }

    const { patch, diff } = buildEquipmentUpdatePatchWithDiff({
      existing,
      payload: {
        equipment_name: equipmentName,
        installation_location: installationLocation,
        specification,
        model,
        material
      }
    });

    previewRow.diff = diff;
    if (Object.keys(patch).length === 0) {
      previewRow.action = 'skip';
      previewRow.message = '无变更，跳过';
      summary.skip += 1;
      rows.push(previewRow);
      continue;
    }

    previewRow.action = 'update';
    previewRow.message = '将更新';
    summary.update += 1;
    rows.push(previewRow);
  }

  ctx.body = {
    code: 200,
    message: 'success',
    data: {
      summary,
      rows
    }
  };
};

const normalizeCellText = (value) => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') {
    if (value.text !== undefined) return String(value.text).trim();
    if (value.result !== undefined) return String(value.result).trim();
    if (Array.isArray(value.richText)) return value.richText.map(item => item.text ?? '').join('').trim();
  }
  return String(value).trim();
};

const resolveOptionalText = (text) => {
  const normalized = typeof text === 'string' ? text.trim() : '';
  return normalized ? normalized : null;
};

const buildEquipmentUpdatePatch = ({ existing, payload }) => {
  const patch = {};

  if (payload.equipment_name && payload.equipment_name !== existing.equipment_name) {
    patch.equipment_name = payload.equipment_name;
  }
  if (payload.installation_location && payload.installation_location !== existing.installation_location) {
    patch.installation_location = payload.installation_location;
  }
  if (payload.specification && payload.specification !== existing.specification) {
    patch.specification = payload.specification;
  }
  if (payload.model && payload.model !== existing.model) {
    patch.model = payload.model;
  }
  if (payload.material && payload.material !== existing.material) {
    patch.material = payload.material;
  }

  return patch;
};

const buildEquipmentUpdatePatchWithDiff = ({ existing, payload }) => {
  const patch = buildEquipmentUpdatePatch({ existing, payload });
  const diff = {};
  Object.keys(patch).forEach((key) => {
    diff[key] = { from: existing[key], to: patch[key] };
  });
  return { patch, diff };
};



/**
 * 获取设备导入模板
 * GET /api/equipment/template
 */
export const getEquipmentTemplate = async (ctx) => {
  try {
    const ExcelJS = (await import('exceljs')).default;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('场站设备名称');

    worksheet.columns = [
      { header: '场站', key: 'stationName', width: 20 },
      { header: '安装地点', key: 'installationLocation', width: 25 },
      { header: '设备编号', key: 'equipmentCode', width: 20 },
      { header: '设备名称', key: 'equipmentName', width: 25 },
      { header: '规格', key: 'specification', width: 15 },
      { header: '型号', key: 'model', width: 15 },
      { header: '材质', key: 'material', width: 15 }
    ];

    worksheet.addRow({
      stationName: '示例场站',
      installationLocation: '一楼车间',
      equipmentCode: 'EQ-001',
      equipmentName: '示例设备',
      specification: 'S1',
      model: 'M1',
      material: '钢'
    });

    applyTemplateHeaderStyle(worksheet, 1);
    addTemplateInstructionSheet(workbook, [
      ['场站', '必填，系统已有的场站名称。'],
      ['安装地点', '必填。'],
      ['设备编号', '必填，设备唯一编号（同一场站内唯一）。'],
      ['设备名称', '必填。'],
      ['规格', '选填。'],
      ['型号', '选填。'],
      ['材质', '选填。']
    ]);

    const buffer = await workbook.xlsx.writeBuffer();

    ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    ctx.set('Content-Disposition', 'attachment; filename="equipment_template.xlsx"');

    ctx.body = buffer;
  } catch (error) {
    ctx.body = {
      code: 500,
      message: '生成模板失败',
      data: null
    };
  }
};



export default {
  getEquipment,
  getEquipmentByCode,
  createEquipment,
  batchCreateEquipment,
  updateEquipment,
  deleteEquipment,
  importEquipment,
  getEquipmentTemplate
};
