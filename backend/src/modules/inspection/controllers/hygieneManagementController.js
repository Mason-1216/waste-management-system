import * as hygieneManagementService from '../services/hygieneManagementService.js';

export const getHygieneAreas = hygieneManagementService.getHygieneAreas;
export const createHygieneArea = hygieneManagementService.createHygieneArea;
export const updateHygieneArea = hygieneManagementService.updateHygieneArea;
export const deleteHygieneArea = hygieneManagementService.deleteHygieneArea;
export const getHygienePoints = hygieneManagementService.getHygienePoints;
export const createHygienePoint = hygieneManagementService.createHygienePoint;
export const updateHygienePoint = hygieneManagementService.updateHygienePoint;
export const deleteHygienePoint = hygieneManagementService.deleteHygienePoint;
export const getHygienePositionAreas = hygieneManagementService.getHygienePositionAreas;
export const createHygienePositionArea = hygieneManagementService.createHygienePositionArea;
export const deleteHygienePositionArea = hygieneManagementService.deleteHygienePositionArea;
export const getHygieneAreasByPosition = hygieneManagementService.getHygieneAreasByPosition;

export default {
  getHygieneAreas,
  createHygieneArea,
  updateHygieneArea,
  deleteHygieneArea,
  getHygienePoints,
  createHygienePoint,
  updateHygienePoint,
  deleteHygienePoint,
  getHygienePositionAreas,
  createHygienePositionArea,
  deleteHygienePositionArea,
  getHygieneAreasByPosition
};
