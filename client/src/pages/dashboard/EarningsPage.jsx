import { useState, useEffect, useRef } from "react";
import { apiJson } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
export default function EarningsPage() {
    const [wallet, setWallet] = useState(null), [error, setError] = useState(""), [notice, setNotice] = useState("");
    const [amount, setAmount] = useState(""), [busy, setBusy] = useState(false);
    const requestId = useRef(crypto.randomUUID());
    async function load() { setWallet(await apiJson("/api/payments/transactions")); }
    useEffect(() => { load().catch(err => setError(err.message)); }, []);
    async function payout(event) {
        event.preventDefault(); setBusy(true); setError(""); setNotice("");
        try {
            await apiJson("/api/payments/payout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ demo: true, requestId: requestId.current, amount: Number(amount) }) });
            requestId.current = crypto.randomUUID(); setAmount(""); setNotice("Demo payout saved. No money was transferred."); await load();
        } catch (err) { setError(err.message); } finally { setBusy(false); }
    }
    return <div className="p-6 max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Demo earnings</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Simulated marketplace sales and payouts for this college project. Seller credits include a 10% demo platform fee. These balances have no cash value.</p>
        {error && <p role="alert" className="text-red-500">{error} <Button variant="outline" onClick={() => load().then(() => setError("")).catch(err => setError(err.message))}>Refresh wallet</Button></p>}
        {notice && <p role="status">{notice}</p>}
        {!wallet ? <p>Loading wallet…</p> : <>
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl border border-[var(--border)]">Available demo balance<p className="text-2xl font-bold">{formatCurrency(wallet.balance)}</p></div>
                <div className="p-5 rounded-xl border border-[var(--border)]">Total demo seller credits<p className="text-2xl font-bold">{formatCurrency(wallet.totalEarned)}</p></div>
            </div>
            <form onSubmit={payout} className="space-y-3 max-w-sm">
                <label htmlFor="payout-amount" className="block font-semibold">Simulate a payout</label>
                <Input id="payout-amount" type="number" min="0.01" step="0.01" max={wallet.balance} required disabled={busy} value={amount} onChange={e => { setAmount(e.target.value); requestId.current = crypto.randomUUID(); }} placeholder="Amount in INR" />
                <Button disabled={busy || wallet.balance <= 0}>{busy ? "Saving…" : "Run demo payout"}</Button>
            </form>
            <h2 className="text-lg font-semibold">Demo transaction history</h2>
            {!wallet.transactions.length && <p>No transactions yet.</p>}
            {wallet.transactions.map(tx => <article key={tx.id} className="p-4 border border-[var(--border)] rounded-xl space-y-1">
                <p>{tx.description}</p><p className="text-sm text-[var(--muted-foreground)]">{tx.type} · {formatCurrency(tx.amount)} · {tx.status} · {new Date(tx.createdAt).toLocaleString()}</p>
            </article>)}
        </>}
    </div>;
}
