import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import nodemailer from "nodemailer";
import { MailJob } from "../models/MailJob.js";

export function mailSettings() {
  const key = Buffer.from(process.env.MAIL_ENCRYPTION_KEY || "", "base64");
  if (!process.env.SMTP_HOST || !process.env.SMTP_FROM || !process.env.APP_PUBLIC_URL || key.length !== 32) throw new Error("Email delivery is not configured");
  const origin = new URL(process.env.APP_PUBLIC_URL);
  if (origin.username || origin.password || !["https:", "http:"].includes(origin.protocol) || (process.env.NODE_ENV === "production" && origin.protocol !== "https:")) throw new Error("Invalid public application URL");
  const port = Number(process.env.SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid SMTP port");
  return { key, origin: origin.origin, host: process.env.SMTP_HOST, port, from: process.env.SMTP_FROM };
}

export function encryptMail(payload: object): string {
  const { key } = mailSettings(); const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map(value => value.toString("base64")).join(".");
}

export function decryptMail(payload: string): { to: string; subject: string; text: string } {
  const { key } = mailSettings();
  const [iv, tag, encrypted] = payload.split(".").map(value => Buffer.from(value, "base64"));
  const cipher = createDecipheriv("aes-256-gcm", key, iv); cipher.setAuthTag(tag);
  return JSON.parse(Buffer.concat([cipher.update(encrypted), cipher.final()]).toString("utf8"));
}

export async function deliverMailJob() {
  const settings = mailSettings();
  const now = new Date();
  const job = await MailJob.findOneAndUpdate({ attempts: { $lt: 5 }, deliverBefore: { $gt: now }, $or: [
    { status: "pending", availableAt: { $lte: now } }, { status: "processing", lockedUntil: { $lte: now } },
  ] }, { $set: { status: "processing", lockedUntil: new Date(Date.now() + 120000) }, $inc: { attempts: 1 } }, { new: true }).select("+payload");
  if (!job) return false;
  const insecureLocal = process.env.NODE_ENV !== "production" && process.env.SMTP_ALLOW_INSECURE_LOCAL === "true" && ["127.0.0.1", "localhost", "::1"].includes(settings.host);
  const transport = nodemailer.createTransport({ host: settings.host, port: settings.port, secure: settings.port === 465, requireTLS: !insecureLocal, ignoreTLS: insecureLocal,
    ...(process.env.SMTP_USER ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } } : {}), connectionTimeout: 10000, socketTimeout: 20000,
  });
  try {
    const result = await transport.sendMail({ ...decryptMail(job.payload), from: settings.from, messageId: `<${job.id}@campuscode.local>` });
    if (!result.accepted?.length) throw new Error("Message was not accepted");
    await MailJob.updateOne({ _id: job._id }, { $set: { status: "sent", sentAt: new Date(), payload: "" } });
    return true;
  } catch {
    await MailJob.updateOne({ _id: job._id }, { $set: { status: job.attempts >= 5 ? "failed" : "pending", availableAt: new Date(Date.now() + Math.min(1800000, 30000 * 2 ** job.attempts)) } });
    return false;
  } finally { transport.close(); }
}

export function startMailWorker() {
  try { mailSettings(); } catch { return; }
  let running = false;
  const timer = setInterval(async () => {
    if (running) return; running = true;
    try { await deliverMailJob(); } catch { console.warn("[Mail] Delivery worker unavailable; queued messages will be retried"); }
    finally { running = false; }
  }, 5000);
  timer.unref();
}
