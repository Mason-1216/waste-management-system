import * as priceService from '../modules/equipment/services/priceService.js';

export const getPrices = priceService.getPrices;
export const getAllPrices = priceService.getAllPrices;
export const getPriceCategories = priceService.getPriceCategories;
export const createPrice = priceService.createPrice;
export const updatePrice = priceService.updatePrice;
export const deletePrice = priceService.deletePrice;

export default {
  getPrices,
  getAllPrices,
  getPriceCategories,
  createPrice,
  updatePrice,
  deletePrice
};
