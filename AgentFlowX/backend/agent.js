require("dotenv").config();
const { query } = require("./db");
const { createClient, createInvoice, sendEmail, scheduleReminder } = require("./functions");
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
// FUNCTION DEFINITIONS
// ==============================
const FUNCTION_DEFINITIONS = [
  {
    name: "create_client",
    description: "Create a client with name and email",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" }
      },
      required: ["name"]
    }
  },
  {
    name: "create_invoice",
    description: "Create invoice for a client",
    parameters: {
      type: "object",
      properties: {
        clientId: { type: "number" },
        amount: { type: "number" }
      },
      required: ["clientId", "amount"]
    }
  }
];

// ==============================
// AUDIT LOG (POSTGRES)
// ==============================
async function addAudit(userId, action, payload) {
  await query(
    `INSERT INTO audit_logs (user_id, action, payload)
     VALUES ($1,$2,$3)`,
    [userId, action, payload]
  );
}

// ==============================
// MAIN AGENT
// ==============================
async function runAgent(userId, userCommand) {
  try {
    const model = client.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const response = await model.generateContent(`
You are an AI assistant for a business dashboard.

If a function is required, respond ONLY in JSON:
{
  "type": "function",
  "name": "function_name",
  "args": {}
}

Otherwise:
{
  "type": "text",
  "message": "plain response"
}

User command:
${userCommand}

Available functions:
${JSON.stringify(FUNCTION_DEFINITIONS, null, 2)}
`);

    const text = response.response.text();
    const parsed = JSON.parse(text);

    if (parsed.type === "text") {
      return { ok: true, message: parsed.message };
    }

    if (parsed.type === "function") {
      const fn = FUNCTION_MAP[parsed.name];
      if (!fn) return { ok: false, error: "unknown_function" };

      const result = await fn(parsed.args, userId);
      await addAudit(userId, parsed.name, parsed.args);

      return { ok: true, function: parsed.name, result };
    }

    return { ok: false, error: "invalid_ai_response" };
  } catch (err) {
    console.error("runAgent error:", err);
    return { ok: false, error: err.message };
  }
}

module.exports = { runAgent };
