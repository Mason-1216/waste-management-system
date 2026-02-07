import approvalController from './controllers/approvalController.js';
import { checkRole } from '../../middlewares/permission.js';

export const registerApprovalActionRoutes = (router) => {
  router.get('/approval/pending', approvalController.getPendingApprovals);
  router.get('/approvals', checkRole(['station_manager', 'department_manager', 'admin']), approvalController.getApprovals);
  router.get('/approvals/pending', approvalController.getPendingApprovals);
  router.put(
    '/approvals/batch-approve',
    checkRole(['station_manager', 'department_manager', 'admin']),
    approvalController.batchApproveApprovals
  );
  router.put(
    '/approvals/batch-reject',
    checkRole(['station_manager', 'department_manager', 'admin']),
    approvalController.batchRejectApprovals
  );
  router.put(
    '/approvals/:id/approve',
    checkRole(['station_manager', 'department_manager', 'admin']),
    approvalController.approveApproval
  );
  router.put(
    '/approvals/:id/reject',
    checkRole(['station_manager', 'department_manager', 'admin']),
    approvalController.rejectApproval
  );
  router.post(
    '/approval/task-hours/:id',
    checkRole(['station_manager', 'department_manager']),
    approvalController.approveTaskHours
  );
  router.post(
    '/approval/task-hours/batch',
    checkRole(['station_manager', 'department_manager']),
    approvalController.batchApproveTaskHours
  );
  router.post(
    '/approval/maintenance/:id',
    checkRole(['station_manager', 'deputy_manager', 'department_manager']),
    approvalController.approveMaintenance
  );
  router.post(
    '/approval/repair/:id',
    checkRole(['station_manager', 'deputy_manager', 'department_manager']),
    approvalController.approveRepair
  );
  router.post(
    '/approval/requisition/:id',
    checkRole(['station_manager', 'department_manager']),
    approvalController.approveRequisition
  );
  router.post(
    '/approval/rectification/:id',
    checkRole(['safety_inspector', 'department_manager']),
    approvalController.approveRectification
  );
};
