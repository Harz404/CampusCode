import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Star, CheckCircle2, Code2, ArrowLeft, Download, Loader2, Cloud, X, CreditCard, Smartphone, Copy, ExternalLink, } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
export function MarketplaceDetailPage() {
    const { product: productId } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedScreenshotIndex, setSelectedScreenshotIndex] = useState(0);
    // Checkout & Download State
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("upi");
    const [upiId, setUpiId] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [cardExpiry, setCardExpiry] = useState("");
    const [cardCvv, setCardCvv] = useState("");
    const [isProcessingOrder, setIsProcessingOrder] = useState(false);
    const [orderComplete, setOrderComplete] = useState(false);
    const [licenseKey, setLicenseKey] = useState("");
    const [copiedKey, setCopiedKey] = useState(false);
    useEffect(() => {
        let cancelled = false;
        async function loadProduct() {
            try {
                const res = await fetch(`/api/products/${productId}`);
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
    const triggerImmediateDownload = (prod) => {
        if (prod.driveUrl) {
            window.open(prod.driveUrl, "_blank");
        }
        if (prod.githubUrl && !prod.driveUrl) {
            window.open(prod.githubUrl, "_blank");
        }
        try {
            const readmeContent = `# ${prod.name}\n\n${prod.description}\n\n## License\n${prod.license} License\n\n## Documentation\n${prod.documentation || "Complete source code package instructions for CampusCode."}\n\nThank you for supporting student developers on CampusCode!`;
            const blob = new Blob([readmeContent], { type: "text/markdown;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${(prod.slug || prod.name).toLowerCase().replace(/[^a-z0-9]+/g, "-")}-package.md`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
        catch (err) {
            console.error("Failed to trigger local file download:", err);
        }
    };
    const handlePurchaseOrFree = async () => {
        setIsProcessingOrder(true);
        try {
            if (!product?.isFree) {
                await fetch("/api/payments/order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        amount: product?.price || 499,
                        productId: product?.id,
                    }),
                }).catch((e) => console.error("Payment API:", e));
            }
            const key = `CC-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
            setLicenseKey(key);
            if (product) {
                setProduct((prev) => (prev ? { ...prev, salesCount: (prev.salesCount || 0) + 1 } : prev));
            }
            setOrderComplete(true);
            if (product) {
                setTimeout(() => {
                    triggerImmediateDownload(product);
                }, 500);
            }
        }
        catch (err) {
            console.error("Order processing error:", err);
        }
        finally {
            setIsProcessingOrder(false);
        }
    };
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
                    <span className="font-semibold text-sm">{product.rating}</span>
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
                  Instant source code package + lifetime access
                </p>
              </div>

              <Button className="w-full gap-2 text-base font-semibold py-6 shadow-md hover:shadow-xl transition-all cursor-pointer" size="lg" onClick={() => {
            setOrderComplete(false);
            setIsCheckoutOpen(true);
        }}>
                {product.isFree || product.price === 0 ? (<>
                    <Download className="h-5 w-5"/> Download Free Package
                  </>) : (<>
                    <Download className="h-5 w-5"/> Buy & Download Now
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

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckoutOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCheckoutOpen(false)}/>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative z-10 w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl overflow-hidden">
              <button onClick={() => setIsCheckoutOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                <X className="h-4 w-4"/>
              </button>

              {!orderComplete ? (<div className="space-y-4">
                  <h3 className="text-lg font-bold">
                    {product.isFree ? "Confirm Download" : "Complete Purchase"}
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {product.name} — {product.isFree ? "Free" : formatCurrency(product.price)}
                  </p>

                  {!product.isFree && (<div className="space-y-3 pt-2">
                      <div className="flex gap-2">
                        <Button type="button" variant={paymentMethod === "upi" ? "default" : "outline"} size="sm" className="flex-1 gap-1.5 text-xs" onClick={() => setPaymentMethod("upi")}>
                          <Smartphone className="h-4 w-4"/> UPI
                        </Button>
                        <Button type="button" variant={paymentMethod === "card" ? "default" : "outline"} size="sm" className="flex-1 gap-1.5 text-xs" onClick={() => setPaymentMethod("card")}>
                          <CreditCard className="h-4 w-4"/> Card
                        </Button>
                      </div>

                      {paymentMethod === "upi" ? (<div>
                          <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">UPI ID</label>
                          <Input placeholder="username@okhdfcbank" value={upiId} onChange={(e) => setUpiId(e.target.value)}/>
                        </div>) : (<div className="space-y-2">
                          <div>
                            <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Card Number</label>
                            <Input placeholder="4532 •••• •••• 8821" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)}/>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Input placeholder="MM/YY" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)}/>
                            <Input placeholder="CVV" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)}/>
                          </div>
                        </div>)}
                    </div>)}

                  <Button onClick={handlePurchaseOrFree} disabled={isProcessingOrder} className="w-full mt-4 cursor-pointer gap-2" size="lg">
                    {isProcessingOrder ? (<>
                        <Loader2 className="h-4 w-4 animate-spin"/> Processing...
                      </>) : product.isFree ? ("Download Now") : (`Pay ${formatCurrency(product.price)} & Download`)}
                  </Button>
                </div>) : (<div className="text-center py-6 space-y-4">
                  <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto"/>
                  <h3 className="text-xl font-bold">Order Completed!</h3>
                  <p className="text-xs text-[var(--muted-foreground)] max-w-xs mx-auto">
                    Your download has started. Save your verified license key below:
                  </p>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--muted)] text-xs font-mono">
                    <span>{licenseKey}</span>
                    <button onClick={() => {
                    navigator.clipboard.writeText(licenseKey);
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 2000);
                }} className="text-[var(--primary)] cursor-pointer">
                      {copiedKey ? "Copied!" : <Copy className="h-3.5 w-3.5"/>}
                    </button>
                  </div>
                  <Button onClick={() => setIsCheckoutOpen(false)} className="w-full">
                    Done
                  </Button>
                </div>)}
            </motion.div>
          </div>)}
      </AnimatePresence>
    </div>);
}
export default MarketplaceDetailPage;
