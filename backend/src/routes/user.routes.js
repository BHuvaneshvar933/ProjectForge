import express from "express";
import {
  updateProfile,
  getPublicProfile,
} from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.put("/me", protect, updateProfile);
router.get("/:id", protect, getPublicProfile);

export default router;