#!/usr/bin/env node
import { HazardRootCause } from '../backend/src/models/index.js';
import sequelize from '../backend/src/config/database.js';

const decodeMojibake = (value) => {
  if (!value) return value;
  const text = String(value);
  if (/[\u4E00-\u9FFF]/.test(text)) return text;
  if (/[\u00C0-\u00FF]/.test(text)) {
    try {
      return Buffer.from(text, 'latin1').toString('utf8');
    } catch {
      return text;
    }
  }
  return text;
};

const main = async () => {
  try {
    await sequelize.authenticate();
    const causes = await HazardRootCause.findAll({
      attributes: ['id', 'cause_name']
    });

    let updated = 0;
    for (const cause of causes) {
      const original = cause.cause_name || '';
      const decoded = decodeMojibake(original);
      if (decoded && decoded !== original) {
        await cause.update({ cause_name: decoded });
        updated += 1;
        // eslint-disable-next-line no-console
        console.log(`updated ${cause.id}: ${original} -> ${decoded}`);
      }
    }

    // eslint-disable-next-line no-console
    console.log(`done: ${updated} row(s) updated`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

main();
