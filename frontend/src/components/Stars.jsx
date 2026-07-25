export default function Stars({ rating, max = 5 }) {
  return (
    <span className="stars" aria-label={`${rating} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < rating ? "" : "empty"} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  );
}
