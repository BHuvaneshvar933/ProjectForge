import API from "./client";

export const browseProjects = (params) =>
  API.get("/projects/", { params });

// Get project by ID
export const getProjectById = (id) =>
  API.get(`/projects/${id}`);

// Get my projects (owned)
export const getMyProjects = () =>
  API.get("/projects/my");

// Get joined projects
export const getJoinedProjects = () =>
  API.get("/projects/joined");

// Create project
export const createProject = (data) =>
  API.post("/projects", data);

// Update project
export const updateProject = (id, data) =>
  API.put(`/projects/${id}`, data);

// Get project team
export const getProjectTeam = (id) =>
  API.get(`/projects/${id}/team`);

// Update archive data
export const updateArchiveData = (id, data) =>
  API.put(`/projects/${id}/archive-data`, data);

export const saveMyReflections = (id, data) =>
  API.put(`/projects/${id}/my-reflections`, data);

// GitHub Integration
export const connectGitHub = (id, data) =>
  API.post(`/projects/${id}/github`, data);

export const disconnectGitHub = (id) =>
  API.delete(`/projects/${id}/github`);

export const getGitHubMetrics = (id) =>
  API.get(`/projects/${id}/github`);

export const getBasicRepoStats = (url) =>
  API.get(`/projects/github-stats`, { params: { url } });

export const getProjectReleases = (id) =>
  API.get(`/projects/${id}/releases`);

export const createProjectRelease = (id, data) =>
  API.post(`/projects/${id}/releases`, data);

export const leaveProject = (projectId) => API.patch(`/projects/${projectId}/leave`);
export const removeTeamMember = (projectId, userId) => API.delete(`/projects/${projectId}/team/${userId}`);
