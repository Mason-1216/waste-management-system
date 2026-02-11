export const menuPermissions = [
  {
    "code": "menu:/maintenance-task",
    "name": "保养任务"
  },
  {
    "code": "menu:/device-faults",
    "name": "设备故障"
  }
];

export const modulePermissions = [
  {
    "code": "module:maintenance-task",
    "name": "保养任务",
    "children": [
      {
        "code": "module:maintenance-task:view",
        "name": "保养任务-查看"
      },
      {
        "code": "module:maintenance-task:edit",
        "name": "保养任务-编辑"
      }
    ]
  },
  {
    "code": "module:device-faults",
    "name": "设备故障",
    "children": [
      {
        "code": "module:device-faults:view",
        "name": "设备故障-查看"
      },
      {
        "code": "module:device-faults:edit",
        "name": "设备故障-编辑"
      },
      {
        "code": "module:device-faults:faults:view",
        "name": "故障列表-查看"
      },
      {
        "code": "module:device-faults:faults:edit",
        "name": "故障列表-编辑"
      },
      {
        "code": "module:device-faults:equipment:view",
        "name": "设备管理-查看"
      },
      {
        "code": "module:device-faults:equipment:edit",
        "name": "设备管理-编辑"
      }
    ]
  },
  {
    "code": "module:fault-report",
    "name": "故障上报",
    "children": [
      {
        "code": "module:fault-report:report:view",
        "name": "故障上报-查看"
      },
      {
        "code": "module:fault-report:report:edit",
        "name": "故障上报-编辑"
      },
      {
        "code": "module:fault-report:equipment:view",
        "name": "设备管理-查看"
      },
      {
        "code": "module:fault-report:equipment:edit",
        "name": "设备管理-编辑"
      }
    ]
  },
  {
    "code": "module:repair-work",
    "name": "维修工单",
    "children": [
      {
        "code": "module:repair-work:pending:view",
        "name": "待处理-查看"
      },
      {
        "code": "module:repair-work:pending:edit",
        "name": "待处理-编辑"
      },
      {
        "code": "module:repair-work:in-progress:view",
        "name": "进行中-查看"
      },
      {
        "code": "module:repair-work:in-progress:edit",
        "name": "进行中-编辑"
      },
      {
        "code": "module:repair-work:completed:view",
        "name": "已完成-查看"
      },
      {
        "code": "module:repair-work:completed:edit",
        "name": "已完成-编辑"
      }
    ]
  },
  {
    "code": "module:maintenance-approval",
    "name": "维修审批",
    "children": [
      {
        "code": "module:maintenance-approval:pending:view",
        "name": "待审核-查看"
      },
      {
        "code": "module:maintenance-approval:pending:edit",
        "name": "待审核-编辑"
      },
      {
        "code": "module:maintenance-approval:approved:view",
        "name": "已通过-查看"
      },
      {
        "code": "module:maintenance-approval:approved:edit",
        "name": "已通过-编辑"
      },
      {
        "code": "module:maintenance-approval:rejected:view",
        "name": "已驳回-查看"
      },
      {
        "code": "module:maintenance-approval:rejected:edit",
        "name": "已驳回-编辑"
      }
    ]
  }
];

export default { menuPermissions, modulePermissions };
