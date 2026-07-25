import express from "express";
import cors from "cors";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { nanoid } from "nanoid";
import db from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const app = express();
app.use(cors()); // widget must be embeddable on arbitrary third-party sites
app.use(express.json());
app.use("/uploads", express.static(UPLOAD_DIR));
// Serve the embeddable widget script itself, so a third-party page can just
// point a <script> tag at this API origin — no separate static host needed.
app.get("/widget.js", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "widget", "widget.js"));
});

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).slice(0, 10);
      cb(null, `${nanoid()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype);
    cb(ok ? null : new Error("Only JPEG, PNG, WEBP or GIF photos are allowed."), ok);
  },
});

const dedupeKey = (email, body) =>
  crypto.createHash("sha256").update(`${email.trim().toLowerCase()}::${body.trim().toLowerCase()}`).digest("hex");

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

function localAnalysis(body, rating) {
  const text = body.toLowerCase();
  const positiveWords = ["great", "easy", "love", "helped", "excellent", "amazing", "fast", "smooth", "happy"];
  const negativeWords = ["bad", "hard", "slow", "confusing", "poor", "broken", "frustrating", "unhappy"];
  const positiveHits = positiveWords.filter((word) => text.includes(word)).length;
  const negativeHits = negativeWords.filter((word) => text.includes(word)).length;
  const sentiment = rating >= 4 || positiveHits > negativeHits ? "positive" : rating <= 2 || negativeHits > positiveHits ? "negative" : "neutral";
  const tags = [
    text.includes("support") ? "support" : null,
    text.includes("easy") || text.includes("simple") ? "ease-of-use" : null,
    text.includes("fast") || text.includes("quick") ? "speed" : null,
    text.includes("team") ? "team" : null,
  ].filter(Boolean);

  return {
    sentiment,
    summary: body.length > 140 ? `${body.slice(0, 137).trim()}...` : body,
    tags: tags.length ? tags : [sentiment],
    source: "local",
  };
}

async function geminiAnalysis(body, rating) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return localAnalysis(body, rating);

  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const prompt = `Analyze this customer testimonial for a business owner.
Return only JSON with this shape:
{"sentiment":"positive|neutral|negative","summary":"one short sentence","tags":["tag one","tag two","tag three"]}

Rating: ${rating}/5
Testimonial: ${body}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );

  if (!response.ok) throw new Error("AI analysis failed.");
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const jsonText = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  const parsed = JSON.parse(jsonText);

  return {
    sentiment: ["positive", "neutral", "negative"].includes(parsed.sentiment) ? parsed.sentiment : "neutral",
    summary: String(parsed.summary || "").slice(0, 180),
    tags: Array.isArray(parsed.tags) ? parsed.tags.map((tag) => String(tag).slice(0, 28)).slice(0, 4) : [],
    source: "gemini",
  };
}

// --- Public: submit a testimonial -----------------------------------------
app.post("/api/testimonials", upload.single("photo"), (req, res) => {
  const { name, email, company, body, rating } = req.body;

  const errors = [];
  if (!name?.trim()) errors.push("Name is required.");
  if (!email?.trim() || !isEmail(email.trim())) errors.push("A valid email is required.");
  if (!body?.trim()) errors.push("Testimonial text is required.");
  if (body?.trim().length > 2000) errors.push("Testimonial text must be under 2000 characters.");
  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) errors.push("Rating must be 1-5 stars.");

  if (errors.length) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(400).json({ errors });
  }

  const key = dedupeKey(email, body);
  const existing = db.prepare("SELECT id FROM testimonials WHERE dedupe_key = ?").get(key);
  if (existing) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(409).json({ errors: ["It looks like you've already submitted this testimonial."] });
  }

  const id = nanoid();
  db.prepare(
    `INSERT INTO testimonials (id, name, email, company, body, rating, photo_path, status, dedupe_key)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
  ).run(id, name.trim(), email.trim(), company?.trim() || null, body.trim(), ratingNum, req.file ? `/uploads/${req.file.filename}` : null, key);

  const row = db.prepare("SELECT * FROM testimonials WHERE id = ?").get(id);
  res.status(201).json(row);
});

// --- Dashboard: list testimonials (any status) -----------------------------
app.get("/api/testimonials", (req, res) => {
  const status = req.query.status && req.query.status !== "all" ? req.query.status : null;
  const rows = status
    ? db.prepare("SELECT * FROM testimonials WHERE status = ? ORDER BY created_at DESC").all(status)
    : db.prepare("SELECT * FROM testimonials ORDER BY created_at DESC").all();
  res.json(rows);
});

// --- Dashboard: approve / reject --------------------------------------------
app.patch("/api/testimonials/:id", (req, res) => {
  const { status } = req.body;
  if (!["approved", "rejected", "pending"].includes(status)) {
    return res.status(400).json({ errors: ["status must be approved, rejected, or pending."] });
  }
  const result = db
    .prepare("UPDATE testimonials SET status = ?, decided_at = datetime('now') WHERE id = ?")
    .run(status, req.params.id);
  if (result.changes === 0) return res.status(404).json({ errors: ["Testimonial not found."] });
  res.json(db.prepare("SELECT * FROM testimonials WHERE id = ?").get(req.params.id));
});

// --- Dashboard: AI-assisted summary / sentiment ----------------------------
app.post("/api/testimonials/:id/analyze", async (req, res, next) => {
  try {
    const row = db.prepare("SELECT body, rating FROM testimonials WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ errors: ["Testimonial not found."] });
    const analysis = await geminiAnalysis(row.body, row.rating);
    res.json(analysis);
  } catch (err) {
    next(err);
  }
});

// --- Public wall / widget: approved only, paginated -------------------------
app.get("/api/testimonials/approved", (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 9));
  const offset = (page - 1) * limit;

  const total = db.prepare("SELECT COUNT(*) c FROM testimonials WHERE status = 'approved'").get().c;
  const rows = db
    .prepare("SELECT id, name, company, body, rating, photo_path, created_at FROM testimonials WHERE status = 'approved' ORDER BY created_at DESC LIMIT ? OFFSET ?")
    .all(limit, offset);

  res.json({ items: rows, page, limit, total, hasMore: offset + rows.length < total });
});

app.use((err, req, res, next) => {
  res.status(400).json({ errors: [err.message || "Something went wrong."] });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Testimonial API listening on http://localhost:${PORT}`));
