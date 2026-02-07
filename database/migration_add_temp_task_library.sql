-- 临时工作任务库表
-- 执行时间: 2025-12-27

-- 创建临时工作任务库表
CREATE TABLE IF NOT EXISTS temporary_task_library (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_name VARCHAR(100) NOT NULL COMMENT '工作名称',
  task_content TEXT NOT NULL COMMENT '具体工作内容',
  standard_hours DECIMAL(4,2) NOT NULL COMMENT '标准工时(h/d)',
  unit_points INT NOT NULL DEFAULT 0 COMMENT '单位积分',
  task_category VARCHAR(50) COMMENT '任务类别',
  score_method VARCHAR(20) COMMENT '给分方式',
  quantity INT NOT NULL DEFAULT 1 COMMENT '数量',
  points_rule TEXT COMMENT '积分规则',
  quantity_editable TINYINT NOT NULL DEFAULT 0 COMMENT '数量是否可修改',
  dispatch_review_required TINYINT NOT NULL DEFAULT 0 COMMENT '派发任务是否强制审核',
  station_id INT NULL COMMENT '场站ID',
  created_by INT COMMENT '创建人ID',
  created_by_name VARCHAR(50) COMMENT '创建人姓名',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_station_id (station_id),
  INDEX idx_task_name (task_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='临时工作任务库';
