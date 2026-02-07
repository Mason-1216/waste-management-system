-- Add unit_points and quantity for temporary_tasks
-- Date: 2026-02-03
-- Note: avoid IF NOT EXISTS for MySQL compatibility

SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'temporary_tasks'
  AND COLUMN_NAME = 'unit_points';
SET @sql = IF(
  @col_exists = 0,
  'ALTER TABLE temporary_tasks ADD COLUMN unit_points INT NOT NULL DEFAULT 0 COMMENT ''单位积分'' AFTER standard_hours',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'temporary_tasks'
  AND COLUMN_NAME = 'quantity';
SET @sql = IF(
  @col_exists = 0,
  'ALTER TABLE temporary_tasks ADD COLUMN quantity INT NOT NULL DEFAULT 1 COMMENT ''数量'' AFTER unit_points',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE temporary_tasks
SET unit_points = points
WHERE unit_points = 0 AND points > 0;

UPDATE temporary_tasks
SET quantity = 1
WHERE quantity IS NULL OR quantity < 1;
