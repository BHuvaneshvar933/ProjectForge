import api from "./auth";
export const login_user = (payload) => api.post("/auth/login", payload);
export const register_user = (payload) => api.post("/auth/register", payload);
export const google_login = (payload) => api.post("/auth/google", payload);
