CREATE TABLE IF NOT EXISTS departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    dept_name VARCHAR(100) NOT NULL COMMENT '????',
    dept_code VARCHAR(50) UNIQUE COMMENT '????',
    description VARCHAR(200) COMMENT '??',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='???';

SET @col_dept_created_at = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'departments' AND column_name = 'created_at'
);
SET @col_dept_updated_at = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'departments' AND column_name = 'updated_at'
);
SET @sql_dept_created_at = IF(
  @col_dept_created_at = 0,
  'ALTER TABLE departments ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP',
  'SELECT 1'
);
PREPARE stmt_dept_created_at FROM @sql_dept_created_at;
EXECUTE stmt_dept_created_at;
DEALLOCATE PREPARE stmt_dept_created_at;

SET @sql_dept_updated_at = IF(
  @col_dept_updated_at = 0,
  'ALTER TABLE departments ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
  'SELECT 1'
);
PREPARE stmt_dept_updated_at FROM @sql_dept_updated_at;
EXECUTE stmt_dept_updated_at;
DEALLOCATE PREPARE stmt_dept_updated_at;

INSERT INTO departments (dept_name, dept_code, description, status, created_at, updated_at) VALUES
('???', 'RD', '????', 'active', NOW(), NOW()),
('???', 'OPS', '????', 'active', NOW(), NOW()),
('???', 'GM', '???', 'active', NOW(), NOW()),
('???', 'FIN', '????', 'active', NOW(), NOW()),
('?????', 'HR', '??????', 'active', NOW(), NOW()),
('??', 'OTHER', '????', 'active', NOW(), NOW()),
('??????', 'GMO', '??????', 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  dept_name = VALUES(dept_name),
  description = VALUES(description),
  status = VALUES(status),
  updated_at = VALUES(updated_at);
SET @col_notify_type = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'notifications' AND column_name = 'notify_type'
);
SET @col_receiver_name = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'notifications' AND column_name = 'receiver_name'
);
SET @col_related_id = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'notifications' AND column_name = 'related_id'
);
SET @col_related_type = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'notifications' AND column_name = 'related_type'
);

SET @sql_notify_type = IF(
  @col_notify_type = 0,
  'ALTER TABLE notifications ADD COLUMN notify_type ENUM(''inspection_overdue'',''task_pending'',''approval_request'',''system'') NOT NULL DEFAULT ''system'' COMMENT ''绫诲瀷''',
  'SELECT 1'
);
PREPARE stmt1 FROM @sql_notify_type;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

SET @sql_receiver_name = IF(
  @col_receiver_name = 0,
  'ALTER TABLE notifications ADD COLUMN receiver_name VARCHAR(50) COMMENT ''?????''',
  'SELECT 1'
);
PREPARE stmt2 FROM @sql_receiver_name;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

SET @sql_related_id = IF(
  @col_related_id = 0,
  'ALTER TABLE notifications ADD COLUMN related_id INT COMMENT ''鍏宠仈涓氬姟ID''',
  'SELECT 1'
);
PREPARE stmt3 FROM @sql_related_id;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

SET @sql_related_type = IF(
  @col_related_type = 0,
  'ALTER TABLE notifications ADD COLUMN related_type VARCHAR(50) COMMENT ''鍏宠仈涓氬姟绫诲瀷''',
  'SELECT 1'
);
PREPARE stmt4 FROM @sql_related_type;
EXECUTE stmt4;
DEALLOCATE PREPARE stmt4;
SET @col_company_name = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'company_name'
);
SET @sql_company_name = IF(
  @col_company_name = 0,
  'ALTER TABLE users ADD COLUMN company_name VARCHAR(100) COMMENT ''公司''',
  'SELECT 1'
);
PREPARE stmt_company FROM @sql_company_name;
EXECUTE stmt_company;
DEALLOCATE PREPARE stmt_company;

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

SET @idx_schedule_old = (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'schedules'
    AND index_name = 'uk_schedule_user_month'
);
SET @sql_drop_schedule_old = IF(
  @idx_schedule_old > 0,
  'ALTER TABLE schedules DROP INDEX uk_schedule_user_month',
  'SELECT 1'
);
PREPARE stmt_schedule_drop FROM @sql_drop_schedule_old;
EXECUTE stmt_schedule_drop;
DEALLOCATE PREPARE stmt_schedule_drop;

SET @idx_schedule_new = (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'schedules'
    AND index_name = 'uk_schedule_user_station_position_month'
);
SET @sql_add_schedule_new = IF(
  @idx_schedule_new = 0,
  'ALTER TABLE schedules ADD UNIQUE KEY uk_schedule_user_station_position_month (user_id, station_id, position_name, year, month)',
  'SELECT 1'
);
PREPARE stmt_schedule_add FROM @sql_add_schedule_new;
EXECUTE stmt_schedule_add;
DEALLOCATE PREPARE stmt_schedule_add;

SET @col_base_role_code = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'roles' AND column_name = 'base_role_code'
);
SET @sql_base_role_code = IF(
  @col_base_role_code = 0,
  'ALTER TABLE roles ADD COLUMN base_role_code VARCHAR(50) COMMENT ''基准角色编码''',
  'SELECT 1'
);
PREPARE stmt_base_role FROM @sql_base_role_code;
EXECUTE stmt_base_role;
DEALLOCATE PREPARE stmt_base_role;

CREATE TABLE IF NOT EXISTS permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    permission_code VARCHAR(100) NOT NULL UNIQUE COMMENT '权限编码',
    permission_name VARCHAR(100) NOT NULL COMMENT '权限名称',
    resource_type ENUM('menu', 'button', 'api') DEFAULT 'api' COMMENT '资源类型',
    parent_id INT DEFAULT 0 COMMENT '父级权限ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='权限表';

CREATE TABLE IF NOT EXISTS role_permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_role_permission (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (permission_id) REFERENCES permissions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色权限关联表';

SET @col_completion_score = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'safety_rectifications' AND column_name = 'completion_score'
);
SET @sql_completion_score = IF(
  @col_completion_score = 0,
  'ALTER TABLE safety_rectifications ADD COLUMN completion_score INT COMMENT ''整改完成评分''',
  'SELECT 1'
);
PREPARE stmt_completion_score FROM @sql_completion_score;
EXECUTE stmt_completion_score;
DEALLOCATE PREPARE stmt_completion_score;

