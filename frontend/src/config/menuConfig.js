export const menuConfig = {
  admin: [
    { path: '/home', name: '\u9996\u9875', icon: 'House' },
    { path: '/plc-records', name: '\u0050\u004c\u0043\u8bb0\u5f55', icon: 'DataAnalysis' },
    { path: '/user-management', name: '\u7528\u6237\u7ba1\u7406', icon: 'User' },
    { path: '/organization-management', name: '\u7ec4\u7ec7\u67b6\u6784', icon: 'OfficeBuilding' },
    { path: '/change-password', name: '\u4fee\u6539\u5bc6\u7801', icon: 'Lock' }
  ],

  operator: [
    { path: '/home', name: '\u9996\u9875', icon: 'House' },
    { path: '/schedule', name: '\u6392\u73ed\u8868', icon: 'Calendar' },
    { path: '/safety-self-inspection', name: '\u5b89\u5168\u81ea\u68c0', icon: 'Shield' },
    { path: '/hygiene-self-inspection', name: '\u536b\u751f\u81ea\u68c0', icon: 'Brush' },
    {
      path: '/work', name: '\u5c97\u4f4d\u5de5\u4f5c',
      icon: 'Briefcase',
      children: [
        { path: '/position-work', name: '\u56fa\u5b9a\u4efb\u52a1' },
        { path: '/temporary-tasks', name: '\u4e34\u65f6\u4efb\u52a1' }
      ]
    },
    { path: '/maintenance-task', name: '\u8bbe\u5907\u4fdd\u517b', icon: 'Tools' },
    { path: '/device-faults', name: '\u8bbe\u5907\u6545\u969c', icon: 'Warning' },
    { path: '/change-password', name: '\u4fee\u6539\u5bc6\u7801', icon: 'Lock' }
  ],

  maintenance: [
    { path: '/home', name: '\u9996\u9875', icon: 'House' },
    { path: '/safety-self-inspection', name: '\u5b89\u5168\u81ea\u68c0', icon: 'Shield' },
    { path: '/device-faults', name: '\u8bbe\u5907\u6545\u969c', icon: 'Warning' },
    { path: '/change-password', name: '\u4fee\u6539\u5bc6\u7801', icon: 'Lock' }
  ],

  station_manager: [
    { path: '/home', name: '\u9996\u9875', icon: 'House' },
    { path: '/schedule', name: '\u6392\u73ed\u8868', icon: 'Calendar' },
    {
      path: '/safety', name: '\u5b89\u5168\u68c0\u67e5', icon: 'Shield',
      children: [
        { path: '/safety-self-inspection', name: '\u5b89\u5168\u81ea\u68c0' },
        { path: '/safety-other-inspection', name: '\u5b89\u5168\u4ed6\u68c0' }
      ]
    },
    { path: '/safety-rectification', name: '\u5b89\u5168\u9690\u60a3', icon: 'Warning' },
    {
      path: '/hygiene', name: '\u536b\u751f\u68c0\u67e5', icon: 'Brush',
      children: [
        { path: '/hygiene-self-inspection', name: '\u536b\u751f\u81ea\u68c0' },
        { path: '/hygiene-other-inspection', name: '\u536b\u751f\u4ed6\u68c0' }
      ]
    },
    { path: '/position-work', name: '\u5c97\u4f4d\u5de5\u4f5c', icon: 'Monitor' },
    { path: '/temporary-tasks', name: '\u4e34\u65f6\u4efb\u52a1', icon: 'Operation' },
    { path: '/maintenance-task', name: '\u8bbe\u5907\u4fdd\u517b', icon: 'Tools' },
    { path: '/device-faults', name: '\u8bbe\u5907\u6545\u969c', icon: 'List' },
    { path: '/plc-records', name: '\u0050\u004c\u0043\u8bb0\u5f55', icon: 'DataAnalysis' },
    { path: '/reports', name: '\u6570\u636e\u62a5\u8868', icon: 'DataAnalysis' },
    { path: '/change-password', name: '\u4fee\u6539\u5bc6\u7801', icon: 'Lock' }
  ],

  deputy_manager: [
    { path: '/home', name: '\u9996\u9875', icon: 'House' },
    { path: '/schedule', name: '\u6392\u73ed\u8868', icon: 'Calendar' },
    {
      path: '/safety', name: '\u5b89\u5168\u68c0\u67e5', icon: 'Shield',
      children: [
        { path: '/safety-self-inspection', name: '\u5b89\u5168\u81ea\u68c0' },
        { path: '/safety-other-inspection', name: '\u5b89\u5168\u4ed6\u68c0' }
      ]
    },
    { path: '/safety-rectification', name: '\u5b89\u5168\u9690\u60a3', icon: 'Warning' },
    {
      path: '/hygiene', name: '\u536b\u751f\u68c0\u67e5', icon: 'Brush',
      children: [
        { path: '/hygiene-self-inspection', name: '\u536b\u751f\u81ea\u68c0' },
        { path: '/hygiene-other-inspection', name: '\u536b\u751f\u4ed6\u68c0' }
      ]
    },
    { path: '/position-work', name: '\u5c97\u4f4d\u5de5\u4f5c', icon: 'Monitor' },
    { path: '/temporary-tasks', name: '\u4e34\u65f6\u4efb\u52a1', icon: 'Operation' },
    { path: '/maintenance-task', name: '\u8bbe\u5907\u4fdd\u517b', icon: 'Tools' },
    { path: '/device-faults', name: '\u8bbe\u5907\u6545\u969c', icon: 'List' },
    { path: '/plc-records', name: '\u0050\u004c\u0043\u8bb0\u5f55', icon: 'DataAnalysis' },
    { path: '/reports', name: '\u6570\u636e\u62a5\u8868', icon: 'DataAnalysis' },
    { path: '/change-password', name: '\u4fee\u6539\u5bc6\u7801', icon: 'Lock' }
  ],

  department_manager: [
    { path: '/home', name: '\u9996\u9875', icon: 'House' },
    { path: '/schedule', name: '\u6392\u73ed\u8868', icon: 'Calendar' },
    {
      path: '/safety', name: '\u5b89\u5168\u68c0\u67e5', icon: 'Shield',
      children: [
        { path: '/safety-self-inspection', name: '\u5b89\u5168\u81ea\u68c0' },
        { path: '/safety-other-inspection', name: '\u5b89\u5168\u4ed6\u68c0' }
      ]
    },
    { path: '/safety-rectification', name: '\u5b89\u5168\u9690\u60a3', icon: 'Warning' },
    {
      path: '/hygiene', name: '\u536b\u751f\u68c0\u67e5', icon: 'Brush',
      children: [
        { path: '/hygiene-self-inspection', name: '\u536b\u751f\u81ea\u68c0' },
        { path: '/hygiene-other-inspection', name: '\u536b\u751f\u4ed6\u68c0' }
      ]
    },
    { path: '/position-work', name: '\u5c97\u4f4d\u5de5\u4f5c', icon: 'Monitor' },
    { path: '/temporary-tasks', name: '\u4e34\u65f6\u4efb\u52a1', icon: 'Operation' },
    { path: '/maintenance-task', name: '\u8bbe\u5907\u4fdd\u517b', icon: 'Tools' },
    { path: '/device-faults', name: '\u8bbe\u5907\u6545\u969c', icon: 'List' },
    { path: '/plc-records', name: '\u0050\u004c\u0043\u8bb0\u5f55', icon: 'DataAnalysis' },
    { path: '/reports', name: '\u6570\u636e\u62a5\u8868', icon: 'DataAnalysis' },
    { path: '/change-password', name: '\u4fee\u6539\u5bc6\u7801', icon: 'Lock' }
  ],

  safety_inspector: [
    { path: '/home', name: '\u9996\u9875', icon: 'House' },
    {
      path: '/safety', name: '\u5b89\u5168\u68c0\u67e5', icon: 'Shield',
      children: [
        { path: '/safety-check-management', name: '\u68c0\u67e5\u9879\u76ee\u7ba1\u7406' },
        { path: '/safety-self-inspection', name: '\u5b89\u5168\u81ea\u68c0' },
        { path: '/safety-other-inspection', name: '\u5b89\u5168\u4ed6\u68c0' }
      ]
    },
    { path: '/safety-rectification', name: '\u5b89\u5168\u9690\u60a3', icon: 'Warning' },
    {
      path: '/hygiene', name: '\u536b\u751f\u68c0\u67e5', icon: 'Brush',
      children: [
        { path: '/hygiene-self-inspection', name: '\u536b\u751f\u81ea\u68c0' },
        { path: '/hygiene-other-inspection', name: '\u536b\u751f\u4ed6\u68c0' }
      ]
    },
    { path: '/plc-records', name: '\u0050\u004c\u0043\u8bb0\u5f55', icon: 'DataAnalysis' },
    { path: '/change-password', name: '\u4fee\u6539\u5bc6\u7801', icon: 'Lock' }
  ],

  senior_management: [
    { path: '/home', name: '\u9996\u9875', icon: 'House' },
    { path: '/schedule', name: '\u6392\u73ed\u8868', icon: 'Calendar' },
    {
      path: '/safety', name: '\u5b89\u5168\u68c0\u67e5', icon: 'Shield',
      children: [
        { path: '/safety-self-inspection', name: '\u5b89\u5168\u81ea\u68c0' },
        { path: '/safety-other-inspection', name: '\u5b89\u5168\u4ed6\u68c0' }
      ]
    },
    { path: '/safety-rectification', name: '\u5b89\u5168\u9690\u60a3', icon: 'Warning' },
    {
      path: '/hygiene', name: '\u536b\u751f\u68c0\u67e5', icon: 'Brush',
      children: [
        { path: '/hygiene-self-inspection', name: '\u536b\u751f\u81ea\u68c0' },
        { path: '/hygiene-other-inspection', name: '\u536b\u751f\u4ed6\u68c0' }
      ]
    },
    { path: '/position-work', name: '\u5c97\u4f4d\u5de5\u4f5c', icon: 'Monitor' },
    { path: '/temporary-tasks', name: '\u4e34\u65f6\u4efb\u52a1', icon: 'Operation' },
    { path: '/device-faults', name: '\u8bbe\u5907\u6545\u969c', icon: 'List' },
    { path: '/plc-records', name: '\u0050\u004c\u0043\u8bb0\u5f55', icon: 'DataAnalysis' },
    { path: '/reports', name: '\u6570\u636e\u62a5\u8868', icon: 'DataAnalysis' },
    { path: '/change-password', name: '\u4fee\u6539\u5bc6\u7801', icon: 'Lock' }
  ],

  client: [
    { path: '/home', name: '\u9996\u9875', icon: 'House' },
    { path: '/reports', name: '\u6570\u636e\u62a5\u8868', icon: 'DataAnalysis' },
    { path: '/change-password', name: '\u4fee\u6539\u5bc6\u7801', icon: 'Lock' }
  ]
};

export const bottomMenus = [
  { path: '/notifications', name: '\u6d88\u606f\u901a\u77e5', icon: 'Bell' },
  { path: '/help-feedback', name: '\u5e2e\u52a9\u4e0e\u53cd\u9988', icon: 'QuestionFilled' },
  { path: 'logout', name: '\u9000\u51fa\u767b\u5f55', icon: 'SwitchButton', isAction: true }
];

export default menuConfig;
