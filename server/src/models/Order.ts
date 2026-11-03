import mongoose, { Schema, Document } from "mongoose";

export interface IOrder extends Document {
  id: string;
  productId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  amount: number;
  status: "pending" | "completed" | "refunded" | "disputed";
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "completed", "refunded", "disputed"],
      default: "completed",
    },
    paymentId: { type: String },
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

export const Order = mongoose.model<IOrder>("Order", OrderSchema);

