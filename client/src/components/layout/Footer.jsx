import { Link } from "react-router-dom";
import { Code2, Globe, Link as LinkIcon, ExternalLink, Mail } from "lucide-react";
export function Footer() {
    return (<footer className="border-t border-[var(--border)] bg-[var(--background)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)] text-white">
                <Code2 className="h-5 w-5"/>
              </div>
              <span className="text-lg font-bold">
                Campus<span className="text-[var(--primary)]">Code</span>
              </span>
            </Link>
            <p className="text-sm text-[var(--muted-foreground)] mb-4 max-w-xs">
              Connecting student developers with real-world opportunities to build, launch, and monetize software.
            </p>
            <div className="flex gap-3">
              {[Globe, ExternalLink, LinkIcon, Mail].map((Icon, i) => (<a key={i} href="#" className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--foreground)]/20 transition-colors">
                  <Icon className="h-4 w-4"/>
                </a>))}
            </div>
          </div>

          {/* Links */}
          {[
            {
                title: "Marketplace",
                links: [
                    { label: "Browse Software", href: "/marketplace" },
                    { label: "Sell Software", href: "/sell" },
                    { label: "Categories", href: "/marketplace" },
                    { label: "Free Products", href: "/marketplace?filter=free" },
                ],
            },
            {
                title: "Solutions",
                links: [
                    { label: "Browse Requirements", href: "/solutions" },
                    { label: "Post a Requirement", href: "/solutions/post" },
                    { label: "How It Works", href: "/#how-it-works" },
                    { label: "Success Stories", href: "/#stories" },
                ],
            },
            {
                title: "Developers",
                links: [
                    { label: "Create Portfolio", href: "/register" },
                    { label: "Project Management", href: "/projects" },
                    { label: "Top Developers", href: "/#developers" },
                    { label: "Student Reviews", href: "/#reviews" },
                ],
            },
            {
                title: "Company",
                links: [
                    { label: "About", href: "/about" },
                    { label: "Blog", href: "/blog" },
                    { label: "Contact", href: "/contact" },
                    { label: "Privacy Policy", href: "/privacy" },
                    { label: "Terms of Service", href: "/terms" },
                ],
            },
        ].map((section) => (<div key={section.title}>
              <h4 className="font-semibold text-sm mb-4">{section.title}</h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (<li key={link.label}>
                    <Link to={link.href} className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                      {link.label}
                    </Link>
                  </li>))}
              </ul>
            </div>))}
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--muted-foreground)]">
            © {new Date().getFullYear()} CampusCode. All rights reserved.
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            Built with ❤️ for student developers & innovation.
          </p>
        </div>
      </div>
    </footer>);
}
