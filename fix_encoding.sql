-- 修复监控配置名称的编码问题
UPDATE plc_monitor_configs SET name = '站点A-水表' WHERE id = 20;
UPDATE plc_monitor_configs SET name = '站点A-电表' WHERE id = 21;
UPDATE plc_monitor_configs SET name = '站点A-温度' WHERE id = 22;
UPDATE plc_monitor_configs SET name = '站点B-水表' WHERE id = 23;
UPDATE plc_monitor_configs SET name = '站点B-电表' WHERE id = 24;
UPDATE plc_monitor_configs SET name = '站点B-温度' WHERE id = 25;
UPDATE plc_monitor_configs SET name = '站点C-水表' WHERE id = 26;
UPDATE plc_monitor_configs SET name = '站点C-电表' WHERE id = 27;
UPDATE plc_monitor_configs SET name = '站点C-温度' WHERE id = 28;
