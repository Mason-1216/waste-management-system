import * as companyService from '../services/companyService.js';

export const getCompanies = companyService.getCompanies;
export const getAllCompanies = companyService.getAllCompanies;
export const createCompany = companyService.createCompany;
export const updateCompany = companyService.updateCompany;
export const deleteCompany = companyService.deleteCompany;

export default {
  getCompanies,
  getAllCompanies,
  createCompany,
  updateCompany,
  deleteCompany
};
