import assert from "node:assert/strict";
import { test } from "node:test";
import { requirementInput } from "../dist/services/requirementService.js";
import { serializeProposal } from "../dist/controllers/proposalController.js";

test("requirements preserve explicit budgets and validate the brief instead of inventing financial values", () => {
  const brief = { title: " Build a planner ", description: "Track events", category: "web", budgetMin: 100, budgetMax: 200, isFixedPrice: true };
  assert.equal(requirementInput(brief, true).title, "Build a planner");
  for (const invalid of [{ budgetMin: 0 }, { budgetMax: 50 }, { budgetMin: "100" }, { title: " " }, { deadline: "not-a-date" }]) {
    assert.throws(() => requirementInput({ ...brief, ...invalid }, true), error => error.status === 400);
  }
  const negotiable = requirementInput({ title: "Planner", description: "Track events", category: "web", isFixedPrice: false, budgetMin: null, budgetMax: null }, true);
  assert.equal(negotiable.budgetMin, undefined);
  assert.equal(negotiable.budgetMax, undefined);
});

test("proposal responses consistently separate resource identifiers from populated display data", () => {
  const result = serializeProposal({ toJSON: () => ({ id: "proposal", studentId: { id: "student", name: "Developer" }, solutionRequestId: { id: "requirement", title: "Planner" } }) });
  assert.equal(result.studentId, "student"); assert.equal(result.student.name, "Developer");
  assert.equal(result.solutionRequestId, "requirement"); assert.equal(result.solutionRequest.title, "Planner");
});
