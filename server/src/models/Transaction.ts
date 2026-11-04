import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  id: string;
  type: "payment" | "payout" | "refund" | "commission";
  amount: number;
  status: "pending" | "processing" | "completed" | "failed" | "refunded";
  fromUserId?: mongoose.Types.ObjectId;
  toUserId?: mongoose.Types.ObjectId;
  orderId?: string;
  mode?: "demo";
  requestKey?: string;
  contractId?: mongoose.Types.ObjectId;
  milestoneId?: string;
  description: string;
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    type: { type: String, enum: ["payment", "payout", "refund", "commission"], required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "refunded"],
      default: "completed",
    },
    fromUserId: { type: Schema.Types.ObjectId, ref: "User" },
    toUserId: { type: Schema.Types.ObjectId, ref: "User" },
    orderId: { type: String },
    mode: { type: String, enum: ["demo"] },
    requestKey: { type: String, unique: true, sparse: true },
    contractId: { type: Schema.Types.ObjectId, ref: "Contract" },
    milestoneId: { type: String },
    description: { type: String, required: true },
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

export const Transaction = mongoose.model<ITransaction>("Transaction", TransactionSchema);

