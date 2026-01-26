-- Unified schema upgrade script (idempotent)
USE waste_management;

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
