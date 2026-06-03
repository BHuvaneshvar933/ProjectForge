import API from "./client";

export const getProjectMessages = (projectId, params) =>
  API.get(`/messages/projects/${projectId}`, { params });
