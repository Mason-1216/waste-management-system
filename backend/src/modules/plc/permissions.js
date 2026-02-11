export const menuPermissions = [
  {
    "code": "menu:/plc-records",
    "name": "PLC记录"
  },
  {
    "code": "menu:/plc-data-report",
    "name": "PLC数据报表"
  },
  {
    "code": "menu:/plc-visual-report",
    "name": "PLC可视化报表"
  }
];

export const modulePermissions = [
  {
    "code": "module:plc-records",
    "name": "PLC记录",
    "children": [
      {
        "code": "module:plc-records:view",
        "name": "PLC记录-查看"
      },
      {
        "code": "module:plc-records:edit",
        "name": "PLC记录-编辑"
      }
    ]
  },
  {
    "code": "module:plc-data-report",
    "name": "PLC数据报表",
    "children": [
      {
        "code": "module:plc-data-report:view",
        "name": "PLC数据报表-查看"
      },
      {
        "code": "module:plc-data-report:edit",
        "name": "PLC数据报表-编辑"
      }
    ]
  },
  {
    "code": "module:plc-visual-report",
    "name": "PLC可视化报表",
    "children": [
      {
        "code": "module:plc-visual-report:view",
        "name": "PLC可视化报表-查看"
      },
      {
        "code": "module:plc-visual-report:edit",
        "name": "PLC可视化报表-编辑"
      }
    ]
  }
];

export default { menuPermissions, modulePermissions };
