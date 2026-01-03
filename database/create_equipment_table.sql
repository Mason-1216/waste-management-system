-- 设备管理表
CREATE TABLE IF NOT EXISTS `equipment` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '设备ID',
  `station_id` INT NOT NULL COMMENT '场站ID',
  `equipment_code` VARCHAR(50) NOT NULL COMMENT '设备编号',
  `equipment_name` VARCHAR(100) NOT NULL COMMENT '设备名称',
  `installation_location` VARCHAR(200) COMMENT '安装地点',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_station_code` (`station_id`, `equipment_code`),
  INDEX `idx_station_id` (`station_id`),
  INDEX `idx_equipment_code` (`equipment_code`),
  CONSTRAINT `fk_equipment_station` FOREIGN KEY (`station_id`) REFERENCES `stations`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='设备管理表';
