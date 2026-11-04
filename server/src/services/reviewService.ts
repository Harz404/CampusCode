import mongoose from "mongoose";
import { Contract } from "../models/Contract.js";
import { Review } from "../models/Review.js";
import { User } from "../models/User.js";
import { sameId } from "../middleware/access.js";

export class ReviewError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function reviewInput(body: Record<string, unknown>) {
  const ratings: Record<string, number> = {};
  for (const field of ["communication", "quality", "delivery", "professionalism"]) {
    const value = body[field];
    if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 5) throw new ReviewError(400, "Each rating must be a whole number from 1 to 5");
    ratings[field] = value;
  }
  if (typeof body.content !== "string" || !body.content.trim() || body.content.length > 5000) throw new ReviewError(400, "Write a review of 1 to 5,000 characters");
  return { ...ratings, overall: Object.values(ratings).reduce((sum, rating) => sum + rating, 0) / 4, content: body.content.trim() };
}

export function reviewRecipient(contract: { clientId: unknown; studentId: unknown; status: string }, actor: string) {
  if (!sameId(contract.clientId, actor) && !sameId(contract.studentId, actor)) throw new ReviewError(404, "Contract not found");
  if (contract.status !== "completed") throw new ReviewError(409, "Reviews are available after all contract milestones are approved");
  const recipient = sameId(contract.clientId, actor) ? contract.studentId : contract.clientId;
  if (sameId(recipient, actor)) throw new ReviewError(400, "You cannot review yourself");
  return recipient;
}

export async function submitReview(actor: string, body: Record<string, unknown>) {
  const values = reviewInput(body);
  if (typeof body.contractId !== "string" || !mongoose.isValidObjectId(body.contractId)) throw new ReviewError(404, "Contract not found");
  await Review.init();
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const contract = await Contract.findById(body.contractId).session(session);
      if (!contract) throw new ReviewError(404, "Contract not found");
      const revieweeId = reviewRecipient(contract, actor);
      if (await Review.exists({ contractId: contract._id, reviewerId: actor }).session(session)) throw new ReviewError(409, "You already reviewed this contract");
      const [review] = await Review.create([{ ...values, contractId: contract._id, reviewerId: actor, revieweeId, isVerified: true }], { session });
      const [summary] = await Review.aggregate([{ $match: { revieweeId: new mongoose.Types.ObjectId(String(revieweeId)), isVerified: true } }, { $group: { _id: null, rating: { $avg: "$overall" }, count: { $sum: 1 } } }]).session(session);
      // Concurrent reviews for the same recipient contend on this user write;
      // transaction retries recompute the aggregate from a fresh snapshot.
      const profile = sameId(contract.studentId, revieweeId) ? "studentProfile" : "clientProfile";
      await User.updateOne({ _id: revieweeId }, { $set: { [`${profile}.rating`]: summary?.rating || 0, [`${profile}.reviewCount`]: summary?.count || 0 } }, { session });
      return review;
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) throw new ReviewError(409, "You already reviewed this contract");
    throw error;
  } finally { await session.endSession(); }
}
