import assert from "node:assert/strict";
import { test } from "node:test";
import { access, allowFields } from "../dist/middleware/access.js";
import { Project } from "../dist/models/Project.js";
import { Product } from "../dist/models/Product.js";
import { Conversation } from "../dist/models/Conversation.js";
import { getMessages, sendMessage, markAsRead } from "../dist/controllers/messageController.js";
import { serializeProduct } from "../dist/controllers/productController.js";
import { getProjects } from "../dist/controllers/projectController.js";

const owner = "507f1f77bcf86cd799439011";
const member = "507f1f77bcf86cd799439012";
const outsider = "507f1f77bcf86cd799439013";
const recordId = "507f1f77bcf86cd799439014";
function response() { return { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } }; }

test("project access distinguishes owner, member, outsider and anonymous", async () => {
  const original = Project.findById;
  Project.findById = async () => ({ ownerId: owner, members: [{ user: member }] });
  try {
    for (const [actor, ownerOnly, expected] of [[owner, true, 200], [member, false, 200], [member, true, 404], [outsider, false, 404], [null, false, 401]]) {
      const res = response(); let passed = false;
      await access("project", ownerOnly)({ user: actor ? { id: actor } : undefined, params: { id: recordId } }, res, error => { assert.ifError(error); passed = true; });
      assert.equal(res.statusCode, expected);
      assert.equal(passed, expected === 200);
    }
  } finally { Project.findById = original; }
});

test("protected fields cannot be edited through generic updates", () => {
  for (const kind of ["project", "task", "product", "solution"]) {
    for (const body of [{ ownerId: outsider }, { sellerId: outsider }, { "members.0.role": "owner" }, { $set: { role: "admin" } }]) {
      const res = response();
      allowFields(kind)({ body }, res, () => assert.fail("Protected mutation allowed"));
      assert.equal(res.statusCode, 400);
    }
  }
});

test("product ownership and public paid metadata are protected", async () => {
  const original = Product.findById;
  Product.findById = async () => ({ sellerId: owner });
  try {
    const res = response();
    await access("product", true)({ user: { id: outsider }, params: { id: recordId } }, res, () => assert.fail("Outsider allowed"));
    assert.equal(res.statusCode, 404);
    const product = { sellerId: owner, toJSON: () => ({ name: "Paid product", isFree: false, driveUrl: "private", githubUrl: "private", downloadUrl: "private", documentation: "private" }) };
    assert.equal(serializeProduct(product).driveUrl, undefined);
    assert.equal(serializeProduct(product, outsider).githubUrl, undefined);
    assert.equal(serializeProduct(product, owner).downloadUrl, "private");
  } finally { Product.findById = original; }
});

test("outsiders cannot read, send to or mark another conversation read", async () => {
  const original = Conversation.exists;
  Conversation.exists = async filter => { assert.equal(filter.participants, outsider); return null; };
  try {
    for (const handler of [getMessages, sendMessage, markAsRead]) {
      const res = response();
      await handler({ user: { id: outsider }, params: { conversationId: recordId }, body: { conversationId: recordId, content: "Hello" } }, res);
      assert.equal(res.statusCode, 404);
    }
  } finally { Conversation.exists = original; }
});

test("project lists retain actor scope when a different user ID is requested", async () => {
  const original = Project.find;
  const { Task } = await import("../dist/models/Task.js");
  const originalTasks = Task.find;
  Project.find = filter => {
    assert.deepEqual(filter.$or, [{ ownerId: owner }, { "members.user": owner }]);
    return { sort: () => ({ populate: async () => [] }) };
  };
  Task.find = async () => [];
  try {
    const res = response();
    await getProjects({ user: { id: owner }, query: { userId: outsider } }, res);
    assert.equal(res.statusCode, 200);
  } finally { Project.find = original; Task.find = originalTasks; }
});
