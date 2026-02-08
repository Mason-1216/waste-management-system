export const menuPermissions = [
  {
    "code": "menu:/help-feedback",
    "name": "帮助与反馈"
  }
];

export const modulePermissions = [
  {
    "code": "module:help-feedback",
    "name": "帮助与反馈",
    "children": [
      {
        "code": "module:help-feedback:view",
        "name": "帮助反馈-查看"
      },
      {
        "code": "module:help-feedback:edit",
        "name": "帮助反馈-编辑"
      }
    ]
  }
];

export default { menuPermissions, modulePermissions };
