import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Clock, DollarSign, Calendar, CheckCircle2, Circle,
  AlertCircle, MessageSquare, Star, ShieldCheck, Upload,
  Loader2, X, Check, Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Avatar } from "../../components/ui/avatar";
import { Input, Textarea, Label } from "../../components/ui/input";
import { formatCurrency, formatDate, getStatusColor } from "../../lib/utils";
import { useAuth } from "../../hooks/useAuth";
import type { Contract, ContractMilestoneItem } from "../../types";

function getMilestoneIcon(status: ContractMilestoneItem["status"]) {
  switch (status) {
    case "approved":
      return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    case "in_progress":
      return <Clock className="h-5 w-5 text-amber-500 animate-pulse" />;
    case "submitted":
      return <Upload className="h-5 w-5 text-blue-500" />;
    case "revision_requested":
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    default:
      return <Circle className="h-5 w-5 text-[var(--muted-foreground)]" />;
  }
}

function getMilestoneBadgeVariant(status: ContractMilestoneItem["status"]): "success" | "warning" | "default" | "destructive" | "secondary" {
  switch (status) {
    case "approved": return "success";
    case "in_progress": return "warning";
    case "submitted": return "default";
    case "revision_requested": return "destructive";
    default: return "secondary";
  }
}

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isClient = user?.role?.toLowerCase() === "client";

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [messagingLoading, setMessagingLoading] = useState(false);

  // Modals & Action States
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<ContractMilestoneItem | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [submissionRepo, setSubmissionRepo] = useState("");
  const [submissionDrive, setSubmissionDrive] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Revision Modal State
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [isRequestingRevision, setIsRequestingRevision] = useState(false);

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Approve Loading State
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadContract() {
      try {
        const res = await fetch(`/api/contracts/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data && !data.error) {
            setContract(data);
            return;
          }
        }
      } catch (err) {
        console.error("[Contract] Error loading contract:", err);
      }
    }

    if (id) {
      loadContract().finally(() => {
        if (!cancelled) setLoading(false);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSubmitDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMilestone || !contract) return;
    setIsSubmitting(true);

    try {
      await fetch(`/api/contracts/${contract.id}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit",
          milestoneId: selectedMilestone.id,
          notes: submissionNotes,
          repoLink: submissionRepo,
          driveLink: submissionDrive,
        }),
      });

      setContract((prev) => {
        if (!prev) return prev;
        const updatedMilestones = prev.milestones.map((m) =>
          m.id === selectedMilestone.id ? { ...m, status: "submitted" as const } : m
        );
        return { ...prev, milestones: updatedMilestones, status: "in_review" };
      });

      setIsSubmitModalOpen(false);
      setSubmissionNotes("");
      setSubmissionRepo("");
      setSubmissionDrive("");
    } catch (err) {
      console.error("Failed to submit milestone:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveMilestone = async (milestoneId: string) => {
    if (!contract) return;
    setApprovingId(milestoneId);

    try {
      const res = await fetch(`/api/contracts/${contract.id}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          milestoneId,
        }),
      });

      const data = await res.json().catch(() => ({}));

      setContract((prev) => {
        if (!prev) return prev;
        const updatedMilestones = prev.milestones.map((m) =>
          m.id === milestoneId
            ? { ...m, status: "approved" as const, approvedAt: new Date().toISOString() }
            : m
        );

        let nextFound = false;
        const progressed = updatedMilestones.map((m) => {
          if (!nextFound && m.status === "pending") {
            nextFound = true;
            return { ...m, status: "in_progress" as const };
          }
          return m;
        });

        const allApproved = progressed.every((m) => m.status === "approved");
        return {
          ...prev,
          milestones: progressed,
          status: allApproved ? "completed" : "active",
        };
      });

      if (data?.isFullyCompleted) {
        setIsReviewModalOpen(true);
      }
    } catch (err) {
      console.error("Failed to approve milestone:", err);
    } finally {
      setApprovingId(null);
    }
  };

  const handleRequestRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMilestone || !contract) return;
    setIsRequestingRevision(true);

    try {
      await fetch(`/api/contracts/${contract.id}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request_revision",
          milestoneId: selectedMilestone.id,
          notes: revisionNotes,
        }),
      });

      setContract((prev) => {
        if (!prev) return prev;
        const updatedMilestones = prev.milestones.map((m) =>
          m.id === selectedMilestone.id ? { ...m, status: "revision_requested" as const } : m
        );
        return { ...prev, milestones: updatedMilestones };
      });

      setIsRevisionModalOpen(false);
      setRevisionNotes("");
    } catch (err) {
      console.error("Failed to request revision:", err);
    } finally {
      setIsRequestingRevision(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="p-8 text-center max-w-md mx-auto my-12 space-y-4">
        <h1 className="text-2xl font-bold">Contract Not Found</h1>
        <p className="text-sm text-[var(--muted-foreground)]">The contract you are looking for does not exist.</p>
        <Link to="/contracts"><Button variant="outline">Back to Contracts</Button></Link>
      </div>
    );
  }

  const approvedMilestones = contract.milestones?.filter((m) => m.status === "approved") || [];
  const releasedAmount = approvedMilestones.reduce((s, m) => s + m.amount, 0);
  const progressPct = Math.round((releasedAmount / (contract.totalAmount || 1)) * 100);
  const activeMilestone = contract.milestones?.find((m) => m.status === "in_progress" || m.status === "revision_requested");

  const steps = [
    { label: "Proposal Sent", completed: true },
    { label: "Accepted", completed: true },
    { label: "Escrow Funded", completed: true },
    { label: "In Development", completed: contract.status === "active" || contract.status === "in_review" || contract.status === "completed" },
    { label: "Under Review", completed: contract.status === "in_review" || contract.status === "completed" },
    { label: "Completed", completed: contract.status === "completed" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <Link to="/contracts" className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Contracts
      </Link>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getStatusColor(contract.status)}>{contract.status.replace("_", " ")}</Badge>
              <span className="text-xs text-[var(--muted-foreground)]">Started {formatDate(contract.startDate)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">
              {contract.solutionRequest?.title || `Contract #${contract.id.slice(-6).toUpperCase()}`}
            </h1>
            <p className="text-[var(--muted-foreground)] text-sm">
              Developer: <strong className="text-[var(--foreground)]">{contract.student?.name}</strong> ↔ Client: <strong className="text-[var(--foreground)]">{contract.client?.name}</strong>
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              className="gap-1.5 cursor-pointer"
              disabled={messagingLoading}
              onClick={async () => {
                const otherUserId = isClient ? contract.studentId : contract.clientId;
                setMessagingLoading(true);
                try {
                  const res = await fetch("/api/messages/conversations", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      participantId: otherUserId,
                      contractId: contract.id,
                      context: { type: "contract", id: contract.id },
                    }),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    navigate(`/messages?conv=${data.conversation.id}`);
                  }
                } catch (err) {
                  console.error("Failed to start conversation:", err);
                } finally {
                  setMessagingLoading(false);
                }
              }}
            >
              <MessageSquare className="h-4 w-4" />
              {isClient ? "Message Developer" : "Message Client"}
            </Button>
            {!isClient && activeMilestone && (
              <Button
                className="gap-1.5 shadow-md cursor-pointer"
                onClick={() => {
                  setSelectedMilestone(activeMilestone);
                  setIsSubmitModalOpen(true);
                }}
              >
                <Upload className="h-4 w-4" /> Submit Active Milestone
              </Button>
            )}
            {contract.status === "completed" && (
              <Button
                variant="outline"
                className="gap-1.5 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-900/50 cursor-pointer"
                onClick={() => setIsReviewModalOpen(true)}
              >
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {reviewSubmitted ? "Review Submitted" : "Leave Review & Rating"}
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Contract Lifecycle Stepper */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between overflow-x-auto gap-1 scrollbar-none">
              {steps.map((step, idx) => (
                <div key={step.label} className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col items-center text-center">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                      step.completed
                        ? "bg-emerald-500 text-white shadow-sm"
                        : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                    }`}>
                      {step.completed ? <Check className="h-4 w-4" /> : idx + 1}
                    </div>
                    <p className={`text-[10px] mt-1.5 whitespace-nowrap font-medium ${step.completed ? "text-emerald-600 dark:text-emerald-400" : "text-[var(--muted-foreground)]"}`}>
                      {step.label}
                    </p>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 rounded ${step.completed ? "bg-emerald-500" : "bg-[var(--border)]"}`} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader><CardTitle className="text-lg">Financial & Escrow Summary</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3.5 rounded-xl bg-[var(--muted)]/40 border border-[var(--border)]">
                    <p className="text-xl font-bold">{formatCurrency(contract.totalAmount)}</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                      {isClient ? "Total Contract Value" : "Project Budget"}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/40">
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(releasedAmount)}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                      {isClient ? "Released to Student" : "Payouts Released"}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/40">
                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                      {formatCurrency(Math.max(0, contract.totalAmount - releasedAmount))}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                      Held in Escrow
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-[var(--muted-foreground)]">Milestone Payment Progress</span>
                    <span className="font-semibold">{formatCurrency(releasedAmount)} / {formatCurrency(contract.totalAmount)} ({progressPct}%)</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[var(--muted)]">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Milestone Schedule ({contract.milestones?.length || 0})</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {approvedMilestones.length} of {contract.milestones?.length || 0} Completed
                </Badge>
              </CardHeader>
              <CardContent className="space-y-0">
                {contract.milestones?.map((milestone, idx) => (
                  <div key={milestone.id} className="relative">
                    {idx < contract.milestones.length - 1 && (
                      <div className={`absolute left-[19px] top-10 bottom-0 w-0.5 ${
                        milestone.status === "approved" ? "bg-emerald-400 dark:bg-emerald-700" : "bg-[var(--border)]"
                      }`} />
                    )}
                    <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-[var(--muted)]/30 transition-colors">
                      <div className="shrink-0 mt-0.5">
                        {getMilestoneIcon(milestone.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{milestone.title}</h4>
                          <Badge variant={getMilestoneBadgeVariant(milestone.status)} className="text-[10px]">
                            {milestone.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)] mb-2">{milestone.description}</p>
                        <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)] flex-wrap">
                          <span className="flex items-center gap-1 font-semibold text-[var(--primary)]">
                            <DollarSign className="h-3 w-3" /> {formatCurrency(milestone.amount)}
                          </span>
                          {milestone.dueDate && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Due: {formatDate(milestone.dueDate)}</span>}
                          {milestone.approvedAt && <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium"><CheckCircle2 className="h-3 w-3" /> Approved {formatDate(milestone.approvedAt)}</span>}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {!isClient && (milestone.status === "in_progress" || milestone.status === "revision_requested") && (
                          <Button
                            size="sm"
                            className="text-xs gap-1 cursor-pointer shadow"
                            onClick={() => {
                              setSelectedMilestone(milestone);
                              setIsSubmitModalOpen(true);
                            }}
                          >
                            <Upload className="h-3 w-3" /> Submit Work
                          </Button>
                        )}
                        {!isClient && milestone.status === "submitted" && (
                          <Badge variant="default" className="text-xs">Awaiting Client Review</Badge>
                        )}

                        {isClient && milestone.status === "submitted" && (
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs text-red-500 border-red-300 dark:border-red-900/50 hover:bg-red-50/50 cursor-pointer"
                              onClick={() => {
                                setSelectedMilestone(milestone);
                                setIsRevisionModalOpen(true);
                              }}
                            >
                              Request Revision
                            </Button>
                            <Button
                              size="sm"
                              className="text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow"
                              disabled={approvingId === milestone.id}
                              onClick={() => handleApproveMilestone(milestone.id)}
                            >
                              {approvingId === milestone.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                              Approve & Release {formatCurrency(milestone.amount)}
                            </Button>
                          </div>
                        )}
                        {isClient && milestone.status === "in_progress" && (
                          <Badge variant="warning" className="text-xs">In Development</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Client Profile</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar name={contract.client?.name || "Client"} size="lg" />
                <div>
                  <p className="font-semibold">{contract.client?.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{contract.client?.clientProfile?.organization || "Verified Organization"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="font-medium">{contract.client?.clientProfile?.rating || 4.9}</span>
                <span className="text-[var(--muted-foreground)]">({contract.client?.clientProfile?.reviewCount || 12} reviews)</span>
              </div>
              {contract.client?.isVerified && (
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-lg border border-emerald-200 dark:border-emerald-900/40">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified Escrow Employer
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Student Developer</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar name={contract.student?.name || "Developer"} size="lg" />
                <div>
                  <p className="font-semibold">{contract.student?.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{contract.student?.studentProfile?.college || "Student Developer"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="font-medium">{contract.student?.studentProfile?.rating || 4.9}</span>
                <span className="text-[var(--muted-foreground)]">• {contract.student?.studentProfile?.completedProjects || 5} completed projects</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Contract Meta</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-[var(--muted-foreground)]">Contract ID</span><span className="font-mono">{contract.id}</span></div>
              <div className="flex justify-between"><span className="text-[var(--muted-foreground)]">Start Date</span><span>{formatDate(contract.startDate)}</span></div>
              {contract.expectedEndDate && <div className="flex justify-between"><span className="text-[var(--muted-foreground)]">Expected End</span><span>{formatDate(contract.expectedEndDate)}</span></div>}
              <div className="flex justify-between"><span className="text-[var(--muted-foreground)]">Milestones</span><span>{approvedMilestones.length} / {contract.milestones?.length || 0} completed</span></div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MODAL 1: SUBMIT DELIVERABLES */}
      <AnimatePresence>
        {isSubmitModalOpen && selectedMilestone && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div>
                  <h3 className="text-lg font-bold">Submit Milestone Deliverables</h3>
                  <p className="text-xs text-[var(--muted-foreground)]">{selectedMilestone.title} ({formatCurrency(selectedMilestone.amount)})</p>
                </div>
                <button onClick={() => setIsSubmitModalOpen(false)} className="p-1 rounded hover:bg-[var(--muted)] cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitDeliverable} className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold mb-1 block">Work Notes & Deliverable Summary *</Label>
                  <Textarea
                    rows={4}
                    placeholder="Describe the features completed, testing results, deployment details..."
                    value={submissionNotes}
                    onChange={(e) => setSubmissionNotes(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold mb-1 block">GitHub Pull Request / Repo URL (optional)</Label>
                  <Input
                    placeholder="https://github.com/username/repo/pull/12"
                    value={submissionRepo}
                    onChange={(e) => setSubmissionRepo(e.target.value)}
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold mb-1 block">Google Drive / Preview Link (optional)</Label>
                  <Input
                    placeholder="https://drive.google.com/... or https://demo.vercel.app"
                    value={submissionDrive}
                    onChange={(e) => setSubmissionDrive(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                  <Button type="button" variant="outline" onClick={() => setIsSubmitModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting} className="gap-1.5 cursor-pointer">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Submit for Review
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: REQUEST REVISION */}
      <AnimatePresence>
        {isRevisionModalOpen && selectedMilestone && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h3 className="text-lg font-bold">Request Milestone Revision</h3>
                <button onClick={() => setIsRevisionModalOpen(false)} className="p-1 rounded hover:bg-[var(--muted)] cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleRequestRevision} className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold mb-1 block">Feedback & Requested Changes *</Label>
                  <Textarea
                    rows={4}
                    placeholder="Specify the changes needed before approving this milestone..."
                    value={revisionNotes}
                    onChange={(e) => setRevisionNotes(e.target.value)}
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
                  <Button type="button" variant="outline" onClick={() => setIsRevisionModalOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="destructive" disabled={isRequestingRevision} className="cursor-pointer">
                    Send Revision Request
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: LEAVE REVIEW & RATING */}
      <AnimatePresence>
        {isReviewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h3 className="text-lg font-bold">Contract Completed!</h3>
                <button onClick={() => setIsReviewModalOpen(false)} className="p-1 rounded hover:bg-[var(--muted)] cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="text-center space-y-4">
                <p className="text-xs text-[var(--muted-foreground)]">
                  Please rate your collaboration with {isClient ? contract.student?.name : contract.client?.name}.
                </p>

                <div className="flex items-center justify-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 cursor-pointer hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`h-7 w-7 ${
                          star <= reviewRating
                            ? "fill-amber-400 text-amber-400"
                            : "text-[var(--muted)]"
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <Textarea
                  rows={3}
                  placeholder="Share a short review about code quality, communication, and speed..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                />

                <Button
                  className="w-full gap-2 cursor-pointer"
                  onClick={() => {
                    setReviewSubmitted(true);
                    setIsReviewModalOpen(false);
                  }}
                >
                  <Check className="h-4 w-4" /> Submit Review
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

