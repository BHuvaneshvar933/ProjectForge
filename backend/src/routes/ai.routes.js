import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import * as aiService from "../services/ai.service.js";

const router = express.Router();

router.post("/generate", protect, async (req, res) => {
  try {
    const { type, projectData } = req.body;

    if (!projectData) {
      return res.status(400).json({ success: false, message: "Project data is required" });
    }

    let result = "";

    if (type === "resume") {
      result = await aiService.generateResumeBullet(projectData);
    } else if (type === "interview") {
      result = await aiService.generateInterviewStory(projectData);
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
