import sequelize from '../config/database.js';

// 导入所有模型
import Role from './Role.js';
import User from './User.js';
import Permission from './Permission.js';
import RolePermission from './RolePermission.js';
import UserPermission from './UserPermission.js';
import Department from './Department.js';
import Station from './Station.js';
import UserStation from './UserStation.js';
import Schedule from './Schedule.js';
import TaskConfig from './TaskConfig.js';
import PositionTask from './PositionTask.js';
import DailyTask from './DailyTask.js';
import TemporaryTask from './TemporaryTask.js';
import TemporaryTaskLibrary from './TemporaryTaskLibrary.js';
import MaintenancePlan from './MaintenancePlan.js';
import MaintenanceRecord from './MaintenanceRecord.js';
import FaultReport from './FaultReport.js';
import RepairRecord from './RepairRecord.js';
import RepairTaskLibrary from './RepairTaskLibrary.js';
import MaterialRequisition from './MaterialRequisition.js';
import SafetySelfInspection from './SafetySelfInspection.js';
import SafetyOtherInspection from './SafetyOtherInspection.js';
import SafetyHazardInspection from './SafetyHazardInspection.js';
import SafetyRectification from './SafetyRectification.js';
import SystemConfig from './SystemConfig.js';
import Notification from './Notification.js';
import OperationLog from './OperationLog.js';
import PositionJob from './PositionJob.js';
import PositionWorkLog from './PositionWorkLog.js';
import HygieneArea from './HygieneArea.js';
import HygienePoint from './HygienePoint.js';
import HygienePositionArea from './HygienePositionArea.js';
import Equipment from './Equipment.js';
import SafetyWorkType from './SafetyWorkType.js';
import SafetyCheckItem from './SafetyCheckItem.js';
import HazardCategory from './HazardCategory.js';
import HazardRootCause from './HazardRootCause.js';
import Company from './Company.js';
import MaintenancePlanLibrary from './MaintenancePlanLibrary.js';
import MaintenanceAssignment from './MaintenanceAssignment.js';
import MaintenancePositionPlan from './MaintenancePositionPlan.js';
import MaintenanceWorkRecord from './MaintenanceWorkRecord.js';
import PlcScaleRecord from './PlcScaleRecord.js';
import PlcFileImport from './PlcFileImport.js';
import PlcCategory from './PlcCategory.js';
import PlcMonitorConfig from './PlcMonitorConfig.js';
import PlcReading from './PlcReading.js';
import ManualPointsEntry from './ManualPointsEntry.js';
import ManualWorkHour from './ManualWorkHour.js';
import AdjustedHourlyPoints from './AdjustedHourlyPoints.js';
import QuarterlyAwardGroup from './QuarterlyAwardGroup.js';
import QuarterlyAwardDetail from './QuarterlyAwardDetail.js';

// 导出所有模型
export {
  sequelize,
  Role,
  User,
  Permission,
  RolePermission,
  UserPermission,
  Department,
  Station,
  UserStation,
  Schedule,
  TaskConfig,
  PositionTask,
  DailyTask,
  TemporaryTask,
  TemporaryTaskLibrary,
  MaintenancePlan,
  MaintenanceRecord,
  FaultReport,
  RepairRecord,
  RepairTaskLibrary,
  MaterialRequisition,
  SafetySelfInspection,
  SafetyOtherInspection,
  SafetyHazardInspection,
  SafetyRectification,
  SystemConfig,
  Notification,
  OperationLog,
  PositionJob,
  PositionWorkLog,
  HygieneArea,
  HygienePoint,
  HygienePositionArea,
  Equipment,
  SafetyWorkType,
  SafetyCheckItem,
  HazardCategory,
  HazardRootCause,
  Company,
  MaintenancePlanLibrary,
  MaintenanceAssignment,
  MaintenancePositionPlan,
  MaintenanceWorkRecord,
  PlcScaleRecord,
  PlcFileImport,
  PlcCategory,
  PlcMonitorConfig,
  PlcReading,
  ManualPointsEntry,
  ManualWorkHour,
  AdjustedHourlyPoints,
  QuarterlyAwardGroup,
  QuarterlyAwardDetail
};

