// PLC Monitor Controller
import { Op } from 'sequelize';
import { PlcMonitorConfig, PlcCategory, PlcReading, Station, sequelize } from '../../../models/index.js';
import plcBridgeService from '../services/plcBridgeService.js';
import logger from '../../../config/logger.js';
import ExcelJS from 'exceljs';
import { QueryTypes } from 'sequelize';
import { addTemplateInstructionSheet, applyTemplateHeaderStyle } from '../../import_export/utils/excelTemplate.js';

/**
 * 获取实时数据
 */
export const getRealtimeData = async (ctx) => {
  try {
    const { stationId, categoryId } = ctx.query;

    // 构建查询条件
    const where = { is_active: true };
    if (stationId) where.station_id = stationId;
    if (categoryId) where.category_id = categoryId;

    // 获取配置列表
    const configs = await PlcMonitorConfig.findAll({
      where,
      include: [
        { model: Station, as: 'station', attributes: ['id', 'station_name'] },
        { model: PlcCategory, as: 'category', attributes: ['id', 'category_key', 'category_name'] }
      ],
      order: [['sort_order', 'ASC'], ['id', 'ASC']]
    });

    if (configs.length === 0) {
      ctx.body = { code: 200, message: 'success', data: [] };
      return;
    }

    // 按 IP 分组配置
    const ipGroups = {};
    configs.forEach(config => {
      const ip = config.plc_ip;
      if (!ipGroups[ip]) ipGroups[ip] = [];
      ipGroups[ip].push({
        db_number: config.db_number,
        offset: parseFloat(config.offset_address),
        data_type: config.data_type,
        config_id: config.id
      });
    });

    // 构建批量读取请求
    const batchConfigs = Object.entries(ipGroups).map(([ip, readings]) => ({
      ip,
      readings
    }));

    // 查询每个 IP 的连接状态
    const ipStatusMap = {};
    await Promise.all(Object.keys(ipGroups).map(async (ip) => {
      try {
        const res = await plcBridgeService.checkPlcConnection(ip);
        ipStatusMap[ip] = res?.connected === true;
      } catch (e) {
        ipStatusMap[ip] = false;
      }
    }));

    // 调用 PLC 服务批量读取
    let readResults = [];
    try {
      const response = await plcBridgeService.readMultiplePlcBatch(batchConfigs);
      readResults = response.results || [];
    } catch (error) {
      logger.error('PLC batch read error:', error.message);
    }

    // 合并配置和读取结果
    const resultMap = {};
    readResults.forEach(r => {
      if (r.config_id) resultMap[r.config_id] = r;
    });

    const data = configs.map(config => ({
      id: config.id,
      name: config.name,
      plcIp: config.plc_ip,
      address: `DB${config.db_number}.${config.offset_address}`,
      dataType: config.data_type,
      unit: config.unit,
      station: config.station,
      category: config.category,
      value: resultMap[config.id]?.value ?? null,
      success: resultMap[config.id]?.success ?? false,
      connectionStatus: ipStatusMap[config.plc_ip] ?? false,
      timestamp: new Date().toISOString()
    }));

    ctx.body = { code: 200, message: 'success', data };
  } catch (error) {
    logger.error('getRealtimeData error:', error);
    ctx.status = 500;
    ctx.body = { code: 500, message: error.message };
  }
};

/**
 * 获取历史数据
 */
export const getHistoryData = async (ctx) => {
  try {
    const {
      stationId, categoryId, configId,
      startDate, endDate,
      page = 1, pageSize = 20
    } = ctx.query;

    const where = {};
    if (stationId) where.station_id = stationId;
    if (categoryId) where.category_id = categoryId;
    if (configId) where.config_id = configId;

    if (startDate && endDate) {
      where.timestamp = {
        [Op.between]: [new Date(startDate), new Date(endDate + ' 23:59:59')]
      };
    } else if (startDate) {
      where.timestamp = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      where.timestamp = { [Op.lte]: new Date(endDate + ' 23:59:59') };
    }

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const { count, rows } = await PlcReading.findAndCountAll({
      where,
      include: [
        {
          model: PlcMonitorConfig,
          as: 'config',
          attributes: ['id', 'name', 'plc_ip', 'unit']
        },
        {
          model: PlcCategory,
          as: 'category',
          attributes: ['id', 'category_key', 'category_name']
        },
        {
          model: Station,
          as: 'station',
          attributes: ['id', 'station_name']
        }
      ],
      order: [['timestamp', 'DESC']],
      offset,
      limit
    });

    ctx.body = {
      code: 200,
      message: 'success',
      data: {
        list: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    };
  } catch (error) {
    logger.error('getHistoryData error:', error);
    ctx.status = 500;
    ctx.body = { code: 500, message: error.message };
  }
};

/**
 * 获取监控配置列表
 */
export const getConfigs = async (ctx) => {
  try {
    const { stationId, categoryId, isActive, page = 1, pageSize = 20 } = ctx.query;

    const where = {};
    if (stationId) where.station_id = stationId;
    if (categoryId) where.category_id = categoryId;
    if (isActive !== undefined) where.is_active = isActive === 'true';

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const { count, rows } = await PlcMonitorConfig.findAndCountAll({
      where,
      include: [
        { model: Station, as: 'station', attributes: ['id', 'station_name'] },
        { model: PlcCategory, as: 'category', attributes: ['id', 'category_key', 'category_name'] }
      ],
      order: [['sort_order', 'ASC'], ['id', 'ASC']],
      offset,
      limit
    });

    ctx.body = {
      code: 200,
      message: 'success',
      data: { list: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) }
    };
  } catch (error) {
    logger.error('getConfigs error:', error);
    ctx.status = 500;
    ctx.body = { code: 500, message: error.message };
  }
};

/**
 * 创建监控配置
 */
export const createConfig = async (ctx) => {
  try {
    const data = ctx.request.body;
    const hasCategoryId = data.categoryId !== null && data.categoryId !== undefined && data.categoryId !== '';
    if (!hasCategoryId) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '分类不能为空' };
      return;
    }

    const config = await PlcMonitorConfig.create({
      name: data.name,
      station_id: data.stationId,
      plc_ip: data.plcIp,
      db_number: data.dbNumber,
      offset_address: data.offsetAddress,
      data_type: data.dataType || 'REAL',
      category_id: data.categoryId,
      unit: data.unit,
      description: data.description,
      is_active: data.isActive !== false,
      sort_order: data.sortOrder || 0
    });

    ctx.body = { code: 200, message: '创建成功', data: config };
  } catch (error) {
    logger.error('createConfig error:', error);
    ctx.status = 500;
    ctx.body = { code: 500, message: error.message };
  }
};

/**
 * 更新监控配置
 */
