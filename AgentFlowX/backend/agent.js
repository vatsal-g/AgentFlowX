// backend/agent.js
require("dotenv").config();
const { createClient, createInvoice, sendEmail, scheduleReminder } = require("../backend/functions");
const { db } = require("./db");

const { GoogleGenerativeAI } = require("@google/generative-ai");
const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ==============================
// FUNCTION MAP
// ==============================
const FUNCTION_MAP = {
  create_client: createClient,
  create_invoice: createInvoice,
  send_email: sendEmail,
  schedule_reminder: scheduleReminder
};

// ==============================
// FUNCTION DEFINITIONS (SCHEMA)
// ==============================
const FUNCTION_DEFINITIONS = [
  {
    name: "create_client",
    description: "Create a client in the CRM with name and email",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        metadata: { type: "object" }
      },
      required: ["name"]
    }
  },
  {
    name: "create_invoice",
    description: "Create invoice for a client id with amount and options",
    parameters: {
      type: "object",
      properties: {
        clientId: { type: "string" },
        amount: { type: "number" },
        currency: { type: "string" },
        dueInDays: { type: "number" },
        description: { type: "string" },
        format: { type: "string" }
      },
      required: ["clientId", "amount"]
    }
  },
  {
    name: "send_email",
    description: "Send an email",
    parameters: {
      type: "object",
      properties: {
        to: { type: "string" },
        subject: { type: "string" },
        text: { type: "string" },
        html: { type: "string" }
      },
      required: ["to", "subject"]
    }
  },
  {
    name: "schedule_reminder",
    description: "Schedule a reminder for a client",
    parameters: {
      type: "object",
      properties: {
        clientId: { type: "string" },
        message: { type: "string" },
        remindInDays: { type: "number" }
      },
      required: ["clientId", "message", "remindInDays"]
    }
  }
];

// ==============================
// DB SAFETY INITIALIZER
// ==============================
async function ensureDB() {
  await db.read();
  db.data = db.data || {};
  db.data.audit = db.data.audit || {};
  db.data.preferences = db.data.preferences || {};
  db.data.invoices = db.data.invoices || {};
}

// ==============================
// AUDIT LOGGING
// ==============================
async function addAudit(userId, action, payload = {}) {
  await ensureDB();
  if (!db.data.audit[userId]) db.data.audit[userId] = [];

  db.data.audit[userId].push({
    action,
    payload: JSON.stringify(payload).slice(0, 2000),
    time: new Date().toISOString()
  });

  await db.write();
}

// ==============================
// SELF-LEARNING MEMORY
// ==============================
async function learnUserPreference(userId, key, value) {
  await ensureDB();
  if (!db.data.preferences[userId]) db.data.preferences[userId] = {};

  db.data.preferences[userId][key] = value;
  await db.write();
}

// ==============================
// PROMPT BUILDER WITH MEMORY
// ==============================
async function buildPrompt(userId, userCommand) {
  await ensureDB();
  const prefs = db.data.preferences[userId] || {};

  const preferenceSummary = `
User preferences:
- preferred_reminder_delay: ${prefs.preferred_reminder_delay || "3 days"}
- preferred_email_tone: ${prefs.preferred_email_tone || "professional"}
- preferred_invoice_format: ${prefs.preferred_invoice_format || "standard"}
`;

  const user = `${preferenceSummary}\nUser command: ${userCommand}`;
  return user;
}

// ==============================
// ✅✅✅ MAIN AGENT RUNNER (REAL GEMINI SUPPORT)
// ==============================
async function runAgent(userId, userCommand) {
  try {
    await ensureDB();
    const prompt = await buildPrompt(userId, userCommand);

    const model = client.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const response = await model.generateContent(`
You are an AI that ONLY replies in JSON.
If a function is needed, reply exactly like this:

{
  "type": "function",
  "name": "function_name",
  "args": { }
}

Otherwise reply:

{
  "type": "text",
  "message": "your normal message"
}

User request:
${prompt}

Available functions:
${JSON.stringify(FUNCTION_DEFINITIONS, null, 2)}
`);

    const text = response.response.text();
    const parsed = JSON.parse(text);

    // ✅ NORMAL TEXT
    if (parsed.type === "text") {
      return { ok: true, assistant: parsed.message };
    }

    // ✅ FUNCTION EXECUTION
    if (parsed.type === "function") {
      const { name, args } = parsed;

      if (!FUNCTION_MAP[name]) {
        return { ok: false, error: "Unknown function" };
      }

      const result = await FUNCTION_MAP[name](args, userId);

      // ✅ Audit
      await addAudit(userId, name, args);

      // ✅ Memory learning
      if (name === "schedule_reminder" && args.remindInDays) {
        await learnUserPreference(userId, "preferred_reminder_delay", args.remindInDays);
      }

      if (name === "create_invoice" && args.format) {
        await learnUserPreference(userId, "preferred_invoice_format", args.format);
      }

      return { ok: true, function: name, result };
    }

    return { ok: false, error: "Invalid AI response format" };

  } catch (err) {
    console.error("runAgent error:", err);
    return { ok: false, error: String(err.message || err) };
  }
}

// ==============================
// EXPLAIN TODAY MODE
// ==============================
async function explainToday(userId) {
  await ensureDB();
  const logs = db.data.audit?.[userId] || [];
  const today = new Date().toISOString().split("T")[0];

  const todayLogs = logs.filter(l => l.time.startsWith(today));

  return {
    totalActions: todayLogs.length,
    actions: todayLogs.map(l => l.action)
  };
}

// ==============================
// PAYMENT RISK AI
// ==============================
async function predictPaymentRisk(userId) {
  await ensureDB();
  const invoices = db.data.invoices?.[userId] || [];
  if (invoices.length === 0) return [];

  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
Analyze these invoices and return risky clients only as JSON:

${JSON.stringify(invoices)}

Format:
[{ "clientId": "...", "riskLevel": "HIGH", "reason": "..." }]
`;

  const response = await model.generateContent(prompt);
  const text = response.response.text();

  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, error: "parse_error", raw: text };
  }
}

// ==============================
// ✅ EXPORTS
// ==============================
module.exports = {
  runAgent,
  explainToday,
  predictPaymentRisk
};
