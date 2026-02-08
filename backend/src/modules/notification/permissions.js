export const menuPermissions = [
  {
    "code": "menu:/notifications",
    "name": "消息通知"
  }
];

export const modulePermissions = [
  {
    "code": "module:notifications",
    "name": "消息通知",
    "children": [
      {
        "code": "module:notifications:view",
        "name": "消息通知-查看"
      },
      {
        "code": "module:notifications:edit",
        "name": "消息通知-编辑"
      }
    ]
  }
];

export default { menuPermissions, modulePermissions };
