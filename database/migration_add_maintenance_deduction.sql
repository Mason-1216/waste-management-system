-- Add deduction fields for maintenance work records
-- Date: 2026-02-03
-- Note: avoid IF NOT EXISTS for MySQL compatibility

SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'maintenance_work_records'
  AND COLUMN_NAME = 'deduction_points';
SET @sql = IF(
  @col_exists = 0,
  'ALTER TABLE maintenance_work_records ADD COLUMN deduction_points DECIMAL(10,2) NULL COMMENT ''验收不通过扣分（0或负数）'' AFTER verify_remark',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'maintenance_work_records'
  AND COLUMN_NAME = 'deduction_remark';
SET @sql = IF(
  @col_exists = 0,
  'ALTER TABLE maintenance_work_records ADD COLUMN deduction_remark TEXT NULL COMMENT ''扣分说明'' AFTER deduction_points',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
