import API from "./client";

export const getProjectRecommendations = (params) =>
  API.get("/projects/recommendations", { params });
