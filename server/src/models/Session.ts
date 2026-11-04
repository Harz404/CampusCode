import { randomUUID } from "node:crypto";
import mongoose, { Schema } from "mongoose";

const SessionSchema = new Schema({
  _id: { type: String, default: randomUUID },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  authVersion: { type: Number, required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
  revokedAt: { type: Date, default: null },
}, { timestamps: true });
export const Session = mongoose.model("Session", SessionSchema);
