import authController from '../../controllers/authController.js';

export const registerAuthPublicRoutes = (router) => {
  router.post('/auth/login', authController.login);
  router.post('/auth/logout', authController.logout);
};

export const registerAuthRoutes = (router) => {
  router.put('/auth/change-password', authController.changePassword);
  router.get('/auth/me', authController.getCurrentUser);
  router.put('/auth/context', authController.updateContext);
};
