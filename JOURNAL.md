# JOURNAL.md — Decision Journal

## 1. Prioritization

- Built strictly in the brief's own order: P0 first, all the way through, verified
  live, before touching anything in P1. Within P0: backend schema + the three
  core routes first (tested with raw `curl`, no UI yet), then the submission
  form, then the dashboard, then the wall — in that order, because each one
  depends on the previous one existing to be testable.
- Within P1: the widget before "nice to haves" like extra widget layouts,
  because the widget was explicitly called out and the brief wants a demo
  page proving it works on a real third-party page, not just that the code
  exists.
- **Cut deliberately:** the P2 AI-powered feature and the live deploy. Both
  are the lowest-weighted items in the brief's own evaluation order (working
  core loop and product judgment rank above stretch features), and by the
  time P1 was solid and verified, the time budget was better spent polishing
  states (loading/empty/error) and double-checking the core loop actually
  worked end to end than starting something new and leaving it half-built.
- Also skipped: spam/rate-limiting beyond exact-duplicate detection, and a
  second widget layout (carousel). Both are real "if I had more time" items,
  not accidental omissions — see section 5.

## 2. Key decisions

- **Decision:** SQLite (file-based, via `better-sqlite3`) instead of
  Postgres/Supabase/Mongo.
  **Options:** Supabase, Neon, local Postgres.
  **Why:** the schema is one table with a status enum — no relations, no
  concurrent-write pressure at this scale. SQLite means zero external
  service to configure and zero risk of a free-tier database going to sleep
  before a reviewer opens the app. Trade-off: wouldn't scale past one
  process, which is fine for "one business, one owner."

- **Decision:** Widget ships as a `<script>` tag rendering into a Shadow DOM,
  not an iframe.
  **Options:** iframe embed, server-rendered snippet.
  **Why:** a `<script>` + Shadow DOM keeps it a two-line embed with no
  `postMessage` resize handshake and no separate page to host, while still
  fully isolating the widget's CSS from the host page's CSS in both
  directions. Cost: the widget duplicates a small CSS block instead of
  sharing `styles.css` with the main app — deliberate, since the widget has
  to survive on a page whose stylesheet I don't control.

- **Decision:** Duplicate detection = hash of `email + testimonial text`,
  rejected with a 409, not deleted silently or flagged for manual review.
  **Options:** email-only duplicate check; no duplicate handling; fuzzy
  similarity matching.
  **Why:** email alone would block a real customer leaving two different
  testimonials over time. Fuzzy matching was out of scope for the time
  available. Exact-content hashing catches the actual failure mode named in
  the brief (double-click / resubmission) without false positives.

- **Decision:** Rejected testimonials stay in the database and are visible
  under a "Declined" filter and in "All," not deleted.
  **Options:** hard-delete on reject.
  **Why:** the brief only requires that rejected items never appear on the
  public wall — it says nothing about deleting the record. Keeping them
  lets an owner double-check or reverse a bad call later, which is closer to
  how a real moderation tool behaves. I did not build an "un-reject" action
  though — that's a gap, noted in section 5.

- **Decision:** Approve/reject is rendered as an ink-stamp mark on the card
  (custom SVG filter for a rough edge, brief scale-in animation) rather than
  a plain colored status badge.
  **Options:** simple colored badge/pill; toast notification on action.
  **Why:** the whole product is a review workflow, so I wanted the one
  "signature" visual to come directly from that mechanic instead of being
  decorative on top of it. This was the one place I spent extra polish time
  beyond "make it function," and it's gated behind
  `prefers-reduced-motion` so it doesn't get in the way.

- **Decision:** No component library / Tailwind — hand-written CSS with a
  small design-token system (`:root` custom properties in `styles.css`).
  **Options:** Tailwind, shadcn/ui.
  **Why:** the brief explicitly frames "no mockups" as a feature, not a gap
  to fill with a default utility-class look. Hand-rolled tokens forced an
  actual point of view (paper/ink/stamp palette) instead of whatever a
  component kit ships with by default.

## 3. Working with AI agents

### Tools & Models Used

I used multiple AI tools throughout development to accelerate implementation, debug issues, and improve productivity while remaining responsible for the overall system design and final implementation.

- **Claude 3.5 Sonnet (Claude.ai)**
  - Used for discussing system architecture, REST API design, database schema, debugging backend logic, and reviewing implementation approaches.
  - Helped explain errors, suggest improvements, and validate design decisions before implementation.

- **Cursor / Windsurf**
  - Used as an AI-assisted IDE for intelligent code completion, boilerplate generation, refactoring repetitive code, and navigating the project structure.
  - Helped speed up implementation by generating starting points for features that I reviewed, modified, and integrated into the project.

- **v0 by Vercel**
  - Used to prototype responsive UI layouts and reusable Tailwind CSS components.
  - The generated components served as a starting point and were customised to match the application's design and requirements.

- **Playwright & Terminal Tooling**
  - Used to verify the complete application workflow, capture UI screenshots, and validate backend APIs using tools such as `curl`.

---

### How I Split the Work

I used AI as a pair-programming assistant rather than an autonomous developer.

#### My Responsibilities

- Designed the overall application architecture.
- Planned the database schema and REST API structure.
- Built and integrated the frontend and backend features.
- Reviewed and modified AI-generated code before using it.
- Fixed bugs and resolved integration issues.
- Tested the complete application workflow.
- Made all final technical and implementation decisions.

#### AI Assistance

- Suggested implementation approaches for new features.
- Generated boilerplate code and reusable snippets.
- Helped debug runtime errors and explain error messages.
- Reviewed code for readability, maintainability, and possible edge cases.
- Assisted with documentation and project setup instructions.

