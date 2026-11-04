import { ChatError, directConversation, messageContent } from "../services/conversationService.js";
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
        const lastMsg = await Message.findOne({ conversationId: c._id, deletedAt: null }).sort({ createdAt: -1 });
        const unreadCount = await Message.countDocuments({
          conversationId: c._id,
          senderId: { $ne: userId },
          isRead: false,
          deletedAt: null,
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

    if (!await Conversation.exists({ _id: conversationId, participants: req.user!.id })) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    const messages = await Message.find({ conversationId, deletedAt: null })
      .sort({ createdAt: 1 })
      .populate("senderId", "name email avatar");

    return res.json({ messages: messages.map((m) => messageDto(m)) });
  } catch (error) {
    console.error("[Message GET Error]:", error);
    return res.status(500).json({ error: "Failed to fetch messages" });
  }
}

export async function sendMessage(req: AuthRequest, res: Response) {
  try {
    const senderId = req.user?.id || req.body.senderId;
    const { conversationId, content, recipientId, type, attachmentUrl, clientMessageId } = req.body;

    const cleanContent = messageContent(content);
    if (type && String(type).toLowerCase() !== "text" || attachmentUrl) throw new ChatError(400, "Attachments are not available yet");
    if (conversationId && (!mongoose.isValidObjectId(conversationId) || !await Conversation.exists({ _id: conversationId, participants: senderId }))) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    const activeConvId = conversationId || (await directConversation(senderId!, recipientId))!._id;
    if (clientMessageId !== undefined && (typeof clientMessageId !== "string" || !/^[a-zA-Z0-9-]{16,80}$/.test(clientMessageId))) throw new ChatError(400, "Invalid message request identifier");
    const payload = {
      conversationId: activeConvId, senderId, content: cleanContent, type: "text", isRead: false,
      ...(clientMessageId ? { clientMessageId } : {}),
    };
    if (clientMessageId) {
      await Message.init();
      let saved;
      try {
        saved = await Message.findOneAndUpdate({ senderId, clientMessageId }, { $setOnInsert: payload }, { upsert: true, new: true, runValidators: true });
      } catch (error) {
        if ((error as { code?: number }).code !== 11000) throw error;
        saved = await Message.findOne({ senderId, clientMessageId });
      }
      if (!saved || String(saved.conversationId) !== String(activeConvId) || saved.content !== cleanContent || saved.deletedAt) throw new ChatError(409, "Message identifier has already been used");
      await Conversation.findByIdAndUpdate(activeConvId, { $max: { updatedAt: saved.createdAt } }, { timestamps: false });
      return res.status(201).json(messageDto(saved));
    }
    const newMsg = new Message({
      conversationId: activeConvId,
      senderId,
      content: cleanContent,
      type: "text",
      attachmentUrl,
      isRead: false,
    });

    await newMsg.save();

    // Update conversation updatedAt
    await Conversation.findByIdAndUpdate(activeConvId, { updatedAt: new Date() });

    return res.status(201).json(messageDto(newMsg));
  } catch (error) {
    if (error instanceof ChatError) return res.status(error.status).json({ error: error.message });
    console.error("[Message Send Error]:", error);
    return res.status(500).json({ error: "Failed to send message" });
  }
}

export async function markAsRead(req: AuthRequest, res: Response) {
  try {
    const { conversationId } = req.body;
    const userId = req.user?.id;

    if (!mongoose.isValidObjectId(conversationId) || !await Conversation.exists({ _id: conversationId, participants: userId })) {
      return res.status(404).json({ error: "Conversation not found" });
    }
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


export async function createConversation(req: AuthRequest, res: Response) {
  try {
    const conversation = await directConversation(req.user!.id, req.body.participantId || req.body.recipientId);
    return res.json({ conversation: conversation!.toJSON() });
  } catch (error) {
    if (error instanceof ChatError) return res.status(error.status).json({ error: error.message });
    return res.status(500).json({ error: "Could not create conversation" });
  }
}

function messageDto(message: any) {
  const data = message.toJSON();
  if (data.senderId && typeof data.senderId === "object" && data.senderId.name) {
    data.sender = data.senderId;
    data.senderId = data.sender.id || String(data.sender._id);
  }
  data.type = String(data.type).toUpperCase();
  return data;
}

export async function editMessage(req: AuthRequest, res: Response) {
  return mutateOwnMessage(req, res, false);
}
export async function deleteMessage(req: AuthRequest, res: Response) {
  return mutateOwnMessage(req, res, true);
}
async function mutateOwnMessage(req: AuthRequest, res: Response, deleting: boolean) {
  try {
    const id = req.params.messageId;
    if (!mongoose.isValidObjectId(id)) return res.status(404).json({ error: "Message not found" });
    const message = await Message.findOne({ _id: id, senderId: req.user!.id, deletedAt: null });
    if (!message || !await Conversation.exists({ _id: message.conversationId, participants: req.user!.id })) {
      return res.status(404).json({ error: "Message not found" });
    }
    const update = deleting ? { deletedAt: new Date(), content: "", attachmentUrl: null } : { content: messageContent(req.body.content), editedAt: new Date() };
    const saved = await Message.findOneAndUpdate({ _id: id, senderId: req.user!.id, deletedAt: null }, { $set: update }, { new: true });
    if (!saved) return res.status(409).json({ error: "Message changed; refresh and retry" });
    return res.json(deleting ? { success: true } : messageDto(saved));
  } catch (error) {
    if (error instanceof ChatError) return res.status(error.status).json({ error: error.message });
    return res.status(500).json({ error: "Could not update message" });
  }
}
