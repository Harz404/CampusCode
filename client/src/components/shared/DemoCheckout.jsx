import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { apiJson } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
export default function DemoCheckout({ product, onClose }) {
    const [outcome, setOutcome] = useState("success");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [order, setOrder] = useState(null);
    const requestId = useRef(crypto.randomUUID());
    async function submit() {
        setBusy(true); setError("");
        try {
            const result = await apiJson("/api/payments/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ demo: true, requestId: requestId.current, productId: product.id, outcome }) });
            setOrder(result.order);
        } catch (err) { setError(err.message); }
        finally { setBusy(false); }
    }
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <section role="dialog" aria-modal="true" aria-labelledby="checkout-title" className="w-full max-w-md rounded-xl bg-[var(--card)] border border-[var(--border)] p-6 space-y-4">
            <h2 id="checkout-title" className="text-xl font-bold">Demo checkout</h2>
            <p className="text-sm text-[var(--muted-foreground)]">College project simulation. No money is charged. Do not enter payment details.</p>
            <p>{product.name} · {formatCurrency(product.isFree ? 0 : product.price)}</p>
            {error && <p role="alert" className="text-red-500">{error}</p>}
            {order ? <>
                <p role="status">Demo order {order.status}. {order.status === "completed" ? "Your delivery is saved in Purchases." : "No access or seller credit was granted."}</p>
                {order.status === "completed" ? <Link to="/purchases" onClick={onClose} className="block underline text-[var(--primary)]">Open my purchases and delivery</Link> : <Button onClick={() => { requestId.current = crypto.randomUUID(); setOrder(null); }}>Try another simulation</Button>}
            </> : <>
                <label className="block text-sm" htmlFor="demo-outcome">Simulate payment result</label>
                <select id="demo-outcome" value={outcome} disabled={busy} onChange={e => { setOutcome(e.target.value); requestId.current = crypto.randomUUID(); }} className="w-full rounded border border-[var(--border)] bg-[var(--background)] p-2">
                    <option value="success">Successful</option><option value="failed">Failed</option><option value="cancelled">Cancelled</option>
                </select>
                <Button disabled={busy} onClick={submit} className="w-full">{busy ? "Saving…" : "Run demo checkout"}</Button>
            </>}
            <Button variant="outline" disabled={busy} onClick={onClose}>Close</Button>
        </section>
    </div>;
}
