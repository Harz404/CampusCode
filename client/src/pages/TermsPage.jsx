import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
export function TermsPage() {
    return (<div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col">
      <Navbar />
      <div className="flex-1 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <ArrowLeft className="h-4 w-4"/> Back to Home
          </Link>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[var(--primary)]">
              <FileText className="h-6 w-6"/>
              <span className="font-semibold text-sm">Legal Agreement</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold">Terms of Service</h1>
            <p className="text-xs text-[var(--muted-foreground)]">Last Updated: September 1, 2026</p>
          </div>

          <div className="max-w-none text-sm leading-relaxed space-y-6 text-[var(--muted-foreground)]">
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--foreground)]">1. Acceptance of Terms</h2>
              <p>
                By creating an account or accessing the CampusCode platform, you agree to comply with and be bound by these Terms of Service. If you are entering into this agreement on behalf of a company, you represent that you have the authority to bind such entity.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--foreground)]">2. Student Developer Eligibility</h2>
              <p>
                Student developer accounts must be held by individuals currently enrolled in an accredited higher education institution or recent graduates (within 2 years). Verification badges may require proof of active enrollment.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--foreground)]">3. Software Marketplace Sales & Warranties</h2>
              <p>
                All software uploaded must be original work or compliant with relevant open-source licensing. Sellers warrant that products do not contain malicious code, spyware, or copyright-infringing assets.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--foreground)]">4. Platform Fees & Payouts</h2>
              <p>
                CampusCode charges a standard 10% platform facilitation fee on marketplace product sales and completed contracts. Student developers may request payouts once milestone deliverables are approved.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[var(--foreground)]">5. Dispute Resolution</h2>
              <p>
                In the event of a disagreement regarding milestone acceptance or deliverables, either party may escalate to CampusCode Arbitration. The arbitration decision is final and binding for escrow disbursement.
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>);
}
export default TermsPage;
