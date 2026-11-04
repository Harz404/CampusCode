import mongoose, { Schema } from "mongoose";
const schema = new Schema({
  payload: { type: String, required: true, select: false },
  status: { type: String, enum: ["pending", "processing", "sent", "failed"], default: "pending" },
  attempts: { type: Number, default: 0 },
  availableAt: { type: Date, default: Date.now },
  lockedUntil: { type: Date },
  deliverBefore: { type: Date, required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
  sentAt: { type: Date },
}, { timestamps: true });
schema.index({ status: 1, availableAt: 1 });
export const MailJob = mongoose.model("MailJob", schema);
