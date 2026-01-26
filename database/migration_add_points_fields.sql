-- 为安全工作性质表添加积分字段
ALTER TABLE safety_work_types
ADD COLUMN points INT DEFAULT 0 COMMENT '积分' AFTER sort_order;

-- 为卫生责任区表添加积分字段
ALTER TABLE hygiene_areas
ADD COLUMN points INT DEFAULT 0 COMMENT '积分' AFTER area_name;
