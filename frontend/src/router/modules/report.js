export const reportRoutes = [
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('@/modules/report/pages/Index.vue'),
    meta: { title: '维保数据报表' }
  },
  {
    path: '/points-summary',
    name: 'PointsSummary',
    component: () => import('@/modules/report/pages/PointsSummary.vue'),
    redirect: '/points-summary/summary',
    meta: { title: '积分统计', roles: ['dev_test', 'operator', 'maintenance', 'station_manager', 'deputy_manager', 'department_manager', 'senior_management', 'client'] },
    children: [
      {
        path: 'summary',
        name: 'PointsSummarySummary',
        component: () => import('@/modules/report/pages/points/PointsSummaryTab.vue'),
        redirect: '/points-summary/summary/detail',
        meta: { title: '积分汇总', roles: ['dev_test', 'operator', 'maintenance', 'station_manager', 'deputy_manager', 'department_manager', 'senior_management', 'client'] },
        children: [
          {
            path: 'detail',
            name: 'PointsSummaryDetail',
            component: () => import('@/modules/report/pages/points/PointsDetailTab.vue'),
            meta: { title: '积分明细表', roles: ['dev_test', 'operator', 'maintenance', 'station_manager', 'deputy_manager', 'department_manager', 'senior_management', 'client'] }
          },
          {
            path: 'stats',
            name: 'PointsSummaryStats',
            component: () => import('@/modules/report/pages/points/PointsStatisticsTab.vue'),
            meta: { title: '积分统计表', roles: ['dev_test', 'operator', 'maintenance', 'station_manager', 'deputy_manager', 'department_manager', 'senior_management', 'client'] }
          },
          {
            path: 'visual',
            name: 'PointsSummaryVisualTab',
            component: () => import('@/modules/report/pages/points/PointsVisualTab.vue'),
            meta: { title: '任务积分分析', roles: ['dev_test', 'operator', 'maintenance', 'station_manager', 'deputy_manager', 'department_manager', 'senior_management', 'client'] }
          },
          {
            path: 'cycle',
            name: 'PointsSummaryCycleTab',
            component: () => import('@/modules/report/pages/points/PointsCycleAnalysisTab.vue'),
            meta: { title: '周期性积分分析', roles: ['dev_test', 'operator', 'maintenance', 'station_manager', 'deputy_manager', 'department_manager', 'senior_management', 'client'] }
          }
        ]
      },
      {
        path: 'applied-hourly',
        name: 'PointsSummaryAppliedHourly',
        component: () => import('@/modules/report/pages/points/AppliedHourlyContainer.vue'),
        redirect: '/points-summary/applied-hourly/calc',
        meta: { title: '应用小时积分', roles: ['dev_test', 'operator', 'maintenance', 'station_manager', 'deputy_manager', 'department_manager', 'senior_management', 'client'] },
        children: [
          {
            path: 'calc',
            name: 'AppliedHourlyCalc',
            component: () => import('@/modules/report/pages/points/AppliedHourlyCalcTab.vue'),
            meta: { title: '应用小时积分计算', roles: ['dev_test', 'operator', 'maintenance', 'station_manager', 'deputy_manager', 'department_manager', 'senior_management', 'client'] }
          },
          {
            path: 'history',
            name: 'AppliedHourlyHistory',
            component: () => import('@/modules/report/pages/points/AppliedHourlyHistoryTab.vue'),
            meta: { title: '应用小时积分历史记录', roles: ['dev_test', 'operator', 'maintenance', 'station_manager', 'deputy_manager', 'department_manager', 'senior_management', 'client'] }
          },
          {
            path: 'import',
            name: 'AppliedHourlyImport',
            component: () => import('@/modules/report/pages/points/WorkHoursImportTab.vue'),
            meta: { title: '工时导入', roles: ['dev_test', 'operator', 'maintenance', 'station_manager', 'deputy_manager', 'department_manager', 'senior_management', 'client'] }
          },
          {
            path: 'visual',
            name: 'AppliedHourlyVisual',
            component: () => import('@/modules/report/pages/points/AppliedHourlyVisualTab.vue'),
            meta: { title: '可视化分析', roles: ['dev_test', 'operator', 'maintenance', 'station_manager', 'deputy_manager', 'department_manager', 'senior_management', 'client'] }
          }
        ]
      },
      {
        path: 'quarterly-award',
        name: 'PointsSummaryQuarterlyAward',
        component: () => import('@/modules/report/pages/points/QuarterlyAwardContainer.vue'),
        redirect: '/points-summary/quarterly-award/calc',
        meta: { title: '季度积分奖', roles: ['dev_test', 'operator', 'maintenance', 'station_manager', 'deputy_manager', 'department_manager', 'senior_management', 'client'] },
        children: [
          {
            path: 'calc',
            name: 'QuarterlyAwardCalc',
            component: () => import('@/modules/report/pages/points/QuarterlyAwardCalcTab.vue'),
            meta: { title: '季度积分奖计算', roles: ['dev_test', 'operator', 'maintenance', 'station_manager', 'deputy_manager', 'department_manager', 'senior_management', 'client'] }
          },
          {
            path: 'history',
            name: 'QuarterlyAwardHistory',
            component: () => import('@/modules/report/pages/points/QuarterlyAwardHistoryTab.vue'),
            meta: { title: '季度积分奖历史数据', roles: ['dev_test', 'operator', 'maintenance', 'station_manager', 'deputy_manager', 'department_manager', 'senior_management', 'client'] }
          },
          {
            path: 'visual',
            name: 'QuarterlyAwardVisual',
            component: () => import('@/modules/report/pages/points/QuarterlyAwardVisualTab.vue'),
            meta: { title: '季度积分奖可视化分析', roles: ['dev_test', 'operator', 'maintenance', 'station_manager', 'deputy_manager', 'department_manager', 'senior_management', 'client'] }
          }
        ]
      }
    ]
  },
  {
    path: '/points-summary/visual',
    name: 'PointsSummaryVisual',
    redirect: '/points-summary/summary/visual',
    meta: { title: '积分可视化分析', roles: ['dev_test', 'operator', 'maintenance', 'station_manager', 'deputy_manager', 'department_manager', 'senior_management', 'client'] }
  },
  {
    path: '/points-summary/applied-hourly-visual',
    name: 'AppliedHourlyPointsVisualLegacy',
    redirect: '/points-summary/applied-hourly/visual',
    meta: { title: '应用小时积分可视化分析', roles: ['dev_test', 'operator', 'maintenance', 'station_manager', 'deputy_manager', 'department_manager', 'senior_management', 'client'] }
  }
];
