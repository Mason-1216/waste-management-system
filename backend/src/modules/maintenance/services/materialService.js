import { MaterialRequisition, RepairRecord, User } from '../../../models/index.js';
import { formatPaginationResponse, generateRecordCode, getPagination } from '../../../utils/helpers.js';

export const createMaterialRequisition = async ({ body, user }) => {
  const { repairRecordId, materialList, stationId } = body;

  const totalAmount = materialList.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  const requisition = await MaterialRequisition.create({
    requisition_code: generateRecordCode('MQ'),
    repair_record_id: repairRecordId,
    applicant_id: user.id,
    applicant_name: user.realName,
    material_list: materialList,
    total_amount: totalAmount,
    station_id: stationId,
    status: 'pending'
  });

  return { id: requisition.id };
};

export const getMaterialRequisitions = async ({ query }) => {
  const { page, pageSize, offset, limit } = getPagination(query);
  const { status } = query;

  const where = {};
  if (status) where.status = status;

  const result = await MaterialRequisition.findAndCountAll({
    where,
    include: [
      { model: User, as: 'applicant', attributes: ['id', 'real_name'] },
      { model: RepairRecord, as: 'repairRecord' }
    ],
    offset,
    limit,
    order: [['created_at', 'DESC']]
  });

  return formatPaginationResponse(result, page, pageSize);
};
