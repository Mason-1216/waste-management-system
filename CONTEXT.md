# 运行项目管理系统 - 上下文摘要
> 最后更新 2026-01-03

## 项目目标
构建废弃物处理场站的运行管理系统，覆盖多角色、多场站的日常运营管理：
- 排班与工时统计
- 安全/卫生自检与他检
- 设备故障报修与维修
- 进出料登记与库存管理
- 临时任务分配
- 数据报表与审批流

## 当前状态
### 已完成（摘要）
- 用户认证与权限（JWT）。
- 角色菜单、角色首页快捷操作与统计卡片。
- 用户管理重构（岗位层级、部门、单价管理员、批量导入）。
- 场站列表更新为 16 个指定名称。
- 部门接口 /api/departments。
- 通知接口与表结构对齐（notify_type 等字段）。
- 首页待审统计接口修正（/approval/pending）。
- 兼容前端审批接口：新增 /approvals 系列路由。
- daily_tasks 表加入初始化脚本（用于审批列表）。
- 补齐审批相关表（maintenance/repair/material/safety）并同步到 database/init.sql。
- 补齐自检/他检与故障上报表，并同步到 database/init.sql。
- 认证中间件改为只捕获 JWT 校验错误，避免业务异常误报“认证失败”。
- 卫生自检前端改为复用 /self-inspections 接口（inspectionType=hygiene）。
- 设备故障页面（/device-faults）：表格行内编辑覆盖上报/派单/维修/验收，按角色开放编辑。
- 设备故障列表为摘要行，点击“查看”弹窗展示完整表单（上报/派单/维修/验收）。
- 维修记录新增紧急程度、计划维修日期/时间、维修配合人、验收态度/质量字段，并同步到后端与初始化脚本。
- 设备故障维修信息的耗材/配件改为可新增多条明细列表。
- 验收信息的维修态度/维修质量改为 5 星评分，并显示星级文字。
- 系统管理员用户管理新增状态表头与公司/场站筛选。
- 系统管理员首页隐藏今日自检卡片，快捷操作仅保留用户管理/帮助与反馈。
- 帮助与反馈提交后通知系统管理员。
- 帮助与反馈支持上传截图。
- 顶部上下文选择仅保留“场站”，移除“项目”选择。
- 安全隐患流转表单：安全员发起、站长整改、安全员复查。
- 安全隐患创建后通知对应站长，整改提交后通知被处罚人。
- 新增 Docker 开发模式（热更新）配置。
- Docker 开发模式容器改用 node:18 镜像，避免 npm 缺失导致服务重启。
- 安全隐患“场站名称”下拉改为读取 /stations/all，与场站管理同步。
- 修复顶部与侧边栏文本固定为“运行管理系统”的问题，改为显示真实菜单名与用户名。
- 安全员菜单改为与站长一致的安全/卫生子菜单（自检/他检）。
- “安全隐患”从“安全检查”子菜单移出，改为侧边栏单列入口。
- 安全他检保存时缺项目导致验证失败：后端自动推断项目，前端提交使用项目兜底。
- 安全/卫生自检与卫生他检保存时项目为空导致参数不完整：前后端补充项目兜底。
- 安全隐患整改编辑时字段未映射导致“是否完成整改”不更新，已修复并规范显示。
- 安全隐患查看改为直接展示完整表单，整改/查看共用表单并按权限只读。
- 安全隐患整改提交补全 responsible_person_id/responsible_person_name，修复 500 报错。
- 安全/卫生自检与他检：若无项目关联，后端改为使用最近项目或默认项目兜底。
- 安全/卫生自检提交时补充默认场站，避免提交成功但列表筛选不到。
- 安全/卫生自检选项文字由“符合/不符合”调整为“是/否”。
- 维修岗侧边栏移除“维修工作”模块入口。
- 维修岗首页快捷操作仅保留“安全自检/设备故障”，今日自检统计改为实时查询。
- 设备故障列表：维修岗仅能看到派单后的且维修负责人/配合人为本人的表单。
- 首页统计“故障维修”更名为“待维修”。
- 设备故障详情中耗材/配件表格支持横向滚动，避免内容被截断。
- 设备故障详情新增“保存”按钮，维修岗可在派单/维修中保存维修内容。
- 耗材/配件表格数量列加宽并在操作列提供“保存”按钮。
- 耗材/配件表格支持“保存后锁定/编辑解锁”，锁定行灰显不可编辑。
- 设备故障派单：维修负责人/维修配合人下拉改为显示维修岗人员姓名。
- 设备故障/维修单派单人显示兜底为用户真实姓名（防止显示ID）。
- 设备故障详情在非派单权限时显示维修负责人/维修配合人姓名而非ID。
- 安全隐患整改列表增加“全部”筛选，可以查看待整改与已整改的全部表单。
- 安全隐患整改发起权限扩展到安全员、部门经理、部门副经理。
- 安全/卫生他检“新增检查”下拉改用 real_name/realName 作为被检查人选项并按当前场站过滤。
- 后端 /api/users 接口增加 safety_inspector 权限，保障安全员可以查询被检查人列表。
- 安全员侧边栏移除“数据报表”入口，保留安全/卫生/隐患模块及修改密码。
- 首页统计卡片第一行仅保留“今日自检”“待审批”，所有角色显示这两个数据。
- 首页快捷操作仅保留“安全自检”“卫生自检”“安全隐患”。
- 站长首页快捷操作去除“故障派单/故障验收”，新增“设备故障”快捷入口。
- 安全/卫生他检新增“被检查人”下拉搜索（filterable）。
- 临时任务保存同时提交 taskName、taskDescription、taskType、executorId/executorName、projectId 等字段。
- 安全自检历史/今日记录前端去重，避免重复显示。
- 批量移除前后端 console 调试输出，关闭 Sequelize 日志。
- 所有表单时间选择统一到“小时:分钟”。
- 安全隐患新增隐患：支持新增/删除隐患类别；类别乱码修复与重置脚本。
- 认证与用户信息接口补充 departmentName。
- 数据权限：部门经理/副经理范围改为按 departmentName 过滤。
- 人员安全自检列表权限调整：操作/维修仅本人，站长按场站，部门经理/副经理按部门，高层全量，甲方不可访问。
- 安全自检页面与菜单：人员安全自检标签仅对管理角色可见；高层菜单新增安全自检入口。
- 安全他检场站下拉改用 /stations/all，修复“无数据”问题。
- 安全他检被检查人来源改为该场站“今日排班人员”。
- 安全自检/他检工作性质加载改为全量拉取后前端过滤有效状态（兼容旧库 status=1/0）。
- 卫生他检/卫生自检详情“检查项目”显示责任区、卫生点、工作要求及标准。
- 卫生区域划分与卫生任务分配新增搜索栏（场站/责任区、场站/岗位/责任区）。
- 修复菜单配置乱码问题（高层、甲方角色菜单名称乱码）。
- 按角色重新配置首页统计卡片、快捷操作和侧边栏。
- 首页快捷操作支持用户自定义新增/删除（只能选侧边栏已有功能）。
- 今日自检逻辑优化：每日上岗需完成安全自检基本工作和卫生自检，未完成显示数字2，完成一项减1。
- 安全自检/安全他检页面修复：站长进入时自动选中当前场站并加载该场站所有人员自检数据。
- 排班日历月份显示修复：修正“2025年2025-12月”重复年份问题。
- 设备故障详情流转图改为：已上报→已派发→维修中/待观察/未完成/已完成→待验收。
- 设备故障维修提交时补全开始/结束时间并默认维修结果。
- 设备故障派单计划维修日期/时间改为区间选择，新增计划维修结束日期/时间字段。
- 设备故障列表状态列与详情流转同步。
- “设备管理”界面仅对站长/部门经理/部门副经理显示。
- 设备保养计划表格按场站+设备+周期合并单元格，逐条展示保养标准。
- 设备保养计划页面与入口仅对站长/部门经理/部门副经理开放。
- 修复“设备故障上报”页面模板语法错误，恢复故障上报表单与设备管理面板渲染。
- 人员安全自检默认不限定日期范围；部门经理/副经理无部门名时仍可看到本人记录。
- 修复安全自检详情“结果”列模板错误导致的 Vue 编译报错。
- 修复设备保养页面标签页切换 watch 语法错误。
- 排班表：部门经理/副经理不再被当前场站限制查询，默认可看到全场站排班。
- 排班表权限判断改为优先使用 baseRoleCode，修复自定义角色继承经理权限但看不到排班的问题。
- 排班接口放宽部门经理/副经理数据过滤，允许查看与删除全量排班记录。
- 排班权限兜底支持角色名含“经理”的账号。
- 排班前端权限判断增加“角色名含经理”兜底。
- 操作岗侧边栏新增“设备保养”入口，并放开设备保养路由对操作岗可见。
- 设备保养分配：执行人下拉按“计划保养日期”当天排班动态加载。
- 修复 menuConfig 菜单文案乱码并统一为 UTF-8 中文显示。
- 修复设备保养分配页 watcher 初始化顺序导致的脚本报错。
- 设备保养任务详情：保养周期从任务记录/计划兜底，标准完整展示；新增耗材/配件表格并去除保养结果相关字段。
- 设备保养任务新增验收环节：完成后进入待验收，站长/部门副经理/部门经理可评分验收。
- 设备保养任务详情顶部新增状态流转图（待执行→进行中→待验收→已验收）。
- 设备故障维修验收支持“退回重做”。
- 设备故障列表新增状态筛选（含退回重做）。
- 排班页移除临时调试信息展示。
- 设备保养分配：保养计划下拉按场站+设备+周期聚合，选择后展示计划内标准清单。
- 安全自检页面优化：今日状态卡片拆分为“基本工作/操作”两行，历史工作性质统一用“、”分隔。
- 人员安全自检场站下拉：站长角色优先使用用户管理绑定场站列表。
- 人员安全自检“工作性质”筛选：支持数组/字符串/单值，避免筛选不出记录。
- 后端自检列表 workTypeId 筛选改为 JSON_CONTAINS。
- 安全他检选择非默认工作性质后，检查项改为通过 /safety-check-items/by-work-types 拉取。
- 安全他检列表接口补充站点关联，表格“场站”列可正常显示。
- 安全他检列表：若记录未保存站点，按被检查人当日排班补站点显示。
- 修复他检接口权限配置：POST /other-inspections 增加部门经理/副经理权限。
- 岗位工作-人员岗位管理：岗位筛选改为模糊匹配（单字命中）。
- 临时工作列表表头与任务库对齐，新增“具体工作内容”。
- 设备故障 Tab 默认选中修复：侧边栏进入后不再折叠。
- 设备故障“新增报障”按钮补回文字显示。
- 设备故障“紧急程度”下拉文案修复为 低/中/高/紧急。
- 设备故障上报信息“场站”“设备编号”必填。
- 设备故障表单修复乱码标题与按钮文字。
- 设备故障耗材/配件改为单独一行展示。
- 设备故障已派单步骤显示绿色勾。
- 设备故障派单按钮文案改为“提交派单”。
- 设备故障上报表单“保存草稿”乱码修复。
- 设备故障列表“维修人员”列：负责人/配合人同时存在时按“负责人、配合人”显示。
- 组织架构-场站管理新增：请求改为发送 stationName，修复“场站名称不能为空”。
- 人员安全自检场站下拉：修复获取场站列表时未取分页 list 导致下拉为空。
- 卫生区域划分“搜索场站/责任区”改为可输入+下拉选择。
- 卫生任务分配“搜索场站/岗位/责任区”改为可输入+下拉选择。
- 卫生他检新增筛选框（场站/被检查人/岗位/责任区），表格新增“场站”列。
- 卫生他检场站下拉选项空值保护，修复 station.id 读取报错。
- 卫生他检补充 reactive 引入与场站下拉选项结构。
- 卫生他检筛选栏增加间距，被检查人/岗位/责任区筛选改为可下拉可输入。
- 安全他检新增工作性质筛选（多选），后端 JSON_CONTAINS 过滤。
- 安全他检筛选栏移除“查询”按钮，内容变更自动刷新，保留“重置”。
- 人员安全自检/人员卫生自检/卫生他检筛选栏移除“查询”按钮，筛选变更自动刷新。
- 临时工作任务库新增筛选栏（任务名称/场站）并支持按场站过滤。
- 临时工作任务库新增批量删除（表格勾选 + 批量删除按钮）。
- 临时工作任务库勾选修复：行键改为稳定 _rowKey。
- 临时工作列表内任务库 Tab 同步支持勾选与批量删除。
- 设备故障列表新增“场站”列与筛选：场站/设备名称/紧急程度/维修人员。
- 设备故障表格支持横向滚动条，操作列加宽。
- 设备故障详情“维修负责人”必填。
- 登录失败（/auth/login 401）提示改为“用户名或密码错误，请重新输入”。
- 安全隐患新增：resolvedStationId 解析与校验修复，修复 500。
- 安全隐患“发起时间”显示到分钟（HH:mm）。
- 安全隐患创建时间改用本地时区（UTC+8）。
- 人员安全自检页面权限开放给 safety_inspector。
- 安全员可查看安全他检与卫生他检全量记录（前端不再默认带 currentStationId）。
- 安全他检日期范围默认空。
- 卫生模块权限对安全员开放：人员卫生自检可见，卫生他检不默认绑定当前场站。
- 消息通知：新增消息管理页面（/notifications），右上角仅保留最近 10 条未读提醒，卡片点击跳转对应模块。
- 消息提醒权限规则：安全隐患/他检/卫生他检/临时任务/设备故障按角色/关联人过滤提醒。
- 菜单配置重写为 UTF-8，修复 Vite 解析报错；“消息通知”固定在侧边栏底部（帮助与反馈上方）。
- PLC 记录：新增 /plc-records 页面、菜单与权限；后端提供 /api/plc/upload、/api/plc/records、/api/plc/files/scan。
- 用户管理：新增当月排班场站显示（scheduleStations），从排班动态计算。
- 排班页自检/他检详情 UI：分组卡片 + 弹窗详情，显示完成/异常数与完成时间（HH:mm）。
- 设备保养“保养弹窗”：耗材/配件表格新增按钮右对齐与横向滚动（代码已改，若未生效需重建前端）。

