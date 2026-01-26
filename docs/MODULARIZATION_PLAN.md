# 系统模块化梳理（可插拔/可独立部署）

> 适用范围：运行项目管理系统（waste-management-system）
> 目标：从现有单体逐步演进为模块化单体，最终支持按模块独立部署。

## 1. 模块边界与数据归属

### 核心平台（用户/权限/组织）
- 归属数据：users、roles、permissions、role_permissions、user_permissions、departments、companies、stations、user_stations、system_config、operation_log
- 职责：认证、角色权限、组织结构、场站管理
- 依赖：无

### 排班模块
- 归属数据：schedules
- 职责：排班管理、今日排班人员
- 依赖：核心平台（用户/场站）

### 岗位/任务模块
- 归属数据：position_jobs、position_tasks、position_work_logs、task_configs、daily_tasks、temporary_tasks、temporary_task_library
- 职责：岗位工作、固定任务、临时任务、任务配置
- 依赖：核心平台 + 排班

### 安全检查模块
- 归属数据：safety_work_types、safety_check_items、safety_self_inspections、safety_other_inspections、safety_hazard_inspections、safety_rectifications、hazard_categories、hazard_root_causes
- 职责：自检/他检/隐患整改
- 依赖：核心平台 + 排班

### 卫生检查模块
- 归属数据：hygiene_areas、hygiene_points、hygiene_position_areas（自检/他检复用检查记录表）
- 职责：责任区划分、岗位分配、卫生自检/他检
- 依赖：核心平台 + 排班

### 设备故障/维修模块
- 归属数据：fault_reports、repair_records、material_requisitions
- 职责：故障上报、派单、维修、验收
- 依赖：核心平台 + 排班

### 设备保养模块
- 归属数据：maintenance_plan_library、maintenance_plans、maintenance_assignments、maintenance_position_plans、maintenance_work_records、maintenance_records
- 职责：保养计划、分配、任务记录、验收
- 依赖：核心平台 + 排班

### 设备与单价模块
- 归属数据：equipment、price_management
- 职责：设备台账、单价配置
- 依赖：核心平台

### 审批模块（平台能力）
- 归属数据：无独立表（审批状态分散在业务表）
- 职责：统一审批入口与流程
- 依赖：所有业务模块

### 通知模块（平台能力）
- 归属数据：notifications
- 职责：站内消息
- 依赖：所有业务模块

### 报表模块（平台能力）
- 归属数据：无独立表（跨模块聚合查询）
- 职责：统计报表
- 依赖：所有业务模块

### PLC 模块（已独立）
- 归属数据：plc_categories、plc_monitor_configs、plc_readings、plc_scale_records、plc_file_imports
- 职责：采集、监控、报表
- 依赖：核心平台（场站）

## 2. 依赖关系原则

- 业务模块只允许单向依赖核心平台与排班。
- 排班不反向依赖任何业务模块，避免循环依赖。
- 跨模块访问必须走 API/事件，不直接跨表 SQL。

## 3. 接口/事件契约草案（精简）

