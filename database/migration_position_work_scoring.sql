-- 岗位工作积分字段扩展（兼容重复执行）
SET @db := DATABASE();

-- position_jobs
SET @stmt := (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'position_jobs' AND COLUMN_NAME = 'task_category'
    ),
    'SELECT 1',
    'ALTER TABLE position_jobs ADD COLUMN task_category VARCHAR(50) NULL COMMENT ''任务类别'' AFTER job_name'
  )
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'position_jobs' AND COLUMN_NAME = 'score_method'
    ),
    'SELECT 1',
    'ALTER TABLE position_jobs ADD COLUMN score_method VARCHAR(20) NULL COMMENT ''给分方式'' AFTER task_category'
  )
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'position_jobs' AND COLUMN_NAME = 'quantity'
    ),
    'SELECT 1',
    'ALTER TABLE position_jobs ADD COLUMN quantity INT NOT NULL DEFAULT 1 COMMENT ''数量'' AFTER points'
  )
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'position_jobs' AND COLUMN_NAME = 'points_rule'
    ),
    'SELECT 1',
    'ALTER TABLE position_jobs ADD COLUMN points_rule TEXT NULL COMMENT ''积分规则'' AFTER quantity'
  )
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'position_jobs' AND COLUMN_NAME = 'quantity_editable'
    ),
    'SELECT 1',
    'ALTER TABLE position_jobs ADD COLUMN quantity_editable TINYINT NOT NULL DEFAULT 0 COMMENT ''数量是否可修改'' AFTER points_rule'
  )
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'position_jobs' AND COLUMN_NAME = 'points_editable'
    ),
    'SELECT 1',
    'ALTER TABLE position_jobs ADD COLUMN points_editable TINYINT NOT NULL DEFAULT 0 COMMENT ''积分是否可修改'' AFTER quantity_editable'
  )
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'position_jobs' AND COLUMN_NAME = 'dispatch_review_required'
    ),
    'SELECT 1',
    'ALTER TABLE position_jobs ADD COLUMN dispatch_review_required TINYINT NOT NULL DEFAULT 0 COMMENT ''派发任务是否强制审核'' AFTER quantity_editable'
  )
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

-- position_work_logs
SET @stmt := (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'position_work_logs' AND COLUMN_NAME = 'task_source'
    ),
    'SELECT 1',
    'ALTER TABLE position_work_logs ADD COLUMN task_source VARCHAR(20) NOT NULL DEFAULT ''fixed'' COMMENT ''任务来源'' AFTER position_job_id'
  )
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'position_work_logs' AND COLUMN_NAME = 'task_category'
    ),
    'SELECT 1',
    'ALTER TABLE position_work_logs ADD COLUMN task_category VARCHAR(50) NULL COMMENT ''任务类别'' AFTER work_name'
  )
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'position_work_logs' AND COLUMN_NAME = 'score_method'
    ),
    'SELECT 1',
    'ALTER TABLE position_work_logs ADD COLUMN score_method VARCHAR(20) NULL COMMENT ''给分方式'' AFTER task_category'
  )
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'position_work_logs' AND COLUMN_NAME = 'unit_points'
    ),
    'SELECT 1',
    'ALTER TABLE position_work_logs ADD COLUMN unit_points DECIMAL(10,2) NULL COMMENT ''单位积分'' AFTER score_method'
  )
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'position_work_logs' AND COLUMN_NAME = 'quantity'
    ),
    'SELECT 1',
    'ALTER TABLE position_work_logs ADD COLUMN quantity INT DEFAULT 1 COMMENT ''数量'' AFTER unit_points'
  )
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'position_work_logs' AND COLUMN_NAME = 'quantity_editable'
    ),
    'SELECT 1',
    'ALTER TABLE position_work_logs ADD COLUMN quantity_editable TINYINT DEFAULT 0 COMMENT ''数量是否可修改'' AFTER quantity'
  )
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'position_work_logs' AND COLUMN_NAME = 'submit_time'
    ),
    'SELECT 1',
    'ALTER TABLE position_work_logs ADD COLUMN submit_time DATETIME NULL COMMENT ''提交时间'' AFTER is_overtime'
  )
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'position_work_logs' AND COLUMN_NAME = 'review_status'
    ),
    'SELECT 1',
    'ALTER TABLE position_work_logs ADD COLUMN review_status VARCHAR(20) NULL COMMENT ''审核状态'' AFTER submit_time'
  )
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'position_work_logs' AND COLUMN_NAME = 'deduction_reason'
    ),
    'SELECT 1',
    'ALTER TABLE position_work_logs ADD COLUMN deduction_reason TEXT NULL COMMENT ''扣分原因'' AFTER review_status'
  )
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'position_work_logs' AND COLUMN_NAME = 'deduction_points'
    ),
    'SELECT 1',
    'ALTER TABLE position_work_logs ADD COLUMN deduction_points DECIMAL(10,2) NULL COMMENT ''扣分值'' AFTER deduction_reason'
  )
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'position_work_logs' AND COLUMN_NAME = 'assigned_by_id'
    ),
    'SELECT 1',
    'ALTER TABLE position_work_logs ADD COLUMN assigned_by_id INT NULL COMMENT ''派发人ID'' AFTER deduction_points'
  )
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'position_work_logs' AND COLUMN_NAME = 'assigned_by_name'
    ),
    'SELECT 1',
    'ALTER TABLE position_work_logs ADD COLUMN assigned_by_name VARCHAR(50) NULL COMMENT ''派发人'' AFTER assigned_by_id'
  )
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'position_work_logs' AND COLUMN_NAME = 'assigned_time'
    ),
    'SELECT 1',
    'ALTER TABLE position_work_logs ADD COLUMN assigned_time DATETIME NULL COMMENT ''派发时间'' AFTER assigned_by_name'
  )
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;
