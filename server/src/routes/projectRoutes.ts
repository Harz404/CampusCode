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
import { optionalAuth, requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", optionalAuth, getProjects);
router.get("/:id", optionalAuth, getProjectById);
router.post("/", requireAuth, createProject);
router.patch("/:id", requireAuth, updateProject);
router.put("/:id", requireAuth, updateProject);
router.delete("/:id", requireAuth, deleteProject);

// Tasks
router.get("/:id/tasks", optionalAuth, getProjectTasks);
router.post("/:id/tasks", requireAuth, createTask);
router.patch("/tasks/:taskId", requireAuth, updateTask);
router.put("/tasks/:taskId", requireAuth, updateTask);
router.delete("/tasks/:taskId", requireAuth, deleteTask);

export default router;

