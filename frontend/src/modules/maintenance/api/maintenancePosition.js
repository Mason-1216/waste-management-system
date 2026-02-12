import request from '@/utils/request';

// 岗位-保养计划分配
export function getMaintenancePositionPlans(params) {
  return request.get('/maintenance-position-plans', { params });
}

export function createMaintenancePositionPlan(data) {
  return request.post('/maintenance-position-plans', data);
}

export function batchImportMaintenancePositionPlans(data) {
  return request.post('/maintenance-position-plans/batch-import', data);
}

export function previewBatchImportMaintenancePositionPlans(data) {
  return request.post('/maintenance-position-plans/batch-import-preview', data);
}

export function deleteMaintenancePositionPlan(id) {
  return request.delete(`/maintenance-position-plans/${id}`);
}

// 保养工作记录
export function getMaintenanceWorkRecords(params) {
  return request.get('/maintenance-work-records', { params });
}

export function getTodayMaintenanceTasks() {
  return request.get('/maintenance-work-records/today-tasks');
}

export function getMaintenanceWorkRecordDetail(id) {
  return request.get(`/maintenance-work-records/${id}`);
}

export function submitMaintenanceWorkRecord(data) {
  return request.post('/maintenance-work-records', data);
}