export const updateConfig = async (ctx) => {
  try {
    const { id } = ctx.params;
    const data = ctx.request.body;
    const hasCategoryId = data.categoryId !== null && data.categoryId !== undefined && data.categoryId !== '';
    if (!hasCategoryId) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '分类不能为空' };
      return;
    }

    const config = await PlcMonitorConfig.findByPk(id);
    if (!config) {
      ctx.status = 404;
      ctx.body = { code: 404, message: '配置不存在' };
      return;
    }

    await config.update({
      name: data.name,
      station_id: data.stationId,
      plc_ip: data.plcIp,
      db_number: data.dbNumber,
      offset_address: data.offsetAddress,
      data_type: data.dataType,
      category_id: data.categoryId,
      unit: data.unit,
      description: data.description,
      is_active: data.isActive,
      sort_order: data.sortOrder
    });

    ctx.body = { code: 200, message: '更新成功', data: config };
  } catch (error) {
    logger.error('updateConfig error:', error);
    ctx.status = 500;
    ctx.body = { code: 500, message: error.message };
  }
};

/**
 * 删除监控配置
 */
export const deleteConfig = async (ctx) => {
  try {
    const { id } = ctx.params;

    const config = await PlcMonitorConfig.findByPk(id);
    if (!config) {
      ctx.status = 404;
      ctx.body = { code: 404, message: '配置不存在' };
      return;
    }

    await config.destroy();
    ctx.body = { code: 200, message: '删除成功' };
  } catch (error) {
    logger.error('deleteConfig error:', error);
    ctx.status = 500;
    ctx.body = { code: 500, message: error.message };
  }
};

/**
 * 批量导入配置
 */
export const importConfigs = async (ctx) => {
  try {
    const file = ctx.file;
    let configs = ctx.request.body?.configs;
    const records = [];
    const errors = [];

    const normalizeCellValue = (cellValue) => {
      if (cellValue === null || cellValue === undefined) return null;
      if (cellValue instanceof Date) return cellValue;
      if (typeof cellValue === 'number' || typeof cellValue === 'boolean') return cellValue;
      if (typeof cellValue === 'string') return cellValue.trim();
      if (typeof cellValue === 'object') {
        if (cellValue.text) return String(cellValue.text).trim();
        if (Array.isArray(cellValue.richText)) {
          return cellValue.richText.map(item => item.text || '').join('').trim();
        }
        if (cellValue.result !== undefined && cellValue.result !== null) return cellValue.result;
      }
      return String(cellValue).trim();
    };

    const parseBoolean = (value, defaultValue = true) => {
      if (value === null || value === undefined || value === '') return defaultValue;
      if (typeof value === 'boolean') return value;
      if (typeof value === 'number') return value !== 0;
      const normalized = String(value).trim().toLowerCase();
      if (['0', 'false', 'no', 'n'].includes(normalized)) return false;
      if (['1', 'true', 'yes', 'y'].includes(normalized)) return true;
      return defaultValue;
    };

    if (file) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer);
      const worksheet = workbook.getWorksheet(1);

      if (!worksheet) {
        ctx.status = 400;
        ctx.body = { code: 400, message: 'Excel文件格式错误' };
        return;
      }

      for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        const name = normalizeCellValue(row.getCell(1).value);
        const stationValue = normalizeCellValue(row.getCell(2).value);
        const plcIp = normalizeCellValue(row.getCell(3).value);
        const dbNumberValue = normalizeCellValue(row.getCell(4).value);
        const offsetAddressValue = normalizeCellValue(row.getCell(5).value);
        const dataType = normalizeCellValue(row.getCell(6).value) || 'REAL';
        const categoryValue = normalizeCellValue(row.getCell(7).value);
        const unit = normalizeCellValue(row.getCell(8).value);
        const description = normalizeCellValue(row.getCell(9).value);
        const isActiveValue = normalizeCellValue(row.getCell(10).value);
        const sortOrderValue = normalizeCellValue(row.getCell(11).value);

        if (!name && !stationValue && !plcIp && !dbNumberValue && !offsetAddressValue) continue;

        if (!name || !stationValue || !plcIp || dbNumberValue === null || offsetAddressValue === null || !categoryValue) {
          errors.push(`第${i}行: 缺少必填字段`);
          continue;
        }

        const stationIdCandidate = /^[0-9]+$/.test(String(stationValue)) ? parseInt(String(stationValue), 10) : null;
        const station = stationIdCandidate
          ? await Station.findByPk(stationIdCandidate)
          : await Station.findOne({ where: { station_name: String(stationValue).trim() } });
        if (!station) {
          errors.push(`第${i}行: 场站"${stationValue}"不存在`);
          continue;
        }

        const categoryIdCandidate = /^[0-9]+$/.test(String(categoryValue)) ? parseInt(String(categoryValue), 10) : null;
        let category = categoryIdCandidate
          ? await PlcCategory.findByPk(categoryIdCandidate)
          : await PlcCategory.findOne({ where: { category_key: String(categoryValue).trim() } });
        if (!category && !categoryIdCandidate) {
          category = await PlcCategory.findOne({ where: { category_name: String(categoryValue).trim() } });
        }
        if (!category) {
          errors.push(`第${i}行: 分类"${categoryValue}"不存在`);
          continue;
        }

        const dbNumber = typeof dbNumberValue === 'number' ? dbNumberValue : parseInt(String(dbNumberValue), 10);
        const offsetAddress = typeof offsetAddressValue === 'number'
          ? offsetAddressValue
          : parseFloat(String(offsetAddressValue));
        if (Number.isNaN(dbNumber) || Number.isNaN(offsetAddress)) {
          errors.push(`第${i}行: DB地址格式错误`);
          continue;
        }

        const sortOrder = sortOrderValue === null || sortOrderValue === undefined || sortOrderValue === ''
          ? 0
          : (typeof sortOrderValue === 'number' ? sortOrderValue : parseInt(String(sortOrderValue), 10));

        records.push({
          name: String(name).trim(),
          station_id: station.id,
          plc_ip: String(plcIp).trim(),
          db_number: dbNumber,
          offset_address: offsetAddress,
          data_type: String(dataType).trim() || 'REAL',
          category_id: category.id,
          unit: unit ? String(unit).trim() : null,
          description: description ? String(description).trim() : null,
          is_active: parseBoolean(isActiveValue, true),
          sort_order: Number.isNaN(sortOrder) ? 0 : sortOrder
        });
      }
    } else {
      if (typeof configs === 'string') {
        configs = JSON.parse(configs);
      }

      if (!Array.isArray(configs) || configs.length === 0) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '请提供配置数据' };
        return;
      }

      configs.forEach(item => {
        records.push({
          name: item.name,
          station_id: item.stationId,
          plc_ip: item.plcIp,
          db_number: item.dbNumber,
          offset_address: item.offsetAddress,
          data_type: item.dataType || 'REAL',
          category_id: item.categoryId,
          unit: item.unit,
          description: item.description,
          is_active: item.isActive !== false,
          sort_order: item.sortOrder || 0
        });
      });
    }

    if (records.length === 0) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '请提供配置数据', errors };
      return;
    }

    const result = await PlcMonitorConfig.bulkCreate(records, {
      ignoreDuplicates: true
    });

    ctx.body = {
      code: 200,
      message: `成功导入 ${result.length} 条配置`,
      data: {
        count: result.length,
        errors: errors.length ? errors : undefined
      }
    };
  } catch (error) {
    logger.error('importConfigs error:', error);
    ctx.status = 500;
    ctx.body = { code: 500, message: error.message };
  }
};

