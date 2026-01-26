import * as authService from '../modules/core/services/authService.js';

export const login = authService.login;
export const logout = authService.logout;
export const changePassword = authService.changePassword;
export const getCurrentUser = authService.getCurrentUser;
export const updateContext = authService.updateContext;

export default {
  login,
  logout,
  changePassword,
  getCurrentUser,
  updateContext
};
