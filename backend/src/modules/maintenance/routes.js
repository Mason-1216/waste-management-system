import { registerMaintenancePlanRoutes } from './plan_routes.js';
import { registerMaintenanceRecordRoutes } from './record_routes.js';
import { registerFaultReportRoutes } from './fault_routes.js';
import { registerRepairRecordRoutes } from './repair_routes.js';
import { registerMaterialRequisitionRoutes } from './requisition_routes.js';
import { registerMaintenancePlanLibraryRoutes } from './library_routes.js';
import { registerMaintenanceAssignmentRoutes } from './assignment_routes.js';
import { registerMaintenancePositionRoutes } from './position_routes.js';
import { registerRepairTaskLibraryRoutes } from './repair_task_library_routes.js';

export const registerMaintenanceRoutes = (router) => {
  registerMaintenancePlanRoutes(router);
  registerMaintenanceRecordRoutes(router);
  registerFaultReportRoutes(router);
  registerRepairRecordRoutes(router);
  registerMaterialRequisitionRoutes(router);
  registerMaintenancePlanLibraryRoutes(router);
  registerMaintenanceAssignmentRoutes(router);
  registerMaintenancePositionRoutes(router);
  registerRepairTaskLibraryRoutes(router);
};
