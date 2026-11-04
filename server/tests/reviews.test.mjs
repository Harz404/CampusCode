import assert from "node:assert/strict";
import { test } from "node:test";
import mongoose from "mongoose";
import { Review } from "../dist/models/Review.js";
import { Contract } from "../dist/models/Contract.js";
import { User } from "../dist/models/User.js";
import { reviewInput, reviewRecipient, submitReview } from "../dist/services/reviewService.js";
import { contractReviews, receivedReviews } from "../dist/controllers/reviewController.js";

const client = "507f1f77bcf86cd799439011", student = "507f1f77bcf86cd799439012", id = "507f1f77bcf86cd799439013";
const input = { contractId: id, communication: 5, quality: 4, delivery: 3, professionalism: 4, content: " Useful feedback " };
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
function stubs() {
  const restore = [];
  return { set(object, key, value) { const previous = object[key]; restore.push(() => object[key] = previous); object[key] = value; }, restore() { restore.reverse().forEach(callback => callback()); } };
}

test("reviews derive scores and reject missing, fractional, out-of-range or empty feedback", () => {
  assert.equal(reviewInput({ ...input, overall: 5, isVerified: false }).overall, 4);
  assert.equal(reviewInput(input).content, "Useful feedback");
  for (const values of [{ quality: 0 }, { delivery: 6 }, { communication: 4.5 }, { professionalism: "5" }, { content: " " }, { content: "x".repeat(5001) }]) {
    assert.throws(() => reviewInput({ ...input, ...values }), error => error.status === 400);
  }
});

test("only opposite participants in completed contracts are eligible", () => {
  const contract = { clientId: client, studentId: student, status: "completed" };
  assert.equal(reviewRecipient(contract, client), student);
  assert.equal(reviewRecipient(contract, student), client);
  assert.throws(() => reviewRecipient(contract, id), error => error.status === 404);
  assert.throws(() => reviewRecipient({ ...contract, status: "active" }, client), error => error.status === 409);
  assert.throws(() => reviewRecipient({ ...contract, studentId: client }, client), error => error.status === 400);
});

test("review, derived profile totals and duplicate guard share the transaction", async () => {
  const stub = stubs();
  let duplicate = false, ended = 0, updates = 0;
  const session = { withTransaction: callback => callback(), endSession: async () => { ended++; } };
  const query = result => ({ session: async supplied => { assert.equal(supplied, session); return result; } });
  try {
    stub.set(Review, "init", async () => {});
    stub.set(mongoose, "startSession", async () => session);
    stub.set(Contract, "findById", () => query({ _id: id, clientId: client, studentId: student, status: "completed" }));
    stub.set(Review, "exists", filter => { assert.equal(filter.reviewerId, client); return query(duplicate); });
    stub.set(Review, "create", async (records, options) => {
      assert.equal(options.session, session);
      assert.equal(records[0].revieweeId, student);
      assert.equal(records[0].overall, 4);
      assert.equal(records[0].isVerified, true);
      return records;
    });
    stub.set(Review, "aggregate", () => query([{ rating: 4.25, count: 2 }]));
    stub.set(User, "updateOne", async (filter, update, options) => {
      assert.equal(String(filter._id), student); assert.equal(options.session, session);
      assert.deepEqual(update.$set, { "studentProfile.rating": 4.25, "studentProfile.reviewCount": 2 });
      updates++;
    });
    const saved = await submitReview(client, { ...input, revieweeId: client, overall: 5 });
    assert.equal(saved.overall, 4);
    duplicate = true;
    await assert.rejects(submitReview(client, input), error => error.status === 409);
    assert.equal(updates, 1); assert.equal(ended, 2);
  } finally { stub.restore(); }
});

test("contract review inspection rejects an outsider before loading feedback", async () => {
  const stub = stubs();
  try {
    stub.set(Contract, "findById", async () => ({ clientId: client, studentId: student }));
    const res = response();
    await contractReviews({ user: { id }, params: { contractId: id } }, res);
    assert.equal(res.statusCode, 404);
  } finally { stub.restore(); }
});

test("received review list is actor-scoped and summary covers all pages", async () => {
  const stub = stubs();
  try {
    stub.set(Review, "find", filter => {
      assert.equal(String(filter.revieweeId), student);
      return { sort: () => ({ skip: count => { assert.equal(count, 20); return { limit: count => { assert.equal(count, 20); return { populate: async () => [] }; } }; } }) };
    });
    stub.set(Review, "countDocuments", async () => 45);
    stub.set(Review, "aggregate", async () => [{ _id: 4, count: 45, totalRating: 180 }]);
    const res = response();
    await receivedReviews({ user: { id: student }, query: { page: "2", revieweeId: client } }, res);
    assert.equal(res.body.total, 45); assert.equal(res.body.summary.average, 4); assert.equal(res.body.hasMore, true);
    const invalid = response();
    await receivedReviews({ user: { id: student }, query: { page: "-1" } }, invalid);
    assert.equal(invalid.statusCode, 400);
  } finally { stub.restore(); }
});
