import { Permission, Role, RolePermission } from '../models/index.js';
import {
  flattenMenuPermissions,
  buildModulePermissions,
  roleMenuDefaults,
  menuCodeToModuleCode
} from '../config/permissionSeeds.js';

const upsertPermission = async (permission, existingMap) => {
  const existing = existingMap.get(permission.code);
  if (existing) {
    const updates = {};
    if (existing.permission_name !== permission.name) {
      updates.permission_name = permission.name;
    }
    if (existing.resource_type !== permission.type) {
      updates.resource_type = permission.type;
    }
    if (Object.keys(updates).length > 0) {
      await Permission.update(updates, { where: { id: existing.id } });
    }
    return existing.id;
  }
  const created = await Permission.create({
    permission_code: permission.code,
    permission_name: permission.name,
    resource_type: permission.type,
    parent_id: permission.parentId || 0
  });
  return created.id;
};

export const ensurePermissions = async () => {
  const menuPermissions = flattenMenuPermissions();
  const modulePermissions = buildModulePermissions();

  const existing = await Permission.findAll();
  const existingMap = new Map(existing.map(item => [item.permission_code, item]));

  const menuRecords = menuPermissions.map(item => ({
    code: item.code,
    name: item.name,
    type: 'menu',
    parentCode: item.parentCode
  }));
  const moduleRecords = modulePermissions.map(item => ({
    code: item.code,
    name: item.name,
    type: 'api'
  }));

  const parentMap = new Map();
  for (const record of menuRecords) {
    const parentId = record.parentCode ? parentMap.get(record.parentCode) || 0 : 0;
    const id = await upsertPermission(
      { ...record, parentId },
      existingMap
    );
    parentMap.set(record.code, id);
  }

  for (const record of moduleRecords) {
    await upsertPermission(record, existingMap);
  }
};

const buildRolePermissionIds = async (menuCodes) => {
  if (!menuCodes?.length) return [];
  const moduleCodes = menuCodes
    .map(code => menuCodeToModuleCode(code))
    .filter(Boolean);

  const codes = [...new Set([...menuCodes, ...moduleCodes])];
  const permissions = await Permission.findAll({
    where: { permission_code: codes }
  });
  return permissions.map(item => item.id);
};

export const ensureRolePermissions = async () => {
  await ensurePermissions();

  const roles = await Role.findAll();
  if (!roles.length) return;

  const roleIds = roles.map(role => role.id);
  const existing = await RolePermission.findAll({
    where: { role_id: roleIds }
  });
  const rolePermissionMap = new Map();
  existing.forEach(item => {
    if (!rolePermissionMap.has(item.role_id)) {
      rolePermissionMap.set(item.role_id, new Set());
    }
    rolePermissionMap.get(item.role_id).add(item.permission_id);
  });

  for (const role of roles) {
    const menuCodes = roleMenuDefaults[role.role_code] || [];
    const permissionIds = await buildRolePermissionIds(menuCodes);
    if (permissionIds.length === 0) {
      continue;
    }
    const existingSet = rolePermissionMap.get(role.id) || new Set();
    const missingIds = permissionIds.filter(id => !existingSet.has(id));
    if (missingIds.length === 0) {
      continue;
    }
    await RolePermission.bulkCreate(
      missingIds.map(permissionId => ({
        role_id: role.id,
        permission_id: permissionId
      }))
    );
  }
};

export const copyRolePermissions = async ({ fromRoleId, toRoleId }) => {
  const existing = await RolePermission.findAll({
    where: { role_id: fromRoleId }
  });
  if (!existing.length) {
    return;
  }
  await RolePermission.destroy({ where: { role_id: toRoleId } });
  await RolePermission.bulkCreate(
    existing.map(item => ({
      role_id: toRoleId,
      permission_id: item.permission_id
    }))
  );
};