/**
 * 获取分类列表
 */
export const getCategories = async (ctx) => {
  try {
    const { isEnabled } = ctx.query;

    const where = {};
    if (isEnabled !== undefined) where.is_enabled = isEnabled === 'true';

    const categories = await PlcCategory.findAll({
      where,
      order: [['sort_order', 'ASC'], ['id', 'ASC']]
    });

    ctx.body = { code: 200, message: 'success', data: categories };
  } catch (error) {
    logger.error('getCategories error:', error);
    ctx.status = 500;
    ctx.body = { code: 500, message: error.message };
  }
};

/**
 * 创建分类
 */
export const createCategory = async (ctx) => {
  try {
    const data = ctx.request.body;

    const category = await PlcCategory.create({
      category_key: data.categoryKey,
      category_name: data.categoryName,
      data_type: data.dataType ?? 'REAL',
      value_type: data.valueType ?? 'cumulative',
      schedule_type: data.scheduleType ?? 'interval',
      interval_hours: data.intervalHours ?? 1,
      interval_minutes: data.intervalMinutes ?? 0,
      fixed_time: data.fixedTime,
      is_enabled: data.isEnabled !== false,
      sort_order: data.sortOrder ?? 0
    });

    ctx.body = { code: 200, message: '创建成功', data: category };
  } catch (error) {
    logger.error('createCategory error:', error);
    ctx.status = 500;
    ctx.body = { code: 500, message: error.message };
  }
};

/**
 * 更新分类
 */
export const updateCategory = async (ctx) => {
  try {
    const { id } = ctx.params;
    const data = ctx.request.body;

    const category = await PlcCategory.findByPk(id);
    if (!category) {
      ctx.status = 404;
      ctx.body = { code: 404, message: '分类不存在' };
      return;
    }

    await category.update({
      category_key: data.categoryKey,
      category_name: data.categoryName,
      data_type: data.dataType,
      value_type: data.valueType,
      schedule_type: data.scheduleType,
      interval_hours: data.intervalHours,
      interval_minutes: data.intervalMinutes,
      fixed_time: data.fixedTime,
      is_enabled: data.isEnabled,
      sort_order: data.sortOrder
    });

    ctx.body = { code: 200, message: '更新成功', data: category };
  } catch (error) {
    logger.error('updateCategory error:', error);
    ctx.status = 500;
    ctx.body = { code: 500, message: error.message };
  }
};

/**
 * 删除分类
 */
export const deleteCategory = async (ctx) => {
  try {
    const { id } = ctx.params;

    const category = await PlcCategory.findByPk(id);
    if (!category) {
      ctx.status = 404;
      ctx.body = { code: 404, message: '分类不存在' };
      return;
    }

    // 检查是否有关联配置
    const configCount = await PlcMonitorConfig.count({ where: { category_id: id } });
    if (configCount > 0) {
      ctx.status = 400;
      ctx.body = { code: 400, message: `该分类下有 ${configCount} 个监控点配置，无法删除` };
      return;
    }

    await category.destroy();
    ctx.body = { code: 200, message: '删除成功' };
  } catch (error) {
    logger.error('deleteCategory error:', error);
    ctx.status = 500;
    ctx.body = { code: 500, message: error.message };
  }
};

/**
 * 导出报表
 */
export const exportReport = async (ctx) => {
  try {
    const { stationId, categoryId, startDate, endDate, format = 'xlsx' } = ctx.query;

    const where = {};
    if (stationId) where.station_id = stationId;
    if (categoryId) where.category_id = categoryId;
    if (startDate && endDate) {
      where.timestamp = {
        [Op.between]: [new Date(startDate), new Date(endDate + ' 23:59:59')]
      };
    }

    const readings = await PlcReading.findAll({
      where,
      include: [
        { model: PlcMonitorConfig, as: 'config', attributes: ['name', 'unit'] },
        { model: PlcCategory, as: 'category', attributes: ['category_name'] },
        { model: Station, as: 'station', attributes: ['station_name'] }
      ],
      order: [['timestamp', 'DESC']],
      limit: 10000
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('PLC数据');

    worksheet.columns = [
      { header: '采集时间', key: 'timestamp', width: 20 },
      { header: '场站', key: 'station', width: 15 },
      { header: '分类', key: 'category', width: 12 },
      { header: '监控点', key: 'name', width: 20 },
      { header: '地址', key: 'address', width: 15 },
      { header: '数值', key: 'value', width: 12 },
      { header: '单位', key: 'unit', width: 10 },
      { header: '数据质量', key: 'quality', width: 10 }
    ];

    readings.forEach(r => {
      worksheet.addRow({
        timestamp: r.timestamp,
        station: r.station?.station_name || '-',
        category: r.category?.category_name || '-',
        name: r.config?.name || '-',
        address: r.address,
        value: r.value,
        unit: r.config?.unit || '-',
        quality: r.quality === 1 ? '正常' : '异常'
      });
    });

    // 设置响应头
    const filename = `PLC数据_${new Date().toISOString().split('T')[0]}.xlsx`;
    ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    ctx.set('Content-Disposition', `attachment; filename=${encodeURIComponent(filename)}`);

    ctx.body = await workbook.xlsx.writeBuffer();
  } catch (error) {
    logger.error('exportReport error:', error);
    ctx.status = 500;
    ctx.body = { code: 500, message: error.message };
  }
};

/**
 * 写入 PLC 值
 */
export const writeConfigValue = async (ctx) => {
  try {
    const { configId, value } = ctx.request.body || {};

    if (!configId || value === undefined) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '缺少 configId 或 value' };
      return;
    }

    const config = await PlcMonitorConfig.findByPk(configId);
    if (!config) {
      ctx.status = 404;
      ctx.body = { code: 404, message: '监控点不存在' };
      return;
    }

    await plcBridgeService.writePlcValue(
      config.plc_ip,
      config.db_number,
      parseFloat(config.offset_address),
      config.data_type,
      value
    );

    ctx.body = { code: 200, message: '写入成功' };
  } catch (error) {
    logger.error('writeConfigValue error:', error);
    ctx.status = 500;
    ctx.body = { code: 500, message: error.message };
  }
};

/**
 * 下载配置模板
 */