### 核心平台
- API：/auth/*、/users、/roles、/permissions、/stations、/departments、/companies
- 事件：user.updated、role.updated、station.updated

### 排班
- API：/schedules、/schedules/today、/schedules/my（建议补 /schedules/by-date）
- 事件：schedule.changed
- 聚合看板接口草案：GET /schedules/overview
  - 参数：startDate、endDate、stationId、userId、includeTasks（默认 true）
  - 返回：schedules[]、taskSummary{positionWork, maintenance, fault, hygiene, safety}

### 岗位/任务
- API：/position-jobs*、/position-tasks、/position-work-logs*、/task-configs、/daily-tasks*、/temporary-tasks*、/temporary-task-library*
- 事件：position_work.completed、daily_tasks.submitted、temporary_task.updated

### 安全检查
- API：/self-inspections（inspectionType=safety）、/other-inspections、/hazard-inspections*、/safety-rectifications*、/safety-work-types*、/safety-check-items*、/hazard-categories*、/hazard-root-causes*
- 事件：safety.inspection.submitted、hazard.rectified

### 卫生检查
- API：/self-inspections（inspectionType=hygiene）、/other-inspections、/hygiene-areas*、/hygiene-points*、/hygiene-position-areas*
- 事件：hygiene.inspection.submitted

### 故障/维修
- API：/fault-reports*、/repair-records*、/material-requisitions*
- 事件：fault.reported、repair.completed

### 设备保养
- API：/maintenance-plan-library*、/maintenance-plans*、/maintenance-assignments*、/maintenance-position-plans*、/maintenance-work-records*、/maintenance-records*
- 事件：maintenance.completed

### 审批/通知/报表
- 审批 API：/approvals*、/approval/*（建议统一为审批服务）
- 通知 API：/notifications*
- 报表 API：/reports/*（建议后期聚合服务）

## 4. 拆分优先级（建议顺序）

1. 核心平台（用户/权限/组织）
2. 排班
3. 岗位/任务
4. 故障/维修 + 保养
5. 安全 + 卫生
6. 审批/通知
7. 报表

## 5. 迁移步骤（阶段化）

### 阶段 0：基线梳理
- 输出模块边界图、依赖矩阵、表归属清单。

### 阶段 1：模块化单体
- 在单体内建立模块目录与模块接口层。
- 禁止跨模块直接 SQL 查询。

### 阶段 2：契约标准化
- 统一对外 API 契约并版本化。
- 确认跨模块事件列表。

### 阶段 3：数据所有权明确
- 同库分 schema 或前缀隔离。
- 读取他模块数据只能走 API。

### 阶段 4：分批独立部署
- 先拆核心平台与排班。
- 再拆岗位/任务、故障/保养、安全/卫生。

### 阶段 5：聚合与降级
- 排班页面展示岗位任务，采用前端双请求或聚合接口，避免反向依赖。
- 模块不可用时提供降级提示。

### 阶段 6：事件驱动与读模型
- 排班变更事件驱动同步快照。
- 报表模块改为聚合服务或 ETL。

## 6. 风险控制

- 避免循环依赖（排班不依赖业务模块）。
- 先模块化单体，再拆服务，降低一次性重构风险。
- 报表/审批放后期，避免跨域牵连过多。

## 7. 系统全局待拆分清单（维护向）

### 前端
- 路由按业务模块拆分（已完成）
- 菜单/权限元数据拆分为模块清单（菜单已按角色拆分）
- API 调用按模块聚合导出（已添加 api/index.js 入口）
- 通用表格/筛选/上传/弹窗组件抽离为共享模块（筛选条/表格容器/表格卡片/上传组件已抽离）
- 组织架构管理页面的场站/部门/公司/角色弹窗统一为 FormDialog 组件
- 用户管理新增/编辑弹窗统一为 FormDialog 组件
- 单价管理新增/编辑弹窗统一为 FormDialog 组件
- 卫生工作安排的责任区/点位/分配弹窗统一为 FormDialog 组件
- 安全检查项目管理的工作性质/检查项弹窗统一为 FormDialog 组件
- 岗位工作任务库新增/编辑弹窗统一为 FormDialog 组件
- 排班、设备、临时任务、维修故障、自检/他检、隐患与导入预览等页面弹窗统一为 FormDialog，并支持透传属性与自定义 footer
- 上传配置抽离为 composable（useUpload），统一 uploadUrl/uploadHeaders
- 设备保养/故障的耗材与配件表格抽离为 MaintenanceItemTable 复用
- 设备保养任务详情弹窗抽离为 MaintenanceAssignmentDetailDialog 复用
- 设备保养记录详情弹窗抽离为 MaintenanceWorkRecordDetailDialog 复用
- 设备故障详情弹窗抽离为 MaintenanceFaultDetailDialog 复用
- 设备保养计划新增/编辑弹窗抽离为 MaintenancePlanDialog 复用
- 卫生自检/他检责任区点位列表抽离为 HygieneAreaChecklist 组件复用
- 安全自检/他检检查项列表抽离为 SafetyCheckItemList 组件复用
- 报表统计卡片/图表卡片抽离为 ReportSummaryCards 与 ReportChartCard 组件复用
- 按模块拆分 store 状态（已拆出 store/modules）
- layout 与菜单渲染解耦，支持模块可插拔启停

### 后端
- 设备故障/维修服务下沉到 maintenance/services，控制器只负责参数与响应
- 保养计划/保养记录/领料申请服务下沉到 maintenance/services，控制器只负责参数与响应
- 安全检查配置控制器下沉到 inspection/services/safetyCheckService
- 自检/他检/隐患与卫生管理控制器下沉到 inspection/services
- 审批/通知/报表/设备/单价/反馈/上传控制器下沉到模块 services
- 核心平台 auth/user/role/permission/station/department/company 控制器下沉到 core/services
- 保养计划库/分配控制器下沉到 maintenance/services/planLibraryService
- 任务模块（任务配置/岗位任务/临时任务/临时任务库/岗位工作记录）控制器下沉到 task/services
- 排班控制器下沉到 schedule/services/scheduleService
- 保养岗位分配/工作记录控制器下沉到 maintenance/services/positionService
- controller -> service -> repository 分层，禁止跨模块直接 SQL
- 模块内校验/DTO 与错误码统一，减少控制器重复逻辑
- 审批/报表聚合服务单独目录，便于后续独立部署
- 事件与聚合接口标准化（排班 overview + 任务汇总）

### 基础设施
- database 迁移脚本按模块归档
- scripts 备份/迁移/修复脚本按场景拆分目录
- docker-compose 按模块提供 override（便于独立部署）



