import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Session } from "../models/Session.js";
import { getJwtSecret } from "../config/security.js";

export interface AuthUserPayload { id: string; email: string; name: string; role: string; }
export interface AuthRequest extends Request { user?: AuthUserPayload; sessionId?: string; }
class InvalidSession extends Error {}

async function authenticate(req: AuthRequest) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw new InvalidSession();
  let decoded;
  try { decoded = jwt.verify(header.slice(7), getJwtSecret(), { algorithms: ["HS256"] }); }
  catch { throw new InvalidSession(); }
  if (typeof decoded === "string" || typeof decoded.id !== "string" || !mongoose.isValidObjectId(decoded.id) || typeof decoded.jti !== "string") throw new InvalidSession();
  const account = await User.findById(decoded.id).select("name email role authVersion");
  if (!account) throw new InvalidSession();
  const session = await Session.findOne({ _id: decoded.jti, userId: account._id || account.id, revokedAt: null, expiresAt: { $gt: new Date() } });
  if (!session || session.authVersion !== (account.authVersion || 0)) throw new InvalidSession();
  req.user = { id: account.id, name: account.name, email: account.email, role: account.role };
  req.sessionId = decoded.jti;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try { await authenticate(req); }
  catch (error) {
    if (error instanceof InvalidSession) return res.status(401).json({ error: "Your session expired or was revoked. Please sign in again." });
    return res.status(503).json({ error: "Could not verify your session. Please retry." });
  }
  next();
}

export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  delete req.user; delete req.sessionId;
  if (req.headers.authorization) {
    try { await authenticate(req); } catch { /* Public browsing remains available. */ }
  }
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  return requireAuth(req, res, () => {
    if (req.user?.role !== "admin") return res.status(403).json({ error: "Forbidden: Admin access required" });
    next();
  });
}
