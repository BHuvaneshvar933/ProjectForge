import * as notificationService from "../services/notification.service.js";

export const getMyNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.getMyNotifications({
      userId: req.user._id,
      page: req.query?.page,
      limit: req.query?.limit,
      unreadOnly: req.query?.unreadOnly,
    });

    return res.status(200).json({
      success: true,
      message: "Notifications fetched",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const getMyUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getMyUnreadCount({
      userId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (err) {
    next(err);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markNotificationRead({
      userId: req.user._id,
      notificationId: req.params.id,
    });

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: { notification },
    });
  } catch (err) {
    next(err);
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllNotificationsRead({
      userId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
