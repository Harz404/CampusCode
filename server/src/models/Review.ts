import mongoose, { Schema, Document } from "mongoose";

export interface IReview extends Document {
  id: string;
  contractId: mongoose.Types.ObjectId;
  reviewerId: mongoose.Types.ObjectId;
  revieweeId: mongoose.Types.ObjectId;
  communication: number;
  quality: number;
  delivery: number;
  professionalism: number;
  overall: number;
  content: string;
  isVerified: boolean;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    contractId: { type: Schema.Types.ObjectId, ref: "Contract", required: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    revieweeId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    communication: { type: Number, default: 5 },
    quality: { type: Number, default: 5 },
    delivery: { type: Number, default: 5 },
    professionalism: { type: Number, default: 5 },
    overall: { type: Number, default: 5 },
    content: { type: String, required: true },
    isVerified: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Review = mongoose.model<IReview>("Review", ReviewSchema);

