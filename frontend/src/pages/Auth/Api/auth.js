import axios from "axios";
const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) ||
  "/api";
const api = axios.create({
    baseURL: API_BASE_URL,
    headers:{"Content-Type":"application/json"}

})
export default api
