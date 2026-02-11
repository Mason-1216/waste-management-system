import { Op } from 'sequelize';
import {
  ManualPointsEntry,
  PositionJob,
  PositionWorkLog,
  RepairRecord,
  RepairTaskLibrary,
  TemporaryTaskLibrary,
  sequelize
} from '../src/models/index.js';

const DEFAULT_CATEGORY = 'Ⅰ类';

const updateAllRows = async ({ model, field }) => {
  const [affected] = await model.update(
    { [field]: DEFAULT_CATEGORY },
    { where: {} }
  );
  console.log(`[task_category] ${model.name}.${field}: ${affected}`);
};

const normalizeRepairTasks = (value) => {
  const list = Array.isArray(value) ? value : [];
  return list
    .filter(item => item && typeof item === 'object')
    .map(item => ({
      ...item,
      task_category: DEFAULT_CATEGORY,
      taskCategory: DEFAULT_CATEGORY
    }));
};

const migrateRepairRecordTasks = async () => {
  let lastId = 0;
  let updated = 0;
  const limit = 200;

  // Update in batches to avoid loading too many JSON rows into memory.
  for (;;) {
    const batch = await RepairRecord.findAll({
      where: {
        id: { [Op.gt]: lastId },
        repair_tasks: { [Op.not]: null }
      },
      order: [['id', 'ASC']],
      limit,
      attributes: ['id', 'repair_tasks']
    });

    if (!batch.length) break;

    for (const record of batch) {
      const tasks = normalizeRepairTasks(record.repair_tasks);
      if (tasks.length === 0) {
        lastId = record.id;
        continue;
      }
      await record.update({ repair_tasks: tasks });
      updated += 1;
      lastId = record.id;
    }
  }

  console.log(`[task_category] RepairRecord.repair_tasks updated: ${updated}`);
};

const main = async () => {
  await sequelize.authenticate();

  await updateAllRows({ model: PositionJob, field: 'task_category' });
  await updateAllRows({ model: TemporaryTaskLibrary, field: 'task_category' });
  await updateAllRows({ model: RepairTaskLibrary, field: 'task_category' });
  await updateAllRows({ model: PositionWorkLog, field: 'task_category' });
  await updateAllRows({ model: ManualPointsEntry, field: 'task_category' });

  await migrateRepairRecordTasks();

  await sequelize.close();
};

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