export const downloadConfigTemplate = async (ctx) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('监控点模板');

    const headers = [
      { header: '名称', key: 'name', width: 18 },
      { header: '场站名称', key: 'station_name', width: 18 },
      { header: 'PLC IP地址', key: 'plc_ip', width: 16 },
      { header: 'DB块号', key: 'db_number', width: 10 },
      { header: '偏移地址', key: 'offset_address', width: 12 },
      { header: '数据类型', key: 'data_type', width: 12 },
      { header: '分类Key', key: 'category_key', width: 12 },
      { header: '单位', key: 'unit', width: 10 },
      { header: '描述', key: 'description', width: 20 },
      { header: '是否启用', key: 'is_active', width: 10 },
      { header: '排序', key: 'sort_order', width: 8 }
    ];

    sheet.columns = headers;
    sheet.addRow({
      name: '温度传感器1',
      station_name: '1号场站',
      plc_ip: '192.168.0.10',
      db_number: 9,
      offset_address: 200,
      data_type: 'REAL',
      category_key: 'temperature',
      unit: '℃',
      description: '示例监控点',
      is_active: 1,
      sort_order: 0
    });

    applyTemplateHeaderStyle(sheet, 1);
    addTemplateInstructionSheet(workbook, [
      ['名称', '必填，监控点名称。'],
      ['场站名称', '必填，系统已有场站名称。'],
      ['PLC IP地址', '必填，PLC 设备 IP。'],
      ['DB块号', '必填，数字。'],
      ['偏移地址', '必填，数字。'],
      ['数据类型', '必填，如 REAL/INT/BOOL。'],
      ['分类Key', '必填，对应分类标识。'],
      ['单位', '选填，如 ℃、kWh。'],
      ['描述', '选填，监控点说明。'],
      ['是否启用', '必填，1 启用，0 停用。'],
      ['排序', '选填，数字，越小越靠前。']
    ]);

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `plc_config_template.xlsx`;
    ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    ctx.set('Content-Disposition', `attachment; filename=${encodeURIComponent(filename)}`);
    ctx.body = buffer;
  } catch (error) {
    logger.error('downloadConfigTemplate error:', error);
    ctx.status = 500;
    ctx.body = { code: 500, message: error.message };
  }
};

/**
 * 获取报表统计数据
 */
export const getReportStats = async (ctx) => {
  try {
    const { stationId, categoryId, configId, startDate, endDate, groupBy = 'hour' } = ctx.query;

    const where = {};
    if (stationId) where.station_id = stationId;
    if (categoryId) where.category_id = categoryId;
    if (configId) where.config_id = configId;
    if (startDate && endDate) {
      where.timestamp = {
        [Op.between]: [new Date(startDate), new Date(endDate + ' 23:59:59')]
      };
    }

    let timeFormat;
    switch (groupBy) {
      case 'day':
        timeFormat = '%Y-%m-%d';
        break;
      case 'hour':
      default:
        timeFormat = '%Y-%m-%d %H:00';
    }

    const stats = await PlcReading.findAll({
      where,
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('timestamp'), timeFormat), 'time_group'],
        [sequelize.fn('AVG', sequelize.col('value')), 'avg_value'],
        [sequelize.fn('MIN', sequelize.col('value')), 'min_value'],
        [sequelize.fn('MAX', sequelize.col('value')), 'max_value'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['time_group'],
      order: [[sequelize.literal('time_group'), 'ASC']],
      raw: true
    });

    ctx.body = { code: 200, message: 'success', data: stats };
  } catch (error) {
    logger.error('getReportStats error:', error);
    ctx.status = 500;
    ctx.body = { code: 500, message: error.message };
  }
};

/**
 * 历史汇总（按站点+分类+时间分组，净增/均值）
 */
export const getHistorySummary = async (ctx) => {
  try {
    const { stationId, categoryId, categoryKey, startDate, endDate, timeType = 'day' } = ctx.query;
    const page = parseInt(ctx.query.page || '1', 10);
    const pageSize = parseInt(ctx.query.pageSize || '20', 10);

    const timeExpr = timeType === 'month'
      ? "DATE_FORMAT(r.timestamp, '%Y-%m')"
      : timeType === 'year'
        ? "DATE_FORMAT(r.timestamp, '%Y')"
        : 'DATE(r.timestamp)';

    const buildFilters = (extra) => {
      const clauses = [];
      const values = [];
      if (stationId) {
        clauses.push('r.station_id = ?');
        values.push(stationId);
      }
      if (categoryId) {
        clauses.push('r.category_id = ?');
        values.push(categoryId);
      }
      if (categoryKey) {
        clauses.push('c.category_key = ?');
        values.push(categoryKey);
      }
      if (startDate) {
        clauses.push('r.timestamp >= ?');
        values.push(startDate);
      }
      if (endDate) {
        clauses.push('r.timestamp <= ?');
        values.push(`${endDate} 23:59:59`);
      }
      if (extra) clauses.push(extra);
      return {
        whereSql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
        values
      };
    };

    const summaryMap = {};
    const stats = { totalRecords: 0, category: {} };

    const ensureStats = (row) => {
      const catKey = row.category_key || 'unknown';
      if (!stats.category[catKey]) {
        stats.category[catKey] = {
          categoryName: row.category_name,
          valueType: row.value_type,
          records: 0,
          netIncrease: 0,
          sumValue: 0
        };
      }
      return catKey;
    };

    // 计量型：净增值
    const { whereSql: cumulativeWhere, values: cumulativeParams } = buildFilters("c.value_type = 'cumulative'");
    if (cumulativeWhere.includes('c.value_type')) {
      const cumulativeSql = `
        SELECT
          r.station_id,
          s.station_name,
          r.category_id,
          c.category_key,
          c.category_name,
          c.value_type,
          ${timeExpr} AS time_key,
          r.value,
          LAG(r.value) OVER (PARTITION BY r.address ORDER BY r.timestamp) AS prev_value
        FROM plc_readings r
        LEFT JOIN stations s ON r.station_id = s.id
        LEFT JOIN plc_categories c ON r.category_id = c.id
        ${cumulativeWhere}
        ORDER BY r.address, r.timestamp
      `;

      const rows = await sequelize.query(cumulativeSql, {
        replacements: cumulativeParams,
        type: QueryTypes.SELECT
      });

      rows.forEach(row => {
        if (row.prev_value === null || row.prev_value === undefined) return;
        const net = Number(row.value) - Number(row.prev_value);
        if (Number.isNaN(net)) return;

        const key = `${row.station_id || '0'}_${row.category_id || '0'}_${row.time_key}`;
        if (!summaryMap[key]) {
          summaryMap[key] = {
            stationId: row.station_id,
            stationName: row.station_name || '-',
            categoryId: row.category_id,
            categoryKey: row.category_key,
            categoryName: row.category_name,
            valueType: row.value_type,
            time: row.time_key,
            netIncrease: 0,
            avgValue: 0,
            minValue: null,
            maxValue: null,
            sampleCount: 0
          };
        }
        summaryMap[key].netIncrease += net;
        summaryMap[key].sampleCount += 1;
        summaryMap[key].avgValue = summaryMap[key].sampleCount
          ? summaryMap[key].netIncrease / summaryMap[key].sampleCount
          : 0;

        const catKey = ensureStats(row);
        stats.totalRecords += 1;
        stats.category[catKey].records += 1;
        stats.category[catKey].netIncrease += net;
      });
    }

    // 变化型：均值/极值
    const { whereSql: fluctWhere, values: fluctParams } = buildFilters("c.value_type IN ('fluctuating','event')");
    if (fluctWhere.includes('c.value_type')) {
      const fluctSql = `
        SELECT
          r.station_id,
          s.station_name,
          r.category_id,
          c.category_key,
          c.category_name,
          c.value_type,
          ${timeExpr} AS time_key,
          AVG(r.value) AS avg_value,
          MIN(r.value) AS min_value,
          MAX(r.value) AS max_value,
          COUNT(*) AS sample_count
        FROM plc_readings r
        LEFT JOIN stations s ON r.station_id = s.id
        LEFT JOIN plc_categories c ON r.category_id = c.id
        ${fluctWhere}
        GROUP BY r.station_id, s.station_name, r.category_id, c.category_key, c.category_name, c.value_type, time_key
        ORDER BY time_key
      `;

      const rows = await sequelize.query(fluctSql, {
        replacements: fluctParams,
        type: QueryTypes.SELECT
      });

      rows.forEach(row => {
        const key = `${row.station_id || '0'}_${row.category_id || '0'}_${row.time_key}`;
        summaryMap[key] = {
          stationId: row.station_id,
          stationName: row.station_name || '-',
          categoryId: row.category_id,
          categoryKey: row.category_key,
          categoryName: row.category_name,
          valueType: row.value_type,
          time: row.time_key,
          netIncrease: null,
          avgValue: Number(row.avg_value || 0),
          minValue: row.min_value !== null ? Number(row.min_value) : null,
          maxValue: row.max_value !== null ? Number(row.max_value) : null,
          sampleCount: Number(row.sample_count || 0)
        };

        const catKey = ensureStats(row);
        stats.totalRecords += Number(row.sample_count || 0);
        stats.category[catKey].records += Number(row.sample_count || 0);
        stats.category[catKey].sumValue += Number(row.avg_value || 0) * Number(row.sample_count || 0);
      });
    }

    const summary = Object.values(summaryMap).sort((a, b) => {
      if (a.time === b.time) return 0;
      return a.time > b.time ? -1 : 1;
    });
    const total = summary.length;
    const paged = summary.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
    const normalizedCategoryStats = {};
    Object.entries(stats.category).forEach(([key, value]) => {
      const avgValue = value.valueType === 'fluctuating' || value.valueType === 'event'
        ? (value.records ? value.sumValue / value.records : 0)
        : (value.records ? value.netIncrease / value.records : 0);
      normalizedCategoryStats[key] = {
        categoryName: value.categoryName,
        valueType: value.valueType,
        records: value.records,
        netIncrease: value.netIncrease,
        avgValue
      };
    });
    stats.category = normalizedCategoryStats;

    ctx.body = { code: 200, message: 'success', data: { summary: paged, total, page, pageSize, stats } };
  } catch (error) {
    logger.error('getHistorySummary error:', error);
    ctx.status = 500;
    ctx.body = { code: 500, message: error.message };
  }
};

