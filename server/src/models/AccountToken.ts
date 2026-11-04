import mongoose, { Schema } from "mongoose";
const schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  purpose: { type: String, enum: ["verify", "reset"], required: true },
  tokenHash: { type: String, required: true, unique: true },
  authVersion: { type: Number, required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
  usedAt: { type: Date, default: null },
}, { timestamps: true });
export const AccountToken = mongoose.model("AccountToken", schema);
