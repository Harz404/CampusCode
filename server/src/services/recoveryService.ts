import { createHash, randomBytes } from "node:crypto";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User, IUser } from "../models/User.js";
import { AccountToken } from "../models/AccountToken.js";
import { MailJob } from "../models/MailJob.js";
import { encryptMail, mailSettings } from "./mailService.js";
import { validateNewPassword } from "./sessionService.js";

export class RecoveryError extends Error { constructor(public status: number, message: string) { super(message); } }
export const tokenHash = (value: string) => createHash("sha256").update(value).digest("hex");

export async function queueAccountLink(user: IUser, purpose: "verify" | "reset") {
  const settings = mailSettings();
  const raw = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + (purpose === "reset" ? 30 : 1440) * 60000);
  // Fragment tokens are not sent in HTTP URLs or Referer headers.
  const link = `${settings.origin}/${purpose === "reset" ? "reset-password" : "verify-email"}#token=${raw}`;
  const payload = encryptMail({ to: user.email, subject: purpose === "reset" ? "Reset your CampusCode password" : "Verify your CampusCode email", text: `${purpose === "reset" ? "Reset your password" : "Verify your email address"} using this one-time link:\n\n${link}\n\nThis link expires ${purpose === "reset" ? "in 30 minutes" : "in 24 hours"}. If you did not request this, ignore this email.` });
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await AccountToken.create([{ userId: user._id, purpose, tokenHash: tokenHash(raw), authVersion: user.authVersion || 0, expiresAt }], { session });
      await MailJob.create([{ payload, deliverBefore: expiresAt, expiresAt: new Date(Date.now() + 172800000) }], { session });
    });
  } finally { await session.endSession(); }
}

export async function redeemAccountLink(raw: unknown, purpose: "verify" | "reset", password?: unknown) {
  if (typeof raw !== "string" || !/^[a-f0-9]{64}$/.test(raw)) throw new RecoveryError(400, "This link is invalid or expired. Request a new link.");
  if (purpose === "reset") { try { validateNewPassword(password); } catch (error) { throw new RecoveryError(400, (error as Error).message); } }
  const hash = purpose === "reset" ? await bcrypt.hash(password as string, 12) : undefined;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const token = await AccountToken.findOneAndUpdate({ tokenHash: tokenHash(raw), purpose, usedAt: null, expiresAt: { $gt: new Date() } }, { $set: { usedAt: new Date() } }, { session, new: true });
      if (!token) throw new RecoveryError(400, "This link is invalid or expired. Request a new link.");
      const user = await User.findById(token.userId).session(session);
      if (!user || (user.authVersion || 0) !== token.authVersion) throw new RecoveryError(400, "This link is invalid or expired. Request a new link.");
      if (purpose === "reset") {
        const updated = await User.updateOne({ _id: user._id, $or: [{ authVersion: token.authVersion }, ...(token.authVersion === 0 ? [{ authVersion: { $exists: false } }] : [])] }, { $set: { password: hash }, $inc: { authVersion: 1 } }, { session });
        if (!updated.matchedCount) throw new RecoveryError(400, "This link is invalid or expired. Request a new link.");
      } else {
        await User.updateOne({ _id: user._id }, { $set: { isVerified: true } }, { session });
      }
      await AccountToken.updateMany({ userId: user._id, purpose, usedAt: null }, { $set: { usedAt: new Date() } }, { session });
    });
  } finally { await session.endSession(); }
}
