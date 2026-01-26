-- MySQL dump 10.13  Distrib 8.0.44, for Linux (x86_64)
--
-- Host: localhost    Database: waste_management
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `companies`
--

DROP TABLE IF EXISTS `companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `companies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_name` varchar(100) NOT NULL COMMENT 'å…¬å¸åç§°',
  `company_code` varchar(50) DEFAULT NULL COMMENT 'å…¬å¸ç¼–ç ',
  `description` varchar(200) DEFAULT NULL COMMENT 'æè¿°',
  `status` enum('active','inactive') DEFAULT 'active' COMMENT 'çŠ¶æ€',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `company_name` (`company_name`),
  UNIQUE KEY `company_code` (`company_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='å…¬å¸è¡¨';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `companies`
--

LOCK TABLES `companies` WRITE;
/*!40000 ALTER TABLE `companies` DISABLE KEYS */;
/*!40000 ALTER TABLE `companies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `daily_tasks`
--

DROP TABLE IF EXISTS `daily_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `daily_tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `record_code` varchar(50) NOT NULL COMMENT 'è®°å½•ç¼–å·',
  `user_id` int NOT NULL,
  `user_name` varchar(50) DEFAULT NULL,
  `project_id` int NOT NULL,
  `station_id` int DEFAULT NULL,
  `work_date` date NOT NULL,
  `task_config_id` int NOT NULL,
  `task_name` varchar(100) DEFAULT NULL,
  `times` int DEFAULT '1' COMMENT 'å®Œæˆæ¬¡æ•°',
  `hours_per_time` decimal(4,2) DEFAULT NULL,
  `total_hours` decimal(4,2) DEFAULT NULL,
  `is_fixed_task` tinyint DEFAULT '1' COMMENT 'æ˜¯å¦å›ºå®šä»»åŠ¡',
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `reviewer_id` int DEFAULT NULL,
  `reviewer_name` varchar(50) DEFAULT NULL,
  `review_time` datetime DEFAULT NULL,
  `reject_reason` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `record_code` (`record_code`),
  KEY `idx_daily_user_date` (`user_id`,`work_date`),
  KEY `idx_daily_status` (`status`),
  KEY `daily_tasks_user_id_work_date` (`user_id`,`work_date`),
  KEY `daily_tasks_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='æ¯æ—¥ä»»åŠ¡è®°å½•è¡¨';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daily_tasks`
--

LOCK TABLES `daily_tasks` WRITE;
/*!40000 ALTER TABLE `daily_tasks` DISABLE KEYS */;
/*!40000 ALTER TABLE `daily_tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dept_name` varchar(100) NOT NULL COMMENT 'éƒ¨é—¨åç§°',
  `dept_code` varchar(50) DEFAULT NULL COMMENT 'éƒ¨é—¨ç¼–ç ',
  `description` varchar(200) DEFAULT NULL COMMENT 'æè¿°',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `dept_code` (`dept_code`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='éƒ¨é—¨è¡¨';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipment`
--

DROP TABLE IF EXISTS `equipment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipment` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '设备ID',
  `station_id` int NOT NULL COMMENT '场站ID',
  `equipment_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '设备编号',
  `equipment_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '设备名称',
  `installation_location` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '安装地点',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `station_id` (`station_id`),
  CONSTRAINT `equipment_ibfk_1` FOREIGN KEY (`station_id`) REFERENCES `stations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备管理表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipment`
--

LOCK TABLES `equipment` WRITE;
/*!40000 ALTER TABLE `equipment` DISABLE KEYS */;
INSERT INTO `equipment` VALUES (1,2,'gdghrh','fagertg','hsdf','2026-01-10 23:49:14','2026-01-10 23:49:14'),(2,2,'gesry','gergs','gregr','2026-01-10 23:49:21','2026-01-10 23:49:21'),(3,17,'SJQ-001','固液分离机','厂区1','2026-01-14 10:46:47','2026-01-14 10:46:47'),(4,17,'SJQ-002','风力筛分机','厂区2','2026-01-14 10:48:27','2026-01-14 10:48:35'),(5,17,'SJQ-003','微波消解仪','厂区3','2026-01-14 10:49:04','2026-01-14 10:49:04'),(6,17,'SJQ-004','磁性筛分机','厂区2','2026-01-14 10:49:34','2026-01-14 10:49:34'),(7,17,'SJQ-005','ICP-MS','厂区3','2026-01-14 10:50:08','2026-01-14 10:50:17');
/*!40000 ALTER TABLE `equipment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fault_reports`
--

DROP TABLE IF EXISTS `fault_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fault_reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `report_code` varchar(50) NOT NULL,
  `equipment_code` varchar(50) DEFAULT NULL,
  `equipment_name` varchar(100) NOT NULL,
  `installation_location` varchar(200) DEFAULT NULL,
  `fault_date` date NOT NULL,
  `fault_time` time NOT NULL,
  `reporter_id` int NOT NULL,
  `reporter_name` varchar(50) DEFAULT NULL,
  `fault_description` text NOT NULL,
  `project_id` int NOT NULL,
  `station_id` int DEFAULT NULL,
  `status` enum('pending','assigned','processing','completed','closed') DEFAULT 'pending',
  `assigned_to` int DEFAULT NULL,
  `assigned_by` int DEFAULT NULL,
  `assigned_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `report_code` (`report_code`),
  KEY `idx_fault_status` (`status`),
  KEY `idx_fault_reporter` (`reporter_id`),
  KEY `fault_reports_status` (`status`),
  KEY `fault_reports_reporter_id` (`reporter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='æ•…éšœä¸ŠæŠ¥è¡¨';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fault_reports`
--

LOCK TABLES `fault_reports` WRITE;
/*!40000 ALTER TABLE `fault_reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `fault_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hazard_categories`
--

DROP TABLE IF EXISTS `hazard_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hazard_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '类别名称',
  `sort_order` int DEFAULT '0' COMMENT '排序',
  `is_system` tinyint DEFAULT '0' COMMENT '是否系统预置(1=是,0=否)',
  `status` tinyint DEFAULT '1' COMMENT '状态(1=启用,0=禁用)',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `category_name` (`category_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hazard_categories`
--

LOCK TABLES `hazard_categories` WRITE;
/*!40000 ALTER TABLE `hazard_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `hazard_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hazard_root_causes`
--

DROP TABLE IF EXISTS `hazard_root_causes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hazard_root_causes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cause_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '原因名称',
  `sort_order` int DEFAULT '0' COMMENT '排序',
  `is_system` tinyint DEFAULT '0' COMMENT '是否系统预置(1=是,0=否)',
  `status` tinyint DEFAULT '1' COMMENT '状态(1=启用,0=禁用)',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cause_name` (`cause_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hazard_root_causes`
--

LOCK TABLES `hazard_root_causes` WRITE;
/*!40000 ALTER TABLE `hazard_root_causes` DISABLE KEYS */;
/*!40000 ALTER TABLE `hazard_root_causes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hygiene_areas`
--

DROP TABLE IF EXISTS `hygiene_areas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hygiene_areas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `station_id` int NOT NULL COMMENT '场站ID',
  `area_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '责任区名称',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `station_id` (`station_id`),
  CONSTRAINT `hygiene_areas_ibfk_1` FOREIGN KEY (`station_id`) REFERENCES `stations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hygiene_areas`
--

LOCK TABLES `hygiene_areas` WRITE;
/*!40000 ALTER TABLE `hygiene_areas` DISABLE KEYS */;
INSERT INTO `hygiene_areas` VALUES (1,4,'前','2026-01-17 15:21:29','2026-01-17 15:21:29');
/*!40000 ALTER TABLE `hygiene_areas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hygiene_points`
--

DROP TABLE IF EXISTS `hygiene_points`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hygiene_points` (
  `id` int NOT NULL AUTO_INCREMENT,
  `hygiene_area_id` int NOT NULL COMMENT '所属责任区ID',
  `station_id` int NOT NULL COMMENT '场站ID',
  `point_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '卫生点名称',
  `work_requirements` text COLLATE utf8mb4_unicode_ci COMMENT '工作要求及标准',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `hygiene_area_id` (`hygiene_area_id`),
  KEY `station_id` (`station_id`),
  CONSTRAINT `hygiene_points_ibfk_1` FOREIGN KEY (`hygiene_area_id`) REFERENCES `hygiene_areas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `hygiene_points_ibfk_2` FOREIGN KEY (`station_id`) REFERENCES `stations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hygiene_points`
--

LOCK TABLES `hygiene_points` WRITE;
/*!40000 ALTER TABLE `hygiene_points` DISABLE KEYS */;
INSERT INTO `hygiene_points` VALUES (1,1,4,'111','111111','2026-01-17 15:21:29','2026-01-17 15:21:29'),(2,1,4,'222','22222','2026-01-17 15:21:29','2026-01-17 15:21:29'),(3,1,4,'333','3333','2026-01-17 15:21:29','2026-01-17 15:21:29');
/*!40000 ALTER TABLE `hygiene_points` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hygiene_position_areas`
--

DROP TABLE IF EXISTS `hygiene_position_areas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hygiene_position_areas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `station_id` int NOT NULL COMMENT '场站ID',
  `position_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '岗位名称',
  `hygiene_area_id` int NOT NULL COMMENT '责任区ID',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `station_id` (`station_id`),
  KEY `hygiene_area_id` (`hygiene_area_id`),
  CONSTRAINT `hygiene_position_areas_ibfk_1` FOREIGN KEY (`station_id`) REFERENCES `stations` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `hygiene_position_areas_ibfk_2` FOREIGN KEY (`hygiene_area_id`) REFERENCES `hygiene_areas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hygiene_position_areas`
--

LOCK TABLES `hygiene_position_areas` WRITE;
/*!40000 ALTER TABLE `hygiene_position_areas` DISABLE KEYS */;
/*!40000 ALTER TABLE `hygiene_position_areas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maintenance_assignments`
--

DROP TABLE IF EXISTS `maintenance_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenance_assignments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `assignment_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'assignment code',
  `station_id` int NOT NULL COMMENT 'station id',
  `plan_id` int DEFAULT NULL COMMENT 'plan id',
  `cycle_type` enum('daily','weekly','monthly','yearly') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'maintenance cycle type',
  `equipment_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'equipment code',
  `equipment_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'equipment name',
  `install_location` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'install location',
  `executor_id` int NOT NULL COMMENT 'executor id',
  `executor_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'executor name',
  `assigner_id` int DEFAULT NULL COMMENT 'assigner id',
  `assigner_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'assigner name',
  `plan_start_date` date DEFAULT NULL COMMENT 'plan start date',
  `plan_start_time` time DEFAULT NULL COMMENT 'plan start time',
  `plan_end_date` date DEFAULT NULL COMMENT 'plan end date',
  `plan_end_time` time DEFAULT NULL COMMENT 'plan end time',
  `actual_start_date` date DEFAULT NULL COMMENT 'actual start date',
  `actual_start_time` time DEFAULT NULL COMMENT 'actual start time',
  `actual_end_date` date DEFAULT NULL COMMENT 'actual end date',
  `actual_end_time` time DEFAULT NULL COMMENT 'actual end time',
  `maintenance_content` text COLLATE utf8mb4_unicode_ci COMMENT 'maintenance content',
  `maintenance_tools` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'maintenance tools',
  `maintenance_result` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'maintenance result',
  `observe_days` int DEFAULT NULL COMMENT 'observe days',
  `unsolved_reason` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'unsolved reason',
  `maintenance_items` json DEFAULT NULL COMMENT 'maintenance items',
  `consumables_list` json DEFAULT NULL COMMENT 'maintenance consumables list',
  `parts_list` json DEFAULT NULL COMMENT 'maintenance parts list',
  `status` enum('pending','in_progress','pending_verify','accepted','completed') COLLATE utf8mb4_unicode_ci DEFAULT 'pending' COMMENT 'status',
  `completion_note` text COLLATE utf8mb4_unicode_ci COMMENT 'completion note',
  `work_hours` decimal(4,2) DEFAULT NULL COMMENT 'work hours',
  `verify_by_id` int DEFAULT NULL COMMENT 'verify user id',
  `verify_by_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'verify user name',
  `verify_date` date DEFAULT NULL COMMENT 'verify date',
  `verify_time` time DEFAULT NULL COMMENT 'verify time',
  `verify_comment` text COLLATE utf8mb4_unicode_ci COMMENT 'verify comment',
  `verify_safety` int DEFAULT NULL COMMENT 'verify safety rating',
  `verify_quality` int DEFAULT NULL COMMENT 'verify quality rating',
  `verify_progress` int DEFAULT NULL COMMENT 'verify progress rating',
  `verify_hygiene` int DEFAULT NULL COMMENT 'verify hygiene rating',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `assignment_code` (`assignment_code`),
  KEY `plan_id` (`plan_id`),
  KEY `assigner_id` (`assigner_id`),
  KEY `maintenance_assignments_station_id` (`station_id`),
  KEY `maintenance_assignments_executor_id` (`executor_id`),
  KEY `maintenance_assignments_status` (`status`),
  KEY `maintenance_assignments_plan_start_date` (`plan_start_date`),
  CONSTRAINT `maintenance_assignments_ibfk_1` FOREIGN KEY (`station_id`) REFERENCES `stations` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `maintenance_assignments_ibfk_2` FOREIGN KEY (`plan_id`) REFERENCES `maintenance_plan_library` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `maintenance_assignments_ibfk_3` FOREIGN KEY (`executor_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `maintenance_assignments_ibfk_4` FOREIGN KEY (`assigner_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maintenance_assignments`
--

LOCK TABLES `maintenance_assignments` WRITE;
/*!40000 ALTER TABLE `maintenance_assignments` DISABLE KEYS */;
/*!40000 ALTER TABLE `maintenance_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maintenance_plan_library`
--

DROP TABLE IF EXISTS `maintenance_plan_library`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenance_plan_library` (
  `id` int NOT NULL AUTO_INCREMENT,
  `station_id` int DEFAULT NULL COMMENT '场站ID',
  `equipment_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '设备编号',
  `equipment_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '设备名称',
  `install_location` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '安装位置',
  `cycle_type` enum('daily','weekly','monthly','yearly') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'monthly' COMMENT 'cycle type',
  `daily_enabled` tinyint(1) DEFAULT '1' COMMENT '是否启用日保养',
  `weekly_enabled` tinyint(1) DEFAULT '1' COMMENT '是否启用周保养',
  `monthly_enabled` tinyint(1) DEFAULT '1' COMMENT '是否启用月保养',
  `yearly_enabled` tinyint(1) DEFAULT '1' COMMENT '是否启用年保养',
  `weekly_day` int DEFAULT NULL COMMENT '周保养在周几完成(1-7，1=周一)',
  `monthly_day` int DEFAULT NULL COMMENT '月保养在每月几号完成(1-31)',
  `yearly_month` int DEFAULT NULL COMMENT '年保养在每年几月完成(1-12)',
  `yearly_day` int DEFAULT NULL COMMENT '年保养在每年几号完成(1-31)',
  `daily_standards` json DEFAULT NULL COMMENT '日保养标准列表',
  `weekly_standards` json DEFAULT NULL COMMENT '周保养标准列表',
  `monthly_standards` json DEFAULT NULL COMMENT '月保养标准列表',
  `yearly_standards` json DEFAULT NULL COMMENT '年保养标准列表',
  `maintenance_standards` json DEFAULT NULL COMMENT '保养标准列表 [{name: 标准名称, specification: 保养规范}]',
  `daily_reminder_time` varchar(5) COLLATE utf8mb4_unicode_ci DEFAULT '16:00' COMMENT '日保养提醒时间，格式 HH:mm',
  `weekly_reminder_enabled` tinyint(1) DEFAULT '1' COMMENT '是否启用周保养提醒',
  `monthly_reminder_enabled` tinyint(1) DEFAULT '1' COMMENT '是否启用月保养提醒',
  `yearly_reminder_enabled` tinyint(1) DEFAULT '1' COMMENT '是否启用年保养提醒',
  `created_by` int DEFAULT NULL COMMENT '创建人ID',
  `created_by_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人姓名',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `maintenance_plan_library_station_id` (`station_id`),
  KEY `maintenance_plan_library_equipment_code` (`equipment_code`),
  KEY `idx_cycle_type` (`cycle_type`),
  KEY `maintenance_plan_library_cycle_type` (`cycle_type`),
  CONSTRAINT `maintenance_plan_library_ibfk_1` FOREIGN KEY (`station_id`) REFERENCES `stations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `maintenance_plan_library_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maintenance_plan_library`
--

LOCK TABLES `maintenance_plan_library` WRITE;
/*!40000 ALTER TABLE `maintenance_plan_library` DISABLE KEYS */;
INSERT INTO `maintenance_plan_library` VALUES (1,2,'BJ001','aaa','AAA','monthly',1,1,1,1,6,10,1,10,'[{\"name\": \"1\", \"specification\": \"111\"}, {\"name\": \"2\", \"specification\": \"222\"}]','[{\"name\": \"33\", \"specification\": \"333\"}, {\"name\": \"4\", \"specification\": \"444\"}]','[{\"name\": \"5\", \"specification\": \"555\"}]','[{\"name\": \"6666\", \"specification\": \"666666\"}, {\"name\": \"7\", \"specification\": \"777\"}]','[]','16:00',1,1,1,5,'Test station_manager','2026-01-10 23:12:09','2026-01-10 23:12:09'),(2,17,'SJQ-001','固液分离机','厂区1','monthly',1,1,1,1,6,15,6,15,'[{\"name\": \"日常巡检\", \"specification\": \"检查设备运行状态是否正常\"}]','[{\"name\": \"润滑检查\", \"specification\": \"检查各润滑点油位及油质\"}, {\"name\": \"紧固检查\", \"specification\": \"检查各连接部位螺栓是否松动\"}]','[{\"name\": \"更换滤芯\", \"specification\": \"更换液压油滤芯\"}, {\"name\": \"清洗保养\", \"specification\": \"清洗设备表面及内部\"}, {\"name\": \"电气检查\", \"specification\": \"检查电气线路及接线端子\"}]','[{\"name\": \"大修保养\", \"specification\": \"全面检修设备各部件\"}, {\"name\": \"更换易损件\", \"specification\": \"更换磨损严重的零部件\"}, {\"name\": \"性能测试\", \"specification\": \"测试设备各项性能指标\"}, {\"name\": \"防腐处理\", \"specification\": \"对设备外壳进行防腐处理\"}]','[]','16:00',1,1,1,12,'李四','2026-01-14 10:57:01','2026-01-14 10:57:01'),(3,17,'SJQ-002','风力筛分机','厂区2','monthly',1,1,1,1,5,10,12,20,'[{\"name\": \"皮带检查\", \"specification\": \"检查皮带张紧度及磨损情况\"}]','[{\"name\": \"润滑检查\", \"specification\": \"检查各润滑点油位及油质\"}, {\"name\": \"紧固检查\", \"specification\": \"检查各连接部位螺栓是否松动\"}]','[{\"name\": \"更换滤芯\", \"specification\": \"更换液压油滤芯\"}, {\"name\": \"清洗保养\", \"specification\": \"清洗设备表面及内部\"}, {\"name\": \"电气检查\", \"specification\": \"检查电气线路及接线端子\"}]','[{\"name\": \"大修保养\", \"specification\": \"全面检修设备各部件\"}, {\"name\": \"更换易损件\", \"specification\": \"更换磨损严重的零部件\"}, {\"name\": \"性能测试\", \"specification\": \"测试设备各项性能指标\"}, {\"name\": \"防腐处理\", \"specification\": \"对设备外壳进行防腐处理\"}]','[]','16:00',1,1,1,12,'李四','2026-01-14 10:57:01','2026-01-14 10:57:01'),(4,17,'SJQ-003','微波消解仪','厂区3','monthly',1,1,1,1,5,10,12,20,'[{\"name\": \"皮带检查\", \"specification\": \"检查皮带张紧度及磨损情况\"}]','[{\"name\": \"润滑检查\", \"specification\": \"检查各润滑点油位及油质\"}, {\"name\": \"紧固检查\", \"specification\": \"检查各连接部位螺栓是否松动\"}]','[{\"name\": \"更换滤芯\", \"specification\": \"更换液压油滤芯\"}, {\"name\": \"清洗保养\", \"specification\": \"清洗设备表面及内部\"}, {\"name\": \"电气检查\", \"specification\": \"检查电气线路及接线端子\"}]','[{\"name\": \"大修保养\", \"specification\": \"全面检修设备各部件\"}, {\"name\": \"更换易损件\", \"specification\": \"更换磨损严重的零部件\"}, {\"name\": \"性能测试\", \"specification\": \"测试设备各项性能指标\"}, {\"name\": \"防腐处理\", \"specification\": \"对设备外壳进行防腐处理\"}]','[]','16:00',1,1,1,12,'李四','2026-01-14 10:57:01','2026-01-14 10:57:01'),(5,17,'SJQ-004','磁性筛分机','厂区2','monthly',1,1,1,1,5,10,12,20,'[{\"name\": \"皮带检查\", \"specification\": \"检查皮带张紧度及磨损情况\"}]','[{\"name\": \"润滑检查\", \"specification\": \"检查各润滑点油位及油质\"}, {\"name\": \"紧固检查\", \"specification\": \"检查各连接部位螺栓是否松动\"}]','[{\"name\": \"更换滤芯\", \"specification\": \"更换液压油滤芯\"}, {\"name\": \"清洗保养\", \"specification\": \"清洗设备表面及内部\"}, {\"name\": \"电气检查\", \"specification\": \"检查电气线路及接线端子\"}]','[{\"name\": \"大修保养\", \"specification\": \"全面检修设备各部件\"}, {\"name\": \"更换易损件\", \"specification\": \"更换磨损严重的零部件\"}, {\"name\": \"性能测试\", \"specification\": \"测试设备各项性能指标\"}, {\"name\": \"防腐处理\", \"specification\": \"对设备外壳进行防腐处理\"}]','[]','16:00',1,1,1,12,'李四','2026-01-14 10:57:01','2026-01-14 10:57:01'),(6,17,'SJQ-005','ICP-MS','厂区3','monthly',1,1,1,1,5,10,12,20,'[{\"name\": \"皮带检查\", \"specification\": \"检查皮带张紧度及磨损情况\"}]','[{\"name\": \"润滑检查\", \"specification\": \"检查各润滑点油位及油质\"}, {\"name\": \"紧固检查\", \"specification\": \"检查各连接部位螺栓是否松动\"}]','[{\"name\": \"更换滤芯\", \"specification\": \"更换液压油滤芯\"}, {\"name\": \"清洗保养\", \"specification\": \"清洗设备表面及内部\"}, {\"name\": \"电气检查\", \"specification\": \"检查电气线路及接线端子\"}]','[{\"name\": \"大修保养\", \"specification\": \"全面检修设备各部件\"}, {\"name\": \"更换易损件\", \"specification\": \"更换磨损严重的零部件\"}, {\"name\": \"性能测试\", \"specification\": \"测试设备各项性能指标\"}, {\"name\": \"防腐处理\", \"specification\": \"对设备外壳进行防腐处理\"}]','[]','16:00',1,1,1,12,'李四','2026-01-14 10:57:01','2026-01-14 10:57:01');
/*!40000 ALTER TABLE `maintenance_plan_library` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maintenance_plans`
--

DROP TABLE IF EXISTS `maintenance_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenance_plans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `plan_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` int NOT NULL,
  `station_id` int DEFAULT NULL,
  `equipment_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `equipment_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cycle_type` enum('daily','weekly','monthly','quarterly','yearly','custom') COLLATE utf8mb4_unicode_ci NOT NULL,
  `cycle_value` int DEFAULT '1' COMMENT '周期值',
  `maintenance_content` text COLLATE utf8mb4_unicode_ci,
  `assigned_user_id` int DEFAULT NULL,
  `assigned_user_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `last_maintenance_date` date DEFAULT NULL,
  `next_maintenance_date` date DEFAULT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_by` int DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `plan_code` (`plan_code`),
  KEY `station_id` (`station_id`),
  KEY `maintenance_plans_project_id` (`project_id`),
  KEY `maintenance_plans_next_maintenance_date` (`next_maintenance_date`),
  CONSTRAINT `maintenance_plans_ibfk_1` FOREIGN KEY (`station_id`) REFERENCES `stations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maintenance_plans`
--

LOCK TABLES `maintenance_plans` WRITE;
/*!40000 ALTER TABLE `maintenance_plans` DISABLE KEYS */;
/*!40000 ALTER TABLE `maintenance_plans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maintenance_position_plans`
--

DROP TABLE IF EXISTS `maintenance_position_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenance_position_plans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `station_id` int NOT NULL COMMENT '场站ID',
  `position_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '岗位名称',
  `plan_id` int NOT NULL COMMENT '保养计划库ID',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `maintenance_position_plans_station_id_position_name_plan_id` (`station_id`,`position_name`,`plan_id`),
  KEY `plan_id` (`plan_id`),
  CONSTRAINT `maintenance_position_plans_ibfk_1` FOREIGN KEY (`station_id`) REFERENCES `stations` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `maintenance_position_plans_ibfk_2` FOREIGN KEY (`plan_id`) REFERENCES `maintenance_plan_library` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maintenance_position_plans`
--

LOCK TABLES `maintenance_position_plans` WRITE;
/*!40000 ALTER TABLE `maintenance_position_plans` DISABLE KEYS */;
INSERT INTO `maintenance_position_plans` VALUES (1,2,'分析',1,'2026-01-10 23:12:18','2026-01-10 23:12:18'),(2,17,'采购',2,'2026-01-14 11:08:32','2026-01-14 11:08:32'),(3,17,'采购',3,'2026-01-14 11:08:32','2026-01-14 11:08:32'),(4,17,'检查',4,'2026-01-14 11:08:44','2026-01-14 11:08:44'),(5,17,'检查',5,'2026-01-14 11:08:44','2026-01-14 11:08:44'),(6,17,'站长',6,'2026-01-14 11:08:51','2026-01-14 11:08:51');
/*!40000 ALTER TABLE `maintenance_position_plans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maintenance_records`
--

DROP TABLE IF EXISTS `maintenance_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenance_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `record_code` varchar(50) NOT NULL,
  `plan_id` int DEFAULT NULL COMMENT 'å…³è”ä¿å…»è®¡åˆ’ID',
  `project_id` int NOT NULL,
  `station_id` int DEFAULT NULL,
  `equipment_name` varchar(100) NOT NULL,
  `equipment_code` varchar(50) DEFAULT NULL,
  `maintenance_date` date NOT NULL,
  `maintainer_id` int NOT NULL,
  `maintainer_name` varchar(50) DEFAULT NULL,
  `maintenance_content` text,
  `result` enum('normal','found_issue') DEFAULT 'normal',
  `issue_description` text,
  `handling_measures` text,
  `photo_urls` text COMMENT 'JSONæ•°ç»„',
  `work_hours` decimal(4,2) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `reviewer_id` int DEFAULT NULL,
  `reviewer_name` varchar(50) DEFAULT NULL,
  `review_time` datetime DEFAULT NULL,
  `reject_reason` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `record_code` (`record_code`),
  KEY `idx_maintenance_plan` (`plan_id`),
  KEY `idx_maintenance_status` (`status`),
  KEY `maintenance_records_plan_id` (`plan_id`),
  KEY `maintenance_records_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ä¿å…»è®°å½•è¡¨';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maintenance_records`
--

LOCK TABLES `maintenance_records` WRITE;
/*!40000 ALTER TABLE `maintenance_records` DISABLE KEYS */;
/*!40000 ALTER TABLE `maintenance_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maintenance_work_records`
--

DROP TABLE IF EXISTS `maintenance_work_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenance_work_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `record_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '记录编号',
  `station_id` int NOT NULL COMMENT '场站ID',
  `plan_id` int NOT NULL COMMENT '保养计划库ID',
  `position_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '岗位名称',
  `equipment_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '设备编号',
  `equipment_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '设备名称',
  `install_location` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '安装位置',
  `cycle_type` enum('daily','weekly','monthly','yearly') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '保养周期',
  `work_date` date NOT NULL COMMENT '工作日期',
  `executor_id` int NOT NULL COMMENT '执行人ID',
  `executor_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '执行人姓名',
  `maintenance_items` json DEFAULT NULL COMMENT '保养标准确认项[{name, specification, confirmed}]',
  `maintenance_tools` text COLLATE utf8mb4_unicode_ci COMMENT '保养工具',
  `work_hours` decimal(5,2) DEFAULT NULL COMMENT '保养时长(小时)',
  `consumables_list` json DEFAULT NULL COMMENT '耗材清单[{name, quantity, unit}]',
  `parts_list` json DEFAULT NULL COMMENT '配件清单[{name, quantity, unit}]',
  `remark` text COLLATE utf8mb4_unicode_ci COMMENT '保养备注',
  `status` enum('pending','completed','verified') COLLATE utf8mb4_unicode_ci DEFAULT 'pending' COMMENT '状态: pending-待完成, completed-已完成, verified-已验收',
  `submit_time` datetime DEFAULT NULL COMMENT '提交时间',
  `verifier_id` int DEFAULT NULL COMMENT '验收人ID',
  `verifier_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '验收人姓名',
  `verify_time` datetime DEFAULT NULL COMMENT '验收时间',
  `verify_result` enum('pass','fail') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '验收结果',
  `verify_remark` text COLLATE utf8mb4_unicode_ci COMMENT '验收备注',
  `is_overdue` tinyint(1) DEFAULT '0' COMMENT '是否延期',
  `planned_date` date DEFAULT NULL COMMENT '计划完成日期',
  `last_reminder_time` datetime DEFAULT NULL COMMENT '最后提醒时间',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mwr_plan_exec_date_cycle` (`plan_id`,`executor_id`,`work_date`,`cycle_type`),
  KEY `station_id` (`station_id`),
  KEY `executor_id` (`executor_id`),
  CONSTRAINT `maintenance_work_records_ibfk_1` FOREIGN KEY (`station_id`) REFERENCES `stations` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `maintenance_work_records_ibfk_2` FOREIGN KEY (`plan_id`) REFERENCES `maintenance_plan_library` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `maintenance_work_records_ibfk_3` FOREIGN KEY (`executor_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maintenance_work_records`
--

LOCK TABLES `maintenance_work_records` WRITE;
/*!40000 ALTER TABLE `maintenance_work_records` DISABLE KEYS */;
INSERT INTO `maintenance_work_records` VALUES (1,'MWR20260110155141TTJA',2,1,'分析','BJ001','aaa','AAA','daily','2026-01-10',3,'Test operator','[{\"name\": \"1\", \"qualified\": \"yes\", \"specification\": \"111\"}, {\"name\": \"2\", \"qualified\": \"yes\", \"specification\": \"222\"}]','反对和干部',3.00,'[{\"name\": \"二十个\", \"spec\": \"gres\", \"model\": \" 过热三个\", \"quantity\": 0}]','[{\"name\": \"Segway\", \"spec\": \"过热三个\", \"model\": \"过热三个\", \"reason\": \"\", \"quantity\": 0}]','','completed','2026-01-10 23:51:41',NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,'2026-01-10 23:51:41','2026-01-10 23:51:41'),(2,'MWR20260110155152X7BY',2,1,'分析','BJ001','aaa','AAA','monthly','2026-01-10',3,'Test operator','[{\"name\": \"5\", \"qualified\": \"yes\", \"specification\": \"555\"}]','',0.00,'[]','[]','','completed','2026-01-10 23:51:52',NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,'2026-01-10 23:51:52','2026-01-10 23:51:52'),(3,'MWR20260114111018K711',17,6,'站长','SJQ-005','ICP-MS','厂区3','daily','2026-01-14',12,'李四','[{\"name\": \"皮带检查\", \"qualified\": \"yes\", \"specification\": \"检查皮带张紧度及磨损情况\"}]','d',0.00,'[]','[]','','completed','2026-01-14 11:10:18',NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,'2026-01-14 11:10:18','2026-01-14 11:10:18'),(4,'MWR20260114113430A2DA',17,2,'采购','SJQ-001','固液分离机','厂区1','daily','2026-01-14',13,'王五','[{\"name\": \"日常巡检\", \"qualified\": \"yes\", \"specification\": \"检查设备运行状态是否正常\"}]','',0.00,'[]','[]','','completed','2026-01-14 11:34:30',NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,'2026-01-14 11:34:30','2026-01-14 11:34:30'),(5,'MWR202601141134369YXU',17,3,'采购','SJQ-002','风力筛分机','厂区2','daily','2026-01-14',13,'王五','[{\"name\": \"皮带检查\", \"qualified\": \"yes\", \"specification\": \"检查皮带张紧度及磨损情况\"}]','',0.00,'[]','[]','','completed','2026-01-14 11:34:36',NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,'2026-01-14 11:34:36','2026-01-14 11:34:36'),(6,'MWR2026011411360629S5',17,6,'站长','SJQ-005','ICP-MS','厂区3','monthly','2026-01-14',12,'李四','[{\"name\": \"更换滤芯\", \"qualified\": \"yes\", \"specification\": \"更换液压油滤芯\"}, {\"name\": \"清洗保养\", \"qualified\": \"yes\", \"specification\": \"清洗设备表面及内部\"}, {\"name\": \"电气检查\", \"qualified\": \"yes\", \"specification\": \"检查电气线路及接线端子\"}]','',0.00,'[]','[]','','completed','2026-01-14 11:36:06',NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,'2026-01-14 11:36:06','2026-01-14 11:36:06');
/*!40000 ALTER TABLE `maintenance_work_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `material_requisitions`
--

DROP TABLE IF EXISTS `material_requisitions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_requisitions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `requisition_code` varchar(50) NOT NULL,
  `repair_record_id` int DEFAULT NULL COMMENT 'å…³è”ç»´ä¿®è®°å½•ID',
  `applicant_id` int NOT NULL,
  `applicant_name` varchar(50) DEFAULT NULL,
  `material_list` json NOT NULL COMMENT 'ç‰©æ–™æ¸…å• [{name,spec,quantity,unit_price}]',
  `total_amount` decimal(10,2) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `approver_id` int DEFAULT NULL,
  `approver_name` varchar(50) DEFAULT NULL,
  `approve_time` datetime DEFAULT NULL,
  `reject_reason` text,
  `project_id` int NOT NULL,
  `station_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `requisition_code` (`requisition_code`),
  KEY `idx_requisition_status` (`status`),
  KEY `idx_requisition_applicant` (`applicant_id`),
  KEY `material_requisitions_status` (`status`),
  KEY `material_requisitions_applicant_id` (`applicant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='é¢†æ–™ç”³è¯·è¡¨';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_requisitions`
--

LOCK TABLES `material_requisitions` WRITE;
/*!40000 ALTER TABLE `material_requisitions` DISABLE KEYS */;
/*!40000 ALTER TABLE `material_requisitions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mqtt_messages`
--

DROP TABLE IF EXISTS `mqtt_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mqtt_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `topic` varchar(200) NOT NULL,
  `message_code` varchar(20) DEFAULT NULL,
  `msg_id` varchar(50) DEFAULT NULL,
  `gateway_sn` varchar(50) DEFAULT NULL,
  `event_time` bigint DEFAULT NULL,
  `payload_json` json DEFAULT NULL,
  `data_value` json DEFAULT NULL,
  `payload_text` text,
  `qos` tinyint DEFAULT NULL,
  `retain` tinyint DEFAULT '0',
  `received_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mqtt_messages_topic` (`topic`),
  KEY `idx_mqtt_messages_gateway_sn` (`gateway_sn`),
  KEY `idx_mqtt_messages_received_at` (`received_at`),
  KEY `idx_mqtt_messages_event_time` (`event_time`),
  KEY `mqtt_messages_topic` (`topic`),
  KEY `mqtt_messages_gateway_sn` (`gateway_sn`),
  KEY `mqtt_messages_received_at` (`received_at`),
  KEY `mqtt_messages_event_time` (`event_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='MQTT message storage';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mqtt_messages`
--

LOCK TABLES `mqtt_messages` WRITE;
/*!40000 ALTER TABLE `mqtt_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `mqtt_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mqtt_metrics`
--

DROP TABLE IF EXISTS `mqtt_metrics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mqtt_metrics` (
  `id` int NOT NULL AUTO_INCREMENT,
  `variable_name` varchar(100) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `metric_type` varchar(50) NOT NULL,
  `unit` varchar(50) DEFAULT NULL,
  `is_enabled` tinyint DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mqtt_metrics_variable_name` (`variable_name`),
  KEY `idx_mqtt_metrics_metric_type` (`metric_type`),
  KEY `idx_mqtt_metrics_is_enabled` (`is_enabled`),
  KEY `mqtt_metrics_variable_name` (`variable_name`),
  KEY `mqtt_metrics_metric_type` (`metric_type`),
  KEY `mqtt_metrics_is_enabled` (`is_enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='MQTT metric definitions';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mqtt_metrics`
--

LOCK TABLES `mqtt_metrics` WRITE;
/*!40000 ALTER TABLE `mqtt_metrics` DISABLE KEYS */;
/*!40000 ALTER TABLE `mqtt_metrics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `notify_type` enum('inspection_overdue','task_pending','approval_request','system') NOT NULL DEFAULT 'system' COMMENT 'ç±»åž‹',
  `title` varchar(200) NOT NULL COMMENT 'æ ‡é¢˜',
  `content` text COMMENT 'å†…å®¹',
  `receiver_id` int DEFAULT NULL COMMENT 'æŽ¥æ”¶ç”¨æˆ·ID',
  `receiver_name` varchar(50) DEFAULT NULL COMMENT 'æŽ¥æ”¶äºº',
  `is_read` tinyint DEFAULT '0' COMMENT 'æ˜¯å¦å·²è¯»',
  `related_id` int DEFAULT NULL COMMENT 'å…³è”ä¸šåŠ¡ID',
  `related_type` varchar(50) DEFAULT NULL COMMENT 'å…³è”ä¸šåŠ¡ç±»åž‹',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `notifications_receiver_id` (`receiver_id`),
  KEY `notifications_is_read` (`is_read`),
  KEY `notifications_notify_type` (`notify_type`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='é€šçŸ¥è¡¨';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,'system','临时任务提醒','任务名称：gdsaf\n指派人：Test station_manager',3,'Test operator',0,1,'temporary_task','2026-01-10 23:48:37','2026-01-10 23:48:37'),(2,'system','设备故障提醒','维修单号：RR202601101549329J35\n设备名称：fagertg',5,'Test station_manager',0,1,'repair_record','2026-01-10 23:49:32','2026-01-10 23:49:32'),(3,'system','设备故障派单提醒','维修单号：RR202601101549329J35\n设备名称：fagertg',4,'Test maintenance',0,1,'repair_record','2026-01-10 23:49:46','2026-01-10 23:49:46'),(4,'system','设备故障派单提醒','维修单号：RR202601101549329J35\n设备名称：fagertg',5,'Test station_manager',0,1,'repair_record','2026-01-10 23:49:46','2026-01-10 23:49:46'),(5,'system','设备故障提醒','维修单号：RR20260110155521ZX60\n设备名称：gergs',3,'Test operator',0,2,'repair_record','2026-01-10 23:55:21','2026-01-10 23:55:21'),(6,'system','设备故障提醒','维修单号：RR20260114125953Q7JH\n设备名称：磁性筛分机',13,'王五',0,3,'repair_record','2026-01-14 12:59:53','2026-01-14 12:59:53'),(7,'system','设备故障提醒','维修单号：RR202601141300031Q50\n设备名称：微波消解仪',13,'王五',0,4,'repair_record','2026-01-14 13:00:03','2026-01-14 13:00:03'),(8,'system','设备故障提醒','维修单号：RR20260114130012OFHQ\n设备名称：固液分离机',13,'王五',0,5,'repair_record','2026-01-14 13:00:12','2026-01-14 13:00:12'),(9,'system','设备故障提醒','维修单号：RR20260114130025WDTC\n设备名称：风力筛分机',13,'王五',0,6,'repair_record','2026-01-14 13:00:25','2026-01-14 13:00:25'),(10,'system','设备故障派单提醒','维修单号：RR20260114130012OFHQ\n设备名称：固液分离机',4,'维修1',0,5,'repair_record','2026-01-14 13:01:25','2026-01-14 13:01:25'),(11,'system','设备故障派单提醒','维修单号：RR20260114130012OFHQ\n设备名称：固液分离机',12,'李四',1,5,'repair_record','2026-01-14 13:01:25','2026-01-14 13:01:51'),(12,'system','设备故障派单提醒','维修单号：RR202601141300031Q50\n设备名称：微波消解仪',4,'维修1',0,4,'repair_record','2026-01-14 13:02:08','2026-01-14 13:02:08'),(13,'system','设备故障派单提醒','维修单号：RR202601141300031Q50\n设备名称：微波消解仪',12,'李四',1,4,'repair_record','2026-01-14 13:02:08','2026-01-15 11:40:34'),(14,'system','设备故障派单提醒','维修单号：RR20260114125953Q7JH\n设备名称：磁性筛分机',4,'维修1',0,3,'repair_record','2026-01-14 13:04:05','2026-01-14 13:04:05'),(15,'system','设备故障派单提醒','维修单号：RR20260114125953Q7JH\n设备名称：磁性筛分机',12,'李四',1,3,'repair_record','2026-01-14 13:04:05','2026-01-15 11:40:31'),(16,'system','帮助与反馈','来自：部门副经理1\n类型：bug\n内容：1111\n联系方式：无\n图片：无',1,'系统管理员',1,NULL,'feedback','2026-01-17 15:39:21','2026-01-17 15:54:42'),(17,'system','帮助与反馈','来自：部门副经理1\n类型：bug\n内容：1111\n联系方式：无\n图片：无',16,'SU',1,NULL,'feedback','2026-01-17 15:39:21','2026-01-17 20:59:06'),(18,'system','帮助与反馈','来自：部门副经理1\n类型：bug\n内容：1111\n联系方式：无\n图片：无',19,'吴霞',0,NULL,'feedback','2026-01-17 15:39:21','2026-01-17 15:39:21');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `operation_logs`
--

DROP TABLE IF EXISTS `operation_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `operation_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `user_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `operation_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '操作类型',
  `operation_module` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '操作模块',
  `operation_detail` text COLLATE utf8mb4_unicode_ci COMMENT '操作详情',
  `ip_address` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `operation_logs_user_id` (`user_id`),
  KEY `operation_logs_operation_type` (`operation_type`),
  KEY `operation_logs_created_at` (`created_at`),
  CONSTRAINT `operation_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `operation_logs`
--

LOCK TABLES `operation_logs` WRITE;
/*!40000 ALTER TABLE `operation_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `operation_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `permission_code` varchar(100) NOT NULL COMMENT 'æƒé™ç¼–ç ',
  `permission_name` varchar(100) NOT NULL COMMENT 'æƒé™åç§°',
  `resource_type` enum('menu','button','api') DEFAULT 'api' COMMENT 'èµ„æºç±»åž‹',
  `parent_id` int DEFAULT '0' COMMENT 'çˆ¶çº§æƒé™ID',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permission_code` (`permission_code`)
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='æƒé™è¡¨';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'menu:/home','首页','menu',0,'2026-01-10 21:25:07'),(2,'menu:/notifications','消息通知','menu',0,'2026-01-10 21:25:07'),(3,'menu:/user-management','用户管理','menu',0,'2026-01-10 21:25:07'),(4,'menu:/organization-management','组织架构','menu',0,'2026-01-10 21:25:07'),(5,'menu:/mqtt-messages','MQTT数据','menu',0,'2026-01-10 21:25:07'),(6,'menu:/mqtt-metrics','指标清单','menu',0,'2026-01-10 21:25:07'),(7,'menu:/schedule','排班表','menu',0,'2026-01-10 21:25:07'),(8,'menu:/safety','安全检查','menu',0,'2026-01-10 21:25:07'),(9,'menu:/safety-self-inspection','安全自检','menu',8,'2026-01-10 21:25:07'),(10,'menu:/safety-other-inspection','安全他检','menu',8,'2026-01-10 21:25:07'),(11,'menu:/safety-check-management','检查项目管理','menu',8,'2026-01-10 21:25:07'),(12,'menu:/safety-rectification','安全隐患','menu',0,'2026-01-10 21:25:07'),(13,'menu:/hygiene','卫生检查','menu',0,'2026-01-10 21:25:07'),(14,'menu:/hygiene-self-inspection','卫生自检','menu',13,'2026-01-10 21:25:07'),(15,'menu:/hygiene-other-inspection','卫生他检','menu',13,'2026-01-10 21:25:07'),(16,'menu:/position-work','岗位工作','menu',0,'2026-01-10 21:25:07'),(17,'menu:/temporary-tasks','临时工作','menu',0,'2026-01-10 21:25:07'),(18,'menu:/maintenance-task','设备保养','menu',0,'2026-01-10 21:25:08'),(19,'menu:/maintenance-record','保养记录','menu',0,'2026-01-10 21:25:08'),(20,'menu:/device-faults','设备故障','menu',0,'2026-01-10 21:25:08'),(21,'menu:/reports','数据报表','menu',0,'2026-01-10 21:25:08'),(22,'menu:/price-management','单价管理','menu',0,'2026-01-10 21:25:08'),(23,'menu:/change-password','修改密码','menu',0,'2026-01-10 21:25:08'),(24,'menu:/help-feedback','帮助与反馈','menu',0,'2026-01-10 21:25:08'),(25,'module:home','首页','api',0,'2026-01-10 21:25:08'),(26,'module:notifications','消息通知','api',0,'2026-01-10 21:25:08'),(27,'module:user-management','用户管理','api',0,'2026-01-10 21:25:08'),(28,'module:organization-management','组织架构','api',0,'2026-01-10 21:25:08'),(29,'module:mqtt-messages','MQTT数据','api',0,'2026-01-10 21:25:08'),(30,'module:mqtt-metrics','指标清单','api',0,'2026-01-10 21:25:08'),(31,'module:schedule','排班表','api',0,'2026-01-10 21:25:08'),(32,'module:safety-self-inspection','安全自检','api',0,'2026-01-10 21:25:08'),(33,'module:safety-other-inspection','安全他检','api',0,'2026-01-10 21:25:08'),(34,'module:safety-check-management','检查项目管理','api',0,'2026-01-10 21:25:08'),(35,'module:safety-rectification','安全隐患','api',0,'2026-01-10 21:25:08'),(36,'module:hygiene-self-inspection','卫生自检','api',0,'2026-01-10 21:25:08'),(37,'module:hygiene-other-inspection','卫生他检','api',0,'2026-01-10 21:25:08'),(38,'module:position-work','岗位工作','api',0,'2026-01-10 21:25:08'),(39,'module:temporary-tasks','临时工作','api',0,'2026-01-10 21:25:08'),(40,'module:maintenance-task','设备保养','api',0,'2026-01-10 21:25:08'),(41,'module:maintenance-record','保养记录','api',0,'2026-01-10 21:25:08'),(42,'module:device-faults','设备故障','api',0,'2026-01-10 21:25:08'),(43,'module:reports','数据报表','api',0,'2026-01-10 21:25:08'),(44,'module:price-management','单价管理','api',0,'2026-01-10 21:25:08'),(45,'module:change-password','修改密码','api',0,'2026-01-10 21:25:08'),(46,'module:help-feedback','帮助与反馈','api',0,'2026-01-10 21:25:08'),(47,'menu:/plc-records','PLC记录','menu',0,'2026-01-17 15:39:36'),(48,'menu:/equipment-maintenance','设备保养','menu',0,'2026-01-17 15:39:36'),(49,'module:plc-records','PLC记录','api',0,'2026-01-17 15:39:36'),(50,'module:equipment-maintenance','设备保养','api',0,'2026-01-17 15:39:36');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `position_jobs`
--

DROP TABLE IF EXISTS `position_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `position_jobs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `position_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '岗位名称',
  `job_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '工作项目名称',
  `standard_hours` decimal(4,2) DEFAULT NULL COMMENT '标准工时',
  `points` int DEFAULT NULL COMMENT '积分',
  `station_id` int DEFAULT NULL COMMENT '场站ID（可选，用于指定场站的岗位工作）',
  `is_active` tinyint DEFAULT '1' COMMENT '是否启用',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `station_id` (`station_id`),
  CONSTRAINT `position_jobs_ibfk_1` FOREIGN KEY (`station_id`) REFERENCES `stations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `position_jobs`
--

LOCK TABLES `position_jobs` WRITE;
/*!40000 ALTER TABLE `position_jobs` DISABLE KEYS */;
INSERT INTO `position_jobs` VALUES (1,'分析','分析2',2.00,NULL,2,1,'2026-01-10 22:58:33','2026-01-10 22:58:33'),(2,'分析','分析1',1.00,NULL,2,1,'2026-01-10 22:58:33','2026-01-10 22:58:33'),(3,'分析','分析3',3.00,NULL,2,1,'2026-01-10 22:58:33','2026-01-10 22:58:33'),(4,'采购','采购3',1.00,NULL,17,1,'2026-01-14 10:44:20','2026-01-14 10:45:05'),(5,'采购','采购2',4.00,NULL,17,1,'2026-01-14 10:44:20','2026-01-14 10:45:12'),(6,'采购','采购1',3.00,NULL,17,1,'2026-01-14 10:44:20','2026-01-14 10:45:16'),(7,'检查','检查2',3.00,NULL,17,1,'2026-01-14 10:45:00','2026-01-14 10:45:00'),(8,'检查','检查1',2.00,NULL,17,1,'2026-01-14 10:45:00','2026-01-14 10:45:00'),(9,'检查','检查3',3.00,NULL,17,1,'2026-01-14 10:45:00','2026-01-14 10:45:00');
/*!40000 ALTER TABLE `position_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `position_tasks`
--

DROP TABLE IF EXISTS `position_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `position_tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `position_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '岗位名称',
  `task_config_id` int NOT NULL,
  `is_required` tinyint DEFAULT '1' COMMENT '是否必做',
  `sort_order` int DEFAULT '0',
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `task_config_id` (`task_config_id`),
  KEY `position_tasks_project_id_position_name` (`project_id`,`position_name`),
  CONSTRAINT `position_tasks_ibfk_1` FOREIGN KEY (`task_config_id`) REFERENCES `task_configs` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `position_tasks`
--

LOCK TABLES `position_tasks` WRITE;
/*!40000 ALTER TABLE `position_tasks` DISABLE KEYS */;
/*!40000 ALTER TABLE `position_tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `position_work_logs`
--

DROP TABLE IF EXISTS `position_work_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `position_work_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户ID',
  `user_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '用户姓名',
  `station_id` int DEFAULT NULL COMMENT '场站ID',
  `station_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '场站名称',
  `position_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '岗位名称',
  `position_job_id` int DEFAULT NULL COMMENT '关联岗位工作项目ID',
  `work_date` date NOT NULL COMMENT '工作日期',
  `work_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '工作项目名称',
  `standard_hours` decimal(5,2) DEFAULT '0.00' COMMENT '标准工时(小时)',
  `actual_hours` decimal(5,2) DEFAULT '0.00' COMMENT '实际工时(小时)',
  `is_completed` tinyint DEFAULT '0' COMMENT '是否完成：0未完成 1已完成',
  `progress` int DEFAULT '0' COMMENT '完成进度 0-100',
  `remark` text COLLATE utf8mb4_unicode_ci COMMENT '备注',
  `is_overtime` tinyint DEFAULT '0' COMMENT '是否超时',
  `appeal_status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '申诉状态：pending待审批, approved已通过, rejected已驳回',
  `appeal_reason` text COLLATE utf8mb4_unicode_ci COMMENT '申诉原因',
  `appeal_time` datetime DEFAULT NULL COMMENT '申诉时间',
  `approver_id` int DEFAULT NULL COMMENT '审批人ID',
  `approver_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '审批人姓名',
  `approve_time` datetime DEFAULT NULL COMMENT '审批时间',
  `approve_remark` text COLLATE utf8mb4_unicode_ci COMMENT '审批备注',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `position_job_id` (`position_job_id`),
  KEY `position_work_logs_user_id_work_date` (`user_id`,`work_date`),
  KEY `position_work_logs_station_id` (`station_id`),
  KEY `position_work_logs_appeal_status` (`appeal_status`),
  CONSTRAINT `position_work_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `position_work_logs_ibfk_2` FOREIGN KEY (`station_id`) REFERENCES `stations` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `position_work_logs_ibfk_3` FOREIGN KEY (`position_job_id`) REFERENCES `position_jobs` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `position_work_logs`
--

LOCK TABLES `position_work_logs` WRITE;
/*!40000 ALTER TABLE `position_work_logs` DISABLE KEYS */;
INSERT INTO `position_work_logs` VALUES (1,3,'Test operator',2,'板井站','分析',1,'2026-01-10','分析2',2.00,0.00,1,0,'',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-01-10 23:50:53','2026-01-10 23:50:53'),(2,3,'Test operator',2,'板井站','分析',2,'2026-01-10','分析1',1.00,0.00,NULL,0,'',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-01-10 23:50:54','2026-01-10 23:50:54'),(3,3,'Test operator',2,'板井站','分析',3,'2026-01-10','分析3',3.00,0.00,NULL,0,'',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-01-10 23:50:54','2026-01-10 23:50:54');
/*!40000 ALTER TABLE `position_work_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `price_management`
--

DROP TABLE IF EXISTS `price_management`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `price_management` (
  `id` int NOT NULL AUTO_INCREMENT,
  `item_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '项目名称',
  `item_category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '类别',
  `specification` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `effective_date` date DEFAULT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_by` int DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `price_management_item_category` (`item_category`),
  KEY `price_management_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `price_management`
--

LOCK TABLES `price_management` WRITE;
/*!40000 ALTER TABLE `price_management` DISABLE KEYS */;
/*!40000 ALTER TABLE `price_management` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_stations`
--

DROP TABLE IF EXISTS `project_stations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_stations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `station_id` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_project_station` (`project_id`,`station_id`),
  KEY `station_id` (`station_id`),
  CONSTRAINT `project_stations_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  CONSTRAINT `project_stations_ibfk_2` FOREIGN KEY (`station_id`) REFERENCES `stations` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='é¡¹ç›®åœºç«™å…³è”è¡¨';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_stations`
--

LOCK TABLES `project_stations` WRITE;
/*!40000 ALTER TABLE `project_stations` DISABLE KEYS */;
INSERT INTO `project_stations` VALUES (1,1,1,'2026-01-10 21:12:45','2026-01-10 21:12:45');
/*!40000 ALTER TABLE `project_stations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_code` varchar(50) NOT NULL COMMENT 'é¡¹ç›®ç¼–ç ',
  `project_name` varchar(100) NOT NULL COMMENT 'é¡¹ç›®åç§°',
  `department_id` int DEFAULT NULL COMMENT 'æ‰€å±žéƒ¨é—¨ID',
  `address` varchar(200) DEFAULT NULL COMMENT 'åœ°å€',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `project_code` (`project_code`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='é¡¹ç›®è¡¨';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
INSERT INTO `projects` VALUES (1,'PROJ001','ç¤ºèŒƒé¡¹ç›®',NULL,'ç¤ºèŒƒåœ°å€','active','2026-01-10 21:12:45','2026-01-10 21:12:45');
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `repair_records`
--

DROP TABLE IF EXISTS `repair_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `repair_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `record_code` varchar(50) DEFAULT NULL COMMENT 'ç»´ä¿®å•å·',
  `fault_report_id` int NOT NULL COMMENT 'å…³è”æ•…éšœä¸ŠæŠ¥å•ID',
  `project_id` int NOT NULL,
  `station_id` int DEFAULT NULL,
  `equipment_code` varchar(50) DEFAULT NULL COMMENT 'è®¾å¤‡ç¼–å·',
  `equipment_name` varchar(100) DEFAULT NULL COMMENT 'è®¾å¤‡åç§°',
  `equipment_location` varchar(200) DEFAULT NULL COMMENT 'è®¾å¤‡ä½ç½®',
  `equipment_model` varchar(100) DEFAULT NULL COMMENT 'è®¾å¤‡åž‹å·',
  `fault_date` date DEFAULT NULL COMMENT 'æ•…éšœæ—¥æœŸ',
  `fault_time` time DEFAULT NULL COMMENT 'æ•…éšœæ—¶é—´',
  `fault_description` text COMMENT 'æ•…éšœæè¿°',
  `preliminary_judgment` text COMMENT 'æ•…éšœåˆæ­¥åˆ¤æ–­',
  `reporter_id` int DEFAULT NULL,
  `reporter_name` varchar(50) DEFAULT NULL,
  `report_date` date DEFAULT NULL,
  `report_time` time DEFAULT NULL,
  `urgency_level` enum('low','medium','high','critical') DEFAULT NULL COMMENT 'ç´§æ€¥ç¨‹åº¦',
  `repair_person_id` int DEFAULT NULL,
  `repair_person_name` varchar(50) DEFAULT NULL,
  `repair_assistant_name` varchar(50) DEFAULT NULL COMMENT 'ç»´ä¿®é…åˆäºº',
  `plan_repair_date` date DEFAULT NULL COMMENT 'è®¡åˆ’ç»´ä¿®æ—¥æœŸ',
  `plan_repair_end_date` date DEFAULT NULL COMMENT 'è®¡åˆ’ç»´ä¿®ç»“æŸæ—¥æœŸ',
  `plan_repair_time` time DEFAULT NULL COMMENT 'è®¡åˆ’ç»´ä¿®æ—¶é—´',
  `plan_repair_end_time` time DEFAULT NULL COMMENT 'è®¡åˆ’ç»´ä¿®ç»“æŸæ—¶é—´',
  `repair_start_date` date DEFAULT NULL,
  `repair_start_time` time DEFAULT NULL,
  `repair_end_date` date DEFAULT NULL,
  `repair_end_time` time DEFAULT NULL,
  `repair_content` text COMMENT 'ç»´ä¿®å†…å®¹æè¿°',
  `repair_tools` text COMMENT 'ç»´ä¿®å·¥å…·',
  `consumables_list` json DEFAULT NULL COMMENT 'ç»´ä¿®è€—ææ˜Žç»†',
  `consumables_total` decimal(10,2) DEFAULT '0.00' COMMENT 'è€—ææ€»é‡‘é¢',
  `parts_list` json DEFAULT NULL COMMENT 'æ›´æ¢é…ä»¶æ˜Žç»†',
  `parts_total` decimal(10,2) DEFAULT '0.00' COMMENT 'é…ä»¶æ€»é‡‘é¢',
  `repair_result` enum('normal','observe','unsolved') DEFAULT NULL COMMENT 'ç»´ä¿®ç»“æžœ',
  `observe_days` int DEFAULT NULL COMMENT 'å¾…è§‚å¯Ÿå¤©æ•°',
  `unsolved_reason` text COMMENT 'æœªè§£å†³åŽŸå› ',
  `verifier_id` int DEFAULT NULL COMMENT 'éªŒæ”¶äººID(ç«™é•¿)',
  `verifier_name` varchar(50) DEFAULT NULL,
  `verify_date` date DEFAULT NULL,
  `verify_time` time DEFAULT NULL,
  `verify_result` enum('pass','fail') DEFAULT NULL COMMENT 'éªŒæ”¶ç»“æžœ',
  `verify_attitude` varchar(50) DEFAULT NULL COMMENT 'ç»´ä¿®æ€åº¦',
  `verify_quality` varchar(50) DEFAULT NULL COMMENT 'ç»´ä¿®è´¨é‡',
  `verify_comment` text COMMENT 'éªŒæ”¶æ„è§',
  `rating` int DEFAULT NULL COMMENT 'è¯„ä»·æ˜Ÿçº§1-5',
  `rating_comment` text COMMENT 'è¯„ä»·å¤‡æ³¨',
  `archivist` varchar(50) DEFAULT NULL COMMENT 'å­˜æ¡£äººå‘˜',
  `archive_dept` varchar(50) DEFAULT NULL COMMENT 'å­˜æ¡£éƒ¨é—¨',
  `archive_date` date DEFAULT NULL,
  `status` enum('draft_report','submitted_report','dispatched','repairing','repaired_submitted','accepted','archived') DEFAULT 'draft_report' COMMENT 'çŠ¶æ€',
  `dispatch_by` int DEFAULT NULL COMMENT 'æ´¾å‘äººID(ç«™é•¿)',
  `dispatch_by_name` varchar(50) DEFAULT NULL,
  `dispatch_date` date DEFAULT NULL,
  `dispatch_time` time DEFAULT NULL,
  `dispatch_remark` text COMMENT 'æ´¾å‘å¤‡æ³¨',
  `work_hours` decimal(5,1) DEFAULT NULL COMMENT 'ç»´ä¿®å·¥æ—¶',
  `created_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `record_code` (`record_code`),
  KEY `idx_repair_fault_report` (`fault_report_id`),
  KEY `idx_repair_person` (`repair_person_id`),
  KEY `idx_repair_status` (`status`),
  KEY `idx_repair_project_station` (`project_id`,`station_id`),
  KEY `repair_records_fault_report_id` (`fault_report_id`),
  KEY `repair_records_repair_person_id` (`repair_person_id`),
  KEY `repair_records_status` (`status`),
  KEY `repair_records_project_id_station_id` (`project_id`,`station_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ç»´ä¿®è®°å½•è¡¨';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `repair_records`
--

LOCK TABLES `repair_records` WRITE;
/*!40000 ALTER TABLE `repair_records` DISABLE KEYS */;
INSERT INTO `repair_records` VALUES (1,'RR202601101549329J35',0,0,2,'gdghrh','fagertg','hsdf',NULL,'2026-01-10','23:49:00','','',5,'Test station_manager','2026-01-10','23:49:00','medium',4,'Test maintenance','','2026-01-09','2026-01-23',NULL,NULL,'2026-01-10','23:56:00','2026-01-10','23:56:00',NULL,NULL,'[]',0.00,'[]',0.00,'normal',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'repaired_submitted',5,'Test station_manager','2026-01-10','23:49:00','',NULL,5,'2026-01-10 23:49:32','2026-01-10 23:56:30'),(2,'RR20260110155521ZX60',0,0,2,'gesry','gergs','gregr',NULL,'2026-01-10','23:55:00','','',3,'Test operator','2026-01-10','23:55:00','medium',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0.00,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'submitted_report',NULL,NULL,NULL,NULL,NULL,NULL,3,'2026-01-10 23:55:21','2026-01-10 23:55:21'),(3,'RR20260114125953Q7JH',0,0,17,'SJQ-004','磁性筛分机','厂区2',NULL,'2026-01-14','12:59:00','','',13,'王五','2026-01-14','12:59:00','medium',4,'维修1',NULL,'2026-01-14','2026-01-16','13:03:00','13:03:00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0.00,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'dispatched',12,'李四','2026-01-14','13:04:00','',NULL,13,'2026-01-14 12:59:53','2026-01-14 13:04:05'),(4,'RR202601141300031Q50',0,0,17,'SJQ-003','微波消解仪','厂区3',NULL,'2026-01-14','12:59:00','','',13,'王五','2026-01-14','12:59:00','medium',4,'维修1',NULL,'2026-01-14','2026-01-15','13:01:00','13:01:00','2026-01-14','13:06:06',NULL,NULL,NULL,NULL,NULL,0.00,NULL,0.00,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'repairing',12,'李四','2026-01-14','13:02:00','',NULL,13,'2026-01-14 13:00:03','2026-01-14 13:06:06'),(5,'RR20260114130012OFHQ',0,0,17,'SJQ-001','固液分离机','厂区1',NULL,'2026-01-14','13:00:00','','',13,'王五','2026-01-14','13:00:00','critical',4,'维修1',NULL,'2026-01-14','2026-01-14','13:01:00','15:01:00','2026-01-14','13:03:09','2026-01-14','13:05:00',NULL,NULL,'[]',0.00,'[]',0.00,'normal',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'repaired_submitted',12,'李四','2026-01-14','13:01:00','',NULL,13,'2026-01-14 13:00:12','2026-01-14 13:05:11'),(6,'RR20260114130025WDTC',0,0,17,'SJQ-002','风力筛分机','厂区2',NULL,'2026-01-14','13:00:00','','',13,'王五','2026-01-14','13:00:00','high',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0.00,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'submitted_report',NULL,NULL,NULL,NULL,NULL,NULL,13,'2026-01-14 13:00:25','2026-01-14 13:00:25');
/*!40000 ALTER TABLE `repair_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_id` int NOT NULL,
  `permission_id` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_permission` (`role_id`,`permission_id`),
  UNIQUE KEY `role_permissions_role_id_permission_id` (`role_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=223 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='è§’è‰²æƒé™å…³è”è¡¨';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES (1,1,1,'2026-01-10 21:25:08'),(2,1,2,'2026-01-10 21:25:08'),(3,1,3,'2026-01-10 21:25:08'),(4,1,4,'2026-01-10 21:25:08'),(5,1,5,'2026-01-10 21:25:08'),(6,1,6,'2026-01-10 21:25:08'),(7,1,23,'2026-01-10 21:25:08'),(8,1,25,'2026-01-10 21:25:08'),(9,1,26,'2026-01-10 21:25:08'),(10,1,27,'2026-01-10 21:25:08'),(11,1,28,'2026-01-10 21:25:08'),(12,1,29,'2026-01-10 21:25:08'),(13,1,30,'2026-01-10 21:25:08'),(14,1,45,'2026-01-10 21:25:08'),(15,2,1,'2026-01-10 21:25:08'),(16,2,2,'2026-01-10 21:25:08'),(17,2,7,'2026-01-10 21:25:08'),(18,2,9,'2026-01-10 21:25:08'),(19,2,14,'2026-01-10 21:25:08'),(20,2,16,'2026-01-10 21:25:08'),(21,2,17,'2026-01-10 21:25:08'),(22,2,18,'2026-01-10 21:25:08'),(23,2,20,'2026-01-10 21:25:08'),(24,2,23,'2026-01-10 21:25:08'),(25,2,25,'2026-01-10 21:25:08'),(26,2,26,'2026-01-10 21:25:08'),(27,2,31,'2026-01-10 21:25:08'),(28,2,32,'2026-01-10 21:25:08'),(29,2,36,'2026-01-10 21:25:08'),(30,2,38,'2026-01-10 21:25:08'),(31,2,39,'2026-01-10 21:25:08'),(32,2,40,'2026-01-10 21:25:08'),(33,2,42,'2026-01-10 21:25:08'),(34,2,45,'2026-01-10 21:25:08'),(35,3,1,'2026-01-10 21:25:08'),(36,3,2,'2026-01-10 21:25:08'),(37,3,9,'2026-01-10 21:25:08'),(38,3,20,'2026-01-10 21:25:08'),(39,3,23,'2026-01-10 21:25:08'),(40,3,25,'2026-01-10 21:25:08'),(41,3,26,'2026-01-10 21:25:08'),(42,3,32,'2026-01-10 21:25:08'),(43,3,42,'2026-01-10 21:25:08'),(44,3,45,'2026-01-10 21:25:08'),(45,4,1,'2026-01-10 21:25:08'),(46,4,2,'2026-01-10 21:25:08'),(47,4,7,'2026-01-10 21:25:08'),(48,4,8,'2026-01-10 21:25:08'),(49,4,9,'2026-01-10 21:25:08'),(50,4,10,'2026-01-10 21:25:08'),(51,4,12,'2026-01-10 21:25:08'),(52,4,13,'2026-01-10 21:25:08'),(53,4,14,'2026-01-10 21:25:08'),(54,4,15,'2026-01-10 21:25:08'),(55,4,16,'2026-01-10 21:25:08'),(56,4,17,'2026-01-10 21:25:08'),(57,4,18,'2026-01-10 21:25:08'),(58,4,20,'2026-01-10 21:25:08'),(59,4,21,'2026-01-10 21:25:08'),(60,4,23,'2026-01-10 21:25:08'),(61,4,25,'2026-01-10 21:25:08'),(62,4,26,'2026-01-10 21:25:08'),(63,4,31,'2026-01-10 21:25:08'),(64,4,32,'2026-01-10 21:25:08'),(65,4,33,'2026-01-10 21:25:08'),(66,4,35,'2026-01-10 21:25:08'),(67,4,36,'2026-01-10 21:25:08'),(68,4,37,'2026-01-10 21:25:08'),(69,4,38,'2026-01-10 21:25:08'),(70,4,39,'2026-01-10 21:25:08'),(71,4,40,'2026-01-10 21:25:08'),(72,4,42,'2026-01-10 21:25:08'),(73,4,43,'2026-01-10 21:25:08'),(74,4,45,'2026-01-10 21:25:08'),(75,5,1,'2026-01-10 21:25:08'),(76,5,2,'2026-01-10 21:25:08'),(77,5,7,'2026-01-10 21:25:08'),(78,5,8,'2026-01-10 21:25:08'),(79,5,9,'2026-01-10 21:25:08'),(80,5,10,'2026-01-10 21:25:08'),(81,5,12,'2026-01-10 21:25:08'),(82,5,13,'2026-01-10 21:25:08'),(83,5,14,'2026-01-10 21:25:08'),(84,5,15,'2026-01-10 21:25:08'),(85,5,16,'2026-01-10 21:25:08'),(86,5,17,'2026-01-10 21:25:08'),(87,5,18,'2026-01-10 21:25:08'),(88,5,20,'2026-01-10 21:25:08'),(89,5,21,'2026-01-10 21:25:08'),(90,5,23,'2026-01-10 21:25:08'),(91,5,25,'2026-01-10 21:25:08'),(92,5,26,'2026-01-10 21:25:08'),(93,5,31,'2026-01-10 21:25:08'),(94,5,32,'2026-01-10 21:25:08'),(95,5,33,'2026-01-10 21:25:08'),(96,5,35,'2026-01-10 21:25:08'),(97,5,36,'2026-01-10 21:25:08'),(98,5,37,'2026-01-10 21:25:08'),(99,5,38,'2026-01-10 21:25:08'),(100,5,39,'2026-01-10 21:25:08'),(101,5,40,'2026-01-10 21:25:08'),(102,5,42,'2026-01-10 21:25:08'),(103,5,43,'2026-01-10 21:25:08'),(104,5,45,'2026-01-10 21:25:08'),(105,6,1,'2026-01-10 21:25:08'),(106,6,2,'2026-01-10 21:25:08'),(107,6,7,'2026-01-10 21:25:08'),(108,6,8,'2026-01-10 21:25:08'),(109,6,9,'2026-01-10 21:25:08'),(110,6,10,'2026-01-10 21:25:08'),(111,6,12,'2026-01-10 21:25:08'),(112,6,13,'2026-01-10 21:25:08'),(113,6,14,'2026-01-10 21:25:08'),(114,6,15,'2026-01-10 21:25:08'),(115,6,16,'2026-01-10 21:25:08'),(116,6,17,'2026-01-10 21:25:08'),(117,6,18,'2026-01-10 21:25:08'),(118,6,20,'2026-01-10 21:25:08'),(119,6,21,'2026-01-10 21:25:08'),(120,6,23,'2026-01-10 21:25:08'),(121,6,25,'2026-01-10 21:25:08'),(122,6,26,'2026-01-10 21:25:08'),(123,6,31,'2026-01-10 21:25:08'),(124,6,32,'2026-01-10 21:25:08'),(125,6,33,'2026-01-10 21:25:08'),(126,6,35,'2026-01-10 21:25:08'),(127,6,36,'2026-01-10 21:25:08'),(128,6,37,'2026-01-10 21:25:08'),(129,6,38,'2026-01-10 21:25:08'),(130,6,39,'2026-01-10 21:25:08'),(131,6,40,'2026-01-10 21:25:08'),(132,6,42,'2026-01-10 21:25:08'),(133,6,43,'2026-01-10 21:25:08'),(134,6,45,'2026-01-10 21:25:08'),(135,7,1,'2026-01-10 21:25:08'),(136,7,2,'2026-01-10 21:25:08'),(137,7,8,'2026-01-10 21:25:08'),(138,7,9,'2026-01-10 21:25:08'),(139,7,10,'2026-01-10 21:25:08'),(140,7,11,'2026-01-10 21:25:08'),(141,7,12,'2026-01-10 21:25:08'),(142,7,13,'2026-01-10 21:25:08'),(143,7,14,'2026-01-10 21:25:08'),(144,7,15,'2026-01-10 21:25:08'),(145,7,23,'2026-01-10 21:25:08'),(146,7,25,'2026-01-10 21:25:08'),(147,7,26,'2026-01-10 21:25:08'),(148,7,32,'2026-01-10 21:25:08'),(149,7,33,'2026-01-10 21:25:08'),(150,7,34,'2026-01-10 21:25:08'),(151,7,35,'2026-01-10 21:25:08'),(152,7,36,'2026-01-10 21:25:08'),(153,7,37,'2026-01-10 21:25:08'),(154,7,45,'2026-01-10 21:25:08'),(155,8,1,'2026-01-10 21:25:08'),(156,8,2,'2026-01-10 21:25:08'),(157,8,7,'2026-01-10 21:25:08'),(158,8,8,'2026-01-10 21:25:08'),(159,8,9,'2026-01-10 21:25:08'),(160,8,10,'2026-01-10 21:25:08'),(161,8,12,'2026-01-10 21:25:08'),(162,8,13,'2026-01-10 21:25:08'),(163,8,14,'2026-01-10 21:25:08'),(164,8,15,'2026-01-10 21:25:08'),(165,8,16,'2026-01-10 21:25:08'),(166,8,17,'2026-01-10 21:25:08'),(167,8,18,'2026-01-10 21:25:08'),(168,8,20,'2026-01-10 21:25:08'),(169,8,21,'2026-01-10 21:25:08'),(170,8,23,'2026-01-10 21:25:08'),(171,8,25,'2026-01-10 21:25:08'),(172,8,26,'2026-01-10 21:25:08'),(173,8,31,'2026-01-10 21:25:08'),(174,8,32,'2026-01-10 21:25:08'),(175,8,33,'2026-01-10 21:25:08'),(176,8,35,'2026-01-10 21:25:08'),(177,8,36,'2026-01-10 21:25:08'),(178,8,37,'2026-01-10 21:25:08'),(179,8,38,'2026-01-10 21:25:08'),(180,8,39,'2026-01-10 21:25:08'),(181,8,40,'2026-01-10 21:25:08'),(182,8,42,'2026-01-10 21:25:08'),(183,8,43,'2026-01-10 21:25:08'),(184,8,45,'2026-01-10 21:25:08'),(185,9,1,'2026-01-10 21:25:08'),(186,9,2,'2026-01-10 21:25:08'),(187,9,19,'2026-01-10 21:25:08'),(188,9,20,'2026-01-10 21:25:08'),(189,9,21,'2026-01-10 21:25:08'),(190,9,23,'2026-01-10 21:25:08'),(191,9,25,'2026-01-10 21:25:08'),(192,9,26,'2026-01-10 21:25:08'),(193,9,41,'2026-01-10 21:25:08'),(194,9,42,'2026-01-10 21:25:08'),(195,9,43,'2026-01-10 21:25:08'),(196,9,45,'2026-01-10 21:25:08'),(197,1,47,'2026-01-17 15:39:36'),(198,1,49,'2026-01-17 15:39:36'),(199,2,48,'2026-01-17 15:39:36'),(200,2,50,'2026-01-17 15:39:36'),(201,3,48,'2026-01-17 15:39:36'),(202,3,50,'2026-01-17 15:39:36'),(203,4,47,'2026-01-17 15:39:36'),(204,4,48,'2026-01-17 15:39:36'),(205,4,49,'2026-01-17 15:39:36'),(206,4,50,'2026-01-17 15:39:36'),(207,5,47,'2026-01-17 15:39:36'),(208,5,48,'2026-01-17 15:39:36'),(209,5,49,'2026-01-17 15:39:36'),(210,5,50,'2026-01-17 15:39:36'),(211,6,47,'2026-01-17 15:39:36'),(212,6,48,'2026-01-17 15:39:36'),(213,6,49,'2026-01-17 15:39:36'),(214,6,50,'2026-01-17 15:39:36'),(215,7,47,'2026-01-17 15:39:36'),(216,7,49,'2026-01-17 15:39:36'),(217,8,47,'2026-01-17 15:39:36'),(218,8,48,'2026-01-17 15:39:36'),(219,8,49,'2026-01-17 15:39:36'),(220,8,50,'2026-01-17 15:39:36'),(221,9,48,'2026-01-17 15:39:36'),(222,9,50,'2026-01-17 15:39:36');
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) NOT NULL COMMENT 'è§’è‰²åç§°',
  `role_code` varchar(50) NOT NULL COMMENT 'è§’è‰²ç¼–ç ',
  `base_role_code` varchar(50) DEFAULT NULL COMMENT 'åŸºå‡†è§’è‰²ç¼–ç ',
  `description` varchar(200) DEFAULT NULL COMMENT 'æè¿°',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_name` (`role_name`),
  UNIQUE KEY `role_code` (`role_code`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='è§’è‰²è¡¨';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'系统管理员','admin','admin','系统管理员，拥有所有权限','2026-01-10 21:12:45'),(2,'操作岗','operator','operator','一线操作人员（仅作为角色，岗位由排班表动态配置）','2026-01-10 21:12:45'),(3,'维修岗','maintenance','maintenance','设备维修人员（仅作为角色，岗位由排班表动态配置）','2026-01-10 21:12:45'),(4,'站长','station_manager','station_manager','场站管理人员','2026-01-10 21:12:45'),(5,'部门副经理','deputy_manager','deputy_manager','部门副经理','2026-01-10 21:12:45'),(6,'部门经理','department_manager','department_manager','部门经理','2026-01-10 21:12:45'),(7,'安全员','safety_inspector','safety_inspector','公司级安全检查人员','2026-01-10 21:12:45'),(8,'高层','senior_management','senior_management','公司高层管理人员','2026-01-10 21:12:45'),(9,'甲方人员','client','client','甲方人员','2026-01-10 21:12:45');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `safety_check_items`
--

DROP TABLE IF EXISTS `safety_check_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `safety_check_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `work_type_id` int NOT NULL COMMENT '关联工作性质',
  `item_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '检查项目名称',
  `item_standard` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '检查标准',
  `enable_sub_options` tinyint DEFAULT '0' COMMENT '是否启用子选项',
  `yes_sub_options` json DEFAULT NULL COMMENT '是分支子选项',
  `no_sub_options` json DEFAULT NULL COMMENT '否分支子选项',
  `sort_order` int DEFAULT '0' COMMENT '排序',
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active' COMMENT '状态',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `work_type_id` (`work_type_id`),
  CONSTRAINT `safety_check_items_ibfk_1` FOREIGN KEY (`work_type_id`) REFERENCES `safety_work_types` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `safety_check_items`
--

LOCK TABLES `safety_check_items` WRITE;
/*!40000 ALTER TABLE `safety_check_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `safety_check_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `safety_hazard_inspections`
--

DROP TABLE IF EXISTS `safety_hazard_inspections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `safety_hazard_inspections` (
  `id` int NOT NULL AUTO_INCREMENT,
  `record_code` varchar(50) NOT NULL,
  `inspection_date` date NOT NULL,
  `submit_time` time DEFAULT NULL COMMENT 'submit time',
  `station_id` int DEFAULT NULL COMMENT 'station id',
  `station_name` varchar(100) NOT NULL,
  `station_type` varchar(50) DEFAULT NULL,
  `hazard_category` varchar(50) NOT NULL COMMENT 'hazard category',
  `is_first_found` enum('æ˜¯','äºŒæ¬¡','å¦') NOT NULL,
  `hazard_description` text,
  `photo_urls` text,
  `location` varchar(200) DEFAULT NULL,
  `handler_id` int DEFAULT NULL COMMENT 'åŠžç†äººID(åœºç«™é•¿)',
  `handler_name` varchar(50) DEFAULT NULL,
  `inspector_id` int NOT NULL,
  `inspector_name` varchar(50) DEFAULT NULL,
  `status` enum('pending','rectified','reviewed') DEFAULT 'pending' COMMENT 'status',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `record_code` (`record_code`),
  KEY `idx_hazard_station` (`station_name`),
  KEY `idx_hazard_date` (`inspection_date`),
  KEY `idx_hazard_inspector` (`inspector_id`),
  KEY `safety_hazard_inspections_station_name` (`station_name`),
  KEY `safety_hazard_inspections_inspection_date` (`inspection_date`),
  KEY `safety_hazard_inspections_inspector_id` (`inspector_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='å®‰å…¨éšæ‚£æ£€æŸ¥è¡¨';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `safety_hazard_inspections`
--

LOCK TABLES `safety_hazard_inspections` WRITE;
/*!40000 ALTER TABLE `safety_hazard_inspections` DISABLE KEYS */;
/*!40000 ALTER TABLE `safety_hazard_inspections` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `safety_other_inspections`
--

DROP TABLE IF EXISTS `safety_other_inspections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `safety_other_inspections` (
  `id` int NOT NULL AUTO_INCREMENT,
  `record_code` varchar(50) NOT NULL,
  `inspection_type` enum('safety','hygiene') NOT NULL,
  `project_id` int NOT NULL,
  `station_id` int DEFAULT NULL,
  `inspector_id` int NOT NULL,
  `inspector_name` varchar(50) DEFAULT NULL,
  `inspection_date` date NOT NULL,
  `inspected_user_id` int DEFAULT NULL,
  `inspected_user_name` varchar(50) DEFAULT NULL,
  `work_type_ids` json DEFAULT NULL COMMENT 'work type ids',
  `inspection_items` json DEFAULT NULL COMMENT 'inspection items',
  `violation_description` text,
  `remark` text COMMENT 'remark',
  `is_qualified` tinyint DEFAULT '1',
  `unqualified_items` text,
  `photo_urls` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `record_code` (`record_code`),
  KEY `idx_other_inspector` (`inspector_id`),
  KEY `idx_other_date` (`inspection_date`),
  KEY `safety_other_inspections_inspector_id` (`inspector_id`),
  KEY `safety_other_inspections_inspection_date` (`inspection_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='å®‰å…¨/å«ç”Ÿä»–æ£€è¡¨';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `safety_other_inspections`
--

LOCK TABLES `safety_other_inspections` WRITE;
/*!40000 ALTER TABLE `safety_other_inspections` DISABLE KEYS */;
/*!40000 ALTER TABLE `safety_other_inspections` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `safety_rectifications`
--

DROP TABLE IF EXISTS `safety_rectifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `safety_rectifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `record_code` varchar(50) NOT NULL,
  `inspection_id` int NOT NULL COMMENT 'å…³è”æ£€æŸ¥è®°å½•ID',
  `handler_id` int DEFAULT NULL COMMENT 'handler id',
  `handler_name` varchar(50) DEFAULT NULL COMMENT 'handler name',
  `root_cause` varchar(100) NOT NULL COMMENT 'root cause',
  `rectification_measures` text NOT NULL,
  `responsible_person_id` int NOT NULL,
  `responsible_person_name` varchar(50) DEFAULT NULL,
  `punished_person_id` int DEFAULT NULL,
  `punished_person_name` varchar(50) DEFAULT NULL,
  `punishment_result` text,
  `is_completed` enum('æ˜¯','å¦') NOT NULL,
  `completion_photos` text,
  `completion_score` int DEFAULT NULL COMMENT 'æ•´æ”¹å®Œæˆè¯„åˆ†',
  `root_cause_category` enum('ç»„ç»‡æŽªæ–½','ç®¡ç†æŽªæ–½','æŠ€æœ¯æŽªæ–½','ç»æµŽæŽªæ–½') DEFAULT NULL COMMENT 'æ ¹å› ç±»åˆ«(å®‰å…¨å‘˜å¡«å†™)',
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `approver_id` int DEFAULT NULL,
  `approver_name` varchar(50) DEFAULT NULL,
  `approve_time` datetime DEFAULT NULL,
  `approve_comment` text,
  `reject_reason` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `record_code` (`record_code`),
  KEY `idx_rectification_inspection` (`inspection_id`),
  KEY `idx_rectification_status` (`status`),
  KEY `safety_rectifications_inspection_id` (`inspection_id`),
  KEY `safety_rectifications_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='å®‰å…¨éšæ‚£æ•´æ”¹è¡¨';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `safety_rectifications`
--

LOCK TABLES `safety_rectifications` WRITE;
/*!40000 ALTER TABLE `safety_rectifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `safety_rectifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `safety_self_inspections`
--

DROP TABLE IF EXISTS `safety_self_inspections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `safety_self_inspections` (
  `id` int NOT NULL AUTO_INCREMENT,
  `record_code` varchar(50) NOT NULL,
  `inspection_type` enum('safety','hygiene') NOT NULL,
  `project_id` int NOT NULL,
  `station_id` int DEFAULT NULL,
  `filler_id` int NOT NULL,
  `filler_name` varchar(50) DEFAULT NULL,
  `inspection_date` date NOT NULL,
  `work_type_ids` json DEFAULT NULL COMMENT 'work type ids',
  `inspection_items` json DEFAULT NULL,
  `photo_urls` text,
  `submit_time` datetime NOT NULL,
  `is_overdue` tinyint DEFAULT '0',
  `overdue_minutes` int DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `record_code` (`record_code`),
  KEY `idx_self_filler` (`filler_id`),
  KEY `idx_self_date` (`inspection_date`),
  KEY `idx_self_type` (`inspection_type`),
  KEY `safety_self_inspections_filler_id` (`filler_id`),
  KEY `safety_self_inspections_inspection_date` (`inspection_date`),
  KEY `safety_self_inspections_inspection_type` (`inspection_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='å®‰å…¨/å«ç”Ÿè‡ªæ£€è¡¨';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `safety_self_inspections`
--

LOCK TABLES `safety_self_inspections` WRITE;
/*!40000 ALTER TABLE `safety_self_inspections` DISABLE KEYS */;
/*!40000 ALTER TABLE `safety_self_inspections` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `safety_work_types`
--

DROP TABLE IF EXISTS `safety_work_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `safety_work_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `work_type_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '工作性质名称',
  `is_default` tinyint DEFAULT '0' COMMENT '是否默认必选（基本工作）',
  `sort_order` int DEFAULT '0' COMMENT '排序',
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active' COMMENT '状态',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `safety_work_types`
--

LOCK TABLES `safety_work_types` WRITE;
/*!40000 ALTER TABLE `safety_work_types` DISABLE KEYS */;
/*!40000 ALTER TABLE `safety_work_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schedules`
--

DROP TABLE IF EXISTS `schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schedules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `station_id` int DEFAULT NULL,
  `user_id` int NOT NULL,
  `user_name` varchar(50) DEFAULT NULL,
  `position_name` varchar(50) DEFAULT NULL,
  `year` int NOT NULL,
  `month` int NOT NULL,
  `schedules` json DEFAULT NULL COMMENT 'æŽ’ç­æ•°æ® {"2025-12-01":"09:00-18:00","2025-12-02":"ä¼‘"}',
  `created_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_schedule_user_station_position_month` (`user_id`,`station_id`,`position_name`,`year`,`month`),
  UNIQUE KEY `schedules_user_id_station_id_position_name_year_month` (`user_id`,`station_id`,`position_name`,`year`,`month`),
  KEY `idx_schedule_project` (`project_id`),
  KEY `idx_schedule_year_month` (`year`,`month`),
  KEY `schedules_project_id` (`project_id`),
  KEY `schedules_year_month` (`year`,`month`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='æŽ’ç­è¡¨';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schedules`
--

LOCK TABLES `schedules` WRITE;
/*!40000 ALTER TABLE `schedules` DISABLE KEYS */;
INSERT INTO `schedules` VALUES (2,1,16,12,'李四','站长',2026,1,'{\"2026-01-01\": true, \"2026-01-02\": true, \"2026-01-03\": true, \"2026-01-04\": true, \"2026-01-05\": true, \"2026-01-06\": true, \"2026-01-07\": true, \"2026-01-08\": true, \"2026-01-09\": true, \"2026-01-10\": true, \"2026-01-11\": true, \"2026-01-12\": true, \"2026-01-13\": true, \"2026-01-14\": true, \"2026-01-15\": true, \"2026-01-16\": true, \"2026-01-17\": true, \"2026-01-18\": true, \"2026-01-19\": true, \"2026-01-20\": true, \"2026-01-21\": true, \"2026-01-22\": true, \"2026-01-23\": true, \"2026-01-24\": true, \"2026-01-25\": true, \"2026-01-26\": true, \"2026-01-27\": true, \"2026-01-28\": true, \"2026-01-29\": true, \"2026-01-30\": true, \"2026-01-31\": true}',6,'2026-01-17 15:05:09','2026-01-17 15:05:09');
/*!40000 ALTER TABLE `schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stations`
--

DROP TABLE IF EXISTS `stations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `station_name` varchar(100) NOT NULL COMMENT 'åœºç«™åç§°',
  `station_type` enum('有机资源再生中心','机械化分选站','黑水虻场站','办公区','绿植堆肥站','绿植粉碎站') DEFAULT NULL,
  `check_in_time` time DEFAULT '08:10:00' COMMENT 'è‡ªæ£€æˆªæ­¢æ—¶é—´',
  `location` varchar(200) DEFAULT NULL COMMENT 'åœ°å€',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='åœºç«™è¡¨';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stations`
--

LOCK TABLES `stations` WRITE;
/*!40000 ALTER TABLE `stations` DISABLE KEYS */;
INSERT INTO `stations` VALUES (1,'海淀区第一有机资源中心','有机资源再生中心','08:10:00',NULL,'active','2026-01-10 21:12:45','2026-01-10 21:43:05'),(2,'板井站','有机资源再生中心','08:10:00',NULL,'active','2026-01-10 21:12:45','2026-01-10 21:43:05'),(3,'北航站','有机资源再生中心','08:10:00',NULL,'active','2026-01-10 21:12:45','2026-01-10 21:43:05'),(4,'北外站','有机资源再生中心','08:10:00',NULL,'active','2026-01-10 21:12:45','2026-01-10 21:43:05'),(5,'北师大','有机资源再生中心','08:10:00',NULL,'active','2026-01-10 21:12:45','2026-01-10 21:43:05'),(6,'沙铁站','有机资源再生中心','08:10:00',NULL,'active','2026-01-10 21:12:45','2026-01-10 21:43:05'),(7,'中关村一小西二旗分校','有机资源再生中心','08:10:00',NULL,'active','2026-01-10 21:12:45','2026-01-10 21:43:05'),(8,'中关村一小怀柔分校','有机资源再生中心','08:10:00',NULL,'active','2026-01-10 21:12:45','2026-01-10 21:43:05'),(9,'紫竹院','有机资源再生中心','08:10:00',NULL,'active','2026-01-10 21:12:45','2026-01-10 21:43:05'),(10,'三星庄','有机资源再生中心','08:10:00',NULL,'active','2026-01-10 21:12:45','2026-01-10 21:43:05'),(11,'海淀一办站','有机资源再生中心','08:10:00',NULL,'active','2026-01-10 21:12:45','2026-01-10 21:43:05'),(12,'怀柔西茶坞','有机资源再生中心','08:10:00',NULL,'active','2026-01-10 21:12:45','2026-01-10 21:43:05'),(13,'国航','有机资源再生中心','08:10:00',NULL,'active','2026-01-10 21:12:45','2026-01-10 21:43:05'),(14,'总部办公区','办公区','08:10:00',NULL,'active','2026-01-10 21:12:45','2026-01-10 21:43:05'),(15,'怀柔办公区','办公区','08:10:00',NULL,'active','2026-01-10 21:12:45','2026-01-10 21:43:05'),(16,'平义分站','有机资源再生中心','08:10:00',NULL,'active','2026-01-10 21:12:45','2026-01-10 21:43:05'),(17,'四季青',NULL,'08:10:00',NULL,'active','2026-01-14 10:39:58','2026-01-14 10:39:58');
/*!40000 ALTER TABLE `stations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_configs`
--

DROP TABLE IF EXISTS `system_configs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_configs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `config_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `config_value` text COLLATE utf8mb4_unicode_ci,
  `config_type` enum('system','business','device') COLLATE utf8mb4_unicode_ci DEFAULT 'system',
  `description` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_configs`
--

LOCK TABLES `system_configs` WRITE;
/*!40000 ALTER TABLE `system_configs` DISABLE KEYS */;
/*!40000 ALTER TABLE `system_configs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_configs`
--

DROP TABLE IF EXISTS `task_configs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_configs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '任务名称',
  `standard_hours` decimal(4,2) NOT NULL COMMENT '标准工时',
  `project_id` int DEFAULT NULL COMMENT '项目ID（null表示全局任务）',
  `is_system_default` tinyint DEFAULT '0' COMMENT '是否系统预设',
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_by` int DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `task_configs_project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_configs`
--

LOCK TABLES `task_configs` WRITE;
/*!40000 ALTER TABLE `task_configs` DISABLE KEYS */;
/*!40000 ALTER TABLE `task_configs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `temporary_task_library`
--

DROP TABLE IF EXISTS `temporary_task_library`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `temporary_task_library` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_name` varchar(100) NOT NULL COMMENT 'å·¥ä½œåç§°',
  `task_content` text NOT NULL COMMENT 'å…·ä½“å·¥ä½œå†…å®¹',
  `standard_hours` decimal(4,2) NOT NULL COMMENT 'æ ‡å‡†å·¥æ—¶(h/d)',
  `points` int NOT NULL COMMENT 'ç§¯åˆ†',
  `station_id` int DEFAULT NULL,
  `created_by` int DEFAULT NULL COMMENT 'åˆ›å»ºäººID',
  `created_by_name` varchar(50) DEFAULT NULL COMMENT 'åˆ›å»ºäººå§“å',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_temp_task_station` (`station_id`),
  KEY `idx_temp_task_name` (`task_name`),
  KEY `temporary_task_library_station_id` (`station_id`),
  KEY `temporary_task_library_task_name` (`task_name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ä¸´æ—¶å·¥ä½œä»»åŠ¡åº“';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `temporary_task_library`
--

LOCK TABLES `temporary_task_library` WRITE;
/*!40000 ALTER TABLE `temporary_task_library` DISABLE KEYS */;
INSERT INTO `temporary_task_library` VALUES (1,'aaa','frghsdh',1.00,10,NULL,5,'Test station_manager','2026-01-10 23:34:17','2026-01-10 23:34:17'),(2,'gdsaf','hfdsg',1.00,10,NULL,5,'Test station_manager','2026-01-10 23:36:02','2026-01-10 23:36:02');
/*!40000 ALTER TABLE `temporary_task_library` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `temporary_tasks`
--

DROP TABLE IF EXISTS `temporary_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `temporary_tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `task_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `task_description` text COLLATE utf8mb4_unicode_ci,
  `task_type` enum('temporary','overtime') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '临时任务/加班',
  `assigner_id` int NOT NULL,
  `assigner_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `executor_id` int NOT NULL,
  `executor_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department_id` int DEFAULT NULL,
  `project_id` int DEFAULT NULL,
  `station_id` int DEFAULT NULL,
  `plan_start_time` datetime DEFAULT NULL,
  `plan_end_time` datetime DEFAULT NULL,
  `actual_hours` decimal(4,2) DEFAULT NULL,
  `standard_hours` decimal(4,2) DEFAULT NULL COMMENT '标准工时(h/d)',
  `points` int DEFAULT '0' COMMENT '积分',
  `status` enum('pending','processing','completed') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `completion_note` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `task_code` (`task_code`),
  KEY `assigner_id` (`assigner_id`),
  KEY `temporary_tasks_executor_id` (`executor_id`),
  KEY `temporary_tasks_status` (`status`),
  CONSTRAINT `temporary_tasks_ibfk_1` FOREIGN KEY (`assigner_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `temporary_tasks_ibfk_2` FOREIGN KEY (`executor_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `temporary_tasks`
--

LOCK TABLES `temporary_tasks` WRITE;
/*!40000 ALTER TABLE `temporary_tasks` DISABLE KEYS */;
INSERT INTO `temporary_tasks` VALUES (1,'TMP20260110154837V5L7','gdsaf','hfdsg','temporary',5,'Test station_manager',3,'Test operator',NULL,NULL,2,'2026-01-10 16:00:00','2026-01-11 01:00:00',1.00,1.00,10,'completed','','2026-01-10 23:48:37','2026-01-10 23:51:02');
/*!40000 ALTER TABLE `temporary_tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_projects`
--

DROP TABLE IF EXISTS `user_projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `project_id` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_project` (`user_id`,`project_id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `user_projects_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `user_projects_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ç”¨æˆ·é¡¹ç›®å…³è”è¡¨';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_projects`
--

LOCK TABLES `user_projects` WRITE;
/*!40000 ALTER TABLE `user_projects` DISABLE KEYS */;
INSERT INTO `user_projects` VALUES (1,1,1,'2026-01-10 21:12:45','2026-01-10 21:12:45');
/*!40000 ALTER TABLE `user_projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_stations`
--

DROP TABLE IF EXISTS `user_stations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_stations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `station_id` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_station` (`user_id`,`station_id`),
  UNIQUE KEY `user_stations_user_id_station_id` (`user_id`,`station_id`),
  KEY `station_id` (`station_id`),
  CONSTRAINT `user_stations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `user_stations_ibfk_2` FOREIGN KEY (`station_id`) REFERENCES `stations` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ç”¨æˆ·åœºç«™å…³è”è¡¨';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_stations`
--

LOCK TABLES `user_stations` WRITE;
/*!40000 ALTER TABLE `user_stations` DISABLE KEYS */;
INSERT INTO `user_stations` VALUES (1,1,1,'2026-01-10 21:12:45','2026-01-10 21:12:45'),(9,10,2,'2026-01-11 00:01:02','2026-01-11 00:01:02'),(11,3,2,'2026-01-13 18:52:58','2026-01-13 18:52:58'),(13,11,17,'2026-01-14 10:40:30','2026-01-14 10:40:30'),(17,13,17,'2026-01-14 11:32:12','2026-01-14 11:32:12'),(19,14,17,'2026-01-14 11:32:24','2026-01-14 11:32:24'),(20,19,3,'2026-01-15 11:16:50','2026-01-15 11:16:50'),(22,5,9,'2026-01-17 15:04:27','2026-01-17 15:04:27'),(24,12,16,'2026-01-17 15:05:10','2026-01-17 15:05:10');
/*!40000 ALTER TABLE `user_stations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL COMMENT 'ç™»å½•è´¦å·',
  `password` varchar(255) NOT NULL COMMENT 'å¯†ç (bcryptåŠ å¯†)',
  `real_name` varchar(50) NOT NULL COMMENT 'çœŸå®žå§“å',
  `department_name` varchar(50) DEFAULT NULL COMMENT 'éƒ¨é—¨åç§°',
  `company_name` varchar(100) DEFAULT NULL COMMENT 'å…¬å¸',
  `phone` varchar(20) DEFAULT NULL COMMENT 'æ‰‹æœºå·',
  `email` varchar(100) DEFAULT NULL COMMENT 'é‚®ç®±',
  `role_id` int NOT NULL COMMENT 'è§’è‰²ID',
  `is_price_admin` tinyint DEFAULT '0' COMMENT 'æ˜¯å¦ä¸ºå•ä»·ä¸“å‘˜',
  `status` tinyint DEFAULT '1' COMMENT 'çŠ¶æ€ 1å¯ç”¨ 0ç¦ç”¨',
  `last_project_id` int DEFAULT NULL COMMENT 'æœ€åŽè®¿é—®çš„é¡¹ç›®ID',
  `last_station_id` int DEFAULT NULL COMMENT 'æœ€åŽè®¿é—®çš„åœºç«™ID',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `users_role_id` (`role_id`),
  KEY `users_status` (`status`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ç”¨æˆ·è¡¨';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','$2a$10$yW6cQQQXUXftcUG0b.R0welvqeOfDmFDqCtAbv3PT4JNrPSr6ODZ2','系统管理员',NULL,NULL,NULL,NULL,1,0,1,NULL,NULL,'2026-01-10 21:12:45','2026-01-10 22:48:03'),(3,'operator_test','$2a$10$4dagCmVUHFwxWf3Bp4NzouDZhHnHHONi2Nl.tna.GI0aKgE47J4k6','操作1','Test Dept','Test Company',NULL,NULL,2,0,1,NULL,2,'2026-01-10 22:16:54','2026-01-13 18:52:58'),(4,'maintenance_test','$2a$10$VFghVVUJPFt69kCzpWv2Hefl/WWLMSUCuWhEtUJt/FOEUk.71vY0S','维修1','Test Dept','Test Company',NULL,NULL,3,0,1,NULL,NULL,'2026-01-10 22:16:54','2026-01-14 09:46:45'),(5,'station_manager_test','$2a$10$DyFa/lE.QAaGA5tz13nou.bqttEt533sUx/GdPF6zx4okabk.wylC','站长1','Test Dept','Test Company',NULL,NULL,4,0,1,NULL,9,'2026-01-10 22:16:54','2026-01-17 15:04:27'),(6,'deputy_manager_test','$2a$10$wkFk4XAhEN/e.2Z/Jb4RyOo.AMqkLGI.QCpUVbDr5FMiDMA9se0Ci','部门副经理1','Test Dept','Test Company',NULL,NULL,5,0,1,NULL,NULL,'2026-01-10 22:16:54','2026-01-14 09:47:08'),(7,'department_manager_test','$2a$10$ZTBwX7kamficU07bWfijPeakpNxB8ggIAYGz7c04gcBzKl0QBxDEG','Test department_manager','Test Dept','Test Company',NULL,NULL,6,0,1,NULL,NULL,'2026-01-10 22:16:54','2026-01-10 22:48:15'),(8,'safety_inspector_test','$2a$10$DcwxVc2gbJziRqpVjZNeHOdZiSrssRPVRr98Uh2OwjY6lZdk.e3r2','Test safety_inspector','Test Dept','Test Company',NULL,NULL,7,0,1,NULL,NULL,'2026-01-10 22:16:54','2026-01-10 22:48:12'),(9,'senior_management_test','$2a$10$xk4endx3gNV2oUFK4/xDqONQG6bz5aCzstK2qYovbCAlyTfVp6Yk.','Test senior_management','Test Dept','Test Company',NULL,NULL,8,0,1,NULL,NULL,'2026-01-10 22:16:54','2026-01-10 22:48:08'),(10,'client_test','$2a$10$deK/24MMxZ0A1RMnIgA0cuiLVRTQUhOhSryfV84IqgoYCSGY..2x6','Test client','Test Dept','Test Company',NULL,NULL,9,0,1,NULL,NULL,'2026-01-10 22:16:54','2026-01-10 22:48:06'),(11,'zhangsan','$2a$10$SyGaVuNTT1X9pzJB9u3ixefECTsFynsNMLhgCXNZMTsxrp3hkv7DW','张三','','','','',9,0,1,NULL,NULL,'2026-01-14 10:39:08','2026-01-14 10:39:08'),(12,'lisi','$2a$10$qPQ9PplhsaehO.ODfVlvAuVb9290hNiDi7trRFobcWQ9q4.0BFbA6','李四','','','','',4,0,1,NULL,16,'2026-01-14 10:41:01','2026-01-17 15:05:10'),(13,'wangwu','$2a$10$PH.xvR6Apb/xe3evvNAFZeR2xJHZkgIxZ.sdUKC3FO/bjQfmnAfrK','王五','','','','',2,0,1,NULL,17,'2026-01-14 10:41:28','2026-01-14 11:32:12'),(14,'zhaoliu','$2a$10$JOAWXe9Bf0njCW6TwO7zp.Um/Ws7ReecC31qyeeA1s1.jTQF4iZCa','赵六','','','','',2,0,1,NULL,17,'2026-01-14 10:41:45','2026-01-14 11:32:24'),(15,'liuqi','$2a$10$Yx3kXEtbEr9O2r9k/zn8dum0oSh/vIg/69RH0dcyxfq/WlpqfLkOy','刘七','','','','',2,0,1,NULL,NULL,'2026-01-14 10:42:35','2026-01-14 10:42:35'),(16,'suming','$2a$10$y4iLkkpLOD6vblYm9eOIse29yAkq0DZh3Gzbxt2anGjdy4LY7JDsG','SU','','','','',1,0,1,NULL,NULL,'2026-01-15 11:14:20','2026-01-15 11:14:20'),(17,'xinkai','$2a$10$WuX08ojI/yaVERNWPc1AA.McYcMlFb1o4XJbeqjbuVu75fs4CbNsm','辛凯',NULL,NULL,NULL,NULL,6,0,1,NULL,NULL,'2026-01-15 11:15:47','2026-01-15 11:15:47'),(18,'tianyiwei','$2a$10$Uaa3UhoDRcItYadT1sCs/uxliag38hioiCAE3KDAs2MMoWSd1oxW.','田艺伟',NULL,NULL,NULL,NULL,8,0,1,NULL,NULL,'2026-01-15 11:15:48','2026-01-15 11:15:48'),(19,'wuxia','$2a$10$z3WI4m4b7a64Bkuu3y5vcemTEABryAhXGYwCnHJhb2xNalgCh.1P.','吴霞',NULL,NULL,NULL,NULL,1,0,1,NULL,NULL,'2026-01-15 11:16:50','2026-01-15 11:16:50'),(20,'zhangrongge','$2a$10$HPOcutwsVVjDsxSANyesWOlVM7r0g6t3vSlAUUgZX/YuhxrNtBLum','张荣阁','','',NULL,NULL,4,0,1,NULL,NULL,'2026-01-17 00:42:24','2026-01-17 00:50:40'),(21,'zhangyou','$2a$10$icJ33msjshP7zlNAD1RJR.dPRiIiCH6r9UcYqiVVEro3WtTA0Ap7a','张有','','','','',5,0,1,NULL,NULL,'2026-01-17 15:40:17','2026-01-17 15:40:17');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-18  9:09:25
