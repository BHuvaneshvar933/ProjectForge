import API from "./client";

export const getMyNotifications = (params) =>
  API.get("/notifications/me", { params });

export const getMyUnreadCount = () => API.get("/notifications/me/unread-count");

export const markNotificationRead = (id) =>
  API.patch(`/notifications/${id}/read`);

export const markAllNotificationsRead = () =>
  API.patch("/notifications/me/read-all");
