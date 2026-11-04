import mongoose, { Schema, Document } from "mongoose";

export interface IOrder extends Document {
  id: string;
  productId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  amount: number;
  status: "pending" | "completed" | "refunded" | "disputed" | "failed" | "cancelled";
  paymentId?: string;
  mode?: "demo";
  requestKey?: string;
  entitlementKey?: string;
  productName?: string;
  currency?: string;
  license?: string;
  licenseKey?: string;
  platformFee?: number;
  sellerEarnings?: number;
  delivery?: Record<string, unknown>;
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
      enum: ["pending", "completed", "refunded", "disputed", "failed", "cancelled"],
      default: "pending",
    },
    paymentId: { type: String },
    mode: { type: String, enum: ["demo"] },
    requestKey: { type: String, unique: true, sparse: true },
    entitlementKey: { type: String, unique: true, sparse: true },
    productName: { type: String },
    currency: { type: String, default: "INR" },
    license: { type: String },
    licenseKey: { type: String },
    platformFee: { type: Number },
    sellerEarnings: { type: Number },
    delivery: { type: Schema.Types.Mixed, select: false },
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

