import express from "express";
import { createTask, getProjectTasks, assignTask, updateTaskStatus, deleteTask,updateTask } from "../controllers/task.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
  "/projects/:projectId/tasks",
  protect,
  createTask
);
router.get(
  "/projects/:projectId/tasks",
  protect,
  getProjectTasks
);

router.patch(
  "/tasks/:taskId/assign",
  protect,
  assignTask
);
router.patch("/tasks/:taskId/status", protect, updateTaskStatus);

router.delete(
  "/tasks/:taskId",
  protect,
  deleteTask
);

router.put(
  "/tasks/:taskId",
  protect,
  updateTask
);

export default router;