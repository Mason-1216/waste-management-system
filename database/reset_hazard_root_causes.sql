START TRANSACTION;

DELETE FROM hazard_root_causes;

INSERT INTO hazard_root_causes (cause_name, sort_order, is_system, status, created_at, updated_at)
VALUES
  ('人的不安全行为', 1, 1, 1, NOW(), NOW()),
  ('物的不安全状态', 2, 1, 1, NOW(), NOW()),
  ('职责不清', 3, 1, 1, NOW(), NOW()),
  ('人岗匹配', 4, 1, 1, NOW(), NOW()),
  ('工作流程', 5, 1, 1, NOW(), NOW()),
  ('工作标准', 6, 1, 1, NOW(), NOW()),
  ('工作执行', 7, 1, 1, NOW(), NOW()),
  ('设计缺陷', 8, 1, 1, NOW(), NOW()),
  ('劳动防护用品配备不足', 9, 1, 1, NOW(), NOW()),
  ('安全设施建设投入不足', 10, 1, 1, NOW(), NOW());

COMMIT;
