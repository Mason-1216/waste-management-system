import { Permission } from '../models/index.js';
import { ensurePermissions } from '../services/permissionService.js';

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

export default {
  getPermissions
};
