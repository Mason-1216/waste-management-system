-- ========================================
-- 角色合并迁移脚本
-- 将 4 种高层角色合并为 senior_management
-- 创建时间: 2025-12-25
-- ========================================

-- 1. 新增 senior_management 角色
INSERT INTO roles (role_code, role_name, description)
VALUES ('senior_management', '高层', '公司高层管理人员')
ON DUPLICATE KEY UPDATE
  role_name = '高层',
  description = '公司高层管理人员';

-- 2. 获取新角色的ID（用于后续更新）
SET @new_role_id = (SELECT id FROM roles WHERE role_code = 'senior_management');

-- 3. 将使用旧角色的用户迁移到新角色
UPDATE users
SET role_id = @new_role_id
WHERE role_id IN (
  SELECT id FROM roles
  WHERE role_code IN ('executive_vp', 'chief_engineer', 'general_manager', 'chairman')
);

-- 4. 删除旧的高层角色
DELETE FROM roles
WHERE role_code IN ('executive_vp', 'chief_engineer', 'general_manager', 'chairman');

-- 5. 验证结果
SELECT
  '迁移完成' AS status,
  COUNT(*) AS senior_management_users
FROM users
WHERE role_id = @new_role_id;

SELECT
  '剩余角色列表' AS status,
  role_code,
  role_name,
  description
FROM roles
ORDER BY id;
