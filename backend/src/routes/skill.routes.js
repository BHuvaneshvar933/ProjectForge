import express from "express";
import * as skillController from "../controllers/skill.controller.js";

const router = express.Router();

router.get("/", skillController.getAllSkills);
router.get("/search", skillController.searchSkills);

export default router;