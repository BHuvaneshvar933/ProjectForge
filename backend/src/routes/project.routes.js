import express from "express";
import {
  createProject,
  getProject,
  browseProjects,
  getMyProjects,
  updateProject,
  closeRecruitment,
  getProjectTeam,
  getJoinedProjects,
  leaveProject,
  getProjectRecommendations,
  updateArchiveData,
  updatePersonalJourney,
  connectGitHub,
  disconnectGitHub,
  getGitHubMetrics,
  getBasicRepoStats,
  getReleases,
  createRelease,
  updateRelease,
  saveMyReflections,
  removeTeamMember,
  getProjectFiles,
  addProjectFile
} from "../controllers/project.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, createProject);
router.get("/", browseProjects);
router.get("/my", protect, getMyProjects);
router.get("/joined", protect, getJoinedProjects);
router.get("/recommendations", protect, getProjectRecommendations);
router.get("/github-stats", getBasicRepoStats);
router.get("/:id", getProject);
router.put("/:id", protect, updateProject);
router.patch("/:id/close-recruitment", protect, closeRecruitment);
router.put("/:id/archive-data", protect, updateArchiveData);
router.put("/:id/journey/personal", protect, updatePersonalJourney);
router.put("/:id/my-reflections", protect, saveMyReflections);
router.get("/:id/team", protect, getProjectTeam);
router.post("/:id/github", protect, connectGitHub);
router.delete("/:id/github", protect, disconnectGitHub);
router.get("/:id/github", protect, getGitHubMetrics);
router.get("/:id/releases", protect, getReleases);
router.post("/:id/releases", protect, createRelease);
router.patch("/:id/releases/:releaseId", protect, updateRelease);
router.patch(
  "/:projectId/leave",
  protect,
  leaveProject
);
router.delete("/:projectId/team/:userId", protect, removeTeamMember);
router.get("/:id/files", protect, getProjectFiles);
router.post("/:id/files", protect, addProjectFile);
export default router;
