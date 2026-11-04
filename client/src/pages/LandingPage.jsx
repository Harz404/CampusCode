import { apiFetch } from "@/lib/api";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Code2, Rocket, DollarSign, Users, Star, Zap, Shield, Lightbulb, ChevronRight, TrendingUp, Package, GitBranch, Award, Layout, Search, Send, Eye, CreditCard, MessageSquare, Brain, } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { formatCurrency } from "@/lib/utils";
const fadeUp = {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.5, ease: "easeOut" },
};
const stagger = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
};
export function LandingPage() {
    const [products, setProducts] = useState([]);
    const [solutionRequests, setSolutionRequests] = useState([]);
    const [students, setStudents] = useState([]);
    useEffect(() => {
        apiFetch("/api/products")
            .then((res) => res.json())
            .then((data) => setProducts(data.products || []))
            .catch(() => setProducts([]));
        apiFetch("/api/solutions")
            .then((res) => res.json())
            .then((data) => setSolutionRequests(data.requests || []))
            .catch(() => setSolutionRequests([]));
    }, []);
    return (<div className="min-h-screen flex flex-col">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[var(--primary)]/5 rounded-full blur-3xl"/>
          <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl"/>
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-3xl"/>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-28 lg:pb-32">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
                <Zap className="h-3.5 w-3.5 mr-1.5 text-[var(--primary)]"/>
                The Student Developer Platform
              </Badge>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              Build software. Sell software.{" "}
              <span className="gradient-text">Solve real problems.</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="text-lg sm:text-xl text-[var(--muted-foreground)] mb-10 max-w-2xl mx-auto leading-relaxed">
              CampusCode connects student developers with real-world opportunities to build, launch, and monetize software.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register">
                <Button size="lg" className="text-base px-8 w-full sm:w-auto cursor-pointer gap-2">
                  Start Building
                  <ArrowRight className="h-4 w-4"/>
                </Button>
              </Link>
              <Link to="/solutions/post">
                <Button variant="outline" size="lg" className="text-base px-8 w-full sm:w-auto cursor-pointer">
                  Post a Requirement
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Two Pathways */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="mt-20 grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Student Path */}
            <Card className="relative overflow-hidden card-hover group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent"/>
              <CardContent className="relative p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                    <Code2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400"/>
                  </div>
                  <h3 className="font-semibold text-lg">For Students</h3>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {["Build", "Showcase", "Sell", "Earn"].map((step, i) => (<span key={step} className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-sm font-medium">
                        {step}
                      </span>
                      {i < 3 && <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]"/>}
                    </span>))}
                </div>
                <p className="text-sm text-[var(--muted-foreground)] mt-4">
                  Build projects, manage them with pro tools, publish to marketplace, and earn real money.
                </p>
              </CardContent>
            </Card>

            {/* Client Path */}
            <Card className="relative overflow-hidden card-hover group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent"/>
              <CardContent className="relative p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                    <Lightbulb className="h-5 w-5 text-emerald-600 dark:text-emerald-400"/>
                  </div>
                  <h3 className="font-semibold text-lg">For Clients</h3>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {["Post Problem", "Get Proposals", "Get Built", "Pay"].map((step, i) => (<span key={step} className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
                        {step}
                      </span>
                      {i < 3 && <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]"/>}
                    </span>))}
                </div>
                <p className="text-sm text-[var(--muted-foreground)] mt-4">
                  Post your software requirement, receive proposals from talented students, and get it built.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────── */}
      <section id="how-it-works" className="scroll-mt-20 py-20 lg:py-28 bg-[var(--muted)]/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Two marketplaces. One platform.</h2>
            <p className="text-[var(--muted-foreground)] max-w-2xl mx-auto">
              Whether you're selling existing software or building custom solutions, CampusCode has you covered.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Sell Software */}
            <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Package className="h-5 w-5 text-indigo-500"/>
                Software Marketplace
              </h3>
              <div className="space-y-4">
                {[
            { icon: Code2, title: "Build your project", desc: "Use integrated project management tools with Kanban boards, tasks, and milestones." },
            { icon: Layout, title: "Publish to marketplace", desc: "Create a polished listing with screenshots, documentation, and pricing." },
            { icon: Eye, title: "Get discovered", desc: "Students and organizations browse, search, and find your software." },
            { icon: DollarSign, title: "Earn money", desc: "Receive payments directly with transparent pricing and low platform fees." },
        ].map((step, i) => (<div key={i} className="flex gap-4 p-4 rounded-xl hover:bg-[var(--card)] transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30 shrink-0">
                      <step.icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400"/>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">{step.title}</h4>
                      <p className="text-sm text-[var(--muted-foreground)]">{step.desc}</p>
                    </div>
                  </div>))}
              </div>
            </motion.div>

            {/* Solution Requests */}
            <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-emerald-500"/>
                Solution Marketplace
              </h3>
              <div className="space-y-4">
                {[
            { icon: Send, title: "Post your requirement", desc: "Describe the problem, set budget, choose technology, and define deliverables." },
            { icon: Search, title: "Receive proposals", desc: "Skilled students submit detailed proposals with timelines and milestones." },
            { icon: GitBranch, title: "Collaborate", desc: "Work together in a project workspace with tasks, messaging, and progress tracking." },
            { icon: CreditCard, title: "Pay on milestones", desc: "Release payments as milestones are completed. Safe and transparent." },
        ].map((step, i) => (<div key={i} className="flex gap-4 p-4 rounded-xl hover:bg-[var(--card)] transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30 shrink-0">
                      <step.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400"/>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">{step.title}</h4>
                      <p className="text-sm text-[var(--muted-foreground)]">{step.desc}</p>
                    </div>
                  </div>))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Featured Software ─────────────────────────── */}
      <section id="featured-software" className="scroll-mt-20 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="flex items-end justify-between mb-10">
            <div>
              <Badge variant="secondary" className="mb-3">Trending Software</Badge>
              <h2 className="text-3xl font-bold">Featured on CampusCode</h2>
            </div>
            <Link to="/marketplace" className="hidden sm:flex items-center gap-1 text-sm font-medium text-[var(--primary)] hover:underline">
              View all <ArrowRight className="h-4 w-4"/>
            </Link>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.slice(0, 6).map((product, i) => (<motion.div key={product.id} {...stagger} transition={{ delay: 0.05 * i }}>
                <Link to={`/marketplace/${product.slug || product.id}`}>
                  <Card className="card-hover h-full">
                    <CardContent className="p-5">
                      <div className="h-40 rounded-lg bg-gradient-to-br from-[var(--muted)] to-[var(--muted)]/50 mb-4 flex items-center justify-center">
                        <Code2 className="h-10 w-10 text-[var(--muted-foreground)]/30"/>
                      </div>

                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-base leading-tight">{product.name}</h3>
                        <span className="font-bold text-[var(--primary)] whitespace-nowrap">
                          {product.isFree ? "Free" : formatCurrency(product.price)}
                        </span>
                      </div>

                      <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 mb-3">
                        {product.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {(product.technologies || []).slice(0, 3).map((tech) => (<Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>))}
                      </div>

                      <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400"/>
                          <span className="font-medium text-[var(--foreground)]">{product.reviewCount ? product.rating : "No reviews yet"}</span>
                        </div>
                        <span>{product.salesCount || 0} sales</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>))}
          </div>

          <div className="sm:hidden mt-6 text-center">
            <Link to="/marketplace">
              <Button variant="outline">View all software <ArrowRight className="h-4 w-4"/></Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── New Opportunities ─────────────────────────── */}
      <section id="solution-requests" className="scroll-mt-20 py-20 lg:py-28 bg-[var(--muted)]/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="flex items-end justify-between mb-10">
            <div>
              <Badge variant="secondary" className="mb-3">New Opportunities</Badge>
              <h2 className="text-3xl font-bold">Latest Solution Requests</h2>
            </div>
            <Link to="/solutions" className="hidden sm:flex items-center gap-1 text-sm font-medium text-[var(--primary)] hover:underline">
              View all <ArrowRight className="h-4 w-4"/>
            </Link>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {solutionRequests.slice(0, 6).map((req, i) => (<motion.div key={req.id} {...stagger} transition={{ delay: 0.05 * i }}>
                <Link to={`/solutions/${req.id}`}>
                  <Card className="card-hover h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-base leading-tight">{req.title}</h3>
                        <Badge variant={req.status === "open" ? "success" : "warning"} className="shrink-0">
                          {req.status === "open" ? "Open" : "In Progress"}
                        </Badge>
                      </div>

                      <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 mb-3">
                        {req.description}
                      </p>

                      <div className="flex items-center gap-2 mb-3 text-sm">
                        <span className="font-semibold text-[var(--foreground)]">
                          {req.budgetMin && req.budgetMax
                ? `${formatCurrency(req.budgetMin)} – ${formatCurrency(req.budgetMax)}`
                : "Open Budget"}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {(req.preferredTechnologies || []).slice(0, 3).map((tech) => (<Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>))}
                      </div>

                      <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                        <span>{req.proposalCount || 0} proposals</span>
                        <span className="capitalize">{req.difficulty}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>))}
          </div>
        </div>
      </section>

      {/* ── Statistics ────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-[var(--muted)]/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Platform in Numbers</h2>
            <p className="text-[var(--muted-foreground)]">Growing community of student developers and clients</p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
            { label: "Students", value: "10K+", icon: Users, color: "text-indigo-500" },
            { label: "Projects", value: "2K+", icon: Code2, color: "text-emerald-500" },
            { label: "Solutions Built", value: "500+", icon: Rocket, color: "text-purple-500" },
            { label: "Student Earnings", value: "₹25L+", icon: DollarSign, color: "text-amber-500" },
        ].map((stat, i) => (<motion.div key={stat.label} {...stagger} transition={{ delay: 0.1 * i }}>
                <Card className="text-center">
                  <CardContent className="p-6">
                    <stat.icon className={`h-8 w-8 mx-auto mb-3 ${stat.color}`}/>
                    <p className="text-3xl sm:text-4xl font-bold mb-1">{stat.value}</p>
                    <p className="text-sm text-[var(--muted-foreground)]">{stat.label}</p>
                  </CardContent>
                </Card>
              </motion.div>))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────── */}
      <section id="why-campuscode" className="scroll-mt-20 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-12">
            <Badge variant="secondary" className="mb-3">Why CampusCode</Badge>
            <h2 className="text-3xl font-bold mb-3">Everything you need</h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
            { icon: GitBranch, title: "Project Management", desc: "Kanban boards, tasks, milestones, and team collaboration." },
            { icon: Shield, title: "Secure Payments", desc: "Milestone-based payments with escrow protection." },
            { icon: Brain, title: "AI-Powered", desc: "AI project planner, matching, and proposal assistant." },
            { icon: MessageSquare, title: "Real-time Messaging", desc: "Communicate with clients directly within projects." },
            { icon: Award, title: "Verified Portfolio", desc: "Build a portfolio backed by real projects and reviews." },
            { icon: TrendingUp, title: "Reputation System", desc: "Earn badges and levels as you complete projects." },
        ].map((feature, i) => (<motion.div key={i} {...stagger} transition={{ delay: 0.05 * i }}>
                <Card className="card-hover h-full">
                  <CardContent className="p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/10 mb-4">
                      <feature.icon className="h-5 w-5 text-[var(--primary)]"/>
                    </div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-[var(--muted-foreground)]">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────── */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp}>
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/5 via-purple-500/5 to-cyan-500/5"/>
              <CardContent className="relative p-8 sm:p-12 text-center">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  Ready to start your journey?
                </h2>
                <p className="text-[var(--muted-foreground)] max-w-xl mx-auto mb-8">
                  Join thousands of student developers already building, selling, and earning on CampusCode.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link to="/register">
                    <Button size="lg" className="text-base px-8 w-full sm:w-auto cursor-pointer gap-2">
                      Get Started Free
                      <ArrowRight className="h-4 w-4"/>
                    </Button>
                  </Link>
                  <Link to="/solutions">
                    <Button variant="outline" size="lg" className="text-base px-8 w-full sm:w-auto cursor-pointer">
                      Browse Opportunities
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>);
}
export default LandingPage;
