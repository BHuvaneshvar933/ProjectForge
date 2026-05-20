import express from "express";
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getMyUnreadCount,
} from "../controllers/notification.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/me", protect, getMyNotifications);
router.get("/me/unread-count", protect, getMyUnreadCount);
router.patch("/:id/read", protect, markNotificationRead);
router.patch("/me/read-all", protect, markAllNotificationsRead);

export default router;
