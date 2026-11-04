import mongoose from "mongoose";
import { Proposal } from "../models/Proposal.js";
import { SolutionRequest } from "../models/SolutionRequest.js";
import { Contract } from "../models/Contract.js";
import { Project } from "../models/Project.js";
import { sameId } from "../middleware/access.js";

export class ProposalError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function validateProposalTerms(price: number, milestones: { amount: number }[]) {
  if (!Number.isFinite(price) || price <= 0 || !milestones.length ||
      milestones.some(m => !Number.isFinite(m.amount) || m.amount <= 0) ||
      milestones.reduce((sum, m) => sum + Math.round(m.amount * 100), 0) !== Math.round(price * 100)) {
    throw new ProposalError(400, "Positive milestone amounts must add up to the proposal price");
  }
}

export async function acceptProposalForClient(proposalId: string, clientId: string) {
  if (!mongoose.isValidObjectId(proposalId)) throw new ProposalError(404, "Proposal not found");
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const proposal = await Proposal.findById(proposalId).session(session);
      if (!proposal) throw new ProposalError(404, "Proposal not found");
      const request = await SolutionRequest.findById(proposal.solutionRequestId).session(session);
      if (!request || !sameId(request.clientId, clientId)) throw new ProposalError(404, "Proposal not found");
      // Repeated requests return the original result rather than creating records.
      const existing = await Contract.findOne({ proposalId: proposal._id }).session(session);
      if (existing && proposal.status === "accepted") return { contract: existing, proposal };
      if (proposal.status !== "pending" || request.status !== "open") {
        throw new ProposalError(409, "This requirement or proposal is no longer open");
      }
      if (sameId(proposal.studentId, clientId)) throw new ProposalError(400, "You cannot accept your own proposal");
      validateProposalTerms(proposal.price, proposal.milestones);
      // Every competing acceptance writes the same request. MongoDB retries a
      // write conflict; the retry observes in_progress and rejects the loser.
      const claimed = await SolutionRequest.findOneAndUpdate(
        { _id: request._id, clientId, status: "open" },
        { $set: { status: "in_progress" } }, { session, new: true }
      );
      if (!claimed) throw new ProposalError(409, "Another proposal was already accepted");
      const [project] = await Project.create([{
        name: request.title, description: request.description, category: request.category,
        ownerId: proposal.studentId, status: "planning", progress: 0,
        technologies: proposal.technologies,
        members: [{ user: proposal.studentId, role: "owner" }, { user: clientId, role: "viewer" }],
        milestones: [],
      }], { session });
      const platformFee = Math.round(proposal.price * 100 * 0.1) / 100;
      const [contract] = await Contract.create([{
        solutionRequestId: request._id, proposalId: proposal._id,
        studentId: proposal.studentId, clientId, projectId: project._id,
        totalAmount: proposal.price, platformFee,
        studentEarnings: Math.round((proposal.price - platformFee) * 100) / 100,
        status: "created",
        milestones: proposal.milestones.map(m => ({ title: m.title, description: m.description, amount: m.amount, status: "pending" })),
      }], { session });
      proposal.status = "accepted";
      await proposal.save({ session });
      await Proposal.updateMany({ solutionRequestId: request._id, _id: { $ne: proposal._id }, status: "pending" }, { $set: { status: "rejected" } }, { session });
      return { contract, proposal };
    });
  } finally { await session.endSession(); }
}