// 定义模型关联关系
export const defineAssociations = () => {
  // 用户与角色
  User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
  Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

  // 浜虹敤鎴风О鐜囨潈闄?
  UserPermission.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  UserPermission.belongsTo(Permission, { foreignKey: 'permission_id', as: 'permission' });
  User.hasMany(UserPermission, { foreignKey: 'user_id', as: 'userPermissions' });

  // 角色与权限 (多对多)
  Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'role_id', as: 'permissions' });
  Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permission_id', as: 'roles' });

  // 用户与场站 (多对多)
  User.belongsToMany(Station, { through: UserStation, foreignKey: 'user_id', as: 'stations' });
  Station.belongsToMany(User, { through: UserStation, foreignKey: 'station_id', as: 'users' });

  // 排班表与用户
  Schedule.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  User.hasMany(Schedule, { foreignKey: 'user_id', as: 'schedules' });

  // 排班表与场站
  Schedule.belongsTo(Station, { foreignKey: 'station_id', as: 'station' });

  // 岗位任务与任务配置
  PositionTask.belongsTo(TaskConfig, { foreignKey: 'task_config_id', as: 'taskConfig' });
  TaskConfig.hasMany(PositionTask, { foreignKey: 'task_config_id', as: 'positionTasks' });

  // 每日任务与用户
  DailyTask.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  User.hasMany(DailyTask, { foreignKey: 'user_id', as: 'dailyTasks' });

  // 每日任务与任务配置
  DailyTask.belongsTo(TaskConfig, { foreignKey: 'task_config_id', as: 'taskConfig' });

  // 临时任务关联
  TemporaryTask.belongsTo(User, { foreignKey: 'assigner_id', as: 'assigner' });
  TemporaryTask.belongsTo(User, { foreignKey: 'executor_id', as: 'executor' });

  // 临时工作任务汇总表关联
  if (TemporaryTaskLibrary.associate) {
    TemporaryTaskLibrary.associate({ Station, User });
  } else {
    TemporaryTaskLibrary.belongsTo(Station, { foreignKey: 'station_id', as: 'station' });
    TemporaryTaskLibrary.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
  }

  // 保养计划与场站
  MaintenancePlan.belongsTo(Station, { foreignKey: 'station_id', as: 'station' });

  // 保养记录与保养计划
  MaintenanceRecord.belongsTo(MaintenancePlan, { foreignKey: 'plan_id', as: 'plan' });
  MaintenancePlan.hasMany(MaintenanceRecord, { foreignKey: 'plan_id', as: 'records' });
  MaintenanceRecord.belongsTo(User, { foreignKey: 'maintainer_id', as: 'maintainer' });

  // 维修记录与故障上报
  RepairRecord.belongsTo(FaultReport, { foreignKey: 'fault_report_id', as: 'faultReport' });
  FaultReport.hasOne(RepairRecord, { foreignKey: 'fault_report_id', as: 'repairRecord' });
  FaultReport.belongsTo(User, { foreignKey: 'reporter_id', as: 'reporter' });
  FaultReport.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });

  // 维修记录与用户
  RepairRecord.belongsTo(User, { foreignKey: 'repair_person_id', as: 'repairPerson' });

  // 维修记录与场站
  RepairRecord.belongsTo(Station, { foreignKey: 'station_id', as: 'station' });

  // 领料申请与维修记录
  MaterialRequisition.belongsTo(RepairRecord, { foreignKey: 'repair_record_id', as: 'repairRecord' });
  MaterialRequisition.belongsTo(User, { foreignKey: 'applicant_id', as: 'applicant' });

  // 自检表与用户
  SafetySelfInspection.belongsTo(User, { foreignKey: 'filler_id', as: 'filler' });
  SafetySelfInspection.belongsTo(Station, { foreignKey: 'station_id', as: 'station' });

  // 他检表与用户
  SafetyOtherInspection.belongsTo(User, { foreignKey: 'inspector_id', as: 'inspector' });
  SafetyOtherInspection.belongsTo(Station, { foreignKey: 'station_id', as: 'station' });

  // 安全隐患检查与用户
  SafetyHazardInspection.belongsTo(User, { foreignKey: 'inspector_id', as: 'inspector' });
  SafetyHazardInspection.belongsTo(User, { foreignKey: 'handler_id', as: 'handler' });

  // 安全隐患整改与检查记录
  SafetyRectification.belongsTo(SafetyHazardInspection, { foreignKey: 'inspection_id', as: 'inspection' });
  SafetyHazardInspection.hasOne(SafetyRectification, { foreignKey: 'inspection_id', as: 'rectification' });
  SafetyRectification.belongsTo(User, { foreignKey: 'handler_id', as: 'handler' });
  SafetyRectification.belongsTo(User, { foreignKey: 'punished_person_id', as: 'punishedPerson' });

  // 仓库与场站
  // 通知与用户
  Notification.belongsTo(User, { foreignKey: 'receiver_id', as: 'receiver' });
  User.hasMany(Notification, { foreignKey: 'receiver_id', as: 'notifications' });

  // 操作日志与用户
  OperationLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  
  // 岗位工作项目与场站
  if (PositionJob.associate) {
    PositionJob.associate({ Station });
  } else {
    PositionJob.belongsTo(Station, { foreignKey: 'station_id', as: 'station' });
  }

  // 岗位工作登记与用户
  PositionWorkLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  User.hasMany(PositionWorkLog, { foreignKey: 'user_id', as: 'workLogs' });

  // 岗位工作登记与场站
  PositionWorkLog.belongsTo(Station, { foreignKey: 'station_id', as: 'station' });

  // 岗位工作登记与岗位工作项目
  PositionWorkLog.belongsTo(PositionJob, { foreignKey: 'position_job_id', as: 'positionJob' });

  // 卫生责任区与场站
  if (HygieneArea.associate) {
    HygieneArea.associate({ Station, HygienePoint, HygienePositionArea });
  }

  // 卫生点与责任区和场站
  if (HygienePoint.associate) {
    HygienePoint.associate({ HygieneArea, Station });
  }

  // 岗位责任区关联
  if (HygienePositionArea.associate) {
    HygienePositionArea.associate({ HygieneArea, Station });
  }

  // 设备与场站
  if (Equipment.associate) {
    Equipment.associate({ Station });
  }

  // 安全工作性质与检查项目
  if (SafetyWorkType.associate) {
    SafetyWorkType.associate({ SafetyCheckItem });
  }
  if (SafetyCheckItem.associate) {
    SafetyCheckItem.associate({ SafetyWorkType, SafetyCheckItem });
  }

  // 保养计划库与场站
  MaintenancePlanLibrary.belongsTo(Station, { foreignKey: 'station_id', as: 'station' });
  MaintenancePlanLibrary.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

  // 保养工作分配与场站、用户、计划
  MaintenanceAssignment.belongsTo(Station, { foreignKey: 'station_id', as: 'station' });
  MaintenanceAssignment.belongsTo(User, { foreignKey: 'executor_id', as: 'executor' });
  MaintenanceAssignment.belongsTo(User, { foreignKey: 'assigner_id', as: 'assigner' });
  MaintenanceAssignment.belongsTo(MaintenancePlanLibrary, { foreignKey: 'plan_id', as: 'plan' });

  // 保养计划岗位分配与场站、保养计划库
  MaintenancePositionPlan.belongsTo(Station, { foreignKey: 'station_id', as: 'station' });
  MaintenancePositionPlan.belongsTo(MaintenancePlanLibrary, { foreignKey: 'plan_id', as: 'plan' });
  MaintenancePlanLibrary.hasMany(MaintenancePositionPlan, { foreignKey: 'plan_id', as: 'positionAssignments' });

  // 员工保养工作记录与场站、保养计划库、用户
  MaintenanceWorkRecord.belongsTo(Station, { foreignKey: 'station_id', as: 'station' });
  MaintenanceWorkRecord.belongsTo(MaintenancePlanLibrary, { foreignKey: 'plan_id', as: 'plan' });
  MaintenanceWorkRecord.belongsTo(User, { foreignKey: 'executor_id', as: 'executor' });
  MaintenancePlanLibrary.hasMany(MaintenanceWorkRecord, { foreignKey: 'plan_id', as: 'workRecords' });

  // PLC监控配置与场站、分类
  PlcMonitorConfig.belongsTo(Station, { foreignKey: 'station_id', as: 'station' });
  PlcMonitorConfig.belongsTo(PlcCategory, { foreignKey: 'category_id', as: 'category' });
  PlcCategory.hasMany(PlcMonitorConfig, { foreignKey: 'category_id', as: 'configs' });

  // PLC读数与配置、分类、场站
  PlcReading.belongsTo(PlcMonitorConfig, { foreignKey: 'config_id', as: 'config' });
  PlcReading.belongsTo(PlcCategory, { foreignKey: 'category_id', as: 'category' });
  PlcReading.belongsTo(Station, { foreignKey: 'station_id', as: 'station' });
  PlcMonitorConfig.hasMany(PlcReading, { foreignKey: 'config_id', as: 'readings' });

  // 季度积分奖分组与明细
  QuarterlyAwardGroup.hasMany(QuarterlyAwardDetail, { foreignKey: 'group_id', as: 'details' });
  QuarterlyAwardDetail.belongsTo(QuarterlyAwardGroup, { foreignKey: 'group_id', as: 'group' });
  QuarterlyAwardDetail.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
};

export default {
  sequelize,
  Role,
  User,
  Permission,
  RolePermission,
  UserPermission,
  Department,
  Station,
  UserStation,
  Schedule,
  TaskConfig,
  PositionTask,
  DailyTask,
  TemporaryTask,
  TemporaryTaskLibrary,
  MaintenancePlan,
  MaintenanceRecord,
  FaultReport,
  RepairRecord,
  RepairTaskLibrary,
  MaterialRequisition,
  SafetySelfInspection,
  SafetyOtherInspection,
  SafetyHazardInspection,
  SafetyRectification,
  SystemConfig,
  Notification,
  OperationLog,
  PositionJob,
  PositionWorkLog,
  HygieneArea,
  HygienePoint,
  HygienePositionArea,
  Equipment,
  SafetyWorkType,
  SafetyCheckItem,
  HazardCategory,
  HazardRootCause,
  Company,
  MaintenancePlanLibrary,
  MaintenanceAssignment,
  MaintenancePositionPlan,
  MaintenanceWorkRecord,
  PlcCategory,
  PlcMonitorConfig,
  PlcReading,
  defineAssociations
};
