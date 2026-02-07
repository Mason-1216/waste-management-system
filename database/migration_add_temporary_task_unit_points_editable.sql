-- Add unit_points_editable for temporary_tasks and temporary_task_library
-- Date: 2026-02-03

SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'temporary_tasks'
  AND COLUMN_NAME = 'unit_points_editable';
SET @sql = IF(
  @col_exists = 0,
  'ALTER TABLE temporary_tasks ADD COLUMN unit_points_editable TINYINT NOT NULL DEFAULT 1 COMMENT ''Unit points editable'' AFTER quantity',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'temporary_task_library'
  AND COLUMN_NAME = 'unit_points_editable';
SET @sql = IF(
  @col_exists = 0,
  'ALTER TABLE temporary_task_library ADD COLUMN unit_points_editable TINYINT NOT NULL DEFAULT 1 COMMENT ''Unit points editable'' AFTER quantity_editable',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE temporary_tasks
SET unit_points_editable = 1
WHERE unit_points_editable IS NULL;

UPDATE temporary_task_library
SET unit_points_editable = 1
WHERE unit_points_editable IS NULL;
