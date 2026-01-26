import Router from 'koa-router';
import { authMiddleware } from '../middlewares/auth.js';
import { checkDataPermission } from '../middlewares/permission.js';

// 导入控制器
import { publicModules, privateModules } from '../modules/index.js';

const router = new Router({ prefix: '/api' });

// ============================================
// 认证路由（无需登录）
// ============================================
publicModules.forEach(registerRoutes => registerRoutes(router));

// ============================================
// 以下路由需要登录
// ============================================
router.use(authMiddleware);
router.use(checkDataPermission);

privateModules.forEach(registerRoutes => registerRoutes(router));

export default router;
