-- 季度积分奖模块数据库迁移
-- 创建时间: 2026-02-12

-- 季度积分奖分组表
CREATE TABLE IF NOT EXISTS quarterly_award_groups (
    id INT PRIMARY KEY AUTO_INCREMENT,
    group_name VARCHAR(100) NOT NULL COMMENT '分组名称',
    year INT NOT NULL COMMENT '年份',
    quarter INT NOT NULL COMMENT '季度(1-4)',
    per_capita_budget DECIMAL(12,2) COMMENT '人均季度奖金预算',
    total_budget DECIMAL(12,2) COMMENT '总季度奖金预算',
    performance_score DECIMAL(5,2) COMMENT '分组绩效分值',
    award_coefficient DECIMAL(5,2) COMMENT '季度积分奖系数',
    total_points DECIMAL(12,2) COMMENT '分组积分总和',
    linked_group_id INT COMMENT '关联的往期分组ID',
    created_by_id INT,
    created_by_name VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_year_quarter (year, quarter),
    INDEX idx_linked_group (linked_group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='季度积分奖分组表';

-- 季度积分奖明细表
CREATE TABLE IF NOT EXISTS quarterly_award_details (
    id INT PRIMARY KEY AUTO_INCREMENT,
    group_id INT NOT NULL COMMENT '分组ID',
    user_id INT NOT NULL COMMENT '用户ID',
    user_name VARCHAR(50) COMMENT '用户姓名',
    year INT NOT NULL COMMENT '年份',
    quarter INT NOT NULL COMMENT '季度',
    total_points DECIMAL(12,2) COMMENT '个人季度积分总和',
    points_ratio DECIMAL(8,4) COMMENT '个人积分占比',
    award_amount DECIMAL(12,2) COMMENT '个人季度积分奖',
    ranking INT COMMENT '排名',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES quarterly_award_groups(id) ON DELETE CASCADE,
    INDEX idx_group (group_id),
    INDEX idx_user_year_quarter (user_id, year, quarter)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='季度积分奖明细表';
