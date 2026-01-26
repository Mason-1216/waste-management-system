import { registerAuthPublicRoutes, registerAuthRoutes } from './auth_routes.js';
import { registerUserRoutes } from './user_routes.js';
import { registerAccessRoutes } from './access_routes.js';
import { registerOrgRoutes } from './org_routes.js';

export const registerCorePublicRoutes = (router) => {
  registerAuthPublicRoutes(router);
};

export const registerCoreRoutes = (router) => {
  registerAuthRoutes(router);
  registerUserRoutes(router);
  registerAccessRoutes(router);
  registerOrgRoutes(router);
};
