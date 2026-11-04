import { Session } from "../dist/models/Session.js";
import { validateNewPassword } from "../dist/services/sessionService.js";
import assert from "node:assert/strict";
import { test } from "node:test";
import jwt from "jsonwebtoken";
import { register, demoLogin } from "../dist/controllers/authController.js";
import { createPaymentOrder, requestPayout } from "../dist/controllers/paymentController.js";
import { requireAuth, requireAdmin } from "../dist/middleware/auth.js";
import { getJwtSecret } from "../dist/config/security.js";
import { User } from "../dist/models/User.js";

function response() {
  return { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}

test("public registration rejects privileged and malformed roles before database access", async () => {
  for (const role of ["admin", "ADMIN", "unknown", { value: "admin" }]) {
    const res = response();
    await register({ body: { role, name: "User", email: "test@example.com", password: "password123" } }, res);
    assert.equal(res.statusCode, 400);
  }
});

test("privileged demo login is disabled and payments require explicit simulation acknowledgement", async () => {
  for (const [handler, status] of [[demoLogin, 404], [createPaymentOrder, 400], [requestPayout, 400]]) {
    const res = response();
    await handler({ user: { id: "507f1f77bcf86cd799439011" }, body: { role: "admin", amount: 1000 } }, res);
    assert.equal(res.statusCode, status);
    assert.equal(res.body.token, undefined);
  }
});

test("missing signing secret fails closed", () => {
  const previous = process.env.JWT_SECRET;
  try {
    delete process.env.JWT_SECRET;
    assert.throws(getJwtSecret, /JWT_SECRET/);
  } finally {
    if (previous === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previous;
  }
});

test("authentication rejects invalid tokens and uses current database role rather than stale claims", async () => {
  const previousSecret = process.env.JWT_SECRET;
  const originalFind = User.findById;
  const originalSession = Session.findOne;
  process.env.JWT_SECRET = "isolated-test-secret";
  const id = "507f1f77bcf86cd799439011";
  try {
    let nextCalled = false;
    const invalid = response();
    await requireAuth({ headers: { authorization: "Bearer invalid" } }, invalid, () => { nextCalled = true; });
    assert.equal(invalid.statusCode, 401);
    assert.equal(nextCalled, false);

    User.findById = () => ({ select: async () => ({ id, name: "Student", email: "test@example.com", role: "student" }) });
    Session.findOne = async () => ({ authVersion: 0 });
    const token = jwt.sign({ id, role: "admin" }, process.env.JWT_SECRET, { jwtid: "isolated-session" });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = response();
    await requireAdmin(req, res, () => { nextCalled = true; });
    assert.equal(res.statusCode, 403);
    assert.equal(nextCalled, false);

    User.findById = () => ({ select: async () => null });
    const removed = response();
    await requireAuth(req, removed, () => assert.fail("Removed user authenticated"));
    assert.equal(removed.statusCode, 401);
  } finally {
    User.findById = originalFind;
    Session.findOne = originalSession;
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  }
});

test("password rules reject weak passwords and bcrypt-truncated Unicode input", () => {
  assert.throws(() => validateNewPassword("short"), /8 characters/);
  assert.throws(() => validateNewPassword("😀".repeat(20)), /72 UTF-8 bytes/);
  validateNewPassword("Correct horse battery staple");
});

test("registration rejects short passwords before accessing the database", async () => {
  const res = response();
  await register({ body: { name: "User", email: "user@test.invalid", password: "1234567", role: "student" } }, res);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /8 characters/);
});
