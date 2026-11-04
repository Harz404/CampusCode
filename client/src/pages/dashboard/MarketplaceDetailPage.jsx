import DemoCheckout from "@/components/shared/DemoCheckout";
import { apiFetch } from "@/lib/api";
import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, CheckCircle2, Code2, ArrowLeft, Download, Loader2, Cloud, X, CreditCard, Smartphone, Copy, ExternalLink, } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils";
export function MarketplaceDetailPage() {
    const { id: productId } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedScreenshotIndex, setSelectedScreenshotIndex] = useState(0);
    // Checkout & Download State
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    useEffect(() => {
        let cancelled = false;
        async function loadProduct() {
            try {
                const res = await apiFetch(`/api/products/${productId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (!cancelled && data && !data.error) {
                        setProduct(data);
                        return;
                    }
                }
            }
            catch (fetchErr) {
                console.warn("[MarketplaceDetail] API fetch warning:", fetchErr);
            }
            if (!cancelled) {
                setProduct(null);
            }
        }
        loadProduct().finally(() => {
            if (!cancelled)
                setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [productId]);
    if (loading) {
        return (<div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]"/>
      </div>);
    }
    if (!product) {
        return (<div className="p-12 text-center max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-2">Product Not Found</h1>
        <p className="text-sm text-[var(--muted-foreground)] mb-6">
          The software product you are looking for does not exist or has been removed.
        </p>
        <Link to="/marketplace">
          <Button variant="outline" className="gap-2 cursor-pointer">
            <ArrowLeft className="h-4 w-4"/> Back to Marketplace
          </Button>
        </Link>
      </div>);
    }
    const seller = product.seller || {
        id: product.sellerId || "seller",
        name: "Developer",
        email: "developer@campuscode.dev",
        role: "student",
        isVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    const hasScreenshots = product.screenshots && product.screenshots.length > 0;
    const currentImage = hasScreenshots ? product.screenshots[selectedScreenshotIndex] || product.screenshots[0] : null;
    return (<div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Back */}
      <Link to="/marketplace" className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-6">
        <ArrowLeft className="h-4 w-4"/> Back to Marketplace
      </Link>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Main Content */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 space-y-6">
          <div>
            {hasScreenshots ? (<div className="space-y-3 mb-6">
                <div className="h-72 sm:h-96 rounded-xl overflow-hidden border border-[var(--border)] bg-black/20 shadow-md">
                  <img src={currentImage} alt={product.name} className="w-full h-full object-cover"/>
                </div>
                {product.screenshots.length > 1 && (<div className="flex gap-2 overflow-x-auto pb-1">
                    {product.screenshots.map((img, idx) => (<button key={idx} onClick={() => setSelectedScreenshotIndex(idx)} className={`h-16 w-24 shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${selectedScreenshotIndex === idx
                        ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/30 scale-105"
                        : "border-[var(--border)] opacity-70 hover:opacity-100"}`}>
                        <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover"/>
                      </button>))}
                  </div>)}
              </div>) : (<div className="h-64 sm:h-80 rounded-xl bg-gradient-to-br from-[var(--muted)] to-[var(--muted)]/50 mb-6 flex items-center justify-center border border-[var(--border)]">
                <Code2 className="h-16 w-16 text-[var(--muted-foreground)]/20"/>
              </div>)}

            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">{product.name}</h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400"/>
                    <span className="font-semibold text-sm">{product.reviewCount ? product.rating : "No reviews yet"}</span>
                    <span className="text-sm text-[var(--muted-foreground)]">({product.reviewCount || 0} reviews)</span>
                  </div>
                  <span className="text-sm text-[var(--muted-foreground)]">{(product.salesCount || 0).toLocaleString()} sales</span>
                  <Badge variant="outline">{product.license}</Badge>
                  {product.driveUrl && (<Badge variant="secondary" className="gap-1 text-xs">
                      <Cloud className="h-3 w-3 text-blue-500"/> Drive Download Ready
                    </Badge>)}
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-[var(--primary)]">
                  {product.isFree || product.price === 0 ? "Free" : formatCurrency(product.price)}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <Card>
            <CardHeader><CardTitle>Description</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-[var(--muted-foreground)] whitespace-pre-line">
                {product.description}
              </p>
            </CardContent>
          </Card>

          {/* Features */}
          {product.features && product.features.length > 0 && (<Card>
              <CardHeader><CardTitle>Features</CardTitle></CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-2">
                  {product.features.map((feature) => (<div key={feature} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5"/>
                      <span>{feature}</span>
                    </div>))}
                </div>
              </CardContent>
            </Card>)}

          {/* Tech Stack */}
          {product.technologies && product.technologies.length > 0 && (<Card>
              <CardHeader><CardTitle>Tech Stack</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {product.technologies.map((tech) => (<Badge key={tech} variant="secondary" className="px-3 py-1.5">{tech}</Badge>))}
                </div>
              </CardContent>
            </Card>)}

          {/* Requirements & Installation */}
          {(product.requirements || product.documentation) && (<Card>
              <CardHeader><CardTitle>Setup & Documentation</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {product.requirements && product.requirements.length > 0 && (<ul className="space-y-1.5">
                    {product.requirements.map((req) => (<li key={req} className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                        <div className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]"/>
                        {req}
                      </li>))}
                  </ul>)}
                {product.documentation && (<div className="pt-3 border-t border-[var(--border)]">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
                      Included Documentation
                    </p>
                    <p className="text-xs text-[var(--foreground)] bg-[var(--muted)]/40 p-3 rounded-lg font-mono whitespace-pre-line">
                      {product.documentation}
                    </p>
                  </div>)}
              </CardContent>
            </Card>)}
        </motion.div>

        {/* Sidebar */}
        <div className="space-y-4 lg:sticky lg:top-6 self-start">
          <Card className="border-[var(--primary)]/30 shadow-lg">
            <CardContent className="p-5 space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold mb-1 text-[var(--primary)]">
                  {product.isFree || product.price === 0 ? "Free" : formatCurrency(product.price)}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Seller delivery links saved with your purchase
                </p>
              </div>

              <Button className="w-full gap-2 text-base font-semibold py-6 shadow-md hover:shadow-xl transition-all cursor-pointer" size="lg" onClick={() => {
            setIsCheckoutOpen(true);
        }}>
                {product.isFree || product.price === 0 ? (<>
                    <Download className="h-5 w-5"/> Download Free Package
                  </>) : (<>
                    <Download className="h-5 w-5"/> Try Demo Checkout
                  </>)}
              </Button>

              {product.demoUrl && (<a href={product.demoUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <Button variant="outline" className="w-full gap-2 cursor-pointer">
                    <ExternalLink className="h-4 w-4"/> Live Demo
                  </Button>
                </a>)}
            </CardContent>
          </Card>

          {/* Seller Card */}
          <Card>
            <CardHeader><CardTitle className="text-base">Creator Profile</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar fallback={seller.name.slice(0, 2).toUpperCase()} size="lg"/>
                <div>
                  <h3 className="font-semibold text-sm">{seller.name}</h3>
                  <p className="text-xs text-[var(--muted-foreground)] capitalize">{seller.role} Developer</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {isCheckoutOpen && <DemoCheckout product={product} onClose={() => setIsCheckoutOpen(false)} />}
    </div>);
}
export default MarketplaceDetailPage;
