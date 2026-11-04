import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FolderKanban, Package, Send, FileCheck, DollarSign, TrendingUp, ArrowRight, Clock, Zap, ChevronRight, PlusCircle, LogIn, UserPlus, Store, Lightbulb, Star, } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useUserData } from "@/lib/user-store";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, } from "recharts";
const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
};
export function DashboardPage() {
    const { user, isAuthenticated } = useAuth();
    const { projects, isLoaded, stats } = useUserData();
    const [solutionRequests, setSolutionRequests] = useState([]);
    const [productsList, setProductsList] = useState([]);
    useEffect(() => {
        fetch("/api/solutions")
            .then((res) => res.json())
            .then((data) => setSolutionRequests(data.requests || []))
            .catch(() => setSolutionRequests([]));
        fetch("/api/products")
            .then((res) => res.json())
            .then((data) => setProductsList(data.products || []))
            .catch(() => setProductsList([]));
    }, []);
    const role = (user?.role || "student").toLowerCase();
    const isClient = role === "client";
    const userFirstName = isAuthenticated && user?.name ? user.name.split(" ")[0] : null;
    const activeProjects = projects.filter((p) => {
        const s = typeof p.status === "string" ? p.status.toLowerCase() : "";
        return s === "active" || s === "planning" || s === "in_progress" || !s;
    });
    const studentStats = [
        { label: "Active Projects", value: stats.activeProjectsCount, icon: FolderKanban, color: "text-blue-500 bg-blue-100 dark:bg-blue-900/30" },
        { label: "Published Products", value: stats.publishedProductsCount, icon: Package, color: "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30" },
        { label: "Applications", value: stats.proposalsCount, icon: Send, color: "text-purple-500 bg-purple-100 dark:bg-purple-900/30" },
        { label: "Active Contracts", value: stats.activeContractsCount, icon: FileCheck, color: "text-amber-500 bg-amber-100 dark:bg-amber-900/30" },
        { label: "Total Sales", value: stats.totalSales, icon: DollarSign, color: "text-cyan-500 bg-cyan-100 dark:bg-cyan-900/30" },
        { label: "Total Earnings", value: formatCurrency(stats.totalEarnings), icon: TrendingUp, color: "text-rose-500 bg-rose-100 dark:bg-rose-900/30", isString: true },
    ];
    const clientStats = [
        { label: "Open Requests", value: solutionRequests.length, icon: Lightbulb, color: "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30" },
        { label: "Active Contracts", value: stats.activeContractsCount, icon: FileCheck, color: "text-amber-500 bg-amber-100 dark:bg-amber-900/30" },
        { label: "Proposals Received", value: stats.proposalsCount, icon: Send, color: "text-purple-500 bg-purple-100 dark:bg-purple-900/30" },
        { label: "Total Spent", value: formatCurrency(stats.totalEarnings), icon: DollarSign, color: "text-rose-500 bg-rose-100 dark:bg-rose-900/30", isString: true },
    ];
    const dashboardStats = isClient ? clientStats : studentStats;
    const studentQuickActions = [
        { label: "Create New Project", href: "/projects", icon: FolderKanban },
        { label: "Publish to Marketplace", href: "/sell", icon: Package },
        { label: "Browse Opportunities", href: "/solutions", icon: Zap },
        { label: "View Earnings", href: "/earnings", icon: DollarSign },
    ];
    const clientQuickActions = [
        { label: "Post New Requirement", href: "/solutions/post", icon: PlusCircle },
        { label: "Browse Software", href: "/marketplace", icon: Store },
        { label: "View Contracts", href: "/contracts", icon: FileCheck },
        { label: "View My Requirements", href: "/solutions", icon: Lightbulb },
    ];
    const quickActions = isClient ? clientQuickActions : studentQuickActions;
    const userEarningsData = [
        { month: "Jan", earnings: 0 },
        { month: "Feb", earnings: 0 },
        { month: "Mar", earnings: 0 },
        { month: "Apr", earnings: 0 },
        { month: "May", earnings: 0 },
        { month: "Jun", earnings: 0 },
        { month: "Jul", earnings: Math.round(stats.totalEarnings * 0.4) },
        { month: "Aug", earnings: stats.totalEarnings },
    ];
    const userSkills = user?.studentProfile?.skills || ["React", "TypeScript", "Node.js"];
    const matchedRequests = solutionRequests
        .filter((sr) => sr.status === "open")
        .slice(0, 3)
        .map((sr) => {
        const matchScore = 85 + (sr.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 12);
        const preferred = sr.preferredTechnologies || [];
        const matchingSkills = preferred.filter((t) => userSkills.some((s) => s.toLowerCase() === t.toLowerCase()));
        return {
            ...sr,
            matchScore,
            matchingSkills: matchingSkills.length > 0 ? matchingSkills : preferred.slice(0, 2),
        };
    });
    const featuredProducts = productsList.slice(0, 3);
    return (<div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div {...fadeUp} transition={{ delay: 0 }}>
        {isAuthenticated && user ? (<div>
            <h1 className="text-2xl font-bold mb-1">
              Welcome back, {userFirstName} 👋
            </h1>
            <p className="text-[var(--muted-foreground)] text-sm">
              {isClient
                ? "Manage your requirements, contracts, and software solutions."
                : "Here's what's happening with your projects and software marketplace."}
            </p>
          </div>) : (<div className="p-6 rounded-2xl border border-[var(--border)] bg-gradient-to-r from-[var(--primary)]/10 via-purple-500/5 to-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">Welcome to CampusCode 👋</h1>
              <p className="text-sm text-[var(--muted-foreground)]">
                You are currently viewing in guest mode. Sign in or create a developer profile to build and earn.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link to="/login">
                <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer">
                  <LogIn className="h-4 w-4"/> Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="gap-1.5 cursor-pointer">
                  <UserPlus className="h-4 w-4"/> Create Account
                </Button>
              </Link>
            </div>
          </div>)}
      </motion.div>

      {/* Stats Grid */}
      <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {dashboardStats.map((stat) => (<Card key={stat.label} className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color}`}>
                  <stat.icon className="h-4.5 w-4.5"/>
                </div>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>))}
      </motion.div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Current Work */}
        <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="lg:col-span-3">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {isClient ? "Your Requirements" : "Current Work"}
                </CardTitle>
                <Link to={isClient ? "/solutions" : "/projects"}>
                  <Button variant="ghost" size="sm" className="text-xs cursor-pointer">
                    View all <ArrowRight className="h-3.5 w-3.5 ml-1"/>
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center">
              {!isLoaded ? (<div className="space-y-3 p-1 animate-pulse">
                  <div className="h-16 rounded-xl bg-[var(--muted)]"/>
                  <div className="h-16 rounded-xl bg-[var(--muted)]"/>
                </div>) : activeProjects.length > 0 ? (<div className="space-y-3">
                  {activeProjects.map((project) => (<Link key={project.id} to={`/projects/${project.id}`}>
                      <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-[var(--muted)] transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-sm truncate">{project.name}</h3>
                            <Badge variant={project.contractId ? "warning" : "secondary"} className="shrink-0 text-[10px]">
                              {project.contractId ? "Contract" : "Personal"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
                            {project.deadline && (<span className="flex items-center gap-1">
                                <Clock className="h-3 w-3"/> Due {new Date(project.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                              </span>)}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold">{project.progress}%</p>
                          <div className="w-20 h-1.5 rounded-full bg-[var(--muted)] mt-1">
                            <div className="h-full rounded-full bg-[var(--primary)] transition-all" style={{ width: `${project.progress}%` }}/>
                          </div>
                        </div>
                      </div>
                    </Link>))}
                </div>) : (<div className="py-8 text-center space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] mx-auto">
                    <FolderKanban className="h-6 w-6"/>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">No Active Projects</h4>
                    <p className="text-xs text-[var(--muted-foreground)] max-w-xs mx-auto mt-1">
                      Start building software or accept a client solution request to track your work here.
                    </p>
                  </div>
                  <Link to="/projects" className="inline-block">
                    <Button size="sm" className="gap-1.5 text-xs cursor-pointer">
                      <PlusCircle className="h-3.5 w-3.5"/> Create Project
                    </Button>
                  </Link>
                </div>)}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((action) => (<Link key={action.href} to={action.href}>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--muted)] transition-colors cursor-pointer">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)]/10">
                      <action.icon className="h-4 w-4 text-[var(--primary)]"/>
                    </div>
                    <span className="text-sm font-medium flex-1">{action.label}</span>
                    <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]"/>
                  </div>
                </Link>))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Earnings Chart */}
        <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    {isClient ? "Spending Overview" : "Monthly Earnings"}
                  </CardTitle>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Total: {formatCurrency(stats.totalEarnings)}
                  </p>
                </div>
                <Link to={isClient ? "/contracts" : "/earnings"}>
                  <Button variant="ghost" size="sm" className="text-xs cursor-pointer">View details</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={userEarningsData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)"/>
                    <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" tickFormatter={(v) => `₹${v}`}/>
                    <Tooltip formatter={(value) => [formatCurrency(Number(value) || 0), isClient ? "Spent" : "Earnings"]} contentStyle={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
        }}/>
                    <Area type="monotone" dataKey="earnings" stroke="var(--primary)" strokeWidth={2} fill="url(#earningsGradient)"/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recommended Opportunities or Products */}
        <motion.div {...fadeUp} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  {isClient ? (<>
                      <Star className="h-4 w-4 text-amber-500"/>
                      Featured Software
                    </>) : (<>
                      <Zap className="h-4 w-4 text-amber-500"/>
                      Recommended for You
                    </>)}
                </CardTitle>
                <Link to={isClient ? "/marketplace" : "/solutions"}>
                  <Button variant="ghost" size="sm" className="text-xs cursor-pointer">View all</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {isClient ? (featuredProducts.map((product) => (<Link key={product.id} to={`/marketplace/${product.slug || product.id}`}>
                    <div className="p-3 rounded-lg border border-[var(--border)] hover:border-[var(--primary)]/30 transition-all">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-medium text-sm leading-tight">{product.name}</h3>
                        <span className="text-sm font-bold text-[var(--primary)] shrink-0">
                          {product.isFree ? "Free" : formatCurrency(product.price)}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--muted-foreground)] line-clamp-1 mb-2">
                        {product.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {(product.technologies || []).slice(0, 3).map((tech) => (<Badge key={tech} variant="secondary" className="text-[10px]">{tech}</Badge>))}
                      </div>
                    </div>
                  </Link>))) : (matchedRequests.map((req) => (<Link key={req.id} to={`/solutions/${req.id}`}>
                    <div className="p-3 rounded-lg border border-[var(--border)] hover:border-[var(--primary)]/30 transition-all">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-medium text-sm leading-tight">{req.title}</h3>
                        <Badge variant="default" className="shrink-0 text-[10px] bg-emerald-500">
                          {req.matchScore}% Match
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mb-2 text-xs text-[var(--muted-foreground)]">
                        <span className="font-medium text-[var(--foreground)]">
                          {req.budgetMin && req.budgetMax
                ? `${formatCurrency(req.budgetMin)} – ${formatCurrency(req.budgetMax)}`
                : "Open"}
                        </span>
                        <span>•</span>
                        <span>{req.proposalCount || 0} proposals</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {req.matchingSkills.map((skill) => (<Badge key={skill} variant="secondary" className="text-[10px]">✓ {skill}</Badge>))}
                      </div>
                    </div>
                  </Link>)))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>);
}
export default DashboardPage;
