import { taskInput, taskProgress } from "../services/taskService.js";
import { projectScope } from "../middleware/access.js";
import { Response } from "express";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { AuthRequest } from "../middleware/auth.js";
import mongoose from "mongoose";

export async function getProjects(req: AuthRequest, res: Response) {
  try {
    const { status, userId } = req.query;
    const filter: Record<string, unknown> = projectScope(req.user!.id);

    if (status && status !== "all") {
      filter.status = (status as string).toLowerCase();
    }


    const projects = await Project.find(filter)
      .sort({ updatedAt: -1 })
      .populate("ownerId", "name email avatar");

    // Fetch tasks for each project
    const projectIds = projects.map((p) => p._id);
    const allTasks = await Task.find({ projectId: { $in: projectIds } });

    const formattedProjects = projects.map((p) => {
      const pJson: any = p.toJSON();
      pJson.tasks = allTasks.filter((t) => t.projectId.toString() === p._id.toString()).map((t) => t.toJSON());
      pJson.progress = taskProgress(pJson.tasks);
      return pJson;
    });

    return res.json({ projects: formattedProjects, total: formattedProjects.length });
  } catch (error) {
    console.error("[Project GET Error]:", error);
    return res.status(500).json({ error: "Failed to fetch projects" });
  }
}

export async function getProjectById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: "Project not found" });
    }

    const project = await Project.findById(id).populate("ownerId", "name email avatar");
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const tasks = await Task.find({ projectId: project._id }).populate("assigneeId", "name avatar");

    const projectData: any = project.toJSON();
    projectData.tasks = tasks.map((t) => t.toJSON());
    projectData.progress = taskProgress(tasks);

    return res.json(projectData);
  } catch (error) {
    console.error("[Project GetById Error]:", error);
    return res.status(500).json({ error: "Failed to fetch project" });
  }
}

export async function createProject(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id || req.body.ownerId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: Owner ID required" });
    }

    const { name, description, category, technologies, deadline } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Project name is required" });
    }

    const newProject = new Project({
      name: name.trim(),
      description: description || "",
      category: category || "general",
      status: "planning",
      progress: 0,
      ownerId: userId,
      technologies: Array.isArray(technologies) ? technologies : [],
      deadline: deadline ? new Date(deadline) : undefined,
      members: [{ user: userId, role: "owner", joinedAt: new Date() }],
      milestones: [],
    });

    await newProject.save();

    const projectData: any = newProject.toJSON();
    projectData.tasks = [];

    return res.status(201).json(projectData);
  } catch (error) {
    console.error("[Project Create Error]:", error);
    return res.status(500).json({ error: "Failed to create project" });
  }
}

export async function updateProject(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (req.body.status === "completed") {
      const tasks = await Task.find({ projectId: id });
      if (!tasks.length || tasks.some(task => task.status !== "done")) return res.status(409).json({ error: "Complete every task before completing the project" });
    }
    const project = await Project.findByIdAndUpdate(id, { $set: req.body }, { new: true, runValidators: true });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    return res.json(project.toJSON());
  } catch (error) {
    console.error("[Project Update Error]:", error);
    return res.status(500).json({ error: "Failed to update project" });
  }
}

export async function deleteProject(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: "Project not found" });
    }

    await Project.findByIdAndDelete(id);
    await Task.deleteMany({ projectId: id });

    return res.json({ success: true, message: "Project deleted" });
  } catch (error) {
    console.error("[Project Delete Error]:", error);
    return res.status(500).json({ error: "Failed to delete project" });
  }
}

// ── Tasks ──────────────────────────────────────────────────────

export async function getProjectTasks(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const tasks = await Task.find({ projectId: id }).populate("assigneeId", "name avatar");
    return res.json({ tasks: tasks.map((t) => t.toJSON()) });
  } catch (error) {
    console.error("[Task GET Error]:", error);
    return res.status(500).json({ error: "Failed to fetch tasks" });
  }
}

export async function createTask(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.body.creatorId;
    let fields;
    try { fields = taskInput(req.body, true); }
    catch (error) { return res.status(400).json({ error: (error as Error).message }); }
    const newTask = new Task({ ...fields, projectId: id, creatorId: userId });

    await newTask.save();
    return res.status(201).json(newTask.toJSON());
  } catch (error) {
    console.error("[Task Create Error]:", error);
    return res.status(500).json({ error: "Failed to create task" });
  }
}

export async function updateTask(req: AuthRequest, res: Response) {
  try {
    const { taskId } = req.params;
    let fields;
    try { fields = taskInput(req.body); }
    catch (error) { return res.status(400).json({ error: (error as Error).message }); }
    const task = await Task.findByIdAndUpdate(taskId, { $set: fields }, { new: true, runValidators: true });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    return res.json(task.toJSON());
  } catch (error) {
    console.error("[Task Update Error]:", error);
    return res.status(500).json({ error: "Failed to update task" });
  }
}

export async function deleteTask(req: AuthRequest, res: Response) {
  try {
    const { taskId } = req.params;
    const task = await Task.findByIdAndDelete(taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });
    return res.json({ success: true, message: "Task deleted" });
  } catch (error) {
    console.error("[Task Delete Error]:", error);
    return res.status(500).json({ error: "Failed to delete task" });
  }
}

