// backend/functions.js
const crypto = require("crypto");
const { pool } = require("./db"); // PostgreSQL pool
const nodemailer = require("nodemailer");

// ==============================
// ✅ CREATE CLIENT (PostgreSQL)
// ==============================
async function createClient({ name, email, metadata }, userId) {
  const res = await pool.query(
    `INSERT INTO clients (id, user_id, name, email, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [crypto.randomUUID(), userId, name, email, metadata || {}]
  );

  return { ok: true, client: res.rows[0] };
}

// ==============================
// ✅ CREATE INVOICE (PostgreSQL)
// ==============================
async function createInvoice(
  { clientId, amount, currency = "INR", dueInDays = 7, description, format },
  userId
) {
  const dueAt = new Date(Date.now() + dueInDays * 86400000);

  const res = await pool.query(
    `INSERT INTO invoices 
     (id, user_id, client_id, amount, currency, description, format, due_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [
      crypto.randomUUID(),
      userId,
      clientId,
      amount,
      currency,
      description || "Invoice",
      format || "standard",
      dueAt
    ]
  );

  return { ok: true, invoice: res.rows[0] };
}

// ==============================
// ✅ EMAIL TRANSPORTER
// ==============================
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  return transporter;
}

// ==============================
// ✅ SEND EMAIL
// ==============================
async function sendEmail({ to, subject, text, html }) {
  const t = getTransporter();

  const info = await t.sendMail({
    from: process.env.FROM_EMAIL,
    to,
    subject,
    text,
    html
  });

  return { ok: true, info };
}

// ==============================
// ✅ SCHEDULE REMINDER (PostgreSQL)
// ==============================
async function scheduleReminder({ clientId, message, remindInDays }, userId) {
  const remindAt = new Date(Date.now() + remindInDays * 86400000);

  const res = await pool.query(
    `INSERT INTO reminders 
     (id, user_id, client_id, message, remind_at)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [crypto.randomUUID(), userId, clientId, message, remindAt]
  );

  return { ok: true, reminder: res.rows[0] };
}

// ==============================
// ⚡ ADD AUDIT LOG
// ==============================
async function addAudit(userId, action, payload) {
  await pool.query(
    `INSERT INTO audit_logs (id, user_id, action, payload)
     VALUES ($1,$2,$3,$4)`,
    [crypto.randomUUID(), userId, action, payload]
  );
}

// ==============================
// 🔥 EXPORTS
// ==============================
module.exports = {
  createClient,
  createInvoice,
  sendEmail,
  scheduleReminder,
  addAudit
};