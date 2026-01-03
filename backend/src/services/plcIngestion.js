import fs from 'fs';
import path from 'path';
import { PlcScaleRecord, PlcFileImport } from '../models/index.js';
import { generateRecordCode } from '../utils/helpers.js';

const getUploadDir = () => {
  return process.env.PLC_FTP_DIR || path.join(process.cwd(), 'plc_uploads');
};

const ensureDirs = () => {
  const baseDir = getUploadDir();
  const processedDir = path.join(baseDir, 'processed');
  const errorDir = path.join(baseDir, 'error');
  [baseDir, processedDir, errorDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
  return { baseDir, processedDir, errorDir };
};

const parseCsv = (content) => {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) return [];
  const header = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const cols = line.split(',');
    const row = {};
    header.forEach((key, idx) => {
      row[key] = cols[idx] !== undefined ? cols[idx].trim() : '';
    });
    return row;
  });
};

const normalizeRecord = (raw, fileName, source) => {
  const record = {
    record_code: generateRecordCode('PLC'),
    scale_id: raw.scale_id || raw.scaleId || raw.device_id || raw.deviceId || null,
    station_id: raw.station_id || raw.stationId || null,
    weight_time: raw.weight_time || raw.weightTime || raw.time || new Date(),
    vehicle_no: raw.vehicle_no || raw.vehicleNo || raw.car_no || raw.carNo || null,
    material: raw.material || raw.category || null,
    weight_gross: raw.weight_gross || raw.gross || raw.gross_weight || null,
    weight_tare: raw.weight_tare || raw.tare || raw.tare_weight || null,
    weight_net: raw.weight_net || raw.net || raw.net_weight || null,
    operator_name: raw.operator || raw.operator_name || raw.operatorName || null,
    status: raw.status || null,
    source,
    file_name: fileName || null,
    raw_payload: JSON.stringify(raw)
  };
  return record;
};

const ingestFile = async (filePath) => {
  const { processedDir, errorDir } = ensureDirs();
  const fileName = path.basename(filePath);
  const stat = fs.statSync(filePath);
  const fileKey = `${fileName}:${stat.size}:${stat.mtimeMs}`;

  const existing = await PlcFileImport.findOne({ where: { file_key: fileKey } });
  if (existing) {
    return { skipped: true };
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    let records = [];
    if (fileName.endsWith('.json')) {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) records = parsed;
      else if (Array.isArray(parsed.records)) records = parsed.records;
      else records = [parsed];
    } else {
      records = parseCsv(content);
    }

    const rows = records.map(item => normalizeRecord(item, fileName, 'file'));
    if (rows.length > 0) {
      await PlcScaleRecord.bulkCreate(rows);
    }
    await PlcFileImport.create({ file_name: fileName, file_key: fileKey, status: 'processed' });

    fs.renameSync(filePath, path.join(processedDir, fileName));
    return { processed: rows.length };
  } catch (error) {
    await PlcFileImport.create({
      file_name: fileName,
      file_key: fileKey,
      status: 'failed',
      error_message: error.message
    });
    fs.renameSync(filePath, path.join(errorDir, fileName));
    return { error: error.message };
  }
};

export const scanPlcUploadDir = async () => {
  const { baseDir } = ensureDirs();
  const files = fs.readdirSync(baseDir)
    .filter(name => /\.(csv|txt|json)$/i.test(name));

  let processed = 0;
  for (const name of files) {
    const result = await ingestFile(path.join(baseDir, name));
    if (result.processed) processed += result.processed;
  }
  return { processed };
};

export const startPlcWatcher = () => {
  const { baseDir } = ensureDirs();
  setInterval(() => {
    scanPlcUploadDir().catch(() => {});
  }, 30000);

  return baseDir;
};
