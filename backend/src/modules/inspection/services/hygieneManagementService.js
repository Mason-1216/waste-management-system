import { Op } from 'sequelize';
import { HygieneArea, HygienePoint, HygienePositionArea, Station, sequelize } from '../../../models/index.js';
import { createError } from '../../../middlewares/error.js';
import { getPagination, formatPaginationResponse } from '../../../utils/helpers.js';

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

  const mapPoint = (point) => ({
    id: point.id,
    pointName: point.point_name,
    workRequirements: point.work_requirements
  });

  const mapArea = (area) => ({
    id: area.id,
    stationId: area.station_id,
    stationName: area.station?.station_name ?? '',
    areaName: area.area_name,
    areaPoints: area.points ?? 0,
    points: (area.hygienePoints ?? []).map(mapPoint)
  });

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
      { model: Station, as: 'station', attributes: ['id', 'station_name'] },
      { model: HygienePoint, as: 'hygienePoints', attributes: ['id', 'point_name', 'work_requirements'] }
    ],
    order: [['created_at', 'DESC']]
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: areas.map(mapArea)
  };
};

/**
 * 创建卫生责任区
 * POST /api/hygiene-areas
 */
export const createHygieneArea = async (ctx) => {
  const { stationId, areaName, points, areaPoints, mergeMode } = ctx.request.body;

  const parsedStationId = Number(stationId);
  const normalizedAreaName = typeof areaName === 'string' ? areaName.trim() : '';
  if (!stationId || Number.isNaN(parsedStationId) || !normalizedAreaName) {
    throw createError(400, '场站和责任区名称不能为空');
  }

  const hasAreaPoints = areaPoints !== undefined && areaPoints !== null && areaPoints !== '';
  const parsedAreaPoints = hasAreaPoints ? Number(areaPoints) : null;
  if (hasAreaPoints && !Number.isFinite(parsedAreaPoints)) {
    throw createError(400, '积分格式不正确');
  }

  const allowMerge = mergeMode === 'merge';

  // 检查是否已存在同名责任区
  const existing = await HygieneArea.findOne({
    where: {
      station_id: parsedStationId,
      area_name: normalizedAreaName
    }
  });

  if (existing && !allowMerge) {
    throw createError(400, '该场站已存在同名责任区');
  }

  // 使用事务创建责任区和卫生点
  const t = await sequelize.transaction();

  try {
    let area = existing;
    if (!area) {
      area = await HygieneArea.create({
        station_id: parsedStationId,
        area_name: normalizedAreaName,
        points: hasAreaPoints ? parsedAreaPoints : 0
      }, { transaction: t });
    } else if (hasAreaPoints && parsedAreaPoints !== area.points) {
      await area.update({ points: parsedAreaPoints }, { transaction: t });
    }

    const pointMap = new Map();
    if (Array.isArray(points)) {
      points.forEach((point) => {
        const pointName = typeof point?.pointName === 'string'
          ? point.pointName.trim()
          : (typeof point?.point_name === 'string' ? point.point_name.trim() : '');
        const workRequirements = typeof point?.workRequirements === 'string'
          ? point.workRequirements.trim()
          : (typeof point?.work_requirements === 'string' ? point.work_requirements.trim() : '');
        if (!pointName) return;
        if (!pointMap.has(pointName) || workRequirements) {
          pointMap.set(pointName, workRequirements);
        }
      });
    }

    if (pointMap.size > 0) {
      const existingPoints = await HygienePoint.findAll({
        where: { hygiene_area_id: area.id },
        attributes: ['id', 'point_name', 'work_requirements'],
        transaction: t
      });

      const existingMap = new Map(
        existingPoints.map(point => [
          String(point.point_name ?? '').trim(),
          point
        ])
      );

      const createRows = [];
      const updateTasks = [];
      pointMap.forEach((workRequirements, pointName) => {
        const matched = existingMap.get(pointName);
        if (matched) {
          const currentRequirements = matched.work_requirements ?? '';
          if (workRequirements && workRequirements !== currentRequirements) {
            updateTasks.push(matched.update({ work_requirements: workRequirements }, { transaction: t }));
          }
          return;
        }
        createRows.push({
          hygiene_area_id: area.id,
          station_id: parsedStationId,
          point_name: pointName,
          work_requirements: workRequirements
        });
      });

      if (createRows.length > 0) {
        await HygienePoint.bulkCreate(createRows, { transaction: t });
      }
      if (updateTasks.length > 0) {
        await Promise.all(updateTasks);
      }
    }

    await t.commit();

    ctx.body = {
      code: 200,
      message: existing && allowMerge ? '责任区合并成功' : '责任区创建成功',
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
  const { stationId, areaName, areaPoints } = ctx.request.body;

  const area = await HygieneArea.findByPk(id);
  if (!area) {
    throw createError(404, '责任区不存在');
  }

  const previousStationId = area.station_id;
  let nextStationId = area.station_id;
  if (stationId !== undefined && stationId !== null && stationId !== '') {
    const parsedStationId = parseInt(stationId, 10);
    if (Number.isNaN(parsedStationId)) {
      throw createError(400, '场站无效');
    }
    nextStationId = parsedStationId;
  }

  const nextAreaName = areaName || area.area_name;

  // 检查是否有同名责任区
  if (nextAreaName && (nextAreaName !== area.area_name || nextStationId !== area.station_id)) {
    const existing = await HygieneArea.findOne({
      where: {
        station_id: nextStationId,
        area_name: nextAreaName,
        id: { [Op.ne]: id }
      }
    });

    if (existing) {
      throw createError(400, '该场站已存在同名责任区');
    }
  }

  const transaction = await sequelize.transaction();
  try {
    await area.update({
      station_id: nextStationId,
      area_name: nextAreaName,
      points: areaPoints !== undefined ? areaPoints : area.points
    }, { transaction });

    if (nextStationId !== previousStationId) {
      await HygienePositionArea.update({
        station_id: nextStationId
      }, {
        where: { hygiene_area_id: id },
        transaction
      });

      await HygienePoint.update({
        station_id: nextStationId
      }, {
        where: { hygiene_area_id: id },
        transaction
      });
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

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
          { model: HygienePoint, as: 'hygienePoints', attributes: ['id', 'point_name', 'work_requirements'] }
        ]
      },
      { model: Station, as: 'station', attributes: ['id', 'station_name'] }
    ],
    order: [['position_name', 'ASC'], ['created_at', 'ASC']]
  });

  const data = assignments.map((assignment) => ({
    id: assignment.id,
    stationId: assignment.station_id,
    stationName: assignment.station?.station_name ?? '',
    positionName: assignment.position_name,
    areaId: assignment.area?.id ?? null,
    areaName: assignment.area?.area_name ?? '',
    areaPoints: assignment.area?.points ?? 0,
    points: (assignment.area?.hygienePoints ?? []).map((point) => ({
      id: point.id,
      pointName: point.point_name,
      workRequirements: point.work_requirements
    }))
  }));

  ctx.body = {
    code: 200,
    message: 'success',
    data
  };
};

