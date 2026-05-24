console.log("server.js is running");

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const dashboardRoutes = require("./dashboard.routes");
const invoiceRoutes = require("./invoice.routes"); 

const { runAgent } = require("./agent");

const app = express(); // ← create app first

/* =========================
   MIDDLEWARE
========================= */

app.use(cors());
app.use(bodyParser.json());

/* =========================
   ROUTES
========================= */

app.use("/api", dashboardRoutes);
app.use("/api/invoices", invoiceRoutes);

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`, req.body || {});
  next();
});

/* =========================
   HEALTH CHECK
========================= */

app.get("/ping", (req, res) => {
  res.json({ ok: true });
});

/* =========================
   AGENT API
========================= */

app.post("/api/agent", async (req, res) => {
  try {
    const { userId, command } = req.body;

    if (!userId || !command) {
      return res.status(400).json({
        ok: false,
        error: "missing_userId_or_command",
      });
    }

    const result = await runAgent(userId, command);

    res.json(result);

  } catch (err) {
    console.error("API Error:", err);

    res.status(500).json({
      ok: false,
      error: "internal_server_error",
    });
  }
});

/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 3001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🔥 Server running on http://127.0.0.1:${PORT}`);
});