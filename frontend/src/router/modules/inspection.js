export const inspectionRoutes = [
  {
    path: '/hygiene-self-inspection',
    name: 'HygieneSelfInspection',
    component: () => import('@/views/inspection/HygieneInspection.vue'),
    meta: { title: '卫生自检' }
  },
  {
    path: '/safety-rectification',
    name: 'SafetyRectification',
    component: () => import('@/views/inspection/SafetyRectification.vue'),
    meta: { title: '安全隐患' }
  },
  {
    path: '/hygiene-other-inspection',
    name: 'HygieneOtherInspection',
    component: () => import('@/views/inspection/HygieneOtherInspection.vue'),
    meta: { title: '卫生他检' }
  },
  {
    path: '/hygiene-work-arrangement',
    name: 'HygieneWorkArrangement',
    component: () => import('@/views/inspection/HygieneWorkArrangement.vue'),
    meta: { title: '卫生工作安排' }
  },
  {
    path: '/safety-self-inspection',
    name: 'SafetySelfInspection',
    component: () => import('@/views/inspection/SelfInspection.vue'),
    meta: { title: '安全自检', roles: ['operator', 'maintenance', 'station_manager', 'deputy_manager', 'department_manager', 'safety_inspector', 'senior_management', 'admin'] }
  },
  {
    path: '/safety-other-inspection',
    name: 'SafetyOtherInspection',
    component: () => import('@/views/inspection/OtherInspection.vue'),
    meta: { title: '安全他检' }
  },
  {
    path: '/safety-check-management',
    name: 'SafetyCheckManagement',
    component: () => import('@/views/inspection/SafetyCheckManagement.vue'),
    meta: { title: '安全检查项目', roles: ['safety_inspector'] }
  }
];