### 安全隐患模块重构（2025-12-27）
**功能：重构安全隐患流程，实现安全员发起→站长整改→安全员复核的完整流程**

**状态流转调整：**
- 原状态：pending(待整改) → processing(整改中) → completed(已完成)
- 新状态：pending(待整改) → rectified(已整改) → reviewed(已复核)

**数据库新增表：**
- hazard_categories - 隐患类别库
  - id, category_name, sort_order, is_system, status, created_at, updated_at
  - 预置10个类别：电气、违规违纪、标识、基础设施、环境卫生、机械设备、特种作业、制度文件、消防、特种设备
  - 支持动态新增类别
- hazard_root_causes - 根本原因库
  - id, cause_name, sort_order, is_system, status, created_at, updated_at
  - 预置10个原因：人的不安全行为、物的不安全状态、职责不清、人岗匹配、工作流程、工作标准、工作执行、设计缺陷、劳动防护用品配备不足、安全设施建设投入不足
  - 支持动态新增原因

**数据库表结构调整：**
- safety_hazard_inspections：新增 submit_time、station_id；status 改为 pending/rectified/reviewed。
- safety_rectifications：新增 handler_id/handler_name；root_cause 改为可配置文本。

**后端新增：**
- models/HazardCategory.js、models/HazardRootCause.js
- controllers/hazardConfigController.js（类别/原因增删改查）
- outes/index.js 新增隐患配置路由

