import { Op } from 'sequelize';
import { PlcScaleRecord } from '../../../models/index.js';
import { generateRecordCode, getPagination, formatPaginationResponse } from '../../../utils/helpers.js';
import { scanPlcUploadDir } from '../services/plcIngestion.js';
import { validateQuery } from '../../core/validators/validate.js';
import { plcRecordsQuerySchema } from '../validators/schemas.js';

const normalizePayload = (payload) => {
  const raw = payload || {};
  return {
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
    source: 'http',
    raw_payload: JSON.stringify(raw)
  };
};

export const uploadPlcRecord = async (ctx) => {
  const payload = ctx.request.body || {};
  const record = normalizePayload(payload);
  const created = await PlcScaleRecord.create(record);

  ctx.body = {
    code: 200,
    message: 'success',
    data: { id: created.id }
  };
};

export const scanPlcFiles = async (ctx) => {
  const result = await scanPlcUploadDir();
  ctx.body = {
    code: 200,
    message: 'success',
    data: result
  };
};

export const getPlcRecords = async (ctx) => {
  await validateQuery(ctx, plcRecordsQuerySchema);
  const { page, pageSize, offset, limit } = getPagination(ctx.query);
  const { stationId, scaleId, vehicleNo, startDate, endDate } = ctx.query;

  const where = {};
  if (stationId) where.station_id = stationId;
  if (scaleId) where.scale_id = scaleId;
  if (vehicleNo) where.vehicle_no = vehicleNo;
  if (startDate && endDate) where.weight_time = { [Op.between]: [startDate, endDate] };

  const result = await PlcScaleRecord.findAndCountAll({
    where,
    offset,
    limit,
    order: [['weight_time', 'DESC']]
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: formatPaginationResponse(result, page, pageSize)
  };
};

export default {
  uploadPlcRecord,
  scanPlcFiles,
  getPlcRecords
};
