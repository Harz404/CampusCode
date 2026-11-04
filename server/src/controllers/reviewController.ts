import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/auth.js";
import { Review } from "../models/Review.js";
import { Contract } from "../models/Contract.js";
import { sameId } from "../middleware/access.js";
import { ReviewError, submitReview } from "../services/reviewService.js";

function serializeReview(review: any) {
  const result = review.toJSON();
  if (result.reviewerId?.name) { result.reviewer = result.reviewerId; result.reviewerId = result.reviewer.id; }
  return result;
}

export async function createReview(req: AuthRequest, res: Response) {
  try {
    const review = await submitReview(req.user!.id, req.body);
    if (!review) return res.status(503).json({ error: "Review was not saved" });
    return res.status(201).json(serializeReview(review));
  } catch (error) {
    if (error instanceof ReviewError) return res.status(error.status).json({ error: error.message });
    return res.status(503).json({ error: "Could not save review. Please retry." });
  }
}

export async function contractReviews(req: AuthRequest, res: Response) {
  try {
    if (!mongoose.isValidObjectId(req.params.contractId)) return res.status(404).json({ error: "Contract not found" });
    const contract = await Contract.findById(req.params.contractId);
    if (!contract || ![contract.clientId, contract.studentId].some(id => sameId(id, req.user!.id))) return res.status(404).json({ error: "Contract not found" });
    const reviews = await Review.find({ contractId: contract._id }).populate("reviewerId", "name avatar");
    const serialized = reviews.map(serializeReview);
    return res.json({ reviews: serialized, ownReview: serialized.find(review => sameId(review.reviewerId, req.user!.id)) || null });
  } catch { return res.status(500).json({ error: "Could not load contract reviews" }); }
}

export async function receivedReviews(req: AuthRequest, res: Response) {
  try {
    const page = Number(req.query.page || 1);
    if (!Number.isSafeInteger(page) || page < 1 || page > 10000) return res.status(400).json({ error: "Invalid review page" });
    const revieweeId = new mongoose.Types.ObjectId(req.user!.id);
    const [reviews, total, summary] = await Promise.all([
      Review.find({ revieweeId }).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * 20).limit(20).populate("reviewerId", "name avatar"),
      Review.countDocuments({ revieweeId }),
      Review.aggregate([{ $match: { revieweeId } }, { $group: { _id: { $floor: { $add: ["$overall", 0.5] } }, count: { $sum: 1 }, totalRating: { $sum: "$overall" } } }]),
    ]);
    const totalRating = summary.reduce((sum, row) => sum + row.totalRating, 0);
    return res.json({ reviews: reviews.map(serializeReview), total, page, hasMore: page * 20 < total,
      summary: { average: total ? totalRating / total : 0, count: total, distribution: Object.fromEntries(summary.map(row => [row._id, row.count])) } });
  } catch { return res.status(500).json({ error: "Could not load reviews" }); }
}
