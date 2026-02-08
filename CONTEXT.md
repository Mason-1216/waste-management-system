【编码要求】本文件必须使用UTF-8保存与写入，禁止使用其它编码。
# 运行项目管理系统 - 上下文摘要
> 最后更新 2026-02-07

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
- 新增积分统计页面与接口：侧边栏排班表下方入口（仅开发测试角色可见），按日期+人员汇总所有积分来源，默认近7天并支持姓名模糊筛选。积分来源包括：安全自检/他检（从工作性质积分汇总）、卫生自检/他检（从责任区积分汇总）、维修任务（从维修任务库积分计算）、保养工作（按合格项数量计算）、岗位工作（固定/派发/自行申请）、扣分（审核扣分）。接口 GET /api/reports/points-summary 支持日期范围和姓名筛选，返回按日期+人员维度汇总的积分明细与总计。
- 安全检查项目管理改为一体化表单：新增/编辑工作性质时可直接维护父子项与触发值，列表新增类型/父项/触发列并在工作性质名称显示积分。
- 安全自检/他检子项展示修复：父项未选择“是/否”时不显示子项。
- 安全自检拆分：安全自检页仅保留“我的安全自检”并新增积分列；员工检查记录合并人员自检与他检，新增检查性质/积分列并支持他检奖励/扣除积分。
- 安全检查项目子项编辑行优化：触发选择前置，保留“选择：是/否”提示，禁用文案不显示。
- 安全检查项目管理列表改为标题前下箭头折叠/展开，收起时显示“X项”。
- 排班日历支持同日多岗位展示（我的排班/人员日历）。
- 管理层排班表同日多岗时“班”字橙色提示。
- 排班日历相邻日期岗位不同自动切换颜色。
- 前端路由按业务模块拆分，新增 router/modules 统一装配，保持路径与权限不变。
- 前端菜单配置按角色拆分为独立模块，并保留 menuConfig 出口。
- 前端新增 api/index.js 聚合出口，便于按模块调用。
- 前端 store 拆分为 store/modules，并保留原有导出路径。
- 前端抽离通用组件 FilterBar/TableWrapper/TableCard 并全局替换页面使用。
- 前端新增通用上传组件 BaseUpload，并替换页面 el-upload 使用。
- 组织架构管理页面的场站/部门/公司/角色弹窗统一为 FormDialog 组件。
- 用户管理新增/编辑弹窗统一为 FormDialog 组件。
- 单价管理新增/编辑弹窗统一为 FormDialog 组件。
- 卫生工作安排的责任区/点位/分配弹窗统一为 FormDialog 组件。
- 安全检查项目管理的工作性质/检查项弹窗统一为 FormDialog 组件。
- 岗位工作任务库新增/编辑弹窗统一为 FormDialog 组件。
- 表单弹窗进一步统一：排班、设备、临时任务、维修故障、自检/他检、隐患与导入预览等页面改用 FormDialog，并扩展 FormDialog 支持透传属性与自定义 footer。
- 排班：入口拆分为“我的排班/排班管理”，管理入口限制角色；日历颜色按当天完整排班组合计算；站名/岗位显示分隔符调整为“-”。
- 岗位工作：任务库/完成记录权限扩展到 operator 等；任务库新增导出与批量删除；派发任务数量校验更严格；扣分值允许为 0。
- 安全检查项目：导入模板新增“排序”列，示例补“否”触发；创建/导入时若存在子项自动开启父项联动。
- 设备保养：页面样式统一（页头+筛选卡片+表格），记录列表空数据防御。
- 设备保养：修复保养工作/保养工作记录/保养计划/保养计划岗位分配进入即报错（页面加载失败）。
- 设备保养：保养计划岗位分配筛选项与表头一致。
- 设备保养：保养工作记录新增积分列（仅计合格项，完成后显示积分），筛选项与表头一致。
- 设备保养：保养工作记录积分列紧跟保养周期，设备名称列宽固定并超长省略，列宽更均匀。
- 设备保养：保养计划按设备编号分页，默认每页 5 条。
- 设备保养：保养工作页移除页头日期与刷新按钮，日保养卡片上方右侧显示日期（卡片外）。
- 前端新增上传配置 composable（useUpload），统一 uploadUrl/uploadHeaders。
- 设备保养/故障耗材与配件表格抽离为 MaintenanceItemTable 组件复用。
- 设备保养任务详情弹窗抽离为 MaintenanceAssignmentDetailDialog 组件复用。
- 设备保养记录详情弹窗抽离为 MaintenanceWorkRecordDetailDialog 组件复用。
- 设备故障详情弹窗抽离为 MaintenanceFaultDetailDialog 组件复用。
- 设备保养计划新增/编辑弹窗抽离为 MaintenancePlanDialog 组件复用。
- 保养任务页复用 MaintenanceWorkRecordDetailDialog 展示验收信息。
- 保养任务菜单合并：移除设备保养入口，保养计划改为单行标准展示并新增积分字段与导入模板支持。
- 侧边栏菜单权限过滤优化：父菜单有权限时保留全部子菜单，修复“保养任务”无下拉项的问题。
- 侧边栏“保养任务”更名为“设备保养”。
- 安全隐患页面补齐 formatDate/formatTime/getStatusType/getStatusText，修复进入即报“页面加载失败”。
- 保养工作支持延期提醒与未完成记录：逾期任务可补填并在保养工作显示延期标记与提示条，周期结束后在工作记录显示“本日/本周/本月/本年未完成”。
- docs/MODULARIZATION_PLAN.md 补充系统全局待拆分清单。
- 进一步细分 schedule/task/inspection/report 模块为更细的子路由文件。
- 路由模块内部细分：保养拆分为 plan/record/fault/repair/library/assignment/position/requisition，设备拆分为 equipment/price，审批拆分为 approvals/notifications，支持拆分为 feedback/upload。
- 后端路由继续细分：保养/设备/审批/支持模块内部再拆分子路由文件。
- 新增统一模块注册器，主路由使用 publicModules/privateModules 注册模块。
- 核心平台路由继续拆分：auth/users/access/org 子模块化。
- 后端路由模块化：新增 PLC 与运维支持（反馈/上传）模块路由注册。
- 修复 /api/maintenance-records 与 /api/fault-reports 500：补齐保养记录与故障上报的用户关联定义。
- 后端路由模块化：新增保养/故障维修模块与设备/单价模块路由注册。
- 设备故障/维修控制器下沉到 maintenance/services，提升模块内服务分层。
- 保养计划/保养记录/领料申请控制器下沉到 maintenance/services，提升模块内服务分层。
- 安全检查配置控制器下沉到 inspection/services/safetyCheckService，控制器改为薄层转发。
- 自检/他检/隐患与卫生管理控制器下沉到 inspection/services，控制器改为薄层转发。
- 审批/通知/报表/设备/单价/反馈/上传控制器下沉到对应模块 services，控制器改为薄层转发。
- 核心平台 auth/user/role/permission/station/department/company 控制器下沉到 core/services，控制器改为薄层转发。
- 保养计划库/分配控制器下沉到 maintenance/services/planLibraryService。
- 任务模块（任务配置/岗位任务/临时任务/临时任务库/岗位工作记录）控制器下沉到 task/services。
- 排班控制器下沉到 schedule/services/scheduleService。
- 保养岗位分配/工作记录控制器下沉到 maintenance/services/positionService。
- 前端卫生自检/他检责任区点位列表抽离为 HygieneAreaChecklist 组件复用。
- 前端安全自检/他检检查项列表抽离为 SafetyCheckItemList 组件复用。
- 报表统计卡片/图表卡片抽离为 ReportSummaryCards 与 ReportChartCard 组件复用。
- 后端路由模块化：新增审批/通知与报表模块路由注册。
- 新增排班聚合接口 /api/schedules/overview，支持日期范围与任务汇总。
- 后端路由模块化：新增岗位/任务模块与安全/卫生模块路由注册。
- 侧边栏“岗位工作”改为子菜单（固定任务/岗位工作任务库/岗位工作完成情况记录），补充新路由与记录页占位，并补齐子菜单权限配置；固定任务/岗位工作任务库改为路由直达视图，不再使用 Tab 组件。
- 权限种子中岗位工作菜单名称修复为：岗位工作/固定任务/岗位工作任务库/岗位工作完成情况记录。
- 新增 .gitignore 并从版本控制移除 dist/node_modules/uploads/logs 与本地 settings.local.json（保留本地文件）。
- 岗位工作积分配置与审核流程：岗位任务库新增任务类别/给分方式/单位积分/数量/积分规则/数量是否可修改/派发任务是否强制审核字段，数量限制 1-1000，单位积分必填允许正负/0。
- 岗位工作记录扩展任务来源与审核状态：固定/派发/自行申请任务，支持派发与申请填报，完成记录可审核（扣分原因+负数扣分值），固定/派发未审自动通过。
- 岗位工作前端重构：固定任务支持数量填报与积分展示；岗位工作任务库支持关键字筛选、申请填报与派发任务；新增岗位工作完成情况记录页用于审核。
- 岗位工作-岗位工作任务库筛选改为按表头字段逐列筛选，分页支持选择每页条数；岗位工作完成情况记录页支持表头逐列筛选与完成情况列，并可按提交/审核时间筛选。
- 岗位工作派发任务提交时，数量不可修改则沿用派发数量。
- 岗位工作完成情况记录菜单与路由权限开放给 operator、station_manager、department_manager、deputy_manager、senior_management（固定任务保持可见）。
- 固定任务页面统一为积分/数量版（与 dev_test 一致），不再对非 dev_test 展示旧简版表格。
- 岗位工作迁移脚本改为 information_schema 判断列是否存在，避免 MySQL 不支持 ADD COLUMN IF NOT EXISTS 语法。
- 临时工作任务库搜索框改为输入即搜索，移动端无需回车。
- 修复表格外横向滑动条在电脑端不可拖拽的问题，支持点击轨道直接拖动，并避免绑定到不可横向滚动的容器。
- 表格滚动条全局统一：自动包裹表格并统一滚动条容器宽度，确保各页面样式一致。
- 岗位工作提交完成状态：前后端统一校验并标准化完成状态，避免提交后被错误标记为未完成。
- 日期范围选择器移动端适配：限制最小宽度并固定日历表格布局，确保手机日历格子完整显示且不影响桌面端。
- 表格滚动条改为仅使用原生滚动条：移除外置自定义条、加粗原生滚动条，并尽量保持水平滚动条常显。
- 表格滚动条去重：隐藏 el-table 内置自定义滚动条，仅保留原生横向滚动条，并统一加粗到 12px。
- 角色菜单权限树同步清理：自动删除权限种子中不存在的旧菜单/模块权限，并清理关联的角色/用户权限记录。
- 侧边栏“数据报表”更名为“维保数据报表”，同步权限名称与页面标题。
- 全局表格自定义滑动条（已取消，改为原生滚动条）：为所有 el-table 增加常驻横向滚动条，拖拽同步真实滚动容器并支持容器切换，滑块高度提升为 12px。
- 排班表移动端横向滚动修正：移除外层容器横向滚动/最小宽度限制，避免滑动条范围不足导致操作列不可见。
- 岗位工作岗位名称编辑：支持重命名确认并同步更新岗位工作项目与排班岗位名，避免编辑后被视为新增。
- 岗位重命名确认弹窗文案改为中文。
- 路由进入自动刷新：生产环境下每次进入新页面强制刷新一次，避免快捷方式进入空白页。
- PWA 自动更新：启用 service worker 自动注册脚本，已安装桌面端可在新版本发布后自动更新并刷新。
- 移动端表格滑动修复加强：边缘手势优先横滑，表头不再显示独立横向滚动条。
- 移动端表格横向滑动防手势冲突：新增全局横向拖拽拦截与 overscroll 处理，避免浏览器右滑返回导致表格锁死。
- Backend startup fix: replaced malformed maintenance controller messages with safe ASCII strings.
- Backend 502 fix: repaired broken strings in maintenance controllers that prevented Node from starting.
- 所有导入模板统一行高 25、字体 12、居中显示与表头底色，列宽按内容自适应；“填写说明”改为“表头/填写说明”两列描述字段含义。
- 保养计划模板示例设备编号调整为 4 位数字。
- Schedule import now switches to the imported month when the current month is not included so records show immediately.
- /api/schedules 支持缺省 year/month 时使用当前年月，参数格式或月份范围非法时返回 400。
- Schedule add user selection: role filter matches base_role_code and station managers are not restricted by station when loading users.
- 修复日期范围选择器开始/结束时间输入框挤压，桌面保持双栏，移动端纵向排列。
- 卫生区域划分导入：支持合并单元格/空白责任区继承，避免责任区空值导致行被跳过。
- 卫生区域划分导入：模板与解析统一使用标准中文表头（场站/责任区/卫生点/工作要求及标准/积分），避免表头乱码导致导入为空。
- 卫生区域划分导入：积分解析更健壮，支持非首行出现的积分值并同步更新。
- 卫生区域划分模板：下载示例积分不再留空，避免误用空积分模板。
- 卫生工作安排页面：场站/责任区/卫生点文案统一，并修复场站与列表数据加载取值，避免下拉无选项。
- 卫生区域划分页：卫生点与工作要求按行对应展示，积分列移动到工作要求及标准之后。
- 卫生区域划分页：责任区下的卫生点拆为独立行显示，并合并责任区层级的场站/积分/操作单元格。
- 卫生区域划分页：新增分页，支持每页 5/10/20 条并按当前页重算合并行。
- 卫生区域划分：分页按责任区数量统计（默认 5/10/20），新增批量删除责任区。
- 卫生任务分配：按所选场站过滤岗位与责任区下拉，岗位列表包含“站长”。
- 卫生区域划分编辑：保存时同步新增/修改/删除卫生点及工作要求，避免编辑后数据不落库。
- 卫生任务分配保存：提交字段使用 hygieneAreaId，修复后端提示“场站不能为空”。
- 卫生任务分配后端：创建岗位责任区时兼容 areaId/hygieneAreaId，避免 400 导致无法绑定多个责任区。
- 卫生自检：自检表单兼容责任区/卫生点字段的驼峰与下划线命名，避免卫生点与标准显示为空。
- 卫生自检：每个责任区照片必传（至少 1 张，上限 3），不合格项需至少 1 张（可任选点位上传），详情支持展示。
- 卫生自检上传：上传完成后同步组件文件列表与 photoUrls，避免手机拍照上传 100% 后图片消失。
- 上传文件类型放宽：支持 webp/heic/heif 图片，允许按扩展名或 MIME 识别，兼容手机拍照与相册上传。
- 上传大小上限提高：Nginx 允许 20MB，后端单文件上限 20MB，并在卫生自检上传失败时提示原因。
- 上传文件访问：后端对 /uploads 路径做静态映射，确保上传后图片可正常访问与预览。
- 图片上传统一处理：所有图片上传组件同步文件列表与响应 URL，避免上传后缩略图消失，失败时统一提示。
- 上传文件命名：当原始文件名无扩展名时按 MIME 补扩展名，避免手机上传后图片预览损坏。
- 卫生他检：责任区/卫生点/工作要求字段兼容驼峰与下划线命名，避免显示为空并修正岗位/责任区匹配。
- 后端卫生责任区更新：场站变更时同步更新卫生点与岗位分配的 station_id。
- 修复历史数据：hygiene_points 的 station_id 同步为所属责任区的 station_id，避免卫生他检无点位。
- 用户认证与权限（JWT）。
- 新增“开发测试”(dev_test) 角色：全量菜单/模块/操作权限、不可删除，并预置账号 sum/605315220。
- 修复 dev_test 模块权限默认值为字符串数组，避免 /api/roles 500。
- 修复 sum 账号密码哈希，恢复 sum/605315220 登录。
- 备份脚本 backup-all.ps1 改为 UTF-8 BOM，PowerShell 可直接运行。
- 后端路由模块化：核心平台与排班路由拆到 backend/src/modules/core/routes.js 与 backend/src/modules/schedule/routes.js。
- 角色菜单、角色首页快捷操作与统计卡片。
- 权限体系细化：permissions 支持 module 类型，新增 user_permissions 表；模块权限按子选项卡拆分（报表/保养/故障/临时工作/岗位工作/自检他检等），用户支持额外允许/禁止权限叠加在基准角色上。
- 用户管理重构（岗位层级、部门、单价管理员、批量导入）。
- 用户导入：仅甲方按填写场站绑定，其他角色导入时忽略场站。
- 用户管理新增：基准角色必选，权限树自动勾选基准角色权限，支持在菜单/模块树中直接加/减个人权限。
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
- 数据报表页面切换为“设备保养统计/设备维修统计”，含场站+日期筛选、设备排行、状态分布、周期完成率、年度趋势与 Excel 导出。
- 数据报表代码整理：拆分图表渲染函数、移除调试日志、统一导出文案，保持现有业务逻辑不变。
- 新增文档：docs/PROJECT_OVERVIEW.md（项目功能与依赖说明）、docs/USER_GUIDE.md（面向新手的使用说明）。
- 文档新增：docs/MODULARIZATION_PLAN.md（模块化拆分与迁移路径）。
- 模块化文档补充排班聚合看板接口草案。
- 前端路由移除进出料/库存模块（/inbound、/outbound、/inventory）以彻底隐藏该模块。
- 后端彻底移除进出料/库存模块：删除相关路由、控制器、模型（Warehouse/IcCard/InboundRecord/OutboundRecord）及报表接口。
- 全局样式适配：统一筛选/搜索区域自适应宽度，表格取消固定列（冻结窗格），表单/分页/弹窗在移动端自动纵向布局，防止窄屏显示不全。
- 全局样式增强：列表横向滚动更顺滑、弹窗内容超高自动滚动，筛选框最小宽度提升，基础字号与行高调整为更舒适的阅读体验。
- PLC 可视化报表修复：报表接口返回结构解析调整，避免前端拿不到数据；用量排名图改为横轴监控点名称、纵轴用量。
- 移动端表格体验：移除前端操作列固定列配置，补充表格滚动容器的横向滚动兜底，避免右侧列缺失与刷新后无法横向滑动。
- PLC 报表修复：可视化报表改回正确的接口返回解析，修复图表无数据；补齐用量/数值轴标题并调整 PLC 报表筛选控件最小宽度。
- PLC 报表默认筛选：管理类默认查看全部场站，站长/甲方默认本场站；移除 PLC 数据报表筛选控件固定宽度，使用自适应最小宽度。
- 全局筛选条宽度统一：为 filter-bar/filter-form/search-form/table-toolbar 内的筛选控件设置统一最小宽度与自适应布局，避免筛选项过短。
- 移动端表格与标签卡滚动优化：用户管理操作列按钮改为弹性布局避免错行，组织架构表格与标签卡支持横向手势滑动。
- 移动端滑动锁死修复：表格滚动容器改为支持横纵滑动触控，避免在表格上上下滑动后锁死。
- 移动端表格交互优化：表格滚动容器取消纵向滚动捕获，避免多次滑动后锁死；用户管理表格进入/切换时强制布局刷新避免空白。
- 移动端展示修复：排班表去固定列以支持横向滚动；日期范围选择器改为纵向布局防止右侧日历被挤压；卫生区域划分标题不折行；PLC 报表图表与按钮间距与高度在窄屏下优化。
- 后端新增报表接口：/api/reports/maintenance-by-month 与 /api/reports/repair-by-month（按设备/年/场站返回月度次数）。
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
- 设备保养→保养计划列表补充保养标准/保养规范/检查时间列，并支持批量删除。
- 保养计划模板与导入支持周/月/年检查时间字段，导入保养标准/规范不丢失。
- 保养计划模板填写说明：保养周期用全称（日保养/周保养/月保养/年保养），周/月/年检查说明同步全称。
- 设备保养保养计划批量删除表格增加 row-key，修复选择行不稳定问题。
- 批量删除补充 fallback 逻辑，避免选择行无计划ID导致无法删除。
- 批量删除进一步扩展 groupKey/设备信息兜底，避免选择行缺少周期/ID时仍提示无可删除计划。
- 设备保养保养计划批量/单条删除：补充从行/分组兜底提取计划ID，避免勾选后仍提示未选择或删除无效。
- 设备保养保养计划删除：当行内未带计划ID时自动回查接口匹配设备信息，避免“未识别到可删除计划”。
- 设备保养保养计划导入：后端支持按场站名/ID解析并按检查日推断周期，缺失场站名时对站长角色回退到当前场站；补齐 plan 模型的 cycle_type 并在列表接口为旧数据推断周期；前端导入提示展示成功/失败与示例错误。
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
- 卫生工作安排：前端 API 引用统一到 hygieneManagement，修复构建时缺失 hygienePoint/hygieneArea/hygienePositionArea 导致的前端镜像构建失败。
- 卫生工作安排：岗位下拉接口引用修正为 positionJob，修复构建时缺失 position API。
- 卫生工作安排：后端 HygieneArea 关联别名调整为 hygienePoints，并在卫生管理接口中映射 points/areaPoints 字段，修复后端启动报错与 502。
- 安全工作性质/卫生责任区：补齐数据库 points 字段（migration_add_points_fields.sql 已执行），修复 safety-work-types 500。
- 卫生工作安排：新增 permissions 菜单项 menu:/hygiene-work-arrangement 并同步角色权限，恢复侧边栏显示。
- 移动端故障上报表单：输入控件改为纵向布局并全宽显示，避免表单折叠。
- 排班视图：周/日历网格改用 minmax(0, 1fr) 并补充宽度/盒模型，避免周日列溢出卡片。
- 卫生工作安排导入：站点列表改用 /stations/all 并统一 name 映射，修复导入提示“场站不存在”。
- 数据权限：部门副经理/部门经理/高层统一放开为全场站数据（station_manager 保持本场站）。
- 设备故障弹窗：限制弹窗本体横向滚动，日期时间字段不再需要右拉；仅耗材/配件表格保留横向滚动。
- PLC 可视化报表：移动端筛选控件宽度下调，避免筛选框过大。
- 设备保养分配：保养计划下拉按场站+设备+周期聚合，选择后展示计划内标准清单。
- 设备保养：站长/操作岗/甲方按所属场站过滤，站长/操作岗跟随当前场站上下文，甲方固定所属场站。
- 设备保养后端：保养计划/分配/岗位分配/工作记录列表对站长/操作岗按当前场站过滤、甲方按固定所属场站过滤。
- 设备保养后端：站长/操作岗优先使用请求头 X-Station-Id 匹配所属场站过滤。
- 设备保养后端：当前场站仅在用户已绑定场站内生效，避免历史场站越权。
- 安全自检页面优化：今日状态卡片拆分为“基本工作/操作”两行，历史工作性质统一用“、”分隔。
- 人员安全自检场站下拉：站长角色优先使用用户管理绑定场站列表。
- 人员安全自检“工作性质”筛选：支持数组/字符串/单值，避免筛选不出记录。
- 后端自检列表 workTypeId 筛选改为 JSON_CONTAINS。
- 安全他检选择非默认工作性质后，检查项改为通过 /safety-check-items/by-work-types 拉取。
- 安全他检列表接口补充站点关联，表格“场站”列可正常显示。
- 安全他检列表：若记录未保存站点，按被检查人当日排班补站点显示。
- 修复他检接口权限配置：POST /other-inspections 增加部门经理/副经理权限。
- 岗位工作-岗位工作任务库：岗位筛选改为模糊匹配（单字命中）。
- 临时工作列表表头与任务库对齐，新增“具体工作内容”。
- 设备故障 Tab 默认选中修复：侧边栏进入后不再折叠。
- 设备故障“新增报障”按钮补回文字显示。
- 设备故障“紧急程度”下拉文案修复为 低/中/高/紧急。
- 设备故障上报信息“场站”“设备编号”必填。
- 设备故障上报补齐 project_id（默认 lastProjectId 或 0），修复 /api/fault-reports 400。
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
- PLC 菜单权限补齐：新增“PLC 数据报表/可视化报表”菜单权限，默认分配给管理类角色（含安全员/高层），侧边栏 PLC 监控下显示三项子菜单。
- PLC 数据报表接口修复：累计报表 SQL 使用保留字 alias 导致 500，已更名并映射到前端使用的用量字段。
- PLC 数据报表/可视化报表前端空白问题修复：接口返回对象被错误当作 res.data 导致表格/图表无数据，已改为直接使用接口对象并重建前端镜像。
- PLC 数据报表/可视化报表增强：支持日/周/月/年粒度与默认当月时间范围，按角色自动限制场站（站长/甲方仅本场站，管理角色全量），排名取当前筛选场站前 10；可视化趋势/极值图支持粒度切换，波动型最小/平均/最大柱线样式调整。
- PLC 数据报表：为避免 Vue 组件更新时的 DOM 插入异常，页面路由关闭过渡动画。
- PLC 数据报表：禁用自定义表格滚动条注入，避免 DOM 变更导致 insertBefore 运行时错误。
- Fix frontend build chunking: keep @vue packages in vue-core to avoid element-plus <-> vue-core cycle that caused blank page error.
- 用户管理：新增当月排班场站显示（scheduleStations），从排班动态计算。
- 排班页自检/他检详情 UI：分组卡片 + 弹窗详情，显示完成/异常数与完成时间（HH:mm）。
- 设备保养"保养弹窗"：耗材/配件表格新增按钮右对齐与横向滚动（代码已改，若未生效需重建前端）。
- 设备保养：保养工作/保养工作记录/保养计划/保养计划岗位分配页面样式统一（页头与内容容器一致）。
- 设备保养四个页面统一为页头+筛选卡片+表格布局；保养工作记录列表加载增加空数据防御，避免组件错误提示。
- 设备保养隐藏 tabs 时移除边框与背景，保养工作卡片不再额外套白色容器；全局捕获错误补充 console 输出便于定位。
- 操作岗侧边栏排班表菜单路径调整为 /schedule，避免权限过滤导致不显示。
- 安全检查项目支持父子联动：新增 parent_id/enable_children/trigger_value 字段与迁移，管理页可配置父级/触发值，导入模板与导入逻辑同步支持。
- 安全检查项目联动补强：父项支持“启用子项联动”开关（默认否），子项可按“是/否”触发显示；导入/批量/单个新增子项时自动启用父项联动；导入模板新增“排序”列，未填按导入顺序排序。
- 安全检查项目导入模板示例补充“否”触发的子项示例。
- 安全自检/他检按联动规则展示子项，父项变化时清空隐藏子项，仅提交可见项；“不合格”文案统一改为“异常”。
- 修复安全隐患整改页面构建错误：补回 decodeMojibake 方法，避免 “return outside of function” 报错。
- 设备故障页面拆分为侧边栏子菜单“设备维修记录/设备管理”，原“设备故障”标签更名为“设备维修记录”。
- 设备故障“新增报障”维修信息新增工作内容（多条）与任务库调取，任务选择后积分逐项展示并按任务库设置控制可编辑，保存/提交同步落库。
- 设备维修记录详情（验收/查看）维修信息在任务表格下新增任务数与任务积分合计展示，列表新增“任务积分合计”列用于快速浏览。
- 设备故障详情“任务库调取”表格改为单位积分+数量展示，单位积分默认不可修改；数量按任务库“数量是否可修改”控制，任务积分合计按单位积分×数量统计。
- 设备故障新增“维修任务库”子菜单，复用岗位工作任务库表头并支持组合筛选。
- 岗位工作任务库新增“积分是否可修改”配置，维修任务库积分编辑按该字段控制。
- 维修任务库独立为全场站通用任务库（repair_task_library），不再复用岗位工作任务库；列表与调取弹窗移除场站/岗位字段与筛选，导入模板同步调整。
- 维修任务库保留批量删除功能，支持多选任务批量清理。
- 维修任务库新增“数量/数量是否可修改”字段，列表/弹窗/导入模板同步扩展。
- 设备故障“新增报障”按钮权限判断改为基于基础角色，移动端与自定义角色可正常显示。
- 维修任务库新增导入模板文件（docs/templates/repair_task_library_import_template.xlsx），并完成批量导入/批量删除验证。
- 维修任务库模板下载改为读取后端 templates/repair_task_library_import_template.xlsx 文件，保持与表头模板一致。
- 维修任务库导入模板工作表名称改为中文“维修任务模板”。
- 维修任务库导入模板新增“填写说明”工作表，包含表头/填写说明两列提示。
- 维修任务库“填写说明”补充示例与格式要求（必填/选填、可用值、示例）。
- PLC 服务容器移除固定命名，避免重建冲突。

