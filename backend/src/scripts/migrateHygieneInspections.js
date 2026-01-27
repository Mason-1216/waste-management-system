import sequelize from '../config/database.js';
import { SafetySelfInspection, SafetyOtherInspection, HygieneArea, HygienePoint } from '../models/index.js';

const parseItems = (items) => {
  if (!items) return [];
  if (Array.isArray(items)) return items;
  if (typeof items === 'string') {
    try {
      const parsed = JSON.parse(items);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const buildMaps = async () => {
  const areas = await HygieneArea.findAll({
    attributes: ['id', 'station_id', 'area_name', 'points']
  });
  const areaMap = new Map(areas.map(area => [area.id, area]));
  const areaByStationName = new Map(
    areas.map(area => [`${area.station_id}:${area.area_name}`, area])
  );

  const points = await HygienePoint.findAll({
    attributes: ['id', 'hygiene_area_id', 'point_name', 'work_requirements']
  });
  const pointMap = new Map(points.map(point => [point.id, point]));
  const pointByAreaName = new Map(
    points.map(point => [`${point.hygiene_area_id}:${point.point_name}`, point])
  );

  return {
    areaMap,
    areaByStationName,
    pointMap,
    pointByAreaName
  };
};

const normalizeHygieneItems = (record, maps) => {
  const items = parseItems(record.inspection_items);
  if (!items.length) return null;

  let shouldPersist = false;
  const nextItems = items.map(item => {
    const rawWorkTypeId = item.workTypeId ?? item.work_type_id;
    const rawWorkTypeName = item.workTypeName ?? item.work_type_name ?? item.areaName ?? item.area_name;
    const rawItemId = item.itemId ?? item.item_id;
    const rawItemName = item.itemName ?? item.item_name ?? item.pointName ?? item.point_name;

    let workTypeId = rawWorkTypeId;
    if ((workTypeId === undefined || workTypeId === null || workTypeId === '') && rawWorkTypeName && record.station_id) {
      const matchedArea = maps.areaByStationName.get(`${record.station_id}:${rawWorkTypeName}`);
      if (matchedArea) {
        workTypeId = matchedArea.id;
        shouldPersist = true;
      }
    }

    let itemId = rawItemId;
    if ((itemId === undefined || itemId === null || itemId === '') && workTypeId && rawItemName) {
      const matchedPoint = maps.pointByAreaName.get(`${workTypeId}:${rawItemName}`);
      if (matchedPoint) {
        itemId = matchedPoint.id;
        shouldPersist = true;
      }
    }

    const refPoint = itemId !== undefined && itemId !== null ? maps.pointMap.get(Number(itemId)) : null;
    const refArea = workTypeId !== undefined && workTypeId !== null ? maps.areaMap.get(Number(workTypeId)) : null;

    return {
      ...item,
      itemId: itemId ?? item.itemId ?? item.item_id,
      workTypeId: workTypeId ?? item.workTypeId ?? item.work_type_id,
      itemName: item.itemName ?? item.item_name ?? (refPoint?.point_name ?? rawItemName ?? ''),
      itemStandard: item.itemStandard ?? item.item_standard ?? (refPoint?.work_requirements ?? item.workRequirements ?? item.work_requirements ?? ''),
      workTypeName: item.workTypeName ?? item.work_type_name ?? (refArea?.area_name ?? rawWorkTypeName ?? '')
    };
  });

  const workTypeIds = Array.from(new Set(
    nextItems
      .map(item => item.workTypeId)
      .filter(id => id !== undefined && id !== null && id !== '')
      .map(id => Number(id))
      .filter(id => !Number.isNaN(id))
  ));

  const originalWorkTypeIds = Array.isArray(record.work_type_ids) ? record.work_type_ids : [];
  if (workTypeIds.join(',') !== originalWorkTypeIds.join(',')) {
    shouldPersist = true;
  }

  if (!shouldPersist) return null;

  return {
    nextItems,
    workTypeIds
  };
};

const migrateModel = async (Model, maps) => {
  const records = await Model.findAll({ where: { inspection_type: 'hygiene' } });
  let updated = 0;

  for (const record of records) {
    const normalized = normalizeHygieneItems(record, maps);
    if (!normalized) continue;
    await record.update({
      inspection_items: normalized.nextItems,
      work_type_ids: normalized.workTypeIds
    });
    updated += 1;
  }

  return { total: records.length, updated };
};

const main = async () => {
  try {
    const maps = await buildMaps();
    const selfResult = await migrateModel(SafetySelfInspection, maps);
    const otherResult = await migrateModel(SafetyOtherInspection, maps);
    // eslint-disable-next-line no-console
    console.log('migrate hygiene inspections done', { selfResult, otherResult });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('migrate hygiene inspections failed', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

main();
