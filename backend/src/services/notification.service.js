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

export const getMyNotifications = async ({ userId, page, limit, unreadOnly }) => {
  const pageNum = Number.isFinite(Number(page)) ? Math.max(1, Number(page)) : 1;
  const limitNum = Number.isFinite(Number(limit))
    ? Math.min(50, Math.max(1, Number(limit)))
    : 10;

  const filter = {
    userId,
    isDeleted: false,
  };

  if (unreadOnly === "true" || unreadOnly === true) {
    filter.isRead = false;
  }

  const skip = (pageNum - 1) * limitNum;

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId, isDeleted: false, isRead: false }),
  ]);

  return {
    notifications: items,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum) || 1,
    },
    unreadCount,
  };
};

export const getMyUnreadCount = async ({ userId }) => {
  return await Notification.countDocuments({
    userId,
    isDeleted: false,
    isRead: false,
  });
};

export const markNotificationRead = async ({ userId, notificationId }) => {
  const notification = await Notification.findOne({
    _id: notificationId,
    userId,
    isDeleted: false,
  });

  if (!notification) {
    throw new Error("Notification not found");
  }

  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
  }

  return notification;
};

export const markAllNotificationsRead = async ({ userId }) => {
  const now = new Date();
  const result = await Notification.updateMany(
    {
      userId,
      isDeleted: false,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: now,
      },
    }
  );

  return { modifiedCount: result.modifiedCount ?? result.nModified ?? 0 };
};
