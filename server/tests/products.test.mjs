import assert from "node:assert/strict";
import { test } from "node:test";
import { Product } from "../dist/models/Product.js";
import { productInput, validateSubmission, moderationTransition } from "../dist/services/productService.js";
import { createProduct, getProducts, getProductByIdOrSlug, updateProduct, submitProduct, serializeProduct } from "../dist/controllers/productController.js";
import { updateProductStatus } from "../dist/controllers/adminController.js";
const actor = "507f1f77bcf86cd799439011", id = "507f1f77bcf86cd799439012";
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
function stubs() { const restore = []; return { set(object, key, value) { const previous = object[key]; restore.push(() => object[key] = previous); object[key] = value; }, restore() { restore.reverse().forEach(callback => callback()); } }; }
const valid = { name: "Product", description: "Useful software", category: "web", isFree: false, price: 100, documentation: "Setup instructions", githubUrl: "https://github.com/example/project" };

test("products validate price, URLs, arrays, free pricing and submission readiness", () => {
  for (const changes of [{ price: -1 }, { price: "100" }, { isFree: "false" }, { githubUrl: "javascript:alert(1)" }, { tags: [{ $ne: null }] }, { screenshots: ["data:image/svg+xml;anything"] }]) {
    assert.throws(() => productInput({ ...valid, ...changes }, true), error => error.status === 400);
  }
  assert.equal(productInput({ ...valid, isFree: true }).price, 0);
  assert.throws(() => validateSubmission({ ...valid, price: 0 }), /positive price/);
  assert.throws(() => validateSubmission({ ...valid, documentation: "" }), /documentation/);
  validateSubmission(valid);
});

test("new products are drafts without invented review or quality scores", async () => {
  const stub = stubs();
  try {
    stub.set(Product.prototype, "save", async function () { return this; });
    const res = response(); await createProduct({ user: { id: actor, role: "student" }, body: { ...valid, status: "published", rating: 5 } }, res);
    assert.equal(res.statusCode, 201); assert.equal(res.body.status, "draft");
    assert.equal(res.body.rating, 0); assert.equal(res.body.reviewCount, 0);
    const publicData = serializeProduct({ sellerId: actor, toJSON: () => ({ isFree: false, rating: 5, reviewCount: 10, qualityScore: { overall: 95 }, driveUrl: "private" }) });
    assert.equal(publicData.rating, 0); assert.equal(publicData.reviewCount, 0); assert.equal(publicData.qualityScore, undefined);
    assert.equal(publicData.driveUrl, undefined);
  } finally { stub.restore(); }
});

test("public catalog filtering cannot reveal drafts and treats search syntax literally", async () => {
  const stub = stubs();
  try {
    stub.set(Product, "find", filter => {
      assert.equal(filter.status, "published");
      assert.equal(filter.moderationVerified, true);
      assert.equal(filter.category.test("web["), true);
      assert.equal(filter.$or[0].name.test("[demo]"), true);
      assert.equal(filter.$or[0].name.test("d"), false);
      return { sort: () => ({ populate: async () => [] }) };
    });
    const res = response(); await getProducts({ query: { category: "web[", search: "[demo]" } }, res);
    assert.equal(res.statusCode, 200);
  } finally { stub.restore(); }
});

test("private product views are refused before incrementing any counters", async () => {
  const stub = stubs();
  try {
    stub.set(Product, "updateOne", () => assert.fail("Private product view was recorded"));
    for (const status of ["draft", "published"]) {
      stub.set(Product, "findById", () => ({ populate: async () => ({ status, sellerId: actor, moderationVerified: false }) }));
      const res = response(); await getProductByIdOrSlug({ params: { id } }, res);
      assert.equal(res.statusCode, 404);
    }
  } finally { stub.restore(); }
});

test("editing a listing returns it to a seller-owned draft and blocks stale moderation", async () => {
  const stub = stubs();
  try {
    stub.set(Product, "findOneAndUpdate", async (filter, update) => {
      assert.equal(filter.sellerId, actor); assert.deepEqual(filter.status, { $ne: "archived" });
      assert.equal(update.$set.status, "draft"); assert.equal(update.$set.name, "Updated");
      return { toJSON: () => ({ id, status: "draft" }) };
    });
    const res = response(); await updateProduct({ params: { id }, user: { id: actor }, body: { name: "Updated" } }, res);
    assert.equal(res.body.status, "draft");
    stub.set(Product, "findById", async () => ({ status: "pending_review", updatedAt: new Date(), toObject: () => valid }));
    stub.set(Product, "findOneAndUpdate", async (filter, update) => {
      assert.equal(filter.status, "pending_review"); assert.ok(filter.updatedAt);
      assert.equal(update.$push.moderationHistory.actorId, actor); return null;
    });
    const stale = response(); await updateProductStatus({ params: { id }, user: { id: actor, role: "admin" }, body: { status: "published" } }, stale);
    assert.equal(stale.statusCode, 409);
  } finally { stub.restore(); }
});

test("submission checks ownership, readiness and status before moving into review", async () => {
  const stub = stubs();
  try {
    const updatedAt = new Date();
    stub.set(Product, "findOne", async filter => { assert.equal(filter.sellerId, actor); return { _id: id, status: "draft", updatedAt, toObject: () => valid }; });
    stub.set(Product, "findOneAndUpdate", async (filter, update) => {
      assert.equal(filter.updatedAt, updatedAt); assert.equal(filter.status, "draft"); assert.equal(update.$set.status, "pending_review");
      return { sellerId: actor, toJSON: () => ({ id, status: "pending_review" }) };
    });
    const res = response(); await submitProduct({ params: { id }, user: { id: actor } }, res);
    assert.equal(res.body.status, "pending_review");
  } finally { stub.restore(); }
});

test("moderation forbids publishing drafts and requires reasons for rejection and archive", () => {
  assert.throws(() => moderationTransition("draft", "published", ""), error => error.status === 409);
  assert.throws(() => moderationTransition("pending_review", "rejected", ""), error => error.status === 400);
  assert.throws(() => moderationTransition("published", "archived", ""), error => error.status === 400);
  assert.deepEqual(moderationTransition("pending_review", "rejected", " Missing docs "), { status: "rejected", reason: "Missing docs" });
});
