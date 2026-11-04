import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiJson } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function MyProductsPage() {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [editing, setEditing] = useState(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [loading, setLoading] = useState(true);
    const load = async () => {
        const data = await apiJson(`/api/products?sellerId=${user.id}`);
        setProducts(data.products);
    };
    useEffect(() => {
        let cancelled = false;
        apiJson(`/api/products?sellerId=${user.id}`).then(data => { if (!cancelled) setProducts(data.products); })
            .catch(error => { if (!cancelled) setError(error.message); }).finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [user.id]);
    const mutate = async (id, method, body, suffix = "") => {
        if (busy) return;
        setBusy(true); setError("");
        try {
            await apiJson(`/api/products/${id}${suffix}`, { method, headers: { "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
            setEditing(null); await load();
        } catch (error) { setError(error.message); }
        finally { setBusy(false); }
    };
    return <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-3"><h1 className="text-2xl font-bold">My Products</h1><Link to="/sell"><Button>New Product</Button></Link></div>
        <p className="text-sm text-[var(--muted-foreground)]">Manage drafts, review feedback, and published listings. Changes to a listing must be reviewed again.</p>
        {error && <p role="alert" className="text-red-500">{error}</p>}
        {loading && <p role="status">Loading your products…</p>}
        {!loading && !error && products.length === 0 && <p>No products yet. Create your first draft to get started.</p>}
        {products.map(product => <Card key={product.id}><CardContent className="p-5 space-y-3">
            <div className="flex justify-between gap-3"><Link className="font-semibold underline" to={`/marketplace/${product.id}`}>{product.name}</Link><Badge variant="secondary">{product.status.replaceAll("_", " ")}</Badge></div>
            {product.moderationReason && <p className="text-sm">Moderator feedback: {product.moderationReason}</p>}
            {product.status === "published" && !product.moderationVerified && <p className="text-sm">This older listing needs a moderation decision before it can appear publicly. Edit it, save as draft, then submit for review.</p>}
            {product.status !== "archived" && <div className="flex flex-wrap gap-2">
                <Button variant="outline" disabled={busy} onClick={() => setEditing({ ...product })}>Edit Draft</Button>
                {["draft", "rejected"].includes(product.status) && <Button disabled={busy} onClick={() => mutate(product.id, "POST", null, "/submit")}>Submit for Review</Button>}
                <Button variant="outline" disabled={busy} onClick={() => mutate(product.id, "DELETE")}>Archive</Button>
            </div>}
            {editing?.id === product.id && <form className="space-y-3 border-t border-[var(--border)] pt-4" onSubmit={event => {
                event.preventDefault();
                const { name, description, category, price, isFree, documentation, githubUrl, driveUrl } = editing;
                mutate(product.id, "PATCH", { name, description, category, price: Number(price), isFree, documentation: documentation || "", githubUrl: githubUrl || "", driveUrl: driveUrl || "" });
            }}>
                <p className="text-sm">Saving changes returns this listing to draft and removes it from the public catalog until approved again.</p>
                {[["name", "Product name"], ["category", "Category"], ["githubUrl", "Source repository URL"], ["driveUrl", "Source delivery URL"]].map(([key, label]) => <label key={key} className="block text-sm">{label}<Input value={editing[key] || ""} onChange={event => setEditing(previous => ({ ...previous, [key]: event.target.value }))} required={["name", "category"].includes(key)} /></label>)}
                <label className="block text-sm">Description<Textarea required value={editing.description} onChange={event => setEditing(previous => ({ ...previous, description: event.target.value }))} /></label>
                <label className="block text-sm">Documentation<Textarea value={editing.documentation || ""} onChange={event => setEditing(previous => ({ ...previous, documentation: event.target.value }))} /></label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.isFree} onChange={event => setEditing(previous => ({ ...previous, isFree: event.target.checked }))} />Free product</label>
                {!editing.isFree && <label className="block text-sm">Price (INR)<Input type="number" min="0.01" step="0.01" required value={editing.price} onChange={event => setEditing(previous => ({ ...previous, price: event.target.value }))} /></label>}
                <div className="flex gap-2"><Button type="submit" disabled={busy}>Save as Draft</Button><Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button></div>
            </form>}
        </CardContent></Card>)}
    </div>;
}
