import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true
});

export const browseProjects = (params) =>
  API.get("/projects/browse", { params });