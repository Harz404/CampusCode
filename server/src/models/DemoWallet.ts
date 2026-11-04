import mongoose, { Schema } from "mongoose";
export const DemoWallet = mongoose.model("DemoWallet", new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  balance: { type: Number, default: 0, min: 0 }, // Integer paise; never real funds.
}, { timestamps: true }));
