-- Add deduction fields for temporary_tasks

SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'temporary_tasks'
  AND COLUMN_NAME = 'deduction_reason';
SET @sql = IF(
  @col_exists = 0,
  'ALTER TABLE temporary_tasks ADD COLUMN deduction_reason TEXT NULL COMMENT ''Deduction reason'' AFTER approve_time',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'temporary_tasks'
  AND COLUMN_NAME = 'deduction_points';
SET @sql = IF(
  @col_exists = 0,
  'ALTER TABLE temporary_tasks ADD COLUMN deduction_points DECIMAL(10, 2) NULL COMMENT ''Deduction points'' AFTER deduction_reason',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
