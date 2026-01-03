-- 为人员岗位管理功能创建新表
CREATE TABLE IF NOT EXISTS position_jobs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    position_name VARCHAR(50) NOT NULL COMMENT '岗位名称',
    job_name VARCHAR(100) NOT NULL COMMENT '工作项目名称',
    standard_hours DECIMAL(4,2) COMMENT '标准工时',
    station_id INT COMMENT '场站ID（可选，用于指定场站的岗位工作）',
    is_active TINYINT DEFAULT 1 COMMENT '是否启用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_position_name (position_name),
    INDEX idx_station_id (station_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='岗位工作项目表';