/**
 * 可视化趋势（按分类返回时间序列）
 */
export const getReportTrends = async (ctx) => {
  try {
    const {
      stationId,
      startDate,
      endDate,
      groupBy = 'day',
      categories
    } = ctx.query;

    let timeExpr = "DATE_FORMAT(r.timestamp, '%Y-%m-%d')";
    if (groupBy === 'month') timeExpr = "DATE_FORMAT(r.timestamp, '%Y-%m')";
    if (groupBy === 'year') timeExpr = "DATE_FORMAT(r.timestamp, '%Y')";

    const categoryList = categories ? categories.split(',').map(c => c.trim()).filter(Boolean) : [];
    const enabledCategories = await PlcCategory.findAll({
      where: {
        ...(categoryList.length ? { category_key: { [Op.in]: categoryList } } : {}),
        is_enabled: true
      },
      order: [['sort_order', 'ASC'], ['id', 'ASC']]
    });
    if (!enabledCategories.length) {
      ctx.body = { code: 200, message: 'success', data: { series: {}, categories: [] } };
      return;
    }

    const categoryKeys = enabledCategories.map(c => c.category_key);
    const categoryMap = Object.fromEntries(enabledCategories.map(c => [c.category_key, {
      key: c.category_key,
      name: c.category_name,
      valueType: c.value_type
    }]));

    const buildFilters = (extra) => {
      const clauses = [`c.category_key IN (${categoryKeys.map(() => '?').join(',')})`];
      const values = [...categoryKeys];
      if (stationId) {
        clauses.push('r.station_id = ?');
        values.push(stationId);
      }
      if (startDate) {
        clauses.push('r.timestamp >= ?');
        values.push(startDate);
      }
      if (endDate) {
        clauses.push('r.timestamp <= ?');
        values.push(`${endDate} 23:59:59`);
      }
      if (extra) clauses.push(extra);
      return {
        whereSql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
        values
      };
    };

    const series = {};
    categoryKeys.forEach(key => {
      series[key] = { valueType: categoryMap[key].valueType, data: [] };
    });

    // 计量型：净增曲线
    const cumulativeKeys = categoryKeys.filter(key => categoryMap[key].valueType === 'cumulative');
    if (cumulativeKeys.length) {
      const { whereSql, values } = buildFilters("c.value_type = 'cumulative'");
      const cumulativeSql = `
        SELECT
          t.category_key,
          t.time_key,
          SUM(t.value_diff) AS net_value,
          SUM(t.sample_count) AS sample_count
        FROM (
          SELECT
            r.category_id,
            c.category_key,
            ${timeExpr} AS time_key,
            (r.value - LAG(r.value) OVER (PARTITION BY r.address ORDER BY r.timestamp)) AS value_diff,
            CASE WHEN LAG(r.value) OVER (PARTITION BY r.address ORDER BY r.timestamp) IS NULL THEN 0 ELSE 1 END AS sample_count
          FROM plc_readings r
          LEFT JOIN plc_categories c ON r.category_id = c.id
          ${whereSql}
        ) t
        WHERE t.value_diff IS NOT NULL
        GROUP BY t.category_key, t.time_key
        ORDER BY t.time_key
      `;

      const rows = await sequelize.query(cumulativeSql, {
        replacements: values,
        type: QueryTypes.SELECT
      });

      rows.forEach(row => {
        if (!series[row.category_key]) return;
        series[row.category_key].data.push({
          time: row.time_key,
          value: Number(row.net_value || 0),
          sampleCount: Number(row.sample_count || 0)
        });
      });
    }

    // 变化型：均值/极值曲线
    const { whereSql: fluctWhere, values: fluctParams } = buildFilters("c.value_type IN ('fluctuating','event')");
    if (fluctWhere.includes('c.value_type')) {
      const fluctSql = `
        SELECT
          c.category_key,
          ${timeExpr} AS time_key,
          AVG(r.value) AS avg_value,
          MIN(r.value) AS min_value,
          MAX(r.value) AS max_value,
          COUNT(*) AS sample_count
        FROM plc_readings r
        LEFT JOIN plc_categories c ON r.category_id = c.id
        ${fluctWhere}
        GROUP BY c.category_key, time_key
        ORDER BY time_key
      `;

      const rows = await sequelize.query(fluctSql, {
        replacements: fluctParams,
        type: QueryTypes.SELECT
      });

      rows.forEach(row => {
        if (!series[row.category_key]) return;
        series[row.category_key].data.push({
          time: row.time_key,
          value: Number(row.avg_value || 0),
          avg: Number(row.avg_value || 0),
          min: row.min_value !== null ? Number(row.min_value) : null,
          max: row.max_value !== null ? Number(row.max_value) : null,
          sampleCount: Number(row.sample_count || 0)
        });
      });
    }

    ctx.body = { code: 200, message: 'success', data: { series, categories: Object.values(categoryMap) } };
  } catch (error) {
    logger.error('getReportTrends error:', error);
    ctx.status = 500;
    ctx.body = { code: 500, message: error.message };
  }
};

