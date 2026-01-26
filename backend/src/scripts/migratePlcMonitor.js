/**
 * PLC Monitor 数据库迁移脚本
 * 创建 plc_monitor_configs, plc_categories, plc_readings 表
 */
import sequelize from '../config/database.js';

const migrate = async () => {
  try {
    console.log('开始执行 PLC Monitor 数据库迁移...');

    // 创建 plc_categories 表（数据分类）
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS plc_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_key VARCHAR(50) NOT NULL UNIQUE COMMENT '分类标识',
        category_name VARCHAR(100) NOT NULL COMMENT '分类名称',
        data_type VARCHAR(20) NOT NULL DEFAULT 'REAL' COMMENT '数据类型: REAL/DINT/INT/BOOL',
        schedule_type VARCHAR(20) NOT NULL DEFAULT 'interval' COMMENT '采集方式: interval/fixed',
        interval_hours INT DEFAULT 1 COMMENT '采集间隔(小时)',
        fixed_time VARCHAR(10) DEFAULT NULL COMMENT '固定采集时间 HH:mm',
        is_enabled TINYINT(1) DEFAULT 1 COMMENT '是否启用',
        sort_order INT DEFAULT 0 COMMENT '排序',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='PLC数据分类表'
    `);
    console.log('✓ plc_categories 表创建成功');

    // 创建 plc_monitor_configs 表（监控点配置）
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS plc_monitor_configs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL COMMENT '监控点名称',
        station_id INT DEFAULT NULL COMMENT '场站ID',
        plc_ip VARCHAR(50) NOT NULL COMMENT 'PLC IP地址',
        db_number INT NOT NULL COMMENT 'DB块号',
        offset_address DECIMAL(10,1) NOT NULL COMMENT '偏移地址',
        data_type VARCHAR(20) NOT NULL DEFAULT 'REAL' COMMENT '数据类型: REAL/DINT/INT/BOOL',
        category_id INT DEFAULT NULL COMMENT '分类ID',
        unit VARCHAR(20) DEFAULT NULL COMMENT '单位',
        description VARCHAR(255) DEFAULT NULL COMMENT '描述',
        is_active TINYINT(1) DEFAULT 1 COMMENT '是否启用',
        sort_order INT DEFAULT 0 COMMENT '排序',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_station_id (station_id),
        INDEX idx_category_id (category_id),
        INDEX idx_plc_ip (plc_ip),
        FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE SET NULL,
        FOREIGN KEY (category_id) REFERENCES plc_categories(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='PLC监控点配置表'
    `);
    console.log('✓ plc_monitor_configs 表创建成功');

    // 创建 plc_readings 表（历史数据）
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS plc_readings (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        timestamp DATETIME NOT NULL COMMENT '采集时间',
        config_id INT NOT NULL COMMENT '配置ID',
        address VARCHAR(50) NOT NULL COMMENT '完整地址(DB.offset)',
        value DECIMAL(20,4) DEFAULT NULL COMMENT '读取值',
        category_id INT DEFAULT NULL COMMENT '分类ID',
        station_id INT DEFAULT NULL COMMENT '场站ID',
        raw_value VARCHAR(100) DEFAULT NULL COMMENT '原始值(字符串)',
        quality TINYINT DEFAULT 1 COMMENT '数据质量: 1=正常, 0=异常',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_timestamp (timestamp),
        INDEX idx_config_id (config_id),
        INDEX idx_category_id (category_id),
        INDEX idx_station_id (station_id),
        INDEX idx_timestamp_category (timestamp, category_id),
        INDEX idx_timestamp_station (timestamp, station_id),
        FOREIGN KEY (config_id) REFERENCES plc_monitor_configs(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES plc_categories(id) ON DELETE SET NULL,
        FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='PLC读数历史表'
    `);
    console.log('✓ plc_readings 表创建成功');

    // 插入默认分类数据
    await sequelize.query(`
      INSERT IGNORE INTO plc_categories (category_key, category_name, data_type, schedule_type, interval_hours, sort_order) VALUES
      ('temperature', '温度', 'REAL', 'interval', 1, 1),
      ('pressure', '压力', 'REAL', 'interval', 1, 2),
      ('flow', '流量', 'REAL', 'interval', 1, 3),
      ('level', '液位', 'REAL', 'interval', 1, 4),
      ('power', '功率', 'REAL', 'interval', 1, 5),
      ('status', '状态', 'BOOL', 'interval', 1, 6),
      ('count', '计数', 'DINT', 'interval', 1, 7),
      ('other', '其他', 'REAL', 'interval', 1, 99)
    `);
    console.log('✓ 默认分类数据插入成功');

    console.log('\n✓✓✓ PLC Monitor 数据库迁移完成！');
    process.exit(0);
  } catch (error) {
    console.error('迁移失败:', error);
    process.exit(1);
  }
};

migrate();
