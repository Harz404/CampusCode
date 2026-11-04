import { apiFetch } from "@/lib/api";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Lightbulb, Plus, Clock, Users, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { formatCurrency, formatRelativeTime } from "../../lib/utils";
import { useAuth } from "../../hooks/useAuth";
export default function SolutionsPage() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const isClient = isAuthenticated && user?.role?.toLowerCase() === "client";
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");
    const [sortBy, setSortBy] = useState("newest");
    useEffect(() => {
        let cancelled = false;
        async function loadRequirements() {
            try {
                const queryParams = new URLSearchParams();
                if (category !== "all")
                    queryParams.set("category", category);
                if (search)
                    queryParams.set("search", search);
                queryParams.set("sort", sortBy);
                if (isClient && user?.id) {
                    queryParams.set("clientId", user.id);
                }
                const res = await apiFetch(`/api/solutions?${queryParams.toString()}`);
                if (res.ok) {
                    const data = await res.json();
                    if (!cancelled && data.requests) {
                        const filtered = isClient && user?.id
                            ? data.requests.filter((r) => r.clientId === user.id || r.client?.id === user.id)
                            : data.requests;
                        setRequests(filtered);
                    }
                }
            }
            catch (err) {
                console.error("[Solutions] Error fetching requirements:", err);
            }
            finally {
                if (!cancelled)
                    setLoading(false);
            }
        }
        if (!authLoading) {
            loadRequirements();
        }
        return () => {
            cancelled = true;
        };
    }, [search, category, sortBy, isClient, user?.id, authLoading]);
    const categories = ["all", "web", "ai-ml", "mobile", "automation", "data-science"];
    return (<div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              {isClient ? "My Requirements" : "Find a Solution"}
            </h1>
            <p className="text-[var(--muted-foreground)]">
              {isClient
            ? "Manage your posted requirements and review incoming proposals"
            : "Browse requirements and submit proposals to build software solutions"}
            </p>
          </div>
          <Link to="/solutions/post">
            <Button>
              <Plus className="h-4 w-4"/>
              Post a Requirement
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Search & Filters */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]"/>
            <Input placeholder="Search requirements..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)}/>
          </div>
          <select className="h-10 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] px-3 text-sm custom-select cursor-pointer" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="budget_high">Highest Budget</option>
            <option value="proposals">Fewest Proposals</option>
          </select>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
          {categories.map((cat) => (<button key={cat} onClick={() => setCategory(cat)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${category === cat
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80"}`}>
              {cat === "all" ? "All" : cat.replace("-", " / ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </button>))}
        </div>
      </motion.div>

      {/* Results Count */}
      {!loading && (<p className="text-sm text-[var(--muted-foreground)] mb-4">{requests.length} {requests.length === 1 ? "requirement" : "requirements"} found</p>)}

      {/* List */}
      {loading ? (<div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]"/>
        </div>) : (<div className="space-y-4">
          {requests.map((req, i) => (<motion.div key={req.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i }}>
              <Link to={`/solutions/${req.id}`}>
                <Card className="card-hover hover:border-[var(--primary)]/50 transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-semibold text-base">{req.title}</h3>
                          <Badge variant={typeof req.status === "string" && req.status.toLowerCase() === "open" ? "success" : "warning"}>
                            {typeof req.status === "string" && req.status.toLowerCase() === "open" ? "Open" : "In Progress"}
                          </Badge>
                          <Badge variant="outline">{req.difficulty}</Badge>
                        </div>
                        <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 mb-3">{req.description}</p>

                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {req.preferredTechnologies?.slice(0, 4).map((tech) => (<Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>))}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)] flex-wrap">
                          <span className="font-semibold text-sm text-[var(--foreground)]">
                            {req.budgetMin && req.budgetMax ? `${formatCurrency(req.budgetMin)} – ${formatCurrency(req.budgetMax)}` : "Open Budget"}
                          </span>
                          <span className="flex items-center gap-1"><Users className="h-3 w-3"/>{req.proposalCount || 0} proposals</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3"/>Posted {formatRelativeTime(req.createdAt)}</span>
                          {!isClient && req.client && <span>by {req.client.clientProfile?.organization || req.client.name}</span>}
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-[var(--muted-foreground)] shrink-0 mt-1"/>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>))}
        </div>)}

      {!loading && requests.length === 0 && (<div className="text-center py-16">
          <Lightbulb className="h-12 w-12 mx-auto text-[var(--muted-foreground)]/30 mb-4"/>
          <h3 className="font-semibold mb-1">
            {isClient ? "No requirements posted yet" : "No requirements found"}
          </h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            {isClient
                ? "You haven't posted any requirements yet. Post your software requirement to receive proposals from talented developers."
                : "Try adjusting your search or filters"}
          </p>
          {isClient && (<Link to="/solutions/post" className="inline-block mt-4">
              <Button className="gap-2">
                <Plus className="h-4 w-4"/> Post a Requirement
              </Button>
            </Link>)}
        </div>)}
    </div>);
}
