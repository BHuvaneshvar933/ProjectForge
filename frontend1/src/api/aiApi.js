import API from "./client";

export const generateAIContent = async (type, projectData, projectId) => {
  return await API.post("/ai/generate", { type, projectData, projectId });
};
