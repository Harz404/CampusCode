import assert from "node:assert/strict";
import { test } from "node:test";
import { Conversation } from "../dist/models/Conversation.js";
import { Message } from "../dist/models/Message.js";
import { User } from "../dist/models/User.js";
import { directConversation, messageContent } from "../dist/services/conversationService.js";
import { createConversation, sendMessage, editMessage, deleteMessage } from "../dist/controllers/messageController.js";

const actor = "507f1f77bcf86cd799439011", recipient = "507f1f77bcf86cd799439012", id = "507f1f77bcf86cd799439013";
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
function stubs() {
  const restore = [];
  return { set(object, key, value) { const previous = object[key]; restore.push(() => object[key] = previous); object[key] = value; }, restore() { restore.reverse().forEach(callback => callback()); } };
}

test("direct conversation creation validates recipients and reuses existing two-person history", async () => {
  const stub = stubs();
  try {
    await assert.rejects(directConversation(actor, actor), error => error.status === 400);
    await assert.rejects(directConversation(actor, { $ne: null }), error => error.status === 400);
    stub.set(User, "exists", async () => null);
    await assert.rejects(directConversation(actor, recipient), error => error.status === 404);
    stub.set(User, "exists", async () => true);
    const existing = { id, toJSON: () => ({ id }) };
    stub.set(Conversation, "findOne", async filter => { assert.deepEqual(filter.participants, { $all: [actor, recipient], $size: 2 }); return existing; });
    const res = response();
    await createConversation({ user: { id: actor }, body: { participantId: recipient } }, res);
    assert.deepEqual(res.body, { conversation: { id } });
  } finally { stub.restore(); }
});

test("direct conversation upserts use a normalized unique key and recover duplicate-key races", async () => {
  const stub = stubs();
  const existing = { id };
  try {
    stub.set(User, "exists", async () => true);
    stub.set(Conversation, "init", async () => {});
    stub.set(Conversation, "findOne", async filter => filter.directKey ? existing : null);
    stub.set(Conversation, "findOneAndUpdate", async (filter, update, options) => {
      assert.equal(filter.directKey, `${actor}:${recipient}`);
      assert.deepEqual(update.$setOnInsert.participants, [actor, recipient]);
      assert.equal(options.upsert, true);
      throw Object.assign(new Error("duplicate"), { code: 11000 });
    });
    assert.equal(await directConversation(recipient, actor), existing);
  } finally { stub.restore(); }
});

test("message input rejects blank/oversized content and unsupported attachment payloads", async () => {
  assert.throws(() => messageContent(" "), /Message/);
  assert.throws(() => messageContent("x".repeat(10001)), /Message/);
  assert.equal(messageContent(" hello "), "hello");
  const res = response();
  await sendMessage({ user: { id: actor }, body: { content: "File", type: "file", attachmentUrl: "data:fake" } }, res);
  assert.equal(res.statusCode, 400);
});

test("successful text send persists the authenticated sender and returns the chat DTO", async () => {
  const stub = stubs();
  try {
    stub.set(Conversation, "exists", async filter => { assert.equal(filter.participants, actor); return true; });
    stub.set(Conversation, "findByIdAndUpdate", async () => ({}));
    stub.set(Message.prototype, "save", async function () { return this; });
    const res = response();
    await sendMessage({ user: { id: actor }, body: { conversationId: id, content: " Hello ", senderId: recipient } }, res);
    assert.equal(res.statusCode, 201);
    assert.equal(String(res.body.senderId), actor);
    assert.equal(res.body.content, "Hello");
    assert.equal(res.body.type, "TEXT");
  } finally { stub.restore(); }
});

test("retries reuse the persisted message identifier and reject a changed payload", async () => {
  const stub = stubs();
  let stored = null, inserts = 0;
  try {
    stub.set(Conversation, "exists", async () => true);
    stub.set(Conversation, "findByIdAndUpdate", async () => ({}));
    stub.set(Message, "init", async () => {});
    stub.set(Message, "findOneAndUpdate", async (filter, update, options) => {
      assert.equal(filter.clientMessageId, "test-message-request-001");
      assert.equal(filter.senderId, actor);
      assert.equal(options.upsert, true);
      if (!stored) {
        inserts++;
        stored = { ...update.$setOnInsert, id, createdAt: new Date(), toJSON() { return { id: this.id, content: this.content, type: this.type }; } };
      }
      return stored;
    });
    for (let retry = 0; retry < 2; retry++) {
      const res = response();
      await sendMessage({ user: { id: actor }, body: { conversationId: id, content: "Hello", clientMessageId: "test-message-request-001" } }, res);
      assert.equal(res.statusCode, 201);
      assert.equal(res.body.id, id);
    }
    assert.equal(inserts, 1);
    const changed = response();
    await sendMessage({ user: { id: actor }, body: { conversationId: id, content: "Changed", clientMessageId: "test-message-request-001" } }, changed);
    assert.equal(changed.statusCode, 409);
  } finally { stub.restore(); }
});

test("edit and delete require both authorship and current conversation membership", async () => {
  const stub = stubs();
  try {
    stub.set(Message, "findOne", async filter => { assert.equal(filter.senderId, actor); assert.equal(filter.deletedAt, null); return null; });
    for (const handler of [editMessage, deleteMessage]) {
      const res = response();
      await handler({ user: { id: actor }, params: { messageId: id }, body: { content: "Changed" } }, res);
      assert.equal(res.statusCode, 404);
    }
    stub.set(Message, "findOne", async () => ({ conversationId: id }));
    stub.set(Conversation, "exists", async () => false);
    const res = response();
    await editMessage({ user: { id: actor }, params: { messageId: id }, body: { content: "Changed" } }, res);
    assert.equal(res.statusCode, 404);
  } finally { stub.restore(); }
});

test("author edits are persisted; deletion removes content while retaining an audit timestamp", async () => {
  const stub = stubs();
  try {
    stub.set(Message, "findOne", async () => ({ conversationId: id }));
    stub.set(Conversation, "exists", async () => true);
    stub.set(Message, "findOneAndUpdate", async (filter, update) => {
      assert.equal(filter.senderId, actor);
      if (update.$set.deletedAt) { assert.equal(update.$set.content, ""); assert.ok(update.$set.deletedAt instanceof Date); }
      else { assert.equal(update.$set.content, "Changed"); assert.ok(update.$set.editedAt instanceof Date); }
      return { toJSON: () => ({ id, content: update.$set.content, type: "text" }) };
    });
    const edit = response(); await editMessage({ user: { id: actor }, params: { messageId: id }, body: { content: " Changed " } }, edit);
    assert.equal(edit.body.content, "Changed");
    const deleted = response(); await deleteMessage({ user: { id: actor }, params: { messageId: id } }, deleted);
    assert.deepEqual(deleted.body, { success: true });
  } finally { stub.restore(); }
});
