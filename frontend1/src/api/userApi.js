import API from "./client";

export const getMyProfile = () => API.get("/users/me");

export const updateMyProfile = (payload) => API.put("/users/me", payload);

export const getPublicUserProfile = (userId) => API.get(`/users/${userId}`);

export const searchUsers = (params) => API.get("/users/search", { params });

export const endorseUser = (userId, payload) => API.post(`/users/${userId}/endorse`, payload);
