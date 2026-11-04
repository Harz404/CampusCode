import { apiJson } from "@/lib/api";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Eye, CheckCircle2, XCircle, Star, Check } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { formatCurrency, formatDate } from "../../../lib/utils";
export default function AdminProductsPage() {
    const [productList, setProductList] = useState([]);
    const [search, setSearch] = useState("");
    const [tab, setTab] = useState("all");
    const [error, setError] = useState("");
    const [decision, setDecision] = useState(null);
    const [reason, setReason] = useState("");
    const [busy, setBusy] = useState(false);
    const [loading, setLoading] = useState(true);
    const [actionNotice, setActionNotice] = useState(null);
    useEffect(() => {
        let cancelled = false;
        apiJson("/api/products").then(data => { if (!cancelled) setProductList(data.products); })
            .catch(error => { if (!cancelled) setError(error.message); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);
    const handleUpdateStatus = async event => {
        event.preventDefault();
        if (!decision || busy) return;
        setBusy(true); setError(""); setActionNotice(null);
        try {
            const saved = await apiJson(`/api/admin/products/${decision.id}/status`, {
                method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: decision.status, reason }),
            });
            setProductList(previous => previous.map(product => product.id === saved.id ? { ...product, ...saved } : product));
            setActionNotice(`Product marked as ${saved.status}`); setDecision(null); setReason("");
        } catch (error) { setError(error.message); }
        finally { setBusy(false); }
    };
    const filtered = productList.filter((p) => {
        if (search && !p.name.toLowerCase().includes(search.toLowerCase()))
            return false;
        if (tab === "pending" && p.status !== "pending_review")
            return false;
        if (tab === "published" && p.status !== "published")
            return false;
        if (tab === "rejected" && p.status !== "rejected")
            return false;
        return true;
    });
    return (<div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1">Product Moderation</h1>
        <p className="text-[var(--muted-foreground)]">Review, approve, and manage software listings across the marketplace</p>
      </motion.div>

      {actionNotice && (<div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
          <Check className="h-4 w-4"/> {actionNotice}
        </div>)}

      {loading && <p role="status">Loading moderation queue…</p>}
      {error && <p role="alert" className="text-red-500">{error}</p>}
      {decision && <form onSubmit={handleUpdateStatus} className="border border-[var(--border)] rounded-xl p-4 space-y-3">
        <p className="font-medium">Mark listing as {decision.status}</p>
        <label className="block text-sm">Reason {decision.status === "published" ? "(optional)" : "(required)"}<textarea className="block w-full mt-1 rounded-lg bg-[var(--card)] border border-[var(--border)] p-2" value={reason} onChange={event => setReason(event.target.value)} required={decision.status !== "published"} maxLength={2000} /></label>
        <Button type="submit" disabled={busy}>Confirm Decision</Button> <Button type="button" variant="outline" disabled={busy} onClick={() => setDecision(null)}>Cancel</Button>
      </form>}
      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "published", "rejected"].map((t) => (<button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${tab === t
                ? "bg-[var(--primary)] text-white shadow-sm"
                : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}>
            {t === "all" ? `All (${productList.length})` : t === "pending" ? "Pending Review" : t}
          </button>))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]"/>
        <Input placeholder="Search products by title..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)}/>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30 text-xs text-[var(--muted-foreground)]">
                  <th className="py-3 px-4 text-left font-semibold">Product</th>
                  <th className="py-3 px-4 text-left font-semibold">Seller</th>
                  <th className="py-3 px-4 text-right font-semibold">Price</th>
                  <th className="py-3 px-4 text-right font-semibold">Rating</th>
                  <th className="py-3 px-4 text-right font-semibold">Sales</th>
                  <th className="py-3 px-4 text-left font-semibold">Status</th>
                  <th className="py-3 px-4 text-left font-semibold">Listed</th>
                  <th className="py-3 px-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map((product) => (<tr key={product.id} className="hover:bg-[var(--muted)]/30 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-semibold text-xs text-[var(--foreground)]">{product.name}</p>
                        <p className="text-[11px] text-[var(--muted-foreground)] capitalize">{product.category}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-[var(--muted-foreground)]">{product.seller?.name || "Student"}</td>
                    <td className="py-3 px-4 text-right font-semibold text-xs">{product.isFree ? "Free" : formatCurrency(product.price)}</td>
                    <td className="py-3 px-4 text-right text-xs">
                      <span className="inline-flex items-center gap-0.5 font-medium">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400"/>{product.rating}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-xs">{product.salesCount}</td>
                    <td className="py-3 px-4">
                      <Badge variant={product.status === "published" ? "success" : product.status === "pending_review" ? "warning" : "secondary"} className="text-[10px]">
                        {product.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-xs text-[var(--muted-foreground)]">{formatDate(product.createdAt)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Link to={`/marketplace/${product.slug || product.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Eye className="h-3.5 w-3.5"/></Button>
                        </Link>
                        {product.status === "pending_review" && (<Button variant="outline" size="sm" disabled={busy} onClick={() => { setReason(""); setDecision({ id: product.id, status: "published" }); }} className="text-xs h-7 text-emerald-600 border-emerald-300 dark:border-emerald-900/50 hover:bg-emerald-50 cursor-pointer">
                            <CheckCircle2 className="h-3 w-3 mr-1"/> Approve
                          </Button>)}
                        {product.status === "pending_review" && (<Button variant="ghost" size="sm" disabled={busy} onClick={() => { setReason(""); setDecision({ id: product.id, status: "rejected" }); }} className="text-xs h-7 text-red-500 hover:bg-red-50 cursor-pointer">
                            <XCircle className="h-3 w-3 mr-1"/> Reject
                          </Button>)}
                        {product.status === "published" && <Button size="sm" variant="outline" disabled={busy} onClick={() => { setReason(""); setDecision({ id: product.id, status: "archived" }); }}>Archive</Button>}
                      </div>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>);
}
