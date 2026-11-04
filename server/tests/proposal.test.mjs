import assert from "node:assert/strict";
import { test } from "node:test";
import mongoose from "mongoose";
import { acceptProposalForClient, validateProposalTerms } from "../dist/services/proposalService.js";
import { Proposal } from "../dist/models/Proposal.js";
import { SolutionRequest } from "../dist/models/SolutionRequest.js";
import { Contract } from "../dist/models/Contract.js";
import { Project } from "../dist/models/Project.js";

const client = "507f1f77bcf86cd799439011";
const student = "507f1f77bcf86cd799439012";
const id = "507f1f77bcf86cd799439013";

test("proposal terms reject negative, missing and mismatched milestone amounts", () => {
  for (const [price, terms] of [[-1, [{ amount: -1 }]], [100, []], [100, [{ amount: 90 }]], [100, [{ amount: NaN }]]]) {
    assert.throws(() => validateProposalTerms(price, terms), /amounts/);
  }
  validateProposalTerms(100.01, [{ amount: 50 }, { amount: 50.01 }]);
});

test("acceptance is retry-safe, scopes the winner claim, and keeps every write in its session", async () => {
  const originals = [];
  const stub = (object, key, value) => { const previous = object[key]; originals.push(() => object[key] = previous); object[key] = value; };
  let ended = 0, contractCreates = 0, projectCreates = 0;
  let savedContract = null;
  const session = { withTransaction: callback => callback(), endSession: async () => { ended++; } };
  const query = value => ({ session: async supplied => { assert.equal(supplied, session); return value; } });
  const proposal = { _id: id, solutionRequestId: id, studentId: student, status: "pending", price: 100,
    technologies: ["React"], milestones: [{ title: "Delivery", amount: 100 }], save: async options => assert.equal(options.session, session) };
  const request = { _id: id, clientId: client, status: "open", title: "Project" };
  try {
    stub(mongoose, "startSession", async () => session);
    stub(Proposal, "findById", () => query(proposal));
    stub(SolutionRequest, "findById", () => query(request));
    stub(Contract, "findOne", () => query(savedContract));
    stub(SolutionRequest, "findOneAndUpdate", async (filter, update, options) => {
      assert.deepEqual(filter, { _id: id, clientId: client, status: "open" });
      assert.equal(options.session, session); return { ...request, status: "in_progress" };
    });
    stub(Project, "create", async (records, options) => { assert.equal(options.session, session); projectCreates++; return [{ _id: id }]; });
    stub(Contract, "create", async (records, options) => { assert.equal(options.session, session); contractCreates++; savedContract = { id, ...records[0] }; return [savedContract]; });
    stub(Proposal, "updateMany", async (filter, update, options) => { assert.equal(options.session, session); assert.equal(filter.status, "pending"); assert.equal(update.$set.status, "rejected"); });
    const result = await acceptProposalForClient(id, client);
    assert.equal(result.contract.projectId, id);
    assert.equal(result.contract.status, "created");
    assert.equal(proposal.status, "accepted");
    assert.equal((await acceptProposalForClient(id, client)).contract, savedContract);
    assert.equal(contractCreates, 1); assert.equal(projectCreates, 1);
    await assert.rejects(acceptProposalForClient(id, student), error => error.status === 404);
    savedContract = null; proposal.status = "pending"; request.status = "in_progress";
    await assert.rejects(acceptProposalForClient(id, client), error => error.status === 409);
    assert.equal(ended, 4);
  } finally { originals.reverse().forEach(restore => restore()); }
});
