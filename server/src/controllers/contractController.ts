import { actOnMilestone, MilestoneError } from "../services/milestoneService.js";
import { sameId } from "../middleware/access.js";
import { Response } from "express";
import { Contract } from "../models/Contract.js";
import { AuthRequest } from "../middleware/auth.js";
import mongoose from "mongoose";

export async function getContracts(req: AuthRequest, res: Response) {
  try {
    const { userId, studentId, clientId, status } = req.query;
    const filter: Record<string, unknown> = {};

    const targetUser = req.user!.id;
    if (targetUser && mongoose.Types.ObjectId.isValid(targetUser as string)) {
      filter.$or = [{ studentId: targetUser }, { clientId: targetUser }];
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    const contracts = await Contract.find(filter)
      .sort({ updatedAt: -1 })
      .populate("solutionRequestId")
      .populate("studentId", "name email avatar studentProfile")
      .populate("clientId", "name email avatar clientProfile");

    const formatted = contracts.map(serializeContract);

    return res.json({ contracts: formatted, total: formatted.length });
  } catch (error) {
    console.error("[Contract GET Error]:", error);
    return res.status(500).json({ error: "Failed to fetch contracts" });
  }
}

export async function getContractById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: "Contract not found" });
    }

    const contract = await Contract.findById(id)
      .populate("solutionRequestId")
      .populate("studentId", "name email avatar studentProfile")
      .populate("clientId", "name email avatar clientProfile");

    if (!contract) {
      return res.status(404).json({ error: "Contract not found" });
    }

    return res.json(serializeContract(contract));
  } catch (error) {
    console.error("[Contract GetById Error]:", error);
    return res.status(500).json({ error: "Failed to fetch contract" });
  }
}

export function serializeContract(contract: any) {
  const data = contract.toJSON();
  for (const [field, label] of [["studentId", "student"], ["clientId", "client"], ["solutionRequestId", "solutionRequest"]]) {
    if (data[field] && typeof data[field] === "object" && (data[field].name || data[field].title)) {
      data[label] = data[field]; data[field] = data[label].id || String(data[label]._id);
    }
  }
  data.milestones = (data.milestones || []).map((milestone: any) => ({ ...milestone, id: milestone.id || String(milestone._id), approvedAt: milestone.completedAt }));
  return data;
}

export async function updateContractMilestone(req: AuthRequest, res: Response) {
  try {
    const contract = await actOnMilestone(req.params.id, req.params.milestoneId || req.body.milestoneId, req.user!.id, req.body);
    if (!contract) return res.status(503).json({ error: "Milestone action did not complete" });
    return res.json(serializeContract(contract));
  } catch (error) {
    if (error instanceof MilestoneError) return res.status(error.status).json({ error: error.message });
    console.error("[Milestone Action Error]", error);
    return res.status(503).json({ error: "Could not save milestone action. Refresh and retry." });
  }
}
