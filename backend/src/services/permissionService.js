import { Op } from 'sequelize';
import { Permission, Role, RolePermission, UserPermission } from '../models/index.js';
import {
  flattenMenuPermissions,
  flattenModulePermissions,
  roleMenuDefaults,
  roleModuleDefaults
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
  const modulePermissions = flattenModulePermissions();

  const existing = await Permission.findAll();
  const existingMap = new Map(existing.map(item => [item.permission_code, item]));

  // 处理菜单权限
  const menuRecords = menuPermissions.map(item => ({
    code: item.code,
    name: item.name,
    type: 'menu',
    parentCode: item.parentCode
  }));

  // 处理模块权限
  const moduleRecords = modulePermissions.map(item => ({
    code: item.code,
    name: item.name,
    type: 'module',
    parentCode: item.parentCode
  }));

  const parentMap = new Map();

  // 插入菜单权限
  for (const record of menuRecords) {
    const parentId = record.parentCode ? parentMap.get(record.parentCode) || 0 : 0;
    const id = await upsertPermission(
      { ...record, parentId },
      existingMap
    );
    parentMap.set(record.code, id);
  }

  // 插入模块权限
  for (const record of moduleRecords) {
    const parentId = record.parentCode ? parentMap.get(record.parentCode) || 0 : 0;
    const id = await upsertPermission(
      { ...record, parentId },
      existingMap
    );
    parentMap.set(record.code, id);
  }

  await pruneStalePermissions(
    Array.from(new Set([...menuRecords, ...moduleRecords].map(item => item.code)))
  );
};

const pruneStalePermissions = async (allowedCodes = []) => {
  if (!allowedCodes.length) {
    return;
  }

  const stalePermissions = await Permission.findAll({
    where: {
      resource_type: {
        [Op.in]: ['menu', 'module']
      },
      permission_code: {
        [Op.notIn]: allowedCodes
      }
    },
    attributes: ['id']
  });

  if (!stalePermissions.length) {
    return;
  }

  const staleIds = stalePermissions.map(item => item.id);
  await RolePermission.destroy({ where: { permission_id: staleIds } });
  await UserPermission.destroy({ where: { permission_id: staleIds } });
  await Permission.destroy({ where: { id: staleIds } });
};

export const getUserPermissionOverrides = async (userId) => {
  const records = await UserPermission.findAll({
    where: { user_id: userId },
    include: [{ model: Permission, as: 'permission', attributes: ['permission_code'] }]
  });

  const allow = [];
  const deny = [];

  records.forEach(record => {
    const code = record.permission?.permission_code;
    if (!code) return;
    if (record.effect === 'deny') {
      deny.push(code);
    } else {
      allow.push(code);
    }
  });

  return { allow, deny };
};

export const mergePermissionCodes = (baseCodes = [], allowCodes = [], denyCodes = []) => {
  const baseSet = new Set(baseCodes || []);
  allowCodes?.forEach(code => baseSet.add(code));
  denyCodes?.forEach(code => baseSet.delete(code));
  return Array.from(baseSet);
};

const buildRolePermissionIds = async (menuCodes, moduleCodes) => {
  const codes = [...new Set([...(menuCodes || []), ...(moduleCodes || [])])];
  if (!codes.length) return [];

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
    const moduleCodes = roleModuleDefaults[role.role_code] || [];
    const permissionIds = await buildRolePermissionIds(menuCodes, moduleCodes);
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
