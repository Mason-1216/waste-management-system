import { registerScheduleReadRoutes } from './read_routes.js';
import { registerScheduleWriteRoutes } from './write_routes.js';

export const registerScheduleRoutes = (router) => {
  registerScheduleReadRoutes(router);
  registerScheduleWriteRoutes(router);
};
