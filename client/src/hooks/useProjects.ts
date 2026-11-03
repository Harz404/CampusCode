import { useState, useCallback, useMemo } from "react";
import type { Project, Task, TaskStatus } from "@/types";

export function useProjects() {
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<string>("all");

  const filteredProjects = useMemo(() => {
    if (filter === "all") return allProjects;
    return allProjects.filter((p) => p.status === filter);
  }, [allProjects, filter]);

  const getProjectById = useCallback(
    (id: string) => {
      return allProjects.find((p) => p.id === id) || null;
    },
    [allProjects]
  );

  return {
    projects: filteredProjects,
    setProjects: setAllProjects,
    filter,
    setFilter,
    getProjectById,
  };
}

export function useProjectTasks(projectId: string) {
  const [tasks, setTasks] = useState<Task[]>([]);

  const moveTask = useCallback((taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );
  }, []);

  const addTask = useCallback((task: Omit<Task, "id">) => {
    const newTask: Task = {
      ...task,
      id: `task_${Date.now()}`,
    };
    setTasks((prev) => [...prev, newTask]);
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  const getTasksByStatus = useCallback(
    (status: TaskStatus) => {
      return tasks.filter((t) => t.status === status);
    },
    [tasks]
  );

  return {
    tasks,
    setTasks,
    moveTask,
    updateTask,
    addTask,
    deleteTask,
    getTasksByStatus,
  };
}

