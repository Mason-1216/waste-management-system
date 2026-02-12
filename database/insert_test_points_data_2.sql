-- 为 cz1(id=39) 和 zz1(id=43) 创建得分大类测试数据
-- 日期使用今天

SET @today = CURDATE();
SET @now = NOW();

-- ========================================
-- 1. 安全自检记录
-- ========================================

INSERT INTO safety_self_inspections (record_code, inspection_type, project_id, station_id, filler_id, filler_name, inspection_date, work_type_ids, inspection_items, submit_time, created_at)
VALUES
(CONCAT('SSI-CZ1-', DATE_FORMAT(@now, '%Y%m%d%H%i%s')), 'safety', 1, 1, 39, 'cz1', @today, '[1,2]', '[{"workTypeId":1,"itemId":1,"result":"是"},{"workTypeId":2,"itemId":2,"result":"是"}]', @now, @now),
(CONCAT('SSI-ZZ1-', DATE_FORMAT(@now, '%Y%m%d%H%i%s')), 'safety', 1, 1, 43, 'zz1', @today, '[1,3]', '[{"workTypeId":1,"itemId":1,"result":"是"},{"workTypeId":3,"itemId":3,"result":"是"}]', @now, @now);

-- ========================================
-- 2. 卫生自检记录
-- ========================================

INSERT INTO safety_self_inspections (record_code, inspection_type, project_id, station_id, filler_id, filler_name, inspection_date, work_type_ids, inspection_items, submit_time, created_at)
VALUES
(CONCAT('HSI-CZ1-', DATE_FORMAT(@now, '%Y%m%d%H%i%s')), 'hygiene', 1, 1, 39, 'cz1', @today, '[1]', '[{"areaId":1,"pointId":1,"result":"是"}]', @now, @now),
(CONCAT('HSI-ZZ1-', DATE_FORMAT(@now, '%Y%m%d%H%i%s')), 'hygiene', 1, 1, 43, 'zz1', @today, '[2]', '[{"areaId":2,"pointId":2,"result":"是"}]', @now, @now);

SELECT 'safety_self_inspections 数据插入完成' AS status;

-- ========================================
-- 3. 保养工作记录
-- ========================================

INSERT INTO maintenance_work_records (record_code, station_id, plan_id, position_name, equipment_code, equipment_name, cycle_type, work_date, executor_id, executor_name, maintenance_items, status, submit_time, created_at, updated_at)
VALUES
(CONCAT('MWR-CZ1-', DATE_FORMAT(@now, '%Y%m%d%H%i%s')), 1, 721, '操作岗', 'EQ001', '测试设备1', 'daily', @today, 39, 'cz1', '[{"itemName":"检查润滑","result":"合格","points":5},{"itemName":"清洁设备","result":"合格","points":5}]', 'completed', @now, @now, @now),
(CONCAT('MWR-ZZ1-', DATE_FORMAT(@now, '%Y%m%d%H%i%s')), 1, 721, '操作岗', 'EQ002', '测试设备2', 'daily', @today, 43, 'zz1', '[{"itemName":"检查润滑","result":"合格","points":5},{"itemName":"清洁设备","result":"合格","points":5},{"itemName":"检查电气","result":"合格","points":5}]', 'completed', @now, @now, @now);

SELECT 'maintenance_work_records 数据插入完成' AS status;
