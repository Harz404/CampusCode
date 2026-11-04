import { access, allowFields } from "../middleware/access.js";
import { Router } from "express";
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../controllers/projectController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, getProjects);
router.get("/:id", requireAuth, access("project"), getProjectById);
router.post("/", requireAuth, createProject);
router.patch("/:id", requireAuth, access("project", true), allowFields("project"), updateProject);
router.put("/:id", requireAuth, access("project", true), allowFields("project"), updateProject);
router.delete("/:id", requireAuth, access("project", true), deleteProject);

// Tasks
router.get("/:id/tasks", requireAuth, access("project"), getProjectTasks);
router.post("/:id/tasks", requireAuth, access("project", true), createTask);
router.patch("/:id/tasks/:taskId", requireAuth, access("task", true), allowFields("task"), updateTask);
router.delete("/:id/tasks/:taskId", requireAuth, access("task", true), deleteTask);
router.patch("/tasks/:taskId", requireAuth, access("task", true), allowFields("task"), updateTask);
router.put("/tasks/:taskId", requireAuth, access("task", true), allowFields("task"), updateTask);
router.delete("/tasks/:taskId", requireAuth, access("task", true), deleteTask);

export default router;

