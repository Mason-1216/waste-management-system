import { Op } from 'sequelize';
import { Equipment, Station, sequelize } from '../models/index.js';
import { createError } from '../middlewares/error.js';

/**
 * 查询设备列表
 * GET /api/equipment
 */
export const getEquipment = async (ctx) => {
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
  const { stationId, equipmentCode, equipmentName, installationLocation } = ctx.request.body;

  if (!stationId || !equipmentCode || !equipmentName) {
    throw createError(400, '场站、设备编号和设备名称不能为空');
  }

  // 检查设备编号是否已存在
  const existing = await Equipment.findOne({
    where: {
      station_id: stationId,
      equipment_code: equipmentCode
    }
  });

  if (existing) {
    throw createError(400, '该场站已存在相同编号的设备');
  }

  const equipment = await Equipment.create({
    station_id: stationId,
    equipment_code: equipmentCode,
    equipment_name: equipmentName,
    installation_location: installationLocation || null
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
      const { stationId, equipmentCode, equipmentName, installationLocation } = item;

      if (!stationId || !equipmentCode || !equipmentName) {
        continue; // 跳过无效数据
      }

      // 检查是否已存在
      const existing = await Equipment.findOne({
        where: {
          station_id: stationId,
          equipment_code: equipmentCode
        },
        transaction: t
      });

      if (existing) {
        continue; // 跳过已存在的设备
      }

      const equipment = await Equipment.create({
        station_id: stationId,
        equipment_code: equipmentCode,
        equipment_name: equipmentName,
        installation_location: installationLocation || null
      }, { transaction: t });

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
  const { id } = ctx.params;
  const { equipmentCode, equipmentName, installationLocation } = ctx.request.body;

  const equipment = await Equipment.findByPk(id);
  if (!equipment) {
    throw createError(404, '设备不存在');
  }

  // 如果修改了设备编号，检查是否重复
  if (equipmentCode && equipmentCode !== equipment.equipment_code) {
    const existing = await Equipment.findOne({
      where: {
        station_id: equipment.station_id,
        equipment_code: equipmentCode,
        id: { [Op.ne]: id }
      }
    });

    if (existing) {
      throw createError(400, '该场站已存在相同编号的设备');
    }
  }

  await equipment.update({
    equipment_code: equipmentCode || equipment.equipment_code,
    equipment_name: equipmentName || equipment.equipment_name,
    installation_location: installationLocation !== undefined ? installationLocation : equipment.installation_location
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
  const { id } = ctx.params;

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

    // 获取所有场站
    const stations = await Station.findAll({
      attributes: ['id', 'station_name']
    });

    // 从第二行开始读取数据（跳过标题行）
    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);

      // 检查是否是空行
      if (!row.hasValues) continue;

      const stationName = row.getCell(1).value?.toString().trim();
      const equipmentCode = row.getCell(2).value?.toString().trim();
      const equipmentName = row.getCell(3).value?.toString().trim();
      const installationLocation = row.getCell(4).value?.toString().trim();

      if (!equipmentCode || !equipmentName) {
        results.push({
          row: i,
          stationName,
          equipmentCode,
          equipmentName,
          status: 'error',
          message: '设备编号和设备名称不能为空'
        });
        continue;
      }

      // 根据场站名称查找场站ID
      let stationId = null;
      if (stationName) {
        const station = stations.find(s => s.station_name === stationName);
        if (!station) {
          results.push({
            row: i,
            stationName,
            equipmentCode,
            equipmentName,
            status: 'error',
            message: `未找到场站"${stationName}"`
          });
          continue;
        }
        stationId = station.id;
      }

      // 检查是否已存在相同的设备
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
          installation_location: installationLocation || null
        });

        results.push({
          row: i,
          stationName,
          equipmentCode,
          equipmentName,
          status: 'success'
        });
      } else {
        results.push({
          row: i,
          stationName,
          equipmentCode,
          equipmentName,
          status: 'duplicate',
          message: '该场站已存在相同编号的设备'
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const duplicateCount = results.filter(r => r.status === 'duplicate').length;

    ctx.body = {
      code: 200,
      message: `导入完成：成功${successCount}条，重复${duplicateCount}条，失败${errorCount}条`,
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

/**
 * 获取设备导入模板
 * GET /api/equipment/template
 */
export const getEquipmentTemplate = async (ctx) => {
  try {
    const ExcelJS = (await import('exceljs')).default;

    // 创建工作簿
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('设备信息');

    // 设置列标题
    worksheet.columns = [
      { header: '场站', key: 'stationName', width: 20 },
      { header: '设备编号', key: 'equipmentCode', width: 20 },
      { header: '设备名称', key: 'equipmentName', width: 25 },
      { header: '安装地点', key: 'installationLocation', width: 30 }
    ];

    // 添加示例数据
    worksheet.addRow({
      stationName: '示例场站',
      equipmentCode: 'EQ-001',
      equipmentName: '示例设备',
      installationLocation: '一楼车间'
    });

    // 设置标题行样式
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // 将工作簿写入Buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // 设置响应头
    ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    ctx.set('Content-Disposition', 'attachment; filename="equipment_template.xlsx"');

    // 设置响应体
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
