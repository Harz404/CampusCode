import { Product } from "../dist/models/Product.js";
import { Order } from "../dist/models/Order.js";
import { Transaction } from "../dist/models/Transaction.js";
import { DemoWallet } from "../dist/models/DemoWallet.js";
import { demoCheckout, demoPayout } from "../dist/services/demoPaymentService.js";
import { issueSession } from "../dist/services/sessionService.js";
import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server-core";
import { User } from "../dist/models/User.js";
import { SolutionRequest } from "../dist/models/SolutionRequest.js";
import { Proposal } from "../dist/models/Proposal.js";
import { Contract } from "../dist/models/Contract.js";
import { Project } from "../dist/models/Project.js";
import { Review } from "../dist/models/Review.js";
import { Conversation } from "../dist/models/Conversation.js";
import { Message } from "../dist/models/Message.js";
import { acceptProposalForClient } from "../dist/services/proposalService.js";
import { actOnMilestone } from "../dist/services/milestoneService.js";
import { submitReview } from "../dist/services/reviewService.js";
import { directConversation } from "../dist/services/conversationService.js";
import { sendMessage } from "../dist/controllers/messageController.js";

// This suite never reads MONGODB_URI, imports db.ts, or accepts an external URI.
// Every collection below belongs to a freshly spawned loopback replica set.
test("disposable MongoDB replica-set integration", { timeout: 300000 }, async t => {
  const repl = await MongoMemoryReplSet.create({
    binary: { version: "7.0.24", downloadDir: path.resolve(fileURLToPath(new URL("../node_modules/.cache/mongodb-binaries", import.meta.url))) },
    replSet: { count: 1, storageEngine: "wiredTiger" },
  });
  try {
    const uri = repl.getUri(`campuscode_test_${randomUUID().replaceAll("-", "")}`);
    assert.equal(new URL(uri).hostname, "127.0.0.1");
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    await Promise.all(mongoose.modelNames().map(name => mongoose.model(name).init()));
    const reset = async () => Promise.all(mongoose.modelNames().map(name => mongoose.model(name).deleteMany({})));
    const fixture = async () => {
      const [client, student, competitor] = await User.create([
        { name: "Client", email: "client@test.invalid", role: "client", clientProfile: {} },
        { name: "Student", email: "student@test.invalid", role: "student", studentProfile: {} },
        { name: "Competitor", email: "competitor@test.invalid", role: "student", studentProfile: {} },
      ]);
      const request = await SolutionRequest.create({ title: "Build a tool", description: "Useful application", category: "web", clientId: client._id });
      const proposals = await Proposal.create([student, competitor].map(user => ({ solutionRequestId: request._id, studentId: user._id, content: "Implementation plan", price: 100, estimatedDelivery: 7, milestones: [{ title: "Delivery", amount: 100, durationDays: 7 }] })));
      return { client, student, competitor, request, proposals };
    };
    const finish = async (contract, client, student) => {
      const milestoneId = String(contract.milestones[0]._id);
      await actOnMilestone(contract.id, milestoneId, student.id, { action: "start" });
      await actOnMilestone(contract.id, milestoneId, student.id, { action: "submit", notes: "Implemented and tested", repoLink: "https://example.com/delivery" });
      return actOnMilestone(contract.id, milestoneId, client.id, { action: "approve" });
    };
    const feedback = (contractId, rating = 5) => ({ contractId, communication: rating, quality: rating, delivery: rating, professionalism: rating, content: "Completed work feedback" });

    await t.test("competing proposal acceptances have one winner and retries reuse one contract", async () => {
      await reset(); const { client, request, proposals } = await fixture();
      const results = await Promise.allSettled(proposals.map(proposal => acceptProposalForClient(proposal.id, client.id)));
      assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
      assert.equal(results.find(result => result.status === "rejected").reason.status, 409);
      assert.equal(await Contract.countDocuments(), 1); assert.equal(await Project.countDocuments(), 1);
      assert.equal(await Proposal.countDocuments({ status: "accepted" }), 1);
      assert.equal(await Proposal.countDocuments({ status: "rejected" }), 1);
      assert.equal((await SolutionRequest.findById(request._id)).status, "in_progress");
      const winner = results.find(result => result.status === "fulfilled").value;
      const retries = await Promise.all(Array.from({ length: 4 }, () => acceptProposalForClient(winner.proposal.id, client.id)));
      assert.ok(retries.every(result => result.contract.id === winner.contract.id));
      assert.equal(await Contract.countDocuments(), 1); assert.equal(await Project.countDocuments(), 1);
    });

    await t.test("a failure after claiming the request rolls back request, proposal and created project", async () => {
      await reset(); const { client, request, proposals } = await fixture();
      // Simulate malformed legacy data that fails contract validation after the
      // request and project writes, without replacing any production service.
      await Proposal.collection.updateOne({ _id: proposals[0]._id }, { $set: { "milestones.0.title": "" } });
      await assert.rejects(acceptProposalForClient(proposals[0].id, client.id));
      assert.equal((await SolutionRequest.findById(request._id)).status, "open");
      assert.equal((await Proposal.findById(proposals[0]._id)).status, "pending");
      assert.equal(await Project.countDocuments(), 0); assert.equal(await Contract.countDocuments(), 0);
    });

    await t.test("concurrent final approvals record one decision and durable completion", async () => {
      await reset(); const { client, student, request, proposals } = await fixture();
      const { contract } = await acceptProposalForClient(proposals[0].id, client.id);
      const milestoneId = String(contract.milestones[0]._id);
      await actOnMilestone(contract.id, milestoneId, student.id, { action: "start" });
      await actOnMilestone(contract.id, milestoneId, student.id, { action: "submit", notes: "Delivered" });
      const results = await Promise.allSettled(Array.from({ length: 2 }, () => actOnMilestone(contract.id, milestoneId, client.id, { action: "approve" })));
      assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
      assert.equal(results.find(result => result.status === "rejected").reason.status, 409);
      const saved = await Contract.findById(contract._id);
      assert.equal(saved.status, "completed");
      assert.equal(saved.milestones[0].history.filter(event => event.action === "approve").length, 1);
      assert.equal((await SolutionRequest.findById(request._id)).status, "completed");
    });

    await t.test("duplicate reviews cannot increase review count twice", async () => {
      await reset(); const { client, student, proposals } = await fixture();
      const { contract } = await acceptProposalForClient(proposals[0].id, client.id);
      await finish(contract, client, student);
      const results = await Promise.allSettled(Array.from({ length: 2 }, () => submitReview(client.id, feedback(contract.id))));
      assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
      assert.equal(results.find(result => result.status === "rejected").reason.status, 409);
      assert.equal(await Review.countDocuments(), 1);
      const saved = await User.findById(student._id);
      assert.equal(saved.studentProfile.reviewCount, 1); assert.equal(saved.studentProfile.rating, 5);
    });

    await t.test("concurrent distinct reviews produce correct aggregate ratings", async () => {
      await reset(); const { client, student, request, proposals } = await fixture();
      const first = (await acceptProposalForClient(proposals[0].id, client.id)).contract;
      await finish(first, client, student);
      const secondRequest = await SolutionRequest.create({ title: "Another tool", description: "Second engagement", category: "web", clientId: client._id });
      const secondProposal = await Proposal.create({ solutionRequestId: secondRequest._id, studentId: student._id, content: "Second plan", price: 100, estimatedDelivery: 7, milestones: [{ title: "Delivery", amount: 100, durationDays: 7 }] });
      const second = (await acceptProposalForClient(secondProposal.id, client.id)).contract;
      await finish(second, client, student);
      await Promise.all([submitReview(client.id, feedback(first.id, 4)), submitReview(client.id, feedback(second.id, 5))]);
      const saved = await User.findById(student._id);
      assert.equal(saved.studentProfile.reviewCount, 2); assert.equal(saved.studentProfile.rating, 4.5);
    });

    await t.test("concurrent conversation creation and message retries use their actual unique indexes", async () => {
      await reset(); const { client, student } = await fixture();
      const conversations = await Promise.all(Array.from({ length: 6 }, () => directConversation(client.id, student.id)));
      assert.equal(new Set(conversations.map(conversation => conversation.id)).size, 1);
      assert.equal(await Conversation.countDocuments(), 1);
      const messageId = randomUUID();
      const responses = await Promise.all(Array.from({ length: 6 }, async () => {
        const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
        await sendMessage({ user: { id: client.id }, body: { conversationId: conversations[0].id, content: "One message", clientMessageId: messageId } }, res);
        return res;
      }));
      assert.ok(responses.every(res => res.statusCode === 201));
      assert.equal(new Set(responses.map(res => res.body.id)).size, 1);
      assert.equal(await Message.countDocuments(), 1);
    });

    await t.test("real authenticated HTTP routes enforce ownership and moderation across persisted requests", async () => {
      await reset(); const { client, student, competitor } = await fixture();
      const previousSecret = process.env.JWT_SECRET;
      process.env.JWT_SECRET = "disposable-integration-secret-never-used-by-the-app";
      const [{ default: express }, { default: jwt }, { default: projectRoutes }, { default: productRoutes }, { default: adminRoutes }, { default: authRoutes }] = await Promise.all([
        import("express"), import("jsonwebtoken"), import("../dist/routes/projectRoutes.js"), import("../dist/routes/productRoutes.js"), import("../dist/routes/adminRoutes.js"), import("../dist/routes/authRoutes.js"),
      ]);
      const admin = await User.create({ name: "Test Admin", email: "admin@test.invalid", role: "admin" });
      const app = express(); app.use(express.json());
      app.use("/api/auth", authRoutes); app.use("/api/projects", projectRoutes); app.use("/api/products", productRoutes); app.use("/api/admin", adminRoutes);
      const server = app.listen(0, "127.0.0.1");
      await new Promise(resolve => server.once("listening", resolve));
      const base = `http://127.0.0.1:${server.address().port}`;
      const request = async (url, actor, method = "GET", body) => {
        const res = await fetch(base + url, { method, headers: { "Content-Type": "application/json", ...(actor ? { Authorization: `Bearer ${await issueSession(actor)}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
        return { status: res.status, data: await res.json() };
      };
      try {
        assert.equal((await request("/api/auth/register", null, "POST", { name: "Intruder", email: "intruder@test.invalid", password: "password123", role: "admin" })).status, 400);
        assert.equal((await request("/api/projects", null)).status, 401);
        const created = await request("/api/projects", student, "POST", { name: "Persisted project" });
        assert.equal(created.status, 201);
        const projectId = created.data.id;
        const task = await request(`/api/projects/${projectId}/tasks`, student, "POST", { title: "Real task", subtasks: [{ title: "Check behavior", completed: false }] });
        assert.equal(task.status, 201);
        assert.equal((await request(`/api/projects/${projectId}/tasks/${task.data.id}`, competitor, "PATCH", { status: "done" })).status, 404);
        assert.equal((await request(`/api/projects/${projectId}`, competitor)).status, 404);
        assert.equal((await request(`/api/projects/${projectId}`, student, "PATCH", { ownerId: competitor.id })).status, 400);
        assert.equal((await request(`/api/projects/${projectId}/tasks/${task.data.id}`, student, "PATCH", { status: "done" })).status, 200);
        const loaded = await request(`/api/projects/${projectId}`, student);
        assert.equal(loaded.data.progress, 100); assert.equal(loaded.data.tasks[0].status, "done");
        assert.equal(loaded.data.tasks[0].subtasks[0].title, "Check behavior");
        const product = await request("/api/products", student, "POST", { name: "Real catalog product", description: "Software for testing", category: "web", price: 100, isFree: false, documentation: "Setup steps", githubUrl: "https://example.com/private-source" });
        assert.equal(product.status, 201); assert.equal(product.data.status, "draft");
        const productId = product.data.id;
        assert.equal((await request(`/api/products/${productId}`, null)).status, 404);
        assert.equal((await request(`/api/products/${productId}/submit`, competitor, "POST")).status, 404);
        assert.equal((await request(`/api/products/${productId}/submit`, student, "POST")).data.status, "pending_review");
        assert.equal((await request(`/api/admin/products/${productId}/status`, client, "PATCH", { status: "published" })).status, 403);
        const approved = await request(`/api/admin/products/${productId}/status`, admin, "PATCH", { status: "published" });
        assert.equal(approved.status, 200); assert.equal(approved.data.moderationVerified, true);
        const publicProduct = await request(`/api/products/${productId}`, null);
        assert.equal(publicProduct.status, 200); assert.equal(publicProduct.data.githubUrl, undefined);
        assert.equal((await request("/api/products", null)).data.products.length, 1);
        assert.equal((await request(`/api/products/${productId}`, student, "PATCH", { name: "Revised listing" })).data.status, "draft");
        assert.equal((await request(`/api/products/${productId}`, null)).status, 404);
      } finally {
        await new Promise(resolve => server.close(resolve));
        if (previousSecret === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = previousSecret;
      }
    });

    await t.test("logout, password change and logout-all revoke real sessions across HTTP requests", async () => {
      await reset();
      const previousSecret = process.env.JWT_SECRET;
      process.env.JWT_SECRET = "disposable-session-test-secret-never-used-by-the-app";
      const [{ default: express }, { default: authRoutes }, { default: bcrypt }] = await Promise.all([import("express"), import("../dist/routes/authRoutes.js"), import("bcryptjs")]);
      const app = express(); app.use(express.json()); app.use("/api/auth", authRoutes);
      const server = app.listen(0, "127.0.0.1");
      await new Promise(resolve => server.once("listening", resolve));
      const base = `http://127.0.0.1:${server.address().port}`;
      const request = async (url, token, method = "GET", body) => {
        const res = await fetch(base + url, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
        return { status: res.status, data: await res.json() };
      };
      try {
        const created = await request("/api/auth/register", null, "POST", { name: "Account", email: "account@test.invalid", password: "OriginalPassword123", role: "student" });
        assert.equal(created.status, 201); assert.ok(created.data.token);
        assert.equal(created.data.user.password, undefined); assert.equal(created.data.user.authVersion, undefined);
        const first = created.data.token;
        const loggedIn = await request("/api/auth/login", null, "POST", { email: "account@test.invalid", password: "OriginalPassword123" });
        const second = loggedIn.data.token;
        assert.equal((await request("/api/auth/profile", first)).status, 200);
        assert.equal((await request("/api/auth/logout", first, "POST")).status, 200);
        assert.equal((await request("/api/auth/profile", first)).status, 401);
        assert.equal((await request("/api/auth/profile", second)).status, 200);
        assert.equal((await request("/api/auth/change-password", second, "POST", { currentPassword: "WrongPassword", newPassword: "NewPassword1234" })).status, 403);
        assert.equal((await request("/api/auth/profile", second)).status, 200);
        assert.equal((await request("/api/auth/change-password", second, "POST", { currentPassword: "OriginalPassword123", newPassword: "NewPassword1234" })).status, 200);
        assert.equal((await request("/api/auth/profile", second)).status, 401);
        assert.equal((await request("/api/auth/login", null, "POST", { email: "account@test.invalid", password: "OriginalPassword123" })).status, 401);
        const afterChange = await request("/api/auth/login", null, "POST", { email: "account@test.invalid", password: "NewPassword1234" });
        assert.equal(afterChange.status, 200);
        const account = await User.findOne({ email: "account@test.invalid" });
        assert.ok(await bcrypt.compare("NewPassword1234", account.password));
        const another = await issueSession(account);
        assert.equal((await request("/api/auth/logout-all", afterChange.data.token, "POST")).status, 200);
        assert.equal((await request("/api/auth/profile", another)).status, 401);
        assert.equal((await request("/api/auth/profile", afterChange.data.token)).status, 401);
        const { default: jwt } = await import("jsonwebtoken");
        const legacy = jwt.sign({ id: account.id }, process.env.JWT_SECRET);
        assert.equal((await request("/api/auth/profile", legacy)).status, 401);
      } finally {
        await new Promise(resolve => server.close(resolve));
        if (previousSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = previousSecret;
      }
    });
    await t.test("client requirement through student proposal, workspace, revisions, completion and review works over HTTP", async () => {
      await reset(); const { client, student, competitor } = await fixture();
      const previousSecret = process.env.JWT_SECRET;
      process.env.JWT_SECRET = "core-flow-disposable-integration-secret";
      const [{ default: express }, { default: solutions }, { default: proposals }, { default: contracts }, { default: projects }, { default: reviews }] = await Promise.all([
        import("express"), import("../dist/routes/solutionRoutes.js"), import("../dist/routes/proposalRoutes.js"), import("../dist/routes/contractRoutes.js"), import("../dist/routes/projectRoutes.js"), import("../dist/routes/reviewRoutes.js"),
      ]);
      const app = express(); app.use(express.json());
      app.use("/api/solutions", solutions); app.use("/api/proposals", proposals); app.use("/api/contracts", contracts); app.use("/api/projects", projects); app.use("/api/reviews", reviews);
      const server = app.listen(0, "127.0.0.1");
      await new Promise(resolve => server.once("listening", resolve));
      const base = `http://127.0.0.1:${server.address().port}`;
      const tokens = new Map(await Promise.all([client, student, competitor].map(async user => [user.id, await issueSession(user)])));
      const call = async (url, actor, method = "GET", body, expected = 200) => {
        const result = await fetch(base + url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokens.get(actor.id)}` }, ...(body ? { body: JSON.stringify(body) } : {}) });
        const data = await result.json(); assert.equal(result.status, expected, `${method} ${url}: ${JSON.stringify(data)}`); return data;
      };
      try {
        const brief = { title: "Build a campus planner", description: "Plan and track campus events", category: "web", isFixedPrice: true, budgetMin: 100, budgetMax: 200, preferredTechnologies: ["React"] };
        await call("/api/solutions", student, "POST", brief, 403);
        await call("/api/solutions", client, "POST", { ...brief, budgetMin: 300 }, 400);
        const requirement = await call("/api/solutions", client, "POST", brief, 201);
        const bid = { solutionRequestId: requirement.id, content: "I will build and document the planner", price: 150, estimatedDelivery: 7, milestones: [{ title: "Prototype", amount: 50, durationDays: 3 }, { title: "Final delivery", amount: 100, durationDays: 4 }] };
        const proposal = await call("/api/proposals", student, "POST", bid, 201);
        await call("/api/proposals", student, "POST", bid, 409);
        const ownerDetail = await call(`/api/solutions/${requirement.id}`, client);
        assert.equal(ownerDetail.proposals[0].student.name, student.name);
        assert.equal(ownerDetail.proposals[0].studentId, student.id);
        assert.equal((await call(`/api/solutions/${requirement.id}`, competitor)).proposals.length, 0);
        const inbox = await call(`/api/proposals?userId=${client.id}`, client);
        assert.ok(inbox.proposals.some(item => item.id === proposal.id && item.solutionRequest.title === brief.title));
        await call(`/api/proposals/${proposal.id}/accept`, student, "POST", {}, 404);
        const accepted = await call(`/api/proposals/${proposal.id}/accept`, client, "POST", {});
        let contract = await call(`/api/contracts/${accepted.contractId}`, client);
        assert.equal(contract.solutionRequest.title, brief.title);
        const clientProjects = await call(`/api/projects?userId=${client.id}`, client);
        assert.ok(clientProjects.projects.some(project => project.id === contract.projectId));
        const task = await call(`/api/projects/${contract.projectId}/tasks`, student, "POST", { title: "Build prototype" }, 201);
        await call(`/api/projects/${contract.projectId}/tasks/${task.id}`, client, "PATCH", { status: "done" }, 404);
        await call(`/api/projects/${contract.projectId}/tasks/${task.id}`, student, "PATCH", { status: "done" });
        assert.equal((await call(`/api/projects/${contract.projectId}`, client)).progress, 100);
        for (let index = 0; index < contract.milestones.length; index++) {
          const milestoneId = contract.milestones[index].id;
          const action = (actor, value, extra = {}) => call(`/api/contracts/${contract.id}/milestones`, actor, "POST", { milestoneId, action: value, ...extra });
          await action(student, "start");
          await action(student, "submit", { notes: "Delivered implementation", repoLink: "https://example.com/delivery" });
          if (index === 0) { await action(client, "request_revision", { notes: "Improve event filtering" }); await action(student, "submit", { notes: "Filtering fixed" }); }
          contract = await action(client, "approve");
        }
        assert.equal((await call(`/api/contracts/${contract.id}`, student)).status, "completed");
        assert.equal((await call(`/api/solutions/${requirement.id}`, client)).status, "completed");
        await call("/api/reviews", client, "POST", feedback(contract.id), 201);
        assert.equal((await call("/api/reviews", student)).summary.count, 1);
        assert.equal((await SolutionRequest.findById(requirement.id)).proposalCount, 1);
      } finally {
        await new Promise(resolve => server.close(resolve));
        if (previousSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = previousSecret;
      }
    });

    await t.test("demo checkout preserves price, access and wallet consistency under retries", async () => {
      await reset(); const { client, student, competitor } = await fixture();
      const product = await Product.create({ name: "Demo tool", slug: "demo-tool", description: "A useful tool", shortDescription: "Tool", category: "web", sellerId: student.id, price: 100, isFree: false, status: "published", moderationVerified: true, githubUrl: "https://example.com/source", license: "MIT" });
      const input = outcome => ({ demo: true, requestId: randomUUID(), productId: product.id, outcome, amount: 1 });
      await assert.rejects(demoCheckout(student.id, input("success")), error => error.status === 400);
      const failed = await demoCheckout(client.id, input("failed"));
      const cancelled = await demoCheckout(client.id, input("cancelled"));
      assert.equal(failed.status, "failed"); assert.equal(cancelled.status, "cancelled");
      assert.equal(await DemoWallet.countDocuments(), 0);
      assert.equal(await Transaction.countDocuments(), 0);
      const orders = await Promise.all(Array.from({length: 3}, () => demoCheckout(client.id, input("success"))));
      assert.ok(orders.every(order => order.id === orders[0].id));
      assert.equal(orders[0].amount, 100);
      assert.equal((await DemoWallet.findOne({ userId: student.id })).balance, 9000);
      assert.equal((await Product.findById(product.id)).salesCount, 1);
      assert.equal(await Transaction.countDocuments(), 1);
      await Product.updateOne({ _id: product.id }, { price: 200, githubUrl: "https://example.com/changed", status: "archived" });
      assert.equal((await demoCheckout(client.id, input("success"))).id, orders[0].id);
      const snapshot = await Order.findById(orders[0].id).select("+delivery");
      assert.equal(snapshot.delivery.githubUrl, "https://example.com/source");
      assert.equal(snapshot.amount, 100);
      await assert.rejects(demoPayout(student.id, { demo: true, requestId: randomUUID(), amount: 91 }), error => error.status === 409);
      const payout = { demo: true, requestId: randomUUID(), amount: 40 };
      const first = await demoPayout(student.id, payout);
      assert.equal((await demoPayout(student.id, payout)).id, first.id);
      await assert.rejects(demoPayout(student.id, { ...payout, amount: 30 }), error => error.status === 409);
      assert.equal((await DemoWallet.findOne({ userId: student.id })).balance, 5000);
      const withdrawals = await Promise.allSettled(Array.from({length: 2}, () => demoPayout(student.id, { demo: true, requestId: randomUUID(), amount: 40 })));
      assert.equal(withdrawals.filter(r => r.status === "fulfilled").length, 1);
      assert.equal((await DemoWallet.findOne({ userId: student.id })).balance, 1000);

      const express = (await import("express")).default;
      const routes = (await import("../dist/routes/paymentRoutes.js")).default;
      const oldSecret = process.env.JWT_SECRET; process.env.JWT_SECRET = "integration-demo-payment-secret";
      const app = express(); app.use(express.json()); app.use("/api/payments", routes);
      const server = app.listen(0, "127.0.0.1"); await new Promise(resolve => server.once("listening", resolve));
      try {
        const token = await issueSession(client), otherToken = await issueSession(competitor);
        const base = "http://127.0.0.1:" + server.address().port + "/api/payments";
        const get = (url, auth = token) => fetch(base + url, { headers: { Authorization: "Bearer " + auth } });
        assert.equal((await get("/orders/" + orders[0].id + "/delivery", otherToken)).status, 404);
        assert.equal((await get("/orders/" + failed.id + "/delivery")).status, 404);
        assert.equal((await get("/orders/" + cancelled.id + "/delivery")).status, 404);
        const delivery = await (await get("/orders/" + orders[0].id + "/delivery")).json();
        assert.equal(delivery.delivery.githubUrl, "https://example.com/source");
        await Order.create({ buyerId: client.id, productId: product.id, amount: 1, status: "completed" });
        const history = await (await get("/orders")).json();
        assert.equal(history.orders.length, 3);
        const buyerWallet = await (await get("/transactions")).json();
        assert.equal(buyerWallet.totalSpent, 100); assert.equal(buyerWallet.totalEarned, 0);
        assert.equal(buyerWallet.monthly[0].spent, 100);
        const sellerToken = await issueSession(student);
        const sellerWallet = await (await get("/transactions", sellerToken)).json();
        assert.equal(sellerWallet.balance, 10); assert.equal(sellerWallet.totalEarned, 90);

        assert.ok(history.orders.every(order => !order.delivery));
        // Failed checkout receipts must not leak the source snapshot either.
        await Product.updateOne({ _id: product.id }, { status: "published" });
        const response = await fetch(base + "/order", { method: "POST", headers: { Authorization: "Bearer " + otherToken, "Content-Type": "application/json" }, body: JSON.stringify(input("failed")) });
        assert.equal(response.status, 200); assert.equal((await response.json()).order.delivery, undefined);
      } finally {
        await new Promise(resolve => server.close(resolve));
        if (oldSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = oldSecret;
      }
    });

    await t.test("simultaneous first sales from distinct buyers credit one seller wallet", async () => {
      await reset(); const { client, student, competitor } = await fixture();
      const product = await Product.create({ name: "Concurrent tool", slug: "concurrent-tool", description: "Tool", category: "web", sellerId: student.id, price: 100, status: "published", moderationVerified: true });
      const orders = await Promise.all([client, competitor].map(buyer => demoCheckout(buyer.id, { demo: true, requestId: randomUUID(), productId: product.id })));
      assert.notEqual(orders[0].id, orders[1].id);
      assert.equal(await DemoWallet.countDocuments(), 1);
      assert.equal((await DemoWallet.findOne({userId: student.id})).balance, 18000);
      assert.equal(await Transaction.countDocuments(), 2);
      assert.equal((await Product.findById(product.id)).salesCount, 2);
    });
  } finally {
    await mongoose.disconnect();
    await repl.stop();
  }
});
