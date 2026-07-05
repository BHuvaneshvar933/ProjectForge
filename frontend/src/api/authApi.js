import API from "./client";

export const getCurrentUser = () => API.get("/auth/me");
export const loginWithGoogle = (token) => API.post("/auth/google", { token });
