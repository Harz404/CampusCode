import { Router } from "express";
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
} from "../controllers/messageController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/conversations", requireAuth, getConversations);
router.get("/:conversationId", requireAuth, getMessages);
router.post("/", requireAuth, sendMessage);
router.post("/read", requireAuth, markAsRead);

export default router;

