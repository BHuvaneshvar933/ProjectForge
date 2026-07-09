import express from "express";
import { getConversations, getMessages, sendDirectMessage } from "../controllers/directMessage.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/conversations", getConversations);
router.get("/", getMessages);
router.post("/", sendDirectMessage);

export default router;
