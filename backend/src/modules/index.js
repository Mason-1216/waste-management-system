import { registerCorePublicRoutes, registerCoreRoutes } from './core/routes.js';
import { registerScheduleRoutes } from './schedule/routes.js';
import { registerTaskRoutes } from './task/routes.js';
import { registerInspectionRoutes } from './inspection/routes.js';
import { registerMaintenanceRoutes } from './maintenance/routes.js';
import { registerEquipmentRoutes } from './equipment/routes.js';
import { registerApprovalRoutes } from './approval/routes.js';
import { registerReportRoutes } from './report/routes.js';
import { registerPlcPublicRoutes, registerPlcRoutes } from './plc/routes.js';
import { registerSupportRoutes } from './support/routes.js';

export const publicModules = [
  registerCorePublicRoutes,
  registerPlcPublicRoutes
];

export const privateModules = [
  registerCoreRoutes,
  registerScheduleRoutes,
  registerTaskRoutes,
  registerInspectionRoutes,
  registerMaintenanceRoutes,
  registerEquipmentRoutes,
  registerApprovalRoutes,
  registerReportRoutes,
  registerPlcRoutes,
  registerSupportRoutes
];
