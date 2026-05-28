const express = require("express");
const router = express.Router();

const { verifyToken } = require("./auth");
const db = require("./db");

/* =========================
   GET INVOICES
========================= */

router.get("/", verifyToken, async (req, res) => {
  try {

    const result = await db.query(
      `
      SELECT *
      FROM invoices
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [req.user.id]
    );

    res.json({
      ok: true,
      data: result.rows
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      ok: false,
      error: "failed_to_load_invoices"
    });
  }
});

/* =========================
   CREATE INVOICE
========================= */

router.post("/", verifyToken, async (req, res) => {
  try {

    const { clientId, amount } = req.body;

    const result = await db.query(
      `
      INSERT INTO invoices
      (client_id, amount, user_id)

      VALUES ($1, $2, $3)

      RETURNING *
      `,
      [
        clientId,
        amount,
        req.user.id
      ]
    );

    res.json({
      ok: true,
      data: result.rows[0]
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      ok: false,
      error: "failed_to_create_invoice"
    });
  }
});

module.exports = router;