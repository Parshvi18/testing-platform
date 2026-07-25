import Stars from "./Stars";
import { API_BASE } from "../lib/api";

function tiltFor(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return (hash % 5) - 2;
}

export default function TestimonialCard({ testimonial, tilt = false, stamp = null, animateStamp = false, footer = null }) {
  const t = testimonial;
  const style = tilt ? { transform: `rotate(${tiltFor(t.id)}deg)` } : undefined;

  return (
    <article className="t-card" style={style}>
      {stamp && (
        <span className={`stamp ${stamp}${animateStamp ? " animate" : ""}`}>
          {stamp === "approved" ? "Approved" : stamp === "rejected" ? "Declined" : "Pending"}
        </span>
      )}
      <div className="t-card-head">
        {t.photo_path ? (
          <img className="t-avatar" src={`${API_BASE}${t.photo_path}`} alt="" />
        ) : (
          <div className="t-avatar t-avatar-fallback">{t.name.slice(0, 1).toUpperCase()}</div>
        )}
        <div>
          <div className="t-name">{t.name}</div>
          {t.company && <div className="t-company">{t.company}</div>}
        </div>
      </div>
      <Stars rating={t.rating} />
      <p className="t-body">"{t.body}"</p>
      {footer}
    </article>
  );
}
