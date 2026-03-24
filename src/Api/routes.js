import { data } from "react-router-dom";
import api from "./auth";
export const login_user = (data) => {
    return api.post("/auth/login",data);
}
export const register_user = (data) => {
    return api.post("/auth/register",data);
}
