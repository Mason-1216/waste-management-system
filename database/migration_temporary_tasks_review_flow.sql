-- 临时任务提报/审核流程增强
-- 1) 状态新增 rejected（驳回）
-- 2) 增加提交与审核字段，支持“待处理/已提交待审/已通过/驳回”四态
-- 说明：避免使用 ADD COLUMN IF NOT EXISTS，兼容不支持该语法的 MySQL 版本

ALTER TABLE temporary_tasks
  MODIFY COLUMN status ENUM('pending', 'processing', 'completed', 'rejected') DEFAULT 'pending' COMMENT '状态';

SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'temporary_tasks'
  AND COLUMN_NAME = 'is_completed';
SET @sql = IF(
  @col_exists = 0,
  'ALTER TABLE temporary_tasks ADD COLUMN is_completed TINYINT DEFAULT 0 COMMENT ''完成情况'' AFTER status',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'temporary_tasks'
  AND COLUMN_NAME = 'submit_time';
SET @sql = IF(
  @col_exists = 0,
  'ALTER TABLE temporary_tasks ADD COLUMN submit_time DATETIME NULL COMMENT ''提交时间'' AFTER is_completed',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'temporary_tasks'
  AND COLUMN_NAME = 'approver_id';
SET @sql = IF(
  @col_exists = 0,
  'ALTER TABLE temporary_tasks ADD COLUMN approver_id INT NULL COMMENT ''审核人ID'' AFTER submit_time',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'temporary_tasks'
  AND COLUMN_NAME = 'approver_name';
SET @sql = IF(
  @col_exists = 0,
  'ALTER TABLE temporary_tasks ADD COLUMN approver_name VARCHAR(50) NULL COMMENT ''审核人'' AFTER approver_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'temporary_tasks'
  AND COLUMN_NAME = 'approve_time';
SET @sql = IF(
  @col_exists = 0,
  'ALTER TABLE temporary_tasks ADD COLUMN approve_time DATETIME NULL COMMENT ''审核时间'' AFTER approver_name',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
