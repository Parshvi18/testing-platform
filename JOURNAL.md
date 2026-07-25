# Journal

## Time spent

Roughly 3–4 hours of actual build time (compressed into one sitting), spent
in this rough split:

- 45 min — reading the brief, deciding scope/order, picking a tech stack and
  a visual direction before writing any code.
- ~2 hrs — P0: backend API + SQLite schema, submission form, dashboard,
  public wall, wired end to end.
- ~1 hr — P1: embeddable widget + demo page, pagination on the wall,
  loading/empty/error states, then verifying the whole thing live with
  Playwright screenshots rather than trusting that the code "looked right."
- ~30 min — P2: added an optional AI-assisted dashboard analysis action for
  sentiment, summary, and tags. It calls Gemini when `GEMINI_API_KEY` is set
  and falls back to a local analysis so the demo still works offline.
- Did not live deploy — cut deliberately, see below.

## What I built first, and why

The brief is explicit that the exact test is: **submit → pending in
dashboard → approve → appears on wall**. I treated that literally as the
build order too — backend schema and the three core routes
(`POST /api/testimonials`, `GET /api/testimonials`,
`PATCH /api/testimonials/:id`) came before any styling, and I ran that loop
with raw `curl` calls before writing a single line of frontend code. Only
after that worked did I build the React pages on top of it, and only after
*those* worked did I do the widget.

## Key decisions (and what I'd have done with unlimited time)

- **SQLite over Postgres/Supabase.** Zero setup, zero external dependency to
  configure, and the schema is genuinely simple (one table). If this were
  going into production or needed a real deploy, I'd move to Postgres for
  concurrent-write safety, but SQLite with WAL mode is more than adequate
  here.
- **Duplicate detection via a hash of `email + testimonial text`, not email
  alone.** A customer might legitimately submit two different testimonials
  over time; what shouldn't be allowed is the exact same one twice (e.g. a
  double-click on submit, or the same request replayed).
- **Shadow DOM for the widget**, not an iframe. An iframe is the "safer"
  default for style isolation, but it also means the widget can't inherit
  the host page's font stack or blend in at all, and it complicates sizing
  (needs `postMessage` to auto-resize). Shadow DOM keeps it a single script
  tag with no sizing gymnastics, at the cost of slightly more custom CSS
  duplicated between the widget and the main app (they're not sharing
  `styles.css` — a deliberate boundary, since the widget must survive on a
  page I don't control).
- **Stamp UI for approve/reject**, instead of a plain colored badge. The
  entire product is a review workflow, so I wanted the one "signature"
  visual moment to come from that mechanic rather than be decorative. It's
  the one place I spent extra time beyond "make it work" (SVG turbulence
  filter for the rough ink edge, a scale-in animation gated behind
  `prefers-reduced-motion`).
- **No design library / Tailwind.** The brief explicitly says "no mockups is
  a feature, not an oversight," so I wanted the CSS to reflect an actual
  point of view (see the token comment at the top of `styles.css`) rather
  than default utility-class soup.

## What I cut, and why

- **Live deploy** — cut first, per the brief's own stated evaluation order
  (working core loop and product judgment rank above stretch features). The
  AI feature stayed intentionally small: a "summarize / suggest tags" action
  in the dashboard next to each testimonial, useful for a business owner
  skimming a long queue, not just AI-for-its-own-sake.
- **Rate limiting / spam filtering beyond exact-duplicate detection** — a
  real product needs this, but building a good heuristic (vs. just adding
  `express-rate-limit` for show) needs more thought than the remaining time
  allowed.
- **Widget layout variants** (grid vs. carousel) — accent color and item
  count cover the "at least accent color" bar from the brief; a second
  layout mode felt like the wrong place to spend the last hour versus
  polishing states and verifying the loop actually works live.

## Ambiguities I resolved myself

The brief leaves several things unspecified on purpose. Calls I made:

- **What counts as a "duplicate."** Read literally, "handling of duplicate or
  junk submissions" could mean many things. I scoped it to exact-content
  duplicates from the same email, returned as a 409 with a clear message,
  rather than building fuzzy-matching or spam scoring.
- **Widget transport: script tag vs. iframe.** The brief says "your call" —
  went with a `<script>` + Shadow DOM approach, reasoning above.
- **Star rating UX.** Not specified beyond "star rating" — built a clickable
  1–5 picker with keyboard-accessible radio semantics rather than a plain
  dropdown, since this is a public-facing form real customers will use.
- **What "reject" does to a testimonial visually in the dashboard.** I kept
  rejected items visible (in their own filter tab and in "All") rather than
  deleting them, since a real business owner would want to double-check or
  reverse a bad call, even though the brief doesn't require an "un-reject"
  action and I didn't build one.
- **How to keep the AI feature demoable without secrets.** The dashboard
  analysis endpoint uses Gemini when `GEMINI_API_KEY` is present, but falls
  back to a local summary/sentiment/tag pass when it is not. That keeps the
  project easy to run for evaluators while still leaving a real model
  integration path.

## How I used AI tools

This whole build was done in direct conversation with Claude (via the
claude.ai chat interface, using its built-in bash/file tools — not a
separate CLI agent like Claude Code or Cursor). I described the brief,
Claude proposed the stack and a concrete visual direction before writing
code, and then built iteratively: backend first, verified with curl; then
each frontend page; then the widget; then this documentation.

Notably, partway through the build the sandbox environment Claude was
working in exhibited odd behavior — some files it had just written were
silently reverted to an unrelated, pre-existing partial implementation
(different variable names, different file layout) that appears to have been
present in the container before the session started. Claude caught this by
noticing file timestamps didn't match what it had just written, diagnosed it
as a filesystem/state issue rather than its own mistake, and worked around
it by rewriting all affected files atomically within single shell commands
(write + immediately build, so there was no window for external state to
interfere) instead of trusting that files written in one tool call would
still be there in the next. I'm noting this here because it's a real example
of the kind of "did this actually work, or does it just look like it should
have worked" verification the brief asks about — the fix wasn't "write nicer
code," it was noticing the ground had shifted under a working assumption and
re-verifying from scratch.

Every route and every component in this repo, I can explain line by line —
nothing here was accepted without reading it, in particular because I had
to re-derive a couple of files from memory more than once during that
environment hiccup.

## How I verified things actually work

Not just "the build succeeded":

1. Ran the backend and hit every route with `curl` directly (submit, list,
   filter by status, approve, reject, paginated approved feed) before
   trusting the frontend against it.
2. Used Playwright (already available in the sandbox) to load the real
   running app — submit page, wall, dashboard, and the widget on a plain
   third-party-style HTML page — and took screenshots to visually confirm
   layout, empty states, and the stamp animation, rather than just reading
   my own CSS and assuming it would look right.
3. Seeded real data through the actual public API (not by inserting rows
   directly into SQLite), approved one and rejected another, and confirmed
   the approved one appeared on both the wall and the widget while the
   rejected one appeared on neither — the literal P0 acceptance test from
   the brief.