### PLC 监控微服务与 Docker 优化（2026-01-18）
**功能：新增独立 PLC Python 微服务，支持 PLC 数据采集与监控**

**Docker 多服务架构：**
- mysql: MySQL 8.0 数据库，端口 3307
- plc-service: Python Flask PLC 微服务，端口 5001
- backend: Node.js Koa 后端，端口 3000
- frontend: Nginx 前端，端口 80

**Docker 镜像优化（中国镜像加速）：**
- plc-service/Dockerfile: 使用 docker.m.daocloud.io/library/python:3.11-slim
- pip 源: https://pypi.tuna.tsinghua.edu.cn/simple
- npm 源: https://registry.npmmirror.com
- Docker Desktop registry-mirrors 配置: DaoCloud/阿里云/1Panel

**数据库新增表：**
- plc_categories - PLC 数据分类
  - id, category_name, category_code, data_source, read_interval, enabled, created_at, updated_at
- plc_monitor_configs - PLC 监控点配置
  - id, category_id, point_name, point_code, data_type, unit, min_value, max_value, enabled
- plc_readings - PLC 历史数据
  - id, config_id, value, quality, read_time, created_at

**数据库表结构修改：**
- permissions 表: resource_type ENUM 新增 'module' 值（原仅 menu/button/api）

