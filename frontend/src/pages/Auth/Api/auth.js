import axios from "axios";
const url =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) ||
  "http://localhost:5000/api";
const api = axios.create({
    baseURL:url,
    headers:{"Content-Type":"application/json"}

})
export default api
