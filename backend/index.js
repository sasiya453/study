import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { init, run, get, all } from "./db.js";
import { gradeFromLabel, sm2Next } from "./sm2.js";

const app = express();
const PORT = process.env.PORT || 4000;

await init();

app.use(express.json());

const corsOrigin = process.env.CORS_ORIGIN?.split(",").map(s => s.trim());
app.use(
  cors({
    origin: corsOrigin || true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Auth helpers
function signToken(userId) {
  return jwt.sign({ uid: userId }, process.env.JWT_SECRET || "dev_secret", {
    expiresIn: "7d"
  });
}
function authRequired(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    req.userId = payload.uid;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Routes
app.get("/", (req, res) => {
  res.json({ ok: true, service: "srs-backend" });
});

// Auth
app.post("/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password || password.length < 6) {
      return res.status(400).json({ error: "Email and 6+ char password required" });
    }
    const hash = await bcrypt.hash(password, 10);
    await run(`INSERT INTO users (email, password_hash) VALUES (?, ?)`, [email, hash]);
    const user = await get(`SELECT id, email FROM users WHERE email = ?`, [email]);
    const token = signToken(user.id);
    res.json({ token, user });
  } catch (e) {
    if (String(e).includes("UNIQUE")) {
      return res.status(409).json({ error: "Email already registered" });
    }
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await get(`SELECT * FROM users WHERE email = ?`, [email]);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    const token = signToken(user.id);
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch {
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/me", authRequired, async (req, res) => {
  const user = await get(`SELECT id, email FROM users WHERE id = ?`, [req.userId]);
  res.json({ user });
});

// Decks
app.get("/decks", authRequired, async (req, res) => {
  const decks = await all(`SELECT * FROM decks WHERE user_id = ? ORDER BY id DESC`, [req.userId]);
  res.json({ decks });
});

app.post("/decks", authRequired, async (req, res) => {
  const { name, description } = req.body || {};
  if (!name) return res.status(400).json({ error: "Name required" });
  const r = await run(`INSERT INTO decks (user_id, name, description) VALUES (?, ?, ?)`, [
    req.userId,
    name,
    description || null
  ]);
  const deck = await get(`SELECT * FROM decks WHERE id = ?`, [r.lastID]);
  res.json({ deck });
});

app.get("/decks/:id", authRequired, async (req, res) => {
  const deck = await get(`SELECT * FROM decks WHERE id = ? AND user_id = ?`, [req.params.id, req.userId]);
  if (!deck) return res.status(404).json({ error: "Deck not found" });
  res.json({ deck });
});

app.put("/decks/:id", authRequired, async (req, res) => {
  const { name, description } = req.body || {};
  const deck = await get(`SELECT * FROM decks WHERE id = ? AND user_id = ?`, [req.params.id, req.userId]);
  if (!deck) return res.status(404).json({ error: "Deck not found" });
  await run(`UPDATE decks SET name = ?, description = ? WHERE id = ?`, [
    name || deck.name,
    description ?? deck.description,
    deck.id
  ]);
  const updated = await get(`SELECT * FROM decks WHERE id = ?`, [deck.id]);
  res.json({ deck: updated });
});

app.delete("/decks/:id", authRequired, async (req, res) => {
  await run(`DELETE FROM decks WHERE id = ? AND user_id = ?`, [req.params.id, req.userId]);
  res.json({ ok: true });
});

// Cards
app.get("/decks/:deckId/cards", authRequired, async (req, res) => {
  const deck = await get(`SELECT * FROM decks WHERE id = ? AND user_id = ?`, [req.params.deckId, req.userId]);
  if (!deck) return res.status(404).json({ error: "Deck not found" });
  const cards = await all(`SELECT * FROM cards WHERE deck_id = ? ORDER BY id DESC`, [deck.id]);
  res.json({ cards, deck });
});

app.post("/decks/:deckId/cards", authRequired, async (req, res) => {
  const deck = await get(`SELECT * FROM decks WHERE id = ? AND user_id = ?`, [req.params.deckId, req.userId]);
  if (!deck) return res.status(404).json({ error: "Deck not found" });
  const { question, answer } = req.body || {};
  if (!question || !answer) return res.status(400).json({ error: "Question and answer required" });
  const r = await run(
    `INSERT INTO cards (deck_id, question, answer) VALUES (?, ?, ?)`,
    [deck.id, question, answer]
  );
  const card = await get(`SELECT * FROM cards WHERE id = ?`, [r.lastID]);
  res.json({ card });
});

app.put("/cards/:id", authRequired, async (req, res) => {
  const card = await get(
    `SELECT c.* FROM cards c JOIN decks d ON c.deck_id=d.id WHERE c.id = ? AND d.user_id = ?`,
    [req.params.id, req.userId]
  );
  if (!card) return res.status(404).json({ error: "Card not found" });
  const { question, answer } = req.body || {};
  await run(`UPDATE cards SET question = ?, answer = ? WHERE id = ?`, [
    question || card.question,
    answer || card.answer,
    card.id
  ]);
  const updated = await get(`SELECT * FROM cards WHERE id = ?`, [card.id]);
  res.json({ card: updated });
});

app.delete("/cards/:id", authRequired, async (req, res) => {
  await run(
    `DELETE FROM cards WHERE id = ? AND deck_id IN (SELECT id FROM decks WHERE user_id = ?)`,
    [req.params.id, req.userId]
  );
  res.json({ ok: true });
});

// Reviews: due list + submit
app.get("/reviews/due", authRequired, async (req, res) => {
  const now = Date.now();
  const { deckId, limit = 20 } = req.query;
  let rows;
  if (deckId && deckId !== "all") {
    const deck = await get(`SELECT * FROM decks WHERE id = ? AND user_id = ?`, [deckId, req.userId]);
    if (!deck) return res.status(404).json({ error: "Deck not found" });
    rows = await all(
      `SELECT c.* FROM cards c WHERE c.deck_id = ? AND c.due_at <= ? ORDER BY c.due_at ASC LIMIT ?`,
      [deckId, now, Number(limit)]
    );
  } else {
    rows = await all(
      `SELECT c.* FROM cards c JOIN decks d ON c.deck_id=d.id
       WHERE d.user_id = ? AND c.due_at <= ? ORDER BY c.due_at ASC LIMIT ?`,
      [req.userId, now, Number(limit)]
    );
  }
  res.json({ cards: rows });
});

app.post("/reviews", authRequired, async (req, res) => {
  const { cardId, gradeLabel } = req.body || {};
  if (!cardId || !gradeLabel) return res.status(400).json({ error: "cardId and gradeLabel required" });
  const card = await get(
    `SELECT c.* FROM cards c JOIN decks d ON c.deck_id=d.id WHERE c.id = ? AND d.user_id = ?`,
    [cardId, req.userId]
  );
  if (!card) return res.status(404).json({ error: "Card not found" });
  const grade = gradeFromLabel(gradeLabel);
  const next = sm2Next(card, grade);
  await run(
    `UPDATE cards SET ef = ?, interval = ?, repetitions = ?, due_at = ? WHERE id = ?`,
    [next.ef, next.interval, next.repetitions, next.dueAt, card.id]
  );
  await run(`INSERT INTO reviews (card_id, user_id, grade) VALUES (?, ?, ?)`, [card.id, req.userId, grade]);
  const updated = await get(`SELECT * FROM cards WHERE id = ?`, [card.id]);
  res.json({ card: updated });
});

// Stats
app.get("/stats", authRequired, async (req, res) => {
  const now = Date.now();
  const msDay = 24 * 60 * 60 * 1000;
  const startOfToday = Math.floor(now / msDay) * msDay;
  const endOfToday = startOfToday + msDay - 1;
  const sevenDays = now + 7 * msDay;

  const totalCards = await get(
    `SELECT COUNT(*) as c FROM cards c JOIN decks d ON c.deck_id=d.id WHERE d.user_id = ?`,
    [req.userId]
  );
  const dueToday = await get(
    `SELECT COUNT(*) as c FROM cards c JOIN decks d ON c.deck_id=d.id WHERE d.user_id = ? AND c.due_at <= ?`,
    [req.userId, endOfToday]
  );
  const next7 = await get(
    `SELECT COUNT(*) as c FROM cards c JOIN decks d ON c.deck_id=d.id
     WHERE d.user_id = ? AND c.due_at > ? AND c.due_at <= ?`,
    [req.userId, endOfToday, sevenDays]
  );
  const todayReviews = await get(
    `SELECT COUNT(*) as total,
            SUM(CASE WHEN grade >= 3 THEN 1 ELSE 0 END) as passed
     FROM reviews WHERE user_id = ? AND created_at >= ?`,
    [req.userId, startOfToday]
  );
  const reviewedToday = todayReviews.total || 0;
  const successRate =
    reviewedToday > 0 ? Math.round(((todayReviews.passed || 0) / reviewedToday) * 100) : 0;

  res.json({
    totalCards: totalCards.c || 0,
    dueToday: dueToday.c || 0,
    next7Days: next7.c || 0,
    reviewedToday,
    successRate
  });
});

app.listen(PORT, () => {
  console.log(`Backend listening on :${PORT}`);
});