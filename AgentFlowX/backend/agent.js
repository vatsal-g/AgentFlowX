require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");
const { query } = require("./db");

console.log("Gemini key present:", !!process.env.GEMINI_API_KEY);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/* ==============================
   AVAILABLE FUNCTIONS
============================== */
async function createClient({ name, email }, userId) {
  const result = await query(
    `INSERT INTO clients (user_id, name, email)
     VALUES ($1,$2,$3)
     RETURNING *`,
    [userId, name, email || null]
  );
  return result.rows[0];
}

async function createInvoice({ clientId, amount }, userId) {
  const result = await query(
    `INSERT INTO invoices (user_id, client_id, amount)
     VALUES ($1,$2,$3)
     RETURNING *`,
    [userId, clientId, amount]
  );
  return result.rows[0];
}

const FUNCTION_MAP = {
  create_client: createClient,
  create_invoice: createInvoice,
};

/* ==============================
   MAIN AGENT
============================== */
async function runAgent(userId, userCommand) {
  try {
    const response = await ai.models.generateContent({
      model: "models/gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: userCommand }],
        },
      ],
      tools: [
        {
          functionDeclarations: [
            {
              name: "create_client",
              description: "Create a new client",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                },
                required: ["name"],
              },
            },
            {
              name: "create_invoice",
              description: "Create an invoice for a client",
              parameters: {
                type: "object",
                properties: {
                  clientId: { type: "number" },
                  amount: { type: "number" },
                },
                required: ["clientId", "amount"],
              },
            },
          ],
        },
      ],
    });

    const candidate = response.candidates[0];

    // 🔹 NORMAL TEXT RESPONSE
    if (!candidate.content.parts[0].functionCall) {
      return {
        ok: true,
        message: candidate.content.parts[0].text,
      };
    }

    // 🔹 FUNCTION CALL
    const { name, args } = candidate.content.parts[0].functionCall;
    const fn = FUNCTION_MAP[name];

    if (!fn) {
      return { ok: false, error: "Unknown function" };
    }

    const result = await fn(args, userId);

    return {
      ok: true,
      function: name,
      result,
    };
  } catch (err) {
    console.error("runAgent error:", err);
    return { ok: false, error: err.message };
  }
}

module.exports = { runAgent };
