import request from '@/api/request'

/**
 * 获取部门列表（分页）
 */
export const getDepartments = (params) => {
  return request.get('/departments', { params })
}

/**
 * 创建部门
 */
export const createDepartment = (data) => {
  return request.post('/departments', data)
}

/**
 * 更新部门
 */
export const updateDepartment = (id, data) => {
  return request.put(`/departments/${id}`, data)
}

/**
 * 删除部门
 */
export const deleteDepartment = (id) => {
  return request.delete(`/departments/${id}`)
}

export default {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
}