**后端新增：**
- models/PlcCategory.js、PlcMonitorConfig.js、PlcReading.js
- controllers/plcMonitorController.js
- services/plcBridgeService.js（后端与 PLC 微服务通信）
- 依赖新增: axios

**前端新增：**
- api/plcMonitor.js
- views/plc/PlcRealtimeMonitor.vue - 实时监控
- views/plc/PlcHistoryView.vue - 历史数据
- views/plc/PlcMonitorConfigView.vue - 监控配置
- views/plc/PlcCategoryManagement.vue - 分类管理
- views/plc/PlcReports.vue - PLC 报表
- views/plc/PlcScaleRecords.vue - 地磅记录
- utils/request.js - 兼容层（重导出 api/request）
- components/ 目录新增

**PLC 微服务（plc-service/）：**
- app.py - Flask 主应用
- requirements.txt - Python 依赖
- Dockerfile - 容器配置

**API 新增：**
- GET /api/plc-monitor/realtime - 实时数据
- GET /api/plc-monitor/history - 历史数据
- GET /api/plc-monitor/configs - 监控配置
- GET /api/plc/records - PLC 记录

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
- 
outes/index.js 新增隐患配置路由

**前端新增/修改：**
- pi/hazardConfig.js
- 
iews/inspection/SafetyRectification.vue 重构（发起信息/整改信息/详情流转图）

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
- 前端新增：pi/department.js、
iews/system/OrganizationManagement.vue
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
- views/maintenance/MaintenanceTask.vue：保养工作/保养计划/岗位分配/工作记录统一入口（含员工今日保养任务）。
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
- 站长：首页显示今日自检/岗位工作/设备故障；卫生检查改名；侧边栏固定任务改名为“岗位工作”。
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
- GET /api/plc-monitor/realtime
- GET /api/plc-monitor/history
- GET /api/plc-monitor/configs
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

