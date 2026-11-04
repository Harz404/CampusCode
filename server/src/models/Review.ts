import mongoose, { Schema } from "mongoose";

const ReviewSchema = new Schema({
  contractId: { type: Schema.Types.ObjectId, ref: "Contract", required: true },
  reviewerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  revieweeId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  communication: { type: Number, min: 1, max: 5, required: true },
  quality: { type: Number, min: 1, max: 5, required: true },
  delivery: { type: Number, min: 1, max: 5, required: true },
  professionalism: { type: Number, min: 1, max: 5, required: true },
  overall: { type: Number, min: 1, max: 5, required: true },
  content: { type: String, required: true, maxlength: 5000 },
  isVerified: { type: Boolean, default: true },
}, {
  timestamps: true,
  toJSON: { virtuals: true, transform(_doc, result: any) { result.id = String(result._id); delete result._id; delete result.__v; return result; } },
});
ReviewSchema.index({ contractId: 1, reviewerId: 1 }, { unique: true });
ReviewSchema.index({ revieweeId: 1, createdAt: -1 });
export const Review = mongoose.model("Review", ReviewSchema);
