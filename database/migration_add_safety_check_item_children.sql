ALTER TABLE safety_check_items
  ADD COLUMN parent_id INT NULL COMMENT 'Parent check item id' AFTER item_standard,
  ADD COLUMN enable_children TINYINT NOT NULL DEFAULT 0 COMMENT 'Enable child items' AFTER parent_id,
  ADD COLUMN trigger_value TINYINT NULL COMMENT 'Trigger value for child items' AFTER enable_children;

CREATE INDEX idx_safety_check_items_parent_id ON safety_check_items (parent_id);