**前端新增/修改：**
- pi/hazardConfig.js
- iews/inspection/SafetyRectification.vue 重构（发起信息/整改信息/详情流转图）

**业务流程：**
1. 安全员发起隐患 → 状态“待整改”，通知站长
2. 站长填写整改信息 → 状态“已整改”，通知被处罚人
3. 安全员复核 → 状态“已复核”

**权限控制：**
- 安全员：新增隐患、编辑隐患、删除隐患（仅待整改状态）、复核整改
- 站长：填写整改信息（仅待整改状态）
- 隐患类别新增：安全员
- 根本原因新增：站长、部门经理、部门副经理

**迁移脚本：**
- database/migration_safety_hazard_refactor.sql

### 组织架构管理功能（2025-12-27）
**功能：系统管理员新增“场站”和“部门”的增删改管理**
- 后端新增：department create/update/delete 接口
- 前端新增：pi/department.js、iews/system/OrganizationManagement.vue
- 场站管理标签：列表/搜索/新增/编辑/删除
- 部门管理标签：列表/搜索/新增/编辑/删除（有用户时提示无法删除）
- 路由：/organization-management（仅 admin）

### 重建安全自检/安全他检模块（2025-12-26）
**新架构：工作性质 + 检查项目**
- 工作性质（SafetyWorkType）：可设置默认必选
- 检查项目（SafetyCheckItem）：每项包含名称与标准