/**
 * 创建岗位责任区关联
 * POST /api/hygiene-position-areas
 */
export const createHygienePositionArea = async (ctx) => {
  const { stationId, positionName, hygieneAreaId, areaId } = ctx.request.body;
  const resolvedAreaId = (hygieneAreaId !== undefined && hygieneAreaId !== null && hygieneAreaId !== '')
    ? hygieneAreaId
    : areaId;

  if (!stationId || !positionName || !resolvedAreaId) {
    throw createError(400, '场站、岗位和责任区不能为空');
  }

  // 检查责任区是否存在且属于该场站
  const area = await HygieneArea.findOne({
    where: {
      id: resolvedAreaId,
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
      hygiene_area_id: resolvedAreaId
    }
  });

  if (existing) {
    throw createError(400, '该岗位已关联此责任区');
  }

  const assignment = await HygienePositionArea.create({
    station_id: stationId,
    position_name: positionName,
    hygiene_area_id: resolvedAreaId
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
            as: 'hygienePoints',
            attributes: ['id', 'point_name', 'work_requirements'],
            order: [['created_at', 'ASC']]
          }
        ]
      }
    ],
    order: [['created_at', 'ASC']]
  });

  // 提取责任区和卫生点数据
  const areas = assignments.map((assignment) => ({
    id: assignment.area?.id ?? null,
    stationId: assignment.station_id,
    areaName: assignment.area?.area_name ?? '',
    areaPoints: assignment.area?.points ?? 0,
    points: (assignment.area?.hygienePoints ?? []).map((point) => ({
      id: point.id,
      pointName: point.point_name,
      workRequirements: point.work_requirements
    }))
  }));

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
