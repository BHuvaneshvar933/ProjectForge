import API from "./client";

export const applyToProject = (projectId, message = "") =>
  API.post("/applications", { projectId, message });

export const getMyApplications = (params) =>
  API.get("/applications/sent", { params });