**数据库新增：**
- safety_work_types
- safety_check_items

**后端新增：**
- models/SafetyWorkType.js、models/SafetyCheckItem.js
- 安全工作性质/检查项管理接口
- /safety-check-items/by-work-types

**前端调整：**
- 自检按工作性质分组展示
- 检查项默认不预选，必须手动选择
- 选择“否”后支持上传照片与填写备注

### 设备保养岗位分配模块重构（2026-01-01 已完成）
**目标：将设备保养从派单模式改为岗位分配模式**

**数据库新增表：**
- maintenance_position_plans（岗位-保养计划关联）
  - id, station_id, position_name, plan_id, created_at, updated_at
- maintenance_work_records（员工保养工作记录）
  - record_code, station_id, plan_id, position_name, equipment_code/name
  - cycle_type, work_date, executor_id/name, maintenance_items(JSON)
  - maintenance_tools, work_hours, consumables_list(JSON), parts_list(JSON)
  - status(pending/completed), submit_time

**新增字段：**
- maintenance_plan_library：weekly_day、monthly_day、yearly_month、yearly_day
- cycle_type 增加 'daily' 选项

**后端新增：**
- models/MaintenancePositionPlan.js、MaintenanceWorkRecord.js
- controllers/maintenancePositionController.js
- 路由：/maintenance-position-plans、/maintenance-work-records 系列