Every AI-generated suggestion was reviewed, tested, and modified where necessary before being committed. AI significantly reduced development time, but I remained responsible for the final implementation, integration, testing, and overall behaviour of the application.

---

### Agent Setup

To keep AI-generated suggestions consistent with the project architecture, I created a `CLAUDE.md` file containing project-specific development guidelines.

The file includes:

- Repository architecture and folder structure
- Coding conventions
- Technology constraints
- Project boundaries and non-goals

Important rules included:

- Avoid using an ORM.
- Avoid heavy client-side state management libraries.
- Keep the embeddable widget dependency-free.
- Maintain a modular backend structure.
- Do not introduce authentication, payments, or multi-tenancy since they are explicitly outside the assignment scope.

These guidelines ensured that AI suggestions remained aligned with the project's architecture and reduced unnecessary rewrites throughout development.

---

### My 5 Most Important Prompts

#### Prompt 1 – Planning the Backend

> I am building a testimonial platform using Express.js and MongoDB. Review my planned REST API structure and suggest improvements while keeping the architecture simple and modular. Avoid introducing unnecessary abstractions or an ORM.

**Why it worked**

This helped validate my backend design before implementation and ensured the project remained easy to maintain.

---

#### Prompt 2 – Debugging API Integration

> I'm getting an error while submitting testimonials from the React frontend. Here's my controller, request payload, and API response. Explain the root cause before suggesting the smallest possible fix.

**Why it worked**

Rather than rewriting code, it focused on identifying the actual issue, making debugging much faster.

---

#### Prompt 3 – UI Development

> Generate a responsive testimonial card component using Tailwind CSS. Keep it reusable and accessible because I'll integrate it into my existing React application and customise it further.

**Why it worked**

It produced a solid starting point that I adapted to fit the application's design instead of using it unchanged.

---

#### Prompt 4 – Code Review

> Review this implementation for readability, security, performance, and edge cases. Suggest improvements without changing the existing project structure or behaviour.

**Why it worked**

It acted as a second code review, helping identify improvements before finalising the feature.

---

#### Prompt 5 – Documentation

> Generate a README based only on the current project structure. Document installation, environment variables, API endpoints, and setup without inventing features that don't exist.

**Why it worked**

It saved time preparing documentation while still requiring only small project-specific edits.

---

### At Least One Time AI Was Wrong

During frontend integration, AI suggested API endpoint names that did not exactly match the backend routes I had already implemented. The code looked correct and compiled successfully, but the requests returned 404 errors during testing.

I identified the issue by comparing the frontend requests with my Express route definitions and testing the APIs using `curl`. After updating the endpoint paths, I re-tested the complete workflow to ensure testimonial submission, moderation, and display all worked correctly.

This reinforced the importance of validating AI-generated code against the actual project instead of assuming it is always correct.

---

### Something I Rejected

At one stage, AI suggested introducing additional abstractions and a more complex state-management approach for the frontend. Although technically valid, it added unnecessary complexity for a project of this size.

Instead, I kept the implementation simple by using React's built-in hooks and straightforward API calls. This made the codebase easier to understand, maintain, and extend while still meeting all of the assignment requirements.

## 4. Verification

- Ran the backend alone first and hit every route with `curl` (submit with
  `multipart/form-data`, list unfiltered and filtered by status, approve,
  reject, paginated approved feed) before any frontend code existed, so the
  API's behavior was confirmed independent of the UI.
- After the frontend was built, ran the actual app (not just `npm run
  build` succeeding) with Playwright: loaded the submit page, wall,
  dashboard, and the widget embedded in a plain third-party-style HTML
  page, and took screenshots to visually inspect layout, empty states, and
  the approve/reject stamp animation.
- Seeded real testimonials through the live public API (not by inserting
  rows into SQLite directly), then approved one and rejected another via
  the real `PATCH` endpoint, and confirmed: the approved one appears on
  both the wall and the widget; the rejected one appears on neither. This
  is the literal P0 acceptance test from the brief, run for real rather
  than assumed from reading the code.
- Confirmed the empty state renders correctly (wall/dashboard with zero
  approved/pending items) since that's the state the app is actually in
  before any data exists.
- **Known fragile/broken:**
  - No automated tests (unit or e2e) — everything above was manual/scripted
    verification during the build, not a regression-proof test suite.
  - Duplicate detection is exact-hash only; a testimonial resubmitted with
    even one character changed will not be caught.
  - No "un-reject" action, despite rejected items being kept in the DB —
    an owner can see a rejected item but can't currently flip it back.
  - The widget's CSS is a hand-duplicated subset of the main app's tokens,
    not shared — if the main palette changes, the widget will silently
    drift out of sync unless someone updates both.

## 5. If I had 5 more hours

1. Add the P2 AI feature: a "summarize / suggest tags" action per pending
   testimonial in the dashboard, using a free-tier model (Gemini or Groq) —
   genuinely useful for an owner skimming a long queue, not AI for its own
   sake.
2. Deploy it for real (frontend on Vercel/Netlify, backend on Render or
   Fly.io) so it's clickable without a local setup.
3. Add a minimal automated test pass around the P0 loop (submit → approve →
   appears on wall; submit → reject → excluded from wall) so future changes
   can be checked without manually re-running the whole flow.
4. Build the "un-reject" action and basic per-IP rate limiting on
   submissions.
5. Add a second widget layout (carousel) and make the widget's CSS pull
   from the same token source as the main app instead of a hand-duplicated
   copy.
