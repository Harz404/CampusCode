import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, XCircle, Users } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { formatCurrency, formatDate } from "../../../lib/utils";
import type { SolutionRequest } from "../../../types";

export default function AdminRequestsPage() {
  const [solutionRequests, setSolutionRequests] = useState<SolutionRequest[]>([]);

  useEffect(() => {
    fetch("/api/solutions")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.requests) setSolutionRequests(data.requests);
      })
      .catch(() => setSolutionRequests([]));
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1">Solution Request Moderation</h1>
        <p className="text-[var(--muted-foreground)] mb-6">Review posted requirements</p>
      </motion.div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                  <th className="py-3 px-4 text-left font-medium text-[var(--muted-foreground)]">Request</th>
                  <th className="py-3 px-4 text-left font-medium text-[var(--muted-foreground)]">Client</th>
                  <th className="py-3 px-4 text-right font-medium text-[var(--muted-foreground)]">Budget</th>
                  <th className="py-3 px-4 text-right font-medium text-[var(--muted-foreground)]">Proposals</th>
                  <th className="py-3 px-4 text-left font-medium text-[var(--muted-foreground)]">Status</th>
                  <th className="py-3 px-4 text-left font-medium text-[var(--muted-foreground)]">Posted</th>
                  <th className="py-3 px-4 text-right font-medium text-[var(--muted-foreground)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {solutionRequests.map((req) => (
                  <tr key={req.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/30 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-medium">{req.title}</p>
                      <p className="text-xs text-[var(--muted-foreground)] capitalize">{req.category}</p>
                    </td>
                    <td className="py-3 px-4 text-[var(--muted-foreground)]">{req.client?.name || "—"}</td>
                    <td className="py-3 px-4 text-right font-medium">
                      {req.budgetMin && req.budgetMax
                        ? `${formatCurrency(req.budgetMin)} – ${formatCurrency(req.budgetMax)}`
                        : "Open"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{req.proposalCount || 0}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={req.status === "open" ? "success" : "warning"}>{req.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-[var(--muted-foreground)]">{formatDate(req.createdAt)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 justify-end">
                        <Link to={`/solutions/${req.id}`}>
                          <Button variant="ghost" size="sm"><Eye className="h-3.5 w-3.5" /></Button>
                        </Link>
                        <Button variant="ghost" size="sm" className="text-red-500"><XCircle className="h-3.5 w-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

