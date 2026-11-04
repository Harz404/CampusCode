import { Response } from "express";
import mongoose from "mongoose";
import { Transaction } from "../models/Transaction.js";
import { Order } from "../models/Order.js";
import { DemoWallet } from "../models/DemoWallet.js";
import { AuthRequest } from "../middleware/auth.js";
import { demoCheckout, demoPayout, DemoPaymentError } from "../services/demoPaymentService.js";

export async function createPaymentOrder(req: AuthRequest, res: Response) {
  try {
    const order = await demoCheckout(req.user!.id, req.body);
    const receipt = order!.toJSON();
    delete receipt.delivery;
    return res.json({ mode: "demo", order: receipt });
  } catch (error) { return paymentError(error, res); }
}
export async function requestPayout(req: AuthRequest, res: Response) {
  try { const transaction = await demoPayout(req.user!.id, req.body); return res.json({ success: true, mode: "demo", transaction: transaction!.toJSON() }); }
  catch (error) { return paymentError(error, res); }
}
function paymentError(error: unknown, res: Response) {
  if (error instanceof DemoPaymentError) return res.status(error.status).json({ error: error.message });
  return res.status(503).json({ error: "Could not save the demo payment. Please retry." });
}
export async function getTransactions(req: AuthRequest, res: Response) {
  try {
    const actor = req.user!.id;
    const transactions = await Transaction.find({ mode: "demo", $or: [{ fromUserId: actor }, { toUserId: actor }] }).sort({ createdAt: -1 });
    const wallet = await DemoWallet.findOne({ userId: actor });
    const purchases = await Order.find({ buyerId: actor, mode: "demo", status: "completed" });
    const totalEarned = transactions.filter(tx => tx.type === "payment" && String(tx.toUserId) === actor).reduce((sum, tx) => sum + tx.amount, 0);
    const totalSpent = purchases.reduce((sum, order) => sum + order.amount, 0);
    const months = new Map<string, { month: string; earned: number; spent: number }>();
    function month(date: Date) {
      const key = date.toISOString().slice(0, 7);
      if (!months.has(key)) months.set(key, { month: key, earned: 0, spent: 0 });
      return months.get(key)!;
    }
    for (const tx of transactions) if (tx.type === "payment" && String(tx.toUserId) === actor) month(tx.createdAt).earned += tx.amount;
    for (const order of purchases) month(order.createdAt).spent += order.amount;
    return res.json({ mode: "demo", balance: (wallet?.balance || 0) / 100, totalEarned, totalSpent, monthly: [...months.values()].sort((a, b) => a.month.localeCompare(b.month)), transactions: transactions.map(tx => tx.toJSON()) });
  } catch { return res.status(500).json({ error: "Could not load demo wallet" }); }
}
export async function getOrders(req: AuthRequest, res: Response) {
  try {
    const orders = await Order.find({ buyerId: req.user!.id, mode: "demo" }).sort({ createdAt: -1 });
    return res.json({ mode: "demo", orders: orders.map(order => order.toJSON()) });
  } catch { return res.status(500).json({ error: "Could not load purchases" }); }
}
export async function getOrderDelivery(req: AuthRequest, res: Response) {
  try {
    if (!mongoose.isValidObjectId(req.params.orderId)) return res.status(404).json({ error: "Purchase not found" });
    const order = await Order.findOne({ _id: req.params.orderId, buyerId: req.user!.id, mode: "demo", status: "completed" }).select("+delivery");
    if (!order) return res.status(404).json({ error: "Completed purchase not found" });
    return res.json({ mode: "demo", productName: order.get("productName"), licenseKey: order.get("licenseKey"), delivery: order.get("delivery") || {} });
  } catch { return res.status(500).json({ error: "Could not load delivery" }); }
}
