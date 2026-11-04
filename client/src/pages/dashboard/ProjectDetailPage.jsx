import { apiFetch, apiJson } from "@/lib/api";
import { useState, useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, Plus, Loader2, X, Trash2, GitBranch, Rocket, ListChecks, RefreshCw, ExternalLink, } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input, Textarea, Label } from "../../components/ui/input";
import { getStatusColor, getPriorityColor } from "../../lib/utils";
import { KANBAN_COLUMNS } from "../../lib/constants";
const ISSUE_MARKER_PREFIX = "campuscode:issue:";
const SYSTEM_LABEL_PREFIX = "campuscode:";
function normaliseTasks(tasks) {
    return tasks.map((task) => ({
        ...task,
        status: task.status.toLowerCase(),
        priority: task.priority.toLowerCase(),
        subtasks: task.subtasks || [],
        comments: task.comments || [],
    }));
}
function issueUrl(repository, labels) {
    const issueNumber = labels.find((label) => label.startsWith(ISSUE_MARKER_PREFIX))?.slice(ISSUE_MARKER_PREFIX.length);
    if (!issueNumber)
        return null;
    const repo = repository.trim().replace(/^https?:\/\/github\.com\//i, "").replace(/\.git$/i, "").replace(/\/$/, "");
    return repo.includes("/") ? `https://github.com/${repo}/issues/${issueNumber}` : null;
}
export default function ProjectDetailPage() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [githubRepo, setGithubRepo] = useState("");
    const [isSavingWorkspace, setIsSavingWorkspace] = useState(false);
    const [isGitHubSyncing, setIsGitHubSyncing] = useState(false);
    const [workspaceMessage, setWorkspaceMessage] = useState(null);
    const [githubConnected, setGithubConnected] = useState(false);
    const [githubRepositories, setGithubRepositories] = useState([]);
    // Modals States
    const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
    const [selectedTaskForModal, setSelectedTaskForModal] = useState(null);
    // New Task Form State
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskDescription, setNewTaskDescription] = useState("");
    const [newTaskStatus, setNewTaskStatus] = useState("todo");
    const [newTaskPriority, setNewTaskPriority] = useState("medium");
    const [newTaskLabels, setNewTaskLabels] = useState("frontend, feature");
    const [newTaskSubtasks, setNewTaskSubtasks] = useState("");
    // Load Project and Tasks
    useEffect(() => {
        let cancelled = false;
        async function loadProject() {
            try {
                const res = await apiFetch(`/api/projects/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    if (!cancelled && data && !data.error) {
                        const normalizedTasks = normaliseTasks(data.tasks || []);
                        setProject({
                            ...data,
                            status: data.status.toLowerCase(),
                            tasks: normalizedTasks,
                        });
                        setTasks(normalizedTasks);
                        setGithubRepo(data.githubRepo || "");
                        setLoading(false);
                        return;
                    }
                }
            }
            catch (err) {
                console.error("[ProjectDetail] Error fetching project:", err);
            }
            finally {
                if (!cancelled)
                    setLoading(false);
            }
        }
        if (id) {
            loadProject();
        }
        return () => {
            cancelled = true;
        };
    }, [id]);
    useEffect(() => {
        const githubState = searchParams.get("github");
        if (githubState === "unavailable") {
            setWorkspaceMessage("GitHub connection is not configured yet. Add the GitHub App variables to your deployment, then try again.");
        }
        else if (githubState === "connected") {
            setWorkspaceMessage("GitHub connected. Choose a repository below to start syncing issues.");
        }
        else if (githubState === "connection-failed") {
            setWorkspaceMessage("GitHub connection could not be completed. Please try again.");
        }
        else if (githubState === "forbidden") {
            setWorkspaceMessage("Only the project owner can connect GitHub.");
        }
    }, [searchParams]);
    useEffect(() => {
        if (!id)
            return;
        apiFetch(`/api/projects/${id}/github/repositories`)
            .then((res) => res.ok ? res.json() : null)
            .then((data) => {
            if (!data)
                return;
            setGithubConnected(Boolean(data.connected));
            setGithubRepositories(data.repositories || []);
        })
            .catch(() => { });
    }, [id]);
    useEffect(() => {
        if (!project?.githubRepo || !id)
            return;
        const interval = window.setInterval(async () => {
            try {
                const res = await apiFetch(`/api/projects/${id}`);
                if (!res.ok)
                    return;
                const data = await res.json();
                const syncedTasks = normaliseTasks(data.tasks || []);
                setTasks(syncedTasks);
                setProject((current) => current ? { ...current, ...data, status: data.status.toLowerCase(), tasks: syncedTasks } : current);
            }
            catch {
                // silent
            }
        }, 15000);
        return () => window.clearInterval(interval);
    }, [id, project?.githubRepo]);
    const [taskSaving, setTaskSaving] = useState(false);
    const refreshWorkspace = async () => {
        const data = await apiJson(`/api/projects/${id}`);
        const normalized = normaliseTasks(data.tasks || []);
        setProject({ ...data, tasks: normalized });
        setTasks(normalized);
        setSelectedTaskForModal(previous => previous ? normalized.find(task => task.id === previous.id) || null : null);
    };
    const mutateTask = async (url, options) => {
        if (taskSaving) return false;
        setTaskSaving(true);
        setWorkspaceMessage(null);
        try {
            await apiJson(url, options);
            await refreshWorkspace();
            return true;
        } catch (error) {
            setWorkspaceMessage(error.message || "Could not save task changes");
            return false;
        } finally { setTaskSaving(false); }
    };
    const handleTaskStatusChange = async (taskId, newStatus) => {
        await mutateTask(`/api/projects/${id}/tasks/${taskId}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }),
        });
    };
    const handleCreateTask = async (e) => {
        e.preventDefault();
        if (!newTaskTitle.trim() || !id) return;
        const saved = await mutateTask(`/api/projects/${id}/tasks`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newTaskTitle.trim(), description: newTaskDescription.trim(), status: newTaskStatus,
                priority: newTaskPriority, labels: newTaskLabels.split(",").map(label => label.trim()).filter(Boolean),
                subtasks: newTaskSubtasks.split("\n").map(title => title.trim()).filter(Boolean).map(title => ({ title, completed: false })),
            }),
        });
        if (saved) { setIsAddTaskOpen(false); setNewTaskTitle(""); setNewTaskDescription(""); setNewTaskSubtasks(""); }
    };
    const handleToggleSubtask = async (taskId, subtaskIndex) => {
        const task = tasks.find(item => item.id === taskId);
        if (!task) return;
        const subtasks = task.subtasks.map((item, index) => ({ title: item.title, completed: index === subtaskIndex ? !item.completed : item.completed }));
        await mutateTask(`/api/projects/${id}/tasks/${taskId}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subtasks }),
        });
    };
    const handleDeleteTask = async (taskId) => {
        await mutateTask(`/api/projects/${id}/tasks/${taskId}`, { method: "DELETE" });
    };
    const completedTasks = tasks.filter((task) => task.status === "done").length;
    const taskProgress = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;
    const allTasksComplete = tasks.length > 0 && completedTasks === tasks.length;
    const isComplete = project?.status.toLowerCase() === "completed";
    const saveWorkspace = async (updates) => {
        if (!project || !id)
            return;
        setIsSavingWorkspace(true);
        setWorkspaceMessage(null);
        try {
            const res = await apiFetch(`/api/projects/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });
            if (!res.ok)
                throw new Error("Unable to save project");
            const updated = await res.json();
            setProject((previous) => previous ? {
                ...previous,
                ...updated,
                status: updated.status?.toLowerCase() || previous.status,
            } : previous);
            setWorkspaceMessage("Workspace saved.");
        }
        catch (error) {
            console.error("Failed to save workspace:", error);
            setWorkspaceMessage("Could not save your changes. Please try again.");
        }
        finally {
            setIsSavingWorkspace(false);
        }
    };
    const completeProject = async () => {
        if (!allTasksComplete) {
            setWorkspaceMessage("Finish every task before completing this project.");
            return;
        }
        await saveWorkspace({ status: "completed" });
    };
    const syncGitHubIssues = async () => {
        if (!id)
            return;
        setIsGitHubSyncing(true);
        setWorkspaceMessage(null);
        try {
            const [res] = await Promise.all([
                apiFetch(`/api/projects/${id}/github/sync`, { method: "POST" }),
                apiFetch(`/api/projects/${id}/github/kanban-log`, { method: "POST" }).catch(() => null),
            ]);
            const data = await res.json();
            if (!res.ok)
                throw new Error(data.error || "GitHub sync failed");
            const syncedTasks = normaliseTasks(data.project?.tasks || []);
            setTasks(syncedTasks);
            if (data.project)
                setProject((current) => current ? { ...current, ...data.project, status: data.project.status.toLowerCase(), tasks: syncedTasks } : current);
            setWorkspaceMessage(`Synced ${data.issueCount} GitHub issue${data.issueCount === 1 ? "" : "s"} & updated repo kanban-log.json.`);
        }
        catch (error) {
            setWorkspaceMessage(error instanceof Error ? error.message : "GitHub sync failed.");
        }
        finally {
            setIsGitHubSyncing(false);
        }
    };
    const selectGitHubRepository = async () => {
        if (!githubRepo.trim() || !id)
            return;
        setIsSavingWorkspace(true);
        setWorkspaceMessage(null);
        try {
            const res = await apiFetch(`/api/projects/${id}/github/repository`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullName: githubRepo }),
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data.error || "Could not select repository");
            setProject((current) => current ? { ...current, githubRepo: data.githubRepo } : current);
            setWorkspaceMessage("Repository connected. You can now sync GitHub issues.");
        }
        catch (error) {
            setWorkspaceMessage(error instanceof Error ? error.message : "Could not select repository.");
        }
        finally {
            setIsSavingWorkspace(false);
        }
    };
    if (loading) {
        return (<div className="p-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]"/>
      </div>);
    }
    if (!project) {
        return (<div className="p-8 text-center max-w-md mx-auto my-12 space-y-4">
        <h1 className="text-xl font-bold">Project not found</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          The project you are looking for might have been deleted or does not exist.
        </p>
        <Link to="/projects">
          <Button variant="outline">Back to Projects</Button>
        </Link>
      </div>);
    }
    return (<div aria-busy={taskSaving} className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {workspaceMessage && <p role="status" className="text-sm text-[var(--muted-foreground)]">{workspaceMessage}</p>}
      <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
        <ArrowLeft className="h-4 w-4"/> Back to Projects
      </Link>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2.5 mb-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold">{project.name}</h1>
              <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
            </div>
            {project.description && (<p className="text-[var(--muted-foreground)] text-sm max-w-3xl">{project.description}</p>)}
            {project.technologies && project.technologies.length > 0 && (<div className="flex flex-wrap gap-1.5 mt-2.5">
                {project.technologies.map((tech) => (<Badge key={tech} variant="secondary" className="text-xs font-normal">{tech}</Badge>))}
              </div>)}
          </div>

          <Button size="sm" className="gap-1.5 text-xs font-semibold cursor-pointer shadow-md" onClick={() => {
            setNewTaskStatus("todo");
            setIsAddTaskOpen(true);
        }}>
            <Plus className="h-4 w-4"/> Add Task
          </Button>
        </div>
      </motion.div>

      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ListChecks className="h-4 w-4 text-[var(--primary)]"/> Project workspace
              </div>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Track delivery here; Marketplace uses this project to create a pre-filled listing later.
              </p>
            </div>
            <span className="text-2xl font-bold">{taskProgress}%</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
              <span>{completedTasks} of {tasks.length} tasks complete</span>
              <span>{allTasksComplete ? "Ready to complete" : `${Math.max(tasks.length - completedTasks, 0)} remaining`}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]">
              <div className="h-full rounded-full bg-[var(--primary)] transition-all duration-300" style={{ width: `${taskProgress}%` }}/>
            </div>
          </div>

          {githubConnected ? (<div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <GitBranch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]"/>
                <select value={githubRepo} onChange={(event) => setGithubRepo(event.target.value)} className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] pl-9 pr-3 text-sm custom-select" aria-label="GitHub repository">
                  <option value="">Select a GitHub repository</option>
                  {githubRepositories.map((repository) => <option key={repository.full_name} value={repository.full_name}>{repository.full_name}</option>)}
                </select>
              </div>
              <Button type="button" variant="outline" className="gap-1.5" disabled={!githubRepo.trim() || isSavingWorkspace} onClick={selectGitHubRepository}>
                Use repository
              </Button>
              <Button type="button" variant="outline" className="gap-1.5" disabled={!project.githubRepo || isGitHubSyncing} onClick={syncGitHubIssues}>
                <RefreshCw className={`h-3.5 w-3.5 ${isGitHubSyncing ? "animate-spin" : ""}`}/> Sync issues
              </Button>
            </div>) : (<a href={`/api/github/connect?projectId=${id}`}>
              <Button type="button" variant="outline" className="gap-1.5">
                <GitBranch className="h-4 w-4"/> Connect GitHub
              </Button>
            </a>)}

        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 flex flex-col justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Rocket className="h-4 w-4 text-[var(--primary)]"/> Release readiness
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted-foreground)]">
              {isComplete
            ? "This project is complete. Generate a Marketplace draft with its project details already filled in."
            : "Complete all tasks to unlock a Marketplace draft. Publishing and listing details stay in Marketplace."}
            </p>
          </div>

          {isComplete ? (<Link to={`/sell?projectId=${project.id}`} className="w-full">
              <Button className="w-full gap-1.5">
                <Rocket className="h-4 w-4"/> Generate Marketplace Draft
              </Button>
            </Link>) : (<Button type="button" className="w-full gap-1.5" disabled={!allTasksComplete || isSavingWorkspace} onClick={completeProject}>
              <CheckCircle2 className="h-4 w-4"/> Mark Project Complete
            </Button>)}
        </div>
      </motion.section>

      {/* Kanban Board */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pt-2">
        <p className="text-xs text-[var(--muted-foreground)]">
          Move tasks between columns using the status dropdown on each card
        </p>

        <div className="flex gap-4 overflow-x-auto pb-4 items-start scrollbar-none">
          {KANBAN_COLUMNS.map((column) => {
            const colStatus = column.id;
            const columnTasks = tasks.filter((t) => t.status === colStatus);
            return (<div key={column.id} className="flex-shrink-0 w-80 rounded-2xl bg-[var(--muted)]/40 border border-[var(--border)] p-3 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${column.color}`}/>
                    <h3 className="font-semibold text-xs uppercase tracking-wider">{column.title}</h3>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5">
                    {columnTasks.length}
                  </Badge>
                </div>

                <div className="space-y-2.5 min-h-[380px]">
                  {columnTasks.map((task) => (<div key={task.id} onClick={() => setSelectedTaskForModal(task)} className="group p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-sm hover:border-[var(--primary)]/50 hover:shadow-md transition-all cursor-pointer space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold leading-tight group-hover:text-[var(--primary)] transition-colors">
                          {task.title}
                        </h4>
                        <span className={`text-[10px] uppercase font-bold shrink-0 ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>

                      {task.description && (<p className="text-xs text-[var(--muted-foreground)] line-clamp-2">
                          {task.description}
                        </p>)}

                      {task.labels && task.labels.length > 0 && (<div className="flex flex-wrap gap-1">
                          {task.labels.filter((label) => !label.startsWith(SYSTEM_LABEL_PREFIX)).map((label) => (<Badge key={label} variant="secondary" className="text-[10px] font-normal">
                              {label}
                            </Badge>))}
                        </div>)}

                      {issueUrl(project.githubRepo || "", task.labels || []) && (<a href={issueUrl(project.githubRepo || "", task.labels || []) || undefined} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--primary)] hover:underline">
                          GitHub issue <ExternalLink className="h-3 w-3"/>
                        </a>)}

                      {task.subtasks && task.subtasks.length > 0 && (<div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--muted-foreground)]">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500"/>
                            {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} subtasks
                          </span>
                          <span className="font-medium">
                            {Math.round((task.subtasks.filter((s) => s.completed).length / task.subtasks.length) * 100)}%
                          </span>
                        </div>)}

                      <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[10px] text-[var(--muted-foreground)] uppercase">Move:</span>
                        <select disabled={taskSaving} value={task.status} onChange={(e) => handleTaskStatusChange(task.id, e.target.value)} className="text-[11px] bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)] rounded px-2 py-0.5 custom-select cursor-pointer">
                          {KANBAN_COLUMNS.map((c) => (<option key={c.id} value={c.id}>
                              {c.title}
                            </option>))}
                        </select>
                      </div>
                    </div>))}

                  <button onClick={() => {
                    setNewTaskStatus(colStatus);
                    setIsAddTaskOpen(true);
                }} className="w-full p-2.5 rounded-xl border border-dashed border-[var(--border)] text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--card)] hover:border-[var(--primary)] transition-all cursor-pointer flex items-center justify-center gap-1.5">
                    <Plus className="h-3.5 w-3.5"/> Add {column.title} task
                  </button>
                </div>
              </div>);
        })}
        </div>
      </motion.div>

      {/* MODAL 1: ADD TASK MODAL */}
      <AnimatePresence>
        {isAddTaskOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h3 className="text-lg font-bold">Add Project Task</h3>
                <button onClick={() => setIsAddTaskOpen(false)} className="p-1 rounded hover:bg-[var(--muted)] cursor-pointer">
                  <X className="h-4 w-4"/>
                </button>
              </div>

              {workspaceMessage && <p role="alert" className="text-sm text-red-500">{workspaceMessage}</p>}
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold mb-1 block">Task Title *</Label>
                  <Input placeholder="e.g. Implement User Authentication Flow" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} required/>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold mb-1 block">Status Column</Label>
                    <select value={newTaskStatus} onChange={(e) => setNewTaskStatus(e.target.value)} className="w-full h-10 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-xs custom-select">
                      {KANBAN_COLUMNS.map((c) => (<option key={c.id} value={c.id}>{c.title}</option>))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold mb-1 block">Priority</Label>
                    <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value)} className="w-full h-10 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-xs custom-select">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold mb-1 block">Description (optional)</Label>
                  <Textarea rows={3} placeholder="Provide acceptance criteria, details, or API requirements..." value={newTaskDescription} onChange={(e) => setNewTaskDescription(e.target.value)}/>
                </div>

                <div>
                  <Label className="text-xs font-semibold mb-1 block">Labels (comma-separated)</Label>
                  <Input placeholder="frontend, api, bug, database" value={newTaskLabels} onChange={(e) => setNewTaskLabels(e.target.value)}/>
                </div>

                <div>
                  <Label className="text-xs font-semibold mb-1 block">Subtasks (one per line)</Label>
                  <Textarea rows={2} placeholder="Schema setup&#10;Frontend UI connection&#10;Unit test" value={newTaskSubtasks} onChange={(e) => setNewTaskSubtasks(e.target.value)}/>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
                  <Button type="button" variant="outline" onClick={() => setIsAddTaskOpen(false)}>
                    Cancel
                  </Button>
                  <Button disabled={taskSaving} type="submit" className="gap-1 cursor-pointer">
                    <Plus className="h-4 w-4"/> Create Task
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>)}
      </AnimatePresence>

      {/* MODAL 2: TASK DETAIL MODAL */}
      <AnimatePresence>
        {selectedTaskForModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl p-6 space-y-5">
              <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge className={getStatusColor(selectedTaskForModal.status)}>
                      {selectedTaskForModal.status.replace("_", " ")}
                    </Badge>
                    <span className={`text-xs font-bold ${getPriorityColor(selectedTaskForModal.priority)}`}>
                      {selectedTaskForModal.priority} priority
                    </span>
                  </div>
                  <h3 className="text-lg font-bold">{selectedTaskForModal.title}</h3>
                </div>
                <button onClick={() => setSelectedTaskForModal(null)} className="p-1 rounded hover:bg-[var(--muted)] cursor-pointer">
                  <X className="h-4 w-4"/>
                </button>
              </div>

              {selectedTaskForModal.description && (<div className="p-3 rounded-lg bg-[var(--muted)]/40 text-xs text-[var(--muted-foreground)] leading-relaxed whitespace-pre-line">
                  {selectedTaskForModal.description}
                </div>)}

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Change Task Column</Label>
                <select disabled={taskSaving} value={selectedTaskForModal.status} onChange={(e) => handleTaskStatusChange(selectedTaskForModal.id, e.target.value)} className="w-full h-10 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-xs custom-select">
                  {KANBAN_COLUMNS.map((c) => (<option key={c.id} value={c.id}>{c.title}</option>))}
                </select>
              </div>

              {workspaceMessage && <p role="alert" className="text-sm text-red-500">{workspaceMessage}</p>}
              {selectedTaskForModal.subtasks && selectedTaskForModal.subtasks.length > 0 && (<div className="space-y-2 pt-2 border-t border-[var(--border)]">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Subtasks Checklist ({selectedTaskForModal.subtasks.filter((s) => s.completed).length}/{selectedTaskForModal.subtasks.length})
                  </p>
                  <div className="space-y-1.5">
                    {selectedTaskForModal.subtasks.map((st, idx) => (<label key={st.id || idx} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[var(--muted)] cursor-pointer text-xs transition-colors">
                        <input disabled={taskSaving} type="checkbox" checked={st.completed} onChange={() => handleToggleSubtask(selectedTaskForModal.id, idx)} className="h-4 w-4 rounded accent-[var(--primary)]"/>
                        <span className={st.completed ? "line-through text-[var(--muted-foreground)]" : "font-medium"}>
                          {st.title}
                        </span>
                      </label>))}
                  </div>
                </div>)}

              <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                <Button disabled={taskSaving} variant="destructive" size="sm" onClick={() => handleDeleteTask(selectedTaskForModal.id)} className="gap-1.5 cursor-pointer text-xs">
                  <Trash2 className="h-3.5 w-3.5"/> Delete Task
                </Button>
                <Button size="sm" onClick={() => setSelectedTaskForModal(null)} className="cursor-pointer text-xs">
                  Done
                </Button>
              </div>
            </motion.div>
          </div>)}
      </AnimatePresence>
    </div>);
}
