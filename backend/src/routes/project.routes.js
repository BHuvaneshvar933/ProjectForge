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
  leaveProject
} from "../controllers/project.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, createProject);
router.get("/", browseProjects);
router.get("/my", protect, getMyProjects);
router.get("/joined", protect, getJoinedProjects);
router.get("/:id", getProject);
router.put("/:id", protect, updateProject);
router.patch("/:id/close-recruitment", protect, closeRecruitment);
router.patch("/:id/archive", protect, archiveProject);
router.get("/:id/team", getProjectTeam);
router.patch(
  "/:projectId/leave",
  protect,
  leaveProject
);

export default router;