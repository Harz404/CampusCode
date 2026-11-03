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
    const { status } = req.body;
    const product = await Product.findByIdAndUpdate(id, { status }, { new: true });
    return res.json(product?.toJSON());
  } catch (error) {
    return res.status(500).json({ error: "Failed to update product status" });
  }
}

