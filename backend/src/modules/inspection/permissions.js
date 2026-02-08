export const menuSafety = [
  {
    "code": "menu:/safety",
    "name": "安全检查",
    "children": [
      {
        "code": "menu:/safety-self-inspection",
        "name": "安全自检"
      },
      {
        "code": "menu:/safety-other-inspection",
        "name": "员工检查记录"
      },
      {
        "code": "menu:/safety-check-management",
        "name": "检查项目管理"
      }
    ]
  }
];

export const menuSafetyRectification = [
  {
    "code": "menu:/safety-rectification",
    "name": "安全隐患"
  }
];

export const menuHygiene = [
  {
    "code": "menu:/hygiene",
    "name": "卫生检查",
    "children": [
      {
        "code": "menu:/hygiene-self-inspection",
        "name": "卫生自检"
      },
      {
        "code": "menu:/hygiene-other-inspection",
        "name": "员工检查记录"
      },
      {
        "code": "menu:/hygiene-work-arrangement",
        "name": "卫生工作管理"
      }
    ]
  }
];

export const modulePermissions = [
  {
    "code": "module:safety-self-inspection",
    "name": "安全自检",
    "children": [
      {
        "code": "module:safety-self-inspection:view",
        "name": "安全自检-查看"
      },
      {
        "code": "module:safety-self-inspection:edit",
        "name": "安全自检-编辑"
      },
      {
        "code": "module:safety-self-inspection:my:view",
        "name": "我的安全自检-查看"
      },
      {
        "code": "module:safety-self-inspection:my:edit",
        "name": "我的安全自检-编辑"
      },
      {
        "code": "module:safety-self-inspection:staff:view",
        "name": "人员安全自检-查看"
      },
      {
        "code": "module:safety-self-inspection:staff:edit",
        "name": "人员安全自检-编辑"
      }
    ]
  },
  {
    "code": "module:safety-other-inspection",
    "name": "员工检查记录",
    "children": [
      {
        "code": "module:safety-other-inspection:view",
        "name": "员工检查记录-查看"
      },
      {
        "code": "module:safety-other-inspection:edit",
        "name": "员工检查记录-编辑"
      }
    ]
  },
  {
    "code": "module:safety-check-management",
    "name": "检查项目管理",
    "children": [
      {
        "code": "module:safety-check-management:view",
        "name": "检查项目-查看"
      },
      {
        "code": "module:safety-check-management:edit",
        "name": "检查项目-编辑"
      }
    ]
  },
  {
    "code": "module:safety-rectification",
    "name": "安全隐患",
    "children": [
      {
        "code": "module:safety-rectification:view",
        "name": "安全隐患-查看"
      },
      {
        "code": "module:safety-rectification:edit",
        "name": "安全隐患-编辑"
      }
    ]
  },
  {
    "code": "module:hygiene-self-inspection",
    "name": "卫生自检",
    "children": [
      {
        "code": "module:hygiene-self-inspection:view",
        "name": "卫生自检-查看"
      },
      {
        "code": "module:hygiene-self-inspection:edit",
        "name": "卫生自检-编辑"
      },
      {
        "code": "module:hygiene-self-inspection:my:view",
        "name": "我的卫生自检-查看"
      },
      {
        "code": "module:hygiene-self-inspection:my:edit",
        "name": "我的卫生自检-编辑"
      },
      {
        "code": "module:hygiene-self-inspection:staff:view",
        "name": "人员卫生自检-查看"
      },
      {
        "code": "module:hygiene-self-inspection:staff:edit",
        "name": "人员卫生自检-编辑"
      }
    ]
  },
  {
    "code": "module:hygiene-other-inspection",
    "name": "员工检查记录",
    "children": [
      {
        "code": "module:hygiene-other-inspection:view",
        "name": "员工检查记录-查看"
      },
      {
        "code": "module:hygiene-other-inspection:edit",
        "name": "员工检查记录-编辑"
      },
      {
        "code": "module:hygiene-other-inspection:inspection:view",
        "name": "员工检查记录记录-查看"
      },
      {
        "code": "module:hygiene-other-inspection:inspection:edit",
        "name": "员工检查记录记录-编辑"
      },
      {
        "code": "module:hygiene-other-inspection:management-areas:view",
        "name": "卫生区域划分-查看"
      },
      {
        "code": "module:hygiene-other-inspection:management-areas:edit",
        "name": "卫生区域划分-编辑"
      },
      {
        "code": "module:hygiene-other-inspection:management-assignments:view",
        "name": "卫生任务分配-查看"
      },
      {
        "code": "module:hygiene-other-inspection:management-assignments:edit",
        "name": "卫生任务分配-编辑"
      }
    ]
  }
];

export default { menuSafety, menuSafetyRectification, menuHygiene, modulePermissions };
