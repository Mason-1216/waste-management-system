export const menuHome = [
  {
    "code": "menu:/home",
    "name": "首页"
  }
];

export const menuAdmin = [
  {
    "code": "menu:/user-management",
    "name": "用户管理"
  },
  {
    "code": "menu:/organization-management",
    "name": "组织架构"
  }
];

export const menuAccount = [
  {
    "code": "menu:/change-password",
    "name": "修改密码"
  }
];

export const modulePermissions = [
  {
    "code": "module:organization",
    "name": "组织架构管理",
    "children": [
      {
        "code": "module:organization:station:view",
        "name": "场站管理-查看"
      },
      {
        "code": "module:organization:station:edit",
        "name": "场站管理-编辑"
      },
      {
        "code": "module:organization:department:view",
        "name": "部门管理-查看"
      },
      {
        "code": "module:organization:department:edit",
        "name": "部门管理-编辑"
      },
      {
        "code": "module:organization:company:view",
        "name": "公司管理-查看"
      },
      {
        "code": "module:organization:company:edit",
        "name": "公司管理-编辑"
      },
      {
        "code": "module:organization:role:view",
        "name": "角色管理-查看"
      },
      {
        "code": "module:organization:role:edit",
        "name": "角色管理-编辑"
      }
    ]
  },
  {
    "code": "module:user",
    "name": "用户管理",
    "children": [
      {
        "code": "module:user:view",
        "name": "用户管理-查看"
      },
      {
        "code": "module:user:edit",
        "name": "用户管理-编辑"
      }
    ]
  }
];

export default { menuHome, menuAdmin, menuAccount, modulePermissions };
