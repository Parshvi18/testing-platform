import { useEffect, useState } from "react";
import { listTestimonials, setTestimonialStatus } from "../lib/api";
import TestimonialCard from "../components/TestimonialCard";

const FILTERS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Declined" },
  { key: "all", label: "All" },
];

export default function DashboardPage() {
  const [filter, setFilter] = useState("pending");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingActions, setPendingActions] = useState({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listTestimonials(filter)
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filter]);

  async function decide(id, status) {
    setPendingActions((p) => ({ ...p, [id]: status }));
    try {
      await setTestimonialStatus(id, status);
      if (filter === "all") {
        setItems((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
        setPendingActions((p) => {
          const next = { ...p };
          delete next[id];
          return next;
        });
      } else {
        setTimeout(() => {
          setItems((prev) => prev.filter((t) => t.id !== id));
          setPendingActions((p) => {
            const next = { ...p };
            delete next[id];
            return next;
          });
        }, 550);
      }
    } catch (err) {
      setError(err.message);
      setPendingActions((p) => {
        const next = { ...p };
        delete next[id];
        return next;
      });
    }
  }

  return (
    <main className="container dashboard">
      <h1 className="page-title">Review desk</h1>
      <p className="page-sub">Approve what belongs on the wall. Reject what doesn't.</p>

      <div className="filter-row" role="tablist" aria-label="Filter by status">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            role="tab"
            aria-selected={filter === f.key}
            className={`filter-chip ${filter === f.key ? "active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="error-banner" role="alert" style={{ marginBottom: 20 }}>
          {error}
        </div>
      )}

      {loading && (
        <div className="t-grid">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="skeleton t-skeleton" />
          ))}
        </div>
      )}

      {!loading && items.length === 0 && !error && (
        <div className="empty-state">
          {filter === "pending"
            ? "Nothing waiting for review. Nicely caught up."
            : `No ${filter === "all" ? "" : filter} testimonials yet.`}
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="t-grid">
          {items.map((t) => {
            const pendingDecision = pendingActions[t.id];
            const stampStatus = pendingDecision || (filter === "all" ? t.status : null);
            return (
              <TestimonialCard
                key={t.id}
                testimonial={t}
                stamp={stampStatus}
                animateStamp={Boolean(pendingDecision)}
                footer={
                  t.status === "pending" || filter === "all" ? (
                    <div className="t-actions">
                      <button
                        className="btn btn-approve"
                        disabled={Boolean(pendingDecision) || t.status === "approved"}
                        onClick={() => decide(t.id, "approved")}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-reject"
                        disabled={Boolean(pendingDecision) || t.status === "rejected"}
                        onClick={() => decide(t.id, "rejected")}
                      >
                        Decline
                      </button>
                    </div>
                  ) : null
                }
              />
            );
          })}
        </div>
      )}
    </main>
  );
}
