import { Response } from "express";
import { Proposal } from "../models/Proposal.js";
import { SolutionRequest } from "../models/SolutionRequest.js";
import { Contract } from "../models/Contract.js";
import { AuthRequest } from "../middleware/auth.js";
import mongoose from "mongoose";

export async function getProposals(req: AuthRequest, res: Response) {
  try {
    const { solutionRequestId, studentId, userId } = req.query;
    const filter: Record<string, unknown> = {};

    if (solutionRequestId) {
      filter.solutionRequestId = solutionRequestId;
    }
    const student = studentId || userId;
    if (student && mongoose.Types.ObjectId.isValid(student as string)) {
      filter.studentId = student;
    }

    const proposals = await Proposal.find(filter)
      .sort({ createdAt: -1 })
      .populate("solutionRequestId")
      .populate("studentId", "name email avatar studentProfile");

    const formatted = proposals.map((p) => {
      const pJson: any = p.toJSON();
      if (pJson.studentId && typeof pJson.studentId === "object") {
        pJson.student = pJson.studentId;
        pJson.studentId = (pJson.student as { id?: string }).id || pJson.studentId;
      }
      return pJson;
    });

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

    const pJson: any = proposal.toJSON();
    if (pJson.studentId && typeof pJson.studentId === "object") {
      pJson.student = pJson.studentId;
      pJson.studentId = (pJson.student as { id?: string }).id || pJson.studentId;
    }

    return res.json(pJson);
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
    if (!solutionRequestId || !content || !price) {
      return res.status(400).json({ error: "Solution request, content, and price are required" });
    }

    const newProposal = new Proposal({
      solutionRequestId,
      studentId,
      content,
      price: Number(price),
      estimatedDelivery: Number(estimatedDelivery) || 14,
      technologies: Array.isArray(technologies) ? technologies : [],
      status: "pending",
      milestones: Array.isArray(milestones) && milestones.length > 0 ? milestones : [
        { title: "Milestone 1: Prototype", description: "Initial functional prototype", amount: Number(price) * 0.5, durationDays: 7 },
        { title: "Milestone 2: Final Delivery", description: "Complete delivery and source code", amount: Number(price) * 0.5, durationDays: 7 },
      ],
    });

    await newProposal.save();

    // Increment proposal count on solution request
    await SolutionRequest.findByIdAndUpdate(solutionRequestId, { $inc: { proposalCount: 1 } });

    return res.status(201).json(newProposal.toJSON());
  } catch (error) {
    console.error("[Proposal Create Error]:", error);
    return res.status(500).json({ error: "Failed to submit proposal" });
  }
}

export async function acceptProposal(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const proposal = await Proposal.findById(id).populate("solutionRequestId");
    if (!proposal) {
      return res.status(404).json({ error: "Proposal not found" });
    }

    proposal.status = "accepted";
    await proposal.save();

    const solReq = proposal.solutionRequestId as unknown as { _id: string; clientId: string; title: string };

    // Create a new active contract
    const totalAmount = proposal.price;
    const platformFee = totalAmount * 0.1; // 10%
    const studentEarnings = totalAmount - platformFee;

    const contract = new Contract({
      solutionRequestId: solReq._id,
      proposalId: proposal._id,
      studentId: proposal.studentId,
      clientId: solReq.clientId || req.user?.id,
      totalAmount,
      platformFee,
      studentEarnings,
      status: "active",
      milestones: proposal.milestones.map((m) => ({
        title: m.title,
        description: m.description,
        amount: m.amount,
        status: "pending",
      })),
    });

    await contract.save();

    // Mark Solution Request as in_progress
    await SolutionRequest.findByIdAndUpdate(solReq._id, { status: "in_progress" });

    return res.json({ success: true, contract: contract.toJSON(), proposal: proposal.toJSON() });
  } catch (error) {
    console.error("[Proposal Accept Error]:", error);
    return res.status(500).json({ error: "Failed to accept proposal" });
  }
}

