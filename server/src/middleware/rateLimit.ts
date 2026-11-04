import { createHash } from "node:crypto";
import { Request, Response, NextFunction } from "express";
import { RateBucket } from "../models/RateBucket.js";

export function rateLimit(name: string, limit: number, windowMs = 600000) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now(), bucket = Math.floor(now / windowMs);
    const key = createHash("sha256").update(`${name}:${req.ip || req.socket.remoteAddress}:${bucket}`).digest("hex");
    try {
      const result = await RateBucket.findOneAndUpdate({ _id: key }, { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((bucket + 2) * windowMs) } }, { upsert: true, new: true });
      if (result.count > limit) { res.setHeader("Retry-After", Math.ceil(((bucket + 1) * windowMs - now) / 1000)); return res.status(429).json({ error: "Too many attempts. Please try again later." }); }
      next();
    } catch { return res.status(503).json({ error: "Account service unavailable. Please retry." }); }
  };
}
