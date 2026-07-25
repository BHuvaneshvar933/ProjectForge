import express from "express";
import * as directMessageController from "../controllers/directMessage.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/conversations/start", protect, directMessageController.startConversation);
router.get("/conversations", protect, directMessageController.getConversations);
router.get("/conversations/:id", protect, directMessageController.getMessages);
router.post("/conversations/:id/message", protect, directMessageController.sendDirectMessage);
router.patch("/messages/:id/seen", protect, directMessageController.markMessageSeen);

export default router;
