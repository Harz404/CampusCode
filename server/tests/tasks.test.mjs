import assert from "node:assert/strict";
import { test } from "node:test";
import { taskInput, taskProgress } from "../dist/services/taskService.js";
import { access } from "../dist/middleware/access.js";
import { Task } from "../dist/models/Task.js";
import { Project } from "../dist/models/Project.js";
import { createProject, createTask, updateTask, updateProject, getProjectById } from "../dist/controllers/projectController.js";

const actor = "507f1f77bcf86cd799439011", projectId = "507f1f77bcf86cd799439012", taskId = "507f1f77bcf86cd799439013";
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });

test("task inputs validate statuses, dates and subtasks without accepting privileged nested fields", () => {
  assert.throws(() => taskInput({ title: " " }, true), /title/);
  assert.throws(() => taskInput({ status: "paid" }), /status/);
  assert.throws(() => taskInput({ dueDate: "not-a-date" }), /date/);
  assert.throws(() => taskInput({ subtasks: [{ title: "Step", completed: "yes" }] }), /subtask/);
  const input = taskInput({ title: " Work ", projectId: "forged", subtasks: [{ title: " Step ", completed: false, authorId: "forged" }] }, true);
  assert.deepEqual(input, { title: "Work", subtasks: [{ title: "Step", completed: false }] });
  assert.equal(taskProgress([]), 0);
  assert.equal(taskProgress([{ status: "done" }, { status: "todo" }, { status: "done" }]), 67);
});

test("new projects have no fabricated tasks or completed milestones", async () => {
  const original = Project.prototype.save;
  Project.prototype.save = async function () { return this; };
  try {
    const res = response();
    await createProject({ user: { id: actor }, body: { name: "New project" } }, res);
    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body.tasks, []);
    assert.deepEqual(res.body.milestones, []);
    assert.equal(res.body.progress, 0);
  } finally { Project.prototype.save = original; }
});

test("task creation preserves subtasks with server-generated IDs and authenticated creator", async () => {
  const original = Task.prototype.save;
  Task.prototype.save = async function () { return this; };
  try {
    const res = response();
    await createTask({ user: { id: actor }, params: { id: projectId }, body: { title: "Task", creatorId: "forged", subtasks: [{ title: "Step", completed: false }] } }, res);
    assert.equal(res.statusCode, 201);
    assert.equal(String(res.body.creatorId), actor);
    assert.equal(String(res.body.projectId), projectId);
    assert.equal(res.body.subtasks[0].title, "Step");
    assert.ok(res.body.id);
  } finally { Task.prototype.save = original; }
});

test("task changes use the persisted result and reject invalid states before writing", async () => {
  const original = Task.findByIdAndUpdate;
  Task.findByIdAndUpdate = async (id, update, options) => {
    assert.equal(id, taskId); assert.equal(options.runValidators, true);
    assert.deepEqual(update.$set, { status: "done" });
    return { toJSON: () => ({ id, status: "done" }) };
  };
  try {
    const res = response();
    await updateTask({ params: { taskId }, body: { status: "done" } }, res);
    assert.equal(res.body.status, "done");
    const invalid = response();
    await updateTask({ params: { taskId }, body: { status: "invalid" } }, invalid);
    assert.equal(invalid.statusCode, 400);
  } finally { Task.findByIdAndUpdate = original; }
});

test("task route rejects a task attached to a different parent project", async () => {
  const original = Task.findById;
  Task.findById = async () => ({ projectId });
  try {
    const res = response();
    await access("task", true)({ user: { id: actor }, params: { id: actor, taskId } }, res, () => assert.fail("Wrong parent accepted"));
    assert.equal(res.statusCode, 404);
  } finally { Task.findById = original; }
});

test("project reload derives progress from tasks rather than the stored counter", async () => {
  const originalProject = Project.findById, originalTasks = Task.find;
  Project.findById = () => ({ populate: async () => ({ _id: projectId, toJSON: () => ({ id: projectId, progress: 99 }) }) });
  Task.find = () => ({ populate: async () => ["done", "todo"].map(status => ({ status, toJSON: () => ({ status }) })) });
  try {
    const res = response(); await getProjectById({ params: { id: projectId } }, res);
    assert.equal(res.body.progress, 50);
  } finally { Project.findById = originalProject; Task.find = originalTasks; }
});

test("project completion rejects unfinished or empty work", async () => {
  const original = Task.find;
  try {
    for (const tasks of [[], [{ status: "todo" }]]) {
      Task.find = async () => tasks;
      const res = response(); await updateProject({ params: { id: projectId }, body: { status: "completed" } }, res);
      assert.equal(res.statusCode, 409);
    }
  } finally { Task.find = original; }
});
