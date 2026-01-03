-- Add maintenance assignment verify fields and status
-- Executed on: 2025-12-30

ALTER TABLE maintenance_assignments
  MODIFY COLUMN status ENUM('pending','in_progress','pending_verify','accepted','completed') DEFAULT 'pending' COMMENT 'status',
  ADD COLUMN verify_by_id INT NULL COMMENT 'verify user id' AFTER work_hours,
  ADD COLUMN verify_by_name VARCHAR(50) NULL COMMENT 'verify user name' AFTER verify_by_id,
  ADD COLUMN verify_date DATE NULL COMMENT 'verify date' AFTER verify_by_name,
  ADD COLUMN verify_time TIME NULL COMMENT 'verify time' AFTER verify_date,
  ADD COLUMN verify_comment TEXT NULL COMMENT 'verify comment' AFTER verify_time,
  ADD COLUMN verify_safety INT NULL COMMENT 'verify safety rating' AFTER verify_comment,
  ADD COLUMN verify_quality INT NULL COMMENT 'verify quality rating' AFTER verify_safety,
  ADD COLUMN verify_progress INT NULL COMMENT 'verify progress rating' AFTER verify_quality,
  ADD COLUMN verify_hygiene INT NULL COMMENT 'verify hygiene rating' AFTER verify_progress;
