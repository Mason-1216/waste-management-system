export const inspectionRoutes = [
  {
    path: '/hygiene-self-inspection',
    name: 'HygieneSelfInspection',
    component: () => import('@/modules/inspection/pages/HygieneInspection.vue'),
    meta: { title: '卫生自检' }
  },
  {
    path: '/hygiene-other-inspection',
    name: 'HygieneOtherInspection',
    component: () => import('@/modules/inspection/pages/HygieneOtherInspection.vue'),
    meta: { title: '卫生他检' }
  },
  {
    path: '/safety-rectification',
    name: 'SafetyRectification',
    component: () => import('@/modules/inspection/pages/SafetyRectification.vue'),
    meta: { title: '安全隐患' }
  },
  {
    path: '/hygiene-work-arrangement',
    name: 'HygieneWorkArrangement',
    component: () => import('@/modules/inspection/pages/HygieneWorkArrangement.vue'),
    meta: { title: '卫生工作管理' }
  },
  {
    path: '/safety-self-inspection',
    name: 'SafetySelfInspection',
    component: () => import('@/modules/inspection/pages/SelfInspection.vue'),
    meta: { title: '安全自检', roles: ['operator', 'maintenance', 'station_manager', 'deputy_manager', 'department_manager', 'safety_inspector', 'senior_management', 'admin'] }
  },
  {
    path: '/safety-other-inspection',
    name: 'SafetyOtherInspection',
    component: () => import('@/modules/inspection/pages/OtherInspection.vue'),
    meta: { title: '安全他检' }
  },
  {
    path: '/safety-check-management',
    name: 'SafetyCheckManagement',
    component: () => import('@/modules/inspection/pages/SafetyCheckManagement.vue'),
    meta: { title: '安全检查项目', roles: ['safety_inspector'] }
  }
];
