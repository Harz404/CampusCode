import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, FolderKanban, Clock, Users, X } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { getStatusColor } from "../../lib/utils";
import { useUserData } from "../../lib/user-store";

export default function ProjectsPage() {
  const { projects, isLoaded, addProject } = useUserData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Full-Stack");
  const [techInput, setTechInput] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addProject({
      name,
      description,
      category,
      technologies: techInput ? techInput.split(",").map((t) => t.trim()) : ["React", "TypeScript"],
      status: "active",
      progress: 10,
    });

    setName("");
    setDescription("");
    setTechInput("");
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold mb-1">My Projects</h1>
          <p className="text-[var(--muted-foreground)]">Manage your software development projects</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Project
        </Button>
      </motion.div>

      {/* Loading Skeleton */}
      {!isLoaded ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="h-5 w-20 rounded-full bg-[var(--muted)]" />
                <div className="h-4 w-12 rounded bg-[var(--muted)]" />
              </div>
              <div className="space-y-2">
                <div className="h-5 w-3/4 rounded bg-[var(--muted)]" />
                <div className="h-3.5 w-full rounded bg-[var(--muted)]" />
                <div className="h-3.5 w-2/3 rounded bg-[var(--muted)]" />
              </div>
              <div className="flex gap-2">
                <div className="h-5 w-14 rounded-md bg-[var(--muted)]" />
                <div className="h-5 w-16 rounded-md bg-[var(--muted)]" />
                <div className="h-5 w-12 rounded-md bg-[var(--muted)]" />
              </div>
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between">
                  <div className="h-3 w-14 rounded bg-[var(--muted)]" />
                  <div className="h-3 w-8 rounded bg-[var(--muted)]" />
                </div>
                <div className="h-1.5 w-full rounded-full bg-[var(--muted)]" />
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-[var(--border)]">
                <div className="h-4 w-20 rounded bg-[var(--muted)]" />
                <div className="h-4 w-16 rounded bg-[var(--muted)]" />
              </div>
            </div>
          ))}
        </div>
      ) : projects.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project, i) => (
            <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
              <Link to={`/projects/${project.id}`}>
                <Card className="card-hover h-full flex flex-col justify-between">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                      {project.contractId && <Badge variant="warning" className="text-[10px]">Contract</Badge>}
                    </div>

                    <h3 className="font-semibold text-base mb-1">{project.name}</h3>
                    <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 mb-3">{project.description || "No description provided."}</p>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {(project.technologies || []).slice(0, 3).map((tech) => (
                        <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>
                      ))}
                    </div>

                    {/* Progress */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-[var(--muted-foreground)]">Progress</span>
                        <span className="font-medium">{project.progress}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[var(--muted)]">
                        <div className="h-full rounded-full bg-[var(--primary)] transition-all" style={{ width: `${project.progress}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] pt-3 border-t border-[var(--border)]">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {project.members?.length || 1} members
                      </div>
                      {project.deadline && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {new Date(project.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] mx-auto mb-4">
            <FolderKanban className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold mb-1">No projects created yet</h3>
          <p className="text-sm text-[var(--muted-foreground)] max-w-sm mx-auto mb-6">
            Create your first software project to organize tasks, milestones, sprints, and code repositories.
          </p>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Create Your First Project
          </Button>
        </div>
      )}

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Create New Project</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-medium block mb-1">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  placeholder="e.g. AI Resume Screener"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Description</label>
                <textarea
                  placeholder="What are you building?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] text-sm custom-select cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                >
                  <option value="Full-Stack">Full-Stack</option>
                  <option value="Frontend">Frontend</option>
                  <option value="Backend">Backend</option>
                  <option value="AI / ML">AI / ML</option>
                  <option value="Mobile">Mobile</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Blockchain">Blockchain</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Technologies (comma separated)</label>
                <input
                  placeholder="e.g. Next.js, TypeScript, Tailwind, Python"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Project
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

