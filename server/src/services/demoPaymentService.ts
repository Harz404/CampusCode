import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { Transaction } from "../models/Transaction.js";
import { DemoWallet } from "../models/DemoWallet.js";
import { sameId } from "../middleware/access.js";

export class DemoPaymentError extends Error { constructor(public status: number, message: string) { super(message); } }
function requestKey(actor: string, body: Record<string, unknown>) {
  if (body.demo !== true) throw new DemoPaymentError(400, "Confirm that this is a simulated payment");
  if (typeof body.requestId !== "string" || !/^[\w-]{16,80}$/.test(body.requestId)) throw new DemoPaymentError(400, "A valid payment request identifier is required");
  return `${actor}:${body.requestId}`;
}

export async function demoCheckout(actor: string, body: Record<string, unknown>, attempt = 0): Promise<InstanceType<typeof Order> | undefined> {
  const key = requestKey(actor, body);
  if (typeof body.productId !== "string" || !mongoose.isValidObjectId(body.productId)) throw new DemoPaymentError(404, "Product not found");
  const outcome = body.outcome || "success";
  if (!["success", "failed", "cancelled"].includes(outcome as string)) throw new DemoPaymentError(400, "Invalid demo payment outcome");
  await Promise.all([Order.init(), DemoWallet.init(), Transaction.init()]);
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const previous = await Order.findOne({ requestKey: key, buyerId: actor, mode: "demo" }).session(session);
      if (previous) {
        if (!sameId(previous.productId, body.productId)) throw new DemoPaymentError(409, "Payment identifier already used");
        return previous;
      }
      const acquired = await Order.findOne({ buyerId: actor, productId: body.productId, mode: "demo", status: "completed" }).session(session);
      if (acquired) return acquired;
      const product = await Product.findOne({ _id: body.productId, status: "published", moderationVerified: true }).session(session);
      if (!product) throw new DemoPaymentError(404, "Published product not found");
      if (sameId(product.sellerId, actor)) throw new DemoPaymentError(400, "You cannot buy your own listing");
      const amountPaise = Math.round((product.isFree ? 0 : product.price) * 100);
      if (!Number.isSafeInteger(amountPaise) || amountPaise < 0) throw new DemoPaymentError(400, "Invalid product price");
      const completed = outcome === "success";
      const fee = Math.round(amountPaise * 0.1), earnings = amountPaise - fee;
      const [order] = await Order.create([{
        productId: product._id, buyerId: actor, amount: amountPaise / 100, mode: "demo", requestKey: key,
        ...(completed ? { entitlementKey: `${actor}:${product.id}`, licenseKey: `DEMO-${randomUUID().toUpperCase()}` } : {}),
        status: completed ? "completed" : outcome, productName: product.name, license: product.license,
        platformFee: fee / 100, sellerEarnings: earnings / 100, paymentId: `demo_${randomUUID()}`,
        delivery: { githubUrl: product.githubUrl, driveUrl: product.driveUrl, downloadUrl: product.downloadUrl, documentation: product.documentation, installation: product.installation },
      }], { session });
      if (completed) {
        await Product.updateOne({ _id: product._id }, { $inc: { salesCount: 1 } }, { session });
        await DemoWallet.findOneAndUpdate({ userId: product.sellerId }, { $inc: { balance: earnings } }, { upsert: true, new: true, session });
        await Transaction.create([{ mode: "demo", type: "payment", amount: earnings / 100, status: "completed", fromUserId: actor, toUserId: product.sellerId, orderId: order.id, description: `Demo sale: ${product.name} (after 10% demo fee)` }], { session });
      }
      return order;
    });
  } catch (error: any) {
    if (error.code === 11000) {
      const previous = await Order.findOne({ buyerId: actor, requestKey: key, mode: "demo" });
      if (previous && !sameId(previous.productId, body.productId)) throw new DemoPaymentError(409, "Payment identifier already used");
      const acquired = previous || await Order.findOne({ buyerId: actor, productId: body.productId, mode: "demo", status: "completed" });
      if (acquired) return acquired;
      // A competing first sale may have created the seller wallet.
      if (attempt < 2) return demoCheckout(actor, body, attempt + 1);
    }
    throw error;
  } finally { await session.endSession(); }
}

export async function demoPayout(actor: string, body: Record<string, unknown>) {
  const key = requestKey(actor, body);
  const amount = typeof body.amount === "number" ? Math.round(body.amount * 100) : 0;
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new DemoPaymentError(400, "Choose a positive payout amount");
  await Transaction.init();
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const previous = await Transaction.findOne({ requestKey: key, mode: "demo", type: "payout", fromUserId: actor }).session(session);
      if (previous) {
        if (Math.round(previous.amount * 100) !== amount) throw new DemoPaymentError(409, "Payout identifier already used for another amount");
        return previous;
      }
      const wallet = await DemoWallet.findOneAndUpdate({ userId: actor, balance: { $gte: amount } }, { $inc: { balance: -amount } }, { new: true, session });
      if (!wallet) throw new DemoPaymentError(409, "Demo payout exceeds your available balance");
      const [transaction] = await Transaction.create([{ requestKey: key, mode: "demo", type: "payout", amount: amount / 100, fromUserId: actor, status: "completed", description: "Simulated payout — no money transferred" }], { session });
      return transaction;
    });
  } finally { await session.endSession(); }
}
