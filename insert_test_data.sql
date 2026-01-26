-- 插入监控配置
INSERT INTO plc_monitor_configs (name, station_id, plc_ip, db_number, offset_address, data_type, category_id, unit, is_active) VALUES
('站点A-水表', 1, '192.168.1.101', 1, 0.0, 'REAL', 9, 'm³', 1),
('站点A-电表', 1, '192.168.1.101', 1, 4.0, 'REAL', 13, 'kWh', 1),
('站点A-温度', 1, '192.168.1.101', 1, 8.0, 'REAL', 12, '℃', 1),
('站点B-水表', 2, '192.168.1.102', 1, 0.0, 'REAL', 9, 'm³', 1),
('站点B-电表', 2, '192.168.1.102', 1, 4.0, 'REAL', 13, 'kWh', 1),
('站点B-温度', 2, '192.168.1.102', 1, 8.0, 'REAL', 12, '℃', 1),
('站点C-水表', 3, '192.168.1.103', 1, 0.0, 'REAL', 9, 'm³', 1),
('站点C-电表', 3, '192.168.1.103', 1, 4.0, 'REAL', 13, 'kWh', 1),
('站点C-温度', 3, '192.168.1.103', 1, 8.0, 'REAL', 12, '℃', 1);

-- 生成半年历史数据的存储过程
DELIMITER $$

DROP PROCEDURE IF EXISTS generate_plc_history$$

CREATE PROCEDURE generate_plc_history()
BEGIN
    DECLARE v_date DATE;
    DECLARE v_days INT DEFAULT 180;
    DECLARE v_day INT DEFAULT 0;
    DECLARE v_config_id INT;
    DECLARE v_category_id INT;
    DECLARE v_station_id INT;
    DECLARE v_value DECIMAL(20,4);
    DECLARE v_address VARCHAR(50);

    -- 开始日期：6个月前
    SET v_date = DATE_SUB(CURDATE(), INTERVAL 180 DAY);

    -- 循环180天
    WHILE v_day < v_days DO
        -- 为每个配置生成数据
        -- 站点A-水表 (累计型，从1000开始，每天增加10-50)
        SET v_config_id = (SELECT id FROM plc_monitor_configs WHERE name = '站点A-水表' LIMIT 1);
        SET v_value = 1000 + (v_day * 30) + (RAND() * 20);
        INSERT INTO plc_readings (timestamp, config_id, address, value, category_id, station_id, quality)
        VALUES (DATE_ADD(v_date, INTERVAL v_day DAY), v_config_id, 'DB1.DBD0', v_value, 9, 1, 1);

        -- 站点A-电表 (累计型，从5000开始，每天增加50-200)
        SET v_config_id = (SELECT id FROM plc_monitor_configs WHERE name = '站点A-电表' LIMIT 1);
        SET v_value = 5000 + (v_day * 125) + (RAND() * 75);
        INSERT INTO plc_readings (timestamp, config_id, address, value, category_id, station_id, quality)
        VALUES (DATE_ADD(v_date, INTERVAL v_day DAY), v_config_id, 'DB1.DBD4', v_value, 13, 1, 1);

        -- 站点A-温度 (变化型，20-30度之间波动)
        SET v_config_id = (SELECT id FROM plc_monitor_configs WHERE name = '站点A-温度' LIMIT 1);
        SET v_value = 20 + (RAND() * 10) + SIN(v_day * 0.1) * 3;
        INSERT INTO plc_readings (timestamp, config_id, address, value, category_id, station_id, quality)
        VALUES (DATE_ADD(v_date, INTERVAL v_day DAY), v_config_id, 'DB1.DBD8', v_value, 12, 1, 1);

        -- 站点B-水表
        SET v_config_id = (SELECT id FROM plc_monitor_configs WHERE name = '站点B-水表' LIMIT 1);
        SET v_value = 1200 + (v_day * 25) + (RAND() * 15);
        INSERT INTO plc_readings (timestamp, config_id, address, value, category_id, station_id, quality)
        VALUES (DATE_ADD(v_date, INTERVAL v_day DAY), v_config_id, 'DB1.DBD0', v_value, 9, 2, 1);

        -- 站点B-电表
        SET v_config_id = (SELECT id FROM plc_monitor_configs WHERE name = '站点B-电表' LIMIT 1);
        SET v_value = 4500 + (v_day * 110) + (RAND() * 60);
        INSERT INTO plc_readings (timestamp, config_id, address, value, category_id, station_id, quality)
        VALUES (DATE_ADD(v_date, INTERVAL v_day DAY), v_config_id, 'DB1.DBD4', v_value, 13, 2, 1);

        -- 站点B-温度
        SET v_config_id = (SELECT id FROM plc_monitor_configs WHERE name = '站点B-温度' LIMIT 1);
        SET v_value = 22 + (RAND() * 8) + SIN(v_day * 0.12) * 2.5;
        INSERT INTO plc_readings (timestamp, config_id, address, value, category_id, station_id, quality)
        VALUES (DATE_ADD(v_date, INTERVAL v_day DAY), v_config_id, 'DB1.DBD8', v_value, 12, 2, 1);

        -- 站点C-水表
        SET v_config_id = (SELECT id FROM plc_monitor_configs WHERE name = '站点C-水表' LIMIT 1);
        SET v_value = 800 + (v_day * 35) + (RAND() * 25);
        INSERT INTO plc_readings (timestamp, config_id, address, value, category_id, station_id, quality)
        VALUES (DATE_ADD(v_date, INTERVAL v_day DAY), v_config_id, 'DB1.DBD0', v_value, 9, 3, 1);

        -- 站点C-电表
        SET v_config_id = (SELECT id FROM plc_monitor_configs WHERE name = '站点C-电表' LIMIT 1);
        SET v_value = 6000 + (v_day * 140) + (RAND() * 80);
        INSERT INTO plc_readings (timestamp, config_id, address, value, category_id, station_id, quality)
        VALUES (DATE_ADD(v_date, INTERVAL v_day DAY), v_config_id, 'DB1.DBD4', v_value, 13, 3, 1);

        -- 站点C-温度
        SET v_config_id = (SELECT id FROM plc_monitor_configs WHERE name = '站点C-温度' LIMIT 1);
        SET v_value = 18 + (RAND() * 12) + SIN(v_day * 0.08) * 4;
        INSERT INTO plc_readings (timestamp, config_id, address, value, category_id, station_id, quality)
        VALUES (DATE_ADD(v_date, INTERVAL v_day DAY), v_config_id, 'DB1.DBD8', v_value, 12, 3, 1);

        SET v_day = v_day + 1;
    END WHILE;

    SELECT CONCAT('成功插入 ', v_days * 9, ' 条历史数据记录') AS result;
END$$

DELIMITER ;

-- 执行存储过程
CALL generate_plc_history();

-- 清理存储过程
DROP PROCEDURE IF EXISTS generate_plc_history;
