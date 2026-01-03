import { Op } from 'sequelize';
import { HygieneArea, HygienePoint, HygienePositionArea, Station, sequelize } from '../models/index.js';
import { createError } from '../middlewares/error.js';
import { getPagination, formatPaginationResponse } from '../utils/helpers.js';

/**
 * ============================================
 * 卫生责任区管理
 * ============================================
 */

/**
 * 查询卫生责任区列表
 * GET /api/hygiene-areas
 */
export const getHygieneAreas = async (ctx) => {
  const { stationId } = ctx.query;
  const dataFilter = ctx.state.dataFilter;

  const where = {};

  // 场站过滤
  if (stationId) {
    where.station_id = parseInt(stationId);
  } else if (!dataFilter.all && dataFilter.stationIds?.length > 0) {
    where.station_id = { [Op.in]: dataFilter.stationIds };
  }

  const areas = await HygieneArea.findAll({
    where,
    include: [
      { model: Station, as: 'station', attributes: ['id', 'station_name'] }
    ],
    order: [['created_at', 'DESC']]
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: areas
  };
};

/**
 * 创建卫生责任区
 * POST /api/hygiene-areas
 */
export const createHygieneArea = async (ctx) => {
  const { stationId, areaName, points } = ctx.request.body;

  if (!stationId || !areaName) {
    throw createError(400, '场站和责任区名称不能为空');
  }

  // 检查是否已存在同名责任区
  const existing = await HygieneArea.findOne({
    where: {
      station_id: stationId,
      area_name: areaName
    }
  });

  if (existing) {
    throw createError(400, '该场站已存在同名责任区');
  }

  // 使用事务创建责任区和卫生点
  const t = await sequelize.transaction();

  try {
    // 创建责任区
    const area = await HygieneArea.create({
      station_id: stationId,
      area_name: areaName
    }, { transaction: t });

    // 如果提供了卫生点数据，批量创建
    if (points && Array.isArray(points) && points.length > 0) {
      await HygienePoint.bulkCreate(
        points.map(p => ({
          hygiene_area_id: area.id,
          station_id: stationId,
          point_name: p.pointName,
          work_requirements: p.workRequirements
        })),
        { transaction: t }
      );
    }

    await t.commit();

    ctx.body = {
      code: 200,
      message: '责任区创建成功',
      data: { id: area.id }
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

/**
 * 更新卫生责任区
 * PUT /api/hygiene-areas/:id
 */
export const updateHygieneArea = async (ctx) => {
  const { id } = ctx.params;
  const { areaName } = ctx.request.body;

  const area = await HygieneArea.findByPk(id);
  if (!area) {
    throw createError(404, '责任区不存在');
  }

  // 检查是否有同名责任区
  if (areaName && areaName !== area.area_name) {
    const existing = await HygieneArea.findOne({
      where: {
        station_id: area.station_id,
        area_name: areaName,
        id: { [Op.ne]: id }
      }
    });

    if (existing) {
      throw createError(400, '该场站已存在同名责任区');
    }
  }

  await area.update({
    area_name: areaName || area.area_name
  });

  ctx.body = {
    code: 200,
    message: '责任区更新成功',
    data: null
  };
};

/**
 * 删除卫生责任区
 * DELETE /api/hygiene-areas/:id
 */
export const deleteHygieneArea = async (ctx) => {
  const { id } = ctx.params;

  const area = await HygieneArea.findByPk(id);
  if (!area) {
    throw createError(404, '责任区不存在');
  }

  // 检查是否有关联的卫生点
  const pointCount = await HygienePoint.count({
    where: { hygiene_area_id: id }
  });

  if (pointCount > 0) {
    throw createError(400, '该责任区下还有卫生点，无法删除');
  }

  // 检查是否有关联的岗位分配
  const assignmentCount = await HygienePositionArea.count({
    where: { hygiene_area_id: id }
  });

  if (assignmentCount > 0) {
    throw createError(400, '该责任区已分配给岗位，无法删除');
  }

  await area.destroy();

  ctx.body = {
    code: 200,
    message: '责任区删除成功',
    data: null
  };
};

/**
 * ============================================
 * 卫生点管理
 * ============================================
 */

/**
 * 查询卫生点列表
 * GET /api/hygiene-points
 */
export const getHygienePoints = async (ctx) => {
  const { hygieneAreaId, stationId } = ctx.query;
  const dataFilter = ctx.state.dataFilter;

  const where = {};

  if (hygieneAreaId) {
    where.hygiene_area_id = parseInt(hygieneAreaId);
  }

  if (stationId) {
    where.station_id = parseInt(stationId);
  } else if (!dataFilter.all && dataFilter.stationIds?.length > 0) {
    where.station_id = { [Op.in]: dataFilter.stationIds };
  }

  const points = await HygienePoint.findAll({
    where,
    include: [
      { model: HygieneArea, as: 'area', attributes: ['id', 'area_name'] },
      { model: Station, as: 'station', attributes: ['id', 'station_name'] }
    ],
    order: [['created_at', 'ASC']]
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: points
  };
};

/**
 * 创建卫生点
 * POST /api/hygiene-points
 */
export const createHygienePoint = async (ctx) => {
  const { hygieneAreaId, pointName, workRequirements } = ctx.request.body;

  if (!hygieneAreaId || !pointName) {
    throw createError(400, '责任区和卫生点名称不能为空');
  }

  // 查询责任区以获取场站ID
  const area = await HygieneArea.findByPk(hygieneAreaId);
  if (!area) {
    throw createError(404, '责任区不存在');
  }

  // 检查是否已存在同名卫生点
  const existing = await HygienePoint.findOne({
    where: {
      hygiene_area_id: hygieneAreaId,
      point_name: pointName
    }
  });

  if (existing) {
    throw createError(400, '该责任区已存在同名卫生点');
  }

  const point = await HygienePoint.create({
    hygiene_area_id: hygieneAreaId,
    station_id: area.station_id,
    point_name: pointName,
    work_requirements: workRequirements || null
  });

  ctx.body = {
    code: 200,
    message: '卫生点创建成功',
    data: { id: point.id }
  };
};

/**
 * 更新卫生点
 * PUT /api/hygiene-points/:id
 */
export const updateHygienePoint = async (ctx) => {
  const { id } = ctx.params;
  const { pointName, workRequirements } = ctx.request.body;

  const point = await HygienePoint.findByPk(id);
  if (!point) {
    throw createError(404, '卫生点不存在');
  }

  // 检查是否有同名卫生点
  if (pointName && pointName !== point.point_name) {
    const existing = await HygienePoint.findOne({
      where: {
        hygiene_area_id: point.hygiene_area_id,
        point_name: pointName,
        id: { [Op.ne]: id }
      }
    });

    if (existing) {
      throw createError(400, '该责任区已存在同名卫生点');
    }
  }

  await point.update({
    point_name: pointName || point.point_name,
    work_requirements: workRequirements !== undefined ? workRequirements : point.work_requirements
  });

  ctx.body = {
    code: 200,
    message: '卫生点更新成功',
    data: null
  };
};

/**
 * 删除卫生点
 * DELETE /api/hygiene-points/:id
 */
export const deleteHygienePoint = async (ctx) => {
  const { id } = ctx.params;

  const point = await HygienePoint.findByPk(id);
  if (!point) {
    throw createError(404, '卫生点不存在');
  }

  await point.destroy();

  ctx.body = {
    code: 200,
    message: '卫生点删除成功',
    data: null
  };
};

/**
 * ============================================
 * 岗位任务分配管理
 * ============================================
 */

/**
 * 查询岗位责任区关联列表
 * GET /api/hygiene-position-areas
 */
export const getHygienePositionAreas = async (ctx) => {
  const { stationId, positionName } = ctx.query;
  const dataFilter = ctx.state.dataFilter;

  const where = {};

  if (stationId) {
    where.station_id = parseInt(stationId);
  } else if (!dataFilter.all && dataFilter.stationIds?.length > 0) {
    where.station_id = { [Op.in]: dataFilter.stationIds };
  }

  if (positionName) {
    where.position_name = positionName;
  }

  const assignments = await HygienePositionArea.findAll({
    where,
    include: [
      {
        model: HygieneArea,
        as: 'area',
        attributes: ['id', 'area_name'],
        include: [
          { model: HygienePoint, as: 'points', attributes: ['id', 'point_name', 'work_requirements'] }
        ]
      },
      { model: Station, as: 'station', attributes: ['id', 'station_name'] }
    ],
    order: [['position_name', 'ASC'], ['created_at', 'ASC']]
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: assignments
  };
};

/**
 * 创建岗位责任区关联
 * POST /api/hygiene-position-areas
 */
export const createHygienePositionArea = async (ctx) => {
  const { stationId, positionName, hygieneAreaId } = ctx.request.body;

  if (!stationId || !positionName || !hygieneAreaId) {
    throw createError(400, '场站、岗位和责任区不能为空');
  }

  // 检查责任区是否存在且属于该场站
  const area = await HygieneArea.findOne({
    where: {
      id: hygieneAreaId,
      station_id: stationId
    }
  });

  if (!area) {
    throw createError(404, '责任区不存在或不属于该场站');
  }

  // 检查是否已存在关联
  const existing = await HygienePositionArea.findOne({
    where: {
      station_id: stationId,
      position_name: positionName,
      hygiene_area_id: hygieneAreaId
    }
  });

  if (existing) {
    throw createError(400, '该岗位已关联此责任区');
  }

  const assignment = await HygienePositionArea.create({
    station_id: stationId,
    position_name: positionName,
    hygiene_area_id: hygieneAreaId
  });

  ctx.body = {
    code: 200,
    message: '岗位责任区关联成功',
    data: { id: assignment.id }
  };
};

/**
 * 删除岗位责任区关联
 * DELETE /api/hygiene-position-areas/:id
 */
export const deleteHygienePositionArea = async (ctx) => {
  const { id } = ctx.params;

  const assignment = await HygienePositionArea.findByPk(id);
  if (!assignment) {
    throw createError(404, '关联记录不存在');
  }

  await assignment.destroy();

  ctx.body = {
    code: 200,
    message: '关联删除成功',
    data: null
  };
};

/**
 * 根据岗位查询责任区及卫生点（用于卫生自检）
 * GET /api/hygiene-position-areas/by-position
 */
export const getHygieneAreasByPosition = async (ctx) => {
  const { stationId, positionName } = ctx.query;

  if (!stationId || !positionName) {
    throw createError(400, '场站和岗位不能为空');
  }

  const assignments = await HygienePositionArea.findAll({
    where: {
      station_id: parseInt(stationId),
      position_name: positionName
    },
    include: [
      {
        model: HygieneArea,
        as: 'area',
        attributes: ['id', 'area_name'],
        include: [
          {
            model: HygienePoint,
            as: 'points',
            attributes: ['id', 'point_name', 'work_requirements'],
            order: [['created_at', 'ASC']]
          }
        ]
      }
    ],
    order: [['created_at', 'ASC']]
  });

  // 提取责任区和卫生点数据
  const areas = assignments.map(assignment => assignment.area);

  ctx.body = {
    code: 200,
    message: 'success',
    data: areas
  };
};

export default {
  getHygieneAreas,
  createHygieneArea,
  updateHygieneArea,
  deleteHygieneArea,
  getHygienePoints,
  createHygienePoint,
  updateHygienePoint,
  deleteHygienePoint,
  getHygienePositionAreas,
  createHygienePositionArea,
  deleteHygienePositionArea,
  getHygieneAreasByPosition
};
