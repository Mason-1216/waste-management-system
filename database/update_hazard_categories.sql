-- Reset hazard categories to the system preset list (utf8mb4).

DELETE FROM hazard_categories;

INSERT INTO hazard_categories (category_name, sort_order, is_system, status, created_at, updated_at) VALUES
('电气', 1, 1, 1, NOW(), NOW()),
('违规违纪', 2, 1, 1, NOW(), NOW()),
('标识', 3, 1, 1, NOW(), NOW()),
('基础设施', 4, 1, 1, NOW(), NOW()),
('环境卫生', 5, 1, 1, NOW(), NOW()),
('机械设备', 6, 1, 1, NOW(), NOW()),
('特种作业', 7, 1, 1, NOW(), NOW()),
('制度文件', 8, 1, 1, NOW(), NOW()),
('消防', 9, 1, 1, NOW(), NOW()),
('特种设备', 10, 1, 1, NOW(), NOW());
