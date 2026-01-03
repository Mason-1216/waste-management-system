-- 为临时任务表添加标准工时和积分字段
-- 执行时间: 2025-12-27

-- 添加标准工时字段
ALTER TABLE temporary_tasks
ADD COLUMN IF NOT EXISTS standard_hours DECIMAL(4,2) COMMENT '标准工时(h/d)' AFTER actual_hours;

-- 添加积分字段
ALTER TABLE temporary_tasks
ADD COLUMN IF NOT EXISTS points INT DEFAULT 0 COMMENT '积分' AFTER standard_hours;
