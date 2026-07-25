# CLAUDE.md

Steering notes for any AI coding agent (Claude Code, Cursor, etc.) working in
this repo. Committed on purpose, per the assignment brief — this is the real
context I gave myself while building it.

## Project shape

- `backend/` — Express + `better-sqlite3`. One table (`testimonials`),
  status is the whole state machine (`pending | approved | rejected`).
  No auth. No ORM — raw `better-sqlite3` prepared statements, because the
  query surface is tiny and an ORM would be pure overhead here.
- `frontend/` — React + Vite + React Router. No global state
  library — each page owns its own fetch/loading/error state with
  `useState`/`useEffect`. Don't introduce Redux/Zustand/etc. for this scope.
- `widget/` — vanilla JS, **must stay dependency-free** and framework-free.
  It is served as a static file and dropped into arbitrary third-party
  pages; it can never assume React, a bundler, or any global is present.

## Conventions

- Styling is plain CSS with design tokens in `frontend/src/styles.css`
  (`:root` custom properties). No Tailwind, no CSS-in-JS, no component
  library. If you add a component, reuse existing tokens
  (`--ink`, `--paper`, `--stamp-red`, etc.) rather than hardcoding colors.
- The API is the single source of truth for validation. Client-side
  validation in `SubmitPage.jsx` is a UX nicety (fail fast, don't round-trip
  for an empty field) — it must never be the *only* place a rule is
  enforced. Mirror any new validation rule in `backend/server.js` too.
- Every list-fetching page (`WallPage`, `DashboardPage`) needs explicit
  loading, empty, and error states — this was called out in the brief and
  is graded on. Don't add a new data-fetching view without all three.
- IDs are `nanoid()`, not auto-increment integers — keep it that way so IDs
  are never guessable/enumerable from the public wall or widget.

## Things NOT to add (per the assignment's explicit non-goals)

Do not add authentication, login, payments, multi-business/multi-tenant
support, roles/permissions, or email notifications, even if it looks like a
natural next step. These are explicitly out of scope for this exercise —
adding them is not "going above and beyond," it's solving a different
problem than the one asked.

## Workflow expectations

- Before adding a new route or page, check whether the P0 loop (submit →
  pending → approve → wall) still passes with real `curl`/browser
  round-trips, not just "it builds." A green build is not verification.
- If you touch `widget/widget.js`, re-test it against `widget/demo.html`
  specifically — it runs in a Shadow DOM with its own copy of styles, so a
  change to `frontend/src/styles.css` does **not** propagate to it, and
  that's intentional (see JOURNAL.md for why).
- When in doubt about scope, re-read the P0/P1/P2 split in the original
  brief before building — P0 always wins if time is short.
