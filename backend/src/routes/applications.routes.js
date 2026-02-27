import express from "express";
import * as applicationController from "../controllers/applications.controller.js";
import {protect} from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, applicationController.applyToProject);

export default router;