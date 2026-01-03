-- Add maintenance assignment cycle and materials fields
-- Executed on: 2025-12-30

ALTER TABLE maintenance_assignments
  ADD COLUMN cycle_type ENUM('daily','weekly','monthly','yearly') NULL COMMENT 'maintenance cycle type' AFTER plan_id,
  ADD COLUMN consumables_list JSON NULL COMMENT 'maintenance consumables list' AFTER maintenance_items,
  ADD COLUMN parts_list JSON NULL COMMENT 'maintenance parts list' AFTER consumables_list;
