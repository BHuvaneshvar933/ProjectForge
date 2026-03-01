import Notification from "../models/notification.model.js";

export const createNotification = async ({
  userId,
  type,
  title,
  message,
  actionUrl = null
}) => {
  const notification = await Notification.create({
    userId,
    type,
    title,
    message,
    actionUrl
  });

  return notification;
};