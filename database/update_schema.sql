-- Unified schema upgrade script (idempotent)
USE waste_management;

CREATE TABLE IF NOT EXISTS repair_task_library (
    id INT PRIMARY KEY AUTO_INCREMENT,
    task_name VARCHAR(100) NOT NULL,
    task_category VARCHAR(50),
    score_method VARCHAR(20),
    points INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    points_rule TEXT,
    quantity_editable TINYINT NOT NULL DEFAULT 0 COMMENT 'quantity editable',
    points_editable TINYINT NOT NULL DEFAULT 0 COMMENT 'points editable',
    is_active TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_repair_task_name (task_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS safety_work_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    work_type_name VARCHAR(100) NOT NULL,
    is_default TINYINT DEFAULT 0,
    sort_order INT DEFAULT 0,
    points INT DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS safety_check_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    work_type_id INT NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    item_standard VARCHAR(500),
    parent_id INT NULL,
    enable_children TINYINT NOT NULL DEFAULT 0,
    trigger_value TINYINT NULL,
    sort_order INT DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_safety_check_items_work_type (work_type_id),
    INDEX idx_safety_check_items_parent_id (parent_id),
    FOREIGN KEY (work_type_id) REFERENCES safety_work_types(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET @sql := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE safety_check_items ADD COLUMN parent_id INT NULL',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'safety_check_items'
      AND column_name = 'parent_id'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE repair_task_library ADD COLUMN quantity INT NOT NULL DEFAULT 1 COMMENT ''quantity'' AFTER points',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'repair_task_library'
      AND column_name = 'quantity'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE repair_task_library ADD COLUMN quantity_editable TINYINT NOT NULL DEFAULT 0 COMMENT ''quantity editable'' AFTER points_rule',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'repair_task_library'
      AND column_name = 'quantity_editable'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE repair_task_library ADD COLUMN task_category VARCHAR(50) NULL AFTER task_name',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'repair_task_library'
      AND column_name = 'task_category'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE repair_task_library ADD COLUMN score_method VARCHAR(20) NULL AFTER task_category',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'repair_task_library'
      AND column_name = 'score_method'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 临时工作任务汇总表：积分字段改为单位积分
SET @sql := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE temporary_task_library ADD COLUMN unit_points INT NOT NULL DEFAULT 0 COMMENT ''单位积分'' AFTER standard_hours',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'temporary_task_library'
      AND column_name = 'unit_points'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
    SELECT IF(
        COUNT(*) > 0,
        'UPDATE temporary_task_library SET unit_points = points WHERE unit_points IS NULL OR unit_points = 0',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'temporary_task_library'
      AND column_name = 'points'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
    SELECT IF(
        COUNT(*) > 0,
        'ALTER TABLE temporary_task_library DROP COLUMN points',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'temporary_task_library'
      AND column_name = 'points'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE temporary_task_library ADD COLUMN task_category VARCHAR(50) NULL COMMENT ''任务类别'' AFTER unit_points',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'temporary_task_library'
      AND column_name = 'task_category'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE temporary_task_library ADD COLUMN score_method VARCHAR(20) NULL COMMENT ''给分方式'' AFTER task_category',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'temporary_task_library'
      AND column_name = 'score_method'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE temporary_task_library ADD COLUMN quantity INT NOT NULL DEFAULT 1 COMMENT ''数量'' AFTER score_method',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'temporary_task_library'
      AND column_name = 'quantity'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE temporary_task_library ADD COLUMN points_rule TEXT NULL COMMENT ''积分规则'' AFTER quantity',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'temporary_task_library'
      AND column_name = 'points_rule'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE temporary_task_library ADD COLUMN quantity_editable TINYINT NOT NULL DEFAULT 0 COMMENT ''数量是否可修改'' AFTER points_rule',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'temporary_task_library'
      AND column_name = 'quantity_editable'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE temporary_task_library ADD COLUMN dispatch_review_required TINYINT NOT NULL DEFAULT 0 COMMENT ''派发任务是否强制审核'' AFTER quantity_editable',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'temporary_task_library'
      AND column_name = 'dispatch_review_required'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
    SELECT IF(
        COUNT(*) > 0,
        'ALTER TABLE temporary_task_library MODIFY COLUMN station_id INT NULL COMMENT ''场站ID''',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'temporary_task_library'
      AND column_name = 'station_id'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE repair_task_library ADD COLUMN points_rule TEXT NULL AFTER quantity',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'repair_task_library'
      AND column_name = 'points_rule'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE repair_task_library ADD COLUMN points_editable TINYINT NOT NULL DEFAULT 0 COMMENT ''points editable'' AFTER quantity_editable',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'repair_task_library'
      AND column_name = 'points_editable'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE position_jobs ADD COLUMN sort_order INT NOT NULL DEFAULT 1 COMMENT ''sort order'' AFTER job_name',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'position_jobs'
      AND column_name = 'sort_order'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE position_jobs ADD COLUMN result_definition TEXT NULL COMMENT ''result definition'' AFTER job_name',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'position_jobs'
      AND column_name = 'result_definition'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


SET @sql := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE repair_task_library ADD COLUMN is_active TINYINT DEFAULT 1 AFTER points_editable',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'repair_task_library'
      AND column_name = 'is_active'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE repair_task_library ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP AFTER is_active',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'repair_task_library'
      AND column_name = 'created_at'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE repair_task_library ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'repair_task_library'
      AND column_name = 'updated_at'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE safety_other_inspections ADD COLUMN points INT DEFAULT 0',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'safety_other_inspections'
      AND column_name = 'points'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE repair_records ADD COLUMN work_contents JSON NULL',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'repair_records'
      AND column_name = 'work_contents'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE repair_records ADD COLUMN repair_tasks JSON NULL',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'repair_records'
      AND column_name = 'repair_tasks'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE position_jobs ADD COLUMN points_editable TINYINT NOT NULL DEFAULT 0 COMMENT ''points editable'' AFTER quantity_editable',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'position_jobs'
      AND column_name = 'points_editable'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE safety_check_items ADD COLUMN enable_children TINYINT NOT NULL DEFAULT 0',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'safety_check_items'
      AND column_name = 'enable_children'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE safety_check_items ADD COLUMN trigger_value TINYINT NULL',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'safety_check_items'
      AND column_name = 'trigger_value'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
    SELECT IF(
        COUNT(*) = 0,
        'CREATE INDEX idx_safety_check_items_parent_id ON safety_check_items (parent_id)',
        'SELECT 1'
    )
    FROM information_schema.STATISTICS
    WHERE table_schema = DATABASE()
      AND table_name = 'safety_check_items'
      AND index_name = 'idx_safety_check_items_parent_id'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


SET @sql := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE maintenance_plan_library ADD COLUMN is_deleted TINYINT NOT NULL DEFAULT 0 COMMENT ''soft delete flag''',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'maintenance_plan_library'
      AND column_name = 'is_deleted'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ??????????? + ??/??/??
SET @sql := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE equipment ADD COLUMN specification VARCHAR(100) NULL COMMENT ''??'' AFTER installation_location',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'equipment'
      AND column_name = 'specification'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE equipment ADD COLUMN model VARCHAR(100) NULL COMMENT ''??'' AFTER specification',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'equipment'
      AND column_name = 'model'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE equipment ADD COLUMN material VARCHAR(100) NULL COMMENT ''??'' AFTER model',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'equipment'
      AND column_name = 'material'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
    SELECT IF(
        COUNT(*) > 0,
        'UPDATE equipment SET installation_location = '''' WHERE installation_location IS NULL',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'equipment'
      AND column_name = 'installation_location'
      AND IS_NULLABLE = 'YES'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
    SELECT IF(
        COUNT(*) > 0,
        'ALTER TABLE equipment MODIFY COLUMN installation_location VARCHAR(200) NOT NULL COMMENT ''????''',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'equipment'
      AND column_name = 'installation_location'
      AND IS_NULLABLE = 'YES'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

