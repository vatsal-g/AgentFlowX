const express = require("express");
const { query } = require("./db");

const router = express.Router();

const { verifyToken } = require("./auth");

/* =========================
   GET DASHBOARD SUMMARY
========================= */

router.get(
  "/dashboard",
  verifyToken,
  async (req, res) => {

    try {

      const userId = req.user.id;

      const clients = await query(
        `
        SELECT COUNT(*)
        FROM clients
        WHERE user_id = $1
        `,
        [userId]
      );

      const invoices = await query(
        `
        SELECT COUNT(*)
        FROM invoices
        WHERE user_id = $1
        `,
        [userId]
      );

      const revenue = await query(
        `
        SELECT COALESCE(SUM(amount),0) AS total
        FROM invoices
        WHERE user_id = $1
        `,
        [userId]
      );

      res.json({
        ok: true,
        data: {
          totalClients:
            Number(clients.rows[0].count),

          totalInvoices:
            Number(invoices.rows[0].count),

          totalRevenue:
            Number(revenue.rows[0].total),
        },
      });

    } catch (err) {

      console.error(
        "Dashboard error:",
        err
      );

      res.status(500).json({
        ok: false
      });

    }

  }
);

/* =========================
   GET CLIENTS
========================= */

router.get(
  "/clients",
  verifyToken,
  async (req, res) => {

    try {

      const result = await query(
        `
        SELECT *
        FROM clients
        WHERE user_id = $1
        ORDER BY id DESC
        `,
        [req.user.id]
      );

      res.json({
        ok: true,
        data: result.rows
      });

    } catch (err) {

      console.error(
        "Get clients error:",
        err
      );

      res.status(500).json({
        ok: false
      });

    }

  }
);

/* =========================
   ADD CLIENT
========================= */

router.post(
  "/clients",
  verifyToken,
  async (req, res) => {

    try {

      const {
        name,
        email
      } = req.body;

      if (!name || !email) {

        return res.status(400).json({
          ok: false,
          error:
            "name_and_email_required"
        });

      }

      const result = await query(
        `
        INSERT INTO clients
        (
          name,
          email,
          user_id
        )

        VALUES
        (
          $1,
          $2,
          $3
        )

        RETURNING *
        `,
        [
          name,
          email,
          req.user.id
        ]
      );

      res.status(201).json({
        ok: true,
        data: result.rows[0]
      });

    } catch (err) {

      console.error(
        "Create client error:",
        err
      );

      res.status(500).json({
        ok: false,
        error:
          "failed_to_create_client"
      });

    }

  }
);

/* =========================
   GET ANOMALIES
========================= */

router.get(
  "/anomalies",
  verifyToken,
  async (req, res) => {

    try {

      const result = await query(
        `
        SELECT *
        FROM anomalies
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

      console.error(
        "Get anomalies error:",
        err
      );

      res.status(500).json({
        ok: false
      });

    }

  }
);

module.exports = router;