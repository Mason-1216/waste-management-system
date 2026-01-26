-- 用户独立权限表与权限类型扩展

ALTER TABLE `permissions`
  MODIFY `resource_type` ENUM('menu', 'button', 'api', 'module') NOT NULL DEFAULT 'api';

CREATE TABLE IF NOT EXISTS `user_permissions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `permission_id` INT NOT NULL,
  `effect` ENUM('allow', 'deny') NOT NULL DEFAULT 'allow',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_permission` (`permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
