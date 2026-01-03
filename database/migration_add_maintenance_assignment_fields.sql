-- Add maintenance assignment execution fields
-- Executed on: 2025-12-30

ALTER TABLE maintenance_assignments
  ADD COLUMN actual_start_time TIME NULL COMMENT 'actual start time' AFTER actual_start_date,
  ADD COLUMN actual_end_time TIME NULL COMMENT 'actual end time' AFTER actual_end_date,
  ADD COLUMN maintenance_content TEXT NULL COMMENT 'maintenance content' AFTER actual_end_time,
  ADD COLUMN maintenance_tools VARCHAR(200) NULL COMMENT 'maintenance tools' AFTER maintenance_content,
  ADD COLUMN maintenance_result VARCHAR(20) NULL COMMENT 'maintenance result' AFTER maintenance_tools,
  ADD COLUMN observe_days INT NULL COMMENT 'observe days' AFTER maintenance_result,
  ADD COLUMN unsolved_reason VARCHAR(200) NULL COMMENT 'unsolved reason' AFTER observe_days,
  ADD COLUMN maintenance_items JSON NULL COMMENT 'maintenance items' AFTER unsolved_reason;
