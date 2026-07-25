import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import * as aiService from "../services/ai.service.js";
import Project from "../models/project.model.js";
import Task from "../models/task.model.js";
import Team from "../models/team.model.js";

const router = express.Router();

router.post("/generate", protect, async (req, res) => {
  try {
    const { type, projectData } = req.body;

    if (!projectData && type !== "health-score" && type !== "weekly-summary") {
      return res.status(400).json({ success: false, message: "Project data is required" });
    }

    let result = "";

    if (type === "resume") {
      result = await aiService.generateResumeBullet(projectData);
    } else if (type === "interview") {
      result = await aiService.generateInterviewStory(projectData);
    } else if (type === "career-assets") {
      result = await aiService.generateCareerAssets(projectData, req.body.projectId, req.user._id);
    } else if (type === "health-score" || type === "weekly-summary") {
      if (!req.body.projectId) {
        return res.status(400).json({ success: false, message: "Project ID is required" });
      }
      const project = await Project.findById(req.body.projectId);
      if (!project) return res.status(404).json({ success: false, message: "Project not found" });

      const tasks = await Task.find({ projectId: project._id, isDeleted: false });
      const team = await Team.find({ projectId: project._id, status: "active", isDeleted: false });

      if (type === "health-score") {
        result = await aiService.generateProjectHealthScore(project._id, project, tasks, team);
      } else {
        result = await aiService.generateWeeklyProjectSummary(project._id, project, tasks, team);
      }
    } else {
      return res.status(400).json({ success: false, message: "Invalid generation type" });
    }

    res.status(200).json({
      success: true,
      data: { result },
    });
  } catch (error) {
    console.error("AI Generation error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate AI content",
    });
  }
});

export default router;
