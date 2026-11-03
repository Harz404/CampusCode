import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Clock, Users, CheckCircle2, Send, Calendar, DollarSign,
  AlertCircle, FileText, Briefcase, Loader2, Sparkles, Plus, Trash2,
  Check, MessageSquare, PlusCircle, Layers, ChevronDown, ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Avatar } from "../../components/ui/avatar";
import { Input, Textarea, Label } from "../../components/ui/input";
import { formatCurrency, formatRelativeTime, formatDate, getStatusColor } from "../../lib/utils";
import { useAuth } from "../../hooks/useAuth";
import type { SolutionRequest, Proposal } from "../../types";

interface MilestoneInput {
  id: string;
  title: string;
  amount: number;
  durationDays: number;
}

export default function SolutionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [request, setRequest] = useState<SolutionRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmittingMode, setIsSubmittingMode] = useState(false);
  const [expandedProposal, setExpandedProposal] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [messagingId, setMessagingId] = useState<string | null>(null);

  // Proposal Form State (for Students)
  const [price, setPrice] = useState<number>(0);
  const [days, setDays] = useState<number>(14);
  const [coverLetter, setCoverLetter] = useState("");
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
  const [milestones, setMilestones] = useState<MilestoneInput[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isAiGeneratingPitch, setIsAiGeneratingPitch] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleAiGeneratePitch = async () => {
    if (!request) return;
    setIsAiGeneratingPitch(true);
    setAiSuccessMessage(null);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "suggest_proposal",
          requirementTitle: request.title,
          requirementDescription: request.problemStatement || request.description,
          budgetMin: request.budgetMin,
          budgetMax: request.budgetMax,
          studentSkills: selectedTechs.length > 0 ? selectedTechs : ["React", "TypeScript", "Node.js", "Tailwind CSS"],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.proposal) {
          if (data.proposal.pitch) {
            setCoverLetter(data.proposal.pitch);
          }
          if (data.proposal.suggestedPrice && price === 0) {
            setPrice(data.proposal.suggestedPrice);
          }
          setAiSuccessMessage("✨ AI proposal pitch generated! Feel free to customize.");
          setTimeout(() => setAiSuccessMessage(null), 4000);
        }
      }
    } catch (err) {
      console.error("Failed to generate AI pitch:", err);
    } finally {
      setIsAiGeneratingPitch(false);
    }
  };

  const isClient = user?.role?.toLowerCase() === "client";
  const isOwner = Boolean(user?.id && request?.clientId === user.id);

  useEffect(() => {
    let cancelled = false;

    async function loadRequirement() {
      try {
        const res = await fetch(`/api/solutions/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data) {
            setRequest(data);
            const initialPrice = data.budgetMin || 20000;
            setPrice(initialPrice);
            setSelectedTechs(data.preferredTechnologies || []);
            setMilestones([
              { id: "m1", title: "Architecture, UI Wireframes & DB Schema", amount: Math.round(initialPrice * 0.4), durationDays: 5 },
              { id: "m2", title: "Core Functionality & API Integrations", amount: Math.round(initialPrice * 0.4), durationDays: 6 },
              { id: "m3", title: "Testing, QA & Deployment", amount: Math.round(initialPrice * 0.2), durationDays: 3 },
            ]);
            return;
          }
        }
      } catch (err) {
        console.error("[SolutionDetail] Error fetching requirement:", err);
      }
    }

    if (id) {
      loadRequirement().finally(() => {
        if (!cancelled) setLoading(false);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handlePriceChange = (val: number) => {
    setPrice(val);
    if (milestones.length === 3) {
      setMilestones([
        { ...milestones[0], amount: Math.round(val * 0.4) },
        { ...milestones[1], amount: Math.round(val * 0.4) },
        { ...milestones[2], amount: Math.round(val * 0.2) },
      ]);
    }
  };

  const handleAddMilestone = () => {
    const newId = `m_${Date.now()}`;
    setMilestones([...milestones, { id: newId, title: "Additional Deliverable", amount: 5000, durationDays: 3 }]);
  };

  const handleRemoveMilestone = (mId: string) => {
    setMilestones(milestones.filter((m) => m.id !== mId));
  };

  const handleMilestoneChange = (mId: string, field: "title" | "amount" | "durationDays", val: string | number) => {
    setMilestones(
      milestones.map((m) => (m.id === mId ? { ...m, [field]: val } : m))
    );
  };

  const toggleTech = (tech: string) => {
    if (selectedTechs.includes(tech)) {
      setSelectedTechs(selectedTechs.filter((t) => t !== tech));
    } else {
      setSelectedTechs([...selectedTechs, tech]);
    }
  };

  const totalMilestonesAmount = milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
  const platformFee = Math.round(price * 0.1);
  const takeHome = Math.max(0, price - platformFee);

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setSubmitError("Please sign in to submit proposals.");
      return;
    }
    if (!coverLetter.trim()) {
      setSubmitError("Please write a brief cover letter describing your approach.");
      return;
    }
    if (price <= 0) {
      setSubmitError("Please enter a valid proposal price.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          solutionRequestId: id,
          content: coverLetter,
          price,
          estimatedDelivery: days,
          technologies: selectedTechs,
          milestones: milestones.map((m) => ({
            title: m.title,
            amount: Number(m.amount) || 0,
            durationDays: Number(m.durationDays) || 5,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit proposal");
      }

      setSubmitSuccess(true);
    } catch (err: unknown) {
      console.error("[Submit Proposal Error]:", err);
      setSubmitError(err instanceof Error ? err.message : "Failed to submit proposal. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptProposal = async (proposalId: string) => {
    setAcceptingId(proposalId);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        navigate(`/contracts/${data.contractId}`);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to accept proposal");
      }
    } catch (err) {
      console.error("Accept proposal error:", err);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleMessageStudent = async (studentId: string, proposalId: string) => {
    setMessagingId(proposalId);
    try {
      const res = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: studentId,
          context: { type: "proposal", id: proposalId },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        navigate(`/messages?conv=${data.conversation.id}`);
      }
    } catch (err) {
      console.error("Failed to start chat:", err);
    } finally {
      setMessagingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)] mx-auto" />
          <p className="text-sm text-[var(--muted-foreground)]">Loading requirement details...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
        <h1 className="text-xl font-bold mb-2">Requirement Not Found</h1>
        <p className="text-sm text-[var(--muted-foreground)] mb-6">
          This solution request does not exist or has been removed.
        </p>
        <Link to="/solutions">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Solutions
          </Button>
        </Link>
      </div>
    );
  }

  const incomingProposals = (request.proposals as Proposal[]) || [];
  const mySubmittedProposal = user?.id
    ? incomingProposals.find((p) => p.studentId === user.id || p.student?.id === user.id)
    : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <AnimatePresence mode="wait">
        {!isSubmittingMode ? (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
          >
            {/* Top Breadcrumb */}
            <Link
              to="/solutions"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {isOwner || isClient ? "Back to My Requirements" : "Back to Solution Requests"}
            </Link>

            <div className="grid lg:grid-cols-3 gap-8 items-start">
              {/* Main Content Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Header */}
                <div>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Badge variant={typeof request.status === "string" && request.status.toLowerCase() === "open" ? "success" : "warning"}>
                      {typeof request.status === "string" && request.status.toLowerCase() === "open" ? "Open" : "In Progress"}
                    </Badge>
                    <Badge variant="outline">{request.difficulty}</Badge>
                    <Badge variant="outline">{request.solutionType?.replace("_", " / ").toUpperCase()}</Badge>
                    {(isOwner || isClient) && (
                      <Badge className="bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20">
                        Owner View
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-3">{request.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)] flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" /> Posted {formatRelativeTime(request.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" /> {incomingProposals.length || request.proposalCount || 0} proposals
                    </span>
                    {request.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" /> Deadline: {formatDate(request.deadline)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Problem Statement */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Problem Statement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-[var(--muted-foreground)] whitespace-pre-line">
                      {request.problemStatement || request.description}
                    </p>
                  </CardContent>
                </Card>

                {/* Required Features */}
                {request.requiredFeatures && request.requiredFeatures.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg">Required Features & Scope</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid sm:grid-cols-2 gap-2.5">
                        {request.requiredFeatures.map((feature) => (
                          <div key={feature} className="flex items-start gap-2.5 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="text-[var(--foreground)]">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Preferred Technologies */}
                {request.preferredTechnologies && request.preferredTechnologies.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg">Preferred Tech Stack</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {request.preferredTechnologies.map((tech) => (
                          <Badge key={tech} variant="secondary" className="px-3 py-1.5 text-sm font-normal">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Expected Deliverables */}
                {request.expectedDeliverables && request.expectedDeliverables.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg">Expected Deliverables</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {request.expectedDeliverables.map((item) => (
                          <li key={item} className="flex items-center gap-2.5 text-sm text-[var(--muted-foreground)]">
                            <div className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] shrink-0" />
                            <span className="text-[var(--foreground)]">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Your Submitted Proposal (For students who submitted) */}
                {!isOwner && !isClient && mySubmittedProposal && (
                  <div className="space-y-4 pt-4 border-t border-[var(--border)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          Your Submitted Proposal
                        </h2>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          You have already submitted a proposal for this requirement. Track review status below.
                        </p>
                      </div>
                      <Badge
                        variant={
                          mySubmittedProposal.status?.toUpperCase() === "ACCEPTED"
                            ? "success"
                            : mySubmittedProposal.status?.toUpperCase() === "REJECTED"
                            ? "destructive"
                            : "secondary"
                        }
                        className="uppercase font-semibold tracking-wider text-xs"
                      >
                        {mySubmittedProposal.status}
                      </Badge>
                    </div>

                    <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-sm">
                      <CardContent className="p-6 space-y-5">
                        <div className="flex items-start justify-between gap-4 flex-wrap pb-4 border-b border-[var(--border)]">
                          <div>
                            <p className="text-xs uppercase tracking-wider text-[var(--muted-foreground)]">Your Bid Amount</p>
                            <p className="text-2xl font-bold text-[var(--primary)]">
                              {formatCurrency(mySubmittedProposal.price)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs uppercase tracking-wider text-[var(--muted-foreground)]">Estimated Delivery</p>
                            <p className="text-sm font-semibold text-[var(--foreground)]">
                              {mySubmittedProposal.estimatedDelivery} days ({mySubmittedProposal.milestones?.length || 0} milestones)
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                            Your Proposed Approach
                          </p>
                          <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-line bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
                            {mySubmittedProposal.content}
                          </p>
                        </div>

                        {mySubmittedProposal.technologies && mySubmittedProposal.technologies.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                              Proposed Technologies
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {mySubmittedProposal.technologies.map((tech) => (
                                <Badge key={tech} variant="secondary" className="text-xs">
                                  {tech}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {mySubmittedProposal.milestones && mySubmittedProposal.milestones.length > 0 && (
                          <div className="space-y-2 pt-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                              Milestone Schedule ({mySubmittedProposal.milestones.length})
                            </p>
                            <div className="grid gap-2">
                              {mySubmittedProposal.milestones.map((ms, i) => (
                                <div
                                  key={ms.id || i}
                                  className="p-3 rounded-lg bg-[var(--card)] border border-[var(--border)] flex items-center justify-between text-xs gap-3"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-5 h-5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-bold flex items-center justify-center text-[10px] shrink-0">
                                      {i + 1}
                                    </span>
                                    <span className="font-medium truncate">{ms.title}</span>
                                    {Boolean(ms.estimatedDays || (ms as unknown as { durationDays?: number }).durationDays) && (
                                      <span className="text-[var(--muted-foreground)] shrink-0">
                                        • {ms.estimatedDays || (ms as unknown as { durationDays?: number }).durationDays} days
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-bold text-[var(--primary)] shrink-0">
                                    {formatCurrency(ms.amount)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)] flex-wrap">
                          <Link to="/proposals">
                            <Button variant="outline" size="sm" className="gap-1.5">
                              <FileText className="h-4 w-4" />
                              View in My Proposals
                            </Button>
                          </Link>
                          {request.clientId && (
                            <Button
                              size="sm"
                              className="gap-1.5 shadow-md cursor-pointer"
                              disabled={messagingId === mySubmittedProposal.id}
                              onClick={() => handleMessageStudent(request.clientId, mySubmittedProposal.id)}
                            >
                              <MessageSquare className="h-4 w-4" />
                              Message Client
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Incoming Proposals Section (For Client / Owner) */}
                {(isOwner || isClient) && (
                  <div className="space-y-4 pt-4 border-t border-[var(--border)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold">
                          Incoming Proposals ({incomingProposals.length})
                        </h2>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          Review student developer bids, milestone schedules, chat, and accept contracts.
                        </p>
                      </div>
                    </div>

                    {incomingProposals.length > 0 ? (
                      <div className="space-y-4">
                        {incomingProposals.map((proposal) => {
                          const isExpanded = expandedProposal === proposal.id;
                          const student = proposal.student;
                          const isAccepted = proposal.status?.toLowerCase() === "accepted";

                          return (
                            <Card key={proposal.id} className="border-[var(--border)] hover:border-[var(--primary)]/30 transition-all">
                              <CardContent className="p-5 space-y-4">
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                  <div className="flex items-center gap-3">
                                    <Avatar name={student?.name || "Developer"} size="md" />
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <p className="font-semibold text-sm">{student?.name || "Student Developer"}</p>
                                        {student?.studentProfile?.level && (
                                          <Badge variant="outline" className="text-[10px] capitalize">
                                            {student.studentProfile.level}
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-[var(--muted-foreground)]">
                                        {student?.studentProfile?.college || "Verified Student Developer"}
                                        {student?.studentProfile?.rating ? ` • ⭐ ${student.studentProfile.rating}` : ""}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <p className="text-xl font-bold text-[var(--primary)]">
                                      {formatCurrency(proposal.price)}
                                    </p>
                                    <p className="text-xs text-[var(--muted-foreground)]">
                                      {proposal.estimatedDelivery} days delivery • {proposal.milestones?.length || 0} milestones
                                    </p>
                                  </div>
                                </div>

                                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed whitespace-pre-line">
                                  {proposal.content}
                                </p>

                                {proposal.technologies && proposal.technologies.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5">
                                    {proposal.technologies.map((t) => (
                                      <Badge key={t} variant="secondary" className="text-xs">
                                        {t}
                                      </Badge>
                                    ))}
                                  </div>
                                )}

                                {proposal.milestones && proposal.milestones.length > 0 && (
                                  <div className="pt-2 border-t border-[var(--border)]">
                                    <button
                                      onClick={() => setExpandedProposal(isExpanded ? null : proposal.id)}
                                      className="flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:underline cursor-pointer"
                                    >
                                      <Layers className="h-3.5 w-3.5" />
                                      {isExpanded ? "Hide Milestone Schedule" : `View ${proposal.milestones.length} Milestones Breakdown`}
                                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                    </button>

                                    {isExpanded && (
                                      <div className="mt-3 space-y-2 pl-2 border-l-2 border-[var(--primary)]/30">
                                        {proposal.milestones.map((m, idx) => (
                                          <div key={m.id || idx} className="flex items-center justify-between text-xs py-1">
                                            <div>
                                              <span className="font-medium text-[var(--foreground)]">{idx + 1}. {m.title}</span>
                                              {m.description && (
                                                <p className="text-[11px] text-[var(--muted-foreground)]">{m.description}</p>
                                              )}
                                            </div>
                                            <span className="font-semibold text-[var(--primary)] shrink-0 ml-4">
                                              {formatCurrency(m.amount)}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] flex-wrap gap-2">
                                  <Badge className={getStatusColor(proposal.status)}>
                                    {proposal.status}
                                  </Badge>

                                  <div className="flex items-center gap-2">
                                    {student?.id && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5 cursor-pointer"
                                        disabled={messagingId === proposal.id}
                                        onClick={() => handleMessageStudent(student.id, proposal.id)}
                                      >
                                        <MessageSquare className="h-3.5 w-3.5" />
                                        Message Developer
                                      </Button>
                                    )}

                                    {isAccepted ? (
                                      <Link to="/contracts">
                                        <Button size="sm" className="gap-1.5">
                                          <CheckCircle2 className="h-3.5 w-3.5" />
                                          View Active Contract
                                        </Button>
                                      </Link>
                                    ) : (
                                      <Button
                                        size="sm"
                                        className="gap-1.5 cursor-pointer"
                                        disabled={acceptingId === proposal.id}
                                        onClick={() => handleAcceptProposal(proposal.id)}
                                      >
                                        {acceptingId === proposal.id ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                          <CheckCircle2 className="h-3.5 w-3.5" />
                                        )}
                                        Accept & Start Contract
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <Card className="border-dashed bg-[var(--card)]/50">
                        <CardContent className="p-8 text-center space-y-3">
                          <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center mx-auto">
                            <Briefcase className="h-6 w-6" />
                          </div>
                          <h3 className="font-semibold text-base">No proposals submitted yet</h3>
                          <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto">
                            Student developers are reviewing your requirement. As soon as bids arrive, they will appear here with detailed deliverables and milestones.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-4 lg:sticky lg:top-6 self-start">
                <Card>
                  <CardContent className="p-6 space-y-5">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[var(--muted-foreground)] mb-1">
                        Client Budget
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-[var(--primary)]">
                        {request.budgetMin && request.budgetMax
                          ? `${formatCurrency(request.budgetMin)} – ${formatCurrency(request.budgetMax)}`
                          : "Open to Proposals"}
                      </p>
                      {request.isFixedPrice && (
                        <Badge variant="secondary" className="mt-1.5">
                          Fixed Price Project
                        </Badge>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[var(--border)] space-y-2 text-sm">
                      {request.deadline && (
                        <div className="flex justify-between">
                          <span className="text-[var(--muted-foreground)]">Target Deadline</span>
                          <span className="font-medium">{formatDate(request.deadline)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-[var(--muted-foreground)]">Proposals</span>
                        <span className="font-medium">{incomingProposals.length || request.proposalCount || 0} submitted</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--muted-foreground)]">Experience Level</span>
                        <span className="font-medium capitalize">{request.difficulty}</span>
                      </div>
                    </div>

                    {isOwner || isClient ? (
                      <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                        <p className="text-xs text-[var(--muted-foreground)]">
                          You are viewing your posted requirement. Review developer proposals on the left.
                        </p>
                        <Link to="/contracts">
                          <Button variant="outline" className="w-full gap-2 cursor-pointer mb-2" size="sm">
                            <CheckCircle2 className="h-4 w-4" />
                            View Active Contracts
                          </Button>
                        </Link>
                        <Link to="/solutions/post">
                          <Button className="w-full gap-2 cursor-pointer" size="sm">
                            <PlusCircle className="h-4 w-4" />
                            Post Another Requirement
                          </Button>
                        </Link>
                      </div>
                    ) : mySubmittedProposal ? (
                      <div className="space-y-2.5 pt-2 border-t border-[var(--border)]">
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          <span>Proposal Submitted ({formatCurrency(mySubmittedProposal.price)})</span>
                        </div>
                        <Link to="/proposals">
                          <Button variant="outline" className="w-full gap-2 cursor-pointer" size="sm">
                            <FileText className="h-4 w-4" />
                            Track in My Proposals
                          </Button>
                        </Link>
                        {request.clientId && (
                          <Button
                            className="w-full gap-2 cursor-pointer shadow-md"
                            size="sm"
                            disabled={messagingId === mySubmittedProposal.id}
                            onClick={() => handleMessageStudent(request.clientId, mySubmittedProposal.id)}
                          >
                            <MessageSquare className="h-4 w-4" />
                            Message Client
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Button
                        className="w-full gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                        size="lg"
                        onClick={() => setIsSubmittingMode(true)}
                      >
                        <Send className="h-4 w-4" />
                        Submit Proposal
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {!isOwner && request.client && (
                  <Card>
                    <CardContent className="p-5">
                      <p className="text-xs uppercase tracking-wider text-[var(--muted-foreground)] mb-3">
                        Posted by
                      </p>
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar name={request.client.name} size="md" />
                        <div>
                          <p className="font-semibold text-sm">
                            {request.client.clientProfile?.organization || request.client.name}
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {request.client.name}
                          </p>
                        </div>
                      </div>

                      {request.client.isVerified && (
                        <Badge variant="success" className="mb-3">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Verified Client
                        </Badge>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-center pt-3 border-t border-[var(--border)] text-xs">
                        <div>
                          <p className="font-bold text-sm text-[var(--foreground)]">
                            {request.client.clientProfile?.projectsPosted || 5}
                          </p>
                          <p className="text-[var(--muted-foreground)]">Posted</p>
                        </div>
                        <div>
                          <p className="font-bold text-sm text-[var(--foreground)]">
                            ⭐ {request.client.clientProfile?.rating || 4.9}
                          </p>
                          <p className="text-[var(--muted-foreground)]">Rating</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="submit-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border)]">
              <button
                onClick={() => setIsSubmittingMode(false)}
                className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Requirement Overview
              </button>

              <Badge variant="outline" className="gap-1.5 text-xs py-1">
                <Sparkles className="h-3 w-3 text-[var(--primary)]" />
                Proposal Studio
              </Badge>
            </div>

            {submitSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-xl mx-auto text-center py-12 px-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xl space-y-5"
              >
                <div className="h-16 w-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                  <Check className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold">Proposal Submitted!</h2>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                  Your bid of <span className="font-semibold text-[var(--foreground)]">{formatCurrency(price)}</span> has been delivered to the client with your proposed milestone schedule.
                </p>
                <div className="flex gap-3 justify-center pt-2">
                  <Link to="/proposals">
                    <Button variant="outline">Track My Proposals</Button>
                  </Link>
                  <Button onClick={() => setIsSubmittingMode(false)}>
                    View Requirement
                  </Button>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmitProposal} className="max-w-4xl mx-auto space-y-8">
                {submitError && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 text-sm">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p>{submitError}</p>
                  </div>
                )}

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-[var(--primary)]" />
                      1. Cover Pitch & Solution Architecture
                    </CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAiGeneratePitch}
                      disabled={isAiGeneratingPitch}
                      className="gap-1.5 text-xs text-[var(--primary)] border-[var(--primary)]/30 hover:bg-[var(--primary)]/10 cursor-pointer"
                    >
                      {isAiGeneratingPitch ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />
                      )}
                      <span>{isAiGeneratingPitch ? "Drafting..." : "AI Auto-Pitch"}</span>
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {aiSuccessMessage && (
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
                        <Sparkles className="h-4 w-4 shrink-0" />
                        <span>{aiSuccessMessage}</span>
                      </div>
                    )}
                    <div>
                      <Label className="text-sm font-medium mb-1.5 block">
                        Describe how you will solve this problem *
                      </Label>
                      <Textarea
                        rows={6}
                        placeholder="Detail your system architecture, technical approach, and how you will meet the requirements..."
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        Technologies you will use for this project
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {request.preferredTechnologies?.map((tech) => {
                          const selected = selectedTechs.includes(tech);
                          return (
                            <button
                              type="button"
                              key={tech}
                              onClick={() => toggleTech(tech)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                                selected
                                  ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm"
                                  : "border-[var(--border)] hover:bg-[var(--muted)]"
                              }`}
                            >
                              {selected ? `✓ ${tech}` : `+ ${tech}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-[var(--primary)]" />
                      2. Proposed Pricing & Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium mb-1.5 block">
                          Total Bid Amount (₹) *
                        </Label>
                        <Input
                          type="number"
                          min="1000"
                          step="500"
                          value={price || ""}
                          onChange={(e) => handlePriceChange(Number(e.target.value))}
                          placeholder="e.g. 25000"
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-1.5 block">
                          Estimated Delivery Time (Days) *
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          max="180"
                          value={days}
                          onChange={(e) => setDays(Number(e.target.value))}
                          placeholder="e.g. 14"
                          required
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[var(--muted)]/40 border border-[var(--border)] flex items-center justify-between text-sm flex-wrap gap-3">
                      <div>
                        <p className="text-[var(--muted-foreground)]">Your Take-Home (90%)</p>
                        <p className="text-lg font-bold text-emerald-500">{formatCurrency(takeHome)}</p>
                      </div>
                      <div>
                        <p className="text-[var(--muted-foreground)]">Platform Fee (10%)</p>
                        <p className="text-sm font-medium text-[var(--muted-foreground)]">{formatCurrency(platformFee)}</p>
                      </div>
                      <div>
                        <p className="text-[var(--muted-foreground)]">Client Pays</p>
                        <p className="text-sm font-semibold">{formatCurrency(price)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-[var(--primary)]" />
                      3. Milestone Deliverables Schedule
                    </CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddMilestone}
                      className="gap-1 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Milestone
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {milestones.map((m, idx) => (
                      <div
                        key={m.id}
                        className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]/50 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider">
                            Milestone {idx + 1}
                          </span>
                          {milestones.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMilestone(m.id)}
                              className="text-red-500 hover:text-red-600 p-1 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <Label className="text-xs mb-1 block">Deliverable Title</Label>
                            <Input
                              value={m.title}
                              onChange={(e) => handleMilestoneChange(m.id, "title", e.target.value)}
                              placeholder="e.g. Backend API & PostgreSQL Schema"
                              required
                            />
                          </div>
                          <div>
                            <Label className="text-xs mb-1 block">Amount (₹)</Label>
                            <Input
                              type="number"
                              min="500"
                              step="500"
                              value={m.amount || ""}
                              onChange={(e) => handleMilestoneChange(m.id, "amount", Number(e.target.value))}
                              placeholder="Amount"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] pt-2">
                      <span>Total Milestones Sum: <strong className="text-[var(--foreground)]">{formatCurrency(totalMilestonesAmount)}</strong></span>
                      {totalMilestonesAmount !== price && (
                        <span className="text-amber-500">
                          Sum ({formatCurrency(totalMilestonesAmount)}) differs from Bid ({formatCurrency(price)})
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsSubmittingMode(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="gap-2 shadow-lg cursor-pointer"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" /> Publish & Submit Proposal
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