**前端新增/修改：**
- api/maintenancePosition.js
- views/maintenance/EquipmentMaintenance.vue：日保养、周期调度、岗位分配Tab、工作记录Tab
- views/maintenance/MaintenanceTask.vue（新增）：员工今日保养任务入口
- router/index.js、config/menuConfig.js：新增路由和菜单

**业务流程：**
1. 管理员创建保养计划并设置周期调度
2. 管理员将保养计划分配给岗位
3. 员工在"保养任务"页面看到当日任务并填写提交
4. 管理员在"保养工作记录"Tab查看员工提交的记录

**迁移脚本：** database/migration_maintenance_position_assignment.sql
## 角色菜单/首页（摘要）
- 操作岗：首页显示今日自检/固定任务/排班表；快捷操作：排班表/安全自检/卫生自检/固定任务/设备故障。
- 维修岗：首页显示今日自检/设备故障；快捷操作：安全自检/设备故障。
- 站长：首页显示今日自检/岗位工作/设备故障；卫生检查改名；侧边栏岗位现场工作改名为“岗位工作”。
- 部门经理/副经理：首页显示安全检查/卫生检查/排班表。
- 安全员：首页显示安全检查/卫生检查/安全隐患；快捷操作：安全自检/卫生自检/安全隐患。
- 系统管理员：快捷操作：用户管理/组织架构。
- 甲方：首页显示设备保养/数据报表。
- 高层：首页显示安全检查/卫生检查/排班表。

