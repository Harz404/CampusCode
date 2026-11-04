import mongoose from "mongoose";
import { moderationTransition, ProductError, validateSubmission } from "../services/productService.js";
import { serializeProduct } from "./productController.js";
import { Response } from "express";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { SolutionRequest } from "../models/SolutionRequest.js";
import { Transaction } from "../models/Transaction.js";
import { Contract } from "../models/Contract.js";
import { AuthRequest } from "../middleware/auth.js";

export async function getAdminStats(req: AuthRequest, res: Response) {
  try {
    const [userCount, productCount, requestCount, contractCount, transactions] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      SolutionRequest.countDocuments(),
      Contract.countDocuments(),
      Transaction.find(),
    ]);

    const totalVolume = transactions.reduce((acc, t) => acc + (t.amount || 0), 0);
    const platformRevenue = totalVolume * 0.1; // 10% commission

    return res.json({
      totalUsers: userCount,
      totalProducts: productCount,
      totalRequests: requestCount,
      totalContracts: contractCount,
      totalVolume,
      platformRevenue,
    });
  } catch (error) {
    console.error("[Admin Stats Error]:", error);
    return res.status(500).json({ error: "Failed to fetch admin stats" });
  }
}

export async function getAdminUsers(req: AuthRequest, res: Response) {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return res.json({ users: users.map((u) => u.toJSON()) });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch users" });
  }
}

export async function updateProductStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(404).json({ error: "Product not found" });
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    const decision = moderationTransition(product.status, req.body.status, req.body.reason || "");
    if (decision.status === "published") validateSubmission(product.toObject());
    const saved = await Product.findOneAndUpdate({ _id: id, status: product.status, updatedAt: product.updatedAt }, { $set: { status: decision.status, moderationVerified: decision.status === "published", moderationReason: decision.reason }, $push: { moderationHistory: { ...decision, actorId: req.user!.id, createdAt: new Date() } } }, { new: true, runValidators: true });
    if (!saved) return res.status(409).json({ error: "Product changed; refresh before reviewing" });
    return res.json(serializeProduct(saved, req.user!.id, req.user!.role));
  } catch (error) {
    if (error instanceof ProductError) return res.status(error.status).json({ error: error.message });
    return res.status(500).json({ error: "Failed to update product status" });
  }
}

