import Router from 'koa-router';
import { authMiddleware } from '../middlewares/auth.js';
import { checkRole, checkDataPermission, checkPriceAdmin } from '../middlewares/permission.js';
import { upload, uploadToDisk } from '../config/upload.js';

// 导入控制器
import authController from '../controllers/authController.js';
import userController from '../controllers/userController.js';
import departmentController from '../controllers/departmentController.js';
import stationController from '../controllers/stationController.js';
import scheduleController from '../controllers/scheduleController.js';
import taskController from '../controllers/taskController.js';
import temporaryTaskLibraryController from '../controllers/temporaryTaskLibraryController.js';
import maintenanceController from '../controllers/maintenanceController.js';
import inspectionController from '../controllers/inspectionController.js';
import inboundOutboundController from '../controllers/inboundOutboundController.js';
import approvalController from '../controllers/approvalController.js';
import notificationController from '../controllers/notificationController.js';
import feedbackController from '../controllers/feedbackController.js';
import priceController from '../controllers/priceController.js';
import reportController from '../controllers/reportController.js';
import uploadController from '../controllers/uploadController.js';
import positionJobController from '../controllers/positionJobController.js';
import positionWorkLogController from '../controllers/positionWorkLogController.js';
import hygieneManagementController from '../controllers/hygieneManagementController.js';
import equipmentController from '../controllers/equipmentController.js';
import safetyCheckController from '../controllers/safetyCheckController.js';
import hazardConfigController from '../controllers/hazardConfigController.js';
import companyController from '../controllers/companyController.js';
import maintenancePlanLibraryController from '../controllers/maintenancePlanLibraryController.js';
import maintenancePositionController from '../controllers/maintenancePositionController.js';
import roleController from '../controllers/roleController.js';
import permissionController from '../controllers/permissionController.js';
import plcController from '../controllers/plcController.js';

const router = new Router({ prefix: '/api' });

// ============================================
// 认证路由（无需登录）
// ============================================
router.post('/auth/login', authController.login);
router.post('/plc/upload', plcController.uploadPlcRecord);

// ============================================
// 以下路由需要登录
// ============================================
router.use(authMiddleware);
router.use(checkDataPermission);

// 认证相关
router.post('/auth/logout', authController.logout);
router.put('/auth/change-password', authController.changePassword);
router.get('/auth/me', authController.getCurrentUser);
router.put('/auth/context', authController.updateContext);

