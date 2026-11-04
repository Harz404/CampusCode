import { Response } from "express";
import { Notification } from "../models/Notification.js";
import { AuthRequest } from "../middleware/auth.js";

export async function getNotifications(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id || (req.query.userId as string);
    if (!userId) {
      return res.json({ notifications: [] });
    }

    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(30);
    return res.json({ notifications: notifications.map((n) => n.toJSON()) });
  } catch (error) {
    console.error("[Notification GET Error]:", error);
    return res.status(500).json({ error: "Failed to fetch notifications" });
  }
}

export async function markRead(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate({ _id: id, userId: req.user!.id }, { isRead: true });
    if (!notification) return res.status(404).json({ error: "Notification not found" });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Failed to mark notification read" });
  }
}

export async function markAllRead(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id || req.body.userId;
    if (userId) {
      await Notification.updateMany({ userId }, { isRead: true });
    }
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Failed to mark all read" });
  }
}

