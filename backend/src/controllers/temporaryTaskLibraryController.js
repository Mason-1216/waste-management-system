import * as temporaryTaskLibraryService from '../modules/task/services/temporaryTaskLibraryService.js';

export const getTemporaryTaskLibrary = temporaryTaskLibraryService.getTemporaryTaskLibrary;
export const createTemporaryTaskLibrary = temporaryTaskLibraryService.createTemporaryTaskLibrary;
export const batchImportTemporaryTaskLibrary = temporaryTaskLibraryService.batchImportTemporaryTaskLibrary;
export const updateTemporaryTaskLibrary = temporaryTaskLibraryService.updateTemporaryTaskLibrary;
export const deleteTemporaryTaskLibrary = temporaryTaskLibraryService.deleteTemporaryTaskLibrary;

export default {
  getTemporaryTaskLibrary,
  createTemporaryTaskLibrary,
  batchImportTemporaryTaskLibrary,
  updateTemporaryTaskLibrary,
  deleteTemporaryTaskLibrary
};
