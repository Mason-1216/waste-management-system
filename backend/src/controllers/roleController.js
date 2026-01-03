import { Op } from 'sequelize';
import { Role, RolePermission, Permission, User } from '../models/index.js';
import { createError } from '../middlewares/error.js';
import { ensureRolePermissions, copyRolePermissions } from '../services/permissionService.js';
import { systemRoleCodes } from '../config/permissionSeeds.js';

const normalizeRole = (role, baseRoleName) => ({
  id: role.id,
  roleName: role.role_name,
  roleCode: role.role_code,
  baseRoleCode: role.base_role_code || role.role_code,
  baseRoleName: baseRoleName || null,
  description: role.description || '',
  createdAt: role.created_at
});

export const getRoles = async (ctx) => {
  await ensureRolePermissions();
  const roles = await Role.findAll({ order: [['id', 'ASC']] });
  const roleMap = new Map(roles.map(role => [role.role_code, role.role_name]));

  ctx.body = {
    code: 200,
    message: 'success',
    data: {
      list: roles.map(role => normalizeRole(role, roleMap.get(role.base_role_code || role.role_code)))
    }
  };
};

export const getRolePermissions = async (ctx) => {
  const roleId = Number(ctx.params.id);
  if (!roleId) {
    throw createError(400, '无效的角色ID');
  }

  const role = await Role.findByPk(roleId);
  if (!role) {
    throw createError(404, '角色不存在');
  }

  const permissions = await RolePermission.findAll({
    where: { role_id: roleId }
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: {
      roleId,
      permissionIds: permissions.map(item => item.permission_id)
    }
  };
};

export const createRole = async (ctx) => {
  const {
    roleName,
    roleCode,
    description,
    baseRoleCode,
    permissionIds
  } = ctx.request.body || {};

  if (!roleName || !roleCode || !baseRoleCode) {
    throw createError(400, '角色名称、角色编码和基准角色不能为空');
  }

  const existing = await Role.findOne({
    where: {
      [Op.or]: [
        { role_name: roleName },
        { role_code: roleCode }
      ]
    }
  });
  if (existing) {
    throw createError(400, '角色名称或角色编码已存在');
  }

  const baseRole = await Role.findOne({ where: { role_code: baseRoleCode } });
  if (!baseRole) {
    throw createError(400, '基准角色不存在');
  }

  const role = await Role.create({
    role_name: roleName,
    role_code: roleCode,
    base_role_code: baseRoleCode,
    description: description || null
  });

  if (Array.isArray(permissionIds) && permissionIds.length > 0) {
    await RolePermission.bulkCreate(
      permissionIds.map(permissionId => ({
        role_id: role.id,
        permission_id: permissionId
      }))
    );
  } else {
    await copyRolePermissions({ fromRoleId: baseRole.id, toRoleId: role.id });
  }

  ctx.body = {
    code: 200,
    message: '角色创建成功',
    data: normalizeRole(role, baseRole.role_name)
  };
};

export const updateRole = async (ctx) => {
  const roleId = Number(ctx.params.id);
  if (!roleId) {
    throw createError(400, '无效的角色ID');
  }

  const role = await Role.findByPk(roleId);
  if (!role) {
    throw createError(404, '角色不存在');
  }

  const {
    roleName,
    description,
    baseRoleCode,
    permissionIds
  } = ctx.request.body || {};

  if (roleName) {
    const existsName = await Role.findOne({
      where: {
        role_name: roleName,
        id: { [Op.ne]: roleId }
      }
    });
    if (existsName) {
      throw createError(400, '角色名称已存在');
    }
    role.role_name = roleName;
  }

  if (baseRoleCode) {
    const baseRole = await Role.findOne({ where: { role_code: baseRoleCode } });
    if (!baseRole) {
      throw createError(400, '基准角色不存在');
    }
    role.base_role_code = baseRoleCode;
  }

  role.description = description ?? role.description;
  await role.save();

  if (Array.isArray(permissionIds)) {
    await RolePermission.destroy({ where: { role_id: roleId } });
    if (permissionIds.length > 0) {
      await RolePermission.bulkCreate(
        permissionIds.map(permissionId => ({
          role_id: roleId,
          permission_id: permissionId
        }))
      );
    }
  }

  const baseRoleName = role.base_role_code
    ? (await Role.findOne({ where: { role_code: role.base_role_code } }))?.role_name
    : role.role_name;

  ctx.body = {
    code: 200,
    message: '角色更新成功',
    data: normalizeRole(role, baseRoleName || null)
  };
};

export const deleteRole = async (ctx) => {
  const roleId = Number(ctx.params.id);
  if (!roleId) {
    throw createError(400, '无效的角色ID');
  }

  const role = await Role.findByPk(roleId);
  if (!role) {
    throw createError(404, '角色不存在');
  }

  if (systemRoleCodes.includes(role.role_code)) {
    throw createError(400, '系统内置角色不允许删除');
  }

  const userCount = await User.count({ where: { role_id: roleId } });
  if (userCount > 0) {
    throw createError(400, '该角色已有用户绑定，无法删除');
  }

  await RolePermission.destroy({ where: { role_id: roleId } });
  await role.destroy();

  ctx.body = {
    code: 200,
    message: '角色删除成功',
    data: null
  };
};

export default {
  getRoles,
  getRolePermissions,
  createRole,
  updateRole,
  deleteRole
};
