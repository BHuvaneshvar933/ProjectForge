import express from "express";
import {
  updateProfile,
  getPublicProfile,
  getMyProfile,
  searchUsers,
} from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/me", protect, getMyProfile);
router.put("/me", protect, updateProfile);
router.get("/search", protect, searchUsers);
router.get("/:id", protect, getPublicProfile);

export default router;
