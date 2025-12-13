require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");

const { register, login, verifyToken } = require("./auth");
const { runAgent, explainToday, predictPaymentRisk } = require("./agent");
const { query } = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

/* ======================================================
   ✅ 1️⃣ AUTH API (PUBLIC)
====================================================== */
app.post("/api/auth/register", register);
app.post("/api/auth/login", login);

/* ======================================================
   ✅ 2️⃣ AI AGENT API (PROTECTED)
====================================================== */
app.post("/api/agent", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { command } = req.body;

    const result = await runAgent(userId, command);
    res.json(result);
  } catch (err) {
    console.error("Agent Error:", err);
    res.status(500).json({ ok: false, error: "Agent processing failed" });
  }
});

/* ======================================================
   ✅ 3️⃣ USER PROFILE
====================================================== */
app.get("/api/users/me", verifyToken, async (req, res) => {
  const userId = req.user.id;
  const result = await query("SELECT * FROM users WHERE id=$1", [userId]);
  res.json(result.rows[0]);
});

/* ======================================================
   ✅ 4️⃣ CLIENT / CRM
====================================================== */
app.post("/api/clients", verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { name, email, metadata } = req.body;

  const result = await query(
    `INSERT INTO clients (user_id, name, email, metadata)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, name, email, metadata || {}]
  );

  res.json(result.rows[0]);
});

app.get("/api/clients", verifyToken, async (req, res) => {
  const userId = req.user.id;

  const result = await query(
    "SELECT * FROM clients WHERE user_id=$1 ORDER BY created_at DESC",
    [userId]
  );

  res.json(result.rows);
});

/* ======================================================
   ✅ 5️⃣ INVOICE MANAGEMENT
====================================================== */
app.post("/api/invoices", verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { clientId, amount, currency, dueAt, description, format } = req.body;

  const result = await query(
    `INSERT INTO invoices
     (user_id, client_id, amount, currency, due_at, description, format)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      userId,
      clientId,
      amount,
      currency || "INR",
      dueAt,
      description || "Invoice",
      format || "standard"
    ]
  );

  res.json(result.rows[0]);
});

app.get("/api/invoices", verifyToken, async (req, res) => {
  const userId = req.user.id;

  const result = await query(
    "SELECT * FROM invoices WHERE user_id=$1 ORDER BY created_at DESC",
    [userId]
  );

  res.json(result.rows);
});

/* ======================================================
   ✅ 6️⃣ DASHBOARD ANALYTICS
====================================================== */
app.get("/api/dashboard", verifyToken, async (req, res) => {
  const userId = req.user.id;

  const revenue = await query(
    "SELECT COALESCE(SUM(amount),0) AS total FROM invoices WHERE user_id=$1",
    [userId]
  );

  const clients = await query(
    "SELECT COUNT(*) FROM clients WHERE user_id=$1",
    [userId]
  );

  const invoices = await query(
    "SELECT COUNT(*) FROM invoices WHERE user_id=$1",
    [userId]
  );

  res.json({
    totalRevenue: revenue.rows[0].total,
    totalClients: Number(clients.rows[0].count),
    totalInvoices: Number(invoices.rows[0].count),
  });
});

/* ======================================================
   ✅ 7️⃣ AUDIT LOGS
====================================================== */
app.get("/api/audit", verifyToken, async (req, res) => {
  const userId = req.user.id;

  const logs = await query(
    "SELECT * FROM audit_logs WHERE user_id=$1 ORDER BY created_at DESC",
    [userId]
  );

  res.json(logs.rows);
});

/* ======================================================
   ✅ 8️⃣ USER PREFERENCES
====================================================== */
app.put("/api/preferences", verifyToken, async (req, res) => {
  const userId = req.user.id;
  const {
    preferred_reminder_delay,
    preferred_email_tone,
    preferred_invoice_format,
  } = req.body;

  const result = await query(
    `UPDATE users SET
      preferred_reminder_delay=$1,
      preferred_email_tone=$2,
      preferred_invoice_format=$3
     WHERE id=$4
     RETURNING *`,
    [
      preferred_reminder_delay,
      preferred_email_tone,
      preferred_invoice_format,
      userId
    ]
  );

  res.json(result.rows[0]);
});

/* ======================================================
   ✅ 9️⃣ PAYMENT RISK AI
====================================================== */
app.get("/api/payment-risk", verifyToken, async (req, res) => {
  const userId = req.user.id;
  const result = await predictPaymentRisk(userId);
  res.json(result);
});

/* ======================================================
   ✅ 🔟 AI "EXPLAIN MY DAY"
====================================================== */
app.get("/api/explain", verifyToken, async (req, res) => {
  const userId = req.user.id;
  const result = await explainToday(userId);
  res.json(result);
});

/* ======================================================
   ✅ 1️⃣1️⃣ REMINDER CRON (AUTOMATION)
====================================================== */
cron.schedule("* * * * *", async () => {
  const due = await query(
    `SELECT * FROM reminders
     WHERE done=false AND remind_at <= NOW()`
  );

  for (const r of due.rows) {
    console.log("⏰ Reminder Fired:", r.message);
    await query("UPDATE reminders SET done=true WHERE id=$1", [r.id]);
  }
});

/* ======================================================
   🚀 START SERVER
====================================================== */
app.listen(PORT, () => {
  console.log(`🚀 AgentFlowX Backend LIVE on port ${PORT}`);
});
