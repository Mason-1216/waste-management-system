import request from './request';

// 获取待审批统计
export const getPendingApprovals = () => {
  return request.get('/approval/pending');
};

// 获取审批列表
export const getApprovalList = (params) => {
  return request.get('/approvals', { params });
};

// 审批通过
export const approveItem = (id, data) => {
  return request.post(`/approvals/${id}/approve`, data);
};

// 审批拒绝
export const rejectItem = (id, data) => {
  return request.post(`/approvals/${id}/reject`, data);
};
