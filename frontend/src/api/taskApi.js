import API from "./client";

export const getProjectTasks = (projectId, params) =>
  API.get(`/projects/${projectId}/tasks`, { params });

export const createTask = (projectId, payload) =>
  API.post(`/projects/${projectId}/tasks`, payload);

export const updateTaskStatus = (taskId, status) =>
  API.patch(`/tasks/${taskId}/status`, { status });

export const assignTask = (taskId, assignedTo) =>
  API.patch(`/tasks/${taskId}/assign`, { assignedTo });

export const updateTask = (taskId, payload) =>
  API.put(`/tasks/${taskId}`, payload);

export const bulkUpdateTasks = (projectId, data) =>
  API.patch(`/projects/${projectId}/tasks/bulk`, data);

export const deleteTask = (taskId) =>
  API.delete(`/tasks/${taskId}`);
