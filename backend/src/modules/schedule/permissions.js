export const menuPermissions = [
  {
    "code": "menu:/schedule",
    "name": "排班表"
  }
];

export const modulePermissions = [
  {
    "code": "module:schedule",
    "name": "排班表",
    "children": [
      {
        "code": "module:schedule:view",
        "name": "排班表-查看"
      },
      {
        "code": "module:schedule:edit",
        "name": "排班表-编辑"
      }
    ]
  }
];

export default { menuPermissions, modulePermissions };
