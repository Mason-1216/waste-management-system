import request from './request';

// 登录
export const login = (data) => {
  return request.post('/auth/login', data);
};

// 退出
export const logout = () => {
  return request.post('/auth/logout');
};

// 修改密码
export const changePassword = (data) => {
  return request.put('/auth/change-password', data);
};

// 获取当前用户信息
export const getCurrentUser = () => {
  return request.get('/auth/me');
};

// 更新上下文
export const updateContext = (data) => {
  return request.put('/auth/context', data);
};
