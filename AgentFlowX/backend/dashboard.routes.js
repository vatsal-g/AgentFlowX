const express = require("express");
const { query } = require("./db");
const router = express.Router();

/* =========================
   GET DASHBOARD SUMMARY
========================= */
router.get("/dashboard", async (req, res) => {
  try {
    const clients = await query(`SELECT COUNT(*) FROM clients`);
    const invoices = await query(`SELECT COUNT(*) FROM invoices`);
    const revenue = await query(
      `SELECT COALESCE(SUM(amount),0) AS total FROM invoices`
    );

    res.json({
      ok: true,
      data: {
        totalClients: Number(clients.rows[0].count),
        totalInvoices: Number(invoices.rows[0].count),
        totalRevenue: Number(revenue.rows[0].total),
      },
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ ok: false });
  }
});

/* =========================
   GET CLIENTS
========================= */
router.get("/clients", async (req, res) => {
  try {
    const result = await query(`SELECT * FROM clients ORDER BY id DESC`);
    res.json({ ok: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false });
  }
});
/* =========================
   ADD CLIENT
========================= */
router.post("/clients", async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        ok: false,
        error: "name_and_email_required"
      });
    }

    const result = await query(
      `
      INSERT INTO clients (name, email)
      VALUES ($1, $2)
      RETURNING *
      `,
      [name, email]
    );

    res.status(201).json({
      ok: true,
      data: result.rows[0]
    });

  } catch (err) {
    console.error("Create client error:", err);

    res.status(500).json({
      ok: false,
      error: "failed_to_create_client"
    });
  }
});

/* =========================
   GET ANOMALIES
========================= */
router.get("/anomalies", async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM anomalies ORDER BY created_at DESC`
    );
    res.json({ ok: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false });
  }
});

module.exports = router;
