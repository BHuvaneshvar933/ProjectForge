import API from "./client";

export const getProjectMessages = (projectId, params) =>
  API.get(`/messages/projects/${projectId}`, { params });

export const getConversations = () => API.get("/direct-messages/conversations");

export const getDirectMessages = (params) => API.get("/direct-messages", { params });

export const sendDirectMessage = (data) => API.post("/direct-messages", data);
