import { Response } from "express";
import { Contract } from "../models/Contract.js";
import { AuthRequest } from "../middleware/auth.js";
import mongoose from "mongoose";

export async function getContracts(req: AuthRequest, res: Response) {
  try {
    const { userId, studentId, clientId, status } = req.query;
    const filter: Record<string, unknown> = {};

    const targetUser = userId || studentId || clientId || req.user?.id;
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

    const formatted = contracts.map((c) => {
      const cJson: any = c.toJSON();
      if (cJson.studentId && typeof cJson.studentId === "object") {
        cJson.student = cJson.studentId;
        cJson.studentId = (cJson.student as { id?: string }).id || cJson.studentId;
      }
      if (cJson.clientId && typeof cJson.clientId === "object") {
        cJson.client = cJson.clientId;
        cJson.clientId = (cJson.client as { id?: string }).id || cJson.clientId;
      }
      return cJson;
    });

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

    const cJson: any = contract.toJSON();
    if (cJson.studentId && typeof cJson.studentId === "object") {
      cJson.student = cJson.studentId;
      cJson.studentId = (cJson.student as { id?: string }).id || cJson.studentId;
    }
    if (cJson.clientId && typeof cJson.clientId === "object") {
      cJson.client = cJson.clientId;
      cJson.clientId = (cJson.client as { id?: string }).id || cJson.clientId;
    }

    return res.json(cJson);
  } catch (error) {
    console.error("[Contract GetById Error]:", error);
    return res.status(500).json({ error: "Failed to fetch contract" });
  }
}

export async function updateContractMilestone(req: AuthRequest, res: Response) {
  try {
    const { id, milestoneIndex } = req.params;
    const { status } = req.body;

    const contract = await Contract.findById(id);
    if (!contract) {
      return res.status(404).json({ error: "Contract not found" });
    }

    const idx = Number(milestoneIndex);
    if (contract.milestones && contract.milestones[idx]) {
      contract.milestones[idx].status = status;
      if (status === "approved") {
        contract.milestones[idx].completedAt = new Date();
      }
      await contract.save();
    }

    return res.json(contract.toJSON());
  } catch (error) {
    console.error("[Contract Milestone Error]:", error);
    return res.status(500).json({ error: "Failed to update milestone" });
  }
}

