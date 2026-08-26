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

export const updatePersonalJourney = (id, data) =>
  API.put(`/projects/${id}/journey/personal`, data);

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

export const getProjectFiles = (projectId) => API.get(`/projects/${projectId}/files`);
export const addProjectFile = (projectId, payload) => API.post(`/projects/${projectId}/files`, payload);
export const getEngineeringAssessment = (projectId) => API.get(`/projects/${projectId}/engineering-assessment`);

export const getProjectReleases = (projectId) =>
  API.get(`/projects/${projectId}/releases`);

export const createProjectRelease = (projectId, payload) =>
  API.post(`/projects/${projectId}/releases`, payload);

export const updateProjectRelease = (projectId, releaseId, payload) =>
  API.patch(`/projects/${projectId}/releases/${releaseId}`, payload);

export const leaveProject = (projectId) => API.patch(`/projects/${projectId}/leave`);
export const removeTeamMember = (projectId, userId) => API.delete(`/projects/${projectId}/team/${userId}`);
