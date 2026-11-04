import mongoose from "mongoose";
import { Contract, IContract } from "../models/Contract.js";
import { SolutionRequest } from "../models/SolutionRequest.js";
import { sameId } from "../middleware/access.js";

export class MilestoneError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

function deliveryLink(value: unknown): string | undefined {
  if (value === undefined || value === "") return undefined;
  if (typeof value !== "string" || value.length > 2000) throw new MilestoneError(400, "Invalid delivery link");
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) throw new Error();
    return url.href;
  } catch { throw new MilestoneError(400, "Delivery links must use HTTP or HTTPS"); }
}

export function applyMilestoneAction(contract: IContract, milestoneId: string, actor: string, body: Record<string, unknown>) {
  const isClient = sameId(contract.clientId, actor);
  const isStudent = sameId(contract.studentId, actor);
  if (!isClient && !isStudent) throw new MilestoneError(404, "Contract not found");
  if (["completed", "cancelled", "disputed"].includes(contract.status)) throw new MilestoneError(409, "Contract no longer accepts milestone changes");
  const index = contract.milestones.findIndex(item => sameId(item._id, milestoneId));
  if (index < 0) throw new MilestoneError(404, "Milestone not found");
  const milestone = contract.milestones[index];
  const action = body.action;
  const allowed = isClient ? ["approve", "request_revision"] : ["start", "submit"];
  if (typeof action !== "string" || !allowed.includes(action)) throw new MilestoneError(403, "This milestone action is not permitted");
  if (contract.milestones.slice(0, index).some(item => item.status !== "approved")) throw new MilestoneError(409, "Finish previous milestones first");
  const expected = action === "start" ? ["pending"] : action === "submit" ? ["in_progress", "revision_requested"] : ["submitted"];
  if (!expected.includes(milestone.status)) throw new MilestoneError(409, "Milestone changed; refresh and retry");
  const notes = body.notes === undefined ? "" : body.notes;
  if (typeof notes !== "string" || notes.length > 20000) throw new MilestoneError(400, "Invalid milestone notes");
  const repoLink = action === "submit" ? deliveryLink(body.repoLink) : undefined;
  const driveLink = action === "submit" ? deliveryLink(body.driveLink) : undefined;
  if (action === "submit" && !notes.trim() && !repoLink && !driveLink) throw new MilestoneError(400, "Provide delivery notes or a delivery link");
  if (action === "request_revision" && !notes.trim()) throw new MilestoneError(400, "Explain the changes requested");
  milestone.history ||= [];
  milestone.history.push({ action, actorId: new mongoose.Types.ObjectId(actor), notes: notes.trim(), repoLink, driveLink, createdAt: new Date() });
  const statuses = { start: "in_progress", submit: "submitted", approve: "approved", request_revision: "revision_requested" } as const;
  milestone.status = statuses[action as keyof typeof statuses];
  if (action === "approve") milestone.completedAt = new Date();
  contract.status = contract.milestones.every(item => item.status === "approved") ? "completed" : contract.milestones.some(item => item.status === "submitted") ? "in_review" : "active";
  if (contract.status === "completed") contract.endDate = new Date();
}

export async function actOnMilestone(contractId: string, milestoneId: string, actor: string, body: Record<string, unknown>) {
  if (!mongoose.isValidObjectId(contractId) || !mongoose.isValidObjectId(milestoneId)) throw new MilestoneError(404, "Milestone not found");
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const contract = await Contract.findOne({ _id: contractId, $or: [{ clientId: actor }, { studentId: actor }] }).session(session);
      if (!contract) throw new MilestoneError(404, "Contract not found");
      applyMilestoneAction(contract, milestoneId, actor, body);
      await contract.save({ session });
      if (contract.status === "completed") await SolutionRequest.updateOne({ _id: contract.solutionRequestId }, { $set: { status: "completed" } }, { session });
      await contract.populate([{ path: "solutionRequestId" }, { path: "studentId", select: "name avatar studentProfile" }, { path: "clientId", select: "name avatar clientProfile" }]);
      return contract;
    });
  } finally { await session.endSession(); }
}
