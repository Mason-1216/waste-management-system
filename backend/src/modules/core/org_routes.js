import departmentController from '../../controllers/departmentController.js';
import stationController from '../../controllers/stationController.js';
import companyController from '../../controllers/companyController.js';
import { checkRole } from '../../middlewares/permission.js';

export const registerOrgRoutes = (router) => {
  router.get('/departments', checkRole(['admin']), departmentController.getDepartments);
  router.post('/departments', checkRole(['admin']), departmentController.createDepartment);
  router.put('/departments/:id', checkRole(['admin']), departmentController.updateDepartment);
  router.delete('/departments/:id', checkRole(['admin']), departmentController.deleteDepartment);

  router.get('/companies', checkRole(['admin']), companyController.getCompanies);
  router.get('/companies/all', companyController.getAllCompanies);
  router.post('/companies', checkRole(['admin']), companyController.createCompany);
  router.put('/companies/:id', checkRole(['admin']), companyController.updateCompany);
  router.delete('/companies/:id', checkRole(['admin']), companyController.deleteCompany);

  router.get('/stations', stationController.getStations);
  router.get('/stations/all', stationController.getAllStations);
  router.get('/stations/:id', stationController.getStationById);
  router.get('/stations/:id/users', stationController.getStationUsers);
  router.post('/stations', checkRole(['admin', 'department_manager']), stationController.createStation);
  router.put('/stations/:id', checkRole(['admin', 'station_manager']), stationController.updateStation);
  router.delete('/stations/:id', checkRole(['admin']), stationController.deleteStation);
};
