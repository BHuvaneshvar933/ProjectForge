import API from "./client";

export const generateAIContent = async (type, projectData) => {
  return await API.post("/ai/generate", { type, projectData });
};
