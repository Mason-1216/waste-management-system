-- 设备保养岗位分配模块迁移脚本
-- 创建时间: 2025-12-31

-- 1. 修改保养计划库表，增加周期调度字段
ALTER TABLE maintenance_plan_library
ADD COLUMN weekly_day INT DEFAULT NULL COMMENT '周保养在周几完成(1-7，1=周一)' AFTER cycle_type,
ADD COLUMN monthly_day INT DEFAULT NULL COMMENT '月保养在每月几号完成(1-31)' AFTER weekly_day,
ADD COLUMN yearly_month INT DEFAULT NULL COMMENT '年保养在每年几月完成(1-12)' AFTER monthly_day,
ADD COLUMN yearly_day INT DEFAULT NULL COMMENT '年保养在每年几号完成(1-31)' AFTER yearly_month;

-- 2. 创建岗位-保养计划关联表
CREATE TABLE IF NOT EXISTS maintenance_position_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  station_id INT NOT NULL COMMENT '场站ID',
  position_name VARCHAR(50) NOT NULL COMMENT '岗位名称',
  plan_id INT NOT NULL COMMENT '保养计划库ID',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_station_position_plan (station_id, position_name, plan_id),
  INDEX idx_station_id (station_id),
  INDEX idx_position_name (position_name),
  INDEX idx_plan_id (plan_id),
  FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES maintenance_plan_library(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='岗位-保养计划关联表';

-- 3. 创建员工保养工作记录表
CREATE TABLE IF NOT EXISTS maintenance_work_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  record_code VARCHAR(50) NOT NULL COMMENT '记录编号',
  station_id INT NOT NULL COMMENT '场站ID',
  plan_id INT NOT NULL COMMENT '保养计划库ID',
  position_name VARCHAR(50) NOT NULL COMMENT '岗位名称',
  equipment_code VARCHAR(50) NOT NULL COMMENT '设备编号',
  equipment_name VARCHAR(100) NOT NULL COMMENT '设备名称',
  install_location VARCHAR(200) DEFAULT NULL COMMENT '安装位置',
  cycle_type ENUM('daily', 'weekly', 'monthly', 'yearly') NOT NULL COMMENT '保养周期',
  work_date DATE NOT NULL COMMENT '工作日期',
  executor_id INT NOT NULL COMMENT '执行人ID',
  executor_name VARCHAR(50) NOT NULL COMMENT '执行人姓名',
  maintenance_items JSON DEFAULT NULL COMMENT '保养标准确认项[{name, specification, confirmed}]',
  maintenance_tools TEXT DEFAULT NULL COMMENT '保养工具',
  work_hours DECIMAL(5,2) DEFAULT NULL COMMENT '保养时长(小时)',
  consumables_list JSON DEFAULT NULL COMMENT '耗材清单[{name, quantity, unit}]',
  parts_list JSON DEFAULT NULL COMMENT '配件清单[{name, quantity, unit}]',
  remark TEXT DEFAULT NULL COMMENT '保养备注',
  status ENUM('pending', 'completed') DEFAULT 'pending' COMMENT '状态',
  submit_time DATETIME DEFAULT NULL COMMENT '提交时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_plan_executor_date (plan_id, executor_id, work_date, cycle_type),
  INDEX idx_station_id (station_id),
  INDEX idx_plan_id (plan_id),
  INDEX idx_executor_id (executor_id),
  INDEX idx_work_date (work_date),
  INDEX idx_status (status),
  FOREIGN KEY (station_id) REFERENCES stations(id),
  FOREIGN KEY (plan_id) REFERENCES maintenance_plan_library(id),
  FOREIGN KEY (executor_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='员工保养工作记录表';
