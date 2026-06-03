import API from "./client";

export const applyToProject = (projectId, message = "") =>
  API.post("/applications", { projectId, message });

export const getMyApplications = (params) =>
  API.get("/applications/sent", { params });

export const getProjectApplications = (projectId, params) =>
  API.get(`/applications/received/${projectId}`, { params });

export const inviteUserToProject = (payload) =>
  API.post("/applications/invite", payload);

export const acceptApplication = (applicationId, projectRole) =>
  API.patch(`/applications/${applicationId}/accept`, { projectRole });

export const rejectApplication = (applicationId, rejectionReason = "") =>
  API.patch(`/applications/${applicationId}/reject`, { rejectionReason });

export const withdrawApplication = (applicationId) =>
  API.patch(`/applications/${applicationId}/withdraw`);

export const respondToInvitation = (applicationId, action) =>
  API.patch(`/applications/${applicationId}/respond`, { action });