// ============================================
// 用户管理
// ============================================
router.get('/users', checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager', 'safety_inspector']), userController.getUsers);
router.get('/users/:id', userController.getUserById);
router.post('/users', checkRole(['admin']), userController.createUser);
router.post('/users/batch-import', checkRole(['admin']), userController.batchImportUsers);
router.put('/users/:id', checkRole(['admin']), userController.updateUser);
router.delete('/users/:id', checkRole(['admin']), userController.deleteUser);
router.put('/users/:id/reset-password', checkRole(['admin']), userController.resetPassword);
router.post('/users/:id/stations', checkRole(['admin']), userController.bindUserStations);

// ============================================
// 角色与权限管理
// ============================================
router.get('/roles', checkRole(['admin']), roleController.getRoles);
router.get('/roles/:id/permissions', checkRole(['admin']), roleController.getRolePermissions);
router.post('/roles', checkRole(['admin']), roleController.createRole);
router.put('/roles/:id', checkRole(['admin']), roleController.updateRole);
router.delete('/roles/:id', checkRole(['admin']), roleController.deleteRole);
router.get('/permissions', checkRole(['admin']), permissionController.getPermissions);

// ============================================
// 部门管理
// ============================================
router.get('/departments', checkRole(['admin']), departmentController.getDepartments);
router.post('/departments', checkRole(['admin']), departmentController.createDepartment);
router.put('/departments/:id', checkRole(['admin']), departmentController.updateDepartment);
router.delete('/departments/:id', checkRole(['admin']), departmentController.deleteDepartment);

// ============================================
// 公司管理
// ============================================
router.get('/companies', checkRole(['admin']), companyController.getCompanies);
router.get('/companies/all', companyController.getAllCompanies);
router.post('/companies', checkRole(['admin']), companyController.createCompany);
router.put('/companies/:id', checkRole(['admin']), companyController.updateCompany);
router.delete('/companies/:id', checkRole(['admin']), companyController.deleteCompany);

// ============================================
// 场站管理
// ============================================
router.get('/stations', stationController.getStations);
router.get('/stations/all', stationController.getAllStations);
router.get('/stations/:id', stationController.getStationById);
router.get('/stations/:id/users', stationController.getStationUsers);
router.post('/stations', checkRole(['admin', 'department_manager']), stationController.createStation);
router.put('/stations/:id', checkRole(['admin', 'station_manager']), stationController.updateStation);
router.delete('/stations/:id', checkRole(['admin']), stationController.deleteStation);

// ============================================
// 排班管理
// ============================================
router.get('/schedules', scheduleController.getSchedules);
router.get('/schedules/my', scheduleController.getMySchedule);
router.get('/schedules/export-my', scheduleController.exportMySchedule);
router.get('/schedules/today', scheduleController.getTodayScheduledUsers);
router.post('/schedules', checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']), scheduleController.saveSchedule);
router.post('/schedules/batch', checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']), scheduleController.batchSaveSchedules);
router.delete('/schedules/:id', checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']), scheduleController.deleteSchedule);
router.post('/schedules/batch-delete', checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']), scheduleController.batchDeleteSchedules);

// ============================================
// 任务工时管理
// ============================================
// 任务配置
router.get('/task-configs', taskController.getTaskConfigs);
router.post('/task-configs', checkRole(['admin', 'station_manager']), taskController.createTaskConfig);
router.put('/task-configs/:id', checkRole(['admin', 'station_manager']), taskController.updateTaskConfig);
router.delete('/task-configs/:id', checkRole(['admin']), taskController.deleteTaskConfig);

// 岗位固定任务
router.get('/position-tasks', taskController.getPositionTasks);
router.post('/position-tasks', checkRole(['admin', 'station_manager']), taskController.savePositionTasks);

// 每日任务记录
router.get('/daily-tasks', taskController.getDailyTasks);
router.get('/daily-tasks/my', taskController.getMyDailyTasks);
router.get('/daily-tasks/summary', taskController.getDailyTaskSummary);
router.post('/daily-tasks/submit', taskController.submitDailyTasks);

// 临时任务
router.get('/temporary-tasks', taskController.getTemporaryTasks);
router.post('/temporary-tasks', taskController.createTemporaryTask);
router.put('/temporary-tasks/:id', taskController.updateTemporaryTask);
router.put('/temporary-tasks/:id/start', taskController.startTemporaryTask);
router.put('/temporary-tasks/:id/complete', taskController.completeTemporaryTask);
router.delete('/temporary-tasks/:id', taskController.deleteTemporaryTask);

// 临时工作任务库
router.get('/temporary-task-library', temporaryTaskLibraryController.getTemporaryTaskLibrary);
router.post('/temporary-task-library', checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']), temporaryTaskLibraryController.createTemporaryTaskLibrary);
router.post('/temporary-task-library/batch-import', checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']), temporaryTaskLibraryController.batchImportTemporaryTaskLibrary);
router.put('/temporary-task-library/:id', checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']), temporaryTaskLibraryController.updateTemporaryTaskLibrary);
router.delete('/temporary-task-library/:id', checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']), temporaryTaskLibraryController.deleteTemporaryTaskLibrary);

// ============================================
// 保养维修管理
// ============================================
// 保养计划
router.get('/maintenance-plans', maintenanceController.getMaintenancePlans);
router.post('/maintenance-plans', checkRole(['admin', 'station_manager']), maintenanceController.createMaintenancePlan);
router.put('/maintenance-plans/:id', checkRole(['admin', 'station_manager']), maintenanceController.updateMaintenancePlan);
router.delete('/maintenance-plans/:id', checkRole(['admin']), maintenanceController.deleteMaintenancePlan);

// 保养记录
router.get('/maintenance-records', maintenanceController.getMaintenanceRecords);
router.post('/maintenance-records', maintenanceController.createMaintenanceRecord);

// 故障上报
router.get('/fault-reports', maintenanceController.getFaultReports);
router.post('/fault-reports', maintenanceController.createFaultReport);
router.post('/fault-reports/:id/assign', checkRole(['station_manager', 'deputy_manager', 'department_manager']), maintenanceController.assignFaultReport);

// 维修记录单（完整工作流）
router.get('/repair-records', maintenanceController.getRepairRecords);
router.get('/repair-records/:id', maintenanceController.getRepairRecordById);
router.post('/repair-records', maintenanceController.createRepairRecord);
router.put('/repair-records/:id', maintenanceController.updateRepairRecord);
router.delete('/repair-records/:id', maintenanceController.deleteRepairRecord);
router.post('/repair-records/:id/submit', maintenanceController.submitRepairRecord);
router.post('/repair-records/:id/dispatch', checkRole(['station_manager', 'deputy_manager', 'department_manager', 'admin']), maintenanceController.dispatchRepairRecord);
router.post('/repair-records/:id/start', checkRole(['maintenance']), maintenanceController.startRepair);
router.post('/repair-records/:id/complete', checkRole(['maintenance']), maintenanceController.completeRepair);
router.post('/repair-records/:id/verify', checkRole(['station_manager', 'deputy_manager', 'department_manager']), maintenanceController.verifyRepairRecord);

// 领料申请
router.get('/material-requisitions', maintenanceController.getMaterialRequisitions);
router.post('/material-requisitions', maintenanceController.createMaterialRequisition);

// ============================================
// 设备保养计划库
// ============================================
router.get('/maintenance-plan-library', maintenancePlanLibraryController.getMaintenancePlanLibrary);
router.post('/maintenance-plan-library', checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']), maintenancePlanLibraryController.createMaintenancePlanLibrary);
router.post('/maintenance-plan-library/batch-import', checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']), maintenancePlanLibraryController.batchImportMaintenancePlanLibrary);
router.put('/maintenance-plan-library/:id', checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']), maintenancePlanLibraryController.updateMaintenancePlanLibrary);
router.delete('/maintenance-plan-library/:id', checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']), maintenancePlanLibraryController.deleteMaintenancePlanLibrary);

// 保养工作分配
router.get('/maintenance-assignments', maintenancePlanLibraryController.getMaintenanceAssignments);
router.post('/maintenance-assignments', checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']), maintenancePlanLibraryController.createMaintenanceAssignment);
router.put('/maintenance-assignments/:id', maintenancePlanLibraryController.updateMaintenanceAssignment);
router.put('/maintenance-assignments/:id/start', maintenancePlanLibraryController.startMaintenanceAssignment);
router.put('/maintenance-assignments/:id/complete', maintenancePlanLibraryController.completeMaintenanceAssignment);
router.post('/maintenance-assignments/:id/verify', checkRole(['station_manager', 'deputy_manager', 'department_manager']), maintenancePlanLibraryController.verifyMaintenanceAssignment);
router.delete('/maintenance-assignments/:id', checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']), maintenancePlanLibraryController.deleteMaintenanceAssignment);

// 保养计划岗位分配（管理端）
router.get('/maintenance-position-plans', checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']), maintenancePositionController.getMaintenancePositionPlans);
router.post('/maintenance-position-plans', checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']), maintenancePositionController.createMaintenancePositionPlan);
router.delete('/maintenance-position-plans/:id', checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']), maintenancePositionController.deleteMaintenancePositionPlan);

// 保养工作记录（员工端提交，管理端查看）
router.get('/maintenance-work-records', maintenancePositionController.getMaintenanceWorkRecords);
router.get('/maintenance-work-records/today-tasks', maintenancePositionController.getTodayMaintenanceTasks);
router.get('/maintenance-work-records/:id', maintenancePositionController.getMaintenanceWorkRecordDetail);
router.post('/maintenance-work-records', maintenancePositionController.submitMaintenanceWorkRecord);
router.put('/maintenance-work-records/:id/verify', checkRole(['station_manager', 'deputy_manager', 'department_manager']), maintenancePositionController.verifyMaintenanceWorkRecord);

// ============================================
// 自检表管理
// ============================================
// 自检
router.get('/self-inspections', inspectionController.getSelfInspections);
router.get('/self-inspections/my', inspectionController.getMySelfInspections);
router.get('/self-inspections/overdue', inspectionController.getOverdueUsers);
router.post('/self-inspections', inspectionController.createSelfInspection);

// 他检
router.get('/other-inspections', inspectionController.getOtherInspections);
router.post('/other-inspections', checkRole(['station_manager', 'safety_inspector', 'department_manager', 'deputy_manager']), inspectionController.createOtherInspection);

// 安全隐患检查
router.get('/hazard-inspections', inspectionController.getHazardInspections);
router.post('/hazard-inspections', checkRole(['safety_inspector']), inspectionController.createHazardInspection);
router.put('/hazard-inspections/:id', checkRole(['safety_inspector']), inspectionController.updateHazardInspection);
router.delete('/hazard-inspections/:id', checkRole(['safety_inspector']), inspectionController.deleteHazardInspection);

// 安全隐患整改
router.get('/safety-rectifications', inspectionController.getSafetyRectifications);
router.post('/safety-rectifications', checkRole(['station_manager', 'safety_inspector', 'department_manager', 'deputy_manager']), inspectionController.createSafetyRectification);
router.put('/safety-rectifications/:id', checkRole(['station_manager', 'safety_inspector', 'department_manager', 'deputy_manager']), inspectionController.updateSafetyRectification);
router.put('/safety-rectifications/:id/review', checkRole(['safety_inspector']), inspectionController.reviewSafetyRectification);

// PLC数据
router.get('/plc/records', plcController.getPlcRecords);
router.post('/plc/files/scan', plcController.scanPlcFiles);

// ============================================
// 进出料管理
// ============================================
// 仓库
router.get('/warehouses', inboundOutboundController.getWarehouses);
router.post('/warehouses', checkRole(['admin', 'station_manager']), inboundOutboundController.createWarehouse);
router.put('/warehouses/:id', checkRole(['admin', 'station_manager']), inboundOutboundController.updateWarehouse);

// IC卡
router.get('/ic-cards', inboundOutboundController.getIcCards);
router.post('/ic-cards', checkRole(['admin', 'station_manager']), inboundOutboundController.createIcCard);
router.put('/ic-cards/:id/disable', checkRole(['admin', 'station_manager']), inboundOutboundController.disableIcCard);
router.get('/ic-cards/verify/:cardId', inboundOutboundController.verifyIcCard);

// 进料
router.get('/inbound', inboundOutboundController.getInboundRecords);
router.post('/inbound', inboundOutboundController.createInboundRecord);

// 出料
router.get('/outbound', inboundOutboundController.getOutboundRecords);
router.post('/outbound', inboundOutboundController.createOutboundRecord);

// 库存
router.get('/inventory', inboundOutboundController.getInventory);

// ============================================
// 审核管理
// ============================================
router.get('/approval/pending', approvalController.getPendingApprovals);
router.get('/approvals', checkRole(['station_manager', 'department_manager', 'admin']), approvalController.getApprovals);
router.get('/approvals/pending', approvalController.getPendingApprovals);
router.put('/approvals/batch-approve', checkRole(['station_manager', 'department_manager', 'admin']), approvalController.batchApproveApprovals);
router.put('/approvals/batch-reject', checkRole(['station_manager', 'department_manager', 'admin']), approvalController.batchRejectApprovals);
router.put('/approvals/:id/approve', checkRole(['station_manager', 'department_manager', 'admin']), approvalController.approveApproval);
router.put('/approvals/:id/reject', checkRole(['station_manager', 'department_manager', 'admin']), approvalController.rejectApproval);
router.post('/approval/task-hours/:id', checkRole(['station_manager', 'department_manager']), approvalController.approveTaskHours);
router.post('/approval/task-hours/batch', checkRole(['station_manager', 'department_manager']), approvalController.batchApproveTaskHours);
router.post('/approval/maintenance/:id', checkRole(['station_manager', 'deputy_manager', 'department_manager']), approvalController.approveMaintenance);
router.post('/approval/repair/:id', checkRole(['station_manager', 'deputy_manager', 'department_manager']), approvalController.approveRepair);
router.post('/approval/requisition/:id', checkRole(['station_manager', 'department_manager']), approvalController.approveRequisition);
router.post('/approval/rectification/:id', checkRole(['safety_inspector', 'department_manager']), approvalController.approveRectification);

// ============================================
// 通知管理
// ============================================
router.get('/notifications', notificationController.getNotifications);
router.get('/notifications/unread-count', notificationController.getUnreadCount);
router.put('/notifications/:id/read', notificationController.markAsRead);
router.put('/notifications/read-all', notificationController.markAllAsRead);
router.delete('/notifications/:id', notificationController.deleteNotification);

// ============================================
// 帮助与反馈
// ============================================
router.post('/feedback', feedbackController.submitFeedback);

// ============================================
// 单价管理
// ============================================
router.get('/prices', priceController.getPrices);
router.get('/prices/all', priceController.getAllPrices);
router.get('/prices/categories', priceController.getPriceCategories);
router.post('/prices', checkPriceAdmin, priceController.createPrice);
router.put('/prices/:id', checkPriceAdmin, priceController.updatePrice);
router.delete('/prices/:id', checkPriceAdmin, priceController.deletePrice);

// ============================================
// 报表管理
// ============================================
router.get('/reports/work-hours', reportController.getWorkHoursReport);
router.get('/reports/maintenance', reportController.getMaintenanceReport);
router.get('/reports/repair', reportController.getRepairReport);
router.get('/reports/safety', reportController.getSafetyReport);
router.get('/reports/schedule', reportController.getScheduleReport);
router.get('/reports/temporary-tasks', reportController.getTemporaryTasksReport);
router.get('/reports/inbound', reportController.getInboundReport);
router.get('/reports/outbound', reportController.getOutboundReport);
router.get('/reports/inventory', reportController.getInventoryReport);

// ============================================
// 文件上传
// ============================================
router.post('/upload', uploadToDisk.single('file'), uploadController.uploadSingle);
router.post('/upload/multiple', uploadToDisk.array('files', 10), uploadController.uploadMultiple);

// ============================================
// 人员岗位管理
// ============================================
// 读取接口允许操作岗访问，以便查看自己的工作项目
router.get('/position-jobs', positionJobController.getPositionJobs);
router.get('/position-jobs/positions', positionJobController.getPositionNames);
router.get('/position-jobs/by-position', positionJobController.getPositionJobsByPosition);
// 写操作仅限管理员
router.post('/position-jobs', checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']), positionJobController.createPositionJob);
router.put('/position-jobs/:id', checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']), positionJobController.updatePositionJob);
router.delete('/position-jobs/:id', checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']), positionJobController.deletePositionJob);
router.get('/position-jobs/template', checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']), positionJobController.getPositionJobsTemplate);
router.post('/position-jobs/import', checkRole(['admin', 'station_manager', 'department_manager', 'deputy_manager']), upload.single('file'), positionJobController.importPositionJobs);

// ============================================
// 岗位工作登记
// ============================================
router.get('/position-work-logs/today-tasks', positionWorkLogController.getTodayTasks);
router.get('/position-work-logs/user', checkRole(['station_manager', 'department_manager', 'deputy_manager']), positionWorkLogController.getUserWorkLogs);
router.get('/position-work-logs', positionWorkLogController.getWorkLogs);
router.post('/position-work-logs', positionWorkLogController.saveWorkLog);

// ============================================
// 卫生管理
// ============================================
// 卫生责任区
router.get('/hygiene-areas', hygieneManagementController.getHygieneAreas);
router.post('/hygiene-areas', checkRole(['station_manager', 'department_manager', 'deputy_manager']), hygieneManagementController.createHygieneArea);
router.put('/hygiene-areas/:id', checkRole(['station_manager', 'department_manager', 'deputy_manager']), hygieneManagementController.updateHygieneArea);
router.delete('/hygiene-areas/:id', checkRole(['station_manager', 'department_manager', 'deputy_manager']), hygieneManagementController.deleteHygieneArea);

// 卫生点
router.get('/hygiene-points', hygieneManagementController.getHygienePoints);
router.post('/hygiene-points', checkRole(['station_manager', 'department_manager', 'deputy_manager']), hygieneManagementController.createHygienePoint);
router.put('/hygiene-points/:id', checkRole(['station_manager', 'department_manager', 'deputy_manager']), hygieneManagementController.updateHygienePoint);
router.delete('/hygiene-points/:id', checkRole(['station_manager', 'department_manager', 'deputy_manager']), hygieneManagementController.deleteHygienePoint);

// 岗位任务分配
router.get('/hygiene-position-areas', hygieneManagementController.getHygienePositionAreas);
router.post('/hygiene-position-areas', checkRole(['station_manager', 'department_manager', 'deputy_manager']), hygieneManagementController.createHygienePositionArea);
router.delete('/hygiene-position-areas/:id', checkRole(['station_manager', 'department_manager', 'deputy_manager']), hygieneManagementController.deleteHygienePositionArea);
router.get('/hygiene-position-areas/by-position', hygieneManagementController.getHygieneAreasByPosition);

// ============================================
// 设备管理
// ============================================
router.get('/equipment', equipmentController.getEquipment);
router.get('/equipment/by-code', equipmentController.getEquipmentByCode);
router.get('/equipment/template', checkRole(['station_manager', 'department_manager', 'deputy_manager']), equipmentController.getEquipmentTemplate);
router.post('/equipment', checkRole(['station_manager', 'department_manager', 'deputy_manager']), equipmentController.createEquipment);
router.post('/equipment/batch', checkRole(['station_manager', 'department_manager', 'deputy_manager']), equipmentController.batchCreateEquipment);
router.post('/equipment/import', checkRole(['station_manager', 'department_manager', 'deputy_manager']), upload.single('file'), equipmentController.importEquipment);
router.put('/equipment/:id', checkRole(['station_manager', 'department_manager', 'deputy_manager']), equipmentController.updateEquipment);
router.delete('/equipment/:id', checkRole(['station_manager', 'department_manager', 'deputy_manager']), equipmentController.deleteEquipment);

// ============================================
// 安全检查项目管理
// ============================================
// 工作性质
router.get('/safety-work-types', safetyCheckController.getWorkTypes);
router.post('/safety-work-types', checkRole(['safety_inspector']), safetyCheckController.createWorkType);
router.put('/safety-work-types/:id', checkRole(['safety_inspector']), safetyCheckController.updateWorkType);
router.delete('/safety-work-types/:id', checkRole(['safety_inspector']), safetyCheckController.deleteWorkType);

// 检查项目
router.get('/safety-check-items', safetyCheckController.getCheckItems);
router.get('/safety-check-items/by-work-types', safetyCheckController.getCheckItemsByWorkTypes);
router.get('/safety-check-items/template', checkRole(['safety_inspector']), safetyCheckController.getCheckItemsTemplate);
router.post('/safety-check-items', checkRole(['safety_inspector']), safetyCheckController.createCheckItem);
router.post('/safety-check-items/batch', checkRole(['safety_inspector']), safetyCheckController.batchCreateCheckItems);
router.post('/safety-check-items/import', checkRole(['safety_inspector']), uploadToDisk.single('file'), safetyCheckController.importCheckItems);
router.put('/safety-check-items/:id', checkRole(['safety_inspector']), safetyCheckController.updateCheckItem);
router.delete('/safety-check-items/:id', checkRole(['safety_inspector']), safetyCheckController.deleteCheckItem);

// ============================================
// 隐患类别和根本原因配置
// ============================================
// 隐患类别
router.get('/hazard-categories', hazardConfigController.getHazardCategories);
router.post('/hazard-categories', checkRole(['safety_inspector']), hazardConfigController.createHazardCategory);
router.put('/hazard-categories/:id', checkRole(['safety_inspector']), hazardConfigController.updateHazardCategory);
router.delete('/hazard-categories/:id', checkRole(['safety_inspector']), hazardConfigController.deleteHazardCategory);

// 根本原因
router.get('/hazard-root-causes', hazardConfigController.getHazardRootCauses);
router.post('/hazard-root-causes', checkRole(['safety_inspector', 'station_manager', 'department_manager', 'deputy_manager']), hazardConfigController.createHazardRootCause);
router.put('/hazard-root-causes/:id', checkRole(['safety_inspector', 'station_manager', 'department_manager', 'deputy_manager']), hazardConfigController.updateHazardRootCause);
router.delete('/hazard-root-causes/:id', checkRole(['safety_inspector', 'station_manager', 'department_manager', 'deputy_manager']), hazardConfigController.deleteHazardRootCause);

export default router;
