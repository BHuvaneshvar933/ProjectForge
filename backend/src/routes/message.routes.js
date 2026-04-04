import express from "express";
import * as messageController from "../controllers/message.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/projects/:projectId", protect, messageController.getProjectMessages);

export default router;
