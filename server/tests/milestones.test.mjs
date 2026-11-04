import assert from "node:assert/strict";
import { test } from "node:test";
import mongoose from "mongoose";
import { Contract } from "../dist/models/Contract.js";
import { applyMilestoneAction, actOnMilestone } from "../dist/services/milestoneService.js";
import { serializeContract } from "../dist/controllers/contractController.js";
import { SolutionRequest } from "../dist/models/SolutionRequest.js";

const client = "507f1f77bcf86cd799439011", student = "507f1f77bcf86cd799439012", outsider = "507f1f77bcf86cd799439013";
function fixture() {
  return new Contract({ clientId: client, studentId: student, solutionRequestId: outsider, proposalId: outsider, totalAmount: 100, studentEarnings: 90,
    milestones: [{ title: "First", amount: 50 }, { title: "Second", amount: 50 }] });
}
const milestone = (contract, index = 0) => String(contract.milestones[index]._id);

test("milestone work, revision and approval persist history and derive contract status", () => {
  const contract = fixture(); const first = milestone(contract);
  applyMilestoneAction(contract, first, student, { action: "start" });
  assert.equal(contract.status, "active");
  applyMilestoneAction(contract, first, student, { action: "submit", notes: "Delivered", repoLink: "https://github.com/example/project" });
  assert.equal(contract.status, "in_review");
  applyMilestoneAction(contract, first, client, { action: "request_revision", notes: "Please fix the login form" });
  applyMilestoneAction(contract, first, student, { action: "submit", notes: "Fixed and retested" });
  applyMilestoneAction(contract, first, client, { action: "approve" });
  assert.equal(contract.milestones[0].history.length, 5);
  assert.ok(contract.milestones[0].completedAt);
  const restored = new Contract(contract.toObject());
  assert.equal(restored.milestones[0].history[1].repoLink, "https://github.com/example/project");
  assert.equal(serializeContract(restored).milestones[0].id, first);
  const second = milestone(restored, 1);
  applyMilestoneAction(restored, second, student, { action: "start" });
  applyMilestoneAction(restored, second, student, { action: "submit", notes: "Final delivery" });
  applyMilestoneAction(restored, second, client, { action: "approve" });
  assert.equal(restored.status, "completed");
  assert.ok(restored.endDate);
});

test("milestones reject outsiders, invalid roles, premature approvals and unsafe delivery links", () => {
  const contract = fixture(), id = milestone(contract);
  assert.throws(() => applyMilestoneAction(contract, id, outsider, { action: "start" }), error => error.status === 404);
  assert.throws(() => applyMilestoneAction(contract, id, client, { action: "start" }), error => error.status === 403);
  assert.throws(() => applyMilestoneAction(contract, id, client, { action: "approve" }), error => error.status === 409);
  assert.throws(() => applyMilestoneAction(contract, milestone(contract, 1), student, { action: "start" }), /previous milestones/);
  applyMilestoneAction(contract, id, student, { action: "start" });
  assert.throws(() => applyMilestoneAction(contract, id, student, { action: "submit", repoLink: "javascript:alert(1)" }), /HTTP/);
  assert.throws(() => applyMilestoneAction(contract, id, student, { action: "submit", notes: " " }), /delivery notes/);
  applyMilestoneAction(contract, id, student, { action: "submit", notes: "Delivered" });
  assert.throws(() => applyMilestoneAction(contract, id, client, { action: "request_revision", notes: "" }), /Explain/);
  applyMilestoneAction(contract, id, client, { action: "approve" });
  assert.throws(() => applyMilestoneAction(contract, id, client, { action: "approve" }), error => error.status === 409);
});

test("final approval saves contract and requirement completion in the same transaction", async () => {
  const originals = [mongoose.startSession, Contract.findOne, SolutionRequest.updateOne];
  const contract = fixture(); contract.milestones[0].status = "approved"; contract.milestones[1].status = "submitted";
  let ended = false, saved = false, requirementCompleted = false;
  const session = { withTransaction: callback => callback(), endSession: async () => { ended = true; } };
  try {
    mongoose.startSession = async () => session;
    Contract.findOne = filter => { assert.ok(filter.$or.some(scope => scope.clientId === client)); return { session: async supplied => { assert.equal(supplied, session); return contract; } }; };
    contract.save = async options => { assert.equal(options.session, session); saved = true; };
    contract.populate = async () => contract;
    SolutionRequest.updateOne = async (filter, update, options) => { assert.equal(options.session, session); assert.equal(update.$set.status, "completed"); requirementCompleted = true; };
    await actOnMilestone(String(contract._id), milestone(contract, 1), client, { action: "approve" });
    assert.ok(saved && requirementCompleted && ended);
  } finally { [mongoose.startSession, Contract.findOne, SolutionRequest.updateOne] = originals; }
});
