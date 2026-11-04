import { acceptProposalForClient, ProposalError, validateProposalTerms } from "../services/proposalService.js";
import { sameId } from "../middleware/access.js";
import { Response } from "express";
import { Proposal } from "../models/Proposal.js";
import { SolutionRequest } from "../models/SolutionRequest.js";
import { Contract } from "../models/Contract.js";
import { AuthRequest } from "../middleware/auth.js";
import mongoose from "mongoose";

export async function getProposals(req: AuthRequest, res: Response) {
  try {
    const { solutionRequestId, studentId, userId } = req.query;
    const owned = await SolutionRequest.find({ clientId: req.user!.id }).select("_id");
    const filter: Record<string, unknown> = { $or: [{ studentId: req.user!.id }, { solutionRequestId: { $in: owned.map(r => r._id) } }] };

    if (solutionRequestId) {
      filter.solutionRequestId = solutionRequestId;
    }
    const student = studentId;
    if (student && mongoose.Types.ObjectId.isValid(student as string)) {
      filter.studentId = student;
    }

    const proposals = await Proposal.find(filter)
      .sort({ createdAt: -1 })
      .populate("solutionRequestId")
      .populate("studentId", "name email avatar studentProfile");

    const formatted = proposals.map(serializeProposal);

    return res.json({ proposals: formatted, total: formatted.length });
  } catch (error) {
    console.error("[Proposal GET Error]:", error);
    return res.status(500).json({ error: "Failed to fetch proposals" });
  }
}

export async function getProposalById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: "Proposal not found" });
    }

    const proposal = await Proposal.findById(id)
      .populate("solutionRequestId")
      .populate("studentId", "name email avatar studentProfile");

    if (!proposal) {
      return res.status(404).json({ error: "Proposal not found" });
    }

    return res.json(serializeProposal(proposal));
  } catch (error) {
    console.error("[Proposal GetById Error]:", error);
    return res.status(500).json({ error: "Failed to fetch proposal" });
  }
}

export async function createProposal(req: AuthRequest, res: Response) {
  try {
    const studentId = req.user?.id || req.body.studentId;
    if (!studentId) {
      return res.status(401).json({ error: "Unauthorized: Student ID required" });
    }

    const { solutionRequestId, content, price, estimatedDelivery, technologies, milestones } = req.body;
    if (!solutionRequestId || typeof content !== "string" || !content.trim() || content.length > 30000 || typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ error: "Solution request, content, and price are required" });
    }

    if (req.user?.role !== "student") return res.status(403).json({ error: "Only students can submit proposals" });
    if (!mongoose.isValidObjectId(solutionRequestId)) return res.status(404).json({ error: "Requirement not found" });
    const request = await SolutionRequest.findById(solutionRequestId);
    if (!request || request.status !== "open") return res.status(409).json({ error: "Requirement is not open" });
    if (sameId(request.clientId, studentId)) return res.status(400).json({ error: "You cannot bid on your own requirement" });
    const terms = Array.isArray(milestones) && milestones.length ? milestones : [{ title: "Final delivery", amount: Number(price), durationDays: Number(estimatedDelivery) || 14 }];
    if (terms.length > 50 || !terms.every(m => m && typeof m.title === "string" && m.title.trim() && Number.isInteger(Number(m.durationDays)) && Number(m.durationDays) > 0)) {
      return res.status(400).json({ error: "Each milestone needs a title and positive duration" });
    }
    validateProposalTerms(Number(price), terms);
    const newProposal = new Proposal({
      solutionRequestId,
      studentId,
      content,
      price: Number(price),
      estimatedDelivery: Number(estimatedDelivery) || 14,
      technologies: Array.isArray(technologies) ? technologies : [],
      status: "pending",
      milestones: terms,
    });

    let savedProposal = newProposal;
    await Proposal.init();
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const existing = await Proposal.exists({ solutionRequestId, studentId }).session(session);
        if (existing) throw new ProposalError(409, "You already submitted a proposal for this requirement");
        const open = await SolutionRequest.findOneAndUpdate({ _id: solutionRequestId, status: "open" }, { $inc: { proposalCount: 1 } }, { session, new: true });
        if (!open) throw new ProposalError(409, "Requirement is no longer open");
        newProposal.set("submissionKey", String(solutionRequestId) + ":" + studentId);
        const [created] = await Proposal.create([newProposal.toObject()], { session });
        savedProposal = created;
      });
    } finally { await session.endSession(); }
    return res.status(201).json(serializeProposal(savedProposal));
  } catch (error) {
    if ((error as {code?: number}).code === 11000) return res.status(409).json({ error: "You already submitted a proposal for this requirement" });
    if (error instanceof ProposalError) return res.status(error.status).json({ error: error.message });
    console.error("[Proposal Create Error]:", error);
    return res.status(500).json({ error: "Failed to submit proposal" });
  }
}

export async function acceptProposal(req: AuthRequest, res: Response) {
  try {
    const result = await acceptProposalForClient(req.params.id, req.user!.id);
    if (!result) return res.status(500).json({ error: "Acceptance did not complete" });
    return res.json({ success: true, contractId: result.contract.id, contract: result.contract.toJSON(), proposal: result.proposal.toJSON() });
  } catch (error) {
    if (error instanceof ProposalError) return res.status(error.status).json({ error: error.message });
    console.error("[Proposal Accept Error]", error);
    return res.status(503).json({ error: "Could not accept proposal atomically. Please retry; MongoDB transactions must be available." });
  }
}

export function serializeProposal(proposal: any) {
  const data = proposal.toJSON();
  if (data.studentId?.name) { data.student = data.studentId; data.studentId = data.student.id || String(data.student._id); }
  if (data.solutionRequestId?.title) { data.solutionRequest = data.solutionRequestId; data.solutionRequestId = data.solutionRequest.id || String(data.solutionRequest._id); }
  return data;
}
