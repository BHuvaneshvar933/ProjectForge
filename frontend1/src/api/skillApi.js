import API from "./client";

export const getAllSkills = () => API.get("/skills");

export const searchSkills = (q) => API.get("/skills/search", { params: { q } });
