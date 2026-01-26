import { registerSelfInspectionRoutes } from './self_inspection_routes.js';
import { registerOtherInspectionRoutes } from './other_inspection_routes.js';
import { registerHazardInspectionRoutes } from './hazard_inspection_routes.js';
import { registerSafetyRectificationRoutes } from './rectification_routes.js';
import { registerHygieneRoutes } from './hygiene_routes.js';
import { registerSafetyConfigRoutes } from './safety_config_routes.js';
import { registerHazardConfigRoutes } from './hazard_config_routes.js';

export const registerInspectionRoutes = (router) => {
  registerSelfInspectionRoutes(router);
  registerOtherInspectionRoutes(router);
  registerHazardInspectionRoutes(router);
  registerSafetyRectificationRoutes(router);
  registerHygieneRoutes(router);
  registerSafetyConfigRoutes(router);
  registerHazardConfigRoutes(router);
};
