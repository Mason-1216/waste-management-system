#!/usr/bin/env node
import { HazardRootCause } from '../backend/src/models/index.js';
import sequelize from '../backend/src/config/database.js';

const ROOT_CAUSES = [
  '人的不安全行为',
  '物的不安全状态',
  '职责不清',
  '人岗匹配',
  '工作流程',
  '工作标准',
  '工作执行',
  '设计缺陷',
  '劳动防护用品配备不足',
  '安全设施建设投入不足'
];

const main = async () => {
  try {
    await sequelize.authenticate();
    await HazardRootCause.destroy({ where: {} });
    await HazardRootCause.bulkCreate(
      ROOT_CAUSES.map((name, index) => ({
        cause_name: name,
        sort_order: index + 1,
        is_system: 1,
        status: 1
      }))
    );
    // eslint-disable-next-line no-console
    console.log(`done: inserted ${ROOT_CAUSES.length} root causes`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

main();
