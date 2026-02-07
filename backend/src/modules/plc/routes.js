import plcController from './controllers/plcController.js';
import plcMonitorController from './controllers/plcMonitorController.js';
import { checkRole } from '../../middlewares/permission.js';
import { upload } from '../../config/upload.js';

export const registerPlcPublicRoutes = (router) => {
  router.post('/plc/upload', plcController.uploadPlcRecord);
};

export const registerPlcRoutes = (router) => {
  router.get('/plc/records', plcController.getPlcRecords);
  router.post('/plc/files/scan', plcController.scanPlcFiles);

  router.get('/plc-monitor/realtime', plcMonitorController.getRealtimeData);
  router.get('/plc-monitor/history', plcMonitorController.getHistoryData);
  router.get('/plc-monitor/configs', plcMonitorController.getConfigs);
  router.post(
    '/plc-monitor/configs',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    plcMonitorController.createConfig
  );
  router.put(
    '/plc-monitor/configs/:id',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    plcMonitorController.updateConfig
  );
  router.delete(
    '/plc-monitor/configs/:id',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    plcMonitorController.deleteConfig
  );
  router.post(
    '/plc-monitor/configs/import',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    upload.single('file'),
    plcMonitorController.importConfigs
  );
  router.get(
    '/plc-monitor/configs/template',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    plcMonitorController.downloadConfigTemplate
  );
  router.get('/plc-monitor/categories', plcMonitorController.getCategories);
  router.post(
    '/plc-monitor/categories',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    plcMonitorController.createCategory
  );
  router.put(
    '/plc-monitor/categories/:id',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    plcMonitorController.updateCategory
  );
  router.delete(
    '/plc-monitor/categories/:id',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    plcMonitorController.deleteCategory
  );
  router.get('/plc-monitor/reports/export', plcMonitorController.exportReport);
  router.get('/plc-monitor/reports/stats', plcMonitorController.getReportStats);
  router.get('/plc-monitor/reports/trends', plcMonitorController.getReportTrends);
  router.get('/plc-monitor/reports/cumulative', plcMonitorController.getCumulativeReport);
  router.get('/plc-monitor/reports/fluctuating', plcMonitorController.getFluctuatingReport);
  router.get('/plc-monitor/service-status', plcMonitorController.checkPlcServiceStatus);
  router.post(
    '/plc-monitor/write',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    plcMonitorController.writeConfigValue
  );
  router.get('/plc-monitor/history/summary', plcMonitorController.getHistorySummary);
  router.get('/plc-monitor/history/template', plcMonitorController.downloadHistoryTemplate);
  router.post(
    '/plc-monitor/history/import',
    checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']),
    upload.single('file'),
    plcMonitorController.importHistoryData
  );
};
