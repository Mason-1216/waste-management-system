import { coreRoutes, coreChildRoutes, fallbackRoutes } from './core';
import { inspectionRoutes } from './inspection';
import { maintenanceRoutes } from './maintenance';
import { plcRoutes } from './plc';
import { reportRoutes } from './report';
import { scheduleRoutes } from './schedule';
import { systemRoutes } from './system';
import { taskRoutes } from './task';

export const layoutChildren = [
  ...coreChildRoutes,
  ...scheduleRoutes,
  ...taskRoutes,
  ...maintenanceRoutes,
  ...inspectionRoutes,
  ...systemRoutes,
  ...reportRoutes,
  ...plcRoutes
];

export const routes = [
  ...coreRoutes,
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layout/Index.vue'),
    redirect: '/home',
    meta: { requiresAuth: true },
    children: layoutChildren
  },
  ...fallbackRoutes
];
