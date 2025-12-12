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
   ✅ 1️⃣ AUTH API
====================================================== */
app.post("/api/auth/register", register);
app.post("/api/auth/login", login);

/* ======================================================
   ✅ 2️⃣ AI VOICE/TEXT COMMAND API
====================================================== */
app.post("/api/agent", async (req, res) => {
  try {
    const { userId, command } = req.body;
    const result = await runAgent(userId, command);
    res.json(result);
  } catch (err) {
    console.error("Agent Error:", err);
    res.status(500).json({ error: "Agent processing failed" });
  }
});

/* ======================================================
   ✅ 3️⃣ USER API (SELF-LEARNING MEMORY)
====================================================== */
app.post("/api/users", async (req, res) => {
  const { name, email } = req.body;
  const user = await query(
    "INSERT INTO users(name,email) VALUES($1,$2) RETURNING *",
    [name, email]
  );
  res.json(user.rows[0]);
});

app.get("/api/users/:id", async (req, res) => {
  const user = await query("SELECT * FROM users WHERE id=$1", [
    req.params.id,
  ]);
  res.json(user.rows[0]);
});

/* ======================================================
   ✅ 4️⃣ CONTACT / CLIENT CRM
====================================================== */
app.post("/api/clients", async (req, res) => {
  const { userId, name, email, metadata } = req.body;

  const result = await query(
    `INSERT INTO clients(user_id,name,email,metadata)
     VALUES($1,$2,$3,$4) RETURNING *`,
    [userId, name, email, metadata]
  );

  res.json(result.rows[0]);
});

app.get("/api/clients/user/:userId", async (req, res) => {
  const result = await query("SELECT * FROM clients WHERE user_id=$1", [
    req.params.userId,
  ]);
  res.json(result.rows);
});

/* ======================================================
   ✅ 5️⃣ INVOICE MANAGEMENT
====================================================== */
app.post("/api/invoices", async (req, res) => {
  const {
    userId,
    clientId,
    amount,
    currency,
    dueAt,
    description,
    format,
  } = req.body;

  const result = await query(
    `INSERT INTO invoices(user_id,client_id,amount,currency,due_at,description,format)
     VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [userId, clientId, amount, currency, dueAt, description, format]
  );

  res.json(result.rows[0]);
});

app.get("/api/invoices/user/:userId", async (req, res) => {
  const result = await query("SELECT * FROM invoices WHERE user_id=$1", [
    req.params.userId,
  ]);
  res.json(result.rows);
});

/* ======================================================
   ✅ 6️⃣ DASHBOARD ANALYTICS
====================================================== */
app.get("/api/dashboard/:userId", async (req, res) => {
  const revenue = await query(
    "SELECT COALESCE(SUM(amount),0) AS total FROM invoices WHERE user_id=$1",
    [req.params.userId]
  );
  const clients = await query(
    "SELECT COUNT(*) AS count FROM clients WHERE user_id=$1",
    [req.params.userId]
  );
  const invoices = await query(
    "SELECT COUNT(*) AS count FROM invoices WHERE user_id=$1",
    [req.params.userId]
  );

  res.json({
    totalRevenue: revenue.rows[0].total,
    totalClients: clients.rows[0].count,
    totalInvoices: invoices.rows[0].count,
  });
});

/* ======================================================
   ✅ 7️⃣ AUDIT LOG API
====================================================== */
app.get("/api/audit/:userId", async (req, res) => {
  const logs = await query(
    "SELECT * FROM audit_logs WHERE user_id=$1 ORDER BY created_at DESC",
    [req.params.userId]
  );
  res.json(logs.rows);
});

/* ======================================================
   ✅ 8️⃣ SELF-LEARNING PREFERENCES API
====================================================== */
app.put("/api/preferences/:userId", async (req, res) => {
  const {
    preferred_reminder_delay,
    preferred_email_tone,
    preferred_invoice_format,
  } = req.body;

  const update = await query(
    `UPDATE users SET 
       preferred_reminder_delay=$1,
       preferred_email_tone=$2,
       preferred_invoice_format=$3
     WHERE id=$4 RETURNING *`,
    [
      preferred_reminder_delay,
      preferred_email_tone,
      preferred_invoice_format,
      req.params.userId,
    ]
  );

  res.json(update.rows[0]);
});

/* ======================================================
   ✅ 9️⃣ PAYMENT RISK PREDICTION
====================================================== */
app.get("/api/payment-risk/:userId", async (req, res) => {
  const result = await predictPaymentRisk(req.params.userId);
  res.json(result);
});

/* ======================================================
   ✅ 🔟 AI “EXPLAIN MY DAY”
====================================================== */
app.get("/api/explain/:userId", async (req, res) => {
  const result = await explainToday(req.params.userId);
  res.json(result);
});

/* ======================================================
   ✅ 1️⃣1️⃣ REMINDER CRON AUTOMATION
====================================================== */
cron.schedule("* * * * *", async () => {
  const due = await query(
    `SELECT * FROM reminders 
       WHERE done=false AND remind_at <= NOW()`
  );

  for (let r of due.rows) {
    console.log("⏰ Reminder Fired:", r.message);
    await query("UPDATE reminders SET done=true WHERE id=$1", [r.id]);
  }
});

/* ======================================================
   🚀 START SERVER
====================================================== */
app.listen(PORT, () => {
  console.log(`AgentFlowX Backend LIVE on port ${PORT}`);
});
