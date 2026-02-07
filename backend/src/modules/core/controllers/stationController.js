import * as stationService from '../services/stationService.js';

export const getStations = stationService.getStations;
export const getStationById = stationService.getStationById;
export const createStation = stationService.createStation;
export const updateStation = stationService.updateStation;
export const deleteStation = stationService.deleteStation;
export const getStationUsers = stationService.getStationUsers;
export const getAllStations = stationService.getAllStations;

export default {
  getStations,
  getStationById,
  createStation,
  updateStation,
  deleteStation,
  getStationUsers,
  getAllStations
};
