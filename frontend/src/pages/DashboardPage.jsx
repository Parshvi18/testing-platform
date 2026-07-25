import { useEffect, useState } from "react";
import { analyzeTestimonial, listTestimonials, setTestimonialStatus } from "../lib/api";
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
  const [analysis, setAnalysis] = useState({});
  const [pendingAnalysis, setPendingAnalysis] = useState({});

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

  async function analyze(id) {
    setPendingAnalysis((p) => ({ ...p, [id]: true }));
    setError(null);
    try {
      const data = await analyzeTestimonial(id);
      setAnalysis((prev) => ({ ...prev, [id]: data }));
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingAnalysis((p) => {
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
                  <>
                    {analysis[t.id] && (
                      <div className="ai-note">
                        <div className="ai-note-head">
                          <span className={`sentiment ${analysis[t.id].sentiment}`}>{analysis[t.id].sentiment}</span>
                          <span className="ai-source">{analysis[t.id].source === "gemini" ? "AI" : "local"} analysis</span>
                        </div>
                        <p>{analysis[t.id].summary}</p>
                        <div className="tag-row">
                          {analysis[t.id].tags.map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="t-actions">
                      <button className="btn" disabled={Boolean(pendingAnalysis[t.id])} onClick={() => analyze(t.id)}>
                        {pendingAnalysis[t.id] ? "Analyzing..." : "Analyze"}
                      </button>
                      {(t.status === "pending" || filter === "all") && (
                        <>
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
                        </>
                      )}
                    </div>
                  </>
                }
              />
            );
          })}
        </div>
      )}
    </main>
  );
}
