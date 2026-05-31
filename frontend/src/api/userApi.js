import API from "./client";

export const getMyProfile = () => API.get("/users/me");

export const updateMyProfile = (payload) => API.put("/users/me", payload);
