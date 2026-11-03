import { Response } from "express";
import { Transaction } from "../models/Transaction.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { AuthRequest } from "../middleware/auth.js";

export async function createPaymentOrder(req: AuthRequest, res: Response) {
  try {
    const { amount, productId } = req.body;
    const buyerId = req.user?.id || req.body.buyerId;

    const mockOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (productId && buyerId) {
      const order = new Order({
        productId,
        buyerId,
        amount: Number(amount) || 0,
        status: "completed",
        paymentId: `pay_${Date.now()}`,
      });
      await order.save();

      // Record transaction
      const product = await Product.findById(productId);
      if (product) {
        product.salesCount = (product.salesCount || 0) + 1;
        await product.save();

        const tx = new Transaction({
          type: "payment",
          amount: Number(amount) || 0,
          status: "completed",
          fromUserId: buyerId,
          toUserId: product.sellerId,
          orderId: order._id.toString(),
          description: `Purchase of ${product.name}`,
        });
        await tx.save();

        // Update seller earnings
        await User.findByIdAndUpdate(product.sellerId, {
          $inc: {
            "studentProfile.totalEarnings": Number(amount) || 0,
            "studentProfile.totalSales": 1,
          },
        });
      }
    }

    return res.json({
      orderId: mockOrderId,
      amount,
      currency: "INR",
      status: "created",
    });
  } catch (error) {
    console.error("[Payment Order Error]:", error);
    return res.status(500).json({ error: "Failed to create payment order" });
  }
}

export async function getTransactions(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id || (req.query.userId as string);
    const filter: Record<string, unknown> = {};

    if (userId) {
      filter.$or = [{ fromUserId: userId }, { toUserId: userId }];
    }

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .populate("fromUserId", "name email")
      .populate("toUserId", "name email");

    return res.json({ transactions: transactions.map((t) => t.toJSON()) });
  } catch (error) {
    console.error("[Payment Transactions Error]:", error);
    return res.status(500).json({ error: "Failed to fetch transactions" });
  }
}

export async function requestPayout(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id || req.body.userId;
    const { amount, accountDetails } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({ error: "User ID and amount are required" });
    }

    const payoutTx = new Transaction({
      type: "payout",
      amount: Number(amount),
      status: "completed",
      toUserId: userId,
      description: `Payout to bank account ending in ${accountDetails?.slice(-4) || "8821"}`,
    });
    await payoutTx.save();

    return res.json({ success: true, transaction: payoutTx.toJSON() });
  } catch (error) {
    console.error("[Payout Error]:", error);
    return res.status(500).json({ error: "Failed to process payout" });
  }
}

