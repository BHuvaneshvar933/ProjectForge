import express from "express";
import * as analyticsController from "../controllers/analytics.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Basic reporting (platform-level)
router.get("/overview", protect, analyticsController.getOverview);

// Per-project summary (member/owner; applications included only for owner)
router.get(
  "/projects/:projectId/summary",
  protect,
  analyticsController.getProjectSummary
);

// SDE-level project analytics (task/team/time + velocity)
router.get(
  "/project/:projectId",
  protect,
  analyticsController.getProjectAnalytics
);

// Optional charts/trends
router.get(
  "/project/:projectId/activity",
  protect,
  analyticsController.getProjectActivity
);

// Optional message analytics
router.get(
  "/project/:projectId/messages",
  protect,
  analyticsController.getProjectMessageAnalytics
);

// User analytics (self-only)
router.get(
  "/user/:userId",
  protect,
  analyticsController.getUserAnalytics
);

// User analytics scoped to a project (recommended)
router.get(
  "/user/:userId/project/:projectId",
  protect,
  analyticsController.getUserProjectAnalytics
);

// Incremental view counter (public)
router.post("/projects/:projectId/view", analyticsController.trackProjectView);

export default router;
