import request from '@/api/request'

// 隐患类别
export const getHazardCategories = (params) => request.get('/hazard-categories', { params })
export const createHazardCategory = (data) => request.post('/hazard-categories', data)
export const updateHazardCategory = (id, data) => request.put(`/hazard-categories/${id}`, data)
export const deleteHazardCategory = (id) => request.delete(`/hazard-categories/${id}`)

// 根本原因
export const getHazardRootCauses = (params) => request.get('/hazard-root-causes', { params })
export const createHazardRootCause = (data) => request.post('/hazard-root-causes', data)
export const updateHazardRootCause = (id, data) => request.put(`/hazard-root-causes/${id}`, data)
export const deleteHazardRootCause = (id) => request.delete(`/hazard-root-causes/${id}`)
