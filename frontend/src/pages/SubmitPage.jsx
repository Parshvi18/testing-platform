import { useState } from "react";
import { submitTestimonial } from "../lib/api";

const MAX_BODY = 2000;
const emptyForm = { name: "", email: "", company: "", body: "", rating: 0 };

export default function SubmitPage() {
  const [form, setForm] = useState(emptyForm);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [clientErrors, setClientErrors] = useState([]);
  const [serverErrors, setServerErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function onPhotoChange(e) {
    const file = e.target.files?.[0] || null;
    setPhoto(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  }

  function validate() {
    const errs = [];
    if (!form.name.trim()) errs.push("Your name is required.");
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.push("A valid email is required.");
    }
    if (!form.body.trim()) errs.push("Tell us a bit about your experience.");
    if (form.body.length > MAX_BODY) errs.push(`Keep it under ${MAX_BODY} characters.`);
    if (!form.rating) errs.push("Pick a star rating.");
    return errs;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setServerErrors([]);
    const errs = validate();
    setClientErrors(errs);
    if (errs.length) return;

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("email", form.email.trim());
      fd.append("company", form.company.trim());
      fd.append("body", form.body.trim());
      fd.append("rating", String(form.rating));
      if (photo) fd.append("photo", photo);

      await submitTestimonial(fd);
      setDone(true);
      setForm(emptyForm);
      setPhoto(null);
      setPhotoPreview(null);
    } catch (err) {
      setServerErrors(err.errors || [err.message]);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="container narrow">
        <div className="card submit-done">
          <span
            className="stamp pending animate"
            style={{ position: "static", display: "inline-block", marginBottom: 14 }}
          >
            Pending review
          </span>
          <h1>Thank you.</h1>
          <p>Your story is on the desk for review. Once it's approved, it'll appear on the public wall.</p>
          <button className="btn" onClick={() => setDone(false)}>
            Share another story
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="container narrow">
      <h1 className="page-title">Share your story</h1>
      <p className="page-sub">Two minutes, and it might end up on our wall of thanks.</p>

      <form className="card submit-form" onSubmit={onSubmit} noValidate>
        {serverErrors.length > 0 && (
          <div className="error-banner" role="alert" style={{ marginBottom: 20 }}>
            {serverErrors.map((e) => (
              <div key={e}>{e}</div>
            ))}
          </div>
        )}

        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" type="text" value={form.name} onChange={(e) => update("name", e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          <div className="field-hint">Never shown publicly — used only to prevent duplicate submissions.</div>
        </div>

        <div className="field">
          <label htmlFor="company">Company (optional)</label>
          <input id="company" type="text" value={form.company} onChange={(e) => update("company", e.target.value)} />
        </div>

        <div className="field">
          <label>Rating</label>
          <div className="star-picker" role="radiogroup" aria-label="Star rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                role="radio"
                aria-checked={form.rating === n}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                className={n <= form.rating ? "filled" : ""}
                onClick={() => update("rating", n)}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="body">Your testimonial</label>
          <textarea
            id="body"
            value={form.body}
            maxLength={MAX_BODY}
            onChange={(e) => update("body", e.target.value)}
            placeholder="What was your experience like?"
          />
          <div className="field-hint">
            {form.body.length}/{MAX_BODY}
          </div>
        </div>

        <div className="field">
          <label htmlFor="photo">Photo (optional)</label>
          <input id="photo" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={onPhotoChange} />
          {photoPreview && <img src={photoPreview} alt="" className="photo-preview" />}
        </div>

        {clientErrors.length > 0 && (
          <div className="error-banner" role="alert" style={{ marginBottom: 20 }}>
            {clientErrors.map((e) => (
              <div key={e}>{e}</div>
            ))}
          </div>
        )}

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Sending…" : "Submit testimonial"}
        </button>
      </form>
    </main>
  );
}