/**
 * 检查 PLC 服务状态
 */
export const checkPlcServiceStatus = async (ctx) => {
  try {
    const { ip } = ctx.query;
    const status = await plcBridgeService.checkServiceStatus(ip);
    ctx.body = { code: 200, message: 'success', data: status };
  } catch (error) {
    logger.error('checkPlcServiceStatus error:', error);
    ctx.body = { code: 200, message: 'success', data: { status: 'offline', error: error.message } };
  }
};

/**
 * 下载历史数据导入模板
 */
export const downloadHistoryTemplate = async (ctx) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('历史数据导入模板');

    worksheet.columns = [
      { header: '场站名称', key: 'stationName', width: 20 },
      { header: '分类名称', key: 'categoryName', width: 20 },
      { header: '监控点名称', key: 'configName', width: 25 },
      { header: '地址', key: 'address', width: 15 },
      { header: '数值', key: 'value', width: 15 },
      { header: '时间戳', key: 'timestamp', width: 20 },
      { header: '质量(1=正常)', key: 'quality', width: 15 }
    ];

    // 添加示例数据
    worksheet.addRow({
      stationName: '示例场站',
      categoryName: '水表',
      configName: '站点A-水表',
      address: 'DB1.DBD0',
      value: 1234.5678,
      timestamp: '2026-01-18 10:00:00',
      quality: 1
    });

    applyTemplateHeaderStyle(worksheet, 1);
    addTemplateInstructionSheet(workbook, [
      ['场站名称', '必填，系统已有场站名称。'],
      ['分类名称', '必填，系统已有分类名称。'],
      ['监控点名称', '必填，系统已有监控点名称。'],
      ['地址', '必填，PLC 地址（与监控点一致）。'],
      ['数值', '必填，数值类型。'],
      ['时间戳', '必填，格式 YYYY-MM-DD HH:mm:ss。'],
      ['质量(1=正常)', '必填，1=正常，0=异常。']
    ]);

    ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    ctx.set('Content-Disposition', 'attachment; filename=plc_history_import_template.xlsx');
    ctx.body = await workbook.xlsx.writeBuffer();
  } catch (error) {
    logger.error('downloadHistoryTemplate error:', error);
    ctx.status = 500;
    ctx.body = { code: 500, message: error.message };
  }
};

/**
 * 导入历史数据
 */