# 仅重建前端
docker-compose up -d --build frontend

# 日志
docker logs wms-backend --tail 50
`

## 访问地址
- 前端：http://localhost
- 后端：http://localhost:3000
- PLC 服务：http://localhost:5001
- MySQL：localhost:3307

## 测试账号
- admin / admin123
- operator1 / admin123
- station_mgr / admin123
- maintenance1 / admin123
- sum / 605315220

## 备注
- 自动运行测试，在代码发生修改之后，重启前端和后端，并重构镜像。
- 数据库与连接统一使用 utf8mb4。
- 乱码根因：部分前端文件被以错误编码读写或二次解码导致文本损坏。
- Docker 镜像加速：使用 DaoCloud/阿里云/1Panel 镜像源，配置文件见 scripts/docker-daemon.json。
- PLC 微服务独立运行，后端通过 plcBridgeService.js 与其通信。
- 根目录脚本：update_stations.sql、update_schema.sql、update_approval_tables.sql、update_inspection_fault_tables.sql
- 数据库补充脚本：database/migration_user_permissions.sql（扩展 permissions 枚举并创建 user_permissions 表，用于用户额外权限）。
- 用户管理：基准角色自动勾选菜单权限；前端树控件改为在角色切换/新增时调用 setCheckedKeys，确保菜单权限勾选显示正常。
- scripts/ 目录：backup-all.ps1/sh (数据库备份)、docker-daemon.json (镜像加速配置)、setup-docker-mirrors.ps1 (配置镜像源)
- 此版本为恢复重建版，若需继续补充历史细节请告知。

### 安全检查与卫生管理积分功能及菜单重构（2026-01-20）
**功能：为安全工作性质和卫生责任区添加积分字段，卫生工作安排独立为子菜单**

**数据库表结构调整：**
- safety_work_types：新增 points 字段（INT，默认 0，积分）
- hygiene_areas：新增 points 字段（INT，默认 0，积分）

**后端调整：**
- SafetyWorkType 模型：添加 points 字段
- HygieneArea 模型：添加 points 字段
- safetyCheckController：createWorkType/updateWorkType 方法支持 points 参数
- hygieneManagementController：createHygieneArea/updateHygieneArea 方法支持 areaPoints 参数

**前端新增/修改：**
- views/inspection/HygieneWorkArrangement.vue（新建）：卫生工作安排独立页面
  - 卫生区域划分 tab：支持积分字段输入，支持 Excel 模板导入
  - 卫生任务分配 tab：岗位责任区分配管理
- views/inspection/HygieneOtherInspection.vue：简化为纯卫生他检功能，移除工作安排相关内容
- views/inspection/SafetyCheckManagement.vue：工作性质表单添加积分输入字段
- router/index.js：新增 /hygiene-work-arrangement 路由
- config/menuConfig.js：所有角色的卫生检查菜单新增"卫生工作安排"子菜单项

**菜单结构调整：**
- 卫生检查
  - 卫生自检
  - 卫生他检（仅检查记录）
  - 卫生工作安排（新增，包含区域划分和任务分配）

**迁移脚本：** database/migration_add_points_fields.sql
- 修复全局表格表头与内容错位：移除强制 min-width 与 scrollbar-gutter 覆盖。




- 排班：入口拆分为“我的排班/排班管理”，管理入口限制角色；日历颜色按当天完整排班组合计算；站名/岗位显示分隔符调整为“-”。
- 岗位工作：任务库/完成记录权限扩展到 operator 等；任务库新增导出与批量删除；派发任务数量校验更严格；扣分值允许为 0。
- 安全检查项目：导入模板新增“排序”列，示例补“否”触发；创建/导入时若存在子项自动开启父项联动。
- 设备保养：页面样式统一（页头+筛选卡片+表格），记录列表空数据防御。
- 设备保养：修复保养工作/保养工作记录/保养计划/保养计划岗位分配进入即报错（页面加载失败）。
- 设备保养：保养计划岗位分配筛选项与表头一致。
- 设备保养：保养工作记录新增积分列（仅计合格项，完成后显示积分），筛选项与表头一致。
- 设备保养：保养工作记录积分列紧跟保养周期，设备名称列宽固定并超长省略，列宽更均匀。
- 设备保养：保养计划按设备编号分页，默认每页 5 条。
- 设备保养：保养工作页移除页头日期与刷新按钮，日保养卡片上方右侧显示日期（卡片外）。


## 2026-01-27

- ??????/???????????????????????/????ID???????????? inspection_items ???????



## 2026-01-27

- ???????????????????????????????



## 2026-01-27

- ???????? /api/self-inspections/my 500??????? result ????????????

## 2026-01-27

- 卫生自检/员工检查记录; 责任区/检查性质/检查结果.
- hygiene-other-inspection menu/route/permission/notification -> 员工检查记录.

## 2026-01-27

- 修复卫生他检页面构建报错（HygieneOtherInspection.vue 字符串/编码异常），并规范责任区分隔符解析。
## 2026-01-27

- 员工检查记录统一入口为 /inspection-records，移除安全/卫生他检页面路由与菜单入口，通知跳转统一指向员工检查记录。
- 卫生自检按“责任区=工作性质、点位=检查项”对齐安全结构，历史记录展示工作性质与积分（责任区积分累加）。
- 员工检查记录支持安全/卫生切换：卫生场景使用责任区/点位映射为工作性质/检查项。
- 后端卫生自检/他检记录归一化：读取时补齐 work_type_ids 与项目信息，并新增迁移脚本 backend/src/scripts/migrateHygieneInspections.js。
- 权限菜单替换为 menu:/inspection-records，移除卫生菜单内的员工检查记录入口。
## 2026-01-27

- ?????????? permissionSeeds.js ???/??????? Node ?????

## 2026-01-27

- ?????????permissionSeeds.js ?? UTF-8 BOM????????

## 2026-01-27

- 安全“员工检查记录”列表新增积分列（按工作性质积分汇总）。
- 同步权限以恢复“卫生检查 > 员工检查记录”侧边栏入口。

## 2026-01-27

- 开发环境 docker-compose.dev.yml 改为 node:18-alpine，并在启动时安装 npm，修复前后端容器因 npm 缺失重启导致的接口连接失败。


## 2026-01-27

- 开发测试可见排班管理视图：排班管理角色判断与路由角色加入 dev_test。
- ?????????/???????????????????????????

## 2026-02-06
- PLC历史数据：筛选区移除下载模板/批量导入按钮（保留页头按钮）；汇总与历史表格不再被大卡片包裹，表格与分页分离显示。

## 2026-02-06
- 卫生工作安排：非 FilterBar 操作条按钮移至页面标题右上角，统一与排班管理对齐。
- 临时工作任务汇总表：批量删除/批量导入/下载模板/新增任务按钮移至页面标题右上角。
- PLC 数据报表：新增页面标题与右上角操作区，批量导出移至页头。
- 故障上报：设备管理 Tab 的下载模板/批量导入/新增按钮移至页面标题右上角。
- 卫生工作安排：修复页头按钮文案为下载模板/批量导入/批量导出/批量删除/新增责任区/新增分配。
- 组织架构管理：4个Tab的筛选区与表格区间距统一（filter-card 与表格保持一致间距）。
- 岗位工作完成情况记录：筛选区与表格区间距统一（filter-card 与表格保持一致间距）。
- 维保数据报表：筛选区结构与默认日期统一（默认近5天），场站下拉改为全量场站。
- 数据分类管理：筛选区增加分类名称/数据类型/取值类型/采集方式。
- 可视化报表：开始/结束日期默认按近5天自动填入并修复绑定。
- 组织架构管理：场站名称筛选联想下拉改为全量场站数据源（不再受表格分页每页5条影响）。
- 维保数据报表：全年趋势图设备选项改为设备列表数据源，并在选择设备/年份/Tab后自动加载趋势图。
- 维保数据报表：全年趋势图增加场站筛选（按角色/可用场站限制），选择场站后设备下拉仅显示该场站设备；筛选项标签文本移到控件外。

## 2026-02-07
- ??????????????????????????????/????/????/????/????/?????/??/??/????????????????????????
- ???????????????/??/??????????????????????????????????

## 2026-02-07
- 用户管理/权限：菜单权限（menuCodes）支持在基准角色之上给单个用户增加菜单；路由守卫改为按菜单权限（基于权限目录的最长前缀匹配）放行/拦截，允许用户单独勾选的菜单突破写死的角色限制，并支持 deny 生效；侧边栏与首页快捷操作按菜单权限过滤并自动注入角色菜单里缺失但用户被授予的菜单项（如 岗位工作任务汇总表）。
- ????????? processing ?????????????/???????????????????????????????????

## 2026-02-07
- 临时任务：数据库迁移补齐 temporary_tasks 表 deduction_reason/deduction_points 字段，修复 /api/temporary-tasks 500（Unknown column TemporaryTask.deduction_reason）。
- 前端发布：nginx 针对 index.html/sw.js/registerSW.js/manifest.webmanifest 禁用长期缓存，避免发版后旧 chunk 引用导致 404（PWA Service Worker 缓存问题）。

## 2026-02-07
- 权限目录：新增后端接口 GET /api/permission-catalog（所有已登录用户可访问，仅返回 menuCodes），前端权限目录加载改为调用该接口，修复普通角色访问 /api/permissions 403 导致的页面报错。


## 2026-02-07
- 数据备份: backups/db_dump_20260207_134103.sql
- 消息通知: 调整为6个模块卡片; 每模块每页最多2条; 卡片内分页; 后端 /api/notifications 支持 relatedTypes/notifyTypes 过滤.
- 岗位工作完成情况记录: 场站筛选改为从 /stations/all 获取全量可见场站, 按 stationId 筛选; 修复下拉仅显示当前数据的问题.
- 维保数据报表(全年趋势): 未选择设备时展示全部设备汇总趋势; 请求带 stationId; 设备下拉随场站过滤.
- 发布: 已重建并重启 backend/frontend 镜像与容器(PLC 容器未动).

- 消息通知: 增加清除未读功能: 页面右上角支持全部清除未读; 每个模块卡片支持单独清除未读(后端新增 /api/notifications/read-by-filter).

- 前端缓存自愈: 检测到动态模块/旧chunk加载失败时, 自动注销 Service Worker + 清理 CacheStorage 并强制刷新一次, 避免发版后用户频繁遇到 js chunk 404.

## 2026-02-08
- 后端(PLC): 将 plcIngestion/plcBridgeService 下沉到 backend/src/modules/plc/services，并修正 app/控制器引用。
- 后端(Jobs): 将 cronJobs 下沉到 backend/src/modules/jobs/services，并修正 app 引用。
- 后端(Core): 将 permissionService/devTestGuard 下沉到 backend/src/modules/core/services，并修正 core/jobs/app 引用。
- 后端(Notification): 从 approval 中拆出独立 modules/notification（保持 /api/notifications* 路由不变），并在 modules/index.js 注册路由。
- 后端(Notification): 新增 notificationPublisher，收口各模块对 Notification.create/bulkCreate 的调用点（发送逻辑集中）。
- 后端(Audit): 新增 modules/audit/services/auditService（OperationLog 记录/清理），并将 cronJobs 的日志清理迁移到 auditService。
- 后端(SystemConfig): 新增 modules/system_config（SystemConfig 读写服务与 /api/system-configs 接口）。
- 后端(Permissions): 将 permissionSeeds 拆分到各模块的 permissions.js，并由 core/config/permissionSeeds.js 聚合导出（保持权限 code 与顺序不变）。
- 后端(Validation): 新增 modules/core/validators/validate.js，并在 system_config、notification、support(feedback)、approval、equipment、report、schedule、plc 模块接入 Joi 校验（不改接口返回结构）。
- 后端(ImportExport): 将 excelTemplate 下沉到 backend/src/modules/import_export/utils，并更新引用方。
- 后端(FileStorage): 将 upload 配置下沉到 backend/src/modules/file_storage/upload.js，并更新引用方。
- 后端(Auth): 将 auth 中间件与 jwt 配置下沉到 backend/src/modules/core/middlewares 与 backend/src/modules/core/config，并修正引用。
- 前端(Notification): 抽离 router/modules/notification.js；页面与 API 迁移到 frontend/src/modules/notification，并保留旧 api re-export 兼容层。
- 前端(SystemRoutes): 将原 system 路由拆分为 support/admin/account 路由模块；对应页面迁移到 frontend/src/modules/*/pages。
- 后端(CoreInfra): 将 config(database/logger/dev_test/permissionSeeds)、middlewares(error/permission)、utils(helpers) 实现下沉到 backend/src/modules/core，并在原路径保留 re-export 兼容层以减少全局改动。
- 后端(Task): 为 task 模块接入 Joi 入参校验（taskService + schemas，保持接口不变）。
- 后端(Task): position-jobs 接口接入 Joi 入参校验（保持接口不变）。
- 后端(Task): position-work-logs 接口接入 Joi 入参校验（保持接口不变）。
- 后端(Task): temporary-task-library 接口接入 Joi 入参校验（保持接口不变）。
- 后端(Inspection): safety/hygiene/hazard-config 接口接入 Joi 入参校验（保持接口不变）。
- 后端(Inspection): self/other/hazard/rectification 接口接入 Joi 入参校验（保持接口不变）。
- 后端(Maintenance): repair-task-library 接口接入 Joi 入参校验（保持接口不变）。
- 后端(Maintenance): maintenance-plan-library / maintenance-assignments 接口接入 Joi 入参校验（保持接口不变）。
- 后端(Maintenance): maintenance-position-plans / maintenance-work-records 接口接入 Joi 入参校验（保持接口不变）。
- 后端(Maintenance): maintenanceController（plans/records/fault/repair/material）接口接入 Joi 入参校验（保持接口不变）。
- 前端(Schedule): 路由指向 modules/schedule/pages（薄包装 views/schedule，便于后续迁移页面实现）。
