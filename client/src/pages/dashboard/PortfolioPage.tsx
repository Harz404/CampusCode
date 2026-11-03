import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ExternalLink, CheckCircle2,
  FolderKanban, MapPin, GraduationCap,
  MessageSquare, ArrowLeft, Loader2, Building2,
  Globe, Briefcase, ShieldCheck, ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Avatar } from "../../components/ui/avatar";
import { formatCurrency, formatRelativeTime } from "../../lib/utils";
import { useAuth } from "../../hooks/useAuth";
import { useUserData } from "../../lib/user-store";
import type { User, Product, Project, SolutionRequest } from "../../types";

export default function PortfolioPage() {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projects: userProjects, stats: userStats } = useUserData();

  const [dbUser, setDbUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [messagingLoading, setMessagingLoading] = useState(false);

  const activeSlug = slug ? decodeURIComponent(slug).toLowerCase().trim() : "me";

  const isOwnProfile =
    Boolean(user) &&
    (activeSlug === "me" ||
      activeSlug === user?.id.toLowerCase() ||
      activeSlug === (user?.studentProfile?.portfolioUrl?.toLowerCase() || "") ||
      activeSlug === `@${(user?.studentProfile?.portfolioUrl?.toLowerCase() || "").replace(/^@/, "")}` ||
      activeSlug === (user?.name?.toLowerCase().replace(/\s+/g, "") || "") ||
      activeSlug === `@${(user?.name?.toLowerCase().replace(/\s+/g, "") || "")}`);

  useEffect(() => {
    let cancelled = false;

    if (isOwnProfile) {
      setLoading(false);
      return;
    }

    async function fetchProfile() {
      try {
        const res = await fetch(`/api/users/${encodeURIComponent(activeSlug)}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data) {
            setDbUser(data);
            return;
          }
        }
      } catch (err) {
        console.error("[Portfolio] Error fetching user profile:", err);
      }

      if (!cancelled) {
        setDbUser(null);
      }
    }

    fetchProfile().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [activeSlug, isOwnProfile]);

  const handleStartMessage = async (targetId: string) => {
    setMessagingLoading(true);
    try {
      const res = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: targetId }),
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
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  const profileUser = isOwnProfile ? user : dbUser;

  if (!profileUser) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-2">Profile Not Found</h1>
        <p className="text-sm text-[var(--muted-foreground)] mb-6">
          We couldn&apos;t find a user or organization profile for &ldquo;{slug}&rdquo;.
        </p>
        <Link to="/marketplace">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Marketplace
          </Button>
        </Link>
      </div>
    );
  }

  const isClientUser = profileUser.role?.toUpperCase() === "CLIENT";

  if (isClientUser) {
    const clientProf = profileUser.clientProfile;
    const orgName = clientProf?.organization || profileUser.name;
    const requirements = (profileUser as unknown as { solutionRequests?: SolutionRequest[] })?.solutionRequests || [];

    return (
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        <Link
          to="/solutions"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors pt-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Requirements
        </Link>

        <div className="relative rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--card)] shadow-sm">
          <div className="h-40 sm:h-48 bg-gradient-to-r from-blue-600/20 via-indigo-500/20 to-purple-600/20" />
          <div className="px-6 sm:px-8 pb-6 -mt-12 sm:-mt-14 flex flex-col sm:flex-row items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Avatar name={orgName} size="xl" className="h-24 w-24 text-2xl ring-4 ring-[var(--card)] shadow-lg" />
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold">{orgName}</h1>
                  {profileUser.isVerified && (
                    <Badge variant="success">
                      <ShieldCheck className="h-3 w-3 mr-1" /> Verified Client
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs uppercase">
                    Hiring Organization
                  </Badge>
                </div>
                {clientProf?.organization && profileUser.name && (
                  <p className="text-xs text-[var(--muted-foreground)]">Contact Person: {profileUser.name}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)] flex-wrap pt-1">
                  {clientProf?.website && (
                    <a
                      href={clientProf.website.startsWith("http") ? clientProf.website : `https://${clientProf.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-[var(--primary)] hover:underline"
                    >
                      <Globe className="h-3.5 w-3.5" /> {clientProf.website.replace(/^https?:\/\//, "")}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  <span className="flex items-center gap-1">
                    <FolderKanban className="h-3.5 w-3.5" />
                    {requirements.length || clientProf?.projectsPosted || 1} Requirements Posted
                  </span>
                </div>
              </div>
            </div>

            {!isOwnProfile && (
              <Button
                className="gap-2 shrink-0 shadow-md cursor-pointer mt-2 sm:mt-4"
                disabled={messagingLoading}
                onClick={() => handleStartMessage(profileUser.id)}
              >
                {messagingLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageSquare className="h-4 w-4" />
                )}
                Message Client
              </Button>
            )}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-[var(--primary)]">
                {requirements.length || clientProf?.projectsPosted || 1}
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Requirements Posted</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-500">
                ⭐ {clientProf?.rating || 4.9}
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Developer Satisfaction</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-[var(--foreground)]">
                100%
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Milestone Payment Rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-[var(--foreground)]">
                &lt; 24h
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Avg Response Time</p>
            </CardContent>
          </Card>
        </motion.div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[var(--primary)]" />
              About Organization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed whitespace-pre-line">
              {clientProf?.description ||
                `${orgName} is an active industry partner hiring verified student developers on CampusCode for real-world software solutions, prototypes, and enterprise tooling.`}
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Solution Requests & Bounties</h2>
              <p className="text-xs text-[var(--muted-foreground)]">Live requirements posted by {orgName}</p>
            </div>
            <Link to="/solutions">
              <Button variant="outline" size="sm" className="gap-1 text-xs">
                Browse All Requirements <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>

          {requirements.length > 0 ? (
            <div className="grid gap-4">
              {requirements.map((req) => (
                <Card key={req.id} className="hover:border-[var(--primary)]/40 transition-colors">
                  <CardContent className="p-5 flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="success">Open</Badge>
                        <Badge variant="outline" className="capitalize text-xs">{req.difficulty}</Badge>
                        <span className="text-xs text-[var(--muted-foreground)]">
                          Posted {formatRelativeTime(req.createdAt)}
                        </span>
                      </div>
                      <h3 className="font-semibold text-base">{req.title}</h3>
                      <p className="text-xs text-[var(--muted-foreground)] line-clamp-2">
                        {req.problemStatement || req.description}
                      </p>
                      {req.preferredTechnologies && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {req.preferredTechnologies.slice(0, 4).map((tech) => (
                            <Badge key={tech} variant="secondary" className="text-[10px]">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end gap-2 w-full sm:w-auto">
                      <p className="text-lg font-bold text-[var(--primary)]">
                        {req.budgetMin && req.budgetMax
                          ? `${formatCurrency(req.budgetMin)} - ${formatCurrency(req.budgetMax)}`
                          : "Open Budget"}
                      </p>
                      <Link to={`/solutions/${req.id}`}>
                        <Button size="sm" className="gap-1 text-xs">
                          View & Submit Bid <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center space-y-2">
                <Briefcase className="h-8 w-8 text-[var(--muted-foreground)] mx-auto opacity-50" />
                <h4 className="font-semibold text-sm">No other open requirements at the moment</h4>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Check back soon or send a direct message to inquire about upcoming engineering projects.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  const profile = profileUser.studentProfile;
  const displayName = profileUser.name || "Student Developer";
  const college = profile?.college || "Engineering College";
  const degree = profile?.degree || "Computer Science";
  const gradYear = profile?.graduationYear || 2026;
  const bio = profile?.bio || "Building modern full-stack software and developer tools.";
  const skills = profile?.skills || ["React", "TypeScript", "Node.js", "Express", "MongoDB"];

  const studentProducts: Product[] = isOwnProfile
    ? []
    : (profileUser as unknown as { products?: Product[] })?.products || [];

  const studentProjects: Project[] = isOwnProfile
    ? userProjects
    : (profileUser as unknown as { ownedProjects?: Project[] })?.ownedProjects || [];

  const stats = isOwnProfile
    ? {
        projectsCount: userStats.activeProjectsCount,
        salesCount: userStats.totalSales,
        rating: profile?.rating || 5.0,
        earnings: userStats.totalEarnings,
      }
    : {
        projectsCount: profile?.completedProjects || studentProjects.length,
        salesCount: profile?.totalSales || 0,
        rating: profile?.rating || 4.9,
        earnings: profile?.totalEarnings || 0,
      };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="relative rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--card)] shadow-sm">
        <div className="h-40 sm:h-48 bg-gradient-to-r from-[var(--primary)]/20 via-purple-500/20 to-cyan-500/20" />
        <div className="px-6 sm:px-8 pb-6 -mt-12 sm:-mt-14 flex flex-col sm:flex-row items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Avatar name={displayName} size="xl" className="h-24 w-24 text-2xl ring-4 ring-[var(--card)] shadow-lg" />
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold">{displayName}</h1>
                {profileUser.isVerified && (
                  <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1" />Verified Student</Badge>
                )}
                {profile?.level && (
                  <Badge variant="outline" className="capitalize text-xs">
                    {profile.level.replace("_", " ")}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed max-w-xl">{bio}</p>
              <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)] flex-wrap pt-1">
                <span className="flex items-center gap-1"><GraduationCap className="h-4 w-4 text-[var(--primary)]" />{college}</span>
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{degree}, Class of {gradYear}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 shrink-0 flex-wrap mt-2 sm:mt-4">
            {profile?.github && (
              <a
                href={profile.github.startsWith("http") ? profile.github : `https://github.com/${profile.github}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="outline" size="sm"><ExternalLink className="h-4 w-4 mr-1.5" />GitHub</Button>
              </a>
            )}

            {isOwnProfile ? (
              <Link to="/settings">
                <Button size="sm">Edit Profile</Button>
              </Link>
            ) : (
              <Button
                size="sm"
                className="gap-1.5 cursor-pointer"
                disabled={messagingLoading}
                onClick={() => handleStartMessage(profileUser.id)}
              >
                {messagingLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageSquare className="h-4 w-4" />
                )}
                Message Developer
              </Button>
            )}
          </div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Completed Projects", value: stats.projectsCount },
          { label: "Total Sales", value: stats.salesCount },
          { label: "Rating", value: stats.rating, suffix: "/ 5" },
          { label: isOwnProfile ? "Your Earnings" : "Verified Revenue", value: formatCurrency(stats.earnings) },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">
                {stat.value}{stat.suffix && <span className="text-sm font-normal text-[var(--muted-foreground)]">{stat.suffix}</span>}
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Skills & Technologies</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Badge key={skill} variant="secondary" className="px-3 py-1.5 text-sm">{skill}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {studentProducts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Published Products ({studentProducts.length})</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {studentProducts.map((product) => (
              <Link key={product.id} to={`/marketplace/${product.id}`}>
                <Card className="card-hover h-full">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                      <span className="font-bold text-sm text-[var(--primary)]">
                        {product.isFree ? "Free" : formatCurrency(product.price)}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] line-clamp-2">{product.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {(product.technologies || []).slice(0, 3).map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Featured Projects</h2>
        {studentProjects.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {studentProjects.map((project) => (
              <Card key={project.id} className="card-hover">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{project.name}</h3>
                    <Badge variant={project.status === "completed" ? "success" : "default"}>{project.status}</Badge>
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">{project.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {project.technologies.map((tech) => (
                      <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card><CardContent className="p-8 text-center text-sm text-[var(--muted-foreground)]">No active projects listed.</CardContent></Card>
        )}
      </div>
    </div>
  );
}

