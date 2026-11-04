import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiJson } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
function safeUrl(value) {
    try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url.href : null; } catch { return null; }
}
export default function MyPurchasesPage() {
    const [orders, setOrders] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState("");
    const [delivery, setDelivery] = useState(null), [busy, setBusy] = useState(null);
    async function load() {
        setError(""); setLoading(true);
        try { setOrders((await apiJson("/api/payments/orders")).orders); }
        catch (err) { setError(err.message); } finally { setLoading(false); }
    }
    useEffect(() => { load(); }, []);
    async function openDelivery(id) {
        setBusy(id); setError(""); setDelivery(null);
        try { setDelivery(await apiJson(`/api/payments/orders/${id}/delivery`)); }
        catch (err) { setError(err.message); } finally { setBusy(null); }
    }
    return <div className="max-w-4xl mx-auto p-6 space-y-5">
        <h1 className="text-2xl font-bold">My purchases</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Demo purchases only. No real payments are collected.</p>
        {error && <div role="alert" className="text-red-500">{error} <Button variant="outline" onClick={load}>Reload</Button></div>}
        {loading ? <p>Loading purchases…</p> : !orders.length && <p>No purchases yet. <Link to="/marketplace" className="underline">Browse software</Link></p>}
        {orders.map(order => <article key={order.id} className="rounded-xl border border-[var(--border)] p-4 space-y-2">
            <h2 className="font-semibold">{order.productName || "Software purchase"}</h2>
            <p className="text-sm">{formatCurrency(order.amount)} · Demo {order.status} · {new Date(order.createdAt).toLocaleDateString()}</p>
            {order.status === "completed" && <Button disabled={!!busy} onClick={() => openDelivery(order.id)}>{busy === order.id ? "Loading…" : "Open delivery"}</Button>}
        </article>)}
        {delivery && <section className="border border-[var(--primary)] rounded-xl p-5 space-y-3" aria-live="polite">
            <h2 className="text-lg font-semibold">{delivery.productName} — delivery</h2>
            <p className="text-xs break-all">Demo license reference: {delivery.licenseKey}</p>
            {[["Source repository", delivery.delivery.githubUrl], ["Delivery files", delivery.delivery.driveUrl], ["Download files", delivery.delivery.downloadUrl]].filter(([, url]) => safeUrl(url)).map(([label, url]) => <a key={label} href={safeUrl(url)} target="_blank" rel="noopener noreferrer" className="block underline text-[var(--primary)]">{label}</a>)}
            {!['githubUrl', 'driveUrl', 'downloadUrl'].some(key => safeUrl(delivery.delivery[key])) && <p>The seller has not provided a usable delivery link.</p>}
            {delivery.delivery.documentation && <p className="whitespace-pre-wrap">{delivery.delivery.documentation}</p>}
            {delivery.delivery.installation && <p className="whitespace-pre-wrap">{delivery.delivery.installation}</p>}
            <Button variant="outline" onClick={() => setDelivery(null)}>Close delivery</Button>
        </section>}
    </div>;
}
