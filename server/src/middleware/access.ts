import { Response, NextFunction } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "./auth.js";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { Product } from "../models/Product.js";
import { SolutionRequest } from "../models/SolutionRequest.js";
import { Proposal } from "../models/Proposal.js";
import { Contract } from "../models/Contract.js";

export function sameId(left: unknown, right: unknown): boolean {
  if (!left || !right) return false;
  const value = left as { _id?: unknown };
  return String(value._id || left) === String(right);
}

export function projectScope(userId: string) {
  return { $or: [{ ownerId: userId }, { "members.user": userId }] };
}

export const editable = {
  project: ["name", "description", "category", "technologies", "deadline", "status"],
  task: ["title", "description", "status", "priority", "labels", "dueDate", "subtasks"],
  product: ["name", "description", "shortDescription", "category", "price", "isFree", "technologies", "tags", "features", "requirements", "license", "demoUrl", "githubUrl", "driveUrl", "downloadUrl", "documentation", "installation", "screenshots"],
  solution: ["title", "description", "problemStatement", "category", "solutionType", "difficulty", "budgetMin", "budgetMax", "isFixedPrice", "deadline", "preferredTechnologies", "requiredFeatures", "expectedDeliverables"],
};

export function allowFields(kind: keyof typeof editable) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.body || Array.isArray(req.body) || typeof req.body !== "object" ||
        Object.keys(req.body).some(key => !editable[kind].includes(key))) {
      return res.status(400).json({ error: "Request contains unsupported fields" });
    }
    next();
  };
}

// Resource checks are deliberately separate from role checks: knowing an ID
// or being signed in never grants access to another user's record.
export function access(kind: "project" | "task" | "product" | "solution" | "proposal" | "contract", ownerOnly = false) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const id = kind === "task" ? req.params.taskId : req.params.id;
    if (!mongoose.isValidObjectId(id)) return res.status(404).json({ error: "Resource not found" });
    try {
      let allowed = false;
      const actor = req.user.id;
      if (kind === "project" || kind === "task") {
        const task = kind === "task" ? await Task.findById(id) : null;
        if (kind === "task" && (!task || (req.params.id && !sameId(task.projectId, req.params.id)))) return res.status(404).json({ error: "Resource not found" });
        const project = await Project.findById(kind === "task" ? task?.projectId : id);
        allowed = !!project && (sameId(project.ownerId, actor) || (!ownerOnly && project.members.some(m => sameId(m.user, actor))));
      } else if (kind === "product") {
        const record = await Product.findById(id);
        allowed = !!record && sameId(record.sellerId, actor);
      } else if (kind === "solution") {
        const record = await SolutionRequest.findById(id);
        allowed = !!record && sameId(record.clientId, actor);
      } else if (kind === "contract") {
        const record = await Contract.findById(id);
        allowed = !!record && (sameId(record.studentId, actor) || sameId(record.clientId, actor));
      } else {
        const record = await Proposal.findById(id);
        const request = record && await SolutionRequest.findById(record.solutionRequestId);
        allowed = !!record && (sameId(request?.clientId, actor) || (!ownerOnly && sameId(record.studentId, actor)));
      }
      if (!allowed) return res.status(404).json({ error: "Resource not found" });
      next();
    } catch (error) { next(error); }
  };
}
