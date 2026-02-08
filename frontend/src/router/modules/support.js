export const supportRoutes = [
  {
    path: '/help-feedback',
    name: 'HelpFeedback',
    component: () => import('@/modules/support/pages/HelpFeedback.vue'),
    meta: { title: '帮助与反馈' }
  }
];

