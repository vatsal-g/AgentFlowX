require("dotenv").config();
const cluster = require("cluster");
const os = require("os");
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const rateLimit = require("express-rate-limit");

const { register, login, verifyToken } = require("./auth");
const { runAgent, explainToday, predictPaymentRisk } = require("./agent");
const { query, pool } = require("./db");

const PORT = process.env.PORT || 8080;

/* ======================================================
   🧠 CLUSTER MODE (MULTI-CORE SCALING)
====================================================== */
if (cluster.isPrimary) {
  const cpuCount = os.cpus().length;
  console.log(`🚀 Master PID ${process.pid}`);
  console.log(`⚙️ Forking ${cpuCount} workers`);

  for (let i = 0; i < cpuCount; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.error(`❌ Worker ${worker.process.pid} crashed. Restarting...`);
    cluster.fork();
  });

  return;
}

/* ======================================================
   🟢 WORKER PROCESS
====================================================== */
const app = express();
app.use(cors());
app.use(express.json());

/* ======================================================
   🛑 RATE LIMITERS
====================================================== */

// Login/Register protection
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "Too many auth requests" },
});

// General API protection
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "Too many requests" },
});

app.use("/api", apiLimiter);

/* ======================================================
   ✅ 1️⃣ AUTH API (PUBLIC)
====================================================== */
app.post("/api/auth/register", authLimiter, register);
app.post("/api/auth/login", authLimiter, login);

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
    res.status(500).json({ ok: false, error: "Agent failed" });
  }
});

/* ======================================================
   ✅ 3️⃣ USER PROFILE
====================================================== */
app.get("/api/users/me", verifyToken, async (req, res) => {
  const user = await query("SELECT * FROM users WHERE id=$1", [req.user.id]);
  res.json(user.rows[0]);
});

/* ======================================================
   ✅ 4️⃣ CLIENT / CRM
====================================================== */
app.post("/api/clients", verifyToken, async (req, res) => {
  const { name, email, metadata } = req.body;
  const result = await query(
    `INSERT INTO clients (user_id,name,email,metadata)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.user.id, name, email, metadata || {}]
  );
  res.json(result.rows[0]);
});

app.get("/api/clients", verifyToken, async (req, res) => {
  const result = await query(
    "SELECT * FROM clients WHERE user_id=$1 ORDER BY created_at DESC",
    [req.user.id]
  );
  res.json(result.rows);
});

/* ======================================================
   ✅ 5️⃣ INVOICE MANAGEMENT
====================================================== */
app.post("/api/invoices", verifyToken, async (req, res) => {
  const { clientId, amount, currency, dueAt, description, format } = req.body;
  const result = await query(
    `INSERT INTO invoices
     (user_id,client_id,amount,currency,due_at,description,format)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      req.user.id,
      clientId,
      amount,
      currency || "INR",
      dueAt,
      description || "Invoice",
      format || "standard",
    ]
  );
  res.json(result.rows[0]);
});

app.get("/api/invoices", verifyToken, async (req, res) => {
  const result = await query(
    "SELECT * FROM invoices WHERE user_id=$1 ORDER BY created_at DESC",
    [req.user.id]
  );
  res.json(result.rows);
});

/* ======================================================
   ✅ 6️⃣ DASHBOARD
====================================================== */
app.get("/api/dashboard", verifyToken, async (req, res) => {
  const [revenue, clients, invoices] = await Promise.all([
    query("SELECT COALESCE(SUM(amount),0) FROM invoices WHERE user_id=$1", [req.user.id]),
    query("SELECT COUNT(*) FROM clients WHERE user_id=$1", [req.user.id]),
    query("SELECT COUNT(*) FROM invoices WHERE user_id=$1", [req.user.id]),
  ]);

  res.json({
    totalRevenue: revenue.rows[0].coalesce,
    totalClients: Number(clients.rows[0].count),
    totalInvoices: Number(invoices.rows[0].count),
  });
});

/* ======================================================
   ✅ 7️⃣ PAYMENT RISK + EXPLAIN
====================================================== */
app.get("/api/payment-risk", verifyToken, async (req, res) => {
  res.json(await predictPaymentRisk(req.user.id));
});

app.get("/api/explain", verifyToken, async (req, res) => {
  res.json(await explainToday(req.user.id));
});

/* ======================================================
   ⏰ REMINDER CRON
====================================================== */
cron.schedule("* * * * *", async () => {
  const due = await query(
    "SELECT * FROM reminders WHERE done=false AND remind_at <= NOW()"
  );
  for (const r of due.rows) {
    console.log("⏰ Reminder:", r.message);
    await query("UPDATE reminders SET done=true WHERE id=$1", [r.id]);
  }
});

/* ======================================================
   🛑 GRACEFUL SHUTDOWN
====================================================== */
const server = app.listen(PORT, () => {
  console.log(`🔥 Worker ${process.pid} listening on ${PORT}`);
});

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

async function shutdown() {
  console.log(`🛑 Worker ${process.pid} shutting down...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
