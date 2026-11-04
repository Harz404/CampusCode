export function taskProgress(tasks: { status: string }[]): number {
  return tasks.length ? Math.round(tasks.filter(task => task.status === "done").length / tasks.length * 100) : 0;
}

export function taskInput(body: Record<string, unknown>, creating = false): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (creating || body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim() || body.title.length > 300) throw new Error("A task title of at most 300 characters is required");
    result.title = body.title.trim();
  }
  if (body.description !== undefined) {
    if (typeof body.description !== "string" || body.description.length > 20000) throw new Error("Invalid task description");
    result.description = body.description;
  }
  for (const [key, values] of Object.entries({ status: ["backlog", "todo", "in_progress", "review", "done"], priority: ["low", "medium", "high", "urgent"] })) {
    if (body[key] !== undefined) {
      if (typeof body[key] !== "string" || !values.includes(body[key] as string)) throw new Error(`Invalid task ${key}`);
      result[key] = body[key];
    }
  }
  if (body.labels !== undefined) {
    if (!Array.isArray(body.labels) || body.labels.length > 30 || body.labels.some(label => typeof label !== "string" || label.length > 100)) throw new Error("Invalid task labels");
    result.labels = body.labels;
  }
  if (body.dueDate !== undefined) {
    if (body.dueDate !== null && (typeof body.dueDate !== "string" || !Number.isFinite(Date.parse(body.dueDate)))) throw new Error("Invalid task due date");
    result.dueDate = body.dueDate === null ? null : new Date(body.dueDate as string);
  }
  if (body.subtasks !== undefined) {
    if (!Array.isArray(body.subtasks) || body.subtasks.length > 100) throw new Error("Invalid subtasks");
    result.subtasks = body.subtasks.map(item => {
      if (!item || typeof item.title !== "string" || !item.title.trim() || item.title.length > 300 || typeof item.completed !== "boolean") throw new Error("Each subtask requires a title and completion state");
      return { title: item.title.trim(), completed: item.completed };
    });
  }
  return result;
}
