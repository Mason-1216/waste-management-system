-- 添加保养任务计划时间字段
-- 执行时间: 2025-12-30

ALTER TABLE maintenance_assignments
  ADD COLUMN plan_start_time TIME NULL COMMENT '计划开始时间' AFTER plan_start_date,
  ADD COLUMN plan_end_time TIME NULL COMMENT '计划结束时间' AFTER plan_end_date;
