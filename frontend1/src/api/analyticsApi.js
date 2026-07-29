import API from "./client";

export const getProjectSummary = (projectId) =>
  API.get(`/analytics/projects/${projectId}/summary`);

export const getProjectAnalytics = (projectId, params) =>
  API.get(`/analytics/project/${projectId}`, { params });