export const importHistoryData = async (ctx) => {
  try {
    const file = ctx.file;
    if (!file) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '请上传文件' };
      return;
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      ctx.status = 400;
      ctx.body = { code: 400, message: 'Invalid Excel format' };
      return;
    }

    const records = [];
    const errors = [];

    const normalizeCellValue = (cellValue) => {
      if (cellValue === null || cellValue === undefined) return null;
      if (cellValue instanceof Date) return cellValue;
      if (typeof cellValue === 'number' || typeof cellValue === 'boolean') return cellValue;
      if (typeof cellValue === 'string') return cellValue.trim();
      if (typeof cellValue === 'object') {
        if (cellValue.text) return String(cellValue.text).trim();
        if (Array.isArray(cellValue.richText)) {
          return cellValue.richText.map(item => item.text || '').join('').trim();
        }
        if (cellValue.result !== undefined && cellValue.result !== null) return cellValue.result;
      }
      return String(cellValue).trim();
    };

    const parseExcelTimestamp = (cellValue) => {
      const normalized = normalizeCellValue(cellValue);
      if (normalized === null || normalized === undefined || normalized === '') return null;
      if (normalized instanceof Date) return normalized;
      if (typeof normalized === 'number') {
        const excelEpoch = 25569;
        const secondsInDay = 86400;
        const utcSeconds = Math.round((normalized - excelEpoch) * secondsInDay);
        return new Date(utcSeconds * 1000);
      }
      const parsed = new Date(String(normalized));
      if (Number.isNaN(parsed.getTime())) return null;
      return parsed;
    };

    const parseAddress = (value) => {
      if (!value) return null;
      const text = String(value).replace(/\s+/g, '').toUpperCase();
      const dbMatch = text.match(/DB(\d+)/);
      const offsetMatch = text.match(/(\d+(?:\.\d+)?)$/);
      if (!dbMatch || !offsetMatch) return null;
      const dbNumber = parseInt(dbMatch[1], 10);
      const offsetAddress = parseFloat(offsetMatch[1]);
      if (Number.isNaN(dbNumber) || Number.isNaN(offsetAddress)) return null;
      return { dbNumber, offsetAddress };
    };

    // 跳过表头，从第2行开始读取
    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      const stationRaw = normalizeCellValue(row.getCell(1).value);
      const categoryRaw = normalizeCellValue(row.getCell(2).value);
      const configRaw = normalizeCellValue(row.getCell(3).value);
      const addressRaw = normalizeCellValue(row.getCell(4).value);
      const valueRaw = normalizeCellValue(row.getCell(5).value);
      const timestampRaw = row.getCell(6).value;
      const qualityRaw = normalizeCellValue(row.getCell(7).value);

      const stationName = stationRaw !== null && stationRaw !== undefined ? String(stationRaw).trim() : '';
      const categoryName = categoryRaw !== null && categoryRaw !== undefined ? String(categoryRaw).trim() : '';
      const configName = configRaw !== null && configRaw !== undefined ? String(configRaw).trim() : '';
      const address = addressRaw !== null && addressRaw !== undefined ? String(addressRaw).trim() : '';

      // 跳过空行
      if (!stationName && !categoryName && !configName) continue;

      // 验证必填字段
      if (!stationName || !categoryName || !configName || !address || valueRaw === null || valueRaw === undefined || !timestampRaw) {
        errors.push(`\u7b2c${i}\u884c: \u5fc5\u586b\u5b57\u6bb5\u7f3a\u5931(\u573a\u7ad9/\u5206\u7c7b/\u76d1\u63a7\u70b9/\u5730\u5740/\u6570\u503c/\u65f6\u95f4)`);
        continue;
      }

      // 查找场站
      const stationIdCandidate = /^[0-9]+$/.test(stationName) ? parseInt(stationName, 10) : null;
      const station = stationIdCandidate
        ? await Station.findByPk(stationIdCandidate)
        : await Station.findOne({ where: { station_name: stationName } });
      if (!station) {
        errors.push(`\u7b2c${i}\u884c: \u573a\u7ad9\"${stationName}\"\u4e0d\u5b58\u5728`);
        continue;
      }

      // 查找分类
      const categoryIdCandidate = /^[0-9]+$/.test(categoryName) ? parseInt(categoryName, 10) : null;
      let category = categoryIdCandidate
        ? await PlcCategory.findByPk(categoryIdCandidate)
        : await PlcCategory.findOne({ where: { category_name: categoryName } });
      if (!category && !categoryIdCandidate) {
        category = await PlcCategory.findOne({ where: { category_key: categoryName } });
      }
      if (!category) {
        errors.push(`\u7b2c${i}\u884c: \u5206\u7c7b\"${categoryName}\"\u4e0d\u5b58\u5728`);
        continue;
      }

      // 查找监控配置
      const configIdCandidate = /^[0-9]+$/.test(configName) ? parseInt(configName, 10) : null;
      let config = configIdCandidate
        ? await PlcMonitorConfig.findByPk(configIdCandidate)
        : await PlcMonitorConfig.findOne({
          where: {
            name: configName,
            station_id: station.id,
            category_id: category.id
          }
        });
      if (!config) {
        const parsedAddress = parseAddress(address);
        if (parsedAddress) {
          config = await PlcMonitorConfig.findOne({
            where: {
              station_id: station.id,
              category_id: category.id,
              db_number: parsedAddress.dbNumber,
              offset_address: parsedAddress.offsetAddress
            }
          });
        }
      }
      if (!config) {
        const parsedAddress = parseAddress(address);
        if (parsedAddress) {
          config = await PlcMonitorConfig.findOne({
            where: {
              station_id: station.id,
              db_number: parsedAddress.dbNumber,
              offset_address: parsedAddress.offsetAddress
            }
          });
          if (config && config.category_id && category.id !== config.category_id) {
            const mappedCategory = await PlcCategory.findByPk(config.category_id);
            if (mappedCategory) category = mappedCategory;
          }
        }
      }
      if (!config) {
        errors.push(`\u7b2c${i}\u884c: \u76d1\u63a7\u70b9\"${configName}\"\u4e0d\u5b58\u5728\u6216\u5730\u5740\u4e0d\u5339\u914d`);
        continue;
      }

      // 解析时间戳
      const parsedTimestamp = parseExcelTimestamp(timestampRaw);
      if (!parsedTimestamp) {
        errors.push(`\u7b2c${i}\u884c: \u65f6\u95f4\u6233\u683c\u5f0f\u9519\u8bef`);
        continue;
      }

      const normalizedTimestamp = new Date(parsedTimestamp);
      normalizedTimestamp.setMilliseconds(0);

      const numericValue = typeof valueRaw === 'number' ? valueRaw : parseFloat(String(valueRaw));
      if (Number.isNaN(numericValue)) {
        errors.push(`\u7b2c${i}\u884c: \u6570\u503c\u683c\u5f0f\u9519\u8bef`);
        continue;
      }

      let qualityValue = 1;
      if (qualityRaw !== null && qualityRaw !== undefined && qualityRaw !== '') {
        const parsedQuality = typeof qualityRaw === 'number' ? qualityRaw : parseInt(String(qualityRaw), 10);
        if (!Number.isNaN(parsedQuality)) qualityValue = parsedQuality;
      }

      records.push({
        config_id: config.id,
        station_id: station.id,
        category_id: category.id,
        address: address,
        value: numericValue,
        timestamp: normalizedTimestamp,
        quality: qualityValue
      });
    }

    if (errors.length > 0 && records.length === 0) {
      ctx.status = 400;
      ctx.body = { code: 400, message: '导入失败', errors };
      return;
    }

    let insertRecords = records;
    let duplicateInFile = 0;
    let duplicateInDb = 0;

    if (records.length > 0) {
      const seenKeys = new Set();
      const uniqueRecords = [];
      records.forEach((record) => {
        const key = `${record.config_id}_${record.timestamp.getTime()}`;
        if (seenKeys.has(key)) {
          duplicateInFile += 1;
          return;
        }
        seenKeys.add(key);
        uniqueRecords.push(record);
      });

      const pairs = uniqueRecords.map((record) => [record.config_id, record.timestamp]);
      if (pairs.length > 0) {
        const placeholders = pairs.map(() => '(?, ?)').join(',');
        const flatValues = pairs.flatMap(item => item);
        const existingRows = await sequelize.query(
          `SELECT config_id, timestamp FROM plc_readings WHERE (config_id, timestamp) IN (${placeholders})`,
          { replacements: flatValues, type: QueryTypes.SELECT }
        );
        const existingKeys = new Set(
          existingRows.map(row => `${row.config_id}_${new Date(row.timestamp).getTime()}`)
        );
        insertRecords = uniqueRecords.filter(record => {
          const key = `${record.config_id}_${record.timestamp.getTime()}`;
          return !existingKeys.has(key);
        });
        duplicateInDb = uniqueRecords.length - insertRecords.length;
      }
    }

    // 批量插入
    if (insertRecords.length > 0) {
      await PlcReading.bulkCreate(insertRecords);
    }

    ctx.body = {
      code: 200,
      message: '导入成功',
      data: {
        total: records.length,
        success: insertRecords.length,
        skipped: duplicateInFile + duplicateInDb,
        duplicateInFile,
        duplicateInDb,
        errors: errors.length > 0 ? errors : undefined
      }
    };
  } catch (error) {
    logger.error('importHistoryData error:', error);
    ctx.status = 500;
    ctx.body = { code: 500, message: error.message };
  }
};

/**
 * 计量型数据报表（用电量/用水量）
 */
