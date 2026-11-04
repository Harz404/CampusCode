import { Link } from "react-router-dom";
import { ArrowLeft, Clock, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
const blogPosts = [
    {
        slug: "how-i-made-50k-selling-my-college-project",
        title: "How I Made ₹50,000 in My 3rd Year Selling My MERN SaaS Capstone",
        excerpt: "Turning a semester final project into a recurring revenue software product on CampusCode marketplace.",
        author: "Rahul Sharma",
        college: "IIT Bombay",
        category: "Creator Story",
        readTime: "4 min read",
        date: "Aug 28, 2026",
    },
    {
        slug: "guide-to-milestone-escrow-contracts",
        title: "The Comprehensive Guide to Escrow Contracts for Freelance Developers",
        excerpt: "How milestone-based software contracts protect both clients and student engineers against payment defaults.",
        author: "CampusCode Engineering",
        college: "Platform Team",
        category: "Engineering",
        readTime: "6 min read",
        date: "Aug 20, 2026",
    },
    {
        slug: "building-scalable-mern-stack-applications",
        title: "10 Architectural Tips for Clean and Scalable MERN Stack Applications",
        excerpt: "Best practices for React 18/19 SPAs, Express routing, MongoDB indexing, and Tailwind CSS v4 in production.",
        author: "Ananya Iyer",
        college: "BITS Pilani",
        category: "Tutorial",
        readTime: "7 min read",
        date: "Aug 14, 2026",
    },
    {
        slug: "how-ai-matching-connects-clients",
        title: "Behind the Scenes: How CampusCode AI Matches Developers with Requirements",
        excerpt: "A deep dive into our vector similarity ranking and requirement spec decomposition pipeline.",
        author: "CampusCode AI Research",
        college: "Core Team",
        category: "AI & Tech",
        readTime: "5 min read",
        date: "Aug 05, 2026",
    },
];
export function BlogPage() {
    return (<div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col">
      <Navbar />
      <div className="flex-1 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4">
                <ArrowLeft className="h-4 w-4"/> Back to Home
              </Link>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">CampusCode Engineering & Stories</h1>
              <p className="text-[var(--muted-foreground)] mt-2">Articles, architecture guides, and student developer milestones.</p>
            </div>
            <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
              <Sparkles className="h-4 w-4 text-[var(--primary)]"/>
              Latest Insights
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {blogPosts.map((post) => (<Card key={post.slug} className="card-hover border-[var(--border)] overflow-hidden flex flex-col justify-between">
                <CardContent className="p-6 sm:p-8 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary">{post.category}</Badge>
                    <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                      <Clock className="h-3 w-3"/> {post.readTime}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold leading-snug hover:text-[var(--primary)] transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{post.excerpt}</p>
                  <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                    <div>
                      <p className="font-semibold text-[var(--foreground)]">{post.author}</p>
                      <p>{post.college}</p>
                    </div>
                    <span>{post.date}</span>
                  </div>
                </CardContent>
              </Card>))}
          </div>
        </div>
      </div>
      <Footer />
    </div>);
}
export default BlogPage;
