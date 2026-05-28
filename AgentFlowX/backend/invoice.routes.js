const express = require("express")
const router = express.Router()
const { verifyToken } = require("./auth");
const db = require("./db")

/* GET invoices */

router.get("/", async (req, res) => {
  try {

    const result = await db.query(`
      SELECT *
      FROM invoices
      ORDER BY created_at DESC
    `)

    res.json({
      ok: true,
      data: result.rows
    })

  } catch (err) {

    console.error(err)

    res.status(500).json({
      ok: false,
      error: "failed_to_load_invoices"
    })
  }
})

/* CREATE invoice */

router.post("/", async (req, res) => {
  try {

    const { clientId, amount } = req.body

    const result = await db.query(
      `
      INSERT INTO invoices
      (client_id, amount)

      VALUES ($1,$2)

      RETURNING *
      `,
      [clientId, amount]
    )

    res.json({
      ok: true,
      data: result.rows[0]
    })

  } catch (err) {

    console.error(err)

    res.status(500).json({
      ok: false,
      error: "failed_to_create_invoice"
    })
  }
})

module.exports = router