import { coreRoutes, coreChildRoutes, fallbackRoutes } from './core';
import { accountRoutes } from './account';
import { adminRoutes } from './admin';
import { inspectionRoutes } from './inspection';
import { maintenanceRoutes } from './maintenance';
import { plcRoutes } from './plc';
import { reportRoutes } from './report';
import { scheduleRoutes } from './schedule';
import { supportRoutes } from './support';
import { taskRoutes } from './task';
import { notificationRoutes } from './notification';

export const layoutChildren = [
  ...coreChildRoutes,
  ...accountRoutes,
  ...adminRoutes,
  ...scheduleRoutes,
  ...taskRoutes,
  ...maintenanceRoutes,
  ...inspectionRoutes,
  ...notificationRoutes,
  ...supportRoutes,
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
