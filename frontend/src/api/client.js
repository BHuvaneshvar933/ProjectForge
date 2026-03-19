import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

API.interceptors.request.use((config) => {
  try {
    const token =
      window?.localStorage?.getItem("token") ||
      window?.localStorage?.getItem("pf_token") ||
      window?.localStorage?.getItem("projectforge_token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore
  }

  return config;
});

export default API;
