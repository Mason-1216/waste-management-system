-- 安全隐患模块重构迁移脚本
-- 执行日期: 2025-12-27

-- 1. 创建隐患类别库表
CREATE TABLE IF NOT EXISTS hazard_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(50) NOT NULL UNIQUE COMMENT '类别名称',
    sort_order INT DEFAULT 0 COMMENT '排序',
    is_system TINYINT DEFAULT 0 COMMENT '是否系统预置(1=是,0=否)',
    status TINYINT DEFAULT 1 COMMENT '状态(1=启用,0=禁用)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='隐患类别库';

-- 插入默认隐患类别
INSERT IGNORE INTO hazard_categories (category_name, sort_order, is_system, created_at, updated_at) VALUES
('电气', 1, 1, NOW(), NOW()),
('违规违纪', 2, 1, NOW(), NOW()),
('标识', 3, 1, NOW(), NOW()),
('基础设施', 4, 1, NOW(), NOW()),
('环境卫生', 5, 1, NOW(), NOW()),
('机械设备', 6, 1, NOW(), NOW()),
('特种作业', 7, 1, NOW(), NOW()),
('制度文件', 8, 1, NOW(), NOW()),
('消防', 9, 1, NOW(), NOW()),
('特种设备', 10, 1, NOW(), NOW());

-- 2. 创建根本原因库表
CREATE TABLE IF NOT EXISTS hazard_root_causes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cause_name VARCHAR(100) NOT NULL UNIQUE COMMENT '原因名称',
    sort_order INT DEFAULT 0 COMMENT '排序',
    is_system TINYINT DEFAULT 0 COMMENT '是否系统预置(1=是,0=否)',
    status TINYINT DEFAULT 1 COMMENT '状态(1=启用,0=禁用)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='隐患根本原因库';

-- 插入默认根本原因
INSERT IGNORE INTO hazard_root_causes (cause_name, sort_order, is_system, created_at, updated_at) VALUES
('人的不安全行为', 1, 1, NOW(), NOW()),
('物的不安全状态', 2, 1, NOW(), NOW()),
('职责不清', 3, 1, NOW(), NOW()),
('人岗匹配', 4, 1, NOW(), NOW()),
('工作流程', 5, 1, NOW(), NOW()),
('工作标准', 6, 1, NOW(), NOW()),
('工作执行', 7, 1, NOW(), NOW()),
('设计缺陷', 8, 1, NOW(), NOW()),
('劳动防护用品配备不足', 9, 1, NOW(), NOW()),
('安全设施建设投入不足', 10, 1, NOW(), NOW());

-- 3. 修改安全隐患检查表结构
-- 添加发起时间字段
ALTER TABLE safety_hazard_inspections
ADD COLUMN submit_time TIME COMMENT '发起时间' AFTER inspection_date;

-- 添加station_id字段关联场站
ALTER TABLE safety_hazard_inspections
ADD COLUMN station_id INT COMMENT '场站ID' AFTER station_name;

-- 将hazard_category从ENUM改为VARCHAR以支持动态类别
ALTER TABLE safety_hazard_inspections
MODIFY COLUMN hazard_category VARCHAR(50) NOT NULL COMMENT '隐患类别';

-- 移除is_first_found字段（需求中未提及）
-- ALTER TABLE safety_hazard_inspections DROP COLUMN is_first_found;

-- 修改status枚举值: pending(待整改) -> rectified(已整改) -> reviewed(已复核)
ALTER TABLE safety_hazard_inspections
MODIFY COLUMN status ENUM('pending', 'rectified', 'reviewed') DEFAULT 'pending' COMMENT '状态: pending=待整改, rectified=已整改, reviewed=已复核';

-- 4. 修改安全隐患整改表结构
-- 将root_cause从ENUM改为VARCHAR以支持动态原因
ALTER TABLE safety_rectifications
MODIFY COLUMN root_cause VARCHAR(100) NOT NULL COMMENT '根本原因';

-- 移除responsible_person相关字段（需求中整改由站长填写，办理人即站长）
-- 保留punished_person作为被处罚人

-- 添加handler_id字段（办理人，默认为填写整改的站长）
ALTER TABLE safety_rectifications
ADD COLUMN handler_id INT COMMENT '办理人ID' AFTER inspection_id,
ADD COLUMN handler_name VARCHAR(50) COMMENT '办理人姓名' AFTER handler_id;

-- 整改表状态已经够用，不需要修改
-- status: pending(待审核) -> approved(已通过/已复核) -> rejected(已驳回)

-- 5. 添加索引
ALTER TABLE hazard_categories ADD INDEX idx_category_status (status);
ALTER TABLE hazard_root_causes ADD INDEX idx_cause_status (status);
