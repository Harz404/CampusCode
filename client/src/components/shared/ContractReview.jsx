import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";

const fields = ["communication", "quality", "delivery", "professionalism"];
export function ContractReview({ contractId }) {
    const [ownReview, setOwnReview] = useState(null);
    const [ratings, setRatings] = useState(Object.fromEntries(fields.map(field => [field, 5])));
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [reload, setReload] = useState(0);
    useEffect(() => {
        let cancelled = false;
        setLoading(true); setError("");
        apiJson(`/api/reviews/contracts/${contractId}`)
            .then(data => { if (!cancelled) setOwnReview(data.ownReview); })
            .catch(error => { if (!cancelled) setError(error.message); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [contractId, reload]);
    const submit = async event => {
        event.preventDefault();
        if (saving) return;
        setSaving(true); setError("");
        try {
            const saved = await apiJson("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contractId, ...ratings, content }) });
            setOwnReview(saved);
        } catch (error) { setError(error.message); }
        finally { setSaving(false); }
    };
    return <Card>
        <CardHeader><CardTitle>Review your collaboration</CardTitle></CardHeader>
        <CardContent className="space-y-4">
            <p className="text-sm text-[var(--muted-foreground)]">One review per participant, based on this completed contract. This verifies completed work, not payment.</p>
            {error && <p role="alert" className="text-sm text-red-500">{error} <button className="underline" onClick={() => setReload(value => value + 1)}>Refresh review status</button></p>}
            {loading ? <p role="status">Loading review status…</p> : ownReview ? <div role="status" className="space-y-2">
                <p className="font-medium">Your review is saved · {ownReview.overall}/5</p>
                <p className="text-sm whitespace-pre-wrap">{ownReview.content}</p>
            </div> : <form onSubmit={submit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">{fields.map(field => <label key={field} className="block text-sm capitalize">
                    {field}
                    <select aria-label={`${field} rating`} disabled={saving} value={ratings[field]} onChange={event => setRatings(previous => ({ ...previous, [field]: Number(event.target.value) }))} className="block mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] p-2">
                        {[1, 2, 3, 4, 5].map(rating => <option key={rating} value={rating}>{rating} / 5</option>)}
                    </select>
                </label>)}</div>
                <label className="block text-sm">Your experience
                    <Textarea value={content} onChange={event => setContent(event.target.value)} required maxLength={5000} disabled={saving} rows={4} className="mt-1" />
                </label>
                <Button type="submit" disabled={saving || !content.trim()}>{saving ? "Saving review…" : "Submit Review"}</Button>
            </form>}
        </CardContent>
    </Card>;
}
