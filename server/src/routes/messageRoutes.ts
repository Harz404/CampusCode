import { Router } from "express";
import {
  createConversation,
  editMessage,
  deleteMessage,
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
} from "../controllers/messageController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/conversations", requireAuth, createConversation);
router.patch("/:messageId", requireAuth, editMessage);
router.delete("/:messageId", requireAuth, deleteMessage);
router.get("/conversations", requireAuth, getConversations);
router.get("/:conversationId", requireAuth, getMessages);
router.post("/", requireAuth, sendMessage);
router.post("/read", requireAuth, markAsRead);

export default router;

