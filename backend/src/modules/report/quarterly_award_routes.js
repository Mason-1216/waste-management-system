import * as quarterlyAwardService from './services/quarterlyAwardService.js';
import { checkRole } from '../../middlewares/permission.js';

const managerRoles = ['station_manager', 'department_manager', 'deputy_manager', 'senior_management'];

export const registerQuarterlyAwardRoutes = (router) => {
  router.get('/reports/quarterly-award-groups', quarterlyAwardService.getGroups);
  router.get('/reports/quarterly-award-groups/previous', quarterlyAwardService.getPreviousGroups);
  router.post('/reports/quarterly-award-groups', checkRole(managerRoles), quarterlyAwardService.createGroup);
  router.put('/reports/quarterly-award-groups/:id', checkRole(managerRoles), quarterlyAwardService.updateGroup);
  router.delete('/reports/quarterly-award-groups/:id', checkRole(managerRoles), quarterlyAwardService.deleteGroup);

  router.get('/reports/quarterly-points-summary', quarterlyAwardService.getQuarterlyPointsSummary);
  router.post('/reports/quarterly-award-calculate', checkRole(managerRoles), quarterlyAwardService.calculateAndSave);

  router.get('/reports/quarterly-award-history', quarterlyAwardService.getHistory);
  router.get('/reports/quarterly-award-visual', quarterlyAwardService.getVisualData);
};

