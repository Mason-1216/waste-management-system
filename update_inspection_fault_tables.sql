SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS safety_self_inspections (
  id INT PRIMARY KEY AUTO_INCREMENT,
  record_code VARCHAR(50) NOT NULL UNIQUE,
  inspection_type ENUM('safety', 'hygiene') NOT NULL,
  project_id INT NOT NULL,
  station_id INT,
  filler_id INT NOT NULL,
  filler_name VARCHAR(50),
  inspection_date DATE NOT NULL,
  inspection_items JSON,
  photo_urls TEXT,
  submit_time DATETIME NOT NULL,
  is_overdue TINYINT DEFAULT 0,
  overdue_minutes INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_self_filler (filler_id),
  INDEX idx_self_date (inspection_date),
  INDEX idx_self_type (inspection_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS safety_other_inspections (
  id INT PRIMARY KEY AUTO_INCREMENT,
  record_code VARCHAR(50) NOT NULL UNIQUE,
  inspection_type ENUM('safety', 'hygiene') NOT NULL,
  project_id INT NOT NULL,
  station_id INT,
  inspector_id INT NOT NULL,
  inspector_name VARCHAR(50),
  inspection_date DATE NOT NULL,
  inspected_user_id INT,
  inspected_user_name VARCHAR(50),
  violation_description TEXT,
  is_qualified TINYINT DEFAULT 1,
  unqualified_items TEXT,
  photo_urls TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_other_inspector (inspector_id),
  INDEX idx_other_date (inspection_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS fault_reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  report_code VARCHAR(50) NOT NULL UNIQUE,
  equipment_code VARCHAR(50),
  equipment_name VARCHAR(100) NOT NULL,
  installation_location VARCHAR(200),
  fault_date DATE NOT NULL,
  fault_time TIME NOT NULL,
  reporter_id INT NOT NULL,
  reporter_name VARCHAR(50),
  fault_description TEXT NOT NULL,
  project_id INT NOT NULL,
  station_id INT,
  status ENUM('pending', 'assigned', 'processing', 'completed', 'closed') DEFAULT 'pending',
  assigned_to INT,
  assigned_by INT,
  assigned_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_fault_status (status),
  INDEX idx_fault_reporter (reporter_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
