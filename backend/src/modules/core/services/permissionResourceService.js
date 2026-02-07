import { Permission } from '../../../models/index.js';
import { ensurePermissions } from '../../../services/permissionService.js';

export const getPermissions = async (ctx) => {
  await ensurePermissions();
  const list = await Permission.findAll({
    order: [['id', 'ASC']]
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: {
      list: list.map(item => ({
        id: item.id,
        code: item.permission_code,
        name: item.permission_name,
        type: item.resource_type,
        parentId: item.parent_id
      }))
    }
  };
};

// Returns a lightweight menu permission catalog for building navigation and route guards.
// This endpoint is intended for all logged-in users, so it must not be admin-only.
export const getPermissionCatalog = async (ctx) => {
  // Role permissions are already ensured during login (/auth/login) and /auth/me.
  // Avoid running ensurePermissions() here to prevent extra DB writes on every page load.
  const list = await Permission.findAll({
    where: { resource_type: 'menu' },
    attributes: ['permission_code'],
    order: [['id', 'ASC']]
  });

  ctx.body = {
    code: 200,
    message: 'success',
    data: {
      menuCodes: list.map(item => item.permission_code).filter(Boolean)
    }
  };
};

export default {
  getPermissions,
  getPermissionCatalog
};
