-- 卫生管理相关表结构
-- 创建时间：2025-12-25

-- 1. 卫生责任区表
CREATE TABLE IF NOT EXISTS `hygiene_areas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '责任区ID',
  `station_id` INT NOT NULL COMMENT '场站ID',
  `area_name` VARCHAR(100) NOT NULL COMMENT '责任区名称',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_station_id` (`station_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='卫生责任区表';

-- 2. 卫生点表
CREATE TABLE IF NOT EXISTS `hygiene_points` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '卫生点ID',
  `hygiene_area_id` INT NOT NULL COMMENT '所属责任区ID',
  `station_id` INT NOT NULL COMMENT '场站ID',
  `point_name` VARCHAR(100) NOT NULL COMMENT '卫生点名称',
  `work_requirements` TEXT COMMENT '工作要求及标准',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_hygiene_area_id` (`hygiene_area_id`),
  INDEX `idx_station_id` (`station_id`),
  FOREIGN KEY (`hygiene_area_id`) REFERENCES `hygiene_areas`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='卫生点表';

-- 3. 岗位责任区关联表
CREATE TABLE IF NOT EXISTS `hygiene_position_areas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '关联ID',
  `station_id` INT NOT NULL COMMENT '场站ID',
  `position_name` VARCHAR(50) NOT NULL COMMENT '岗位名称',
  `hygiene_area_id` INT NOT NULL COMMENT '责任区ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_station_id` (`station_id`),
  INDEX `idx_position_name` (`position_name`),
  INDEX `idx_hygiene_area_id` (`hygiene_area_id`),
  UNIQUE KEY `uk_position_area` (`station_id`, `position_name`, `hygiene_area_id`),
  FOREIGN KEY (`hygiene_area_id`) REFERENCES `hygiene_areas`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='岗位责任区关联表';
