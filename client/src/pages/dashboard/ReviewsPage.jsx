import { useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Avatar } from "../../components/ui/avatar";
import { formatRelativeTime } from "../../lib/utils";
export default function ReviewsPage() {
    const [reviews, setReviews] = useState([]);
    const [summary, setSummary] = useState({ average: 0, count: 0, distribution: {} });
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reload, setReload] = useState(0);
    useEffect(() => {
        let cancelled = false;
        setLoading(true); setError("");
        apiJson(`/api/reviews?page=${page}`).then(data => {
            if (cancelled) return;
            setReviews(data.reviews); setSummary(data.summary); setHasMore(data.hasMore);
        }).catch(error => { if (!cancelled) setError(error.message); }).finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [page, reload]);
    const avgRating = summary.average.toFixed(1);
    return (<div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1">Reviews</h1>
        <p className="text-[var(--muted-foreground)] mb-6">What others say about your work</p>
      </motion.div>

      {loading && <p role="status">Loading reviews…</p>}
      {error && <p role="alert" className="text-red-500 mb-4">{error} <button className="underline" onClick={() => setReload(value => value + 1)}>Retry</button></p>}
      {!loading && !error && summary.count === 0 && <p className="mb-6 text-sm text-[var(--muted-foreground)]">No reviews yet. Completed contract participants can leave feedback from their contract page.</p>}
      {/* Summary */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-8 flex-wrap">
              <div className="text-center">
                <p className="text-5xl font-bold mb-1">{avgRating}</p>
                <div className="flex items-center gap-0.5 justify-center mb-1">
                  {[...Array(5)].map((_, i) => (<Star key={i} className={`h-4 w-4 ${i < Math.round(Number(avgRating)) ? "fill-amber-400 text-amber-400" : "text-[var(--border)]"}`}/>))}
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">{summary.count} reviews</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5, 4, 3, 2, 1].map((n) => {
            const count = summary.distribution[n] || 0;
            const pct = summary.count ? (count / summary.count) * 100 : 0;
            return (<div key={n} className="flex items-center gap-2">
                      <span className="text-xs w-6 text-right">{n}★</span>
                      <div className="flex-1 h-2 rounded-full bg-[var(--muted)]">
                        <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }}/>
                      </div>
                      <span className="text-xs text-[var(--muted-foreground)] w-8">{count}</span>
                      <div className="flex items-center gap-3 mt-6"><Button variant="outline" disabled={loading || page === 1} onClick={() => setPage(value => value - 1)}>Previous</Button><span className="text-sm">Page {page}</span><Button variant="outline" disabled={loading || !hasMore} onClick={() => setPage(value => value + 1)}>Next</Button></div>
    </div>);
        })}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review, i) => {
            const reviewerName = review.reviewer?.name || "Client";
            return (<motion.div key={review.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i }}>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <Avatar name={reviewerName}/>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <p className="font-semibold text-sm">{reviewerName}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">{formatRelativeTime(review.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, j) => (<Star key={j} className={`h-3.5 w-3.5 ${j < Math.round(review.overall) ? "fill-amber-400 text-amber-400" : "text-[var(--border)]"}`}/>))}
                        </div>
                      </div>
                      <Badge variant="secondary" className="mt-2">Completed contract</Badge>
                      <p className="text-sm text-[var(--muted-foreground)] mt-2 whitespace-pre-wrap">{review.content}</p>
                      <div className="flex flex-wrap gap-2 mt-3 text-xs text-[var(--muted-foreground)]">
                        <Badge variant="outline">Communication: {review.communication}/5</Badge>
                        <Badge variant="outline">Quality: {review.quality}/5</Badge>
                        <Badge variant="outline">Delivery: {review.delivery}/5</Badge>
                        <Badge variant="outline">Professionalism: {review.professionalism}/5</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>);
        })}
      </div>
    </div>);
}
