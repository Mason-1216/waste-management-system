export const menuPointsSummary = [
  {
    "code": "menu:/points-summary",
    "name": "积分统计"
  }
];

export const menuReports = [
  {
    "code": "menu:/reports",
    "name": "维保数据报表"
  }
];

export const modulePermissions = [
  {
    "code": "module:reports",
    "name": "维保数据报表",
    "children": [
      {
        "code": "module:reports:view",
        "name": "维保数据报表-查看"
      },
      {
        "code": "module:reports:edit",
        "name": "维保数据报表-编辑"
      },
      {
        "code": "module:reports:maintenance:view",
        "name": "设备保养统计-查看"
      },
      {
        "code": "module:reports:maintenance:edit",
        "name": "设备保养统计-编辑"
      },
      {
        "code": "module:reports:faults:view",
        "name": "设备故障统计-查看"
      },
      {
        "code": "module:reports:faults:edit",
        "name": "设备故障统计-编辑"
      }
    ]
  },
  {
    "code": "module:points-summary",
    "name": "积分统计",
    "children": [
      {
        "code": "module:points-summary:view",
        "name": "积分统计-查看"
      },
      {
        "code": "module:points-summary:edit",
        "name": "积分统计-编辑"
      }
    ]
  }
];

export default { menuPointsSummary, menuReports, modulePermissions };
