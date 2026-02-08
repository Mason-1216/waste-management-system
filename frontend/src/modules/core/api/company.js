import request from '@/api/request'

/**
 * 获取公司列表（分页）
 */
export const getCompanies = (params) => {
  return request.get('/companies', { params })
}

/**
 * 获取所有公司（不分页）
 */
export const getAllCompanies = () => {
  return request.get('/companies/all')
}

/**
 * 创建公司
 */
export const createCompany = (data) => {
  return request.post('/companies', data)
}

/**
 * 更新公司
 */
export const updateCompany = (id, data) => {
  return request.put(`/companies/${id}`, data)
}

/**
 * 删除公司
 */
export const deleteCompany = (id) => {
  return request.delete(`/companies/${id}`)
}

export default {
  getCompanies,
  getAllCompanies,
  createCompany,
  updateCompany,
  deleteCompany
}

