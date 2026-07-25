import { useEffect, useState, useCallback } from "react";
import { listApproved } from "../lib/api";
import TestimonialCard from "../components/TestimonialCard";

const PAGE_SIZE = 9;

export default function WallPage() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (pageNum, replace) => {
    try {
      const data = await listApproved({ page: pageNum, limit: PAGE_SIZE });
      setItems((prev) => (replace ? data.items : [...prev, ...data.items]));
      setHasMore(data.hasMore);
      setPage(pageNum);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load(1, true).finally(() => setLoading(false));
  }, [load]);

  async function loadMore() {
    setLoadingMore(true);
    await load(page + 1, false);
    setLoadingMore(false);
  }

  return (
    <main className="container wall">
      <h1 className="page-title">Wall of thanks</h1>
      <p className="page-sub">Real words from people we've worked with.</p>

      {loading && (
        <div className="t-grid">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="skeleton t-skeleton" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="error-banner" role="alert">
          Couldn't load testimonials right now — {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="empty-state">Nothing on the wall yet. Approved testimonials will show up here.</div>
      )}

      {!loading && !error && items.length > 0 && (
        <>
          <div className="t-grid">
            {items.map((t) => (
              <TestimonialCard key={t.id} testimonial={t} tilt />
            ))}
          </div>
          {hasMore && (
            <div className="load-more">
              <button className="btn" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? "Loading…" : "Show more"}
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
