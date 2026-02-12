-- 为 cz1(id=39) 和 zz1(id=43) 创建积分测试数据
-- 日期使用今天

SET @today = CURDATE();
SET @now = NOW();

-- ========================================
-- 1. 岗位工作记录（四类任务）- 固定任务
-- ========================================

-- cz1 的四类任务
INSERT INTO position_work_logs (user_id, user_name, station_id, station_name, position_name, task_source, work_date, work_name, task_category, score_method, unit_points, quantity, is_completed, submit_time, review_status, created_at, updated_at)
VALUES
(39, 'cz1', 1, '场站1', '操作岗', 'fixed', @today, '日常巡检-Ⅰ类', 'Ⅰ类', 'fixed', 10, 1, 1, @now, 'approved', @now, @now),
(39, 'cz1', 1, '场站1', '操作岗', 'fixed', @today, '设备检查-Ⅱ类', 'Ⅱ类', 'fixed', 15, 1, 1, @now, 'approved', @now, @now),
(39, 'cz1', 1, '场站1', '操作岗', 'fixed', @today, '安全排查-Ⅲ类', 'Ⅲ类', 'fixed', 20, 1, 1, @now, 'approved', @now, @now),
(39, 'cz1', 1, '场站1', '操作岗', 'fixed', @today, '应急处理-Ⅳ类', 'Ⅳ类', 'fixed', 25, 1, 1, @now, 'approved', @now, @now);

-- zz1 的四类任务
INSERT INTO position_work_logs (user_id, user_name, station_id, station_name, position_name, task_source, work_date, work_name, task_category, score_method, unit_points, quantity, is_completed, submit_time, review_status, created_at, updated_at)
VALUES
(43, 'zz1', 1, '场站1', '操作岗', 'fixed', @today, '日常巡检-Ⅰ类', 'Ⅰ类', 'fixed', 8, 2, 1, @now, 'approved', @now, @now),
(43, 'zz1', 1, '场站1', '操作岗', 'fixed', @today, '设备检查-Ⅱ类', 'Ⅱ类', 'fixed', 12, 1, 1, @now, 'approved', @now, @now),
(43, 'zz1', 1, '场站1', '操作岗', 'fixed', @today, '安全排查-Ⅲ类', 'Ⅲ类', 'fixed', 18, 2, 1, @now, 'approved', @now, @now),
(43, 'zz1', 1, '场站1', '操作岗', 'fixed', @today, '应急处理-Ⅳ类', 'Ⅳ类', 'fixed', 22, 1, 1, @now, 'approved', @now, @now);

-- ========================================
-- 2. 临时任务（dispatch）- 四类任务
-- ========================================

-- cz1 的临时任务
INSERT INTO position_work_logs (user_id, user_name, station_id, station_name, position_name, task_source, work_date, work_name, task_category, score_method, unit_points, quantity, is_completed, submit_time, review_status, created_at, updated_at)
VALUES
(39, 'cz1', 1, '场站1', '操作岗', 'dispatch', @today, '临时清洁-Ⅰ类', 'Ⅰ类', 'fixed', 5, 1, 1, @now, 'approved', @now, @now),
(39, 'cz1', 1, '场站1', '操作岗', 'dispatch', @today, '临时搬运-Ⅱ类', 'Ⅱ类', 'fixed', 8, 1, 1, @now, 'approved', @now, @now);

-- zz1 的临时任务
INSERT INTO position_work_logs (user_id, user_name, station_id, station_name, position_name, task_source, work_date, work_name, task_category, score_method, unit_points, quantity, is_completed, submit_time, review_status, created_at, updated_at)
VALUES
(43, 'zz1', 1, '场站1', '操作岗', 'dispatch', @today, '临时清洁-Ⅲ类', 'Ⅲ类', 'fixed', 6, 1, 1, @now, 'approved', @now, @now),
(43, 'zz1', 1, '场站1', '操作岗', 'dispatch', @today, '临时搬运-Ⅳ类', 'Ⅳ类', 'fixed', 10, 1, 1, @now, 'approved', @now, @now);

-- ========================================
-- 3. 自行申请任务（self_apply）
-- ========================================

INSERT INTO position_work_logs (user_id, user_name, station_id, station_name, position_name, task_source, work_date, work_name, task_category, score_method, unit_points, quantity, is_completed, submit_time, review_status, created_at, updated_at)
VALUES
(39, 'cz1', 1, '场站1', '操作岗', 'self_apply', @today, '自行申请-加班', 'Ⅱ类', 'fixed', 15, 1, 1, @now, 'approved', @now, @now),
(43, 'zz1', 1, '场站1', '操作岗', 'self_apply', @today, '自行申请-培训', 'Ⅲ类', 'fixed', 12, 1, 1, @now, 'approved', @now, @now);

SELECT 'position_work_logs 数据插入完成' AS status;