## 接口清单（全量，自动提取）
- POST /api/approval/maintenance/:id
- GET /api/approval/pending
- POST /api/approval/rectification/:id
- POST /api/approval/repair/:id
- POST /api/approval/requisition/:id
- POST /api/approval/task-hours/:id
- POST /api/approval/task-hours/batch
- GET /api/approvals
- PUT /api/approvals/:id/approve
- PUT /api/approvals/:id/reject
- PUT /api/approvals/batch-approve
- PUT /api/approvals/batch-reject
- GET /api/approvals/pending
- PUT /api/auth/change-password
- PUT /api/auth/context
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
- GET /api/companies
- POST /api/companies
- DELETE /api/companies/:id
- PUT /api/companies/:id
- GET /api/companies/all
- GET /api/daily-tasks
- GET /api/daily-tasks/my
- POST /api/daily-tasks/submit
- GET /api/daily-tasks/summary
- GET /api/departments
- POST /api/departments
- DELETE /api/departments/:id
- PUT /api/departments/:id
- GET /api/equipment
- POST /api/equipment
- DELETE /api/equipment/:id
- PUT /api/equipment/:id
- POST /api/equipment/batch
- GET /api/equipment/by-code
- POST /api/equipment/import
- GET /api/equipment/template
- GET /api/fault-reports
- POST /api/fault-reports
- POST /api/fault-reports/:id/assign
- POST /api/feedback
- GET /api/hazard-categories
- POST /api/hazard-categories
- DELETE /api/hazard-categories/:id
- PUT /api/hazard-categories/:id
- GET /api/hazard-inspections
- POST /api/hazard-inspections
- DELETE /api/hazard-inspections/:id
- PUT /api/hazard-inspections/:id
- GET /api/hazard-root-causes
- POST /api/hazard-root-causes
- DELETE /api/hazard-root-causes/:id
- PUT /api/hazard-root-causes/:id
- GET /api/hygiene-areas
- POST /api/hygiene-areas
- DELETE /api/hygiene-areas/:id
- PUT /api/hygiene-areas/:id
- GET /api/hygiene-points
- POST /api/hygiene-points
- DELETE /api/hygiene-points/:id
- PUT /api/hygiene-points/:id
- GET /api/hygiene-position-areas
- POST /api/hygiene-position-areas
- DELETE /api/hygiene-position-areas/:id
- GET /api/hygiene-position-areas/by-position
- GET /api/ic-cards
- POST /api/ic-cards
- PUT /api/ic-cards/:id/disable
- GET /api/ic-cards/verify/:cardId
- GET /api/inbound
- POST /api/inbound
- GET /api/inventory
- GET /api/maintenance-assignments
- POST /api/maintenance-assignments
- DELETE /api/maintenance-assignments/:id
- PUT /api/maintenance-assignments/:id
- PUT /api/maintenance-assignments/:id/complete
- PUT /api/maintenance-assignments/:id/start
- POST /api/maintenance-assignments/:id/verify
- GET /api/maintenance-plan-library
- POST /api/maintenance-plan-library
- DELETE /api/maintenance-plan-library/:id
- PUT /api/maintenance-plan-library/:id
- POST /api/maintenance-plan-library/batch-import
- GET /api/maintenance-plans
- POST /api/maintenance-plans
- DELETE /api/maintenance-plans/:id
- PUT /api/maintenance-plans/:id
- GET /api/maintenance-position-plans
- POST /api/maintenance-position-plans
- DELETE /api/maintenance-position-plans/:id
- GET /api/maintenance-records
- POST /api/maintenance-records
- GET /api/maintenance-work-records
- POST /api/maintenance-work-records
- GET /api/maintenance-work-records/:id
- GET /api/maintenance-work-records/today-tasks
- GET /api/material-requisitions
- POST /api/material-requisitions
- GET /api/notifications
- DELETE /api/notifications/:id
- PUT /api/notifications/:id/read
- PUT /api/notifications/read-all
- GET /api/notifications/unread-count
- GET /api/other-inspections
- POST /api/other-inspections
- GET /api/outbound
- POST /api/outbound
- GET /api/permissions
- POST /api/plc/files/scan
- GET /api/plc/records
- POST /api/plc/upload
- GET /api/position-jobs
- POST /api/position-jobs
- DELETE /api/position-jobs/:id
- PUT /api/position-jobs/:id
- GET /api/position-jobs/by-position
- POST /api/position-jobs/import
- GET /api/position-jobs/positions
- GET /api/position-jobs/template
- GET /api/position-tasks
- POST /api/position-tasks
- GET /api/position-work-logs
- POST /api/position-work-logs
- GET /api/position-work-logs/today-tasks
- GET /api/position-work-logs/user
- GET /api/prices
- POST /api/prices
- DELETE /api/prices/:id
- PUT /api/prices/:id
- GET /api/prices/all
- GET /api/prices/categories
- GET /api/repair-records
- POST /api/repair-records
- DELETE /api/repair-records/:id
- GET /api/repair-records/:id
- PUT /api/repair-records/:id
- POST /api/repair-records/:id/complete
- POST /api/repair-records/:id/dispatch
- POST /api/repair-records/:id/start
- POST /api/repair-records/:id/submit
- POST /api/repair-records/:id/verify
- GET /api/reports/inbound
- GET /api/reports/inventory
- GET /api/reports/maintenance
- GET /api/reports/outbound
- GET /api/reports/repair
- GET /api/reports/safety
- GET /api/reports/schedule
- GET /api/reports/temporary-tasks
- GET /api/reports/work-hours
- GET /api/roles
- POST /api/roles
- DELETE /api/roles/:id
- PUT /api/roles/:id
- GET /api/roles/:id/permissions
- GET /api/safety-check-items
- POST /api/safety-check-items
- DELETE /api/safety-check-items/:id
- PUT /api/safety-check-items/:id
- POST /api/safety-check-items/batch
- GET /api/safety-check-items/by-work-types
- POST /api/safety-check-items/import
- GET /api/safety-check-items/template
- GET /api/safety-rectifications
- POST /api/safety-rectifications
- PUT /api/safety-rectifications/:id
- PUT /api/safety-rectifications/:id/review
- GET /api/safety-work-types
- POST /api/safety-work-types
- DELETE /api/safety-work-types/:id
- PUT /api/safety-work-types/:id
- GET /api/schedules
- POST /api/schedules
- DELETE /api/schedules/:id
- POST /api/schedules/batch
- POST /api/schedules/batch-delete
- GET /api/schedules/export-my
- GET /api/schedules/my
- GET /api/schedules/today
- GET /api/self-inspections
- POST /api/self-inspections
- GET /api/self-inspections/my
- GET /api/self-inspections/overdue
- GET /api/stations
- POST /api/stations
- DELETE /api/stations/:id
- GET /api/stations/:id
- PUT /api/stations/:id
- GET /api/stations/:id/users
- GET /api/stations/all
- GET /api/task-configs
- POST /api/task-configs
- DELETE /api/task-configs/:id
- PUT /api/task-configs/:id
- GET /api/temporary-task-library
- POST /api/temporary-task-library
- DELETE /api/temporary-task-library/:id
- PUT /api/temporary-task-library/:id
- POST /api/temporary-task-library/batch-import
- GET /api/temporary-tasks
- POST /api/temporary-tasks
- DELETE /api/temporary-tasks/:id
- PUT /api/temporary-tasks/:id
- PUT /api/temporary-tasks/:id/complete
- PUT /api/temporary-tasks/:id/start
- POST /api/upload
- POST /api/upload/multiple
- GET /api/users
- POST /api/users
- DELETE /api/users/:id
- GET /api/users/:id
- PUT /api/users/:id
- PUT /api/users/:id/reset-password
- POST /api/users/:id/stations
- POST /api/users/batch-import
- GET /api/warehouses
- POST /api/warehouses
- PUT /api/warehouses/:id

## 验证步骤
- 登录 admin/admin123，首页不再弹“资源不存在/认证失败”。
- 用户管理中编辑 operator1，保存后表格显示姓名/岗位/所属场站。
- 所属场站下拉显示名称而非数字。
- 审批列表与待审统计正常返回。

## 常用命令
`ash
cd "C:\Users\LiLei\Desktop\运行项目APP\waste-management-system"

# 启动
docker-compose up -d

# 开发模式（热更新）
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

# 重建
docker-compose up -d --build

# 日志
docker logs wms-backend --tail 50
`

## 访问地址
- 前端：http://localhost
- 后端：http://localhost:3000
- MySQL：localhost:3307

## 测试账号
- admin / admin123
- operator1 / admin123
- station_mgr / admin123
- maintenance1 / admin123

## 备注
- 数据库与连接统一使用 utf8mb4。
- 乱码根因：部分前端文件被以错误编码（如 GBK/Latin1）读写或二次解码导致文本损坏。
- 根目录脚本：
  - update_stations.sql
  - update_schema.sql
  - update_approval_tables.sql
  - update_inspection_fault_tables.sql
- 此版本为“恢复重建版”，若需继续补充历史细节请告知。
