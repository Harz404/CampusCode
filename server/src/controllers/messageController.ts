import { Response } from "express";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { AuthRequest } from "../middleware/auth.js";
import mongoose from "mongoose";

export async function getConversations(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id || (req.query.userId as string);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const conversations = await Conversation.find({ participants: userId })
      .sort({ updatedAt: -1 })
      .populate("participants", "name email avatar role");

    // Fetch latest message for each conversation
    const convWithMessages = await Promise.all(
      conversations.map(async (c) => {
        const lastMsg = await Message.findOne({ conversationId: c._id }).sort({ createdAt: -1 });
        const unreadCount = await Message.countDocuments({
          conversationId: c._id,
          senderId: { $ne: userId },
          isRead: false,
        });

        const cJson: any = c.toJSON();
        cJson.lastMessage = lastMsg ? lastMsg.toJSON() : null;
        cJson.unreadCount = unreadCount;
        return cJson;
      })
    );

    return res.json({ conversations: convWithMessages });
  } catch (error) {
    console.error("[Message Conversations Error]:", error);
    return res.status(500).json({ error: "Failed to fetch conversations" });
  }
}

export async function getMessages(req: AuthRequest, res: Response) {
  try {
    const { conversationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate("senderId", "name email avatar");

    return res.json({ messages: messages.map((m) => m.toJSON()) });
  } catch (error) {
    console.error("[Message GET Error]:", error);
    return res.status(500).json({ error: "Failed to fetch messages" });
  }
}

export async function sendMessage(req: AuthRequest, res: Response) {
  try {
    const senderId = req.user?.id || req.body.senderId;
    const { conversationId, content, recipientId, type, attachmentUrl } = req.body;

    if (!senderId || !content) {
      return res.status(400).json({ error: "Sender and content are required" });
    }

    let activeConvId = conversationId;

    if (!activeConvId && recipientId) {
      // Find or create conversation with recipient
      let conv = await Conversation.findOne({
        participants: { $all: [senderId, recipientId] },
      });

      if (!conv) {
        conv = new Conversation({
          participants: [senderId, recipientId],
        });
        await conv.save();
      }
      activeConvId = conv._id;
    }

    if (!activeConvId) {
      return res.status(400).json({ error: "Conversation ID or recipient ID is required" });
    }

    const newMsg = new Message({
      conversationId: activeConvId,
      senderId,
      content: content.trim(),
      type: type || "text",
      attachmentUrl,
      isRead: false,
    });

    await newMsg.save();

    // Update conversation updatedAt
    await Conversation.findByIdAndUpdate(activeConvId, { updatedAt: new Date() });

    return res.status(201).json(newMsg.toJSON());
  } catch (error) {
    console.error("[Message Send Error]:", error);
    return res.status(500).json({ error: "Failed to send message" });
  }
}

export async function markAsRead(req: AuthRequest, res: Response) {
  try {
    const { conversationId } = req.body;
    const userId = req.user?.id;

    if (conversationId && userId) {
      await Message.updateMany(
        { conversationId, senderId: { $ne: userId } },
        { $set: { isRead: true } }
      );
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("[Message Read Error]:", error);
    return res.status(500).json({ error: "Failed to mark messages as read" });
  }
}