export const getCumulativeReport = async (ctx) => {
  try {
    const {
      stationId,
      categoryId,
      startDate,
      endDate,
      timeGranularity = 'day',
      groupBy = 'address'
    } = ctx.query;
    const page = parseInt(ctx.query.page || '1', 10);
    const pageSize = parseInt(ctx.query.pageSize || '20', 10);
    const dataFilter = ctx.state.dataFilter || {};
    const roleCode = ctx.state.user?.baseRoleCode || ctx.state.user?.roleCode;
    const managerAllAccess = ['department_manager', 'deputy_manager', 'senior_management', 'admin'].includes(roleCode);

    if (dataFilter.none) {
      ctx.body = { code: 200, message: 'success', data: { summary: null, data: [], total: 0, page, pageSize, topRankings: { list: [] } } };
      return;
    }

    const timeFormatter = {
      day: 'DATE(r.timestamp)',
      week: "DATE_FORMAT(r.timestamp, '%x-%v')", // ISO week
      month: "DATE_FORMAT(r.timestamp, '%Y-%m')",
      year: "DATE_FORMAT(r.timestamp, '%Y')"
    }[timeGranularity] || 'DATE(r.timestamp)';

    const groupField = {
      address: 'r.address',
      station: 'r.station_id',
      category: 'r.category_id'
    }[groupBy] || 'r.address';

    const buildFilters = () => {
      const clauses = ["(c.value_type = 'cumulative' OR c.value_type IS NULL)"];
      const values = [];

      if (!dataFilter.all && !managerAllAccess && dataFilter.stationIds?.length > 0) {
        clauses.push(`r.station_id IN (${dataFilter.stationIds.map(() => '?').join(',')})`);
        values.push(...dataFilter.stationIds);
      }

      if (stationId) {
        clauses.push('r.station_id = ?');
        values.push(stationId);
      }
      if (categoryId) {
        clauses.push('r.category_id = ?');
        values.push(categoryId);
      }
      if (startDate) {
        clauses.push('DATE(r.timestamp) >= ?');
        values.push(startDate);
      }
      if (endDate) {
        clauses.push('DATE(r.timestamp) <= ?');
        values.push(endDate);
      }
      return { whereSql: `WHERE ${clauses.join(' AND ')}`, values };
    };

    const { whereSql, values } = buildFilters();

    const sql = `
      WITH readings AS (
        SELECT
          r.config_id,
          r.station_id,
          r.category_id,
          r.address,
          r.timestamp,
          r.value,
          ${timeFormatter} AS date_key,
          ROW_NUMBER() OVER (PARTITION BY ${timeFormatter}, r.config_id ORDER BY r.timestamp ASC) AS rn
        FROM plc_readings r
        LEFT JOIN plc_categories c ON r.category_id = c.id
        ${whereSql}
      ),
      grouped AS (
        SELECT
          date_key,
          config_id,
          station_id,
          category_id,
          address,
          value AS start_value,
          timestamp AS start_time
        FROM readings
        WHERE rn = 1
      ),
      with_end AS (
        SELECT
          g.*,
          LEAD(g.start_value) OVER (PARTITION BY g.config_id ORDER BY g.date_key) AS end_value
        FROM grouped g
      )
      SELECT
        we.date_key AS date,
        we.config_id,
        we.station_id,
        s.station_name,
        we.category_id,
        cat.category_name,
        we.address,
        cfg.name AS config_name,
        cfg.unit,
        we.start_value,
        we.end_value,
        CASE
          WHEN we.end_value IS NOT NULL AND we.start_value IS NOT NULL
          THEN we.end_value - we.start_value
          ELSE NULL
        END AS usage_value
      FROM with_end we
      LEFT JOIN stations s ON we.station_id = s.id
      LEFT JOIN plc_categories cat ON we.category_id = cat.id
      LEFT JOIN plc_monitor_configs cfg ON we.config_id = cfg.id
      WHERE we.end_value IS NOT NULL
      ORDER BY we.date_key DESC, usage_value DESC
    `;

    const rows = await sequelize.query(sql, {
      replacements: values,
      type: QueryTypes.SELECT
    });

    const mappedRows = rows.map((r, idx) => ({
      ...r,
      usage: Number(r.usage_value),
      rank: idx + 1
    }));

    const totalUsage = mappedRows.reduce((sum, r) => sum + (Number(r.usage) || 0), 0);
    const avgDailyUsage = mappedRows.length > 0 ? totalUsage / mappedRows.length : 0;
    const maxDailyUsage = mappedRows.length > 0 ? Math.max(...mappedRows.map(r => Number(r.usage) || 0)) : 0;

    const total = mappedRows.length;
    const paged = mappedRows.slice((page - 1) * pageSize, page * pageSize);

    const topRankings = {
      list: mappedRows.slice(0, 10)
    };

    ctx.body = {
      code: 200,
      message: 'success',
      data: {
        summary: { totalUsage, avgDailyUsage, maxDailyUsage },
        data: paged,
        total,
        page,
        pageSize,
        topRankings
      }
    };
  } catch (error) {
    logger.error('getCumulativeReport error:', error);
    ctx.status = 500;
    ctx.body = { code: 500, message: error.message };
  }
};

/**
 * 变化型数据报表（温度/压力）
 */
export const getFluctuatingReport = async (ctx) => {
  try {
    const {
      stationId,
      categoryId,
      startDate,
      endDate,
      timeGranularity = 'day',
      groupBy = 'address'
    } = ctx.query;
    const page = parseInt(ctx.query.page || '1', 10);
    const pageSize = parseInt(ctx.query.pageSize || '20', 10);
    const dataFilter = ctx.state.dataFilter || {};
    const roleCode = ctx.state.user?.baseRoleCode || ctx.state.user?.roleCode;
    const managerAllAccess = ['department_manager', 'deputy_manager', 'senior_management', 'admin'].includes(roleCode);

    if (dataFilter.none) {
      ctx.body = { code: 200, message: 'success', data: { data: [], total: 0, page, pageSize } };
      return;
    }

    const timeFormatter = {
      day: 'DATE(r.timestamp)',
      week: "DATE_FORMAT(r.timestamp, '%x-%v')",
      month: "DATE_FORMAT(r.timestamp, '%Y-%m')",
      year: "DATE_FORMAT(r.timestamp, '%Y')"
    }[timeGranularity] || 'DATE(r.timestamp)';

    const buildFilters = () => {
      const clauses = ["(c.value_type IN ('fluctuating', 'event') OR c.value_type IS NULL)"];
      const values = [];

      if (!dataFilter.all && !managerAllAccess && dataFilter.stationIds?.length > 0) {
        clauses.push(`r.station_id IN (${dataFilter.stationIds.map(() => '?').join(',')})`);
        values.push(...dataFilter.stationIds);
      }

      if (stationId) {
        clauses.push('r.station_id = ?');
        values.push(stationId);
      }
      if (categoryId) {
        clauses.push('r.category_id = ?');
        values.push(categoryId);
      }
      if (startDate) {
        clauses.push('DATE(r.timestamp) >= ?');
        values.push(startDate);
      }
      if (endDate) {
        clauses.push('DATE(r.timestamp) <= ?');
        values.push(endDate);
      }
      return { whereSql: `WHERE ${clauses.join(' AND ')}`, values };
    };

    const { whereSql, values } = buildFilters();

    const sql = `
      SELECT
        ${timeFormatter} AS date,
        r.config_id,
        r.station_id,
        s.station_name,
        r.category_id,
        cat.category_name,
        r.address,
        cfg.name AS config_name,
        cfg.unit,
        MIN(r.value) AS min_value,
        AVG(r.value) AS avg_value,
        MAX(r.value) AS max_value,
        COUNT(*) AS sample_count
      FROM plc_readings r
      LEFT JOIN plc_categories c ON r.category_id = c.id
      LEFT JOIN stations s ON r.station_id = s.id
      LEFT JOIN plc_categories cat ON r.category_id = cat.id
      LEFT JOIN plc_monitor_configs cfg ON r.config_id = cfg.id
      ${whereSql}
      GROUP BY ${timeFormatter}, r.config_id, r.station_id, s.station_name, r.category_id, cat.category_name, r.address, cfg.name, cfg.unit
      ORDER BY date DESC, r.config_id
    `;

    const rows = await sequelize.query(sql, {
      replacements: values,
      type: QueryTypes.SELECT
    });

    const total = rows.length;
    const paged = rows.slice((page - 1) * pageSize, page * pageSize);

    ctx.body = {
      code: 200,
      message: 'success',
      data: {
        data: paged,
        total,
        page,
        pageSize
      }
    };
  } catch (error) {
    logger.error('getFluctuatingReport error:', error);
    ctx.status = 500;
    ctx.body = { code: 500, message: error.message };
  }
};

export default {
  getRealtimeData,
  getHistoryData,
  getConfigs,
  createConfig,
  updateConfig,
  deleteConfig,
  importConfigs,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  exportReport,
  getReportStats,
  getHistorySummary,
  getReportTrends,
  writeConfigValue,
  downloadConfigTemplate,
  checkPlcServiceStatus,
  downloadHistoryTemplate,
  importHistoryData,
  getCumulativeReport,
  getFluctuatingReport
};
