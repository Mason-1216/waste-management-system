import * as userService from '../modules/core/services/userService.js';

export const getUsers = userService.getUsers;
export const getUserRealNameSuggestions = userService.getUserRealNameSuggestions;
export const getUserCompanyNameSuggestions = userService.getUserCompanyNameSuggestions;
export const getUserById = userService.getUserById;
export const createUser = userService.createUser;
export const updateUser = userService.updateUser;
export const deleteUser = userService.deleteUser;
export const batchImportUsers = userService.batchImportUsers;
export const resetPassword = userService.resetPassword;
export const bindUserStations = userService.bindUserStations;

export default {
  getUsers,
  getUserRealNameSuggestions,
  getUserCompanyNameSuggestions,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  batchImportUsers,
  resetPassword,
  bindUserStations
};
