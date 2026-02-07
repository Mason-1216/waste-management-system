-- Maintenance plan library table
-- Executed on: 2025-12-27

CREATE TABLE IF NOT EXISTS maintenance_plan_library (
  id INT AUTO_INCREMENT PRIMARY KEY,
  station_id INT NULL COMMENT 'station id',
  equipment_code VARCHAR(50) NOT NULL COMMENT 'equipment code',
  equipment_name VARCHAR(100) NOT NULL COMMENT 'equipment name',
  install_location VARCHAR(200) COMMENT 'install location',
  cycle_type ENUM('daily','weekly','monthly','yearly') NOT NULL DEFAULT 'monthly' COMMENT 'cycle type',
  maintenance_standards JSON DEFAULT NULL COMMENT 'standards list [{name, specification}]',
  is_deleted TINYINT NOT NULL DEFAULT 0 COMMENT 'soft delete flag',
  created_by INT COMMENT 'created by id',
  created_by_name VARCHAR(50) COMMENT 'created by name',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_station_id (station_id),
  INDEX idx_equipment_code (equipment_code),
  INDEX idx_cycle_type (cycle_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='maintenance plan library';

-- Maintenance assignments table
CREATE TABLE IF NOT EXISTS maintenance_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assignment_code VARCHAR(50) NOT NULL UNIQUE COMMENT 'assignment code',
  station_id INT NOT NULL COMMENT 'station id',
  plan_id INT COMMENT 'plan id',
  equipment_code VARCHAR(50) NOT NULL COMMENT 'equipment code',
  equipment_name VARCHAR(100) NOT NULL COMMENT 'equipment name',
  install_location VARCHAR(200) COMMENT 'install location',
  executor_id INT NOT NULL COMMENT 'executor id',
  executor_name VARCHAR(50) COMMENT 'executor name',
  assigner_id INT COMMENT 'assigner id',
  assigner_name VARCHAR(50) COMMENT 'assigner name',
  plan_start_date DATE COMMENT 'plan start date',
  plan_start_time TIME COMMENT 'plan start time',
  plan_end_date DATE COMMENT 'plan end date',
  plan_end_time TIME COMMENT 'plan end time',
  actual_start_date DATE COMMENT 'actual start date',
  actual_end_date DATE COMMENT 'actual end date',
  status ENUM('pending','in_progress','completed') DEFAULT 'pending' COMMENT 'status',
  completion_note TEXT COMMENT 'completion note',
  work_hours DECIMAL(4,2) COMMENT 'work hours',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_station_id (station_id),
  INDEX idx_executor_id (executor_id),
  INDEX idx_status (status),
  INDEX idx_plan_start_date (plan_start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='maintenance assignments';
