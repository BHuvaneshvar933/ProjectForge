import API from "./client";

export const getProjectMessages = (projectId, params) =>
  API.get(`/messages/projects/${projectId}`, { params });

export const startConversation = (data) => API.post("/direct-messages/conversations/start", data);

export const getConversations = () => API.get("/direct-messages/conversations");

export const getDirectMessages = (conversationId) => API.get(`/direct-messages/conversations/${conversationId}`);

export const sendDirectMessage = (conversationId, data) => API.post(`/direct-messages/conversations/${conversationId}/message`, data);

export const markMessageSeen = (messageId) => API.patch(`/direct-messages/messages/${messageId}/seen`);
