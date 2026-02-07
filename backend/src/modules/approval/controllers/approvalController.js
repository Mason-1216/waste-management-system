import * as approvalService from '../services/approvalService.js';

export const getPendingApprovals = approvalService.getPendingApprovals;
export const getApprovals = approvalService.getApprovals;
export const approveApproval = approvalService.approveApproval;
export const rejectApproval = approvalService.rejectApproval;
export const batchApproveApprovals = approvalService.batchApproveApprovals;
export const batchRejectApprovals = approvalService.batchRejectApprovals;
export const approveTaskHours = approvalService.approveTaskHours;
export const batchApproveTaskHours = approvalService.batchApproveTaskHours;
export const approveMaintenance = approvalService.approveMaintenance;
export const approveRepair = approvalService.approveRepair;
export const approveRequisition = approvalService.approveRequisition;
export const approveRectification = approvalService.approveRectification;

export default {
  getPendingApprovals,
  getApprovals,
  approveApproval,
  rejectApproval,
  batchApproveApprovals,
  batchRejectApprovals,
  approveTaskHours,
  batchApproveTaskHours,
  approveMaintenance,
  approveRepair,
  approveRequisition,
  approveRectification
};
