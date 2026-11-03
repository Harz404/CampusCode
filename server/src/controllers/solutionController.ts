import { Response } from "express";
import { SolutionRequest } from "../models/SolutionRequest.js";
import { Proposal } from "../models/Proposal.js";
import { AuthRequest } from "../middleware/auth.js";
import mongoose from "mongoose";

export async function getSolutionRequests(req: AuthRequest, res: Response) {
  try {
    const { category, search, sort, clientId, mine } = req.query;
    const filter: Record<string, unknown> = {};

    if (mine === "true" && req.user?.id) {
      filter.clientId = req.user.id;
    } else if (clientId) {
      if (mongoose.Types.ObjectId.isValid(clientId as string)) {
        filter.clientId = clientId;
      }
    }

    if (category && category !== "all") {
      filter.category = new RegExp(category as string, "i");
    }

    if (search) {
      const searchRegex = new RegExp(search as string, "i");
      filter.$or = [{ title: searchRegex }, { description: searchRegex }, { preferredTechnologies: searchRegex }];
    }

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === "budget_high") sortOption = { budgetMax: -1 };
    if (sort === "proposals") sortOption = { proposalCount: 1 };

    const requests = await SolutionRequest.find(filter)
      .sort(sortOption)
      .populate("clientId", "name email avatar clientProfile");

    const formatted = requests.map((r) => {
      const rJson: any = r.toJSON();
      if (rJson.clientId && typeof rJson.clientId === "object") {
        rJson.client = rJson.clientId;
        rJson.clientId = (rJson.client as { id?: string }).id || rJson.clientId;
      }
      return rJson;
    });

    return res.json({ requests: formatted, total: formatted.length });
  } catch (error) {
    console.error("[Solution GET Error]:", error);
    return res.status(500).json({ error: "Failed to fetch solution requests" });
  }
}

export async function getSolutionRequestById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: "Solution request not found" });
    }

    const request = await SolutionRequest.findById(id).populate("clientId", "name email avatar clientProfile");
    if (!request) {
      return res.status(404).json({ error: "Solution request not found" });
    }

    const proposals = await Proposal.find({ solutionRequestId: request._id }).populate("studentId", "name email avatar studentProfile");

    const rJson: any = request.toJSON();
    if (rJson.clientId && typeof rJson.clientId === "object") {
      rJson.client = rJson.clientId;
      rJson.clientId = (rJson.client as { id?: string }).id || rJson.clientId;
    }
    rJson.proposals = proposals.map((p) => p.toJSON());

    return res.json(rJson);
  } catch (error) {
    console.error("[Solution GetById Error]:", error);
    return res.status(500).json({ error: "Failed to fetch solution request" });
  }
}

export async function createSolutionRequest(req: AuthRequest, res: Response) {
  try {
    const clientId = req.user?.id || req.body.clientId;
    if (!clientId) {
      return res.status(401).json({ error: "Unauthorized: Client ID required" });
    }

    const {
      title,
      description,
      problemStatement,
      category,
      solutionType,
      difficulty,
      budgetMin,
      budgetMax,
      isFixedPrice,
      deadline,
      preferredTechnologies,
      requiredFeatures,
      expectedDeliverables,
    } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ error: "Title, description, and category are required" });
    }

    const newRequest = new SolutionRequest({
      title: title.trim(),
      description,
      problemStatement: problemStatement || description,
      category: category.toLowerCase(),
      solutionType: solutionType || "web",
      difficulty: difficulty || "intermediate",
      status: "open",
      clientId,
      budgetMin: Number(budgetMin) || 10000,
      budgetMax: Number(budgetMax) || 25000,
      isFixedPrice: isFixedPrice ?? true,
      deadline: deadline ? new Date(deadline) : undefined,
      preferredTechnologies: Array.isArray(preferredTechnologies) ? preferredTechnologies : [],
      requiredFeatures: Array.isArray(requiredFeatures) ? requiredFeatures : [],
      expectedDeliverables: Array.isArray(expectedDeliverables) ? expectedDeliverables : [],
      proposalCount: 0,
    });

    await newRequest.save();
    return res.status(201).json(newRequest.toJSON());
  } catch (error) {
    console.error("[Solution Create Error]:", error);
    return res.status(500).json({ error: "Failed to create solution request" });
  }
}

export async function updateSolutionRequest(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const request = await SolutionRequest.findByIdAndUpdate(id, { $set: req.body }, { new: true });
    if (!request) {
      return res.status(404).json({ error: "Solution request not found" });
    }
    return res.json(request.toJSON());
  } catch (error) {
    console.error("[Solution Update Error]:", error);
    return res.status(500).json({ error: "Failed to update solution request" });
  }
}

export async function deleteSolutionRequest(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await SolutionRequest.findByIdAndDelete(id);
    return res.json({ success: true, message: "Solution request deleted" });
  } catch (error) {
    console.error("[Solution Delete Error]:", error);
    return res.status(500).json({ error: "Failed to delete solution request" });
  }
}

