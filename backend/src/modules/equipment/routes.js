import { registerEquipmentResourceRoutes } from './equipment_routes.js';
import { registerPriceRoutes } from './price_routes.js';

export const registerEquipmentRoutes = (router) => {
  registerEquipmentResourceRoutes(router);
  registerPriceRoutes(router);
};
