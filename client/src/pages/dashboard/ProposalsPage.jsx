import { apiFetch } from "@/lib/api";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Clock, MessageSquare, Send, ArrowRight } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { formatCurrency, getStatusColor } from "../../lib/utils";
import { useUserData } from "../../lib/user-store";
import { useAuth } from "../../hooks/useAuth";
export default function ProposalsPage() {
    const { proposals, isLoaded } = useUserData();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [chatLoadingId, setChatLoadingId] = useState(null);
    const isClient = user?.role?.toLowerCase() === "client";
    return (<div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold mb-1">{isClient ? "Received Proposals" : "My Proposals"}</h1>
          <p className="text-[var(--muted-foreground)]">Track your submitted project bids and client applications</p>
        </div>
        <Link to="/solutions">
          <Button className="gap-2">
            <Send className="h-4 w-4"/> Browse Requirements
          </Button>
        </Link>
      </motion.div>

      {!isLoaded ? (<div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (<div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-3 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="h-5 w-44 rounded bg-[var(--muted)]"/>
                <div className="h-5 w-20 rounded-full bg-[var(--muted)]"/>
              </div>
              <div className="h-4 w-full rounded bg-[var(--muted)]"/>
              <div className="flex gap-4">
                <div className="h-4 w-20 rounded bg-[var(--muted)]"/>
                <div className="h-4 w-24 rounded bg-[var(--muted)]"/>
              </div>
            </div>))}
        </div>) : proposals.length > 0 ? (<div className="space-y-4">
          {proposals.map((proposal, i) => (<motion.div key={proposal.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
              <Card className="card-hover">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Link to={`/proposals/${proposal.id}`} className="hover:underline">
                          <h3 className="font-semibold">{proposal.solutionRequest?.title || "Project Proposal"}</h3>
                        </Link>
                        <Badge className={getStatusColor(proposal.status)}>{proposal.status}</Badge>
                      </div>
                      <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 mb-3">{proposal.content}</p>

                      <div className="flex items-center gap-4 text-sm flex-wrap">
                        <span className="font-semibold text-[var(--primary)]">{formatCurrency(proposal.price)}</span>
                        <span className="flex items-center gap-1 text-[var(--muted-foreground)]">
                          <Clock className="h-3.5 w-3.5"/> {proposal.estimatedDelivery} days
                        </span>
                        <span className="text-[var(--muted-foreground)]">{proposal.milestones?.length || 0} milestones</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {(proposal.technologies || []).slice(0, 4).map((tech) => (<Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <Link to={`/proposals/${proposal.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          Details
                        </Button>
                      </Link>
                      {proposal.status === "accepted" && (<Link to="/contracts"><Button size="sm" className="w-full">View Contract</Button></Link>)}
                      <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer" disabled={chatLoadingId === proposal.id} onClick={async () => {
                    setChatLoadingId(proposal.id);
                    try {
                        const res = await apiFetch("/api/messages/conversations", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                participantId: isClient ? proposal.studentId : proposal.solutionRequest?.clientId,
                                proposalId: proposal.id,
                                context: { type: "proposal", id: proposal.id },
                            }),
                        });
                        if (res.ok) {
                            const data = await res.json();
                            navigate(`/messages?conv=${data.conversation.id}`);
                        }
                        else {
                            const err = await res.json();
                            console.error("Failed to start chat:", err);
                        }
                    }
                    catch (err) {
                        console.error("Failed to start conversation:", err);
                    }
                    finally {
                        setChatLoadingId(null);
                    }
                }}>
                        <MessageSquare className="h-3.5 w-3.5"/>
                        <span className="text-xs">{isClient ? "Message Developer" : "Message Client"}</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>))}
        </div>) : (<div className="py-16 text-center rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] mx-auto mb-4">
            <FileText className="h-8 w-8"/>
          </div>
          <h3 className="text-lg font-bold mb-1">No proposals submitted yet</h3>
          <p className="text-sm text-[var(--muted-foreground)] max-w-sm mx-auto mb-6">
            Browse live solution requests from companies and clients, submit competitive proposals, and earn on completion.
          </p>
          <Link to="/solutions">
            <Button className="gap-2">
              Browse Client Requests <ArrowRight className="h-4 w-4"/>
            </Button>
          </Link>
        </div>)}
    </div>);
}
