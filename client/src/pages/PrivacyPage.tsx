import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col">
      <Navbar />
      <div className="flex-1 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[var(--primary)]">
              <Shield className="h-6 w-6" />
              <span className="font-semibold text-sm">Security & Trust</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold">Privacy Policy</h1>
            <p className="text-xs text-[var(--muted-foreground)]">Last Updated: September 1, 2026</p>
          </div>

          <div className="max-w-none text-sm leading-relaxed space-y-6 text-[var(--muted-foreground)]">
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--foreground)]">1. Information We Collect</h2>
              <p>
                When you register for CampusCode as a student developer or client organization, we collect information including your name, email address, educational institution, portfolio links, and transaction records required for software marketplace delivery and payouts.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--foreground)]">2. How We Use Your Data</h2>
              <p>
                Your data is utilized to facilitate software marketplace purchases, student developer verification badges, milestone contract execution, fraud prevention, and AI-powered match recommendations between developers and project requirements.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--foreground)]">3. Source Code & Intellectual Property</h2>
              <p>
                CampusCode does not claim ownership over source code, algorithms, or repositories uploaded by student developers. When a client purchases a marketplace listing or completes an escrow contract, ownership licenses are transferred directly in accordance with the specified license type (MIT, Commercial, or Exclusive).
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--foreground)]">4. Payment & Escrow Security</h2>
              <p>
                All payments and escrow transactions are processed securely. Sensitive payment credentials such as full card numbers or bank PINs are never stored on CampusCode servers.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--foreground)]">5. Contact Data Protection Officer</h2>
              <p>
                If you have any questions regarding your data privacy, account deletion, or data protection rights, please contact us at <strong className="text-[var(--foreground)]">privacy@campuscode.dev</strong>.
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default PrivacyPage;

