const { query } = require("./db");

// ==============================
// CREATE CLIENT
// ==============================
async function createClient(args, userId) {
  const { name, email } = args;

  const result = await query(
    `INSERT INTO clients (user_id, name, email)
     VALUES ($1,$2,$3)
     RETURNING *`,
    [userId, name, email || null]
  );

  return result.rows[0];
}

// ==============================
// CREATE INVOICE
// ==============================
async function createInvoice(args, userId) {
  const { clientId, amount } = args;

  const result = await query(
    `INSERT INTO invoices (user_id, client_id, amount)
     VALUES ($1,$2,$3)
     RETURNING *`,
    [userId, clientId, amount]
  );

  return result.rows[0];
}

// ==============================
// SEND EMAIL (MOCK / EXTENDABLE)
// ==============================
async function sendEmail(args) {
  return {
    status: "sent",
    to: args.to,
    subject: args.subject
  };
}

// ==============================
// SCHEDULE REMINDER (DB)
// ==============================
async function scheduleReminder(args, userId) {
  const { clientId, message, remindInDays } = args;

  const result = await query(
    `INSERT INTO reminders (user_id, client_id, message, remind_at)
     VALUES ($1,$2,$3, NOW() + ($4 || ' days')::INTERVAL)
     RETURNING *`,
    [userId, clientId, message, remindInDays]
  );

  return result.rows[0];
}

module.exports = {
  createClient,
  createInvoice,
  sendEmail,
  scheduleReminder
};
