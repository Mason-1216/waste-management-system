export const menuPositionWork = [
  {
    "code": "menu:/position-work",
    "name": "岗位工作",
    "children": [
      {
        "code": "menu:/position-work/field",
        "name": "固定任务"
      },
      {
        "code": "menu:/position-work/management",
        "name": "岗位工作任务汇总表"
      },
      {
        "code": "menu:/position-work/records",
        "name": "岗位工作完成情况记录"
      }
    ]
  }
];

export const menuTemporaryTasks = [
  {
    "code": "menu:/temporary-tasks",
    "name": "临时任务",
    "children": [
      {
        "code": "menu:/temporary-tasks/fill",
        "name": "临时任务填报"
      },
      {
        "code": "menu:/temporary-tasks/history",
        "name": "历史完成记录"
      },
      {
        "code": "menu:/temporary-tasks/library",
        "name": "临时任务汇总表"
      }
    ]
  }
];

export const modulePermissions = [
  {
    "code": "module:position-work",
    "name": "岗位工作",
    "children": [
      {
        "code": "module:position-work:view",
        "name": "岗位工作-查看"
      },
      {
        "code": "module:position-work:edit",
        "name": "岗位工作-编辑"
      },
      {
        "code": "module:position-work:my-work:view",
        "name": "固定任务-查看"
      },
      {
        "code": "module:position-work:my-work:edit",
        "name": "固定任务-编辑"
      },
      {
        "code": "module:position-work:management:view",
        "name": "人员岗位管理-查看"
      },
      {
        "code": "module:position-work:management:edit",
        "name": "人员岗位管理-编辑"
      }
    ]
  },
  {
    "code": "module:temporary-tasks",
    "name": "临时工作",
    "children": [
      {
        "code": "module:temporary-tasks:view",
        "name": "临时工作-查看"
      },
      {
        "code": "module:temporary-tasks:edit",
        "name": "临时工作-编辑"
      },
      {
        "code": "module:temporary-tasks:tasks:view",
        "name": "临时工作列表-查看"
      },
      {
        "code": "module:temporary-tasks:tasks:edit",
        "name": "临时工作列表-编辑"
      },
      {
        "code": "module:temporary-tasks:library:view",
        "name": "临时工作任务汇总表-查看"
      },
      {
        "code": "module:temporary-tasks:library:edit",
        "name": "临时工作任务汇总表-编辑"
      }
    ]
  }
];

export default { menuPositionWork, menuTemporaryTasks, modulePermissions };
