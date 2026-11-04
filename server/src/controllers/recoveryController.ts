import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { mailSettings } from "../services/mailService.js";
import { queueAccountLink, redeemAccountLink, RecoveryError } from "../services/recoveryService.js";

export async function forgotPassword(req: AuthRequest, res: Response) {
  const started = Date.now();
  try {
    if (typeof req.body.email !== "string" || req.body.email.length > 254) return res.status(400).json({ error: "Enter a valid email address" });
    try { mailSettings(); } catch { return res.status(503).json({ error: "Recovery email is temporarily unavailable. Please try again later." }); }
    const user = await User.findOne({ email: req.body.email.toLowerCase().trim() });
    if (user) await queueAccountLink(user, "reset");
    await new Promise(resolve => setTimeout(resolve, Math.max(0, 300 - (Date.now() - started))));
    return res.json({ success: true, message: "If an account exists for that address, a reset link will be emailed shortly." });
  } catch { return res.status(503).json({ error: "Recovery email is temporarily unavailable. Please try again later." }); }
}

export async function requestVerification(req: AuthRequest, res: Response) {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    if (user.isVerified) return res.json({ success: true, message: "Your email is already verified." });
    await queueAccountLink(user, "verify");
    return res.json({ success: true, message: "Verification email queued. Check your inbox shortly." });
  } catch { return res.status(503).json({ error: "Verification email is temporarily unavailable. Please try again later." }); }
}

export async function resetPassword(req: AuthRequest, res: Response) {
  return redeem(req, res, "reset");
}
export async function verifyEmail(req: AuthRequest, res: Response) {
  return redeem(req, res, "verify");
}
async function redeem(req: AuthRequest, res: Response, purpose: "verify" | "reset") {
  try {
    await redeemAccountLink(req.body.token, purpose, req.body.password);
    return res.json({ success: true });
  } catch (error) {
    if (error instanceof RecoveryError) return res.status(error.status).json({ error: error.message });
    return res.status(503).json({ error: "Could not complete this request. Please retry." });
  }
}
