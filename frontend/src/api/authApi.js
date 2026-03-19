import API from "./client";

export const getCurrentUser = () => API.get("/auth/me");
