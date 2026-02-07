-- 运行项目管理系统数据库初始化脚本
-- 与后端 Sequelize 模型保持一致
CREATE DATABASE IF NOT EXISTS waste_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE waste_management;

-- 角色表 (匹配 Role.js)
CREATE TABLE IF NOT EXISTS roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) NOT NULL UNIQUE COMMENT '角色名称',
    role_code VARCHAR(50) NOT NULL UNIQUE COMMENT '角色编码',
    base_role_code VARCHAR(50) COMMENT '基准角色编码',
    description VARCHAR(200) COMMENT '描述',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

-- 权限表 (匹配 Permission.js)
CREATE TABLE IF NOT EXISTS permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    permission_code VARCHAR(100) NOT NULL UNIQUE COMMENT '权限编码',
    permission_name VARCHAR(100) NOT NULL COMMENT '权限名称',
    resource_type ENUM('menu', 'button', 'api') DEFAULT 'api' COMMENT '资源类型',
    parent_id INT DEFAULT 0 COMMENT '父级权限ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='权限表';

-- 角色权限关联表 (匹配 RolePermission.js)
CREATE TABLE IF NOT EXISTS role_permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_role_permission (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (permission_id) REFERENCES permissions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色权限关联表';

-- 用户表 (匹配 User.js)
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '登录账号',
    password VARCHAR(255) NOT NULL COMMENT '密码(bcrypt加密)',
    real_name VARCHAR(50) NOT NULL COMMENT '真实姓名',
    department_name VARCHAR(50) COMMENT '部门名称',
    company_name VARCHAR(100) COMMENT '公司',
    phone VARCHAR(20) COMMENT '手机号',
    email VARCHAR(100) COMMENT '邮箱',
    role_id INT NOT NULL COMMENT '角色ID',
    is_price_admin TINYINT DEFAULT 0 COMMENT '是否为单价专员',
    status TINYINT DEFAULT 1 COMMENT '状态 1启用 0禁用',
    last_project_id INT COMMENT '最后访问的项目ID',
    last_station_id INT COMMENT '最后访问的场站ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 项目表 (匹配 Project.js)

-- 部门表(匹配 Department.js)
CREATE TABLE IF NOT EXISTS departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    dept_name VARCHAR(100) NOT NULL COMMENT '部门名称',
    dept_code VARCHAR(50) UNIQUE COMMENT '部门编码',
    description VARCHAR(200) COMMENT '描述',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='部门表';
CREATE TABLE IF NOT EXISTS projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_code VARCHAR(50) NOT NULL UNIQUE COMMENT '项目编码',
    project_name VARCHAR(100) NOT NULL COMMENT '项目名称',
    department_id INT COMMENT '所属部门ID',
    address VARCHAR(200) COMMENT '地址',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目表';

-- 场站表 (匹配 Station.js)
CREATE TABLE IF NOT EXISTS stations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    station_name VARCHAR(100) NOT NULL COMMENT '场站名称',
    station_type ENUM('有机资源再生中心', '机械化分选站', '黑水虻场站', '办公区', '绿植堆肥站', '绿植粉碎站') COMMENT '场站类别',
    check_in_time TIME DEFAULT '08:10:00' COMMENT '自检截止时间',
    location VARCHAR(200) COMMENT '地址',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='场站表';

-- 用户项目关联表
CREATE TABLE IF NOT EXISTS user_projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    project_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    UNIQUE KEY uk_user_project (user_id, project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户项目关联表';

-- 用户场站关联表
CREATE TABLE IF NOT EXISTS user_stations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    station_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (station_id) REFERENCES stations(id),
    UNIQUE KEY uk_user_station (user_id, station_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户场站关联表';

-- 项目场站关联表
CREATE TABLE IF NOT EXISTS project_stations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    station_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (station_id) REFERENCES stations(id),
    UNIQUE KEY uk_project_station (project_id, station_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目场站关联表';

-- 排班表 (匹配 Schedule.js)
CREATE TABLE IF NOT EXISTS schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    station_id INT,
    user_id INT NOT NULL,
    user_name VARCHAR(50),
    position_name VARCHAR(50),
    year INT NOT NULL,
    month INT NOT NULL,
    schedules JSON COMMENT '排班数据 {"2025-12-01":"09:00-18:00","2025-12-02":"休"}',
    created_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_schedule_user_station_position_month (user_id, station_id, position_name, year, month),
    INDEX idx_schedule_project (project_id),
    INDEX idx_schedule_year_month (year, month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='排班表';

-- 通知表

-- 每日任务记录表(匹配 DailyTask.js)
CREATE TABLE IF NOT EXISTS daily_tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    record_code VARCHAR(50) NOT NULL UNIQUE COMMENT '记录编号',
    user_id INT NOT NULL,
    user_name VARCHAR(50),
    project_id INT NOT NULL,
    station_id INT,
    work_date DATE NOT NULL,
    task_config_id INT NOT NULL,
    task_name VARCHAR(100),
    times INT DEFAULT 1 COMMENT '完成次数',
    hours_per_time DECIMAL(4,2),
    total_hours DECIMAL(4,2),
    is_fixed_task TINYINT DEFAULT 1 COMMENT '是否固定任务',
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    reviewer_id INT,
    reviewer_name VARCHAR(50),
    review_time DATETIME,
    reject_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_daily_user_date (user_id, work_date),
    INDEX idx_daily_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='每日任务记录表';

-- 临时工作任务库表 (匹配 TemporaryTaskLibrary.js)
CREATE TABLE IF NOT EXISTS temporary_task_library (
    id INT PRIMARY KEY AUTO_INCREMENT,
    task_name VARCHAR(100) NOT NULL COMMENT '工作名称',
    task_content TEXT NOT NULL COMMENT '具体工作内容',
    standard_hours DECIMAL(4,2) NOT NULL COMMENT '标准工时(h/d)',
    unit_points INT NOT NULL COMMENT '单位积分',
    task_category VARCHAR(50) COMMENT '任务类别',
    score_method VARCHAR(20) COMMENT '给分方式',
    quantity INT NOT NULL DEFAULT 1 COMMENT '数量',
    points_rule TEXT COMMENT '积分规则',
    quantity_editable TINYINT NOT NULL DEFAULT 0 COMMENT '数量是否可修改',
    dispatch_review_required TINYINT NOT NULL DEFAULT 0 COMMENT '派发任务是否强制审核',
    station_id INT NULL COMMENT '场站ID',
    created_by INT COMMENT '创建人ID',
    created_by_name VARCHAR(50) COMMENT '创建人姓名',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_temp_task_station (station_id),
    INDEX idx_temp_task_name (task_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='临时工作任务库';


-- Safety work types (matches SafetyWorkType.js)
CREATE TABLE IF NOT EXISTS safety_work_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    work_type_name VARCHAR(100) NOT NULL COMMENT '??????',
    is_default TINYINT DEFAULT 0 COMMENT '??????(????)',
    sort_order INT DEFAULT 0 COMMENT '??',
    points INT DEFAULT 0 COMMENT '??',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='??????';

-- Safety check items (matches SafetyCheckItem.js)
CREATE TABLE IF NOT EXISTS safety_check_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    work_type_id INT NOT NULL,
    item_name VARCHAR(200) NOT NULL COMMENT '?????',
    item_standard VARCHAR(500) COMMENT '????',
    parent_id INT NULL COMMENT 'Parent check item id',
    enable_children TINYINT NOT NULL DEFAULT 0 COMMENT 'Enable child items',
    trigger_value TINYINT NULL COMMENT 'Trigger value for child items',
    sort_order INT DEFAULT 0 COMMENT '??',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_safety_check_items_work_type (work_type_id),
    INDEX idx_safety_check_items_parent_id (parent_id),
    FOREIGN KEY (work_type_id) REFERENCES safety_work_types(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='?????';

-- Safety self inspections (matches SafetySelfInspection.js)
CREATE TABLE IF NOT EXISTS safety_self_inspections (
    id INT PRIMARY KEY AUTO_INCREMENT,
    record_code VARCHAR(50) NOT NULL UNIQUE,
    inspection_type ENUM('safety', 'hygiene') NOT NULL,
    project_id INT NOT NULL,
    station_id INT,
    filler_id INT NOT NULL,
    filler_name VARCHAR(50),
    inspection_date DATE NOT NULL,
    inspection_items JSON,
    photo_urls TEXT,
    submit_time DATETIME NOT NULL,
    is_overdue TINYINT DEFAULT 0,
    overdue_minutes INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_self_filler (filler_id),
    INDEX idx_self_date (inspection_date),
    INDEX idx_self_type (inspection_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='安全/卫生自检表';

-- Safety other inspections (matches SafetyOtherInspection.js)
CREATE TABLE IF NOT EXISTS safety_other_inspections (
    id INT PRIMARY KEY AUTO_INCREMENT,
    record_code VARCHAR(50) NOT NULL UNIQUE,
    inspection_type ENUM('safety', 'hygiene') NOT NULL,
    project_id INT NOT NULL,
    station_id INT,
    inspector_id INT NOT NULL,
    inspector_name VARCHAR(50),
    inspection_date DATE NOT NULL,
      inspected_user_id INT,
      inspected_user_name VARCHAR(50),
      points INT DEFAULT 0,
      violation_description TEXT,
    is_qualified TINYINT DEFAULT 1,
    unqualified_items TEXT,
    photo_urls TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_other_inspector (inspector_id),
    INDEX idx_other_date (inspection_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='安全/卫生他检表';

-- Fault reports (matches FaultReport.js)
CREATE TABLE IF NOT EXISTS fault_reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    report_code VARCHAR(50) NOT NULL UNIQUE,
    equipment_code VARCHAR(50),
    equipment_name VARCHAR(100) NOT NULL,
    installation_location VARCHAR(200),
    fault_date DATE NOT NULL,
    fault_time TIME NOT NULL,
    reporter_id INT NOT NULL,
    reporter_name VARCHAR(50),
    fault_description TEXT NOT NULL,
    project_id INT NOT NULL,
    station_id INT,
    status ENUM('pending', 'assigned', 'processing', 'completed', 'closed') DEFAULT 'pending',
    assigned_to INT,
    assigned_by INT,
    assigned_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_fault_status (status),
    INDEX idx_fault_reporter (reporter_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='故障上报表';

-- 保养记录表 (匹配 MaintenanceRecord.js)
CREATE TABLE IF NOT EXISTS maintenance_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    record_code VARCHAR(50) NOT NULL UNIQUE,
    plan_id INT COMMENT '关联保养计划ID',
    project_id INT NOT NULL,
    station_id INT,
    equipment_name VARCHAR(100) NOT NULL,
    equipment_code VARCHAR(50),
    maintenance_date DATE NOT NULL,
    maintainer_id INT NOT NULL,
    maintainer_name VARCHAR(50),
    maintenance_content TEXT,
    result ENUM('normal', 'found_issue') DEFAULT 'normal',
    issue_description TEXT,
    handling_measures TEXT,
    photo_urls TEXT COMMENT 'JSON数组',
    work_hours DECIMAL(4,2),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    reviewer_id INT,
    reviewer_name VARCHAR(50),
    review_time DATETIME,
    reject_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_maintenance_plan (plan_id),
    INDEX idx_maintenance_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='保养记录表';

-- 维修记录表 (匹配 RepairRecord.js)
CREATE TABLE IF NOT EXISTS repair_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    record_code VARCHAR(50) UNIQUE COMMENT '维修单号',
    fault_report_id INT NOT NULL COMMENT '关联故障上报单ID',
    project_id INT NOT NULL,
    station_id INT,
    equipment_code VARCHAR(50) COMMENT '设备编号',
    equipment_name VARCHAR(100) COMMENT '设备名称',
    equipment_location VARCHAR(200) COMMENT '设备位置',
    equipment_model VARCHAR(100) COMMENT '设备型号',
    fault_date DATE COMMENT '故障日期',
    fault_time TIME COMMENT '故障时间',
    fault_description TEXT COMMENT '故障描述',
    preliminary_judgment TEXT COMMENT '故障初步判断',
    reporter_id INT,
    reporter_name VARCHAR(50),
    report_date DATE,
    report_time TIME,
    urgency_level ENUM('low', 'medium', 'high', 'critical') COMMENT '紧急程度',
    repair_person_id INT,
    repair_person_name VARCHAR(50),
    repair_assistant_name VARCHAR(50) COMMENT '维修配合人',
    plan_repair_date DATE COMMENT '计划维修日期',
    plan_repair_end_date DATE COMMENT '计划维修结束日期',
    plan_repair_time TIME COMMENT '计划维修时间',
    plan_repair_end_time TIME COMMENT '计划维修结束时间',
    repair_start_date DATE,
    repair_start_time TIME,
    repair_end_date DATE,
    repair_end_time TIME,
    repair_content TEXT COMMENT '维修内容描述',
    repair_tools TEXT COMMENT '维修工具',
    work_contents JSON COMMENT '维修工作内容',
    repair_tasks JSON COMMENT '维修任务库选择',
    consumables_list JSON COMMENT '维修耗材明细',
    consumables_total DECIMAL(10,2) DEFAULT 0 COMMENT '耗材总金额',
    parts_list JSON COMMENT '更换配件明细',
    parts_total DECIMAL(10,2) DEFAULT 0 COMMENT '配件总金额',
    repair_result ENUM('normal', 'observe', 'unsolved') COMMENT '维修结果',
    observe_days INT COMMENT '待观察天数',
    unsolved_reason TEXT COMMENT '未解决原因',
    verifier_id INT COMMENT '验收人ID(站长)',
    verifier_name VARCHAR(50),
    verify_date DATE,
    verify_time TIME,
    verify_result ENUM('pass', 'fail') COMMENT '验收结果',
    verify_attitude VARCHAR(50) COMMENT '维修态度',
    verify_quality VARCHAR(50) COMMENT '维修质量',
    verify_comment TEXT COMMENT '验收意见',
    rating INT COMMENT '评价星级1-5',
    rating_comment TEXT COMMENT '评价备注',
    archivist VARCHAR(50) COMMENT '存档人员',
    archive_dept VARCHAR(50) COMMENT '存档部门',
    archive_date DATE,
    status ENUM('draft_report', 'submitted_report', 'dispatched', 'repairing', 'repaired_submitted', 'accepted', 'archived') DEFAULT 'draft_report' COMMENT '状态',
    dispatch_by INT COMMENT '派发人ID(站长)',
    dispatch_by_name VARCHAR(50),
    dispatch_date DATE,
    dispatch_time TIME,
    dispatch_remark TEXT COMMENT '派发备注',
    work_hours DECIMAL(5,1) COMMENT '维修工时',
    created_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_repair_fault_report (fault_report_id),
    INDEX idx_repair_person (repair_person_id),
    INDEX idx_repair_status (status),
    INDEX idx_repair_project_station (project_id, station_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='维修记录表';

-- 维修任务库表
CREATE TABLE IF NOT EXISTS repair_task_library (
    id INT PRIMARY KEY AUTO_INCREMENT,
    task_name VARCHAR(100) NOT NULL COMMENT '任务名称',
    task_category VARCHAR(50) COMMENT '任务类别',
    score_method VARCHAR(20) COMMENT '给分方式',
    points INT NOT NULL COMMENT '单位积分',
    quantity INT NOT NULL DEFAULT 1 COMMENT '数量',
    points_rule TEXT COMMENT '积分规则',
    quantity_editable TINYINT NOT NULL DEFAULT 0 COMMENT '数量是否可修改',
    points_editable TINYINT NOT NULL DEFAULT 0 COMMENT '积分是否可修改',
    is_active TINYINT DEFAULT 1 COMMENT '是否启用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_repair_task_name (task_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='维修任务库表';

-- 领料申请表 (匹配 MaterialRequisition.js)
CREATE TABLE IF NOT EXISTS material_requisitions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    requisition_code VARCHAR(50) NOT NULL UNIQUE,
    repair_record_id INT COMMENT '关联维修记录ID',
    applicant_id INT NOT NULL,
    applicant_name VARCHAR(50),
    material_list JSON NOT NULL COMMENT '物料清单 [{name,spec,quantity,unit_price}]',
    total_amount DECIMAL(10,2),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approver_id INT,
    approver_name VARCHAR(50),
    approve_time DATETIME,
    reject_reason TEXT,
    project_id INT NOT NULL,
    station_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_requisition_status (status),
    INDEX idx_requisition_applicant (applicant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='领料申请表';

-- 安全隐患检查表 (匹配 SafetyHazardInspection.js)
CREATE TABLE IF NOT EXISTS safety_hazard_inspections (
    id INT PRIMARY KEY AUTO_INCREMENT,
    record_code VARCHAR(50) NOT NULL UNIQUE,
    inspection_date DATE NOT NULL,
    station_name VARCHAR(100) NOT NULL,
    station_type VARCHAR(50),
    hazard_category ENUM('电气', '违规违纪', '标识', '基础设施', '环境卫生', '机械设备', '特种作业', '制度文件', '消防', '特种设备') NOT NULL,
    is_first_found ENUM('是', '二次', '否') NOT NULL,
    hazard_description TEXT,
    photo_urls TEXT,
    location VARCHAR(200),
    handler_id INT COMMENT '办理人ID(场站长)',
    handler_name VARCHAR(50),
    inspector_id INT NOT NULL,
    inspector_name VARCHAR(50),
    status ENUM('pending', 'processing', 'completed') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_hazard_station (station_name),
    INDEX idx_hazard_date (inspection_date),
    INDEX idx_hazard_inspector (inspector_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='安全隐患检查表';

-- 安全隐患整改表 (匹配 SafetyRectification.js)
CREATE TABLE IF NOT EXISTS safety_rectifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    record_code VARCHAR(50) NOT NULL UNIQUE,
    inspection_id INT NOT NULL COMMENT '关联检查记录ID',
    root_cause ENUM('人的不安全行为', '物的不安全状态', '职责不清', '人岗匹配', '工作流程', '工作标准', '工作执行', '设计缺陷', '劳动防护用品配备不足', '安全设施建设投入不足') NOT NULL,
    rectification_measures TEXT NOT NULL,
    responsible_person_id INT NOT NULL,
    responsible_person_name VARCHAR(50),
    punished_person_id INT,
    punished_person_name VARCHAR(50),
    punishment_result TEXT,
    is_completed ENUM('是', '否') NOT NULL,
    completion_photos TEXT,
    completion_score INT COMMENT '整改完成评分',
    root_cause_category ENUM('组织措施', '管理措施', '技术措施', '经济措施') COMMENT '根因类别(安全员填写)',
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approver_id INT,
    approver_name VARCHAR(50),
    approve_time DATETIME,
    approve_comment TEXT,
    reject_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_rectification_inspection (inspection_id),
    INDEX idx_rectification_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='安全隐患整改表';

-- PLC数据分类表 (匹配 PlcCategory.js)
CREATE TABLE IF NOT EXISTS plc_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_key VARCHAR(50) NOT NULL UNIQUE COMMENT '分类标识',
    category_name VARCHAR(100) NOT NULL COMMENT '分类名称',
    data_type ENUM('REAL', 'DINT', 'INT', 'BOOL') DEFAULT 'REAL' COMMENT '数据类型',
    value_type ENUM('cumulative', 'fluctuating', 'event') DEFAULT 'cumulative' COMMENT '取值类型(计量/变化/事件)',
    schedule_type ENUM('interval', 'fixed', 'on_change') DEFAULT 'interval' COMMENT '调度类型',
    interval_hours INT DEFAULT 1 COMMENT '间隔小时数',
    fixed_time TIME COMMENT '固定采集时间',
    is_enabled TINYINT DEFAULT 1 COMMENT '是否启用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='PLC数据分类表';

-- PLC监控点配置表 (匹配 PlcMonitorConfig.js)
CREATE TABLE IF NOT EXISTS plc_monitor_configs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '监控点名称',
    station_id INT COMMENT '关联场站',
    plc_ip VARCHAR(50) NOT NULL COMMENT 'PLC IP地址',
    db_number INT NOT NULL COMMENT 'DB块号',
    offset_address DECIMAL(10,1) NOT NULL COMMENT '偏移地址',
    data_type ENUM('REAL', 'DINT', 'INT', 'BOOL') DEFAULT 'REAL' COMMENT '数据类型',
    category_id INT COMMENT '分类ID',
    unit VARCHAR(20) COMMENT '单位',
    description TEXT COMMENT '描述',
    sort_order INT DEFAULT 0 COMMENT '排序',
    is_active TINYINT DEFAULT 1 COMMENT '是否启用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_config_station (station_id),
    INDEX idx_config_category (category_id),
    FOREIGN KEY (station_id) REFERENCES stations(id),
    FOREIGN KEY (category_id) REFERENCES plc_categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='PLC监控点配置表';

-- PLC数据读取记录表 (匹配 PlcReading.js)
CREATE TABLE IF NOT EXISTS plc_readings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    timestamp DATETIME NOT NULL COMMENT '采集时间',
    config_id INT NOT NULL COMMENT '配置ID',
    address VARCHAR(50) NOT NULL COMMENT 'PLC地址',
    value DECIMAL(20,6) COMMENT '数值',
    quality TINYINT DEFAULT 1 COMMENT '数据质量 1正常 0异常',
    category_id INT COMMENT '分类ID',
    station_id INT COMMENT '场站ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_reading_timestamp (timestamp),
    INDEX idx_reading_config (config_id),
    INDEX idx_reading_category (category_id),
    INDEX idx_reading_station (station_id),
    FOREIGN KEY (config_id) REFERENCES plc_monitor_configs(id),
    FOREIGN KEY (category_id) REFERENCES plc_categories(id),
    FOREIGN KEY (station_id) REFERENCES stations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='PLC数据读取记录表';

CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    notify_type ENUM('inspection_overdue', 'task_pending', 'approval_request', 'system') NOT NULL DEFAULT 'system' COMMENT '类型',
    title VARCHAR(200) NOT NULL COMMENT '标题',
    content TEXT COMMENT '内容',
    receiver_id INT COMMENT '接收用户ID',
    receiver_name VARCHAR(50) COMMENT '接收人',
    is_read TINYINT DEFAULT 0 COMMENT '是否已读',
    related_id INT COMMENT '关联业务ID',
    related_type VARCHAR(50) COMMENT '关联业务类型',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (receiver_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通知表';\n-- 插入默认角色数据（9种角色）
INSERT INTO roles (role_code, role_name, base_role_code, description) VALUES
('admin', '系统管理员', 'admin', '系统管理员，拥有所有权限'),
('operator', '操作岗', 'operator', '一线操作人员（仅作为角色，岗位由排班表动态配置）'),
('maintenance', '维修岗', 'maintenance', '设备维修人员（仅作为角色，岗位由排班表动态配置）'),
('station_manager', '站长', 'station_manager', '场站管理人员'),
('deputy_manager', '部门副经理', 'deputy_manager', '部门副经理'),
('department_manager', '部门经理', 'department_manager', '部门经理'),
('safety_inspector', '安全员', 'safety_inspector', '公司级安全检查人员'),
('senior_management', '高层', 'senior_management', '公司高层管理人员'),
('client', '甲方人员', 'client', '甲方人员'),
('dev_test', '开发测试', 'admin', '开发测试（全权限）');

-- 插入默认管理员账号 (密码: admin123)
INSERT INTO users (username, password, real_name, role_id, status) VALUES
('admin', '$2a$10$Lzl7FDiC1lSVC7Jgwg1j5u850Jecx0dErqvupHg4.2QBg6qfIDKgK', '系统管理员', 1, 1);

-- 插入开发测试账号 (密码: 605315220)
INSERT INTO users (username, password, real_name, role_id, status)
SELECT 'sum', '$2a$10$FJMFQHV5WIwk3xmX39ZdZ.jMepVgj1qR3YpES64Z4ehCmf4cDBFIC', '开发测试', id, 1
FROM roles
WHERE role_code = 'dev_test';

-- 插入默认项目

-- 插入默认部门
INSERT INTO departments (dept_name, dept_code, description, status) VALUES
('研发部', 'RD', '研发部门', 'active'),
('运营部', 'OPS', '运营部门', 'active'),
('总经理', 'GM', '管理层', 'active'),
('财务部', 'FIN', '财务部门', 'active'),
('人力资源部', 'HR', '人力资源部门', 'active'),
('其他', 'OTHER', '其他部门', 'active'),
('总经理办公室', 'GMO', '总经理办公室', 'active');\nINSERT INTO projects (project_code, project_name, address, status) VALUES
('PROJ001', '示范项目', '示范地址', 'active');

-- 插入默认场站
INSERT INTO stations (station_name, station_type, location, status) VALUES
('海淀区第一有机资源中心', '有机资源再生中心', NULL, 'active'),
('板井站', '有机资源再生中心', NULL, 'active'),
('北航站', '有机资源再生中心', NULL, 'active'),
('北外站', '有机资源再生中心', NULL, 'active'),
('北师大', '有机资源再生中心', NULL, 'active'),
('沙铁站', '有机资源再生中心', NULL, 'active'),
('中关村一小西二旗分校', '有机资源再生中心', NULL, 'active'),
('中关村一小怀柔分校', '有机资源再生中心', NULL, 'active'),
('紫竹院', '有机资源再生中心', NULL, 'active'),
('三星庄', '有机资源再生中心', NULL, 'active'),
('海淀一办站', '有机资源再生中心', NULL, 'active'),
('怀柔西茶坞', '有机资源再生中心', NULL, 'active'),
('国航', '有机资源再生中心', NULL, 'active'),
('总部办公区', '办公区', NULL, 'active'),
('怀柔办公区', '办公区', NULL, 'active'),
('平义分站', '有机资源再生中心', NULL, 'active');

-- 关联项目和场站
INSERT INTO project_stations (project_id, station_id) VALUES (1, 1);

-- 关联管理员到项目和场站
INSERT INTO user_projects (user_id, project_id) VALUES (1, 1);
INSERT INTO user_stations (user_id, station_id) VALUES (1, 1);

-- 插入默认PLC数据分类
INSERT INTO plc_categories (category_key, category_name, data_type, value_type, schedule_type, interval_hours, is_enabled) VALUES
('temperature', '温度数据', 'REAL', 'fluctuating', 'interval', 1, 1),
('weight', '重量数据', 'REAL', 'cumulative', 'interval', 1, 1),
('pressure', '压力数据', 'REAL', 'fluctuating', 'interval', 1, 1),
('flow', '流量数据', 'REAL', 'cumulative', 'interval', 1, 1),
('status', '状态数据', 'BOOL', 'event', 'interval', 1, 1),
('counter', '计数数据', 'DINT', 'cumulative', 'interval', 1, 1);


