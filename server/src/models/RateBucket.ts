import mongoose, { Schema } from "mongoose";
export const RateBucket = mongoose.model("RateBucket", new Schema({
  _id: String, count: { type: Number, default: 0 }, expiresAt: { type: Date, required: true, expires: 0 },
}));
