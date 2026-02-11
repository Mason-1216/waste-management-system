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
        "name": "安全他检"
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
        "name": "卫生他检"
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
      }
    ]
  },
  {
    "code": "module:safety-other-inspection",
    "name": "安全他检",
    "children": [
      {
        "code": "module:safety-other-inspection:view",
        "name": "安全他检-查看"
      },
      {
        "code": "module:safety-other-inspection:edit",
        "name": "安全他检-编辑"
      }
    ]
  },
  {
    "code": "module:safety-check-management",
    "name": "检查项目管理",
    "children": [
      {
        "code": "module:safety-check-management:view",
        "name": "检查项目管理-查看"
      },
      {
        "code": "module:safety-check-management:edit",
        "name": "检查项目管理-编辑"
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
      }
    ]
  },
  {
    "code": "module:hygiene-other-inspection",
    "name": "卫生他检",
    "children": [
      {
        "code": "module:hygiene-other-inspection:view",
        "name": "卫生他检-查看"
      },
      {
        "code": "module:hygiene-other-inspection:edit",
        "name": "卫生他检-编辑"
      }
    ]
  },
  {
    "code": "module:hygiene-work-arrangement",
    "name": "卫生工作管理",
    "children": [
      {
        "code": "module:hygiene-work-arrangement:view",
        "name": "卫生工作管理-查看"
      },
      {
        "code": "module:hygiene-work-arrangement:edit",
        "name": "卫生工作管理-编辑"
      }
    ]
  }
];

export default { menuSafety, menuSafetyRectification, menuHygiene, modulePermissions };
