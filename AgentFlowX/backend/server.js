require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const dashboardRoutes = require("./dashboard.routes");
const invoiceRoutes = require("./invoice.routes");
const { runAgent } = require("./agent");
const auth = require("./auth");

const app = express();

/* =========================
   MIDDLEWARE
========================= */

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://agentflowx-frontend.onrender.com"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(bodyParser.json());

/* =========================
   ROUTES
========================= */

app.use("/api", dashboardRoutes);
app.use("/api/invoices", invoiceRoutes);

app.post("/api/auth/register", auth.register);
app.post("/api/auth/login", auth.login);

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
  console.log(`🔥 Server running on port ${PORT}`);
});