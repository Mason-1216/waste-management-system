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
