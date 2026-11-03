import { Link } from "react-router-dom";
import { Rocket, Shield, Award, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col">
      <Navbar />
      <div className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24 border-b border-[var(--border)]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <Badge variant="secondary" className="px-3.5 py-1 text-xs gap-1.5 mx-auto">
              <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />
              Our Mission & Vision
            </Badge>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
              Empowering the Next Generation of{" "}
              <span className="bg-gradient-to-r from-[var(--primary)] to-emerald-500 bg-clip-text text-transparent">
                Software Creators
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-[var(--muted-foreground)] max-w-3xl mx-auto leading-relaxed">
              CampusCode is the premier student developer marketplace bridging creators, problem solvers, and businesses seeking high-quality, verified software solutions.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link to="/register">
                <Button size="lg" className="gap-2 shadow-lg cursor-pointer">
                  Join as a Student Developer <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/marketplace">
                <Button size="lg" variant="outline" className="cursor-pointer">
                  Explore Marketplace
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="py-16 md:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-bold">Why CampusCode Exists</h2>
            <p className="text-[var(--muted-foreground)] text-sm sm:text-base">
              We solve the two biggest challenges in tech education and software procurement simultaneously.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-[var(--border)] hover:border-[var(--primary)]/40 transition-all">
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Rocket className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold">Monetize College Projects</h3>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                  Students spend hundreds of hours building remarkable capstones, hackathon projects, and templates. CampusCode allows them to list and sell clean code with instant payouts.
                </p>
              </CardContent>
            </Card>

            <Card className="border-[var(--border)] hover:border-[var(--primary)]/40 transition-all">
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold">Secure Milestone Escrow</h3>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                  Businesses post engineering requirements and lock funds in escrow. Developers receive guaranteed release of funds upon meeting transparent milestone deliverables.
                </p>
              </CardContent>
            </Card>

            <Card className="border-[var(--border)] hover:border-[var(--primary)]/40 transition-all">
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                  <Award className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold">Verified Proof of Work</h3>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                  Traditional resumes don't convey actual engineering prowess. CampusCode provides verified client reviews, GitHub codebase audits, and live deployed software portfolios.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-[var(--muted)]/30 border-y border-[var(--border)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-3xl sm:text-4xl font-extrabold text-[var(--primary)]">15,000+</p>
                <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-1">Student Developers</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-extrabold text-emerald-500">₹2.4 Cr+</p>
                <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-1">Earned by Students</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-extrabold text-purple-500">1,800+</p>
                <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-1">Software Solutions</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-extrabold text-amber-500">99.4%</p>
                <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-1">Satisfaction Rate</p>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}

export default AboutPage;

