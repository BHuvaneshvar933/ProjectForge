import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true
});

// Browse public projects
export const browseProjects = (params) =>
  API.get("/projects/browse", { params });

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

// Archive project
export const archiveProject = (id) =>
  API.delete(`/projects/${id}`);

// Get project team
export const getProjectTeam = (id) =>
  API.get(`/projects/${id}/team`);