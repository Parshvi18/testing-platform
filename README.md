# testimonial.desk

A small testimonial platform: customers submit stories, a business owner
reviews them on a dashboard, and approved ones show up on a public wall —
plus an embeddable widget so any third-party site can display them too.

## Stack

- **Frontend:** React 18 + Vite, React Router. Plain CSS with a small design-token
  system (no Tailwind/UI kit) — see `frontend/src/styles.css`.
- **Backend:** Node.js + Express + `better-sqlite3` (file-based SQLite, zero setup).
- **Widget:** vanilla JS, zero dependencies, renders in a Shadow DOM so it can't
  leak styles into (or be broken by) a host page.

No auth, no multi-tenant support, no payments — see [Non-goals](#non-goals) below,
these were explicitly out of scope.

## Running it locally

Requires Node 18+.

```bash
# 1. backend
cd backend
npm install
npm run dev          # http://localhost:4000

# 2. frontend (new terminal)
cd frontend
npm install
npm run dev           # http://localhost:5173
```

The frontend talks to `http://localhost:4000` by default (see
`frontend/.env.example` — copy to `.env` to override via `VITE_API_URL`).

### Verify the core assignment flow

With both servers running:

1. Open `http://localhost:5173`.
2. Submit a testimonial from **Share a story**.
3. Open `http://localhost:5173/dashboard` and confirm it appears as pending.
4. Click **Approve**.
5. Open `http://localhost:5173/wall` and confirm the testimonial appears.
6. Submit another testimonial, click **Decline**, and confirm it never appears
   on the wall.

### Optional AI analysis

The dashboard includes an **Analyze** button on each testimonial. Without any
setup it returns a local sentiment/summary/tag suggestion so the demo keeps
working offline.

To use Gemini instead, set these before starting the backend:

```bash
export GEMINI_API_KEY="your-key"
export GEMINI_MODEL="gemini-1.5-flash"
```

### Try the widget on a "third-party" page

With the backend running:

```bash
cd widget
python3 -m http.server 5555
# open http://localhost:5555/demo.html
```

`demo.html` is a plain HTML file with no build step and no framework — it
stands in for a real business's website, and pulls in the widget with:

```html
<div id="testimonial-widget" data-api="http://localhost:4000" data-accent="#b23a2e"></div>
<script src="http://localhost:4000/widget.js"></script>
```

## What's done

- **P0 — full core loop, verified end to end:** submit → shows up pending in
  the dashboard → approve → appears on the public wall. Reject also works and
  keeps the item off the wall.
- Server-side + client-side validation on the submission form (name, email
  format, non-empty body, 1–5 rating), with an optional photo upload.
- Duplicate detection: a hash of `email + testimonial text` rejects exact
  re-submissions with a 409 (see `dedupeKey` in `backend/server.js`).
- Loading (skeletons), empty, and error states on every page.
- **P1 — embeddable widget** via a plain `<script>` tag, styled independently
  in a Shadow DOM, plus the `demo.html` proof page.
- **P1 — pagination** on the public wall ("Show more", 9 per page) and on the
  widget (`data-limit`).
- Basic accessibility: labeled form fields, `role="radiogroup"` star picker,
  `aria-label`s on ratings, visible focus states.
- **P2 — AI-assisted dashboard analysis:** each testimonial can be analyzed for
  sentiment, a short summary, and suggested tags. It uses Gemini when
  `GEMINI_API_KEY` is configured and falls back to local analysis for offline
  demos.

## What's not done

- No live deploy (P2) — the app runs locally only. Deploying was cut in favor
  of polishing the core loop and widget, per the brief's own priority order.
- No junk/spam filtering beyond exact-duplicate detection (e.g. no profanity
  filter, no rate limiting per IP).
- Widget customization is accent color + item count only — no layout switch
  (grid vs. carousel) as hinted in the brief's "if you like."

## Non-goals

Per the brief, deliberately **not** built: authentication/login, payments,
multi-business/multi-user support, roles/permissions, email notifications.
The dashboard route is unprotected by design.

## Project structure

```
backend/          Express API + SQLite (server.js, db.js)
frontend/          React app (submission form, dashboard, public wall)
widget/            Embeddable widget.js + demo.html
JOURNAL.md          Decisions, trade-offs, and how AI tools were used
CLAUDE.md           Agent steering instructions (committed, not gitignored)
```

See `JOURNAL.md` for the reasoning behind these choices and how the work was
split with an AI coding agent.
