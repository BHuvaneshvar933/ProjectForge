import api from "./auth";
export const login_user = (payload) => api.post("/auth/login", payload);
export const register_user = (payload) => api.post("/auth/register", payload);
export const google_login = (payload) => api.post("/auth/google", payload);
export const forgot_password = (payload) => api.post("/auth/forgot-password", payload);
export const reset_password = (token, payload) => api.post(`/auth/reset-password/${token}`, payload);
