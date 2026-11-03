import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Clock, DollarSign, Calendar, Code2, Star,
  CheckCircle2, XCircle, MessageSquare, User, Layers, ShieldCheck, Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Avatar } from "../../components/ui/avatar";
import { formatCurrency, formatRelativeTime, getStatusColor } from "../../lib/utils";
import { useAuth } from "../../hooks/useAuth";
import type { Proposal } from "../../types";

export default function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isClient = user?.role?.toLowerCase() === "client";
  const [messagingLoading, setMessagingLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState<Proposal | null>(null);

  useEffect(() => {
    async function loadProposal() {
      try {
        const res = await fetch(`/api/proposals/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProposal(data);
        }
      } catch (err) {
        console.error("Error loading proposal:", err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadProposal();
  }, [id]);

  if (loading) {
    return (
      <div className="p-12 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-2">Proposal Not Found</h1>
        <p className="text-[var(--muted-foreground)] mb-4">The proposal you&apos;re looking for doesn&apos;t exist.</p>
        <Link to="/proposals"><Button variant="outline">Back to Proposals</Button></Link>
      </div>
    );
  }

  const request = proposal.solutionRequest;
  const totalMilestoneAmount = (proposal.milestones || []).reduce((s, m) => s + m.amount, 0);
  const totalDays = (proposal.milestones || []).reduce((s, m) => s + (m.estimatedDays || (m as unknown as { durationDays?: number }).durationDays || 0), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <Link to="/proposals" className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Proposals
      </Link>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getStatusColor(proposal.status)}>{proposal.status}</Badge>
              <span className="text-xs text-[var(--muted-foreground)]">Submitted {formatRelativeTime(proposal.createdAt)}</span>
            </div>
            <h1 className="text-2xl font-bold mb-1">Proposal for: {request?.title || "Solution Request"}</h1>
            <p className="text-[var(--muted-foreground)] text-sm">{request?.category} • {request?.difficulty}</p>
          </div>
          <div className="flex gap-2">
            {proposal.status === "pending" && (
              <>
                <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 gap-1.5">
                  <XCircle className="h-4 w-4" /> Withdraw
                </Button>
                <Button
                  className="gap-1.5"
                  disabled={messagingLoading}
                  onClick={async () => {
                    const otherUserId = isClient ? proposal.studentId : request?.clientId;
                    setMessagingLoading(true);
                    try {
                      const res = await fetch("/api/messages/conversations", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          participantId: otherUserId,
                          proposalId: proposal.id,
                          context: { type: "proposal", id: proposal.id },
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
              </>
            )}
            {proposal.status === "accepted" && (
              <Link to="/contracts">
                <Button className="gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> View Contract
                </Button>
              </Link>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <DollarSign className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
                  <p className="text-xl font-bold">{formatCurrency(proposal.price)}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Total Bid</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Calendar className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                  <p className="text-xl font-bold">{proposal.estimatedDelivery} days</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Timeline</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Layers className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                  <p className="text-xl font-bold">{proposal.milestones?.length || 0}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Milestones</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader><CardTitle className="text-lg">Proposal Details</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{proposal.content}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Code2 className="h-4 w-4" /> Proposed Tech Stack</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(proposal.technologies || []).map((t) => (
                    <Badge key={t} variant="secondary" className="px-3 py-1.5">{t}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {proposal.milestones && proposal.milestones.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardHeader><CardTitle className="text-lg">Milestone Breakdown</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {proposal.milestones.map((milestone, idx) => (
                    <div key={milestone.id || idx} className="flex items-start gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--muted)]/20">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] font-bold text-sm shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{milestone.title}</h4>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-[var(--muted-foreground)] flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {milestone.estimatedDays || (milestone as unknown as { durationDays?: number }).durationDays} days
                            </span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(milestone.amount)}
                            </span>
                          </div>
                        </div>
                        {milestone.description && (
                          <p className="text-xs text-[var(--muted-foreground)]">{milestone.description}</p>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-3 border-t border-[var(--border)] text-sm font-semibold">
                    <span>Total</span>
                    <div className="flex items-center gap-4">
                      <span className="text-[var(--muted-foreground)]">{totalDays} days</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(totalMilestoneAmount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader><CardTitle className="text-base">Submitted By</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar name={proposal.student?.name || "Student"} size="lg" />
                  <div>
                    <p className="font-semibold">{proposal.student?.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{proposal.student?.studentProfile?.college}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-2.5 rounded-lg bg-[var(--muted)]/50">
                    <div className="flex items-center justify-center gap-0.5 mb-0.5">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-sm">{proposal.student?.studentProfile?.rating || 4.9}</span>
                    </div>
                    <p className="text-[10px] text-[var(--muted-foreground)]">Rating</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[var(--muted)]/50">
                    <p className="font-bold text-sm">{proposal.student?.studentProfile?.completedProjects || 0}</p>
                    <p className="text-[10px] text-[var(--muted-foreground)]">Completed</p>
                  </div>
                </div>
                {proposal.student?.isVerified && (
                  <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-2.5 rounded-lg">
                    <ShieldCheck className="h-4 w-4" /> Verified Student
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {proposal.student?.studentProfile?.skills?.slice(0, 6).map((skill) => (
                    <Badge key={skill} variant="outline" className="text-[10px]">{skill}</Badge>
                  ))}
                </div>
                <Link to={`/portfolio/${proposal.student?.studentProfile?.portfolioUrl || proposal.studentId}`}>
                  <Button variant="outline" className="w-full text-xs gap-1.5" size="sm">
                    <User className="h-3.5 w-3.5" /> View Portfolio
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {request && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card>
                <CardHeader><CardTitle className="text-base">Solution Request</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <h4 className="font-semibold text-sm">{request.title}</h4>
                  <p className="text-xs text-[var(--muted-foreground)] line-clamp-3">{request.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--muted-foreground)]">Budget</span>
                    <span className="font-semibold">
                      {request.budgetMin && request.budgetMax
                        ? `${formatCurrency(request.budgetMin)} – ${formatCurrency(request.budgetMax)}`
                        : "Open"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--muted-foreground)]">Proposals</span>
                    <span className="font-semibold">{request.proposalCount || 0}</span>
                  </div>
                  <Link to={`/solutions/${request.id}`}>
                    <Button variant="outline" className="w-full text-xs" size="sm">View Full Request</Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

