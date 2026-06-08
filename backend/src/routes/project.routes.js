import express from "express";
import {
  createProject,
  getProject,
  browseProjects,
  getMyProjects,
  updateProject,
  closeRecruitment,
  archiveProject,
  getProjectTeam,
  getJoinedProjects,
  leaveProject,
  getProjectRecommendations,
  updateArchiveData,
  connectGitHub,
  getGitHubMetrics
} from "../controllers/project.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, createProject);
router.get("/", browseProjects);
router.get("/my", protect, getMyProjects);
router.get("/joined", protect, getJoinedProjects);
router.get("/recommendations", protect, getProjectRecommendations);
router.get("/:id", getProject);
router.put("/:id", protect, updateProject);
router.patch("/:id/close-recruitment", protect, closeRecruitment);
router.patch("/:id/archive", protect, archiveProject);
router.put("/:id/archive-data", protect, updateArchiveData);
router.get("/:id/team", protect, getProjectTeam);
router.post("/:id/github", protect, connectGitHub);
router.get("/:id/github", protect, getGitHubMetrics);
router.patch(
  "/:projectId/leave",
  protect,
  leaveProject
);
export default router;
